import { LucideIcon } from 'lucide-react';

export type RadarTechTier = 'decimeter' | 'centimeter' | 'phased_array' | 'monopulse';

export interface RadarTechInfo {
 id: RadarTechTier;
 name: string;
 maxLevel: number;
 description: string;
}

export const RADAR_TECH_TIERS: Record<RadarTechTier, RadarTechInfo> = {
 decimeter: {
  id: 'decimeter',
  name: '分米波雷达',
  maxLevel: 2,
  description: '早期脉冲探测波段，可在各省构筑基础防空警戒网。',
 },
 centimeter: {
  id: 'centimeter',
  name: '厘米波雷达',
  maxLevel: 4,
  description: '精度大幅提升的高频微波系统，有效锁定高空与低空战机群。',
 },
 phased_array: {
  id: 'phased_array',
  name: '相控阵雷达',
  maxLevel: 5,
  description: '电子扫描阵列雷达，多目标瞬间追踪与超视距战区态势感知。',
 },
 monopulse: {
  id: 'monopulse',
  name: '单脉冲雷达',
  maxLevel: 6,
  description: '极高抗干扰能力与精确角跟踪，压制敌方战机隐蔽突防。',
 },
};

export type StrategicBuildingType =
 | 'infrastructure'
 | 'anti_air'
 | 'air_base'
 | 'radar_station'
 | 'civilian_factory'
 | 'civ_to_mil'
 | 'military_factory'
 | 'mil_to_civ'
 | 'naval_dockyard'
 | 'synthetic_refinery'
 | 'fuel_silo'
 | 'railway'
 | 'supply_hub'
 | 'fortress';

export interface BuildingDefinition {
 type: StrategicBuildingType;
 name: string;
 category: 'state' | 'industry' | 'defense' | 'logistics';
 categoryName: string;
 baseCost: number;
 costFormulaDescription: string;
 maxLevel: number | 'special';
 effect: string;
 description: string;
 badge: string;
 color: string;
 bgLight: string;
 borderColor: string;
}

export const STRATEGIC_BUILDINGS: Record<StrategicBuildingType, BuildingDefinition> = {
 infrastructure: {
  type: 'infrastructure',
  name: '基础设施',
  category: 'state',
  categoryName: '省份基建',
  baseCost: 6000,
  costFormulaDescription: '6k 产能 / 级',
  maxLevel: 5,
  effect: '每级 +10% 该地区所有建筑的建造速度（最高 +50%）',
  description: '贯通全省的平整道路与基础电网，显著缩短一切军事与工业设施的施工工期。',
  badge: '基建提速',
  color: '#0284c7', // sky
  bgLight: 'bg-sky-50',
  borderColor: 'border-sky-200',
 },
 anti_air: {
  type: 'anti_air',
  name: '防空炮',
  category: 'defense',
  categoryName: '防空阵地',
  baseCost: 1250,
  costFormulaDescription: '1.25k 产能 / 级',
  maxLevel: 5,
  effect: '每级 -10% 敌方制空权（最高 -50%）',
  description: '密布于省份关键节点的高射重炮群与防空火力网，对来犯敌机形成致命火网。',
  badge: '防空火力',
  color: '#ea580c', // orange
  bgLight: 'bg-orange-50',
  borderColor: 'border-orange-200',
 },
 air_base: {
  type: 'air_base',
  name: '空军基地',
  category: 'defense',
  categoryName: '航空设施',
  baseCost: 2500,
  costFormulaDescription: '2.5k 产能 / 级',
  maxLevel: 10,
  effect: '每级 +100 架空军战机部署上限（最高 +1000 架）',
  description: '军用跑道、机库、燃油库与飞行员战备中心，支撑前线战机编队密集起降。',
  badge: '战机停驻',
  color: '#3b82f6', // blue
  bgLight: 'bg-blue-50',
  borderColor: 'border-blue-200',
 },
 radar_station: {
  type: 'radar_station',
  name: '雷达站',
  category: 'defense',
  categoryName: '电子探测',
  baseCost: 3375,
  costFormulaDescription: '3.375k 产能 / 级',
  maxLevel: 'special',
  effect: '每级 -5% 敌方制空（上限随科技提升：分米波2级/厘米波4级/相控阵5级/单脉冲6级）',
  description: '远程空情预警天线阵列，提前洞察敌机编队航线并引导己方拦截。',
  badge: '雷达探测',
  color: '#8b5cf6', // purple
  bgLight: 'bg-purple-50',
  borderColor: 'border-purple-200',
 },
 civilian_factory: {
  type: 'civilian_factory',
  name: '民用工厂（民工）',
  category: 'industry',
  categoryName: '国家重工',
  baseCost: 10800,
  costFormulaDescription: '10.8k 产能 / 座',
  maxLevel: 30,
  effect: '每座每日稳定产出 2,000 产能 / 24h，是全国一切建筑扩建的核心动力',
  description: '民用工业、冶金炼钢与基础制造核心，直接支撑国家宏观建设工程。',
  badge: '产能核心 +2000/24h',
  color: '#10b981', // emerald
  bgLight: 'bg-emerald-50',
  borderColor: 'border-emerald-200',
 },
 civ_to_mil: {
  type: 'civ_to_mil',
  name: '民用转军用（民转军）',
  category: 'industry',
  categoryName: '战时动员',
  baseCost: 9000,
  costFormulaDescription: '9k 产能 / 座',
  maxLevel: 30,
  effect: '将 1 座现有民用工厂改造为军工工厂，扩充军事装备流水线排产产能',
  description: '工业战时紧急转产，将民用机械与车间改造为枪械、火炮与装甲流水线。',
  badge: '工业转产',
  color: '#d97706', // amber
  bgLight: 'bg-amber-50',
  borderColor: 'border-amber-200',
 },
 military_factory: {
  type: 'military_factory',
  name: '军用工厂（军工）',
  category: 'industry',
  categoryName: '军工生产',
  baseCost: 7200,
  costFormulaDescription: '7.2k 产能 / 座',
  maxLevel: 30,
  effect: '每座军用工厂提供 500 IC 军工排产点数，专职生产坦克、战机与枪械弹药',
  description: '重型兵器铸造厂与装甲组装线，直接决定前线主战装备的日产出规模。',
  badge: '军备排产 +500 IC',
  color: '#e11d48', // rose
  bgLight: 'bg-rose-50',
  borderColor: 'border-rose-200',
 },
 mil_to_civ: {
  type: 'mil_to_civ',
  name: '军用转民用（军转民）',
  category: 'industry',
  categoryName: '战后复苏',
  baseCost: 4000,
  costFormulaDescription: '4k 产能 / 座',
  maxLevel: 30,
  effect: '将 1 座军用工厂改建回民用工厂，提升国家每日建设产能',
  description: '战后工业转型，将兵工厂改造为民用机械工程厂，反哺国家基础建设。',
  badge: '民生回暖',
  color: '#059669', // teal
  bgLight: 'bg-teal-50',
  borderColor: 'border-teal-200',
 },
 naval_dockyard: {
  type: 'naval_dockyard',
  name: '海军船坞',
  category: 'industry',
  categoryName: '海权造船',
  baseCost: 6400,
  costFormulaDescription: '6.4k 产能 / 座',
  maxLevel: 30,
  effect: '建造驱逐舰、巡洋舰、战列舰与潜艇的核心港口船坞',
  description: '重型干船坞与造船龙门吊，为远洋舰队的下水服役提供坚实保障。',
  badge: '海权造舰',
  color: '#0891b2', // cyan
  bgLight: 'bg-cyan-50',
  borderColor: 'border-cyan-200',
 },
 synthetic_refinery: {
  type: 'synthetic_refinery',
  name: '合成炼油厂',
  category: 'industry',
  categoryName: '战略资源',
  baseCost: 14500,
  costFormulaDescription: '14.5k 产能 / 级',
  maxLevel: 30,
  effect: '每级每日产出 +2 战略石油',
  description: '高压加氢煤制油与合成燃料厂，摆脱对海外原油进口路线的依赖。',
  badge: '石油产出 +2',
  color: '#475569', // slate
  bgLight: 'bg-slate-100',
  borderColor: 'border-slate-300',
 },
 fuel_silo: {
  type: 'fuel_silo',
  name: '储油罐',
  category: 'logistics',
  categoryName: '能源储备',
  baseCost: 5000,
  costFormulaDescription: '5k 产能 / 级',
  maxLevel: 30,
  effect: '每级 -500 燃油维护损耗 / 提供战略级燃油储藏容积',
  description: '地下加固防爆储油库，为装甲军团与海空联合行动储备战备原油。',
  badge: '燃油储备',
  color: '#64748b',
  bgLight: 'bg-slate-50',
  borderColor: 'border-slate-200',
 },
 railway: {
  type: 'railway',
  name: '铁路',
  category: 'logistics',
  categoryName: '后勤干线',
  baseCost: 130,
  costFormulaDescription: '130 基础，每升1级在原有基础上 +170（Lv1=130, Lv2=300, Lv3=470...）',
  maxLevel: 5,
  effect: '每级大幅提升军列补给通过吨位与重装甲师战略转进速度',
  description: '贯通全国主要补给节点的宽轨重载铁道网络，支撑大规模纵深军力调配。',
  badge: '铁路物流',
  color: '#ca8a04', // yellow
  bgLight: 'bg-yellow-50',
  borderColor: 'border-yellow-200',
 },
 supply_hub: {
  type: 'supply_hub',
  name: '补给中心',
  category: 'logistics',
  categoryName: '战区军需',
  baseCost: 20000,
  costFormulaDescription: '20k 产能 / 座',
  maxLevel: 10,
  effect: '战区级物资集散配送中心，向周边部队提供满额弹药与补给半径',
  description: '多铁路线交汇的巨型军需仓储转运站，根绝前线部队组织度饥渴。',
  badge: '战区补给核心',
  color: '#4f46e5', // indigo
  bgLight: 'bg-indigo-50',
  borderColor: 'border-indigo-200',
 },
 fortress: {
  type: 'fortress',
  name: '要塞（陆上要塞）',
  category: 'defense',
  categoryName: '边境坚垒',
  baseCost: 500,
  costFormulaDescription: '500 基础，每升1级在原有基础上 +500（Lv1=500, Lv2=1000...Lv10=5000）',
  maxLevel: 10,
  effect: '每级大幅降低敌方陆军进攻突破率与火炮穿透杀伤，死守边境要道',
  description: '钢筋混凝土永备暗堡、反坦克壕沟与地下掩体阵地，筑就不可逾越的马奇诺防线。',
  badge: '钢铁永备防线',
  color: '#dc2626', // red
  bgLight: 'bg-red-50',
  borderColor: 'border-red-200',
 },
};

export const MAX_BUILDINGS_PER_PROVINCE = 30;
export const DAILY_CAPACITY_PER_CIV_FACTORY = 2000; // 2000 产能 / 24h

/**
 * Calculate the exact cost for a building upgrade given its current level in that province
 */
export function calculateBuildingUpgradeCost(
 type: StrategicBuildingType,
 currentLevel: number
): number {
 switch (type) {
  case 'infrastructure':
   return 6000;
  case 'anti_air':
   return 1250;
  case 'air_base':
   return 2500;
  case 'radar_station':
   return 3375;
  case 'civilian_factory':
   return 10800;
  case 'civ_to_mil':
   return 9000;
  case 'military_factory':
   return 7200;
  case 'mil_to_civ':
   return 4000;
  case 'naval_dockyard':
   return 6400;
  case 'synthetic_refinery':
   return 14500;
  case 'fuel_silo':
   return 5000;
  case 'supply_hub':
   return 20000;
  case 'railway': {
   // 130 每级，每升1级在原有基础上 +170
   // Lv 1: 130
   // Lv 2: 130 + 170 = 300
   // Lv 3: 130 + 170*2 = 470
   // Lv 4: 130 + 170*3 = 640
   // Lv 5: 130 + 170*4 = 810
   const targetLevel = currentLevel + 1;
   return 130 + (targetLevel - 1) * 170;
  }
  case 'fortress': {
   // 500 每级，每升1级在原有基础上 +500，满级10级
   // Lv 1: 500
   // Lv 2: 1000
   // Lv 3: 1500 ... Lv 10: 5000
   const targetLevel = currentLevel + 1;
   return 500 * targetLevel;
  }
  default:
   return 5000;
 }
}

/**
 * Get maximum allowed level for a building type given tech status
 */
export function getMaxLevelForBuilding(
 type: StrategicBuildingType,
 radarTech: RadarTechTier = 'decimeter'
): number {
 if (type === 'radar_station') {
  return RADAR_TECH_TIERS[radarTech]?.maxLevel || 2;
 }
 const def = STRATEGIC_BUILDINGS[type];
 if (!def) return 30;
 return typeof def.maxLevel === 'number' ? def.maxLevel : 30;
}

/**
 * Calculate infrastructure construction speed bonus (0 - 50%)
 */
export function getInfrastructureBonus(infrastructureLevel: number): number {
 return Math.min(0.5, (infrastructureLevel || 0) * 0.1);
}

export interface ProvinceDetailedBuildings {
 infrastructure: number;
 anti_air: number;
 air_base: number;
 radar_station: number;
 civilian_factory: number;
 military_factory: number;
 naval_dockyard: number;
 synthetic_refinery: number;
 fuel_silo: number;
 railway: number;
 supply_hub: number;
 fortress: number;
}

export const DEFAULT_PROVINCE_BUILDINGS: ProvinceDetailedBuildings = {
 infrastructure: 1,
 anti_air: 0,
 air_base: 0,
 radar_station: 0,
 civilian_factory: 1,
 military_factory: 1,
 naval_dockyard: 0,
 synthetic_refinery: 0,
 fuel_silo: 0,
 railway: 1,
 supply_hub: 0,
 fortress: 0,
};

/**
 * Count total buildings in a province
 */
export function getTotalBuildingsInProvince(buildings?: Partial<ProvinceDetailedBuildings>): number {
 if (!buildings) return 0;
 return Object.values(buildings).reduce((acc: number, val) => acc + (typeof val === 'number' ? val : 0), 0);
}

/**
 * Get the current level, max level, and percentage for a given building in a province.
 * e.g., Infrastructure: Lv.2 / 5 -> 40%
 */
export function getBuildingLevelAndPercentage(
 buildingType: StrategicBuildingType,
 buildings?: Partial<ProvinceDetailedBuildings>,
 radarTech: RadarTechTier = 'decimeter'
): { level: number; maxLevel: number; percent: number; label: string } {
 const merged: ProvinceDetailedBuildings = {
  ...DEFAULT_PROVINCE_BUILDINGS,
  ...(buildings || {}),
 };

 let level = 0;
 let maxLevel = 5;

 if (buildingType === 'infrastructure') {
  level = typeof merged.infrastructure === 'number' ? merged.infrastructure : 1;
  maxLevel = 5;
 } else if (buildingType === 'anti_air') {
  level = typeof merged.anti_air === 'number' ? merged.anti_air : 0;
  maxLevel = 5;
 } else if (buildingType === 'air_base') {
  level = typeof merged.air_base === 'number' ? merged.air_base : 0;
  maxLevel = 10;
 } else if (buildingType === 'radar_station') {
  level = typeof merged.radar_station === 'number' ? merged.radar_station : 0;
  maxLevel = RADAR_TECH_TIERS[radarTech]?.maxLevel || 2;
 } else if (buildingType === 'civilian_factory' || buildingType === 'civ_to_mil') {
  level = typeof merged.civilian_factory === 'number' ? merged.civilian_factory : 1;
  maxLevel = 5;
 } else if (buildingType === 'military_factory' || buildingType === 'mil_to_civ') {
  level = typeof merged.military_factory === 'number' ? merged.military_factory : 1;
  maxLevel = 5;
 } else if (buildingType === 'naval_dockyard') {
  level = typeof merged.naval_dockyard === 'number' ? merged.naval_dockyard : 0;
  maxLevel = 5;
 } else if (buildingType === 'synthetic_refinery') {
  level = typeof merged.synthetic_refinery === 'number' ? merged.synthetic_refinery : 0;
  maxLevel = 3;
 } else if (buildingType === 'fuel_silo') {
  level = typeof merged.fuel_silo === 'number' ? merged.fuel_silo : 0;
  maxLevel = 5;
 } else if (buildingType === 'railway') {
  level = typeof merged.railway === 'number' ? merged.railway : 1;
  maxLevel = 5;
 } else if (buildingType === 'supply_hub') {
  level = typeof merged.supply_hub === 'number' ? merged.supply_hub : 0;
  maxLevel = 3;
 } else if (buildingType === 'fortress') {
  level = typeof merged.fortress === 'number' ? merged.fortress : 0;
  maxLevel = 10;
 } else {
  level = 1;
  maxLevel = 5;
 }

 const percent = maxLevel > 0 ? Math.min(100, Math.round((level / maxLevel) * 100)) : 0;
 const label = `${percent}%`;

 return { level, maxLevel, percent, label };
}

/**
 * Returns a tactical heat map color for building percentage (from Lv 0 -> Max)
 */
export function getConstructionHeatmapColor(percent: number, baseBuildingColor?: string): string {
 if (percent >= 100) return '#10b981'; // 100%: Vibrant Emerald
 if (percent >= 80) return '#059669'; // 80%: Rich Green
 if (percent >= 60) return '#0d9488'; // 60%: Teal
 if (percent >= 40) return '#0284c7'; // 40%: Sky Blue
 if (percent >= 20) return '#3b82f6'; // 20%: Blue
 if (percent > 0) return '#6366f1';  // >0%: Indigo
 return '#334155';           // 0%: Slate (Low/Empty)
}

