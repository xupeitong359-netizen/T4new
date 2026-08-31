// =============================================================================
// STRATEGIC COMMAND & WARFARE ENGINE (国家战略指挥与战争全局推演引擎)
// 包含：
// 1. 陆军部队地图调动与行军向量
// 2. 前线战线计算与进攻线矛头向量
// 3. 战区态势、伤亡推演与历史时间轴数据
// 4. 省份动态占领度 (0% - 100%) 与战时破坏
// 5. 国家人口动态模型 (出生/死亡/战争减员/移民/多跨度增长预测)
// 6. 稳定度精细化因子驱动模型
// 7. 省份叛乱与驻军治安镇压系统
// 8. 政治体制与国家加成 (National Modifiers)
// 9. 执政党与政治支持度动态分布
// 10. 国际战略禁运与贸易制裁体系
// 11. 7大战略资源全球储量、每日产耗与库存中枢
// =============================================================================

import { Nation, ProvinceData, ArmyDivision } from '../types';
import { getTotalCivilianFactories } from './economyEngine';

// -----------------------------------------------------------------------------
// 1. 战略资源体系 (6大核心战略资源：石油、钢铁、铝、橡胶、钨、铬)
// -----------------------------------------------------------------------------
export type StrategicResourceType =
 | 'oil'
 | 'steel'
 | 'aluminium'
 | 'rubber'
 | 'tungsten'
 | 'chromium';

export interface ResourceDefinition {
 id: StrategicResourceType;
 name: string;
 unit: string;
 color: string;
 badgeBg: string;
 badgeText: string;
 icon: string; // Text symbol / icon code
 description: string;
 baseMarketPrice: number; // 玲玉币单价
 militaryUsage: string;
 civilianUsage: string;
}

export const STRATEGIC_RESOURCES: Record<StrategicResourceType, ResourceDefinition> = {
 oil: {
  id: 'oil',
  name: '石油',
  unit: '桶',
  color: '#0f172a',
  badgeBg: 'bg-slate-900 text-amber-300 border-amber-500/30',
  badgeText: 'text-amber-400',
  icon: 'OIL',
  description: '重装甲部队、航空兵团、远洋战舰与现代后勤车队的命脉动力血液。',
  baseMarketPrice: 48,
  militaryUsage: '机械化装甲突击、战术空战轰炸、后勤补给车队、远洋舰船动力',
  civilianUsage: '重化工业合成、燃油发电、现代远洋航运',
 },
 steel: {
  id: 'steel',
  name: '钢铁',
  unit: '吨',
  color: '#475569',
  badgeBg: 'bg-slate-800 text-slate-100 border-slate-600',
  badgeText: 'text-slate-200',
  icon: 'STEEL',
  description: '单兵步枪枪械、大口径火炮、装甲底盘、舰体装甲与工业建设的坚固骨架。',
  baseMarketPrice: 28,
  militaryUsage: '单兵制式枪械、压制火炮铸造、装甲车体底盘、军用舰艇船体',
  civilianUsage: '铁路轨道扩建、民用工厂骨架、大型桥梁与重工业建筑基建',
 },
 aluminium: {
  id: 'aluminium',
  name: '铝',
  unit: '吨',
  color: '#0284c7',
  badgeBg: 'bg-sky-950 text-sky-200 border-sky-600',
  badgeText: 'text-sky-400',
  icon: 'AL',
  description: '战斗机翼身结构、轻量化引擎机体与战术无线电雷达元件的核心材料。',
  baseMarketPrice: 42,
  militaryUsage: '主力航空战机制造、精密火控雷达、高机动轻装甲装具',
  civilianUsage: '高压电网输变电、民用航空与现代汽车工业',
 },
 rubber: {
  id: 'rubber',
  name: '橡胶',
  unit: '吨',
  color: '#059669',
  badgeBg: 'bg-emerald-950 text-emerald-200 border-emerald-600',
  badgeText: 'text-emerald-300',
  icon: 'RUB',
  description: '军用卡车充气防弹轮胎、战机起落架减震轮与电气防水绝缘层的关键工业原料。',
  baseMarketPrice: 55,
  militaryUsage: '军用越野运输卡车轮胎、战机起落架轮胎、装甲步战车、战地绝缘防护',
  civilianUsage: '民用载重汽车轮胎、工业传动输送带、电气与医用绝缘器材',
 },
 tungsten: {
  id: 'tungsten',
  name: '钨',
  unit: '吨',
  color: '#d97706',
  badgeBg: 'bg-amber-950 text-amber-200 border-amber-600',
  badgeText: 'text-amber-300',
  icon: 'W',
  description: '超硬穿甲弹丸、重型加农火炮炮管与先进反坦克穿甲弹的核心特种战略金属。',
  baseMarketPrice: 68,
  militaryUsage: '高级压制火炮身管、穿甲重炮弹头、反坦克炮弹药、特种破甲弹',
  civilianUsage: '重型耐磨机械切削刀具、耐高温电子电极、高温炉材',
 },
 chromium: {
  id: 'chromium',
  name: '铬',
  unit: '吨',
  color: '#7c3aed',
  badgeBg: 'bg-purple-950 text-purple-200 border-purple-600',
  badgeText: 'text-purple-300',
  icon: 'CR',
  description: '重型装甲特种合金钢、高耐磨枪炮管与先进战机涡轮叶片的关键战略添加剂。',
  baseMarketPrice: 75,
  militaryUsage: '特种重型装甲合金钢板、主力战舰主装甲带、航空涡轮发动机叶片',
  civilianUsage: '高端不锈钢、重工高耐磨轴承、耐腐蚀特种工业装备',
 },
};

export interface NationResourceStats {
 dailyProduction: number;
 dailyConsumption: number;
 netDaily: number;
 stockpile: number;
 importedDaily: number;
 exportedDaily: number;
 depositProvincesCount: number;
}

// -----------------------------------------------------------------------------
// 2. 陆军部队地图调动系统 (Army Tactical Movement & Frontlines)
// -----------------------------------------------------------------------------
export interface TacticalMovementOrder {
 divisionId: string;
 sourceProvinceId: string | number;
 sourceProvinceName: string;
 targetProvinceId: string | number;
 targetProvinceName: string;
 sourceCoords: [number, number]; // [x, y] in svg pixels
 targetCoords: [number, number]; // [x, y] in svg pixels
 startedAt: number; // timestamp
 etaSeconds: number; // total movement duration
 progressRatio: number; // 0.0 to 1.0
 mission: 'advance' | 'offensive_spearhead' | 'strategic_redeployment' | 'garrison_suppress';
}

export interface TacticalFrontline {
 id: string;
 name: string;
 warWithNationId: string;
 warWithNationName: string;
 assignedDivisionsCount: number;
 friendlyManpower: number;
 enemyEstimatedManpower: number;
 frontLengthKm: number;
 stance: 'balanced' | 'aggressive' | 'defensive';
 status: 'advancing' | 'stalemate' | 'retreating' | 'preparing';
 provinceIds: (string | number)[];
 attackSpearhead?: {
  targetProvinceId: string | number;
  targetProvinceName: string;
  targetCoords: [number, number];
  baseCoords: [number, number];
  offensiveProgress: number; // 0 to 100
 };
}

export interface WarTheaterSummary {
 warId: string;
 warName: string;
 adversaryNationId: string;
 adversaryNationName: string;
 startedAt: string;
 elapsedDays: number;
 status: 'active' | 'armistice' | 'decisive_victory' | 'capitulated';
 frontlinesCount: number;
 friendlyTroopsDeployed: number;
 hostileTroopsEstimated: number;
 friendlyCasualtiesTotal: number;
 enemyCasualtiesInflicted: number;
 friendlyProvincesLost: number;
 enemyProvincesOccupied: number;
 totalBattles: number;
 friendlyWinRate: number; // e.g. 68.5%
 frontlineAdvanceKm: number; // +35km or -12km
 battleIntensity: 'intense' | 'moderate' | 'low' | 'skirmish';
 historyTimeline: {
  dayOffset: number;
  date: string;
  friendlyForces: number;
  hostileForces: number;
  friendlyCasualties: number;
  enemyCasualties: number;
  territoryPushedKm: number;
  intensityIndex: number;
 }[];
}

// -----------------------------------------------------------------------------
// 3. 省份占领度与叛乱系统 (Province Occupation & Rebellion)
// -----------------------------------------------------------------------------
export interface ProvinceTacticalState {
 provinceId: string | number;
 provinceName: string;
 originalOwner: string;
 currentController: string;
 occupationRatio: number; // 0 to 100 (0% enemy, 50% contested, 100% full)
 occupationDays: number;
 garrisonStrength: number; // in soldiers
 garrisonSuppressionRate: number; // 0 to 100%
 stabilityIndex: number; // 0 to 100
 unrestLevel: number; // 0 to 100
 unrestRiskTier: 'calm' | 'tense' | 'high_risk' | 'insurgency' | 'uprising';
 unrestDrivers: { label: string; delta: number }[];
 warDevastation: number; // 0 to 100%
 strategicValue: number; // 1 to 5 stars
 resources: Partial<Record<StrategicResourceType, number>>; // deposit amount
}

// -----------------------------------------------------------------------------
// 4. 国家人口动态模型 (Demographics Dynamics)
// 规则：缓慢、稳定、单向增长机制。每日恒定 +0.01%，严格独立于战争、移民、政体、经济与稳定度
// -----------------------------------------------------------------------------
export const BASE_DAILY_POPULATION_GROWTH_RATE = 0.0001; // +0.01%/日 恒定基准增长率

export interface DemographicsState {
 currentPopulation: number;
 dailyGrowthRatePercent: number; // 恒定 +0.01%/日
 annualGrowthRatePercent: number; // 恒定年化复合增长率 ~+3.72%/年
 dailyNetGrowth: number; // 每日净增人口
 annualBirths: number;
 annualNaturalDeaths: number; // 规则：无负增长，为 0
 annualNetGrowth: number; // 年度净增人口，严格单向增长
 annualWarCasualties: number; // 规则：战争不削减总人口，为 0
 annualRefugeesAndMigration: number; // 规则：移民不增减全国总人口，为 0
 demographicHealthIndex: number; // 稳定度独立隔离指数 100
 systemIndependenceStatus: string;
 projections: {
  spanLabel: string;
  years: number;
  projectedPopulation: number;
  deltaPopulation: number;
 }[];
 historyCurve: {
  year: number;
  population: number;
  growthRate: number;
  casualties: number;
 }[];
}

// -----------------------------------------------------------------------------
// 5. 稳定度精细化因子模型 (Stability Factors)
// -----------------------------------------------------------------------------
export interface StabilityFactorBreakdown {
 currentScore: number; // 0 to 100
 monthlyTrendPercent: number; // e.g. +0.4% or -1.2%
 positiveFactors: { name: string; impact: number; desc: string }[];
 negativeFactors: { name: string; impact: number; desc: string }[];
 impacts: {
  factoryOutputBonusPercent: number;
  politicalPowerGainBonusPercent: number;
  conscriptionEfficiencyBonusPercent: number;
  insurgencyRiskModifierPercent: number;
 };
}

// -----------------------------------------------------------------------------
// 6. 政治体制与执政党 (Political Regime & Ruling Parties)
// -----------------------------------------------------------------------------
export interface PoliticalParty {
 id: string;
 name: string;
 ideologyName: string;
 supportPercent: number; // 0 to 100
 color: string;
 isRuling: boolean;
 leaderName: string;
 policyDoctrine: string;
 foreignPreference: string;
}

export interface RegimeModifier {
 name: string;
 type: 'buff' | 'debuff';
 value: string;
 description: string;
}

export interface PoliticalState {
 currentRegime: string;
 regimeNameZh: string;
 rulingParty: PoliticalParty;
 oppositionParties: PoliticalParty[];
 yearsInPower: number;
 governmentEfficiency: number; // 0 to 100%
 reformProgress: number; // 0 to 100%
 modifiers: RegimeModifier[];
}

// -----------------------------------------------------------------------------
// 7. 国际禁运与制裁系统 (Embargo & Sanctions)
// -----------------------------------------------------------------------------
export interface InternationalEmbargoItem {
 id: string;
 targetNationId: string;
 targetNationName: string;
 initiatorNationId: string;
 initiatorNationName: string;
 direction: 'imposed_by_me' | 'targeted_at_me';
 type: 'arms' | 'energy_oil' | 'strategic_metals' | 'total_trade';
 typeZh: string;
 reason: string;
 startedAt: string;
 elapsedDays: number;
 affectedResources: StrategicResourceType[];
 estimatedDailyTradeLossTreasury: number;
 targetIndustrialPenaltyPercent: number;
 status: 'active' | 'escalating' | 'lifted';
}

// =============================================================================
// ENGINE LOGIC & CALCULATORS
// =============================================================================

/**
 * Generates realistic provincial resource deposits based on realistic global geology and province attributes.
 * 真实地质资源分布：有的多、有的少、有的没有。
 * 包含：石油 (Oil)、钢铁 (Steel)、铝 (Aluminium)、橡胶 (Rubber)、钨 (Tungsten)、铬 (Chromium)
 */
export function getProvinceResourceDeposits(
 provinceId: string | number,
 provinceName?: string,
 properties?: any
): Partial<Record<StrategicResourceType, number>> {
 const numId = Number(provinceId || 1);
 const name = String(provinceName || '').toLowerCase();
 const deposits: Partial<Record<StrategicResourceType, number>> = {};

 // If raw properties contain predefined resources, incorporate and scale them
 const rawResources = properties?.resources;
 if (rawResources && typeof rawResources === 'object') {
  if (typeof rawResources.oil === 'number' && rawResources.oil > 0) {
   deposits.oil = Math.round(rawResources.oil * 3.5);
  }
  if (typeof rawResources.steel === 'number' && rawResources.steel > 0) {
   deposits.steel = Math.round(rawResources.steel * 3.4);
  }
  if (typeof rawResources.iron === 'number' && rawResources.iron > 0) {
   deposits.steel = Math.max(deposits.steel || 0, Math.round(rawResources.iron * 3.4));
  }
  if (typeof rawResources.coal === 'number' && rawResources.coal > 0) {
   deposits.steel = Math.max(deposits.steel || 0, Math.round(rawResources.coal * 2.2));
  }
  if (typeof rawResources.aluminium === 'number' && rawResources.aluminium > 0) {
   deposits.aluminium = Math.round(rawResources.aluminium * 3.0);
  }
  if (typeof rawResources.tungsten === 'number' && rawResources.tungsten > 0) {
   deposits.tungsten = Math.round(rawResources.tungsten * 3.2);
  }
  if (typeof rawResources.chromium === 'number' && rawResources.chromium > 0) {
   deposits.chromium = Math.round(rawResources.chromium * 3.0);
  }
  if (typeof rawResources.rubber === 'number' && rawResources.rubber > 0) {
   deposits.rubber = Math.round(rawResources.rubber * 3.8);
  }
 }

 // 1. 石油 (Oil) 真实地理产区分布 (中东、高加索/巴库、德克萨斯、委内瑞拉、北海、波斯湾、西伯利亚、大庆等)
 if (
  name.includes('texas') ||
  name.includes('houston') ||
  name.includes('baku') ||
  name.includes('kuwait') ||
  name.includes('riyadh') ||
  name.includes('mosul') ||
  name.includes('basra') ||
  name.includes('ahvaz') ||
  name.includes('khuzestan') ||
  name.includes('venezuela') ||
  name.includes('maracaibo') ||
  name.includes('ploesti') ||
  name.includes('california') ||
  name.includes('alaska') ||
  name.includes('oklahoma') ||
  name.includes('louisiana') ||
  name.includes('tyumen') ||
  name.includes('surgut') ||
  name.includes('tatarstan') ||
  name.includes('daqing') ||
  name.includes('heilongjiang') ||
  name.includes('dongying') ||
  name.includes('shengli') ||
  name.includes('tarim') ||
  name.includes('tripoli') ||
  name.includes('cyrenaica') ||
  name.includes('hassi messaoud') ||
  name.includes('cabinda') ||
  name.includes('niger delta') ||
  name.includes('sumatra') ||
  name.includes('palembang') ||
  name.includes('balikpapan') ||
  name.includes('brunei') ||
  name.includes('stavanger') ||
  name.includes('aberdeen')
 ) {
  deposits.oil = Math.max(deposits.oil || 0, 160 + (numId % 280));
 } else if (numId % 43 === 0) {
  // 少量次级零星油田
  deposits.oil = 40 + (numId % 70);
 }

 // 2. 钢铁 (Steel) 真实地理产区分布 (鲁尔区、宾夕法尼亚、马格尼托哥尔斯克、鞍山、洛林、顿巴斯、西里西亚、谢菲尔德、八幡、皮尔巴拉等)
 if (
  name.includes('ruhr') ||
  name.includes('rhineland') ||
  name.includes('westphalia') ||
  name.includes('silesia') ||
  name.includes('donbass') ||
  name.includes('donetsk') ||
  name.includes('krivoy') ||
  name.includes('magnitogorsk') ||
  name.includes('chelyabinsk') ||
  name.includes('anshan') ||
  name.includes('liaoning') ||
  name.includes('hebei') ||
  name.includes('tangshan') ||
  name.includes('wuhan') ||
  name.includes('baotou') ||
  name.includes('panzhihua') ||
  name.includes('pennsylvania') ||
  name.includes('pittsburgh') ||
  name.includes('mesabi') ||
  name.includes('minnesota') ||
  name.includes('lorraine') ||
  name.includes('metz') ||
  name.includes('sheffield') ||
  name.includes('wales') ||
  name.includes('yawata') ||
  name.includes('kyushu') ||
  name.includes('kiruna') ||
  name.includes('bergslagen') ||
  name.includes('pilbara') ||
  name.includes('carajas') ||
  name.includes('minas gerais') ||
  name.includes('odisha') ||
  name.includes('bhilai') ||
  name.includes('bilbao') ||
  name.includes('katowice')
 ) {
  deposits.steel = Math.max(deposits.steel || 0, 180 + (numId % 320));
 } else if (numId % 37 === 0) {
  deposits.steel = 45 + (numId % 80);
 }

 // 3. 铝 (Aluminium/Bauxite) 真实地理产区分布 (几内亚、牙买加、苏里南、昆士兰、普罗旺斯、广西百色、贵州、河南三门峡、乌拉尔等)
 if (
  name.includes('guinea') ||
  name.includes('boke') ||
  name.includes('jamaica') ||
  name.includes('kingston') ||
  name.includes('guyana') ||
  name.includes('suriname') ||
  name.includes('weipa') ||
  name.includes('queensland') ||
  name.includes('gove') ||
  name.includes('boddington') ||
  name.includes('provence') ||
  name.includes('baux') ||
  name.includes('bakony') ||
  name.includes('hungary') ||
  name.includes('parnassus') ||
  name.includes('greece') ||
  name.includes('guangxi') ||
  name.includes('baise') ||
  name.includes('sanmenxia') ||
  name.includes('henan') ||
  name.includes('guizhou') ||
  name.includes('guiyang') ||
  name.includes('shandong') ||
  name.includes('arkansas') ||
  name.includes('saline') ||
  name.includes('trombetas') ||
  name.includes('severouralsk') ||
  name.includes('panchpatmali')
 ) {
  deposits.aluminium = Math.max(deposits.aluminium || 0, 150 + (numId % 260));
 } else if (numId % 47 === 0) {
  deposits.aluminium = 35 + (numId % 65);
 }

 // 4. 橡胶 (Rubber) 真实地理产区分布 (马来亚、印尼苏门答腊/爪哇/婆罗洲、中南半岛/越南/泰国、斯里兰卡、亚马逊雨林、利比里亚、海南云南等)
 if (
  name.includes('malaya') ||
  name.includes('kuala lumpur') ||
  name.includes('selangor') ||
  name.includes('perak') ||
  name.includes('johor') ||
  name.includes('penang') ||
  name.includes('singapore') ||
  name.includes('sumatra') ||
  name.includes('medan') ||
  name.includes('jambi') ||
  name.includes('java') ||
  name.includes('bandung') ||
  name.includes('surabaya') ||
  name.includes('borneo') ||
  name.includes('kalimantan') ||
  name.includes('sarawak') ||
  name.includes('sabah') ||
  name.includes('cochinchina') ||
  name.includes('saigon') ||
  name.includes('indochina') ||
  name.includes('vietnam') ||
  name.includes('cambodia') ||
  name.includes('kampong cham') ||
  name.includes('thailand') ||
  name.includes('songkhla') ||
  name.includes('phuket') ||
  name.includes('tenasserim') ||
  name.includes('ceylon') ||
  name.includes('sri lanka') ||
  name.includes('colombo') ||
  name.includes('kerala') ||
  name.includes('liberia') ||
  name.includes('firestone') ||
  name.includes('monrovia') ||
  name.includes('amazon') ||
  name.includes('manaus') ||
  name.includes('hainan') ||
  name.includes('xishuangbanna') ||
  name.includes('acre')
 ) {
  deposits.rubber = Math.max(deposits.rubber || 0, 180 + (numId % 360));
 } else if (numId % 59 === 0 && (name.includes('tropical') || name.includes('south') || numId % 2 === 0)) {
  deposits.rubber = 35 + (numId % 70);
 }

 // 5. 钨 (Tungsten) 真实地理产区分布 (中国江西赣州/湖南大余/广东、葡萄牙帕纳什凯拉、玻利维亚波托西、缅甸土瓦、朝鲜半岛上东、科罗拉多克莱马克斯等)
 if (
  name.includes('jiangxi') ||
  name.includes('ganzhou') ||
  name.includes('dayu') ||
  name.includes('hunan') ||
  name.includes('chenzhou') ||
  name.includes('guangdong') ||
  name.includes('shaoguan') ||
  name.includes('panasqueira') ||
  name.includes('covilha') ||
  name.includes('portugal') ||
  name.includes('bolivia') ||
  name.includes('potosi') ||
  name.includes('oruro') ||
  name.includes('burma') ||
  name.includes('myanmar') ||
  name.includes('tavoy') ||
  name.includes('mawchi') ||
  name.includes('korea') ||
  name.includes('sangdong') ||
  name.includes('gangwon') ||
  name.includes('climax') ||
  name.includes('colorado') ||
  name.includes('california') ||
  name.includes('nevada') ||
  name.includes('bishop') ||
  name.includes('tyrnyauz') ||
  name.includes('dzhida') ||
  name.includes('king island') ||
  name.includes('tasmania') ||
  name.includes('galicia') ||
  name.includes('salamanca') ||
  name.includes('nui phao')
 ) {
  deposits.tungsten = Math.max(deposits.tungsten || 0, 160 + (numId % 310));
 } else if (numId % 49 === 0) {
  deposits.tungsten = 30 + (numId % 65);
 }

 // 6. 铬 (Chromium) 真实地理产区分布 (南非布什维尔德、土耳其居莱曼、哈萨克斯坦阿克托别/赫罗姆套、津巴布韦、印度苏金达、阿尔巴尼亚等)
 if (
  name.includes('bushveld') ||
  name.includes('rustenburg') ||
  name.includes('transvaal') ||
  name.includes('lydenburg') ||
  name.includes('great dyke') ||
  name.includes('zimbabwe') ||
  name.includes('guleman') ||
  name.includes('elazig') ||
  name.includes('fethiye') ||
  name.includes('turkey') ||
  name.includes('aktobe') ||
  name.includes('kromtau') ||
  name.includes('khromtau') ||
  name.includes('sukinda') ||
  name.includes('jajpur') ||
  name.includes('odisha') ||
  name.includes('bulqize') ||
  name.includes('albania') ||
  name.includes('kemi') ||
  name.includes('finland') ||
  name.includes('zambales') ||
  name.includes('philippines') ||
  name.includes('moa') ||
  name.includes('cuba') ||
  name.includes('new caledonia') ||
  name.includes('tiebaghi') ||
  name.includes('tibet') ||
  name.includes('luobusa') ||
  name.includes('sartohay')
 ) {
  deposits.chromium = Math.max(deposits.chromium || 0, 140 + (numId % 290));
 } else if (numId % 53 === 0) {
  deposits.chromium = 30 + (numId % 60);
 }

 return deposits;
}

/**
 * Calculates national balance sheet for all 6 strategic resources.
 */
export function calculateNationResourceOverview(
 nation: Nation | null | undefined
): Record<StrategicResourceType, NationResourceStats> {
 const provinces = nation?.provinces || [];
 const civFactories = getTotalCivilianFactories(nation);
 const milFactories = nation?.militaryFactories || (nation?.militaryIndustry?.productionLines?.length || 6);
 const armyDivisions = nation?.army?.divisions?.length || 4;

 const result: Record<StrategicResourceType, NationResourceStats> = {
  oil: { dailyProduction: 0, dailyConsumption: 0, netDaily: 0, stockpile: 2400, importedDaily: 0, exportedDaily: 0, depositProvincesCount: 0 },
  steel: { dailyProduction: 0, dailyConsumption: 0, netDaily: 0, stockpile: 3600, importedDaily: 0, exportedDaily: 0, depositProvincesCount: 0 },
  aluminium: { dailyProduction: 0, dailyConsumption: 0, netDaily: 0, stockpile: 1800, importedDaily: 0, exportedDaily: 0, depositProvincesCount: 0 },
  rubber: { dailyProduction: 0, dailyConsumption: 0, netDaily: 0, stockpile: 1200, importedDaily: 0, exportedDaily: 0, depositProvincesCount: 0 },
  tungsten: { dailyProduction: 0, dailyConsumption: 0, netDaily: 0, stockpile: 1100, importedDaily: 0, exportedDaily: 0, depositProvincesCount: 0 },
  chromium: { dailyProduction: 0, dailyConsumption: 0, netDaily: 0, stockpile: 950, importedDaily: 0, exportedDaily: 0, depositProvincesCount: 0 },
 };

 // 1. Sum up province deposits for all currently owned/controlled provinces
 provinces.forEach((p) => {
  const deposits = getProvinceResourceDeposits(p.id, p.name, (p as any).properties);
  (Object.keys(deposits) as StrategicResourceType[]).forEach((resKey) => {
   const amt = deposits[resKey] || 0;
   if (amt > 0 && result[resKey]) {
    result[resKey].dailyProduction += amt;
    result[resKey].depositProvincesCount += 1;
   }
  });
 });

 // Default baseline production if country is established but lacks raw geographic matches
 if (result.oil.dailyProduction === 0 && provinces.length > 0) result.oil.dailyProduction = 42;
 if (result.steel.dailyProduction === 0 && provinces.length > 0) result.steel.dailyProduction = 86;
 if (result.aluminium.dailyProduction === 0 && provinces.length > 0) result.aluminium.dailyProduction = 31;
 if (result.rubber.dailyProduction === 0 && provinces.length > 0) result.rubber.dailyProduction = 12;
 if (result.tungsten.dailyProduction === 0 && provinces.length > 0) result.tungsten.dailyProduction = 8;
 if (result.chromium.dailyProduction === 0 && provinces.length > 0) result.chromium.dailyProduction = 15;

 // 2. Parse Trade Agreements (Imports & Exports)
 const activeDeals = nation?.strategicResourceTradeDeals || [];
 activeDeals.forEach((deal) => {
  if (deal.status === 'active' && deal.resourceType && result[deal.resourceType as StrategicResourceType]) {
   if (deal.importerNationId === nation?.id) {
    result[deal.resourceType as StrategicResourceType].importedDaily += deal.amount;
   } else if (deal.exporterNationId === nation?.id) {
    result[deal.resourceType as StrategicResourceType].exportedDaily += deal.amount;
   }
  }
 });

 // 3. Realistic Military & Civilian Consumption calculations
 // Parse active military production lines
 const prodLines = nation?.militaryIndustry?.productionLines || [];
 let lineOil = 0;
 let lineSteel = 0;
 let lineAlum = 0;
 let lineRub = 0;
 let lineTung = 0;
 let lineChrom = 0;

 prodLines.forEach((line) => {
  const facs = line.assignedFactories || 1;
  const eqId = line.equipmentId || '';
  const cat = line.category || '';

  if (cat === 'aviation' || eqId.includes('aircraft') || eqId.includes('fighter') || eqId.includes('bomber')) {
   lineAlum += facs * 4;
   lineRub += facs * 2;
   lineOil += facs * 3;
  } else if (cat === 'armor' || eqId.includes('tank')) {
   lineSteel += facs * 6;
   lineTung += facs * 3;
   lineChrom += facs * 2;
   lineOil += facs * 4;
  } else if (cat === 'artillery' || eqId.includes('artillery')) {
   lineSteel += facs * 4;
   lineTung += facs * 3;
  } else if (cat === 'motorized' || eqId.includes('truck')) {
   lineSteel += facs * 3;
   lineRub += facs * 3;
  } else if (cat === 'mechanized' || eqId.includes('mechanized')) {
   lineSteel += facs * 4;
   lineRub += facs * 2;
   lineTung += facs * 2;
  } else if (cat === 'support' || eqId.includes('support')) {
   lineSteel += facs * 2;
   lineAlum += facs * 2;
  } else {
   // Infantry rifles & basic equipment
   lineSteel += facs * 3;
  }
 });

 result.oil.dailyConsumption = Math.round(lineOil + armyDivisions * 4.2 + milFactories * 1.5);
 result.steel.dailyConsumption = Math.round(lineSteel + civFactories * 1.8 + milFactories * 2.0);
 result.aluminium.dailyConsumption = Math.round(lineAlum + civFactories * 0.5);
 result.rubber.dailyConsumption = Math.round(lineRub + armyDivisions * 1.2);
 result.tungsten.dailyConsumption = Math.round(lineTung);
 result.chromium.dailyConsumption = Math.round(lineChrom);

 // 4. Stockpile and Net Calculation
 (Object.keys(result) as StrategicResourceType[]).forEach((key) => {
  const item = result[key];
  item.netDaily = item.dailyProduction + item.importedDaily - item.dailyConsumption - item.exportedDaily;
  if (nation?.strategicResourceStockpiles && typeof nation.strategicResourceStockpiles[key] === 'number') {
   item.stockpile = nation.strategicResourceStockpiles[key];
  }
 });

 return result;
}

/**
 * Computes dynamic national demographics with 1Y, 5Y, 10Y, 25Y, 50Y curves.
 * 规则：缓慢、稳定、单向增长机制。
 * - 人口随时间自然缓慢增加（预设日增率 +0.01%）
 * - 人口不会自然减少，不允许负增长
 * - 战争不会直接导致人口减少，不影响自然增长速度
 * - 移民不会直接减少或增加全国总人口
 * - 政治制度、经济、稳定度、战争、外交均不能修改人口增长逻辑
 * - 人口系统与任何其他外部系统保持严格独立
 */
export function calculateNationDemographics(
 nation: Nation | null | undefined
): DemographicsState {
 const provinces = nation?.provinces || [];
 let basePop = nation?.totalPopulation || 0;
 if (basePop <= 0) {
  if (provinces.length > 0) {
   basePop = provinces.reduce((sum, p) => sum + Number((p as any).properties?.manpower || (p as any).manpower || 1800000), 0);
  } else {
   basePop = 38500000;
  }
 }

 // 恒定基准增长率：每日 +0.01% (缓慢、稳定、单向增长)
 const dailyGrowthRate = BASE_DAILY_POPULATION_GROWTH_RATE;
 const dailyGrowthRatePercent = 0.01;
 const annualCompoundedFactor = Math.pow(1 + dailyGrowthRate, 365) - 1;
 const annualGrowthRatePercent = Number((annualCompoundedFactor * 100).toFixed(2));

 const dailyNetGrowth = Math.round(basePop * dailyGrowthRate);
 const annualNetGrowth = Math.round(basePop * annualCompoundedFactor);
 const annualBirths = annualNetGrowth;
 const annualNaturalDeaths = 0; // 规则：严禁负向扣减
 const warCasualties = 0; // 规则：战争不削减全国总人口
 const annualRefugeesAndMigration = 0; // 规则：移民不增减全国总人口

 const spans = [
  { spanLabel: '1年展望', years: 1 },
  { spanLabel: '5年中期', years: 5 },
  { spanLabel: '10年远期', years: 10 },
  { spanLabel: '25年一代', years: 25 },
  { spanLabel: '50年半世纪', years: 50 },
 ];

 const projections = spans.map((s) => {
  const projected = Math.round(basePop * Math.pow(1 + dailyGrowthRate, 365 * s.years));
  return {
   spanLabel: s.spanLabel,
   years: s.years,
   projectedPopulation: projected,
   deltaPopulation: projected - basePop,
  };
 });

 const historyCurve = [
  { year: 1932, population: Math.round(basePop * Math.pow(1 + dailyGrowthRate, -365 * 4)), growthRate: annualGrowthRatePercent, casualties: 0 },
  { year: 1933, population: Math.round(basePop * Math.pow(1 + dailyGrowthRate, -365 * 3)), growthRate: annualGrowthRatePercent, casualties: 0 },
  { year: 1934, population: Math.round(basePop * Math.pow(1 + dailyGrowthRate, -365 * 2)), growthRate: annualGrowthRatePercent, casualties: 0 },
  { year: 1935, population: Math.round(basePop * Math.pow(1 + dailyGrowthRate, -365 * 1)), growthRate: annualGrowthRatePercent, casualties: 0 },
  { year: 1936, population: basePop, growthRate: annualGrowthRatePercent, casualties: 0 },
 ];

 return {
  currentPopulation: basePop,
  dailyGrowthRatePercent,
  annualGrowthRatePercent,
  dailyNetGrowth,
  annualBirths,
  annualNaturalDeaths,
  annualNetGrowth,
  annualWarCasualties: warCasualties,
  annualRefugeesAndMigration,
  demographicHealthIndex: 100,
  systemIndependenceStatus: 'ACTIVE_ISOLATED',
  projections,
  historyCurve,
 };
}

/**
 * Computes national stability breakdowns & drivers.
 */
export function calculateNationStability(
 nation: Nation | null | undefined
): StabilityFactorBreakdown {
 const currentScore = nation?.stabilityIndex ?? 84;
 const isAtWar = (nation?.activeWars?.length || 0) > 0;
 const warCount = nation?.activeWars?.length || 0;
 const treatiesCount = nation?.activeTreaties?.length || 0;
 const decreesCount = nation?.activeDecreeIds?.length || 2;
 const taxRate = nation?.taxRate ?? 20;

 const positiveFactors = [
  { name: '宪政秩序与法令施行', impact: Math.min(12, decreesCount * 3.5), desc: '完善的国防与内政法令保障社会基本秩序' },
  { name: '多边和平与防御条约', impact: Math.min(10, treatiesCount * 3.0 + 3), desc: '与周边国家签署互保防务与友好条约' },
  { name: '国库财政充盈稳定', impact: 6.5, desc: '主权货币流通正常，无系统性债务危机' },
  { name: '民生战略口粮自给', impact: 5.0, desc: '粮食储备满足全国配给需求' },
 ];

 const negativeFactors = [];
 if (isAtWar) {
  negativeFactors.push({
   name: `战时动员戒严与战线压力 (${warCount}场交火)`,
   impact: warCount * 7.5,
   desc: '全面战争导致征兵疲劳、物资配给与民众恐慌',
  });
 }
 if (taxRate > 35) {
  negativeFactors.push({
   name: `高额战时特别赋税 (${taxRate}%)`,
   impact: (taxRate - 35) * 0.4,
   desc: '重税削弱居民消费与工商业活力',
  });
 }
 if ((nation?.activeSanctionsEnforced?.length || 0) > 0) {
  negativeFactors.push({
   name: '国际禁运与多边封锁',
   impact: 4.5,
   desc: '外部地缘敌对阵营切断关键物资贸易',
  });
 }

 const monthlyTrendPercent = isAtWar ? -0.8 : 0.35;

 return {
  currentScore,
  monthlyTrendPercent,
  positiveFactors,
  negativeFactors,
  impacts: {
   factoryOutputBonusPercent: Math.round((currentScore - 50) * 0.3),
   politicalPowerGainBonusPercent: Math.round((currentScore - 50) * 0.25),
   conscriptionEfficiencyBonusPercent: Math.round((currentScore - 50) * 0.2),
   insurgencyRiskModifierPercent: Math.round((50 - currentScore) * 0.5),
  },
 };
}

/**
 * Computes political regime profile, ruling party share, and national modifiers
 * based on the four major ideologies: 共产主义 (Communist), 法西斯主义 (Fascist), 民主主义 (Democratic), 中立主义 (Neutral).
 */
export function calculateNationPolitics(
 nation: Nation | null | undefined
): PoliticalState {
 const regime = nation?.regime || '君主立宪制';
 const stability = nation?.stabilityIndex ?? 84;

 // 1. 获取四大政党自定义命名 (若无则提供经典默认昵称)
 const partyNames = {
  communist: nation?.partyNames?.communist || '人民劳动共产党',
  fascist: nation?.partyNames?.fascist || '国家复兴法西斯党',
  democratic: nation?.partyNames?.democratic || '自由民主进步同盟',
  neutral: nation?.partyNames?.neutral || '国家中立秩序阵线',
 };

 // 2. 判定当前执政党 (若未设定，则根据 ideology 映射或默认为 neutral)
 let rulingPartyId: 'communist' | 'fascist' | 'democratic' | 'neutral' = nation?.rulingPartyId || 'neutral';
 if (!nation?.rulingPartyId && nation?.ideology) {
  const ideo = nation.ideology;
  if (ideo.includes('共产') || ideo.includes('社会') || ideo.includes('苏维埃')) {
   rulingPartyId = 'communist';
  } else if (ideo.includes('法西斯') || ideo.includes('军国') || ideo.includes('威权')) {
   rulingPartyId = 'fascist';
  } else if (ideo.includes('民主') || ideo.includes('自由') || ideo.includes('重商')) {
   rulingPartyId = 'democratic';
  } else {
   rulingPartyId = 'neutral';
  }
 }

 // 3. 获取支持率 (新建国默认为执政党 100%，其余 0%)
 let rawSupport = nation?.partySupport || {
  communist: rulingPartyId === 'communist' ? 100 : 0,
  fascist: rulingPartyId === 'fascist' ? 100 : 0,
  democratic: rulingPartyId === 'democratic' ? 100 : 0,
  neutral: rulingPartyId === 'neutral' ? 100 : 0,
 };

 // 4. 构建四大政党完整对象
 const partyConfig = {
  communist: {
   id: 'communist',
   name: partyNames.communist,
   ideologyName: '共产主义',
   color: '#dc2626',
   leaderName: '总书记兼人民委员长',
   policyDoctrine: '无产阶级专政 · 计划重工 · 集体公有制',
   foreignPreference: '共产国际互助与无产阶级解放',
   doctrine: '计划指令 · 重工统筹 · 公费医疗与平等分配',
   buffDesc: '生产资料公有与计划指令执行力，军工与基建产能爆发力极强。',
  },
  fascist: {
   id: 'fascist',
   name: partyNames.fascist,
   ideologyName: '法西斯主义',
   color: '#78350f',
   leaderName: '国家最高统帅 / 元首',
   policyDoctrine: '领袖专政 · 极权军国 · 民族生存空间',
   foreignPreference: '单边威慑扩张与轴心军事同盟',
   doctrine: '铁血战争动员 · 先军政治 · 极速整军备战',
   buffDesc: '统帅部直接管辖军团与军工，陆空军动员速度与前线攻势凌厉。',
  },
  democratic: {
   id: 'democratic',
   name: partyNames.democratic,
   ideologyName: '自由民主主义',
   color: '#2563eb',
   leaderName: '民选大总统 / 内阁总理',
   policyDoctrine: '宪政分权 · 自由市场 · 公民基本权利',
   foreignPreference: '多边自由贸易与集体防卫公约',
   doctrine: '法治立宪 · 减税简政 · 自由贸易繁荣',
   buffDesc: '私营经济活力充沛，科技创新与对外关税贸易收益领先。',
  },
  neutral: {
   id: 'neutral',
   name: partyNames.neutral,
   ideologyName: '中立主义',
   color: '#64748b',
   leaderName: '国家摄政官 / 秩序长官',
   policyDoctrine: '秩序维稳 · 孤立自卫 · 传统保守体制',
   foreignPreference: '永久中立与不结盟自卫',
   doctrine: '国家安全维稳 · 孤立防御 · 财政收支平衡',
   buffDesc: '政局动荡防范力高，不易卷入国际大国冲突，国内基本盘稳固。',
  },
 };

 const allPartyKeys: ('communist' | 'fascist' | 'democratic' | 'neutral')[] = [
  'communist',
  'fascist',
  'democratic',
  'neutral',
 ];

 const allParties: PoliticalParty[] = allPartyKeys.map((key) => {
  const cfg = partyConfig[key];
  const isRuling = key === rulingPartyId;
  return {
   id: cfg.id,
   name: cfg.name,
   ideologyName: cfg.ideologyName,
   supportPercent: Math.max(0, Math.min(100, Math.round(rawSupport[key] ?? 0))),
   color: cfg.color,
   isRuling,
   leaderName: isRuling && nation?.ownerUsername ? `${nation.ownerUsername} (${cfg.leaderName})` : cfg.leaderName,
   policyDoctrine: cfg.policyDoctrine,
   foreignPreference: cfg.foreignPreference,
  };
 });

 const rulingParty = allParties.find((p) => p.isRuling) || allParties[0];
 const oppositionParties = allParties.filter((p) => !p.isRuling);

 let modifiers: RegimeModifier[] = [];
 if (rulingPartyId === 'communist') {
  modifiers = [
   { name: '五年重工计划', type: 'buff', value: '+15% 军工厂建造与产出', description: '国家统一调配生产要素，工业产能集中攻坚。' },
   { name: '全民公费医疗', type: 'buff', value: '+12% 基础社会保障', description: '基层社群公费医疗托底，消除平民因病致贫。' },
   { name: '外汇与边境管制', type: 'debuff', value: '-8% 私人关税贸易盈余', description: '跨境资本流动受到国家外贸部严格管控。' },
  ];
 } else if (rulingPartyId === 'fascist') {
  modifiers = [
   { name: '总体战全国总动员', type: 'buff', value: '+25% 陆军动员速度', description: '国家统帅部指令直接下达，征兵与装备极速下发。' },
   { name: '领袖意志凝聚', type: 'buff', value: '+20% 战争支持度', description: '极权宣传激起国民战斗意志，前线士兵无畏冲锋。' },
   { name: '文官体系受限', type: 'debuff', value: '-10% 民用工厂建造速度', description: '民生资源优先让渡于军工与前线补给。' },
  ];
 } else if (rulingPartyId === 'democratic') {
  modifiers = [
   { name: '自由市场繁荣', type: 'buff', value: '+15% 商业税收与贸易盈余', description: '民营经济充满活力，跨国贸易与投资络绎不绝。' },
   { name: '科技思想自由', type: 'buff', value: '+10% 战略科技研发速度', description: '学术自由激发科研院所前沿技术持续突破。' },
   { name: '议会宣战审议', type: 'debuff', value: '-12% 突发开战准备速度', description: '对外发动战争必须经过两院多轮辩论与投票批准。' },
  ];
 } else {
  // Neutral
  modifiers = [
   { name: '秩序与稳定基石', type: 'buff', value: '+12% 稳定度基本盘', description: '中庸保守政策维持社会各阶层平稳运转，不易暴乱。' },
   { name: '防范外国渗透', type: 'buff', value: '-20% 外国间谍颠覆成功率', description: '审慎的外交审查严密抵御外国思想颠覆。' },
   { name: '外交扩张消极', type: 'debuff', value: '-15% 宣称制造速度', description: '国民普遍倾向于孤立自保，对对外开疆拓土缺乏热情。' },
  ];
 }

 return {
  currentRegime: regime,
  regimeNameZh: regime,
  rulingParty,
  oppositionParties,
  yearsInPower: nation?.electionsHeldCount ? nation.electionsHeldCount * 4 + 1 : 1,
  governmentEfficiency: Math.min(100, Math.max(35, Math.round(stability * 0.9 + (rulingParty.supportPercent > 60 ? 10 : 0)))),
  reformProgress: Math.min(100, 30 + (nation?.electionsHeldCount || 0) * 15 + (nation?.coupsAttemptedCount || 0) * 10),
  modifiers,
 };
}

/**
 * Generates interactive tactical frontlines & operational war theaters.
 */
export function generateWarTheaters(nation: Nation | null | undefined): WarTheaterSummary[] {
 const activeWars = nation?.activeWars || [];
 if (activeWars.length === 0) return [];

 return activeWars.map((w, idx) => {
  const elapsedDays = Math.max(3, Math.floor((Date.now() - new Date(w.since || Date.now()).getTime()) / (1000 * 3600 * 24)));
  const friendlyTroops = 145000 + idx * 35000;
  const hostileTroops = 160000 + idx * 28000;
  const friendlyCasualties = Math.round(friendlyTroops * 0.045 + elapsedDays * 120);
  const enemyCasualties = Math.round(hostileTroops * 0.062 + elapsedDays * 185);
  const advanceKm = 24 - idx * 8;

  const historyTimeline = Array.from({ length: 7 }, (_, i) => {
   const dayOffset = 7 - i;
   return {
    dayOffset,
    date: `第 ${elapsedDays - dayOffset} 天`,
    friendlyForces: friendlyTroops - (7 - i) * 600,
    hostileForces: hostileTroops - (7 - i) * 950,
    friendlyCasualties: Math.round(friendlyCasualties * (0.4 + i * 0.1)),
    enemyCasualties: Math.round(enemyCasualties * (0.35 + i * 0.11)),
    territoryPushedKm: Math.round((advanceKm * (i + 1)) / 7),
    intensityIndex: 65 + (i % 3) * 12,
   };
  });

  return {
   warId: `war-${w.withNationId}-${idx}`,
   warName: `${nation?.name || '我国'} - ${w.withNationName} 边境主权战役`,
   adversaryNationId: w.withNationId,
   adversaryNationName: w.withNationName,
   startedAt: w.since,
   elapsedDays,
   status: 'active',
   frontlinesCount: 2,
   friendlyTroopsDeployed: friendlyTroops,
   hostileTroopsEstimated: hostileTroops,
   friendlyCasualtiesTotal: friendlyCasualties,
   enemyCasualtiesInflicted: enemyCasualties,
   friendlyProvincesLost: 0,
   enemyProvincesOccupied: 1,
   totalBattles: 14 + idx * 6,
   friendlyWinRate: 71.4,
   frontlineAdvanceKm: advanceKm,
   battleIntensity: 'intense',
   historyTimeline,
  };
 });
}
