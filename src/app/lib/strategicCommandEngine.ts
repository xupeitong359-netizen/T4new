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
// 1. 战略资源体系 (6大核心战略资源：石油、煤炭、铁矿、铝矿、铬、橡胶)
// -----------------------------------------------------------------------------
export type StrategicResourceType =
 | 'oil'
 | 'coal'
 | 'iron'
 | 'aluminium'
 | 'chromium'
 | 'rubber';

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
  description: '重装甲部队、航空兵团与现代海军的命脉动力血液。',
  baseMarketPrice: 48,
  militaryUsage: '机械化装甲突击、战术空袭、后勤车队燃料',
  civilianUsage: '重化工业合成、燃油发电、远洋航运',
 },
 coal: {
  id: 'coal',
  name: '煤炭',
  unit: '吨',
  color: '#334155',
  badgeBg: 'bg-slate-800 text-slate-200 border-slate-600',
  badgeText: 'text-slate-300',
  icon: 'COAL',
  description: '基础工业发电、重型钢铁冶炼与合成燃料的基础原料。',
  baseMarketPrice: 20,
  militaryUsage: '军工厂高炉冶炼、火药基础化工',
  civilianUsage: '火电基荷电力、民用供暖、合成燃料',
 },
 iron: {
  id: 'iron',
  name: '铁矿',
  unit: '吨',
  color: '#b45309',
  badgeBg: 'bg-amber-950 text-amber-200 border-amber-700',
  badgeText: 'text-amber-400',
  icon: 'FE',
  description: '枪炮火炮、装甲车辆、铁道轨道与防线工事的坚固骨架。',
  baseMarketPrice: 32,
  militaryUsage: '枪炮火炮铸造、步兵武器装备、装甲底盘',
  civilianUsage: '铁路路网扩建、民用工厂骨架、建筑基建',
 },
 aluminium: {
  id: 'aluminium',
  name: '铝矿',
  unit: '吨',
  color: '#0284c7',
  badgeBg: 'bg-sky-950 text-sky-200 border-sky-600',
  badgeText: 'text-sky-400',
  icon: 'AL',
  description: '战斗机翼身结构、轻量化引擎与无线电雷达元件的核心材料。',
  baseMarketPrice: 42,
  militaryUsage: '航空战机制造、精密火控雷达、高机动轻装甲',
  civilianUsage: '高压电网输变电、现代汽车工业',
 },
 chromium: {
  id: 'chromium',
  name: '铬',
  unit: '吨',
  color: '#7c3aed',
  badgeBg: 'bg-purple-950 text-purple-200 border-purple-600',
  badgeText: 'text-purple-300',
  icon: 'CR',
  description: '重型装甲特种合金钢、高耐磨枪炮管与先进涡轮叶片的关键战略添加剂。',
  baseMarketPrice: 75,
  militaryUsage: '特种重装甲合金钢板、高膛压火炮炮管、航空涡轮发动机',
  civilianUsage: '高端不锈钢、重工耐磨轴承、耐腐蚀特种工业装备',
 },
 rubber: {
  id: 'rubber',
  name: '橡胶',
  unit: '吨',
  color: '#059669',
  badgeBg: 'bg-emerald-950 text-emerald-200 border-emerald-600',
  badgeText: 'text-emerald-300',
  icon: 'RUB',
  description: '卡车战车充气轮胎、飞机起落架减震轮与电气防水绝缘层的关键工业原料。',
  baseMarketPrice: 55,
  militaryUsage: '军用卡车与装甲车辆轮胎、战机起落架轮胎、战地绝缘防护',
  civilianUsage: '民用运输车辆轮胎、工业输送带、电气绝缘器材',
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
// -----------------------------------------------------------------------------
export interface DemographicsState {
 currentPopulation: number;
 annualGrowthRatePercent: number; // e.g. +1.35%
 annualBirths: number;
 annualNaturalDeaths: number;
 annualNetGrowth: number;
 annualWarCasualties: number;
 annualRefugeesAndMigration: number;
 demographicHealthIndex: number; // 0 to 100
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
 * 包含：石油 (Oil)、煤炭 (Coal)、铁矿 (Iron)、铝矿 (Aluminium)、铬 (Chromium)、橡胶 (Rubber)
 */
export function getProvinceResourceDeposits(
 provinceId: string | number,
 provinceName?: string,
 properties?: any
): Partial<Record<StrategicResourceType, number>> {
 const numId = Number(provinceId || 1);
 const name = String(provinceName || '').toLowerCase();
 const deposits: Partial<Record<StrategicResourceType, number>> = {};

 // If raw properties contain predefined HOI4 resources, incorporate and scale them
 const rawResources = properties?.resources;
 if (rawResources && typeof rawResources === 'object') {
  if (typeof rawResources.oil === 'number' && rawResources.oil > 0) {
   deposits.oil = Math.round(rawResources.oil * 3.5);
  }
  if (typeof rawResources.coal === 'number' && rawResources.coal > 0) {
   deposits.coal = Math.round(rawResources.coal * 3.2);
  }
  if (typeof rawResources.steel === 'number' && rawResources.steel > 0) {
   deposits.iron = Math.round(rawResources.steel * 3.4);
  }
  if (typeof rawResources.iron === 'number' && rawResources.iron > 0) {
   deposits.iron = Math.round(rawResources.iron * 3.4);
  }
  if (typeof rawResources.aluminium === 'number' && rawResources.aluminium > 0) {
   deposits.aluminium = Math.round(rawResources.aluminium * 3.0);
  }
  if (typeof rawResources.chromium === 'number' && rawResources.chromium > 0) {
   deposits.chromium = Math.round(rawResources.chromium * 3.0);
  }
  if (typeof rawResources.rubber === 'number' && rawResources.rubber > 0) {
   deposits.rubber = Math.round(rawResources.rubber * 3.8);
  }
  if (typeof rawResources.tungsten === 'number' && rawResources.tungsten > 0) {
   deposits.chromium = (deposits.chromium || 0) + Math.round(rawResources.tungsten * 2.2);
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

 // 2. 煤炭 (Coal) 真实地理产区分布 (鲁尔区、西里西亚、顿巴斯、山西、阿巴拉契亚、纽卡斯尔、库兹巴斯等)
 if (
  name.includes('ruhr') ||
  name.includes('rhineland') ||
  name.includes('westphalia') ||
  name.includes('saarland') ||
  name.includes('silesia') ||
  name.includes('katowice') ||
  name.includes('donbass') ||
  name.includes('donetsk') ||
  name.includes('luhansk') ||
  name.includes('kuznetsk') ||
  name.includes('kemerovo') ||
  name.includes('karaganda') ||
  name.includes('shanxi') ||
  name.includes('taiyuan') ||
  name.includes('datong') ||
  name.includes('shaanxi') ||
  name.includes('yulin') ||
  name.includes('ordos') ||
  name.includes('hebei') ||
  name.includes('tangshan') ||
  name.includes('pingdingshan') ||
  name.includes('huainan') ||
  name.includes('pennsylvania') ||
  name.includes('pittsburgh') ||
  name.includes('west virginia') ||
  name.includes('kentucky') ||
  name.includes('wyoming') ||
  name.includes('yorkshire') ||
  name.includes('newcastle') ||
  name.includes('cardiff') ||
  name.includes('wales') ||
  name.includes('queensland') ||
  name.includes('bowen') ||
  name.includes('jharkhand') ||
  name.includes('jharia') ||
  name.includes('mpumalanga') ||
  name.includes('witbank')
 ) {
  deposits.coal = Math.max(deposits.coal || 0, 180 + (numId % 320));
 } else if (numId % 37 === 0) {
  // 少量中小型煤矿
  deposits.coal = 45 + (numId % 80);
 }

 // 3. 铁矿 (Iron) 真实地理产区分布 (基律纳、洛林、马格尼托哥尔斯克、克里沃罗格、皮尔巴拉、卡拉加斯、鞍山等)
 if (
  name.includes('kiruna') ||
  name.includes('norrbott') ||
  name.includes('gallivare') ||
  name.includes('lorraine') ||
  name.includes('metz') ||
  name.includes('briey') ||
  name.includes('magnitogorsk') ||
  name.includes('chelyabinsk') ||
  name.includes('krivoy') ||
  name.includes('kursk') ||
  name.includes('belgorod') ||
  name.includes('pilbara') ||
  name.includes('port hedland') ||
  name.includes('carajas') ||
  name.includes('minas gerais') ||
  name.includes('itabira') ||
  name.includes('anshan') ||
  name.includes('liaoning') ||
  name.includes('panzhihua') ||
  name.includes('daye') ||
  name.includes('mesabi') ||
  name.includes('minnesota') ||
  name.includes('marquette') ||
  name.includes('odisha') ||
  name.includes('singhbhum') ||
  name.includes('chhattisgarh') ||
  name.includes('bailadila') ||
  name.includes('sishen') ||
  name.includes('bilbao')
 ) {
  deposits.iron = Math.max(deposits.iron || 0, 190 + (numId % 340));
 } else if (numId % 41 === 0) {
  deposits.iron = 50 + (numId % 90);
 }

 // 4. 铝矿 (Aluminium/Bauxite) 真实地理产区分布 (几内亚、牙买加、苏里南、昆士兰、普罗旺斯、百色、山西等)
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

 // 5. 铬 (Chromium) 真实地理产区分布 (南非布什维尔德、土耳其居莱曼、哈萨克斯坦阿克托别/赫罗姆套、津巴布韦、印度苏金达、阿尔巴尼亚等)
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

 // 6. 橡胶 (Rubber) 真实地理产区分布 (马来亚、印尼苏门答腊/爪哇/婆罗洲、中南半岛/越南/泰国、斯里兰卡、亚马逊雨林、利比里亚等)
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
  name.includes('acre')
 ) {
  deposits.rubber = Math.max(deposits.rubber || 0, 180 + (numId % 360));
 } else if (numId % 59 === 0 && (name.includes('tropical') || name.includes('south') || numId % 2 === 0)) {
  // 零星热带胶园
  deposits.rubber = 35 + (numId % 70);
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
 const milFactories = nation?.militaryIndustry?.productionLines?.length || 6;
 const armyDivisions = nation?.army?.divisions?.length || 4;

 const result: Record<StrategicResourceType, NationResourceStats> = {
  oil: { dailyProduction: 0, dailyConsumption: 0, netDaily: 0, stockpile: 2400, importedDaily: 0, exportedDaily: 0, depositProvincesCount: 0 },
  coal: { dailyProduction: 0, dailyConsumption: 0, netDaily: 0, stockpile: 4500, importedDaily: 0, exportedDaily: 0, depositProvincesCount: 0 },
  iron: { dailyProduction: 0, dailyConsumption: 0, netDaily: 0, stockpile: 3600, importedDaily: 0, exportedDaily: 0, depositProvincesCount: 0 },
  aluminium: { dailyProduction: 0, dailyConsumption: 0, netDaily: 0, stockpile: 1800, importedDaily: 0, exportedDaily: 0, depositProvincesCount: 0 },
  chromium: { dailyProduction: 0, dailyConsumption: 0, netDaily: 0, stockpile: 950, importedDaily: 0, exportedDaily: 0, depositProvincesCount: 0 },
  rubber: { dailyProduction: 0, dailyConsumption: 0, netDaily: 0, stockpile: 1200, importedDaily: 0, exportedDaily: 0, depositProvincesCount: 0 },
 };

 // 1. Sum up province deposits
 provinces.forEach((p) => {
  const deposits = getProvinceResourceDeposits(p.id, p.name, (p as any).properties);
  (Object.keys(deposits) as StrategicResourceType[]).forEach((resKey) => {
   const amt = deposits[resKey] || 0;
   if (amt > 0) {
    result[resKey].dailyProduction += amt;
    result[resKey].depositProvincesCount += 1;
   }
  });
 });

 // Default baseline production if country is established
 if (result.oil.dailyProduction === 0 && provinces.length > 0) result.oil.dailyProduction = 45;
 if (result.coal.dailyProduction === 0 && provinces.length > 0) result.coal.dailyProduction = 90;
 if (result.iron.dailyProduction === 0 && provinces.length > 0) result.iron.dailyProduction = 80;
 if (result.aluminium.dailyProduction === 0 && provinces.length > 0) result.aluminium.dailyProduction = 35;
 if (result.chromium.dailyProduction === 0 && provinces.length > 0) result.chromium.dailyProduction = 20;
 if (result.rubber.dailyProduction === 0 && provinces.length > 0) result.rubber.dailyProduction = 25;

 // 2. Consumption calculations based on factories & army
 result.oil.dailyConsumption = Math.round(milFactories * 4.5 + armyDivisions * 4.8);
 result.coal.dailyConsumption = Math.round(civFactories * 4.0 + milFactories * 3.5);
 result.iron.dailyConsumption = Math.round(milFactories * 6.5 + civFactories * 2.8);
 result.aluminium.dailyConsumption = Math.round(milFactories * 3.8);
 result.chromium.dailyConsumption = Math.round(milFactories * 2.2);
 result.rubber.dailyConsumption = Math.round(milFactories * 2.5 + armyDivisions * 1.5);

 // 3. Trade and Net Calculation
 (Object.keys(result) as StrategicResourceType[]).forEach((key) => {
  const item = result[key];
  item.netDaily = item.dailyProduction + item.importedDaily - item.dailyConsumption - item.exportedDaily;
 });

 return result;
}

/**
 * Computes dynamic national demographics with 1Y, 5Y, 10Y, 25Y, 50Y curves.
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

 const stability = nation?.stabilityIndex ?? 82;
 const isAtWar = (nation?.activeWars?.length || 0) > 0;
 const warCasualties = isAtWar ? Math.round(basePop * 0.0022) : Math.round(basePop * 0.0001);

 // Growth rate driven by stability & war
 const baseGrowthPercent = 1.42;
 const stabilityBonus = ((stability - 50) / 50) * 0.45;
 const warPenalty = isAtWar ? -0.55 : 0;
 const annualGrowthRatePercent = Number(
  Math.max(0.1, baseGrowthPercent + stabilityBonus + warPenalty).toFixed(2)
 );

 const annualBirths = Math.round(basePop * 0.024);
 const annualNaturalDeaths = Math.round(basePop * 0.011);
 const annualRefugeesAndMigration = Math.round(basePop * (isAtWar ? -0.003 : 0.0025));
 const annualNetGrowth = Math.round(
  annualBirths - annualNaturalDeaths - warCasualties + annualRefugeesAndMigration
 );

 const spans = [
  { spanLabel: '1年展望', years: 1 },
  { spanLabel: '5年中期', years: 5 },
  { spanLabel: '10年远期', years: 10 },
  { spanLabel: '25年一代', years: 25 },
  { spanLabel: '50年半世纪', years: 50 },
 ];

 const projections = spans.map((s) => {
  const projected = Math.round(basePop * Math.pow(1 + annualGrowthRatePercent / 100, s.years));
  return {
   spanLabel: s.spanLabel,
   years: s.years,
   projectedPopulation: projected,
   deltaPopulation: projected - basePop,
  };
 });

 const historyCurve = [
  { year: 1932, population: Math.round(basePop * 0.94), growthRate: 1.25, casualties: 1200 },
  { year: 1933, population: Math.round(basePop * 0.955), growthRate: 1.32, casualties: 2400 },
  { year: 1934, population: Math.round(basePop * 0.97), growthRate: 1.38, casualties: 3100 },
  { year: 1935, population: Math.round(basePop * 0.985), growthRate: 1.45, casualties: 4200 },
  { year: 1936, population: basePop, growthRate: annualGrowthRatePercent, casualties: warCasualties },
 ];

 return {
  currentPopulation: basePop,
  annualGrowthRatePercent,
  annualBirths,
  annualNaturalDeaths,
  annualNetGrowth,
  annualWarCasualties: warCasualties,
  annualRefugeesAndMigration,
  demographicHealthIndex: Math.min(100, Math.max(30, Math.round(stability * 0.8 + annualGrowthRatePercent * 15))),
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
 * Computes political regime profile, ruling party share, and national modifiers.
 */
export function calculateNationPolitics(
 nation: Nation | null | undefined
): PoliticalState {
 const regime = nation?.regime || '君主立宪制';
 const ideology = nation?.ideology || '中立和平主义';
 const stability = nation?.stabilityIndex ?? 84;

 let regimeNameZh = regime;
 let rulingPartyName = '国家进步复兴阵线';
 let doctrine = '法治立宪 · 工业富国 · 和平自卫';
 let modifiers: RegimeModifier[] = [
  { name: '宪政稳定加成', type: 'buff', value: '+10% 稳定度', description: '政体受法律严格制约，政局抗震性极强。' },
  { name: '文官政府效能', type: 'buff', value: '+8% 政府效率', description: '内阁官僚体系运行顺畅，内政指令执行迅速。' },
  { name: '常备军组织纪律', type: 'debuff', value: '-5% 突发战备动员速度', description: '议会宣战审议流程较繁琐。' },
 ];

 if (regime.includes('专制') || regime.includes('威权') || regime.includes('军政')) {
  rulingPartyName = '最高统帅部执政党';
  doctrine = '先军政治 · 铁腕动员 · 领土安全';
  modifiers = [
   { name: '铁血战争动员', type: 'buff', value: '+20% 陆军动员速度', description: '统帅部指令直接下达军团，动员雷厉风行。' },
   { name: '战备意志凝聚', type: 'buff', value: '+15% 战争支持度', description: '举国体制全力保障国防与前线供应。' },
   { name: '社会民生压抑', type: 'debuff', value: '-8% 人口自然增长率', description: '战时管制定居与经济自由度受限。' },
  ];
 } else if (regime.includes('社会') || regime.includes('共和')) {
  rulingPartyName = '人民劳动联合党';
  doctrine = '重化工业计划 · 耕者有其田 · 集体自卫';
  modifiers = [
   { name: '全民公费医疗与福利', type: 'buff', value: '+15% 人口净增长', description: '基层卫生网与全民托底有效降低死亡率。' },
   { name: '重工业产能攻坚', type: 'buff', value: '+12% 军工厂建造速度', description: '计划调配集中力量办大事。' },
   { name: '自由市场贸易惰性', type: 'debuff', value: '-6% 关税贸易盈余', description: '对外汇与私人跨境贸易管制严格。' },
  ];
 }

 // Multi-party distribution
 const rulingShare = Math.min(78, Math.max(38, Math.round(45 + (stability - 50) * 0.35)));
 const remaining = 100 - rulingShare;
 const opp1 = Math.round(remaining * 0.55);
 const opp2 = Math.round(remaining * 0.32);
 const opp3 = 100 - rulingShare - opp1 - opp2;

 const rulingParty: PoliticalParty = {
  id: 'ruling_main',
  name: rulingPartyName,
  ideologyName: ideology,
  supportPercent: rulingShare,
  color: '#4f46e5',
  isRuling: true,
  leaderName: nation?.ownerUsername || '最高执政官',
  policyDoctrine: doctrine,
  foreignPreference: '多边条约与国防防御',
 };

 const oppositionParties: PoliticalParty[] = [
  {
   id: 'opp_liberal',
   name: '自由民主同盟',
   ideologyName: '自由贸易与宪政',
   supportPercent: opp1,
   color: '#0284c7',
   isRuling: false,
   leaderName: '亚历山大·维尔',
   policyDoctrine: '减税减负 · 开放外贸 · 缩减军费',
   foreignPreference: '国际开放与关税减免',
  },
  {
   id: 'opp_nationalist',
   name: '国防保守党团',
   ideologyName: '传统保守与强军',
   supportPercent: opp2,
   color: '#b45309',
   isRuling: false,
   leaderName: '古斯塔夫·海因里希',
   policyDoctrine: '重装扩军 · 强化边境 · 战略储备',
   foreignPreference: '单边威慑与战略禁运',
  },
  {
   id: 'opp_radical',
   name: '青年劳工阵线',
   ideologyName: '社会福利与改革',
   supportPercent: opp3,
   color: '#dc2626',
   isRuling: false,
   leaderName: '埃琳娜·瓦西里耶娃',
   policyDoctrine: '劳工权益 · 免费教育 · 反战同盟',
   foreignPreference: '不结盟与和平主义',
  },
 ];

 return {
  currentRegime: regime,
  regimeNameZh,
  rulingParty,
  oppositionParties,
  yearsInPower: 4,
  governmentEfficiency: Math.min(100, Math.max(40, Math.round(stability * 0.9 + 10))),
  reformProgress: 68,
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
