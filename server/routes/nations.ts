import { Router } from 'express';
import { db, DBNation } from '../db';
import { requireAuth, optionalAuth, AuthRequest } from '../auth';

export const nationsRouter = Router();

// Helper to enrich nation with active wars and accepted treaties
export function enrichNation(nation: DBNation) {
  const requests = db.getDiplomaticRequests();

  // Active wars
  const activeWars = requests
    .filter(
      (r) =>
        r.type === 'war' &&
        r.status === 'active' &&
        (r.senderNationId === nation.id || r.receiverNationId === nation.id)
    )
    .map((r) => {
      const isSender = r.senderNationId === nation.id;
      return {
        withNationId: isSender ? r.receiverNationId : r.senderNationId,
        withNationName: isSender ? r.receiverNationName : r.senderNationName,
        initiatedByMe: isSender,
        since: r.createdAt,
      };
    });

  // Active treaties (peace, mutual_defense, military_access)
  const activeTreaties = requests
    .filter(
      (r) =>
        r.status === 'accepted' &&
        r.type !== 'war' &&
        (r.senderNationId === nation.id || r.receiverNationId === nation.id)
    )
    .map((r) => {
      const isSender = r.senderNationId === nation.id;
      return {
        id: r.id,
        withNationId: isSender ? r.receiverNationId : r.senderNationId,
        withNationName: isSender ? r.receiverNationName : r.senderNationName,
        type: r.type,
        since: r.updatedAt,
      };
    });

  return {
    ...nation,
    activeWars,
    activeTreaties,
  };
}

// Get all declared nations
nationsRouter.get('/', optionalAuth, (req: AuthRequest, res) => {
  const { search, regime, ideology } = req.query;
  let nations = db.getNations();

  if (search && typeof search === 'string') {
    const q = search.toLowerCase().trim();
    nations = nations.filter(
      (n) =>
        n.name.toLowerCase().includes(q) ||
        n.capital.toLowerCase().includes(q) ||
        n.territory.toLowerCase().includes(q) ||
        n.ownerUsername.toLowerCase().includes(q) ||
        n.ownerDouyinName.toLowerCase().includes(q)
    );
  }

  if (regime && typeof regime === 'string' && regime !== 'all') {
    nations = nations.filter((n) => n.regime === regime);
  }

  if (ideology && typeof ideology === 'string' && ideology !== 'all') {
    nations = nations.filter((n) => n.ideology === ideology);
  }

  const enriched = nations.map(enrichNation);
  return res.json({ nations: enriched, total: enriched.length });
});

// Get nation by ID
nationsRouter.get('/:id', optionalAuth, (req: AuthRequest, res) => {
  const nation = db.findNationById(req.params.id);
  if (!nation) {
    return res.status(404).json({ error: '未找到指定国家' });
  }

  return res.json({ nation: enrichNation(nation) });
});

// Create new nation (Each user can only create ONE nation)
nationsRouter.post('/', requireAuth, (req: AuthRequest, res) => {
  try {
    const user = req.user!;

    // Server-side constraint: check if ownerId already owns a nation
    const existing = db.findNationByOwnerId(user.id);
    if (existing) {
      return res.status(400).json({
        error: `您已宣告过国家【${existing.name}】，根据地缘法典，每个领主仅限宣告并统治一个国家！`,
        existingNationId: existing.id,
      });
    }

    const {
      name,
      capital,
      territory,
      description,
      regime,
      ideology,
      language,
      currency,
      currencyRate,
      flagColor,
      emblemIcon,
      mapCoordinates,
      provinces,
    } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: '请填写国家名称' });
    }
    if (!capital || typeof capital !== 'string' || capital.trim().length === 0) {
      return res.status(400).json({ error: '请填写首都名称' });
    }
    if ((!territory || typeof territory !== 'string' || territory.trim().length === 0) && (!provinces || provinces.length === 0)) {
      return res.status(400).json({ error: '请选择或填写国家疆域描述' });
    }
    const maxAllowedProvinces = user.isLingyuBaby ? 11 : 10;
    if (provinces && Array.isArray(provinces) && provinces.length > maxAllowedProvinces) {
      return res.status(400).json({ error: `最多只能选择 ${maxAllowedProvinces} 个省份作为建国初始领土` });
    }

    // Default coordinates based on some realistic geopolitical areas or random
    const coords: [number, number] = Array.isArray(mapCoordinates) && mapCoordinates.length === 2
      ? [Number(mapCoordinates[0]), Number(mapCoordinates[1])]
      : [(Math.random() * 240 - 120), (Math.random() * 100 - 40)];

    const computedTerritory = territory ? territory.trim() : (provinces || []).map((p: any) => p.name).join('、');

    const newNation: DBNation = {
      id: 'nat_' + Math.random().toString(36).substring(2, 11),
      ownerId: user.id,
      ownerUsername: user.username,
      ownerDouyinName: user.douyinName,
      name: name.trim(),
      capital: capital.trim(),
      territory: computedTerritory,
      provinces: provinces && Array.isArray(provinces) ? provinces : [],
      description: description ? description.trim() : '暂无详细国家简介。',
      regime: regime || '君主立宪制',
      ideology: ideology || '中立和平主义',
      language: language ? language.trim() : '汉语',
      currency: currency ? currency.trim() : '玲玉币',
      currencyRate: typeof currencyRate === 'number' && currencyRate > 0 ? currencyRate : 1,
      flagColor: flagColor || '#6366f1',
      emblemIcon: emblemIcon || 'Crown',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      mapCoordinates: coords,
    };

    db.createNation(newNation);

    // Broadcast system notification
    db.createNotification({
      id: 'notif_' + Math.random().toString(36).substring(2, 9),
      userId: user.id,
      type: 'system',
      title: '建国大典顺利完成',
      content: `恭喜领主【${user.username}】！您宣告的【${newNation.name}】已正式屹立于世界之林！`,
      relatedNationId: newNation.id,
      relatedNationName: newNation.name,
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    return res.status(201).json({
      message: `国家【${newNation.name}】宣告成功！`,
      nation: enrichNation(newNation),
    });
  } catch (error: any) {
    console.error('Create nation error:', error);
    return res.status(500).json({ error: '宣告国家失败，服务器内部错误' });
  }
});

// Edit nation
nationsRouter.put('/:id', requireAuth, (req: AuthRequest, res) => {
  try {
    const user = req.user!;
    const nationId = req.params.id;
    const nation = db.findNationById(nationId);

    if (!nation) {
      return res.status(404).json({ error: '未找到指定国家' });
    }

    // Must be nation owner OR admin
    if (nation.ownerId !== user.id && user.role !== 'admin') {
      return res.status(403).json({ error: '您无权编辑其他领主的国家' });
    }

    const {
      name,
      capital,
      territory,
      description,
      regime,
      ideology,
      language,
      currency,
      currencyRate,
      flagColor,
      emblemIcon,
      mapCoordinates,
      provinces,
      militaryIndustry,
      radarTech,
      constructionQueue,
      activeDecreeIds,
      ministers,
      stabilityIndex,
      popularApproval,
      allianceId,
      embassies,
      activeSanctionsEnforced,
      unlockedMedalIds,
      nationalAnthem,
      nationalMotto,
      chronicles,
      researchedTechIds,
      activeResearchProjects,
      unlockedResearchSlots,
      economy,
      currencySymbol,
      taxRate,
    } = req.body;

    const updates: Partial<DBNation> = {};
    if (name && typeof name === 'string') updates.name = name.trim();
    if (capital && typeof capital === 'string') updates.capital = capital.trim();
    if (territory && typeof territory === 'string') updates.territory = territory.trim();
    if (provinces && Array.isArray(provinces)) updates.provinces = provinces;
    if (militaryIndustry !== undefined) updates.militaryIndustry = militaryIndustry;
    if (radarTech !== undefined) updates.radarTech = radarTech;
    if (constructionQueue !== undefined) updates.constructionQueue = constructionQueue;
    if (Array.isArray(activeDecreeIds)) updates.activeDecreeIds = activeDecreeIds;
    if (ministers && typeof ministers === 'object') updates.ministers = ministers;
    if (typeof stabilityIndex === 'number') updates.stabilityIndex = stabilityIndex;
    if (typeof popularApproval === 'number') updates.popularApproval = popularApproval;
    if (typeof allianceId === 'string') updates.allianceId = allianceId;
    if (Array.isArray(embassies)) updates.embassies = embassies;
    if (Array.isArray(activeSanctionsEnforced)) updates.activeSanctionsEnforced = activeSanctionsEnforced;
    if (Array.isArray(unlockedMedalIds)) updates.unlockedMedalIds = unlockedMedalIds;
    if (typeof nationalAnthem === 'string') updates.nationalAnthem = nationalAnthem.trim();
    if (typeof nationalMotto === 'string') updates.nationalMotto = nationalMotto.trim();
    if (Array.isArray(chronicles)) updates.chronicles = chronicles;
    if (Array.isArray(researchedTechIds)) updates.researchedTechIds = researchedTechIds;
    if (Array.isArray(activeResearchProjects)) updates.activeResearchProjects = activeResearchProjects;
    if (typeof unlockedResearchSlots === 'number') updates.unlockedResearchSlots = unlockedResearchSlots;
    if (economy !== undefined) updates.economy = economy;
    if (typeof currencySymbol === 'string') updates.currencySymbol = currencySymbol;
    if (typeof taxRate === 'number') updates.taxRate = taxRate;
    if (description !== undefined) updates.description = description.trim();
    if (regime) updates.regime = regime;
    if (ideology) updates.ideology = ideology;
    if (language) updates.language = language.trim();
    if (currency) updates.currency = currency.trim();
    if (currencyRate !== undefined && typeof currencyRate === 'number' && currencyRate > 0) {
      updates.currencyRate = currencyRate;
    }
    if (flagColor) updates.flagColor = flagColor;
    if (emblemIcon) updates.emblemIcon = emblemIcon;
    if (Array.isArray(mapCoordinates) && mapCoordinates.length === 2) {
      updates.mapCoordinates = [Number(mapCoordinates[0]), Number(mapCoordinates[1])];
    }

    const updated = db.updateNation(nationId, updates);

    return res.json({
      message: '国家信息修改成功',
      nation: enrichNation(updated!),
    });
  } catch (error: any) {
    console.error('Update nation error:', error);
    return res.status(500).json({ error: '更新国家信息失败' });
  }
});

// Update national economy policies (Tax rate, currency name, currency symbol)
// Note: GDP and Treasury can NEVER be directly modified by the client - only calculated authoritatively by the system
nationsRouter.put('/:id/economy', requireAuth, (req: AuthRequest, res) => {
  try {
    const user = req.user!;
    const nationId = req.params.id;
    const nation = db.findNationById(nationId);

    if (!nation) {
      return res.status(404).json({ error: '未找到指定国家' });
    }

    if (nation.ownerId !== user.id && user.role !== 'admin') {
      return res.status(403).json({ error: '您无权调整其他国家的经济与财政政策' });
    }

    const { taxRate, currencyName, currencySymbol } = req.body;

    // Validate Tax Rate: must be a valid number between 5% and 50%
    let validatedTaxRate = 20;
    if (taxRate !== undefined) {
      const numTax = Number(taxRate);
      if (isNaN(numTax) || numTax < 5 || numTax > 50) {
        return res.status(400).json({ error: '税率必须设定在 5% ~ 50% 的合法财政宏观调控区间内' });
      }
      validatedTaxRate = Math.round(numTax * 10) / 10;
    } else if (nation.economy?.taxRate) {
      validatedTaxRate = nation.economy.taxRate;
    }

    // Validate Currency Name & Symbol
    const validatedCurrencyName = currencyName && typeof currencyName === 'string'
      ? currencyName.trim().slice(0, 16)
      : (nation.economy?.currencyName || nation.currency || '玲玉币');

    const validatedCurrencySymbol = currencySymbol && typeof currencySymbol === 'string'
      ? currencySymbol.trim().slice(0, 6)
      : (nation.economy?.currencySymbol || '¥');

    // Server-side authoritative economy snapshot calculation:
    // Calculate total valid civilian factories strictly from valid provinces
    const provinces = nation.provinces || [];
    const totalCivFactories = provinces.reduce((acc: number, p: any) => {
      const civ = p.detailedBuildings?.civilian_factory ?? p.civilianFactories ?? 0;
      return acc + Math.max(0, Math.min(30, Number(civ) || 0));
    }, 0);

    const now = Date.now();
    const prevCalc = nation.economy?.lastCalculatedAt ? Date.parse(nation.economy.lastCalculatedAt) : (now - 86400000 * 3);
    const elapsedMs = Math.max(0, now - prevCalc);

    // 1 factory = 1,000,000 GDP / 24h (86,400,000ms)
    const baseDailyGDP = totalCivFactories * 1_000_000;
    const prevTax = nation.economy?.taxRate || 20;
    const baseDailyRevenue = baseDailyGDP * (prevTax / 100);

    const oldBaseGDP = Number(nation.economy?.baseGDP) || (baseDailyGDP * 10);
    const oldBaseTreasury = Number(nation.economy?.baseTreasury) || (baseDailyRevenue * 10);

    const newBaseGDP = oldBaseGDP + (baseDailyGDP / 86400000) * elapsedMs;
    const newBaseTreasury = oldBaseTreasury + (baseDailyRevenue / 86400000) * elapsedMs;

    const updatedEconomy = {
      taxRate: validatedTaxRate,
      currencyName: validatedCurrencyName,
      currencySymbol: validatedCurrencySymbol,
      lastCalculatedAt: new Date(now).toISOString(),
      baseGDP: newBaseGDP,
      baseTreasury: newBaseTreasury,
    };

    const updated = db.updateNation(nationId, {
      economy: updatedEconomy,
      currency: validatedCurrencyName,
      currencySymbol: validatedCurrencySymbol,
      taxRate: validatedTaxRate,
    });

    return res.json({
      message: `国家【${nation.name}】经济与财税法案已成功颁布实施！`,
      nation: enrichNation(updated!),
    });
  } catch (error: any) {
    console.error('Update economy error:', error);
    return res.status(500).json({ error: '更新国家经济政策失败' });
  }
});

// Update military industry directly
nationsRouter.put('/:id/military-industry', requireAuth, (req: AuthRequest, res) => {
  try {
    const user = req.user!;
    const nationId = req.params.id;
    const nation = db.findNationById(nationId);

    if (!nation) {
      return res.status(404).json({ error: '未找到指定国家' });
    }

    if (nation.ownerId !== user.id && user.role !== 'admin') {
      return res.status(403).json({ error: '您无权配置其他国家的军工产能' });
    }

    const { militaryIndustry } = req.body;
    if (!militaryIndustry) {
      return res.status(400).json({ error: '请提供军工配置数据' });
    }

    const updated = db.updateNation(nationId, { militaryIndustry });
    return res.json({
      message: '军事产能与军械生产线配置保存成功！',
      nation: enrichNation(updated!),
    });
  } catch (error: any) {
    console.error('Update military industry error:', error);
    return res.status(500).json({ error: '保存军工数据失败' });
  }
});

// Delete nation
nationsRouter.post('/peace-expansion', requireAuth, (req: AuthRequest, res) => {
  try {
    const user = req.user!;
    const nation = db.findNationByOwnerId(user.id);
    if (!nation) {
      return res.status(400).json({ error: '您尚未创建或统治任何国家，无法执行和平扩张' });
    }

    const { provinceId, provinceName } = req.body;
    if (provinceId === undefined && !provinceName) {
      return res.status(400).json({ error: '无法识别目标省份' });
    }

    // Daily limit check (测试阶段扩容至每日 50 次)
    const DAILY_LIMIT = 50;
    const currentCount = ((nation as any).peaceExpansionCount || 0);
    if (nation.lastPeaceExpansionAt && currentCount >= DAILY_LIMIT) {
      const lastDate = new Date(nation.lastPeaceExpansionAt);
      const now = new Date();
      if (
        lastDate.getFullYear() === now.getFullYear() &&
        lastDate.getMonth() === now.getMonth() &&
        lastDate.getDate() === now.getDate()
      ) {
        return res.status(400).json({ error: `今日和平扩张测试上限（${DAILY_LIMIT}次）已达，请明日再试` });
      }
    }

    const resolvedStateId = provinceId !== undefined ? provinceId : String(Date.now());
    const resolvedName = provinceName || `省份 #${resolvedStateId}`;

    const myProvinces = nation.provinces || [];
    const alreadyMine = myProvinces.some(
      (p: any) => String(p.id) === String(resolvedStateId) || p.name === resolvedName
    );
    if (alreadyMine) {
      return res.status(400).json({ error: '该省份已经属于你的国家' });
    }

    const allNations = db.getNations();
    for (const otherNation of allNations) {
      if (otherNation.id === nation.id) continue;
      const otherOwns = (otherNation.provinces || []).some(
        (p: any) => String(p.id) === String(resolvedStateId) || p.name === resolvedName
      );
      if (otherOwns) {
        return res.status(400).json({ error: `无法通过和平扩张获得其他国家【${otherNation.name}】的领土` });
      }
    }

    const newProv = {
      id: resolvedStateId,
      name: resolvedName,
      civilianFactories: 1,
      militaryFactories: 0,
      isCore: false,
      acquiredAt: new Date().toISOString(),
      acquiredMethod: 'peace_expansion',
      detailedBuildings: {
        civilian_factory: 1,
        military_factory: 0,
        infrastructure: 1,
      },
      occupationStatus: 'peace',
    };

    const updatedProvinces = [...myProvinces, newProv];
    const nowIso = new Date().toISOString();
    const updated = db.updateNation(nation.id, {
      provinces: updatedProvinces,
      lastPeaceExpansionAt: nowIso,
      peaceExpansionCount: ((nation as any).peaceExpansionCount || 0) + 1,
    })!;

    db.createNotification({
      id: 'notif_' + Math.random().toString(36).substring(2, 9),
      userId: user.id,
      type: 'system',
      title: '和平扩张顺利完成',
      content: `本国已正式收纳【${resolvedName}】（非核心领土）！`,
      relatedNationId: nation.id,
      relatedNationName: nation.name,
      isRead: false,
      createdAt: nowIso,
    });

    return res.json({
      success: true,
      message: `和平扩张成功！你获得了「${resolvedName}」（非核心领土）`,
      province: newProv,
      nation: enrichNation(updated),
    });
  } catch (error: any) {
    console.error('Peace expansion error:', error);
    return res.status(500).json({ error: error.message || '和平扩张处理失败' });
  }
});

// Delete nation
nationsRouter.delete('/:id', requireAuth, (req: AuthRequest, res) => {
  try {
    const user = req.user!;
    const nationId = req.params.id;
    const nation = db.findNationById(nationId);

    if (!nation) {
      return res.status(404).json({ error: '未找到指定国家' });
    }

    // Must be nation owner OR admin
    if (nation.ownerId !== user.id && user.role !== 'admin') {
      return res.status(403).json({ error: '您无权解散其他领主的国家' });
    }

    // Check if the nation is currently in active war
    const enriched = enrichNation(nation);
    if (enriched.activeWars && enriched.activeWars.length > 0) {
      return res.status(400).json({
        error: `国家【${nation.name}】当前处于战时交火状态（共 ${enriched.activeWars.length} 场正在进行的战争），处于战争状态时无法解散国家！请先达成和平停战协议或宣布投降。`,
      });
    }

    const nationName = nation.name;
    const success = db.deleteNation(nationId);

    if (!success) {
      return res.status(500).json({ error: '解散国家操作失败' });
    }

    return res.json({
      message: `国家【${nationName}】已被成功解散，所有相关条约已注销。`,
    });
  } catch (error: any) {
    console.error('Delete nation error:', error);
    return res.status(500).json({ error: '解散国家失败' });
  }
});
