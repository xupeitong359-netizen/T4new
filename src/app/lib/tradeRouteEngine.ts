import { Nation, ProvinceData } from '../types';
import { initMapIndex, findGeoFeature } from './mapAdjacency';
import { STANDARD_EQUIPMENT_TEMPLATES } from './militaryIndustry';

export interface RouteWaypoint {
  provinceId: string;
  provinceName: string;
  chineseName: string;
  ownerNationId?: string;
  ownerNationName?: string;
  isUnclaimed: boolean;
  isNeutral: boolean;
  isHostile: boolean;
  status: 'origin' | 'transit_own' | 'transit_neutral' | 'transit_unclaimed' | 'transit_ally' | 'destination';
  note?: string;
}

export interface TradeRouteVerificationResult {
  canTrade: boolean;
  isDomestic: boolean;
  isDirectBorder: boolean;
  pathFound: boolean;
  pathProvinceIds: string[];
  waypoints: RouteWaypoint[];
  totalHops: number;
  transitCostLingyu: number;
  securityScore: number; // 0~100%
  blockageReason?: string;
  blockedByNations: {
    nationId: string;
    nationName: string;
    reason: 'at_war' | 'embargo';
  }[];
  summaryText: string;
}

export interface ArmsMarketListing {
  id: string;
  sellerNationId: string;
  sellerNationName: string;
  sellerOwnerName?: string;
  sellerFlagColor?: string;
  sellerEmblemIcon?: string;
  isAiCompany?: boolean; // 国际著名军火商/财阀
  companyBadge?: string;
  equipmentId: string;
  equipmentName: string;
  category: 'infantry' | 'artillery' | 'support' | 'motorized' | 'armor' | 'mechanized' | 'aviation';
  tier?: number;
  unitPriceLingyu: number; // 玲玉币单价
  availableQuantity: number;
  minBatch: number;
  description: string;
  createdAt: string;
  soldCount?: number;
}

export interface ArmsTradeTransaction {
  id: string;
  timestamp: string;
  buyerNationId: string;
  buyerNationName: string;
  sellerNationId: string;
  sellerNationName: string;
  equipmentId: string;
  equipmentName: string;
  quantity: number;
  unitPriceLingyu: number;
  totalCostLingyu: number;
  transitPath: string[];
  status: 'completed' | 'blocked_by_war';
  note: string;
}

/**
 * 校验买方与卖方之间是否存在畅通的陆上贸易通道
 * 判定规则：
 * 1. 同一国家境内或领土直接接壤：判定直接畅通。
 * 2. 从买方任一省份出发，沿地图相邻省份拓扑搜索到达卖方任一省份。
 * 3. 允许通行的省份：买方自身领土、卖方自身领土、未占领省份、中立国家省份（未与买卖双方宣战且未被军火禁运）、盟友省份。
 * 4. 禁止通行的省份：与买方或卖方处于战争状态（activeWars）的敌国领土、对买卖双方施加全面/军火禁运（activeSanctionsEnforced）的国家领土。
 * 5. 若找不到陆上通路（中间全被敌国阻断，或处于孤立大洋岛屿无陆桥）：判定贸易无效，无法交易。
 */
export function verifyLandTradeRoute(
  buyerNation: Nation | null | undefined,
  sellerNation: Nation | null | undefined,
  allNations: Nation[] = []
): TradeRouteVerificationResult {
  if (!buyerNation || !sellerNation) {
    return {
      canTrade: false,
      isDomestic: false,
      isDirectBorder: false,
      pathFound: false,
      pathProvinceIds: [],
      waypoints: [],
      totalHops: 0,
      transitCostLingyu: 0,
      securityScore: 0,
      blockageReason: '买方或卖方国家数据缺失',
      blockedByNations: [],
      summaryText: '无法获取国家地缘信息',
    };
  }

  // 1. 同国交易 / 境内调配
  if (buyerNation.id === sellerNation.id) {
    return {
      canTrade: true,
      isDomestic: true,
      isDirectBorder: true,
      pathFound: true,
      pathProvinceIds: [],
      waypoints: [
        {
          provinceId: 'domestic_hub',
          provinceName: '境内国防物流枢纽',
          chineseName: '境内国防物流中枢',
          ownerNationId: buyerNation.id,
          ownerNationName: buyerNation.name,
          isUnclaimed: false,
          isNeutral: false,
          isHostile: false,
          status: 'origin',
          note: '本国境内直接调拨，无需跨国陆运',
        },
      ],
      totalHops: 0,
      transitCostLingyu: 0,
      securityScore: 100,
      blockedByNations: [],
      summaryText: '境内直接调拨，物流通道 100% 畅通',
    };
  }

  // 2. 国际独立军工集团 (AI Company without sovereign land constraints)
  if (sellerNation.id.startsWith('ai_corp_') || sellerNation.id.startsWith('intl_')) {
    return {
      canTrade: true,
      isDomestic: false,
      isDirectBorder: false,
      pathFound: true,
      pathProvinceIds: [],
      waypoints: [
        {
          provinceId: 'intl_consortium',
          provinceName: '国际军工联合体保税中转站',
          chineseName: '国际军工联合体保税仓',
          ownerNationId: sellerNation.id,
          ownerNationName: sellerNation.name,
          isUnclaimed: false,
          isNeutral: true,
          isHostile: false,
          status: 'origin',
          note: '依托国际公海保税区与中立陆港特权，不受单一邻国封锁',
        },
        {
          provinceId: 'buyer_border',
          provinceName: buyerNation.provinces?.[0]?.name || '边境口岸',
          chineseName: buyerNation.provinces?.[0]?.name || '边境口岸',
          ownerNationId: buyerNation.id,
          ownerNationName: buyerNation.name,
          isUnclaimed: false,
          isNeutral: false,
          isHostile: false,
          status: 'destination',
          note: '抵达本国陆上边检入库',
        },
      ],
      totalHops: 1,
      transitCostLingyu: 10,
      securityScore: 95,
      blockedByNations: [],
      summaryText: '国际军工特权通道畅通，保税口岸直达',
    };
  }

  const { featureMetas, adjacencyMap, featureById, featureByName } = initMapIndex();

  // 3. 构建买方与卖方的核心省份集合
  const buyerProvinces = buyerNation.provinces || [];
  const sellerProvinces = sellerNation.provinces || [];

  if (buyerProvinces.length === 0) {
    return {
      canTrade: false,
      isDomestic: false,
      isDirectBorder: false,
      pathFound: false,
      pathProvinceIds: [],
      waypoints: [],
      totalHops: 0,
      transitCostLingyu: 0,
      securityScore: 0,
      blockageReason: `买方【${buyerNation.name}】未拥有任何陆上省份领土，无法建立地面运输通道`,
      blockedByNations: [],
      summaryText: '买方无陆上领土',
    };
  }

  if (sellerProvinces.length === 0) {
    return {
      canTrade: false,
      isDomestic: false,
      isDirectBorder: false,
      pathFound: false,
      pathProvinceIds: [],
      waypoints: [],
      totalHops: 0,
      transitCostLingyu: 0,
      securityScore: 0,
      blockageReason: `卖方【${sellerNation.name}】未拥有任何陆上省份领土，无法建立地面发运通道`,
      blockedByNations: [],
      summaryText: '卖方无陆上领土',
    };
  }

  // 收集买方与卖方的 stateId 集合
  const buyerStateIds = new Set<string>();
  buyerProvinces.forEach((p) => {
    if (p.id !== undefined && p.id !== null) {
      buyerStateIds.add(String(p.id));
      const meta = featureById.get(String(p.id));
      if (meta) buyerStateIds.add(meta.stateId);
    }
    if (p.name) {
      const meta = featureByName.get(p.name.trim().toLowerCase());
      if (meta) buyerStateIds.add(meta.stateId);
    }
  });

  const sellerStateIds = new Set<string>();
  sellerProvinces.forEach((p) => {
    if (p.id !== undefined && p.id !== null) {
      sellerStateIds.add(String(p.id));
      const meta = featureById.get(String(p.id));
      if (meta) sellerStateIds.add(meta.stateId);
    }
    if (p.name) {
      const meta = featureByName.get(p.name.trim().toLowerCase());
      if (meta) sellerStateIds.add(meta.stateId);
    }
  });

  // 4. 构建全图省份归属映射
  const provinceOwnerMap = new Map<string, Nation>();
  allNations.forEach((nat) => {
    (nat.provinces || []).forEach((p) => {
      if (p.id !== undefined && p.id !== null) {
        provinceOwnerMap.set(String(p.id), nat);
        const meta = featureById.get(String(p.id));
        if (meta) provinceOwnerMap.set(meta.stateId, nat);
      }
      if (p.name) {
        const meta = featureByName.get(p.name.trim().toLowerCase());
        if (meta) provinceOwnerMap.set(meta.stateId, nat);
      }
    });
  });

  // 5. 确定对买方或卖方敌对的国家集合 (At War or Embargo)
  const hostileNationMap = new Map<string, { nation: Nation; reason: 'at_war' | 'embargo' }>();

  // 检查与买方的战争与制裁
  (buyerNation.activeWars || []).forEach((w) => {
    const enemyNat = allNations.find((n) => n.id === w.withNationId);
    if (enemyNat) hostileNationMap.set(enemyNat.id, { nation: enemyNat, reason: 'at_war' });
  });
  (buyerNation.activeSanctionsEnforced || []).forEach((s) => {
    if (s.type === 'arms' || s.type === 'total') {
      const targetNat = allNations.find((n) => n.id === s.targetNationId);
      if (targetNat) hostileNationMap.set(targetNat.id, { nation: targetNat, reason: 'embargo' });
    }
  });

  // 检查与卖方的战争与制裁
  (sellerNation.activeWars || []).forEach((w) => {
    const enemyNat = allNations.find((n) => n.id === w.withNationId);
    if (enemyNat) hostileNationMap.set(enemyNat.id, { nation: enemyNat, reason: 'at_war' });
  });
  (sellerNation.activeSanctionsEnforced || []).forEach((s) => {
    if (s.type === 'arms' || s.type === 'total') {
      const targetNat = allNations.find((n) => n.id === s.targetNationId);
      if (targetNat) hostileNationMap.set(targetNat.id, { nation: targetNat, reason: 'embargo' });
    }
  });

  // 检查买卖双方是否直接处于交战状态
  const isDirectlyAtWar = (buyerNation.activeWars || []).some((w) => w.withNationId === sellerNation.id);
  if (isDirectlyAtWar) {
    return {
      canTrade: false,
      isDomestic: false,
      isDirectBorder: false,
      pathFound: false,
      pathProvinceIds: [],
      waypoints: [],
      totalHops: 0,
      transitCostLingyu: 0,
      securityScore: 0,
      blockageReason: `买卖双方国家【${buyerNation.name}】与【${sellerNation.name}】正处于交战状态，严禁向交战敌国输送或采购武器！`,
      blockedByNations: [{ nationId: sellerNation.id, nationName: sellerNation.name, reason: 'at_war' }],
      summaryText: '买卖双方正处于交战状态，全面禁止交易',
    };
  }

  // 6. 运行广度优先搜索 (BFS)，从买方省份出发寻找到达卖方省份的最短畅通陆上路径
  const queue: { stateId: string; path: string[] }[] = [];
  const visited = new Set<string>();
  const parentMap = new Map<string, string>();
  const encounteredHostiles = new Set<string>();

  buyerStateIds.forEach((sid) => {
    queue.push({ stateId: sid, path: [sid] });
    visited.add(sid);
  });

  let targetReachedStateId: string | null = null;
  let finalPath: string[] = [];

  while (queue.length > 0) {
    const current = queue.shift()!;
    const u = current.stateId;

    // 如果到达了卖方的任一省份
    if (sellerStateIds.has(u)) {
      targetReachedStateId = u;
      finalPath = current.path;
      break;
    }

    const neighbors = adjacencyMap.get(u);
    if (!neighbors) continue;

    for (const v of neighbors) {
      if (visited.has(v)) continue;

      // 检查邻接省份 v 的通行权限
      const ownerNat = provinceOwnerMap.get(v);

      if (ownerNat) {
        // 如果属于敌对国家（与买方或卖方交战/禁运）
        if (hostileNationMap.has(ownerNat.id)) {
          encounteredHostiles.add(ownerNat.id);
          // 敌国省份禁止陆上通行
          continue;
        }
      }

      // 未占领省份 / 中立国家省份 / 盟友省份 / 己方省份 -> 均允许通行！
      visited.add(v);
      parentMap.set(v, u);
      queue.push({ stateId: v, path: [...current.path, v] });
    }
  }

  // 7. 评估搜索结果
  if (finalPath.length > 0) {
    const isDirectBorder = finalPath.length === 2;
    const totalHops = finalPath.length - 1;

    // 构建详细路线地名与经由状态
    const waypoints: RouteWaypoint[] = finalPath.map((sid, idx) => {
      const meta = featureById.get(sid);
      const provName = meta?.name || `地块 #${sid}`;
      const chineseName = meta?.chineseName || provName;
      const owner = provinceOwnerMap.get(sid);

      let status: RouteWaypoint['status'] = 'transit_neutral';
      let note = '中立主权省份，允许商业与军火过境';

      if (idx === 0) {
        status = 'origin';
        note = `买方【${buyerNation.name}】口岸始发`;
      } else if (idx === finalPath.length - 1) {
        status = 'destination';
        note = `卖方【${sellerNation.name}】军火枢纽`;
      } else if (buyerStateIds.has(sid)) {
        status = 'transit_own';
        note = '买方境内陆上运输网络';
      } else if (!owner) {
        status = 'transit_unclaimed';
        note = '未占领自由缓冲区，地面车队畅通';
      } else if (owner.id === buyerNation.id || owner.id === sellerNation.id) {
        status = 'transit_own';
        note = '贸易方管辖领土';
      } else if (buyerNation.embassies?.includes(owner.id) || buyerNation.allianceId && buyerNation.allianceId === owner.allianceId) {
        status = 'transit_ally';
        note = `盟友/建交国【${owner.name}】友好过境走廊`;
      }

      return {
        provinceId: sid,
        provinceName: provName,
        chineseName,
        ownerNationId: owner?.id,
        ownerNationName: owner?.name || '未占领中立区',
        isUnclaimed: !owner,
        isNeutral: Boolean(owner && owner.id !== buyerNation.id && owner.id !== sellerNation.id),
        isHostile: false,
        status,
        note,
      };
    });

    const neutralHops = waypoints.filter((w) => w.isNeutral || w.isUnclaimed).length;
    const securityScore = Math.max(45, 100 - neutralHops * 6);
    const transitCostLingyu = Math.round(neutralHops * 15);

    return {
      canTrade: true,
      isDomestic: false,
      isDirectBorder,
      pathFound: true,
      pathProvinceIds: finalPath,
      waypoints,
      totalHops,
      transitCostLingyu,
      securityScore,
      blockedByNations: [],
      summaryText: isDirectBorder
        ? '两国领土直接接壤，陆上军火走廊直通'
        : `陆上走廊畅通 (途经 ${totalHops} 站：${neutralHops} 处中立/自由缓冲区)`,
    };
  }

  // 8. 路径受阻：分析具体截断原因
  const blockedHostileNations = Array.from(encounteredHostiles).map((nid) => {
    const info = hostileNationMap.get(nid)!;
    return {
      nationId: nid,
      nationName: info.nation.name,
      reason: info.reason,
    };
  });

  let blockageDetail = '交易双方之间没有陆上路线可以到达。';
  if (blockedHostileNations.length > 0) {
    const hostileNames = blockedHostileNations.map((b) => `【${b.nationName}】(${b.reason === 'at_war' ? '交战国' : '禁运国'})`).join('、');
    blockageDetail = `交易双方之间陆上通道被敌对势力 ${hostileNames} 完全封锁截断，无中立或自由走廊可绕行！`;
  } else {
    blockageDetail = '交易双方处于不同大陆板块或孤岛，彼此之间无任何陆地省份或陆桥相连！';
  }

  return {
    canTrade: false,
    isDomestic: false,
    isDirectBorder: false,
    pathFound: false,
    pathProvinceIds: [],
    waypoints: [],
    totalHops: 0,
    transitCostLingyu: 0,
    securityScore: 0,
    blockageReason: blockageDetail,
    blockedByNations: blockedHostileNations,
    summaryText: '❌ 陆运受阻：无有效陆上走廊或被敌对国家完全封锁',
  };
}

/**
 * 预设国际军工财阀与活跃军火挂单
 */
export const INITIAL_AI_ARMS_MARKET_LISTINGS: ArmsMarketListing[] = [
  {
    id: 'mkt_skoda_rifle_01',
    sellerNationId: 'ai_corp_skoda',
    sellerNationName: '斯柯达兵工厂联合财阀',
    sellerOwnerName: '斯柯达海外外贸专员',
    sellerFlagColor: '#0284c7',
    sellerEmblemIcon: 'Crosshair',
    isAiCompany: true,
    companyBadge: '欧洲百年重工',
    equipmentId: 'eq_rifle',
    equipmentName: 'VZ.24 制式步枪 (7.92mm经典型)',
    category: 'infantry',
    tier: 1,
    unitPriceLingyu: 12,
    availableQuantity: 45000,
    minBatch: 100,
    description: '采用高强度合金钢锻造，射击精度卓越，适应恶劣沙尘与严寒环境。',
    createdAt: '2026-09-01T00:00:00.000Z',
    soldCount: 12800,
  },
  {
    id: 'mkt_krupp_artillery_02',
    sellerNationId: 'ai_corp_krupp',
    sellerNationName: '克虏伯重工联合体',
    sellerOwnerName: '克虏伯远东军需代表',
    sellerFlagColor: '#475569',
    sellerEmblemIcon: 'Bomb',
    isAiCompany: true,
    companyBadge: '重炮锻造之王',
    equipmentId: 'eq_artillery',
    equipmentName: '105mm 轻型野战加农重炮',
    category: 'artillery',
    tier: 1,
    unitPriceLingyu: 180,
    availableQuantity: 1200,
    minBatch: 5,
    description: '配备液压驻退复进机构与大角度仰角射界，炮火压制覆盖范围极广。',
    createdAt: '2026-09-01T00:00:00.000Z',
    soldCount: 420,
  },
  {
    id: 'mkt_vickers_tank_03',
    sellerNationId: 'ai_corp_vickers',
    sellerNationName: '维克斯-阿姆斯特朗军工',
    sellerOwnerName: '皇家外贸联络官',
    sellerFlagColor: '#b91c1c',
    sellerEmblemIcon: 'Shield',
    isAiCompany: true,
    companyBadge: '不列颠装甲中枢',
    equipmentId: 'eq_tank_medium',
    equipmentName: 'Mark IV 巡洋装甲主力坦克',
    category: 'armor',
    tier: 1,
    unitPriceLingyu: 880,
    availableQuantity: 350,
    minBatch: 1,
    description: '装配 75mm 高初速火炮与倾斜轧制装甲，兼备卓越的野战机动性。',
    createdAt: '2026-09-01T00:00:00.000Z',
    soldCount: 95,
  },
  {
    id: 'mkt_ural_truck_04',
    sellerNationId: 'ai_corp_ural',
    sellerNationName: '乌拉尔重型机车厂',
    sellerOwnerName: '高加索后勤总监',
    sellerFlagColor: '#dc2626',
    sellerEmblemIcon: 'Truck',
    isAiCompany: true,
    companyBadge: '全地形后勤支柱',
    equipmentId: 'eq_truck',
    equipmentName: '吉斯-6 全驱重型越野运输卡车',
    category: 'motorized',
    tier: 1,
    unitPriceLingyu: 140,
    availableQuantity: 2800,
    minBatch: 10,
    description: '6x6 重载越野底盘，可在泥泞沼泽与高寒雪地稳定运输给养。',
    createdAt: '2026-09-01T00:00:00.000Z',
    soldCount: 860,
  },
  {
    id: 'mkt_springfield_support_05',
    sellerNationId: 'ai_corp_springfield',
    sellerNationName: '大西洋军械制造总署',
    sellerOwnerName: '新英格兰后勤专使',
    sellerFlagColor: '#2563eb',
    sellerEmblemIcon: 'Wrench',
    isAiCompany: true,
    companyBadge: '战地通讯先锋',
    equipmentId: 'eq_support',
    equipmentName: 'SCR-300 背负式野战无线电与工兵套件',
    category: 'support',
    tier: 2,
    unitPriceLingyu: 220,
    availableQuantity: 1800,
    minBatch: 5,
    description: '调频防干扰步话机电台与野战急救器械包，全方位提升步兵排协同度。',
    createdAt: '2026-09-01T00:00:00.000Z',
    soldCount: 510,
  },
  {
    id: 'mkt_mitchell_aircraft_06',
    sellerNationId: 'ai_corp_mitchell',
    sellerNationName: '联合航空航天工业社',
    sellerOwnerName: '试飞团首席外贸专员',
    sellerFlagColor: '#059669',
    sellerEmblemIcon: 'Crosshair',
    isAiCompany: true,
    companyBadge: '制空拦截王牌',
    equipmentId: 'eq_aircraft',
    equipmentName: 'P-40 战鹰制空战斗截击机',
    category: 'aviation',
    tier: 1,
    unitPriceLingyu: 1250,
    availableQuantity: 180,
    minBatch: 1,
    description: '配装 6挺 12.7mm 重机枪与俯冲增压发动机，近距空中格斗火力凶猛。',
    createdAt: '2026-09-01T00:00:00.000Z',
    soldCount: 42,
  },
];

const LOCAL_STORAGE_MARKET_KEY = 'strategic_arms_market_listings_v1';
const LOCAL_STORAGE_TRANSACTIONS_KEY = 'strategic_arms_market_transactions_v1';

export function getSavedArmsListings(): ArmsMarketListing[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_MARKET_KEY);
    if (!raw) return INITIAL_AI_ARMS_MARKET_LISTINGS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch (e) {
    console.error('Failed to load arms market listings', e);
  }
  return INITIAL_AI_ARMS_MARKET_LISTINGS;
}

export function saveArmsListings(listings: ArmsMarketListing[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_MARKET_KEY, JSON.stringify(listings));
  } catch (e) {
    console.error('Failed to save arms market listings', e);
  }
}

export function getSavedTransactions(): ArmsTradeTransaction[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_TRANSACTIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch (e) {
    console.error('Failed to load arms transactions', e);
  }
  return [];
}

export function saveTransactionRecord(tx: ArmsTradeTransaction) {
  try {
    const current = getSavedTransactions();
    const next = [tx, ...current].slice(0, 100);
    localStorage.setItem(LOCAL_STORAGE_TRANSACTIONS_KEY, JSON.stringify(next));
  } catch (e) {
    console.error('Failed to save transaction record', e);
  }
}
