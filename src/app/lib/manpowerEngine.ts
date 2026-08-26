import { ArmyDivision, Nation } from '../types';

export interface ConscriptionLaw {
 id: string;
 name: string;
 conscriptionRate: number; // e.g. 0.025 for 2.5%
 rateLabel: string;
 description: string;
 factoryPenalty: number; // percentage penalty e.g. 0, -5, -10
 minApproval: number; // minimum popular approval to enact
}

export const CONSCRIPTION_LAWS: ConscriptionLaw[] = [
 {
  id: 'disarmed',
  name: '非军事化 / 免服兵役',
  conscriptionRate: 0.005,
  rateLabel: '0.5%',
  description: '非战时低戒备状态，仅保留象征性卫队与警察力量，民工产能效率 +5%。',
  factoryPenalty: 0,
  minApproval: 20,
 },
 {
  id: 'volunteer',
  name: '志愿兵役制',
  conscriptionRate: 0.015,
  rateLabel: '1.5%',
  description: '标准和平时期募兵体制，职业军人精干，对国家经济与民生无任何负面影响。',
  factoryPenalty: 0,
  minApproval: 30,
 },
 {
  id: 'early_mobilization',
  name: '早期动员 / 有限征兵',
  conscriptionRate: 0.025,
  rateLabel: '2.5%',
  description: '标准国防战备体制，适度征调适龄青年服役，满足常规常备军编制扩充。',
  factoryPenalty: 0,
  minApproval: 40,
 },
 {
  id: 'extensive_conscription',
  name: '广泛征兵制',
  conscriptionRate: 0.05,
  rateLabel: '5.0%',
  description: '战时全面扩军法案，大幅扩大征召范围，部分劳动力转移使工业产能微降 5%。',
  factoryPenalty: -5,
  minApproval: 50,
 },
 {
  id: 'service_by_requirement',
  name: '全面义务兵役',
  conscriptionRate: 0.1,
  rateLabel: '10.0%',
  description: '全国适龄青年强制服役，动员极其庞大的国防后备军，工业产出受到 10% 冲击。',
  factoryPenalty: -10,
  minApproval: 60,
 },
 {
  id: 'all_adults_serve',
  name: '全员服役总动员',
  conscriptionRate: 0.2,
  rateLabel: '20.0%',
  description: '生死存亡之战动员令，征召所有成年男女入伍参战，军工厂与后勤产能承受 20% 重负。',
  factoryPenalty: -20,
  minApproval: 70,
 },
 {
  id: 'scraping_the_barrel',
  name: '最后一搏 / 极限搜刮',
  conscriptionRate: 0.25,
  rateLabel: '25.0%',
  description: '国家存亡终极动员，征发一切可持枪人员，兵员达到极限，但民生与工业遭受严重削弱。',
  factoryPenalty: -30,
  minApproval: 75,
 },
];

export interface NationalDemographics {
 totalPopulation: number;
 activeLaw: ConscriptionLaw;
 conscriptionRate: number;
 totalEligibleManpower: number;
 activeDutyManpower: number;
 trainingManpower: number;
 availableReserve: number;
 totalManpowerDeficit: number;
 totalDivisionsCount: number;
 activeDivisionsCount: number;
 trainingDivisionsCount: number;
 averageFillRate: number;
}

/**
 * 计算国家级人口与适役兵员大战略体系
 */
export function calculateNationalDemographics(nation: Nation | null): NationalDemographics {
 if (!nation) {
  const defaultLaw = CONSCRIPTION_LAWS[2]; // early_mobilization
  return {
   totalPopulation: 35_000_000,
   activeLaw: defaultLaw,
   conscriptionRate: defaultLaw.conscriptionRate,
   totalEligibleManpower: Math.round(35_000_000 * defaultLaw.conscriptionRate),
   activeDutyManpower: 0,
   trainingManpower: 0,
   availableReserve: Math.round(35_000_000 * defaultLaw.conscriptionRate),
   totalManpowerDeficit: 0,
   totalDivisionsCount: 0,
   activeDivisionsCount: 0,
   trainingDivisionsCount: 0,
   averageFillRate: 100,
  };
 }

 // 基础总人口：由省份数量及基准人口计算，支持自定义
 const provinceCount = nation.provinces?.length || 8;
 const basePop = nation.totalPopulation || Math.max(12_000_000, provinceCount * 3_800_000);

 // 征兵法案
 const activeLaw =
  CONSCRIPTION_LAWS.find((l) => l.id === nation.conscriptionLawId) ||
  CONSCRIPTION_LAWS[2]; // 默认早期动员 2.5%

 const totalEligibleManpower = Math.round(basePop * activeLaw.conscriptionRate);

 const divisions = nation.army?.divisions || [];
 let activeDutyManpower = 0;
 let trainingManpower = 0;
 let totalManpowerDeficit = 0;
 let activeDivisionsCount = 0;
 let trainingDivisionsCount = 0;
 let fillRateSum = 0;

 divisions.forEach((div) => {
  const curMan = div.manpower || 0;
  const maxMan = div.manpowerMax || (div.type.includes('装甲') ? 8500 : div.type.includes('摩托') ? 9000 : 10000);
  const deficit = Math.max(0, maxMan - curMan);
  totalManpowerDeficit += deficit;
  fillRateSum += Math.min(100, (curMan / Math.max(1, maxMan)) * 100);

  if (div.status === 'training') {
   trainingManpower += curMan;
   trainingDivisionsCount++;
  } else {
   activeDutyManpower += curMan;
   activeDivisionsCount++;
  }
 });

 const availableReserve = Math.max(
  0,
  totalEligibleManpower - activeDutyManpower - trainingManpower
 );

 const averageFillRate =
  divisions.length > 0 ? Math.round(fillRateSum / divisions.length) : 100;

 return {
  totalPopulation: basePop,
  activeLaw,
  conscriptionRate: activeLaw.conscriptionRate,
  totalEligibleManpower,
  activeDutyManpower,
  trainingManpower,
  availableReserve,
  totalManpowerDeficit,
  totalDivisionsCount: divisions.length,
  activeDivisionsCount,
  trainingDivisionsCount,
  averageFillRate,
 };
}

export type FillRateTier = 'optimal' | 'light_shortage' | 'severe_shortage' | 'critical';

export interface DivisionFillRateMeta {
 fillRate: number; // 0 ~ 100
 tier: FillRateTier;
 label: string;
 badgeTone: string;
 barColor: string;
 combatEfficiency: number; // 0.2 ~ 1.0 战力系数
 orgMultiplier: number; // 组织度折减
 defenseMultiplier: number; // 防御折减
 attackMultiplier: number; // 突破/攻击折减
}

/**
 * 师级人员满员率及战力平滑折减体系
 * - 90% ~ 100%：满员正常 (绿) 战力 100%
 * - 70% ~ 89%：轻度缺员 (黄) 战力 85%
 * - 40% ~ 69%：严重缺员 (橙) 战力 55%
 * - 0% ~ 39%：编制残缺 (红) 战力 25%
 */
export function getDivisionFillRateMeta(division: ArmyDivision): DivisionFillRateMeta {
 const current = division.manpower || 0;
 const max = division.manpowerMax || (division.type.includes('装甲') ? 8500 : division.type.includes('摩托') ? 9000 : 10000);
 const fillRate = Math.max(0, Math.min(100, Math.round((current / Math.max(1, max)) * 100)));

 if (fillRate >= 90) {
  return {
   fillRate,
   tier: 'optimal',
   label: '编制满员',
   badgeTone: 'text-emerald-400 border-emerald-500/30 bg-emerald-950/30',
   barColor: 'bg-emerald-500',
   combatEfficiency: 1.0,
   orgMultiplier: 1.0,
   defenseMultiplier: 1.0,
   attackMultiplier: 1.0,
  };
 }
 if (fillRate >= 70) {
  const ratio = 0.85 + ((fillRate - 70) / 20) * 0.15;
  return {
   fillRate,
   tier: 'light_shortage',
   label: '轻度缺员',
   badgeTone: 'text-amber-400 border-amber-500/30 bg-amber-950/30',
   barColor: 'bg-amber-500',
   combatEfficiency: Number(ratio.toFixed(2)),
   orgMultiplier: Number((0.9 + ((fillRate - 70) / 20) * 0.1).toFixed(2)),
   defenseMultiplier: Number(ratio.toFixed(2)),
   attackMultiplier: Number(ratio.toFixed(2)),
  };
 }
 if (fillRate >= 40) {
  const ratio = 0.55 + ((fillRate - 40) / 30) * 0.3;
  return {
   fillRate,
   tier: 'severe_shortage',
   label: '严重缺员',
   badgeTone: 'text-orange-400 border-orange-500/30 bg-orange-950/30',
   barColor: 'bg-orange-500',
   combatEfficiency: Number(ratio.toFixed(2)),
   orgMultiplier: Number((0.6 + ((fillRate - 40) / 30) * 0.3).toFixed(2)),
   defenseMultiplier: Number(ratio.toFixed(2)),
   attackMultiplier: Number(ratio.toFixed(2)),
  };
 }

 const ratio = Math.max(0.15, 0.25 * (fillRate / 40));
 return {
  fillRate,
  tier: 'critical',
  label: '编制残缺',
  badgeTone: 'text-rose-400 border-rose-500/30 bg-rose-950/30',
  barColor: 'bg-rose-500',
  combatEfficiency: Number(ratio.toFixed(2)),
  orgMultiplier: Number(Math.max(0.2, fillRate / 40 * 0.5).toFixed(2)),
  defenseMultiplier: Number(ratio.toFixed(2)),
  attackMultiplier: Number(ratio.toFixed(2)),
 };
}
