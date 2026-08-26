import {
 Nation,
 PolicyDecree,
 CabinetMinister,
 AllianceFaction,
 BattleSimulationReport,
 ProvinceDispute,
 ArmisticeProposal,
 LendLeaseOffer,
 NationalChronicleItem,
 NationalMedal,
 EmergencyBroadcast,
} from '../types';
import { remoteState } from './remoteState';
import { getTotalMilitaryFactories } from '../lib/militaryIndustry';

// ==========================================
// 1. 领主执政法令库 (Policy Decrees)
// ==========================================
// Legacy nations created before decrees were persisted retain this baseline policy.
export const DEFAULT_ACTIVE_DECREE_IDS = ['decree_free_trade_port'];

export const PRESET_DECREES: PolicyDecree[] = [
 {
  id: 'decree_war_economy',
  name: '战时经济动员令',
  category: 'economy',
  description: '征调民间产能转入军工生产线，全境军工厂产出提升 35%，但轻微降低民意支持度。',
  iconName: 'Factory',
  effects: {
   milCapacityMultiplier: 0.35,
   civCapacityMultiplier: -0.1,
   popularApprovalBonus: -8,
   stabilityBonus: -5,
  },
  upkeepCostCiv: 1200,
 },
 {
  id: 'decree_free_trade_port',
  name: '自由贸易港与关税优惠',
  category: 'economy',
  description: '向万国商人开放边境免税港口，增加货币流动性与民工产值 25%，提升周边国家好感度。',
  iconName: 'Coins',
  effects: {
   civCapacityMultiplier: 0.25,
   diploBonus: 15,
   popularApprovalBonus: 10,
  },
  upkeepCostCiv: 800,
 },
 {
  id: 'decree_mandatory_conscription',
  name: '全民防卫强制服役法',
  category: 'military',
  description: '推行全民后备役登记，大幅强化国防要塞防御力与装备列装速度，略微消耗民意。',
  iconName: 'ShieldAlert',
  effects: {
   milCapacityMultiplier: 0.2,
   stabilityBonus: 5,
   popularApprovalBonus: -6,
  },
  upkeepCostCiv: 1500,
 },
 {
  id: 'decree_cultural_renaissance',
  name: '文化繁荣与国家认同倡议',
  category: 'society',
  description: '大力资助国家艺术院与历史档案馆，极大增强领主威望、民意支持度与全国稳定性。',
  iconName: 'Crown',
  effects: {
   stabilityBonus: 15,
   popularApprovalBonus: 20,
   diploBonus: 10,
  },
  upkeepCostCiv: 1000,
 },
 {
  id: 'decree_tech_leap',
  name: '国家尖端科学强国研发计划',
  category: 'military',
  description: '设立最高科技奖章与雷达航空科研专项津贴，装备研发速度提升 30%。',
  iconName: 'Zap',
  effects: {
   milCapacityMultiplier: 0.15,
   civCapacityMultiplier: 0.1,
   researchSpeedBonus: 0.3,
   stabilityBonus: 8,
  },
  upkeepCostCiv: 2000,
 },
 {
  id: 'decree_heavy_industry_subsidy',
  name: '重工业战略发展补贴法',
  category: 'economy',
  description: '集中财政补贴钢铁、特种合金与发动机重型机械厂，全国基建施工速度提升 25%。',
  iconName: 'Flame',
  effects: {
   civCapacityMultiplier: 0.2,
   milCapacityMultiplier: 0.1,
   stabilityBonus: 5,
  },
  upkeepCostCiv: 1600,
 },
];

// ==========================================
// 2. 国家智库 / 内阁大臣人选库 (Ministers)
// ==========================================
export const PRESET_MINISTERS: CabinetMinister[] = [
 // 国防大臣
 {
  id: 'min_def_1',
  role: 'defense',
  roleTitle: '国防三军总长',
  name: '雷纳德·铁壁',
  trait: '阵地要塞战略家',
  description: '精通多层防空与纵深防御，显著提升全国军事防御效率与战备产出。',
  avatarIcon: 'Shield',
  buffs: {
   milProductionBuff: 15,
   stability: 5,
  },
 },
 {
  id: 'min_def_2',
  role: 'defense',
  roleTitle: '国防总长',
  name: '艾丽卡·迅雷',
  trait: '机械化闪击战先驱',
  description: '主张装甲集团军快速突穿，坦克与歼击机列装速度大幅提高。',
  avatarIcon: 'Zap',
  buffs: {
   milProductionBuff: 25,
   stability: -3,
  },
 },

 // 财政总长
 {
  id: 'min_fin_1',
  role: 'finance',
  roleTitle: '财政与关税总长',
  name: '金贝尔·重商',
  trait: '金本位金融巨擘',
  description: '优化国家金库与税收体系，使民工产能收益与财政稳定性最大化。',
  avatarIcon: 'Coins',
  buffs: {
   civProductionBuff: 20,
   stability: 8,
  },
 },
 {
  id: 'min_fin_2',
  role: 'finance',
  roleTitle: '财政总长',
  name: '维多利亚·精算',
  trait: '紧缩与宏观调控',
  description: '严控军费预算浪费，大幅减少奇观建造与法令维系开销。',
  avatarIcon: 'Landmark',
  buffs: {
   civProductionBuff: 15,
   stability: 12,
  },
 },

 // 外交特使
 {
  id: 'min_for_1',
  role: 'foreign',
  roleTitle: '最高外交特使',
  name: '莫里哀·斡旋',
  trait: '万国纵横家',
  description: '擅长多边同盟谈判与停战斡旋，使馆建立成本降低，盟友支持度激增。',
  avatarIcon: 'ScrollText',
  buffs: {
   diploBuff: 30,
   stability: 6,
  },
 },
 {
  id: 'min_for_2',
  role: 'foreign',
  roleTitle: '外交特使',
  name: '卡尔·威慑',
  trait: '铁血外交官',
  description: '在领土争议声明与战后谈判中极其强硬，割让与赔款谈判占绝对主动。',
  avatarIcon: 'Swords',
  buffs: {
   diploBuff: 10,
   milProductionBuff: 10,
  },
 },

 // 工业与科学大臣
 {
  id: 'min_ind_1',
  role: 'industry',
  roleTitle: '工业科学大臣',
  name: '诺兰·奇迹工匠',
  trait: '巨构建筑大师',
  description: '专精传世奇观与超大型工业群设计，大幅缩短工程建造周期。',
  avatarIcon: 'Hammer',
  buffs: {
   civProductionBuff: 15,
   milProductionBuff: 10,
   stability: 5,
  },
 },
 {
  id: 'min_ind_2',
  role: 'industry',
  roleTitle: '工业科学大臣',
  name: '特斯拉·晨曦',
  trait: '尖端电磁专家',
  description: '主持全国雷达网与重武器流水线升级，大幅减少装配线产能损耗。',
  avatarIcon: 'Cpu',
  buffs: {
   milProductionBuff: 20,
   civProductionBuff: 5,
  },
 },
];

// ==========================================
// 3. 国家勋章与荣誉成就 (National Medals)
// ==========================================
export const PRESET_MEDALS: NationalMedal[] = [
 {
  id: 'medal_peacemaker',
  name: '万国调停者勋章',
  icon: '',
  category: 'diplomacy',
  description: '通过高超的外交手腕促成 5 次以上和平或互保条约，维护世界秩序。',
  condition: '签署或促成 5 次和平/互保条约',
  rarity: 'epic',
 },
 {
  id: 'medal_steel_torrent',
  name: '钢铁洪流勋章',
  icon: '',
  category: 'military',
  description: '国家军事军备库存突破 1000 编制单位，装甲集群震慑全大陆。',
  condition: '武器或装备库存达到 1,000 件',
  rarity: 'epic',
 },
 {
  id: 'medal_lingyu_star',
  name: '玲玉之星国家至尊勋章',
  icon: '',
  category: 'legend',
  description: '传承社区核心文化，受到玲玉大帝与全境领主的至高拥戴。',
  condition: '被认证为玲玉的宝宝或建立卓越功勋',
  rarity: 'legendary',
 },
 {
  id: 'medal_wonder_builder',
  name: '传世奇观缔造者勋章',
  icon: '',
  category: 'construction',
  description: '在本土省份成功规划并竣工一座高度超 100m 的传世巨构奇观。',
  condition: '竣工一座省份传世奇观',
  rarity: 'rare',
 },
 {
  id: 'medal_alliance_founder',
  name: '万国同盟统帅勋章',
  icon: '',
  category: 'diplomacy',
  description: '创立跨国战略阵营，并成功吸纳多位主权领主共同保卫和平。',
  condition: '创建或领导一个多国军事同盟阵营',
  rarity: 'rare',
 },
 {
  id: 'medal_veteran_ruler',
  name: '开国元勋磐石勋章',
  icon: '',
  category: 'legend',
  description: '建国执政稳定度长久保持在 80% 以上，国泰民安，万邦来朝。',
  condition: '国家稳定性指数达到 85% 以上',
  rarity: 'common',
 },
];

// ==========================================
// 4. 预设国际阵营 (Alliances)
// ==========================================
export const INITIAL_ALLIANCES: AllianceFaction[] = [];

// ==========================================
// 5. 存储辅助函数 (Local & State Storage)
// ==========================================
const STORAGE_KEYS = {
 ALLIANCES: 'nation_app_alliances_v1',
 DISPUTES: 'nation_app_disputes_v1',
 BATTLE_REPORTS: 'nation_app_battle_reports_v1',
 ARMISTICE_PROPOSALS: 'nation_app_armistice_v1',
 LEND_LEASE: 'nation_app_lend_lease_v1',
 EMERGENCY_BROADCASTS: 'nation_app_broadcasts_v1',
};


export async function hydrateStrategicStorage() {
 const strategic = await remoteState.readSection<Record<string, unknown>>('strategic');
 if (!strategic) return;
 Object.entries(strategic).forEach(([key, value]) => localStorage.setItem(key, JSON.stringify(value)));
}

function persistStrategicValue(key: string, value: unknown) {
 localStorage.setItem(key, JSON.stringify(value));
 void remoteState.mergeSection('strategic', { [key]: value });
}

export const strategicStorage = {
 getAlliances(): AllianceFaction[] {
  const data = localStorage.getItem(STORAGE_KEYS.ALLIANCES);
  if (!data) {
   persistStrategicValue(STORAGE_KEYS.ALLIANCES, INITIAL_ALLIANCES);
   return INITIAL_ALLIANCES;
  }
  try {
   return JSON.parse(data);
  } catch {
   return INITIAL_ALLIANCES;
  }
 },
 saveAlliances(alliances: AllianceFaction[]) {
  persistStrategicValue(STORAGE_KEYS.ALLIANCES, alliances);
 },

 getDisputes(): ProvinceDispute[] {
  const data = localStorage.getItem(STORAGE_KEYS.DISPUTES);
  if (!data) return [];
  try {
   return JSON.parse(data);
  } catch {
   return [];
  }
 },
 saveDisputes(disputes: ProvinceDispute[]) {
  persistStrategicValue(STORAGE_KEYS.DISPUTES, disputes);
 },

 getBattleReports(): BattleSimulationReport[] {
  const data = localStorage.getItem(STORAGE_KEYS.BATTLE_REPORTS);
  if (!data) return [];
  try {
   return JSON.parse(data);
  } catch {
   return [];
  }
 },
 saveBattleReports(reports: BattleSimulationReport[]) {
  persistStrategicValue(STORAGE_KEYS.BATTLE_REPORTS, reports);
 },

 getLendLeaseOffers(): LendLeaseOffer[] {
  const data = localStorage.getItem(STORAGE_KEYS.LEND_LEASE);
  if (!data) return [];
  try {
   return JSON.parse(data);
  } catch {
   return [];
  }
 },
 saveLendLeaseOffers(offers: LendLeaseOffer[]) {
  persistStrategicValue(STORAGE_KEYS.LEND_LEASE, offers);
 },

 getBroadcasts(): EmergencyBroadcast[] {
  const data = localStorage.getItem(STORAGE_KEYS.EMERGENCY_BROADCASTS);
  if (!data) return [];
  try {
   return JSON.parse(data);
  } catch {
   return [];
  }
 },
 saveBroadcasts(bcs: EmergencyBroadcast[]) {
  persistStrategicValue(STORAGE_KEYS.EMERGENCY_BROADCASTS, bcs);
 },
};

// ==========================================
// 6. 沙盘兵力推演与战力计算核心 (Simulation Engine)
// ==========================================
export function simulateBattle(
 attacker: Nation,
 defender: Nation,
 targetProvinceName: string
): BattleSimulationReport {
 // Compute Combat Power
 const attMilFactories = getTotalMilitaryFactories(attacker) || 5;
 const defMilFactories = getTotalMilitaryFactories(defender) || 5;

 const attStockpiles = attacker.militaryIndustry?.stockpiles || {};
 const defStockpiles = defender.militaryIndustry?.stockpiles || {};

 let attScore = attMilFactories * 120 + 500;
 let defScore = defMilFactories * 120 + 800; // Defender has home turf / fortification bonus

 // Count weapons & equipment in stockpiles
 Object.entries(attStockpiles).forEach(([k, count]) => {
  if (k.includes('tank') || k.includes('armor')) attScore += count * 15;
  else if (k.includes('fighter') || k.includes('bomber')) attScore += count * 25;
  else attScore += count * 2;
 });

 Object.entries(defStockpiles).forEach(([k, count]) => {
  if (k.includes('tank') || k.includes('armor')) defScore += count * 18;
  else if (k.includes('fighter') || k.includes('bomber')) defScore += count * 22;
  else defScore += count * 2.5;
 });

 // Random factor ± 15%
 const attRoll = attScore * (0.85 + Math.random() * 0.3);
 const defRoll = defScore * (0.85 + Math.random() * 0.3);

 const logs: string[] = [];
 logs.push(` 第一阶段【空优争夺】：${attacker.name} 航空联队对 ${targetProvinceName} 防空阵地展开精确打击。`);

 if (attRoll > defRoll * 1.1) {
  logs.push(` 第二阶段【防线撕裂】：${attacker.name} 装甲集群成功突穿外围警戒线，压制敌方指挥部！`);
  logs.push(` 第三阶段【战果确立】：${attacker.name} 全面控制 ${targetProvinceName} 核心要塞，守军退守二线防区。`);
  return {
   id: 'btl_' + Date.now(),
   timestamp: new Date().toISOString(),
   attackerNationId: attacker.id,
   attackerNationName: attacker.name,
   defenderNationId: defender.id,
   defenderNationName: defender.name,
   provinceName: targetProvinceName,
   winner: 'attacker',
   title: `【${attacker.name}】在 ${targetProvinceName} 战役中取得决定性胜利`,
   attackerCombatPower: Math.round(attRoll),
   defenderCombatPower: Math.round(defRoll),
   attackerLosses: { infantry: Math.round(120 + Math.random() * 80), armor: Math.round(15 + Math.random() * 10), aircraft: Math.round(4 + Math.random() * 4) },
   defenderLosses: { infantry: Math.round(350 + Math.random() * 150), armor: Math.round(45 + Math.random() * 20), aircraft: Math.round(12 + Math.random() * 8) },
   logs,
   territoryCeded: true,
  };
 } else if (defRoll > attRoll * 1.1) {
  logs.push(` 第二阶段【防线反击】：${defender.name} 依托地下坚固要塞发起猛烈反冲锋，击退敌先头部队！`);
  logs.push(` 第三阶段【战线稳固】：守军成功扼守 ${targetProvinceName} 咽喉要道，进攻方被迫后撤重整。`);
  return {
   id: 'btl_' + Date.now(),
   timestamp: new Date().toISOString(),
   attackerNationId: attacker.id,
   attackerNationName: attacker.name,
   defenderNationId: defender.id,
   defenderNationName: defender.name,
   provinceName: targetProvinceName,
   winner: 'defender',
   title: `【${defender.name}】成功击退对 ${targetProvinceName} 的进攻`,
   attackerCombatPower: Math.round(attRoll),
   defenderCombatPower: Math.round(defRoll),
   attackerLosses: { infantry: Math.round(280 + Math.random() * 120), armor: Math.round(35 + Math.random() * 15), aircraft: Math.round(10 + Math.random() * 6) },
   defenderLosses: { infantry: Math.round(90 + Math.random() * 50), armor: Math.round(8 + Math.random() * 6), aircraft: Math.round(3 + Math.random() * 2) },
   logs,
   territoryCeded: false,
  };
 } else {
  logs.push(` 第二阶段【焦灼拉锯】：双方在要塞与工业区展开惨烈的阵地战，战局陷入僵持。`);
  logs.push(` 第三阶段【战事胶着】：双方均未能取得决定性突破，前线暂时停火互相对峙。`);
  return {
   id: 'btl_' + Date.now(),
   timestamp: new Date().toISOString(),
   attackerNationId: attacker.id,
   attackerNationName: attacker.name,
   defenderNationId: defender.id,
   defenderNationName: defender.name,
   provinceName: targetProvinceName,
   winner: 'draw',
   title: `【${targetProvinceName} 战役】战况焦灼，双方互有攻防`,
   attackerCombatPower: Math.round(attRoll),
   defenderCombatPower: Math.round(defRoll),
   attackerLosses: { infantry: Math.round(180 + Math.random() * 60), armor: Math.round(20 + Math.random() * 8), aircraft: Math.round(6 + Math.random() * 3) },
   defenderLosses: { infantry: Math.round(170 + Math.random() * 60), armor: Math.round(18 + Math.random() * 8), aircraft: Math.round(5 + Math.random() * 3) },
   logs,
   territoryCeded: false,
  };
 }
}

// ==========================================
// 7. 国家稳定性与民意动态计算
// ==========================================
export function calculateNationalStability(nation: Nation | null) {
 if (!nation) return { stability: 80, approval: 85, status: 'stable' as const, statusText: '国泰民安' };

 let stability = nation.stabilityIndex ?? 82;
 let approval = nation.popularApproval ?? 88;

 // Active wars penalty
 const warCount = nation.activeWars?.length || 0;
 if (warCount > 0) {
  stability -= warCount * 12;
  approval -= warCount * 15;
 }

 // Active decrees bonus/penalty
 const activeDecreeIds = Array.isArray(nation.activeDecreeIds) ? nation.activeDecreeIds : DEFAULT_ACTIVE_DECREE_IDS;
 activeDecreeIds.forEach((id) => {
  const d = PRESET_DECREES.find((item) => item.id === id);
  if (d) {
   if (d.effects.stabilityBonus) stability += d.effects.stabilityBonus;
   if (d.effects.popularApprovalBonus) approval += d.effects.popularApprovalBonus;
  }
 });

 // Clamp 0~100
 stability = Math.max(10, Math.min(100, Math.round(stability)));
 approval = Math.max(10, Math.min(100, Math.round(approval)));

 let statusText = '国泰民安';
 let status: 'thriving' | 'stable' | 'unrest' | 'crisis' = 'stable';

 if (stability >= 85) {
  status = 'thriving';
  statusText = '繁荣昌盛 · 万民归心';
 } else if (stability >= 65) {
  status = 'stable';
  statusText = '政通人和 · 秩序井然';
 } else if (stability >= 40) {
  status = 'unrest';
  statusText = '边境动荡 · 民意浮动';
 } else {
  status = 'crisis';
  statusText = '国家危机 · 亟需整饬';
 }

 return { stability, approval, status, statusText };
}

// ==========================================
// 8. 世界紧张度 (World Tension) 动态评估系统
// ==========================================
export function calculateWorldTension(nations: Nation[]): {
 tension: number;
 stage: 'peace' | 'friction' | 'escalation' | 'world_war';
 stageText: string;
 reasons: string[];
} {
 let tension = 5; // 基准世界局势紧张度 5%
 const reasons: string[] = [];

 let totalWars = 0;
 const warPairs = new Set<string>();

 nations.forEach((n) => {
  (n.activeWars || []).forEach((w) => {
   const pairKey = [n.id, w.withNationId].sort().join('<->');
   if (!warPairs.has(pairKey)) {
    warPairs.add(pairKey);
    totalWars++;
   }
  });
 });

 if (totalWars > 0) {
  const warTension = totalWars * 15;
  tension += warTension;
  reasons.push(`诸国爆发 ${totalWars} 场全面主权交战 (+${warTension}%)`);
 }

 // 领土争议与摩擦
 const disputes = strategicStorage.getDisputes().filter((d) => d.status !== 'settled');
 if (disputes.length > 0) {
  const dispTension = Math.min(25, disputes.length * 5);
  tension += dispTension;
  reasons.push(`边境存在 ${disputes.length} 处热点领土法理争端 (+${dispTension}%)`);
 }

 // 战时经济动员令
 let warEconomyCount = 0;
 nations.forEach((n) => {
  if (n.activeDecreeIds?.includes('decree_war_economy')) warEconomyCount++;
 });
 if (warEconomyCount > 0) {
  const ecoTension = warEconomyCount * 4;
  tension += ecoTension;
  reasons.push(`${warEconomyCount} 个大国施行战时经济动员法案 (+${ecoTension}%)`);
 }

 tension = Math.max(0, Math.min(100, Math.round(tension)));

 let stage: 'peace' | 'friction' | 'escalation' | 'world_war' = 'peace';
 let stageText = '国际秩序和平稳定 (0~24%)';

 if (tension >= 75) {
  stage = 'world_war';
  stageText = '全面世界大战风暴 (75~100%)';
 } else if (tension >= 50) {
  stage = 'escalation';
  stageText = '区域危机全面升级 (50~74%)';
 } else if (tension >= 25) {
  stage = 'friction';
  stageText = '地缘阵营局部摩擦 (25~49%)';
 }

 return { tension, stage, stageText, reasons };
}
