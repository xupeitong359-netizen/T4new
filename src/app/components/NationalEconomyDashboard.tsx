import React, { useState } from 'react';
import {
 TrendingUp,
 Coins,
 Percent,
 Sliders,
 Check,
 AlertCircle,
 Copy,
 ChevronRight,
 BarChart3,
 Flame,
 Zap,
 Hammer,
 Building2,
} from 'lucide-react';
import { Nation } from '../types';
import { getProvinceChineseName } from '../lib/provinceTranslations';
import { useEconomyTicker } from '../lib/useEconomyTicker';
import {
 formatChineseNumber,
 BASE_GDP_PER_CIV_FACTORY_24H,
} from '../lib/economyEngine';
import { api } from '../services/api';
import { CivilianFactoryPlantIcon } from '../lib/icons';

interface NationalEconomyDashboardProps {
 nation: Nation;
 isOwner: boolean;
 onUpdateNation?: (updated: Nation) => void;
 onOpenConstruction?: () => void;
 showToast?: (msg: string) => void;
}

type InspectMetricType = 'gdp' | 'treasury' | 'daily_gdp' | 'daily_revenue' | 'efficiency' | null;

export const NationalEconomyDashboard: React.FC<NationalEconomyDashboardProps> = ({
 nation,
 isOwner,
 onUpdateNation,
 onOpenConstruction,
 showToast,
}) => {
 // 毫秒级高频跳动数据源
 const stats = useEconomyTicker(nation, true);

 // 弹窗查看详细未缩写精确数据
 const [inspectMetric, setInspectMetric] = useState<InspectMetricType>(null);
 const [copiedText, setCopiedText] = useState(false);

 // 税率调整状态 (仅所有者可调控)
 const [editingTaxRate, setEditingTaxRate] = useState<number>(stats.taxRate);
 const [isSubmittingTax, setIsSubmittingTax] = useState(false);

 // 同步外部 nation 的 taxRate 变化
 React.useEffect(() => {
  setEditingTaxRate(stats.taxRate);
 }, [stats.taxRate]);

 // 格式化展示数据
 const dailyGDPFormatted = formatChineseNumber(stats.dailyGDP, 2);
 const dailyRevenueFormatted = formatChineseNumber(stats.dailyFiscalRevenue, 2);

 // 分离毫秒级末尾微数字以实现战略跳动视觉
 const gdpFullStr = stats.currentGDP.toLocaleString('zh-CN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
 });
 const [gdpMain, gdpDecimals = '00'] = gdpFullStr.split('.');

 const treasuryFullStr = stats.currentTreasury.toLocaleString('zh-CN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
 });
 const [treasuryMain, treasuryDecimals = '00'] = treasuryFullStr.split('.');

 const handleCopy = (text: string) => {
  navigator.clipboard.writeText(text);
  setCopiedText(true);
  setTimeout(() => setCopiedText(false), 2000);
  if (showToast) showToast(' 已复制精确数值到剪贴板');
 };

 // 提交税率调整
 const handleSaveTaxRate = async () => {
  if (!isOwner) return;
  if (editingTaxRate < 5 || editingTaxRate > 50) {
   if (showToast) showToast(' 税率必须设置在 5% ~ 50% 的合法宏观调控区间');
   return;
  }

  try {
   setIsSubmittingTax(true);
   const res = await api.nations.updateEconomy(nation.id, {
    taxRate: editingTaxRate,
   });
   if (onUpdateNation) onUpdateNation(res.nation);
   if (showToast) showToast(res.message || ' 宏观财税法案已正式颁布！');
  } catch (err: any) {
   if (showToast) showToast(` 调整税率失败: ${err.message || '网络异常'}`);
  } finally {
   setIsSubmittingTax(false);
  }
 };

 return (
  <div className="w-full space-y-3 font-sans text-slate-100 selection:bg-amber-950 selection:text-amber-200">
   {/* ========================================================================= */}
   {/* 1. TOP STRATEGIC MACROECONOMIC HUD (4核心战略指标仪表盘) */}
   {/* ========================================================================= */}
   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
    {/* 指标 1：实时累计 GDP (毫秒级跳动) */}
    <div
     id="economy-hud-gdp-card"
     onClick={() => setInspectMetric('gdp')}
     className="bg-[#0b1019] border border-[#1e2a3c] p-3 rounded-none relative group hover:border-amber-500/60 transition cursor-pointer flex flex-col justify-between overflow-hidden shadow-xs"
    >
     <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
      <span className="flex items-center gap-1.5 font-bold text-amber-400 uppercase tracking-wide">
       <TrendingUp className="w-3.5 h-3.5" />
       <span>国家生产总值 (GDP)</span>
      </span>
      <span className="text-[10px] text-amber-500/80 group-hover:text-amber-300 font-mono flex items-center gap-0.5">
       <span>查看详值</span>
       <ChevronRight className="w-3 h-3" />
      </span>
     </div>

     {/* 毫秒跳动核心大数字 */}
     <div className="my-1">
      <div className="flex items-baseline gap-1">
       <span className="text-sm font-black text-amber-300 font-mono">
        {stats.currencySymbol}
       </span>
       <div className="text-xl sm:text-2xl font-black font-mono tracking-tight text-white tabular-nums flex items-baseline">
        <span className="text-base sm:text-xl">{gdpFullStr}</span>
       </div>
      </div>
      {/* 毫秒流水细字 */}
      <div className="text-[10px] font-mono text-slate-400 mt-0.5 flex items-center justify-between">
       <span className="truncate">
        累计 {stats.currencySymbol}
        <span className="text-slate-300 font-semibold">{gdpMain}</span>
        <span className="text-amber-400 font-bold">{gdpDecimals}</span>
       </span>
       <span className="text-emerald-400 font-mono text-[9px] shrink-0 ml-1">
        +{(stats.perSecondGDP).toFixed(1)}/s
       </span>
      </div>
     </div>

     {/* 底部产出速度 */}
     <div className="pt-2 mt-1 border-t border-[#182333] flex items-center justify-between text-[11px] text-slate-400">
      <span>24h 产出速度:</span>
      <span className="font-mono font-bold text-slate-200">
       {dailyGDPFormatted.shortText} {stats.currencyName}
      </span>
     </div>
    </div>

    {/* 指标 2：国库储备与流动资金 (毫秒级跳动) */}
    <div
     id="economy-hud-treasury-card"
     onClick={() => setInspectMetric('treasury')}
     className="bg-[#0b1019] border border-[#1e2a3c] p-3 rounded-none relative group hover:border-emerald-500/60 transition cursor-pointer flex flex-col justify-between overflow-hidden shadow-xs"
    >
     <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
      <span className="flex items-center gap-1.5 font-bold text-emerald-400 uppercase tracking-wide">
       <Coins className="w-3.5 h-3.5" />
       <span>国库资金储备 (Treasury)</span>
      </span>
      <span className="text-[10px] text-emerald-500/80 group-hover:text-emerald-300 font-mono flex items-center gap-0.5">
       <span>查看详值</span>
       <ChevronRight className="w-3 h-3" />
      </span>
     </div>

     {/* 毫秒跳动国库大数字 */}
     <div className="my-1">
      <div className="flex items-baseline gap-1">
       <span className="text-sm font-black text-emerald-300 font-mono">
        {stats.currencySymbol}
       </span>
       <div className="text-xl sm:text-2xl font-black font-mono tracking-tight text-white tabular-nums flex items-baseline">
        <span className="text-base sm:text-xl">{treasuryFullStr}</span>
       </div>
      </div>
      {/* 毫秒流水细字 */}
      <div className="text-[10px] font-mono text-slate-400 mt-0.5 flex items-center justify-between">
       <span className="truncate">
        金库 {stats.currencySymbol}
        <span className="text-slate-300 font-semibold">{treasuryMain}</span>
        <span className="text-emerald-400 font-bold">{treasuryDecimals}</span>
       </span>
       <span className="text-emerald-400 font-mono text-[9px] shrink-0 ml-1">
        +{(stats.perSecondRevenue).toFixed(2)}/s
       </span>
      </div>
     </div>

     {/* 底部税收速度 */}
     <div className="pt-2 mt-1 border-t border-[#182333] flex items-center justify-between text-[11px] text-slate-400">
      <span>24h 税收净入:</span>
      <span className="font-mono font-bold text-emerald-300">
       +{dailyRevenueFormatted.shortText} {stats.currencyName}
      </span>
     </div>
    </div>

    {/* 指标 3：民生工厂网络与工业产能 */}
    <div
     id="economy-hud-factories-card"
     onClick={() => setInspectMetric('daily_gdp')}
     className="bg-[#0b1019] border border-[#1e2a3c] p-3 rounded-none relative group hover:border-sky-500/60 transition cursor-pointer flex flex-col justify-between overflow-hidden shadow-xs"
    >
     <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
      <span className="flex items-center gap-1.5 font-bold text-sky-400 uppercase tracking-wide">
       <CivilianFactoryPlantIcon size={14} className="text-sky-400" />
       <span>民生工厂母网 (Civ Factories)</span>
      </span>
      <span className="text-[10px] text-sky-400 font-mono">工业母机</span>
     </div>

     <div className="my-1 flex items-baseline justify-between">
      <div className="flex items-baseline gap-1">
       <span className="text-2xl font-black font-mono tracking-tight text-white">
        {stats.totalCivFactories}
       </span>
       <span className="text-xs text-slate-400 font-bold">座工厂</span>
      </div>
      <div className="text-right">
       <span className="text-xs font-mono font-bold text-sky-300">
        1M / 24h · 座
       </span>
      </div>
     </div>

     <div className="pt-2 mt-1 border-t border-[#182333] flex items-center justify-between text-[11px] text-slate-400">
      <span>综合经济效率:</span>
      <span className="font-mono font-bold text-amber-300">
       {(stats.economicEfficiency * 100).toFixed(1)}%
      </span>
     </div>
    </div>

    {/* 指标 4：宏观税率与财政调控 */}
    <div
     id="economy-hud-tax-card"
     onClick={() => setInspectMetric('daily_revenue')}
     className="bg-[#0b1019] border border-[#1e2a3c] p-3 rounded-none relative group hover:border-indigo-500/60 transition cursor-pointer flex flex-col justify-between overflow-hidden shadow-xs"
    >
     <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
      <span className="flex items-center gap-1.5 font-bold text-indigo-400 uppercase tracking-wide">
       <Percent className="w-3.5 h-3.5" />
       <span>宏观法定税率 (Tax Rate)</span>
      </span>
      <span className="text-[10px] text-indigo-300 font-mono">财政律法</span>
     </div>

     <div className="my-1 flex items-baseline justify-between">
      <div className="flex items-baseline gap-1">
       <span className="text-2xl font-black font-mono tracking-tight text-white">
        {stats.taxRate.toFixed(1)}%
       </span>
       <span className="text-xs text-slate-400 font-bold">征收基准</span>
      </div>
      <div className="text-right">
       <span className="text-[11px] font-mono text-emerald-400 font-bold">
        +{(stats.perSecondRevenue * 60).toFixed(0)}/分
       </span>
      </div>
     </div>

     <div className="pt-2 mt-1 border-t border-[#182333] flex items-center justify-between text-[11px] text-slate-400">
      <span>年化财政预算:</span>
      <span className="font-mono font-bold text-slate-200">
       {formatChineseNumber(stats.dailyFiscalRevenue * 365, 2).shortText}
      </span>
     </div>
    </div>
   </div>

   {/* ========================================================================= */}
   {/* 2. CORE CONTROLS & BREAKDOWNS (钢铁雄心4风格中层战术控制台) */}
   {/* ========================================================================= */}
   <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
    {/* 左侧: 财税政策调控台 与 宏观经济推演速览 */}
    <div className="space-y-2.5">
     {/* A. 财政税率调控面板 */}
     <div className="bg-[#0b1019] border border-[#1e2a3c] p-3.5 rounded-none shadow-xs space-y-3">
      <div className="flex items-center justify-between border-b border-[#182333] pb-2">
       <div className="flex items-center gap-2">
        <Sliders className="w-4 h-4 text-indigo-400" />
        <span className="text-xs font-black text-slate-200 uppercase tracking-wider">
         国家宏观财税调控署 · 税率立法
        </span>
       </div>
       <span className="text-[10px] font-mono px-2 py-0.5 bg-indigo-950 text-indigo-300 border border-indigo-700/50">
        现行: {stats.taxRate.toFixed(1)}%
       </span>
      </div>

      {/* 税率调节器 */}
      <div className="space-y-2">
       <div className="flex items-center justify-between text-xs">
        <span className="text-slate-400">法定宏观税率滑块 (5% ~ 50%)</span>
        <span className="font-mono font-extrabold text-amber-300 text-sm">
         {editingTaxRate.toFixed(1)}%
        </span>
       </div>

       <input
        id="economy-tax-rate-slider"
        type="range"
        min="5"
        max="50"
        step="0.5"
        disabled={!isOwner}
        value={editingTaxRate}
        onChange={(e) => setEditingTaxRate(parseFloat(e.target.value))}
        className="w-full h-1.5 bg-[#172233] accent-amber-500 rounded-none cursor-pointer"
       />

       {/* 预设快捷税率按钮 */}
       {isOwner && (
        <div className="grid grid-cols-4 gap-1.5 pt-1">
         {[
          { rate: 5, label: '5% 极低免税', desc: '藏富于民' },
          { rate: 15, label: '15% 重商低税', desc: '工商业扩张' },
          { rate: 25, label: '25% 稳健税率', desc: '常态财政' },
          { rate: 40, label: '40% 战备重税', desc: '紧急充盈' },
         ].map((p) => (
          <button
           key={p.rate}
           type="button"
           onClick={() => setEditingTaxRate(p.rate)}
           className={`p-1.5 text-center text-xs font-mono border transition cursor-pointer ${
            editingTaxRate === p.rate
             ? 'bg-amber-950/80 border-amber-500 text-amber-200 font-bold'
             : 'bg-[#121a28] border-[#1e2a3c] text-slate-400 hover:text-slate-200 hover:bg-[#182335]'
           }`}
          >
           <div className="font-bold">{p.label}</div>
           <div className="text-[9px] text-slate-400 scale-90">{p.desc}</div>
          </button>
         ))}
        </div>
       )}

       {/* 预期财政影响评估 */}
       <div className="p-2.5 bg-[#070b12] border border-[#162030] text-xs space-y-1 font-mono">
        <div className="flex items-center justify-between text-slate-400 text-[11px]">
         <span>基于当前民工 ({stats.totalCivFactories}座) 与效率 ({(stats.economicEfficiency * 100).toFixed(1)}%) 测算：</span>
        </div>
        <div className="flex items-center justify-between text-slate-300">
         <span>预估每日财政税收:</span>
         <span className="text-emerald-400 font-bold">
          +{formatChineseNumber(stats.dailyGDP * (editingTaxRate / 100), 2).shortText} {stats.currencyName} / 24h
         </span>
        </div>
        <div className="flex items-center justify-between text-slate-400 text-[10px]">
         <span>建筑工程建造速度修正:</span>
         <span className={editingTaxRate > 30 ? 'text-rose-400' : editingTaxRate < 15 ? 'text-emerald-400' : 'text-slate-300'}>
          {editingTaxRate > 35
           ? ' 战时重税压制 (-15% 建造速度)'
           : editingTaxRate > 25
           ? '正常税负 (-5% 建造速度)'
           : editingTaxRate <= 10
           ? '免税刺激 (+10% 建造速度)'
           : '重商轻税 (+5% 建造速度)'}
         </span>
        </div>
       </div>

       {/* 保存按钮 */}
       {isOwner && (
        <div className="flex justify-end pt-1">
         <button
          id="save-tax-rate-btn"
          type="button"
          onClick={handleSaveTaxRate}
          disabled={isSubmittingTax || editingTaxRate === stats.taxRate}
          className={`px-4 py-1.5 text-xs font-bold font-mono uppercase tracking-wider flex items-center gap-1.5 border transition cursor-pointer ${
           editingTaxRate !== stats.taxRate
            ? 'bg-amber-600 hover:bg-amber-500 text-black border-amber-400 font-black shadow-xs'
            : 'bg-[#121a28] text-slate-400 border-[#1e2a3c] cursor-not-allowed'
          }`}
         >
          <Check className="w-3.5 h-3.5" />
          <span>{isSubmittingTax ? '正在颁布法令...' : '颁布新宏观税率'}</span>
         </button>
        </div>
       )}
      </div>
     </div>

     {/* B. 宏观经济健康度与大战略摘要 */}
     <div className="bg-[#0b1019] border border-[#1e2a3c] p-3.5 rounded-none shadow-xs space-y-2.5">
      <div className="flex items-center justify-between border-b border-[#182333] pb-2">
       <div className="flex items-center gap-2 text-xs font-black text-slate-200 uppercase tracking-wider">
        <BarChart3 className="w-4 h-4 text-emerald-400" />
        <span>大战略宏观经济推演速览</span>
       </div>
       <span className="text-[11px] font-mono text-slate-400">
        流通货币：<strong className="text-amber-300">{stats.currencyName}</strong> ({stats.currencySymbol})
       </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
       <div className="p-2.5 bg-[#060a12] border border-[#141e2d]">
        <span className="text-[10px] text-slate-400 block">年化产值 (Annual GDP)</span>
        <span className="font-bold text-slate-200 text-sm">
         {formatChineseNumber(stats.annualizedGDP, 2).shortText}
        </span>
       </div>
       <div className="p-2.5 bg-[#060a12] border border-[#141e2d]">
        <span className="text-[10px] text-slate-400 block">年化税收 (Annual Tax)</span>
        <span className="font-bold text-emerald-300 text-sm">
         {formatChineseNumber(stats.annualizedGDP * (stats.taxRate / 100), 2).shortText}
        </span>
       </div>
       <div className="p-2.5 bg-[#060a12] border border-[#141e2d]">
        <span className="text-[10px] text-slate-400 block">单座民工日产出</span>
        <span className="font-bold text-amber-300 text-sm">
         {((BASE_GDP_PER_CIV_FACTORY_24H * stats.economicEfficiency) / 10000).toFixed(2)} 万/24h
        </span>
       </div>
       <div className="p-2.5 bg-[#060a12] border border-[#141e2d]">
        <span className="text-[10px] text-slate-400 block">每秒国家现金流入</span>
        <span className="font-bold text-emerald-400 text-sm">
         +{stats.perSecondRevenue.toFixed(2)} {stats.currencySymbol}/s
        </span>
       </div>
      </div>
     </div>
    </div>

    {/* 右侧: 经济效率修正因子列表 与 工业扩建行动 */}
    <div className="space-y-2.5">
     {/* 综合经济效率构成 */}
     <div className="bg-[#0b1019] border border-[#1e2a3c] p-3.5 rounded-none shadow-xs space-y-3 h-full flex flex-col justify-between">
      <div className="space-y-3">
       <div className="flex items-center justify-between border-b border-[#182333] pb-2">
        <div className="flex items-center gap-2">
         <Zap className="w-4 h-4 text-amber-400" />
         <span className="text-xs font-black text-slate-200 uppercase tracking-wider">
          综合经济效率矩阵 (Efficiency)
         </span>
        </div>
        <span className="text-xs font-mono font-black text-amber-300 px-2 py-0.5 bg-amber-950/70 border border-amber-600/40">
         {(stats.economicEfficiency * 100).toFixed(1)}%
        </span>
       </div>

       <p className="text-[11px] text-slate-400 leading-normal">
        经济效率直接放大民生工厂的实际产值。受到国家法令、内阁大臣、全境基建网络与科研工业分支技术共同赋能：
       </p>

       <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
        {stats.efficiencyModifiers.map((mod, idx) => (
         <div
          key={idx}
          className="p-2 bg-[#060a12] border border-[#172233] flex items-center justify-between text-xs"
         >
          <div className="min-w-0 pr-2">
           <span className="font-bold text-slate-200 block truncate">{mod.label}</span>
           {mod.description && (
            <span className="text-[10px] text-slate-400 block truncate">{mod.description}</span>
           )}
          </div>
          <span
           className={`font-mono font-black shrink-0 text-xs ${
            mod.bonus > 0 ? 'text-emerald-400' : mod.bonus < 0 ? 'text-rose-400' : 'text-slate-300'
           }`}
          >
           {mod.source === 'base' ? '100%' : `${mod.bonus > 0 ? '+' : ''}${(mod.bonus * 100).toFixed(0)}%`}
          </span>
         </div>
        ))}
       </div>
      </div>

      {/* 快速工业扩建跳转 */}
      {onOpenConstruction && (
       <div className="pt-3 border-t border-[#182333] flex items-center justify-between mt-auto">
        <span className="text-[11px] text-slate-400">扩张民工以提升 GDP？</span>
        <button
         type="button"
         onClick={onOpenConstruction}
         className="px-3.5 py-1.5 bg-[#172538] hover:bg-[#20334d] text-sky-300 hover:text-sky-200 text-xs font-bold font-mono border border-sky-600/40 flex items-center gap-1.5 transition cursor-pointer"
        >
         <Hammer className="w-3.5 h-3.5" />
         <span>建造民用工厂</span>
        </button>
       </div>
      )}
     </div>
    </div>
   </div>

   {/* ========================================================================= */}
   {/* 3. PROVINCE INDUSTRIAL REGIONAL BREAKDOWN (各省民工与 GDP 分布) */}
   {/* ========================================================================= */}
   <div className="bg-[#070b13] border border-[#162234] p-3 rounded-sm shadow-2xs space-y-2.5">
    {/* Header with shortened punchy title and concise province counter */}
    <div className="flex items-center justify-between border-b border-[#121c2b] pb-2">
     <div className="flex items-center gap-1.5 min-w-0">
      <Flame className="w-3.5 h-3.5 text-sky-400 shrink-0" />
      <span className="text-xs font-bold text-slate-200 tracking-wide truncate">
       各省民工与 GDP 分布
      </span>
     </div>
     <span className="text-[10px] font-mono text-slate-400 bg-[#0e1624] px-1.5 py-0.5 rounded-xs border border-slate-800 shrink-0">
      {stats.provinceBreakdowns.length} 个行省
     </span>
    </div>

    {stats.provinceBreakdowns.length === 0 ? (
     <div className="py-5 text-center text-xs text-slate-500 font-mono">
      暂无省份工业数据，请在地图上或国家管理中确立行省。
     </div>
    ) : (
     <>
      {/* Mobile View: Independent Compact Cyberpunk Cards (No Horizontal Scroll) */}
      <div className="block md:hidden space-y-2">
       {stats.provinceBreakdowns.map((prov) => {
        const share = stats.dailyGDP > 0 ? (prov.dailyGDPContribution / stats.dailyGDP) * 100 : 0;
        return (
         <div
          key={`mobile-prov-${prov.provinceId}`}
          className="p-2.5 bg-[#0a101c] border border-[#172338] rounded-xs space-y-2 shadow-2xs"
         >
          {/* Top Row: Region Name + Share */}
          <div className="flex items-center justify-between gap-2">
           <div className="flex items-center gap-1.5 min-w-0">
            <span className="w-1.5 h-1.5 bg-sky-400 shrink-0 rounded-2xs" />
            <span className="font-bold text-slate-100 text-xs truncate">
             {getProvinceChineseName(prov.provinceName || prov.provinceId)}
            </span>
           </div>
           <div className="flex items-center gap-1.5 shrink-0">
            <div className="w-12 bg-[#121c2b] h-1.5 overflow-hidden rounded-2xs border border-slate-800">
             <div className="bg-amber-400 h-full" style={{ width: `${Math.min(100, share)}%` }} />
            </div>
            <span className="text-[10px] font-mono text-slate-400">
             {share.toFixed(1)}%
            </span>
           </div>
          </div>

          {/* Bottom Grid: Factories, Infrastructure, GDP, Tax */}
          <div className="grid grid-cols-2 gap-1.5 pt-1.5 border-t border-[#121b2b] text-[11px] font-mono">
           {/* Factories */}
           <div className="flex items-center justify-between px-2 py-1 bg-[#060a12] border border-[#141f30] rounded-xs">
            <span className="text-slate-400 text-[10px] flex items-center gap-1">
             <CivilianFactoryPlantIcon size={12} className="text-sky-400" />
             <span>民工</span>
            </span>
            <span className="text-sky-300 font-bold">
             {prov.civilianFactories} <span className="text-[9px] text-slate-500 font-normal">座</span>
            </span>
           </div>

           {/* Infrastructure */}
           <div className="flex items-center justify-between px-2 py-1 bg-[#060a12] border border-[#141f30] rounded-xs">
            <span className="text-slate-400 text-[10px] flex items-center gap-1">
             <Building2 className="w-3 h-3 text-indigo-400" />
             <span>基建</span>
            </span>
            <span className="text-slate-200 font-medium">
             Lv.{prov.infrastructureLevel}
             {prov.localEfficiencyBonus > 0 && (
              <span className="text-[10px] text-emerald-400 ml-1">
               (+{(prov.localEfficiencyBonus * 100).toFixed(0)}%)
              </span>
             )}
            </span>
           </div>

           {/* Daily GDP */}
           <div className="flex items-center justify-between px-2 py-1 bg-[#060a12] border border-[#141f30] rounded-xs">
            <span className="text-slate-400 text-[10px]">24h GDP</span>
            <span className="text-amber-300 font-bold">
             {formatChineseNumber(prov.dailyGDPContribution, 2).shortText}
            </span>
           </div>

           {/* Daily Tax */}
           <div className="flex items-center justify-between px-2 py-1 bg-[#060a12] border border-[#141f30] rounded-xs">
            <span className="text-slate-400 text-[10px]">24h 财税</span>
            <span className="text-emerald-400 font-medium">
             +{formatChineseNumber(prov.dailyRevenueContribution, 2).shortText}
            </span>
           </div>
          </div>
         </div>
        );
       })}
      </div>

      {/* Desktop View: Precision Dark-theme Strategy Table */}
      <div className="hidden md:block overflow-x-auto">
       <table className="w-full text-xs font-mono border-collapse">
        <thead>
         <tr className="bg-[#04070d] text-slate-400 border-b border-[#141e2e] text-[10px] uppercase tracking-wider font-mono">
          <th className="py-1.5 px-2.5 text-left font-medium">省份行政区</th>
          <th className="py-1.5 px-2.5 text-center font-medium">民生工厂 (座)</th>
          <th className="py-1.5 px-2.5 text-center font-medium">交通基建</th>
          <th className="py-1.5 px-2.5 text-right font-medium">24h GDP 产值贡献</th>
          <th className="py-1.5 px-2.5 text-right font-medium">24h 财政税收贡献</th>
          <th className="py-1.5 px-2.5 text-center font-medium">产值占比</th>
         </tr>
        </thead>
        <tbody className="divide-y divide-[#101827]">
         {stats.provinceBreakdowns.map((prov) => {
          const share = stats.dailyGDP > 0 ? (prov.dailyGDPContribution / stats.dailyGDP) * 100 : 0;
          return (
           <tr key={prov.provinceId} className="hover:bg-[#0c1421] transition-colors">
            {/* Column 1 (Region Name): Left-aligned, regular horizontal text */}
            <td className="py-1.5 px-2.5 text-left font-normal text-slate-200 text-xs whitespace-nowrap">
             <div className="inline-flex items-center gap-1.5">
              <span className="w-1 h-1 bg-sky-400 shrink-0" />
              <span className="truncate">{getProvinceChineseName(prov.provinceName || prov.provinceId)}</span>
             </div>
            </td>

            {/* Column 2 (Factories): Center-aligned, subtle tech-style numeric badge */}
            <td className="py-1.5 px-2.5 text-center whitespace-nowrap">
             <span className="inline-block min-w-[26px] px-1.5 py-0.5 bg-[#0e1624] text-sky-400 font-mono font-medium text-[11px] border border-sky-800/40 rounded-xs shadow-2xs">
              {prov.civilianFactories}
             </span>
            </td>

            {/* Column 3 (Infrastructure): Center-aligned, level text alongside green percentage buff */}
            <td className="py-1.5 px-2.5 text-center text-slate-300 whitespace-nowrap">
             <span className="text-xs font-mono">Lv.{prov.infrastructureLevel}</span>
             {prov.localEfficiencyBonus > 0 && (
              <span className="text-[10px] text-emerald-400 font-mono font-medium ml-1.5">
               (+{(prov.localEfficiencyBonus * 100).toFixed(0)}%)
              </span>
             )}
            </td>

            {/* Column 4 (GDP Contribution): Right-aligned, bright gold/yellow for emphasis */}
            <td className="py-1.5 px-2.5 text-right font-bold text-amber-300 font-mono text-xs whitespace-nowrap">
             {formatChineseNumber(prov.dailyGDPContribution, 2).shortText}
            </td>

            {/* Column 5 (Fiscal Revenue Contribution): Right-aligned */}
            <td className="py-1.5 px-2.5 text-right font-medium text-emerald-400 font-mono text-xs whitespace-nowrap">
             +{formatChineseNumber(prov.dailyRevenueContribution, 2).shortText}
            </td>

            {/* Column 6 (Share): Center-aligned */}
            <td className="py-1.5 px-2.5 text-center whitespace-nowrap">
             <div className="inline-flex items-center justify-center gap-1.5">
              <div className="w-10 bg-[#121c2b] h-1.5 overflow-hidden rounded-2xs">
               <div className="bg-amber-400 h-full" style={{ width: `${Math.min(100, share)}%` }} />
              </div>
              <span className="text-[10px] text-slate-400 font-mono w-7 text-right">
               {share.toFixed(1)}%
              </span>
             </div>
            </td>
           </tr>
          );
         })}
        </tbody>
       </table>
      </div>
     </>
    )}
   </div>

   {/* ========================================================================= */}
   {/* 4. METRIC INSPECTION MODAL (点击大数字弹出高精度详细数值分析仪) */}
   {/* ========================================================================= */}
   {inspectMetric && (
    <div
     id="metric-inspect-modal-overlay"
     onClick={() => setInspectMetric(null)}
     className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fadeIn"
    >
     <div
      onClick={(e) => e.stopPropagation()}
      className="w-full max-w-lg bg-[#0c121d] border border-[#26374f] text-slate-100 p-5 rounded-none shadow-2xl space-y-4 font-mono relative"
     >
      {/* 顶栏 */}
      <div className="flex items-center justify-between border-b border-[#1e2d42] pb-2.5">
       <div className="flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-amber-400" />
        <span className="text-xs font-black text-slate-200 uppercase tracking-wider">
         {inspectMetric === 'gdp' && '国家累计生产总值 (GDP) · 精确数据显微'}
         {inspectMetric === 'treasury' && '国家金库储备总额 · 精确资金账目'}
         {inspectMetric === 'daily_gdp' && '24h 每日民工 GDP 产出速度'}
         {inspectMetric === 'daily_revenue' && '24h 每日财政税收净流入'}
        </span>
       </div>
       <button
        type="button"
        onClick={() => setInspectMetric(null)}
        className="text-slate-400 hover:text-white text-xs px-2 py-0.5 bg-[#172233] border border-[#23344d] cursor-pointer"
       >
        [ ESC 关闭 ]
       </button>
      </div>

      {/* 核心未缩写完整数值大展示 */}
      <div className="p-4 bg-[#05080e] border border-[#182538] text-center space-y-1">
       <span className="text-[11px] text-slate-400 block font-sans">完整高精度未经缩写数值：</span>
       <div className="text-xl sm:text-2xl font-black text-amber-300 font-mono tracking-tight select-all">
        {inspectMetric === 'gdp' && `${stats.currencySymbol} ${stats.currentGDP.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${stats.currencyName}`}
        {inspectMetric === 'treasury' && `${stats.currencySymbol} ${stats.currentTreasury.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${stats.currencyName}`}
        {inspectMetric === 'daily_gdp' && `${stats.currencySymbol} ${stats.dailyGDP.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / 24h`}
        {inspectMetric === 'daily_revenue' && `${stats.currencySymbol} ${stats.dailyFiscalRevenue.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / 24h`}
       </div>

       <div className="pt-2 flex justify-center">
        <button
         type="button"
         onClick={() => {
          const val =
           inspectMetric === 'gdp'
            ? stats.currentGDP.toFixed(2)
            : inspectMetric === 'treasury'
            ? stats.currentTreasury.toFixed(2)
            : inspectMetric === 'daily_gdp'
            ? stats.dailyGDP.toFixed(2)
            : stats.dailyFiscalRevenue.toFixed(2);
          handleCopy(val);
         }}
         className="px-3 py-1 bg-[#172538] hover:bg-[#20344f] text-xs text-amber-300 border border-amber-500/40 flex items-center gap-1.5 transition cursor-pointer"
        >
         <Copy className="w-3.5 h-3.5" />
         <span>{copiedText ? '已复制' : '复制精确数字'}</span>
        </button>
       </div>
      </div>

      {/* 多时间尺度测算矩阵 */}
      <div className="space-y-1.5 text-xs">
       <span className="text-[11px] text-slate-400 block">各时间尺度经济流水测算：</span>
       <div className="grid grid-cols-2 gap-2 font-mono">
        <div className="p-2 bg-[#080d16] border border-[#182333]">
         <span className="text-[10px] text-slate-400 block">每秒流水 (Per Second)</span>
         <span className="font-bold text-slate-200">
          +{inspectMetric === 'treasury' || inspectMetric === 'daily_revenue'
           ? (stats.perSecondRevenue).toFixed(2)
           : (stats.perSecondGDP).toFixed(2)} /s
         </span>
        </div>
        <div className="p-2 bg-[#080d16] border border-[#182333]">
         <span className="text-[10px] text-slate-400 block">每小时流水 (Per Hour)</span>
         <span className="font-bold text-slate-200">
          +{inspectMetric === 'treasury' || inspectMetric === 'daily_revenue'
           ? formatChineseNumber(stats.dailyFiscalRevenue / 24, 2).shortText
           : formatChineseNumber(stats.dailyGDP / 24, 2).shortText} /h
         </span>
        </div>
        <div className="p-2 bg-[#080d16] border border-[#182333]">
         <span className="text-[10px] text-slate-400 block">每日 24h 产值 (Daily)</span>
         <span className="font-bold text-amber-300">
          +{inspectMetric === 'treasury' || inspectMetric === 'daily_revenue'
           ? formatChineseNumber(stats.dailyFiscalRevenue, 2).shortText
           : formatChineseNumber(stats.dailyGDP, 2).shortText} /天
         </span>
        </div>
        <div className="p-2 bg-[#080d16] border border-[#182333]">
         <span className="text-[10px] text-slate-400 block">年化产值 (Annualized 365d)</span>
         <span className="font-bold text-emerald-300">
          +{inspectMetric === 'treasury' || inspectMetric === 'daily_revenue'
           ? formatChineseNumber(stats.dailyFiscalRevenue * 365, 2).shortText
           : formatChineseNumber(stats.annualizedGDP, 2).shortText} /年
         </span>
        </div>
       </div>
      </div>

      {/* 数学公式解析 */}
      <div className="p-2.5 bg-[#05080e] border border-[#182333] text-[11px] text-slate-400 space-y-1">
       <span className="font-bold text-slate-300 block">国家战略财税公式：</span>
       <div className="text-slate-300">
        • 每日产出 = {stats.totalCivFactories} 座民工 × 1,000,000 × {(stats.economicEfficiency * 100).toFixed(1)}% 效率 = {formatChineseNumber(stats.dailyGDP, 2).shortText}
       </div>
       <div className="text-slate-300">
        • 每日入库 = {formatChineseNumber(stats.dailyGDP, 2).shortText} × {stats.taxRate}% 税率 = {formatChineseNumber(stats.dailyFiscalRevenue, 2).shortText}
       </div>
      </div>
     </div>
    </div>
   )}
  </div>
 );
};
