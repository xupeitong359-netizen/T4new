import { Router } from 'express';
import { db, DBDiplomaticRequest } from '../db';
import { requireAuth, AuthRequest } from '../auth';

export const diplomacyRouter = Router();

const DIPLOMACY_TYPE_NAMES: Record<string, string> = {
  peace: '和平条约',
  mutual_defense: '共同防御与互保条约',
  armistice: '停战协定',
  military_access: '军事通行权',
  war: '宣战令',
};

// Send diplomatic request or declare war
diplomacyRouter.post('/send', requireAuth, (req: AuthRequest, res) => {
  try {
    const user = req.user!;
    const { targetNationId, type, note } = req.body;

    // 1. Verify user owns a nation
    const myNation = db.findNationByOwnerId(user.id);
    if (!myNation) {
      return res.status(400).json({ error: '您尚未宣告属于自己的国家，无法发起任何外交或军事行动！' });
    }

    if (!targetNationId || targetNationId === myNation.id) {
      return res.status(400).json({ error: '不能向自己的国家发起外交申请或宣战' });
    }

    const targetNation = db.findNationById(targetNationId);
    if (!targetNation) {
      return res.status(404).json({ error: '目标国家不存在或已解散' });
    }

    if (!['peace', 'mutual_defense', 'armistice', 'military_access', 'war'].includes(type)) {
      return res.status(400).json({ error: '无效的外交申请类型' });
    }

    // 2. Handle War declaration (Unilateral, becomes active immediately)
    if (type === 'war') {
      // Check if already in active war
      const existingWar = db.getDiplomaticRequests().find(
        (r) =>
          r.type === 'war' &&
          r.status === 'active' &&
          ((r.senderNationId === myNation.id && r.receiverNationId === targetNation.id) ||
            (r.senderNationId === targetNation.id && r.receiverNationId === myNation.id))
      );

      if (existingWar) {
        return res.status(400).json({ error: `【${myNation.name}】与【${targetNation.name}】当前已处于战争状态！` });
      }

      // Automatically terminate any existing peace or mutual defense treaties between them
      const treaties = db.getDiplomaticRequests().filter(
        (r) =>
          r.status === 'accepted' &&
          ((r.senderNationId === myNation.id && r.receiverNationId === targetNation.id) ||
            (r.senderNationId === targetNation.id && r.receiverNationId === myNation.id))
      );
      treaties.forEach((t) => {
        db.updateDiplomaticRequest(t.id, { status: 'terminated' });
      });

      const warReq: DBDiplomaticRequest = {
        id: 'war_' + Math.random().toString(36).substring(2, 11),
        senderNationId: myNation.id,
        senderNationName: myNation.name,
        senderOwnerId: user.id,
        senderOwnerName: user.username,
        receiverNationId: targetNation.id,
        receiverNationName: targetNation.name,
        receiverOwnerId: targetNation.ownerId,
        receiverOwnerName: targetNation.ownerUsername,
        type: 'war',
        status: 'active',
        note: note ? note.trim() : `【${myNation.name}】正式对【${targetNation.name}】下达宣战通牒！`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      db.createDiplomaticRequest(warReq);

      // War alert notification to target nation owner
      db.createNotification({
        id: 'notif_' + Math.random().toString(36).substring(2, 9),
        userId: targetNation.ownerId,
        type: 'war_alert',
        title: '⚠️ 紧急战报：敌国宣战通牒！',
        content: `【${myNation.name}】（领主：${user.username}）已正式向您的国家【${targetNation.name}】宣战！地缘关系已转入全面战争状态！${note ? ` 宣战理由：${note}` : ''}`,
        relatedNationId: myNation.id,
        relatedNationName: myNation.name,
        relatedRequestId: warReq.id,
        isRead: false,
        createdAt: new Date().toISOString(),
      });

      // Notification to sender confirming war
      db.createNotification({
        id: 'notif_' + Math.random().toString(36).substring(2, 9),
        userId: user.id,
        type: 'war_alert',
        title: '战报确认：国家已进入战争状态',
        content: `您已成功对【${targetNation.name}】宣战，全军已进入一级战备状态！`,
        relatedNationId: targetNation.id,
        relatedNationName: targetNation.name,
        relatedRequestId: warReq.id,
        isRead: false,
        createdAt: new Date().toISOString(),
      });

      return res.status(201).json({
        message: `已向【${targetNation.name}】正式宣战！`,
        request: warReq,
      });
    }

    // 3. Handle Armistice request (Must be in active war)
    if (type === 'armistice') {
      const existingWar = db.getDiplomaticRequests().find(
        (r) =>
          r.type === 'war' &&
          r.status === 'active' &&
          ((r.senderNationId === myNation.id && r.receiverNationId === targetNation.id) ||
            (r.senderNationId === targetNation.id && r.receiverNationId === myNation.id))
      );

      if (!existingWar) {
        return res.status(400).json({ error: `两国目前并未处于战争状态，无需发起停战协定！` });
      }
    }

    // 4. Check for duplicate pending requests
    const duplicatePending = db.getDiplomaticRequests().find(
      (r) =>
        r.senderNationId === myNation.id &&
        r.receiverNationId === targetNation.id &&
        r.type === type &&
        r.status === 'pending'
    );

    if (duplicatePending) {
      return res.status(400).json({
        error: `您此前已向【${targetNation.name}】发送过一份尚未处理的【${DIPLOMACY_TYPE_NAMES[type]}】申请，请耐心等待对方领主回复。`,
      });
    }

    // 5. Check if treaty already accepted and active
    if (['peace', 'mutual_defense', 'military_access'].includes(type)) {
      const existingTreaty = db.getDiplomaticRequests().find(
        (r) =>
          r.type === type &&
          r.status === 'accepted' &&
          ((r.senderNationId === myNation.id && r.receiverNationId === targetNation.id) ||
            (r.senderNationId === targetNation.id && r.receiverNationId === myNation.id))
      );
      if (existingTreaty) {
        return res.status(400).json({
          error: `两国之间当前已存在生效中的【${DIPLOMACY_TYPE_NAMES[type]}】，无需重复签署`,
        });
      }
    }

    // 6. Create Pending Diplomatic Request
    const reqId = 'dip_' + Math.random().toString(36).substring(2, 11);
    const newReq: DBDiplomaticRequest = {
      id: reqId,
      senderNationId: myNation.id,
      senderNationName: myNation.name,
      senderOwnerId: user.id,
      senderOwnerName: user.username,
      receiverNationId: targetNation.id,
      receiverNationName: targetNation.name,
      receiverOwnerId: targetNation.ownerId,
      receiverOwnerName: targetNation.ownerUsername,
      type,
      status: 'pending',
      note: note ? note.trim() : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.createDiplomaticRequest(newReq);

    // Notify receiver
    db.createNotification({
      id: 'notif_' + Math.random().toString(36).substring(2, 9),
      userId: targetNation.ownerId,
      type: 'dip_request',
      title: `📬 收到来自【${myNation.name}】的外交申请`,
      content: `【${myNation.name}】（领主：${user.username}）向您的国家发起了【${DIPLOMACY_TYPE_NAMES[type]}】签署申请。${note ? ` 附言：${note}` : ''}`,
      relatedNationId: myNation.id,
      relatedNationName: myNation.name,
      relatedRequestId: newReq.id,
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    return res.status(201).json({
      message: `【${DIPLOMACY_TYPE_NAMES[type]}】申请已送达【${targetNation.name}】国府，请等待对方回应。`,
      request: newReq,
    });
  } catch (error: any) {
    console.error('Send diplomacy error:', error);
    return res.status(500).json({ error: '发送外交申请失败' });
  }
});

// Respond to a diplomatic request (Accept or Reject)
diplomacyRouter.post('/respond', requireAuth, (req: AuthRequest, res) => {
  try {
    const user = req.user!;
    const { requestId, action } = req.body; // action: 'accept' | 'reject'

    if (!requestId || !['accept', 'reject'].includes(action)) {
      return res.status(400).json({ error: '无效的外交回应参数' });
    }

    const request = db.findDiplomaticRequestById(requestId);
    if (!request) {
      return res.status(404).json({ error: '未找到指定的外交申请记录' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ error: `该申请此前已被处理（状态：${request.status}），无法重复操作` });
    }

    // Only receiver nation owner or admin can respond
    if (request.receiverOwnerId !== user.id && user.role !== 'admin') {
      return res.status(403).json({ error: '您不是该外交申请的受邀领主，无权处理此申请' });
    }

    const isAccept = action === 'accept';
    const newStatus = isAccept ? 'accepted' : 'rejected';

    // If accepting armistice: close active war
    if (isAccept && request.type === 'armistice') {
      const wars = db.getDiplomaticRequests().filter(
        (r) =>
          r.type === 'war' &&
          r.status === 'active' &&
          ((r.senderNationId === request.senderNationId && r.receiverNationId === request.receiverNationId) ||
            (r.senderNationId === request.receiverNationId && r.receiverNationId === request.senderNationId))
      );
      wars.forEach((w) => {
        db.updateDiplomaticRequest(w.id, { status: 'terminated' });
      });
    }

    const updated = db.updateDiplomaticRequest(requestId, { status: newStatus });

    const typeName = DIPLOMACY_TYPE_NAMES[request.type] || request.type;

    // Send notification to sender
    db.createNotification({
      id: 'notif_' + Math.random().toString(36).substring(2, 9),
      userId: request.senderOwnerId,
      type: 'dip_result',
      title: isAccept ? `🤝 外交签署成功：${typeName}` : `❌ 外交申请已被谢绝：${typeName}`,
      content: isAccept
        ? `【${request.receiverNationName}】（领主：${user.username}）已正式批准并签署了与贵国的【${typeName}】！条约已正式生效。`
        : `【${request.receiverNationName}】（领主：${user.username}）已谢绝贵国提出的【${typeName}】申请。`,
      relatedNationId: request.receiverNationId,
      relatedNationName: request.receiverNationName,
      relatedRequestId: request.id,
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    // Send notification to receiver (the current user) for confirmation
    db.createNotification({
      id: 'notif_' + Math.random().toString(36).substring(2, 9),
      userId: user.id,
      type: 'dip_result',
      title: isAccept ? `外交条约生效：${typeName}` : `已拒绝外交申请：${typeName}`,
      content: isAccept
        ? `您已代表【${request.receiverNationName}】正式签署与【${request.senderNationName}】的【${typeName}】。`
        : `您已拒绝来自【${request.senderNationName}】的【${typeName}】申请。`,
      relatedNationId: request.senderNationId,
      relatedNationName: request.senderNationName,
      relatedRequestId: request.id,
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    return res.json({
      message: isAccept ? `已同意并缔结【${typeName}】！` : `已谢绝【${typeName}】申请。`,
      request: updated,
    });
  } catch (error: any) {
    console.error('Respond diplomacy error:', error);
    return res.status(500).json({ error: '处理外交申请失败' });
  }
});

// Terminate an existing active treaty
diplomacyRouter.post('/terminate', requireAuth, (req: AuthRequest, res) => {
  try {
    const user = req.user!;
    const { requestId } = req.body;

    const request = db.findDiplomaticRequestById(requestId);
    if (!request) {
      return res.status(404).json({ error: '未找到指定条约记录' });
    }

    if (request.status !== 'accepted') {
      return res.status(400).json({ error: '只能废除当前处于生效中的条约' });
    }

    const myNation = db.findNationByOwnerId(user.id);
    if (!myNation && user.role !== 'admin') {
      return res.status(403).json({ error: '您无权操作该条约' });
    }

    const isParty =
      request.senderOwnerId === user.id ||
      request.receiverOwnerId === user.id ||
      user.role === 'admin';

    if (!isParty) {
      return res.status(403).json({ error: '您无权单方面废除此条约' });
    }

    const otherOwnerId = request.senderOwnerId === user.id ? request.receiverOwnerId : request.senderOwnerId;
    const otherNationName = request.senderOwnerId === user.id ? request.receiverNationName : request.senderNationName;
    const typeName = DIPLOMACY_TYPE_NAMES[request.type] || request.type;

    db.updateDiplomaticRequest(requestId, { status: 'terminated' });

    // Notify other party
    db.createNotification({
      id: 'notif_' + Math.random().toString(36).substring(2, 9),
      userId: otherOwnerId,
      type: 'dip_result',
      title: `条约废除通告：${typeName}`,
      content: `【${myNation?.name || '管理员'}】已单方面废除与贵国签署的【${typeName}】。`,
      relatedNationId: myNation?.id,
      relatedNationName: myNation?.name,
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    return res.json({
      message: `已成功废除与【${otherNationName}】的【${typeName}】。`,
    });
  } catch (error: any) {
    console.error('Terminate treaty error:', error);
    return res.status(500).json({ error: '废除条约失败' });
  }
});

// Get all diplomatic requests relevant to current user's nation
diplomacyRouter.get('/my-requests', requireAuth, (req: AuthRequest, res) => {
  const user = req.user!;
  const myNation = db.findNationByOwnerId(user.id);

  if (!myNation) {
    return res.json({ incoming: [], outgoing: [], activeTreaties: [], activeWars: [] });
  }

  const allReqs = db.getDiplomaticRequests();

  const incoming = allReqs.filter(
    (r) => r.receiverNationId === myNation.id && r.status === 'pending'
  );

  const outgoing = allReqs.filter(
    (r) => r.senderNationId === myNation.id && r.status === 'pending'
  );

  const activeTreaties = allReqs.filter(
    (r) =>
      r.status === 'accepted' &&
      r.type !== 'war' &&
      (r.senderNationId === myNation.id || r.receiverNationId === myNation.id)
  );

  const activeWars = allReqs.filter(
    (r) =>
      r.type === 'war' &&
      r.status === 'active' &&
      (r.senderNationId === myNation.id || r.receiverNationId === myNation.id)
  );

  return res.json({
    incoming,
    outgoing,
    activeTreaties,
    activeWars,
  });
});

// Get surrender status for a nation (Server authoritative calculation)
diplomacyRouter.get('/surrender-status/:nationId', (req, res) => {
  try {
    const { nationId } = req.params;
    const nation = db.findNationById(nationId);
    if (!nation) {
      return res.status(404).json({ error: '未找到指定国家' });
    }

    const { computeServerSurrenderProgress } = require('../surrenderEngine');
    const result = computeServerSurrenderProgress(nation);
    return res.json({ nationId, ...result });
  } catch (error: any) {
    console.error('Calculate surrender error:', error);
    return res.status(500).json({ error: '计算投降倾向失败' });
  }
});

// Occupy or liberate a province in active war (Server validated)
diplomacyRouter.post('/occupy-province', requireAuth, (req: AuthRequest, res) => {
  try {
    const user = req.user!;
    const { targetNationId, provinceName, isOccupying } = req.body;

    const myNation = db.findNationByOwnerId(user.id);
    if (!myNation && user.role !== 'admin') {
      return res.status(400).json({ error: '您尚未宣告属于自己的国家，无法执行军事占领行动' });
    }

    const targetNation = db.findNationById(targetNationId);
    if (!targetNation) {
      return res.status(404).json({ error: '目标国家不存在' });
    }

    // Verify active war exists between them (unless admin)
    if (user.role !== 'admin') {
      const isAtWar = db.getDiplomaticRequests().some(
        (r) =>
          r.type === 'war' &&
          r.status === 'active' &&
          ((r.senderNationId === myNation!.id && r.receiverNationId === targetNation.id) ||
            (r.senderNationId === targetNation.id && r.receiverNationId === myNation!.id))
      );

      if (!isAtWar) {
        return res.status(400).json({ error: '两国并未处于交战状态，无法执行军事领土占领' });
      }
    }

    const currentOccupied: string[] = targetNation.occupiedProvinces || [];
    let updatedOccupied: string[];

    if (isOccupying) {
      if (!currentOccupied.includes(provinceName)) {
        updatedOccupied = [...currentOccupied, provinceName];
      } else {
        updatedOccupied = currentOccupied;
      }
    } else {
      updatedOccupied = currentOccupied.filter((p) => p !== provinceName);
    }

    const isCapOccupied =
      provinceName.toLowerCase() === targetNation.capital?.toLowerCase()
        ? Boolean(isOccupying)
        : targetNation.capitalOccupied;

    db.updateNation(targetNation.id, {
      occupiedProvinces: updatedOccupied,
      capitalOccupied: isCapOccupied,
    });

    const updatedTargetNation = db.findNationById(targetNation.id)!;
    const { computeServerSurrenderProgress } = require('../surrenderEngine');
    const surrenderResult = computeServerSurrenderProgress(updatedTargetNation);

    let capitulated = false;
    // Check if capitulation threshold reached
    if (surrenderResult.isCapitulated && !updatedTargetNation.isCapitulated) {
      capitulated = true;
      const victor = myNation || { id: 'admin', name: '最高军事委员会', ownerId: 'admin', ownerUsername: 'admin' };
      
      // Auto terminate wars
      const activeWars = db.getDiplomaticRequests().filter(
        (r) =>
          r.type === 'war' &&
          r.status === 'active' &&
          (r.senderNationId === targetNation.id || r.receiverNationId === targetNation.id)
      );
      activeWars.forEach((w) => {
        db.updateDiplomaticRequest(w.id, { status: 'terminated' });
      });

      // Update nation to capitulated
      db.updateNation(targetNation.id, {
        isCapitulated: true,
        surrenderProgress: 100,
        capitulatedAt: new Date().toISOString(),
        capitulatedToNationId: victor.id,
        capitulatedToNationName: victor.name,
      });

      // Notification
      db.createNotification({
        id: 'notif_' + Math.random().toString(36).substring(2, 9),
        userId: targetNation.ownerId,
        type: 'war_alert',
        title: '🏴 战败通报：国家已正式达到投降阈值！',
        content: `由于国土大部沦陷与战争意志彻底瓦解，您的国家【${targetNation.name}】已达到投降阈值（100/100）并正式宣告战败！双方已转入停火结算。`,
        relatedNationId: victor.id,
        relatedNationName: victor.name,
        isRead: false,
        createdAt: new Date().toISOString(),
      });

      if (myNation) {
        db.createNotification({
          id: 'notif_' + Math.random().toString(36).substring(2, 9),
          userId: myNation.ownerId,
          type: 'war_alert',
          title: `🏆 战胜捷报：【${targetNation.name}】宣告无条件投降！`,
          content: `敌国【${targetNation.name}】投降倾向达到 100% 阈值，已无力支撑战局并正式宣告投降！`,
          relatedNationId: targetNation.id,
          relatedNationName: targetNation.name,
          isRead: false,
          createdAt: new Date().toISOString(),
        });
      }
    }

    return res.json({
      message: isOccupying ? `已成功攻克并占领【${provinceName}】！` : `已成功收复【${provinceName}】！`,
      surrenderResult,
      capitulated,
      occupiedProvinces: updatedOccupied,
    });
  } catch (error: any) {
    console.error('Occupy province error:', error);
    return res.status(500).json({ error: '领土占领状态更新失败' });
  }
});

// Capitulate directly (Voluntary surrender or admin enforcement)
diplomacyRouter.post('/capitulate', requireAuth, (req: AuthRequest, res) => {
  try {
    const user = req.user!;
    const { targetNationId, toNationId } = req.body;

    const myNation = db.findNationByOwnerId(user.id);
    const nationToCapitulate = targetNationId ? db.findNationById(targetNationId) : myNation;

    if (!nationToCapitulate) {
      return res.status(404).json({ error: '未找到指定要投降的国家' });
    }

    if (nationToCapitulate.ownerId !== user.id && user.role !== 'admin') {
      return res.status(403).json({ error: '您不是该国领主，无权代为宣布投降' });
    }

    const victorNation = toNationId ? db.findNationById(toNationId) : undefined;
    const victorName = victorNation?.name || '战胜国统帅部';

    // Terminate all active wars
    const wars = db.getDiplomaticRequests().filter(
      (r) =>
        r.type === 'war' &&
        r.status === 'active' &&
        (r.senderNationId === nationToCapitulate.id || r.receiverNationId === nationToCapitulate.id)
    );
    wars.forEach((w) => {
      db.updateDiplomaticRequest(w.id, { status: 'terminated' });
    });

    db.updateNation(nationToCapitulate.id, {
      isCapitulated: true,
      surrenderProgress: 100,
      capitulatedAt: new Date().toISOString(),
      capitulatedToNationId: victorNation?.id,
      capitulatedToNationName: victorName,
    });

    db.createNotification({
      id: 'notif_' + Math.random().toString(36).substring(2, 9),
      userId: nationToCapitulate.ownerId,
      type: 'war_alert',
      title: '🕊️ 国家已正式签署投降公报',
      content: `您的国家【${nationToCapitulate.name}】已正式向【${victorName}】签署投降公报，全境交战行动停止。`,
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    return res.json({
      message: `【${nationToCapitulate.name}】已宣告投降并转入停火状态。`,
      nation: db.findNationById(nationToCapitulate.id),
    });
  } catch (error: any) {
    console.error('Capitulate error:', error);
    return res.status(500).json({ error: '执行投降结算失败' });
  }
});

