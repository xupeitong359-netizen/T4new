import { Nation, ProvinceData } from '../types';
import { DEFAULT_ACTIVE_DECREE_IDS, PRESET_DECREES, PRESET_MINISTERS } from '../services/strategicGameplayService';

// =========================================================================
// 核心经济常数 (HOI4 NATIONAL ECONOMY CONSTANTS)
// =========================================================================
// 1 座民生工厂在 24 小时 (86,400 秒) 内默认产生 1,000,000 (1M) 基准 GDP
export const BASE_GDP_PER_CIV_FACTORY_24H = 1_000_000;
export const MS_IN_24H = 86_400_000; // 24 * 60 * 60 * 1000
export const BASE_GDP_PER_MS_PER_FACTORY = BASE_GDP_PER_CIV_FACTORY_24H / MS_IN_24H; // ~0.011574074074 GDP/ms

export interface EfficiencyModifier {
 label: string;
 source: 'base' | 'decree' | 'minister' | 'infrastructure' | 'tech' | 'ideology';
 bonus: number; // e.g. 0.25 for +25%
 description?: string;
}

export interface NationalEconomyStats {
 totalCivFactories: number;
 economicEfficiency: number; // e.g. 1.25 for 125%
 efficiencyModifiers: EfficiencyModifier[];
 taxRate: number; // e.g. 20 for 20%
 currencyName: string;
 currencySymbol: string;
 currentGDP: number; // 实时毫秒级累计 GDP
 currentTreasury: number; // 实时毫秒级国库储备
 dailyGDP: number; // 24h 预期产出速度
 dailyFiscalRevenue: number; // 24h 预期财政税收速度
 perSecondGDP: number; // 每秒产出速度
 perSecondRevenue: number; // 每秒国库流入速度
 annualizedGDP: number; // 年化 GDP (dailyGDP * 365)
 provinceBreakdowns: ProvinceEconomyBreakdown[];
}

export interface ProvinceEconomyBreakdown {
 provinceId: string | number;
 provinceName: string;
 civilianFactories: number;
 infrastructureLevel: number;
 localEfficiencyBonus: number;
 dailyGDPContribution: number;
 dailyRevenueContribution: number;
}

/**
 * 获取单个省份的合法民生工厂数量 (统一优先读取 detailedBuildings.civilian_factory，其次读取 civilianFactories)
 */
export function getProvinceCivilianFactories(province: Partial<ProvinceData> | null | undefined): number {
 if (!province) return 0;
 const detailed = province.detailedBuildings?.civilian_factory;
 if (typeof detailed === 'number' && Number.isFinite(detailed)) {
  return Math.max(0, Math.min(30, Math.floor(detailed)));
 }
 const direct = province.civilianFactories;
 if (typeof direct === 'number' && Number.isFinite(direct)) {
  return Math.max(0, Math.min(30, Math.floor(direct)));
 }
 return 0;
}

/**
 * 计算国家所有省份的合法民生工厂总数
 */
export function getTotalCivilianFactories(nation: Partial<Nation> | null | undefined): number {
 if (!nation || !nation.provinces || !Array.isArray(nation.provinces)) {
  return 0;
 }

 return nation.provinces.reduce((total, prov) => total + getProvinceCivilianFactories(prov), 0);
}

/**
 * 汇总计算国家的经济效率综合修正乘数 (Economic Efficiency)
 */
export function calculateEconomicEfficiency(nation: Partial<Nation> | null | undefined): {
 totalEfficiency: number;
 modifiers: EfficiencyModifier[];
} {
 const modifiers: EfficiencyModifier[] = [
  {
   label: '基础工业标准产出',
   source: 'base',
   bonus: 1.0,
   description: '国家基础工业标准产能（100%）',
  },
 ];

 if (!nation) {
  return { totalEfficiency: 1.0, modifiers };
 }

 let totalBonus = 0;

 // 1. 领主执政法令加成
 const activeDecreeIds = Array.isArray(nation.activeDecreeIds) ? nation.activeDecreeIds : DEFAULT_ACTIVE_DECREE_IDS;
 if (activeDecreeIds.length > 0) {
  activeDecreeIds.forEach((decreeId) => {
   const decree = PRESET_DECREES.find((d) => d.id === decreeId);
   if (decree && decree.effects?.civCapacityMultiplier) {
    const bonus = decree.effects.civCapacityMultiplier;
    totalBonus += bonus;
    modifiers.push({
     label: decree.name,
     source: 'decree',
     bonus,
     description: `执政法令：民工效能 ${bonus > 0 ? '+' : ''}${Math.round(bonus * 100)}%`,
    });
   }
  });
 }

 // 2. 内阁智库大臣加成
 if (nation.ministers) {
  // 财政大臣加成
  if (nation.ministers.finance) {
   const finMinister = PRESET_MINISTERS.find((m) => m.id === nation.ministers?.finance);
   if (finMinister) {
    const bonus = 0.15; // 财政与关税总长 +15% 经济效率
    totalBonus += bonus;
    modifiers.push({
     label: `${finMinister.roleTitle} · ${finMinister.name}`,
     source: 'minister',
     bonus,
     description: `内阁执政：优化财税与流通机制 +${Math.round(bonus * 100)}%`,
    });
   }
  }

  // 工业大臣加成
  if (nation.ministers.industry) {
   const indMinister = PRESET_MINISTERS.find((m) => m.id === nation.ministers?.industry);
   if (indMinister) {
    const bonus = 0.1; // 工业大臣 +10%
    totalBonus += bonus;
    modifiers.push({
     label: `${indMinister.roleTitle} · ${indMinister.name}`,
     source: 'minister',
     bonus,
     description: `内阁执政：重工效能提升 +${Math.round(bonus * 100)}%`,
    });
   }
  }
 }

 // 3. 全境省份平均基础设施加成
 if (nation.provinces && nation.provinces.length > 0) {
  const totalInfra = nation.provinces.reduce((acc, p) => {
   const infra = p.detailedBuildings?.infrastructure ?? 1;
   return acc + Math.max(1, Math.min(5, Number(infra) || 1));
  }, 0);
  const avgInfra = totalInfra / nation.provinces.length;
  // 平均基建每超过 Lv.1 级，提供 +3% 全国流通效能 (最高 Lv.5 提供 +12%)
  const infraBonus = Math.max(0, (avgInfra - 1) * 0.03);
  if (infraBonus > 0) {
   totalBonus += infraBonus;
   modifiers.push({
    label: `全国基础设施网络 (平均 Lv.${avgInfra.toFixed(1)})`,
    source: 'infrastructure',
    bonus: infraBonus,
    description: `全国平整交通与物流管网效率 +${(infraBonus * 100).toFixed(1)}%`,
   });
  }
 }

 // 4. 科研工业科技加成 (已研发的工业分支科技)
 if (nation.researchedTechIds && Array.isArray(nation.researchedTechIds)) {
  const industryTechs = [
   { id: 'ind_basic_tools', name: '基础机器工具', bonus: 0.08 },
   { id: 'ind_improved_tools', name: '改良机器工具', bonus: 0.10 },
   { id: 'ind_advanced_tools', name: '先进机器工具', bonus: 0.12 },
   { id: 'ind_concentrated_1', name: '浓缩工业体系 I', bonus: 0.10 },
   { id: 'ind_concentrated_2', name: '浓缩工业体系 II', bonus: 0.15 },
  ];

  industryTechs.forEach((t) => {
   if (nation.researchedTechIds?.includes(t.id)) {
    totalBonus += t.bonus;
    modifiers.push({
     label: `科技：${t.name}`,
     source: 'tech',
     bonus: t.bonus,
     description: `工业研发加成 +${Math.round(t.bonus * 100)}%`,
    });
   }
  });
 }

 // 5. 意识形态加成
 if (nation.ideology === '重商资本主义') {
  const bonus = 0.12;
  totalBonus += bonus;
  modifiers.push({
   label: '意识形态：重商资本主义',
   source: 'ideology',
   bonus,
   description: '高度自由商贸体制与民间投融资 +12%',
  });
 } else if (nation.ideology === '科技理性主义') {
  const bonus = 0.08;
  totalBonus += bonus;
  modifiers.push({
   label: '意识形态：科技理性主义',
   source: 'ideology',
   bonus,
   description: '精密规划与生产自动化 +8%',
  });
 }

 const finalEfficiency = Math.max(0.2, 1.0 + totalBonus);
 return {
  totalEfficiency: Number(finalEfficiency.toFixed(4)),
  modifiers,
 };
}

/**
 * 核心系统自动计算函数：根据工厂数、效率、税率与时间流逝，精确推导当前 GDP 与国库
 */
export function calculateNationalEconomy(
 nation: Partial<Nation> | null | undefined,
 targetTimestamp: number = Date.now()
): NationalEconomyStats {
 const totalCivFactories = getTotalCivilianFactories(nation);
 const { totalEfficiency, modifiers } = calculateEconomicEfficiency(nation);

 // 税率：默认 20%，限制在合法区间 5% ~ 50%
 const rawTaxRate = nation?.economy?.taxRate ?? nation?.taxRate ?? 20;
 const taxRate = Math.max(5, Math.min(50, Number(rawTaxRate) || 20));

 // 货币自定义名称与符号 (修改币名不改变底层计算数值)
 const currencyName = nation?.economy?.currencyName || nation?.currency || '玲玉币';
 const currencySymbol = nation?.economy?.currencySymbol || (currencyName === '玲玉币' ? '¥' : '¥');

 // 24小时产出速度
 const dailyGDP = totalCivFactories * BASE_GDP_PER_CIV_FACTORY_24H * totalEfficiency;
 const dailyFiscalRevenue = dailyGDP * (taxRate / 100);

 const perSecondGDP = dailyGDP / 86400;
 const perSecondRevenue = dailyFiscalRevenue / 86400;
 const annualizedGDP = dailyGDP * 365;

 // 历史基准数据与时间差计算 (毫秒级连续积分推演)
 let baseGDP = Number(nation?.economy?.baseGDP) || 0;
 let baseTreasury = Number(nation?.economy?.baseTreasury) || 0;
 let lastCalcTime = nation?.economy?.lastCalculatedAt
  ? Date.parse(nation.economy.lastCalculatedAt)
  : Date.now() - 3600000 * 24 * 7; // 默认回溯 7 天作为历史积累

 // 如果从未设置过基准，以 10 天产出作为初始国库和初始累计 GDP
 if (!nation?.economy?.baseGDP && totalCivFactories > 0) {
  baseGDP = dailyGDP * 10;
  baseTreasury = dailyFiscalRevenue * 10;
  lastCalcTime = targetTimestamp - 86400000 * 3;
 }

 const elapsedMs = Math.max(0, targetTimestamp - lastCalcTime);

 // 毫秒级增量累计
 const gdpIncrement = (dailyGDP / MS_IN_24H) * elapsedMs;
 const treasuryIncrement = (dailyFiscalRevenue / MS_IN_24H) * elapsedMs;

 const currentGDP = Math.max(0, baseGDP + gdpIncrement);
 const currentTreasury = Math.max(0, baseTreasury + treasuryIncrement);

 // 各省份细分贡献
 const provinceBreakdowns: ProvinceEconomyBreakdown[] = (nation?.provinces || []).map((p) => {
  const provCiv = p.detailedBuildings?.civilian_factory ?? p.civilianFactories ?? 0;
  const infra = p.detailedBuildings?.infrastructure ?? 1;
  const localBonus = (infra - 1) * 0.05; // 该省基建额外产出加成
  const provDailyGDP = provCiv * BASE_GDP_PER_CIV_FACTORY_24H * (totalEfficiency + localBonus);
  const provDailyRevenue = provDailyGDP * (taxRate / 100);

  return {
   provinceId: p.id,
   provinceName: p.name,
   civilianFactories: provCiv,
   infrastructureLevel: infra,
   localEfficiencyBonus: localBonus,
   dailyGDPContribution: provDailyGDP,
   dailyRevenueContribution: provDailyRevenue,
  };
 });

 return {
  totalCivFactories,
  economicEfficiency: totalEfficiency,
  efficiencyModifiers: modifiers,
  taxRate,
  currencyName,
  currencySymbol,
  currentGDP,
  currentTreasury,
  dailyGDP,
  dailyFiscalRevenue,
  perSecondGDP,
  perSecondRevenue,
  annualizedGDP,
  provinceBreakdowns,
 };
}

/**
 * 格式化大数字：标准“万、亿、万亿”中文缩写与千分位完整数值
 */
export function formatChineseNumber(value: number, decimals: number = 2): {
 shortText: string;
 fullText: string;
 unit: string;
 valueInUnit: number;
} {
 const abs = Math.abs(value);
 const sign = value < 0 ? '-' : '';

 // 完整不缩写数值 (如 1,234,567,890.12)
 const fullText = sign + abs.toLocaleString('zh-CN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
 });

 if (abs >= 1_000_000_000_000) {
  // 万亿
  const v = abs / 1_000_000_000_000;
  return {
   shortText: `${sign}${v.toFixed(decimals >= 3 ? decimals : 3)} 万亿`,
   fullText,
   unit: '万亿',
   valueInUnit: v,
  };
 }

 if (abs >= 100_000_000) {
  // 亿
  const v = abs / 100_000_000;
  return {
   shortText: `${sign}${v.toFixed(decimals >= 2 ? decimals : 2)} 亿`,
   fullText,
   unit: '亿',
   valueInUnit: v,
  };
 }

 if (abs >= 10_000) {
  // 万
  const v = abs / 10_000;
  return {
   shortText: `${sign}${v.toFixed(decimals >= 2 ? decimals : 2)} 万`,
   fullText,
   unit: '万',
   valueInUnit: v,
  };
 }

 // < 1万
 return {
  shortText: `${sign}${abs.toFixed(decimals)}`,
  fullText,
  unit: '',
  valueInUnit: abs,
 };
}
