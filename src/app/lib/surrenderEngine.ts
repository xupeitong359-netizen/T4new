import {
 Nation,
 SurrenderCalculationResult,
 SurrenderFactorItem,
 SurrenderTierInfo,
 SurrenderTierKey,
 CapitulationResolution,
 BattleSimulationReport,
 AllianceFaction,
 LendLeaseOffer,
 ProvinceData,
} from '../types';
import { getTotalMilitaryFactories } from './militaryIndustry';
import { getTotalCivilianFactories } from './economyEngine';

/**
 * 投降状态分级配置
 */
export const SURRENDER_TIERS: Record<SurrenderTierKey, SurrenderTierInfo> = {
 resolute: {
  tier: 'resolute',
  label: '意志坚定',
  description: '国家仍拥有强大的战争意志与战略纵深，全军斗志昂扬。',
  badgeBg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400',
  badgeText: 'text-emerald-700 dark:text-emerald-400',
  progressBarColor: 'bg-emerald-500',
  colorHex: '#10b981',
 },
 stable: {
  tier: 'stable',
  label: '局势稳定',
  description: '战争局势尚未对国家生存构成严重威胁，社会与国防运转平稳。',
  badgeBg: 'bg-teal-500/10 border-teal-500/30 text-teal-600 dark:text-teal-400',
  badgeText: 'text-teal-700 dark:text-teal-400',
  progressBarColor: 'bg-teal-500',
  colorHex: '#14b8a6',
 },
 tense: {
  tier: 'tense',
  label: '战事紧张',
  description: '战争正在对国家财政与边防造成明显压力，战线呈现胶着。',
  badgeBg: 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400',
  badgeText: 'text-amber-700 dark:text-amber-400',
  progressBarColor: 'bg-amber-500',
  colorHex: '#f59e0b',
 },
 dangerous: {
  tier: 'dangerous',
  label: '前线危险',
  description: '国家已经开始出现严重的战争疲劳，部分防区告急，物资紧缺。',
  badgeBg: 'bg-orange-500/10 border-orange-500/30 text-orange-600 dark:text-orange-400',
  badgeText: 'text-orange-700 dark:text-orange-400',
  progressBarColor: 'bg-orange-500',
  colorHex: '#f97316',
 },
 critical: {
  tier: 'critical',
  label: '战局危急',
  description: '国家距离投降已经非常接近，主权核心受损，民意与军心剧烈动摇。',
  badgeBg: 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400',
  badgeText: 'text-rose-700 dark:text-rose-400',
  progressBarColor: 'bg-rose-600',
  colorHex: '#e11d48',
 },
 collapsing: {
  tier: 'collapsing',
  label: '濒临崩溃',
  description: '国家的战争意志正在迅速瓦解，指挥链破裂，随时可能宣布投降。',
  badgeBg: 'bg-purple-900/20 border-purple-600/40 text-purple-600 dark:text-purple-400',
  badgeText: 'text-purple-700 dark:text-purple-400',
  progressBarColor: 'bg-purple-600',
  colorHex: '#9333ea',
 },
 capitulated: {
  tier: 'capitulated',
  label: '已正式投降',
  description: '国家已经失去继续战争的能力与意志，已签署无条件停火与战败结算公报。',
  badgeBg: 'bg-slate-900 border-slate-700 text-slate-300',
  badgeText: 'text-slate-400',
  progressBarColor: 'bg-slate-700',
  colorHex: '#475569',
 },
};

export function getSurrenderTier(progress: number, isCapitulated: boolean): SurrenderTierInfo {
 if (isCapitulated || progress >= 100) return SURRENDER_TIERS.capitulated;
 if (progress >= 90) return SURRENDER_TIERS.collapsing;
 if (progress >= 75) return SURRENDER_TIERS.critical;
 if (progress >= 60) return SURRENDER_TIERS.dangerous;
 if (progress >= 40) return SURRENDER_TIERS.tense;
 if (progress >= 20) return SURRENDER_TIERS.stable;
 return SURRENDER_TIERS.resolute;
}

/**
 * 1. 国土控制率非线性连续插值计算
 * 敌方控制国土比例 (0.0 ~ 1.0) 映射至 (0 ~ 100)
 */
export function calculateTerritoryOccupiedPressure(ratio: number): number {
 const r = Math.max(0, Math.min(1, ratio));
 if (r <= 0) return 0;
 if (r <= 0.10) return (r / 0.10) * 5;
 if (r <= 0.25) return 5 + ((r - 0.10) / 0.15) * 10;
 if (r <= 0.40) return 15 + ((r - 0.25) / 0.15) * 15;
 if (r <= 0.50) return 30 + ((r - 0.40) / 0.10) * 10;
 if (r <= 0.60) return 40 + ((r - 0.50) / 0.10) * 15;
 if (r <= 0.70) return 55 + ((r - 0.60) / 0.10) * 15;
 if (r <= 0.80) return 70 + ((r - 0.70) / 0.10) * 15;
 if (r <= 0.90) return 85 + ((r - 0.80) / 0.10) * 10;
 return 95 + ((r - 0.90) / 0.10) * 5;
}

/**
 * 2. 战争支持度推导 (0 ~ 100)
 */
export function deriveWarSupport(
 nation: Nation,
 occupiedRatio: number,
 isCapitalOccupied: boolean,
 activeWarCount: number,
 recentDefeatsScore: number
): number {
 if (nation.warSupport !== undefined && nation.warSupport !== null) {
  return Math.max(0, Math.min(100, nation.warSupport));
 }

 // 基础民意与稳定度
 const baseStability = nation.stabilityIndex ?? 70;
 const baseApproval = nation.popularApproval ?? 75;
 let support = (baseStability * 0.4 + baseApproval * 0.6);

 // 军国政体提供战争支持加成
 if (nation.regime === '军政府/军国主义' || nation.ideology === '激进军国主义') {
  support += 15;
 } else if (nation.ideology === '中立和平主义') {
  support -= 15;
 }

 // 国土沦陷损耗
 support -= occupiedRatio * 40;

 // 首都沦陷沉重打击民心
 if (isCapitalOccupied) {
  support -= 25;
 }

 // 战败累积打击
 support -= (recentDefeatsScore / 30) * 20;

 // 多线作战疲劳
 if (activeWarCount > 1) {
  support -= (activeWarCount - 1) * 8;
 }

 return Math.max(0, Math.min(100, Math.round(support)));
}

/**
 * 3. 战争支持度对应的投降压力计算
 */
export function calculateWarSupportPressure(warSupport: number): number {
 const ws = Math.max(0, Math.min(100, warSupport));
 if (ws >= 80) return 0;
 if (ws >= 60) return ((80 - ws) / 20) * 5;
 if (ws >= 40) return 5 + ((60 - ws) / 20) * 5;
 if (ws >= 20) return 10 + ((40 - ws) / 20) * 10;
 return 20 + ((20 - ws) / 20) * 15; // ws=0 时为 35
}

/**
 * 4. 国家抵抗系数 (Surrender Resistance Modifier)
 * 返回范围 -0.5 ~ +0.5 (正数代表更顽强，降低有效投降压力)
 */
export function calculateNationalResistance(nation: Nation): number {
 if (nation.surrenderResistance !== undefined) {
  return nation.surrenderResistance;
 }

 let resistance = 0.0;

 // 政体与意识形态
 if (nation.regime === '军政府/军国主义' || nation.ideology === '激进军国主义') {
  resistance += 0.20;
 } else if (nation.regime === '封建帝国' || nation.ideology === '扩张威权主义') {
  resistance += 0.10;
 } else if (nation.regime === '自由城邦自治' || nation.ideology === '中立和平主义') {
  resistance -= 0.10;
 }

 // 稳定性影响
 const stability = nation.stabilityIndex ?? 70;
 if (stability >= 85) {
  resistance += 0.10;
 } else if (stability < 30) {
  resistance -= 0.25; // 政治严重动荡
 } else if (stability < 50) {
  resistance -= 0.10;
 }

 // 法令加成 (如全民防卫强制服役法)
 if (nation.activeDecreeIds?.includes('decree_mandatory_conscription')) {
  resistance += 0.10;
 }

 return Math.max(-0.4, Math.min(0.4, Number(resistance.toFixed(2))));
}

export interface SurrenderCalculationOptions {
 allNations?: Nation[];
 alliances?: AllianceFaction[];
 lendLeaseOffers?: LendLeaseOffer[];
 battleReports?: BattleSimulationReport[];
 overrideOccupiedProvinces?: string[];
 overrideCapitalOccupied?: boolean;
}

/**
 * 核心：综合计算国家当前的投降倾向
 */
export function calculateSurrenderProgress(
 nation: Nation,
 options: SurrenderCalculationOptions = {}
): SurrenderCalculationResult {
 const {
  allNations = [],
  alliances = [],
  lendLeaseOffers = [],
  battleReports = [],
  overrideOccupiedProvinces,
  overrideCapitalOccupied,
 } = options;

 const factors: SurrenderFactorItem[] = [];

 // 已投降状态直接锁死 100
 if (nation.isCapitulated) {
  return {
   nationId: nation.id,
   nationName: nation.name,
   rawPressure: 100,
   effectiveProgress: 100,
   threshold: nation.surrenderThreshold ?? 100,
   isCapitulated: true,
   tier: SURRENDER_TIERS.capitulated,
   resistanceModifier: 0,
   topFactors: [
    {
     id: 'capitulation_treaty',
     label: '已签署战败投降条约',
     value: 100,
     description: `该国已正式投降${nation.capitulatedToNationName ? `于【${nation.capitulatedToNationName}】` : ''}，全境转入战后停火整肃。`,
     category: 'territory',
    },
   ],
   allFactors: [],
   details: {
    territoryOccupiedPercent: 100,
    capitalOccupied: true,
    coreTerritoryLostPercent: 100,
    militaryStrengthRatio: 0,
    warSupport: 0,
    recentDefeatsPressure: 30,
    economicCollapsePressure: 25,
    allianceAidModifier: 0,
    warDurationDays: 0,
    warDurationPressure: 0,
   },
  };
 }

 const activeWars = nation.activeWars || [];
 const isAtWar = activeWars.length > 0;

 // 1. 国土占领率计算
 const provinces = nation.provinces || [];
 const totalProvincesCount = Math.max(1, provinces.length);
 const occupiedList = overrideOccupiedProvinces ?? nation.occupiedProvinces ?? [];
 const occupiedCount = occupiedList.length;
 const occupiedRatio = Math.min(1, occupiedCount / totalProvincesCount);
 const territoryPressure = calculateTerritoryOccupiedPressure(occupiedRatio);

 if (territoryPressure > 0) {
  factors.push({
   id: 'territory_occupied',
   label: `国土沦陷 (${Math.round(occupiedRatio * 100)}%)`,
   value: Math.round(territoryPressure),
   description: `已有 ${occupiedCount}/${totalProvincesCount} 个省份领土被敌军控制，国土沦陷带来严重战略恐慌。`,
   category: 'territory',
  });
 }

 // 2. 首都被占领
 const isCapOccupied = overrideCapitalOccupied !== undefined
  ? overrideCapitalOccupied
  : (nation.capitalOccupied || occupiedList.some((p) => p.toLowerCase().includes(nation.capital?.toLowerCase() || '---')));

 if (isCapOccupied) {
  factors.push({
   id: 'capital_occupied',
   label: '最高法定首都失守',
   value: 30,
   description: `国家法定首都【${nation.capital}】已被敌军占领，最高统帅部被迫转移，指挥中枢遭受重创。`,
   category: 'capital',
  });
 }

 // 3. 核心领土控制 (首都有关省份与前 50% 固有省份)
 const coreProvinces = provinces.slice(0, Math.ceil(totalProvincesCount / 2));
 const lostCoreCount = coreProvinces.filter((p) => occupiedList.includes(typeof p === 'string' ? p : p.name)).length;
 const coreLostRatio = coreProvinces.length > 0 ? lostCoreCount / coreProvinces.length : 0;
 let coreExtraPressure = 0;

 if (coreLostRatio > 0.8) {
  coreExtraPressure = 20;
  factors.push({
   id: 'core_territory_critical',
   label: `核心领土严重沦陷 (${Math.round(coreLostRatio * 100)}%)`,
   value: 20,
   description: '超过 80% 的国家核心固有领土已丢失，国家根基处于极度危险状态。',
   category: 'territory',
  });
 } else if (coreLostRatio > 0.5) {
  coreExtraPressure = 10;
  factors.push({
   id: 'core_territory_major',
   label: `核心领土大量失守 (${Math.round(coreLostRatio * 100)}%)`,
   value: 10,
   description: '超过半数核心本土省份沦入敌手，国民经济命脉被切断。',
   category: 'territory',
  });
 }

 // 4. 军队与军事力量损耗
 const totalMilFactories = getTotalMilitaryFactories(nation);
 const stockpiles = nation.militaryIndustry?.stockpiles || {};
 let totalEquipments = 0;
 Object.values(stockpiles).forEach((v) => { totalEquipments += (typeof v === 'number' ? v : 0); });

 // 估算军队实力 (0 ~ 100)
 let militaryStrength = nation.militaryStrength;
 if (militaryStrength === undefined) {
  // 自动根据军工厂与库存计算
  const expectedBaseFactories = Math.max(3, provinces.length * 2);
  const milFactoryRatio = Math.min(1.2, totalMilFactories / expectedBaseFactories);
  const equipScore = Math.min(1.2, totalEquipments / 2000);
  militaryStrength = Math.round(((milFactoryRatio * 0.6 + equipScore * 0.4)) * 100);
 }

 let milPressure = 0;
 if (militaryStrength < 10) {
  milPressure = 40;
  factors.push({
   id: 'military_destroyed',
   label: '主力部队濒临全歼 (战力<10%)',
   value: 40,
   description: '现役国防武装力量遭受毁灭性打击，已无成建制野战兵团可用。',
   category: 'military',
  });
 } else if (militaryStrength < 25) {
  milPressure = 25;
  factors.push({
   id: 'military_collapsed',
   label: '武装力量严重不足 (战力<25%)',
   value: 25,
   description: '陆海空部队损耗殆尽，装备严重短缺，难以维系战线布防。',
   category: 'military',
  });
 } else if (militaryStrength < 50) {
  milPressure = 10;
  factors.push({
   id: 'military_weakened',
   label: '战备军事力量明显减退 (战力<50%)',
   value: 10,
   description: '战前储备与工业动员力量消耗过半，防线多处出现缺口。',
   category: 'military',
  });
 }

 // 5. 战争支持度推导与压力
 const recentDefeatsScore = nation.recentDefeats ?? 0;
 const warSupport = deriveWarSupport(nation, occupiedRatio, isCapOccupied, activeWars.length, recentDefeatsScore);
 const warSupportPressure = calculateWarSupportPressure(warSupport);

 if (warSupportPressure > 0) {
  factors.push({
   id: 'war_support_low',
   label: `战争支持度低下 (${warSupport}%)`,
   value: Math.round(warSupportPressure),
   description: `民众反战情绪蔓延，战争支持度跌落至 ${warSupport}%，后方厌战呼声剧烈。`,
   category: 'warsupport',
  });
 }

 // 6. 连续战败机制 (上限 30)
 // 分析战役历史
 let defeatPressure = recentDefeatsScore;
 if (nation.recentDefeats === undefined && battleReports.length > 0) {
  const nationBattles = battleReports.filter(
   (b) => b.attackerNationId === nation.id || b.defenderNationId === nation.id
  );
  let streakLosses = 0;
  for (const b of nationBattles.slice(0, 5)) {
   const isAttacker = b.attackerNationId === nation.id;
   const isDefeat = (isAttacker && b.winner === 'defender') || (!isAttacker && b.winner === 'attacker');
   if (isDefeat) {
    streakLosses += b.territoryCeded ? 10 : 5;
   } else if (b.winner !== 'draw') {
    streakLosses = Math.max(0, streakLosses - 6);
   }
  }
  defeatPressure = Math.min(30, streakLosses);
 }

 if (defeatPressure > 0) {
  factors.push({
   id: 'recent_defeats',
   label: `战役连败打击 (+${defeatPressure})`,
   value: defeatPressure,
   description: '近期连续在多次重大战役中遭遇军事惨败，前线官兵心理防线受创。',
   category: 'defeats',
  });
 }

 // 7. 经济崩溃影响 (上限 25)
 let econPressure = 0;
 const treasury = nation.economy?.baseTreasury ?? 50000;
 const totalCivFactories = getTotalCivilianFactories(nation);

 if (treasury < -10000) {
  econPressure += 15;
  factors.push({
   id: 'treasury_bankruptcy',
   label: '国家财政破产赤字',
   value: 15,
   description: '国库严重枯竭，财政已无法支撑战时庞大军费与后勤补给运转。',
   category: 'economy',
  });
 } else if (treasury < 0) {
  econPressure += 5;
  factors.push({
   id: 'treasury_deficit',
   label: '财政赤字运行',
   value: 5,
   description: '国库进入赤字阶段，战备采购面临资金短缺。',
   category: 'economy',
  });
 }

 if (totalCivFactories < Math.max(2, provinces.length)) {
  const indusLoss = 10;
  econPressure += indusLoss;
  factors.push({
   id: 'industry_paralyzed',
   label: '工业生产能力大幅萎缩',
   value: indusLoss,
   description: '民用与工业基建设施遭受严重破坏，战时生产供给能力下降超过 50%。',
   category: 'economy',
  });
 }
 econPressure = Math.min(25, econPressure);

 // 8. 盟友与外援机制 (-25 ~ +35)
 let allianceModifier = 0;
 if (nation.allianceId) {
  const faction = alliances.find((a) => a.id === nation.allianceId);
  if (faction) {
   const allyNations = allNations.filter(
    (n) => faction.memberNationIds.includes(n.id) && n.id !== nation.id
   );
   const activeAllies = allyNations.filter((n) => !n.isCapitulated);
   const capitulatedAllies = allyNations.filter((n) => n.isCapitulated);

   if (allyNations.length > 0) {
    if (activeAllies.length === 0 && capitulatedAllies.length > 0) {
     // 所有主要盟友均已投降 (多米诺骨牌效应)
     allianceModifier += 35;
     factors.push({
      id: 'all_allies_capitulated',
      label: '军事盟友全线瓦解 (+35)',
      value: 35,
      description: `所属联盟【${faction.name}】的所有主要军事盟友均已战败投降，本国陷入战略绝对孤立！`,
      category: 'allies',
     });
    } else if (capitulatedAllies.length > 0) {
     // 部分盟友投降
     const allyCapPenalty = Math.min(20, capitulatedAllies.length * 10);
     allianceModifier += allyCapPenalty;
     factors.push({
      id: 'ally_capitulated',
      label: `同盟国战败连锁 (+${allyCapPenalty})`,
      value: allyCapPenalty,
      description: `盟国【${capitulatedAllies.map((a) => a.name).join('、')}】相继投降，产生严重的地缘战局多米诺效应。`,
      category: 'allies',
     });
    }

    // 强力活跃盟友参战支援
    if (activeAllies.length > 0) {
     const aidBonus = Math.min(25, activeAllies.length * 8);
     allianceModifier -= aidBonus;
     factors.push({
      id: 'allies_fighting',
      label: `多国盟军并肩作战 (-${aidBonus})`,
      value: -aidBonus,
      description: `拥有 ${activeAllies.length} 个强力同盟国共同分担前线压力，坚定了全国抵抗决心。`,
      category: 'allies',
     });
    }
   }
  }
 }

 // 获得租借外援
 const receivedLendLease = lendLeaseOffers.filter(
  (l) => l.receiverNationId === nation.id && l.status === 'accepted'
 );
 if (receivedLendLease.length > 0) {
  const aidDiscount = Math.min(15, receivedLendLease.length * 5);
  allianceModifier -= aidDiscount;
  factors.push({
   id: 'foreign_lend_lease',
   label: `国际战略租借军援 (-${aidDiscount})`,
   value: -aidDiscount,
   description: `获得外部盟国持续交付的战时军备与战略资金输送。`,
   category: 'allies',
  });
 }

 // 9. 战争持续时间 (辅助弱影响)
 let warDurationDays = 0;
 let warDurationPressure = 0;
 if (activeWars.length > 0) {
  const earliestWar = activeWars.reduce((min, w) => {
   const t = new Date(w.since).getTime();
   return t < min ? t : min;
  }, Date.now());
  warDurationDays = Math.max(0, Math.floor((Date.now() - earliestWar) / 86400000));

  if (warDurationDays >= 365) warDurationPressure = 8;
  else if (warDurationDays >= 180) warDurationPressure = 5;
  else if (warDurationDays >= 90) warDurationPressure = 3;
  else if (warDurationDays >= 30) warDurationPressure = 1;

  if (warDurationPressure > 0) {
   factors.push({
    id: 'war_duration',
    label: `持久战疲劳 (持续 ${warDurationDays} 天)`,
    value: warDurationPressure,
    description: `旷日持久的战事对社会生产与战备物资产生持续的慢性消耗。`,
    category: 'duration',
   });
  }
 }

 // 计算未经抵抗修正的原始总投降压力
 let rawPressure =
  territoryPressure +
  (isCapOccupied ? 30 : 0) +
  coreExtraPressure +
  milPressure +
  warSupportPressure +
  defeatPressure +
  econPressure +
  allianceModifier +
  warDurationPressure;

 rawPressure = Math.max(0, Math.min(150, rawPressure));

 // 10. 国家抵抗系数修正 (National Surrender Resistance)
 const resistance = calculateNationalResistance(nation);
 if (resistance !== 0) {
  const resistancePercent = Math.round(resistance * 100);
  factors.push({
   id: 'national_resilience',
   label: `国家战略抵抗韧性 (${resistancePercent > 0 ? `+${resistancePercent}%` : `${resistancePercent}%`})`,
   value: Math.round(-rawPressure * resistance),
   description:
    resistance > 0
     ? `依托军国主义动员与高度社会凝聚力，有效抵御了 ${resistancePercent}% 的投降压力。`
     : `受政治动荡与脆弱政体影响，国家承受的投降压力放大了 ${Math.abs(resistancePercent)}%。`,
   category: 'resistance',
  });
 }

 // 最终有效投降倾向 (0 ~ 100)
 const effectiveProgress = Math.max(
  0,
  Math.min(100, Math.round(rawPressure * (1 - resistance)))
 );

 const threshold = nation.surrenderThreshold ?? 100;
 const isCapitulated = effectiveProgress >= threshold;
 const tier = getSurrenderTier(effectiveProgress, isCapitulated);

 // 排序前 3~5 项最关键影响因素
 const sortedFactors = [...factors].sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
 const topFactors = sortedFactors.slice(0, 5);

 return {
  nationId: nation.id,
  nationName: nation.name,
  rawPressure: Math.round(rawPressure),
  effectiveProgress,
  threshold,
  isCapitulated,
  tier,
  resistanceModifier: resistance,
  topFactors,
  allFactors: sortedFactors,
  details: {
   territoryOccupiedPercent: Math.round(occupiedRatio * 100),
   capitalOccupied: isCapOccupied,
   coreTerritoryLostPercent: Math.round(coreLostRatio * 100),
   militaryStrengthRatio: militaryStrength,
   warSupport,
   recentDefeatsPressure: defeatPressure,
   economicCollapsePressure: econPressure,
   allianceAidModifier: allianceModifier,
   warDurationDays,
   warDurationPressure,
  },
 };
}

/**
 * 判断国家是否达到投降阈值
 */
export function checkCapitulation(nation: Nation, calculationResult?: SurrenderCalculationResult): boolean {
 if (nation.isCapitulated) return true;
 const res = calculationResult || calculateSurrenderProgress(nation);
 return res.effectiveProgress >= (nation.surrenderThreshold ?? 100);
}

/**
 * 完整投降战争结算引擎 (Capitulation Settlement Handler)
 */
export function handleCapitulation(
 capitulatedNation: Nation,
 victorNation: Nation,
 allNations: Nation[] = [],
 warId?: string
): {
 updatedCapitulatedNation: Nation;
 updatedVictorNation: Nation;
 resolution: CapitulationResolution;
 chronicleItem: any;
 broadcast: any;
} {
 const timestamp = new Date().toISOString();
 const dateStr = new Date().toLocaleDateString('zh-CN');

 // 1. 割让被占领的争议省份 / 边境省份
 const cedingProvinces: string[] = capitulatedNation.occupiedProvinces || [];
 if (cedingProvinces.length === 0 && capitulatedNation.provinces && capitulatedNation.provinces.length > 1) {
  // 若无单独占领标记，割让末尾非首都省份
  const nonCap = capitulatedNation.provinces.filter((p) => p.name !== capitulatedNation.capital);
  if (nonCap.length > 0) {
   cedingProvinces.push(nonCap[nonCap.length - 1].name);
  }
 }

 // 2. 计算战胜国获得的战争赔偿
 const reparations = Math.min(8000, Math.max(2000, (capitulatedNation.provinces?.length || 3) * 1200));

 // 3. 更新战败国数据：停止主动交战、清除与战胜国的战争
 const updatedWarsForDef = (capitulatedNation.activeWars || []).filter(
  (w) => w.withNationId !== victorNation.id
 );

 const remainingProvincesForDef: ProvinceData[] = (capitulatedNation.provinces || []).filter(
  (p) => !cedingProvinces.includes(p.name)
 );

 const updatedCapitulatedNation: Nation = {
  ...capitulatedNation,
  isCapitulated: true,
  capitulatedAt: timestamp,
  capitulatedToNationId: victorNation.id,
  capitulatedToNationName: victorNation.name,
  surrenderProgress: 100,
  activeWars: updatedWarsForDef,
  provinces: remainingProvincesForDef.length > 0 ? remainingProvincesForDef : capitulatedNation.provinces,
  occupiedProvinces: [],
  capitalOccupied: false,
  economy: capitulatedNation.economy
   ? {
     ...capitulatedNation.economy,
     baseTreasury: Math.max(0, capitulatedNation.economy.baseTreasury - reparations),
    }
   : undefined,
 };

 // 4. 更新战胜国数据：接收割让省份、获得赔偿
 const updatedWarsForAtt = (victorNation.activeWars || []).filter(
  (w) => w.withNationId !== capitulatedNation.id
 );

 const cededProvinceData: ProvinceData[] = cedingProvinces.map((provName, idx) => ({
  id: `prov_annex_${Date.now()}_${idx}`,
  name: provName,
  civilianFactories: 1,
  militaryFactories: 1,
  isCore: false,
  acquiredMethod: 'treaty_cession',
  occupationStatus: 'occupied',
 }));

 const updatedVictorNation: Nation = {
  ...victorNation,
  activeWars: updatedWarsForAtt,
  provinces: [...(victorNation.provinces || []), ...cededProvinceData],
  economy: victorNation.economy
   ? {
     ...victorNation.economy,
     baseTreasury: (victorNation.economy.baseTreasury || 0) + reparations,
    }
   : undefined,
 };

 // 5. 生成投降与战后处置决议公报
 const resolution: CapitulationResolution = {
  id: 'res_' + Math.random().toString(36).substring(2, 11),
  capitulatedNationId: capitulatedNation.id,
  capitulatedNationName: capitulatedNation.name,
  victorNationId: victorNation.id,
  victorNationName: victorNation.name,
  warId,
  timestamp,
  terms: {
   cededProvinces: cedingProvinces,
   reparationsTotal: reparations,
   demilitarizedZones: [capitulatedNation.capital + ' 边境缓冲区'],
   enforcePeaceYears: 5,
  },
  summary: `【${capitulatedNation.name}】投降倾向达到阈值正式投降！割让省份【${cedingProvinces.join('、') || '边境要塞'}】，向【${victorNation.name}】赔款 ${reparations} 产能，全境立即停战！`,
 };

 // 6. 国家编年史与紧急通报
 const chronicleItem = {
  id: 'chr_cap_' + Date.now(),
  date: dateStr,
  title: `国家战争公报：${capitulatedNation.name} 宣告战败投降`,
  category: 'war' as const,
  description: `由于国土大部沦陷且战争意志瓦解，本国正式向【${victorNation.name}】签署无条件停火公报，割让领土并赔款 ${reparations} 产能。`,
 };

 const broadcast = {
  id: 'bc_cap_' + Date.now(),
  senderNationId: victorNation.id,
  senderNationName: victorNation.name,
  senderOwnerName: victorNation.ownerUsername,
  title: ` 重大地缘通报：【${capitulatedNation.name}】已正式宣告战败投降！`,
  content: `在最高军事统帅部与盟军的全力推进下，【${capitulatedNation.name}】战争意志彻底崩溃并达到投降阈值，双方签署全面停火协议！`,
  category: 'war' as const,
  createdAt: timestamp,
 };

 return {
  updatedCapitulatedNation,
  updatedVictorNation,
  resolution,
  chronicleItem,
  broadcast,
 };
}
