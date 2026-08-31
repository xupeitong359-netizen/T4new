import React, { useState } from 'react';
import {
 Users,
 ShieldCheck,
 TrendingUp,
 TrendingDown,
 Coins,
 Swords,
 Landmark,
 Layers,
 ChevronDown,
 Clock,
 Sparkles,
 AlertOctagon,
} from 'lucide-react';
import { Nation } from '../types';
import {
 STRATEGIC_RESOURCES,
 calculateNationResourceOverview,
 calculateNationDemographics,
 calculateNationStability,
 calculateNationPolitics,
 StrategicResourceType,
} from '../lib/strategicCommandEngine';
import { useEconomyTicker } from '../lib/useEconomyTicker';

interface NationalStatusBarProps {
 nation: Nation | null;
 onNavigateTab: (tab: string) => void;
 worldClockStr?: string;
 onOpenResourceDetails?: (resKey: StrategicResourceType) => void;
}

export const NationalStatusBar: React.FC<NationalStatusBarProps> = ({
 nation,
 onNavigateTab,
 worldClockStr = '1936/1/1',
 onOpenResourceDetails,
}) => {
 const [resourceBarExpanded, setResourceBarExpanded] = useState(false);

 const demographics = calculateNationDemographics(nation);
 const stability = calculateNationStability(nation);
 const politics = calculateNationPolitics(nation);
 const resources = calculateNationResourceOverview(nation);
 const economyTicker = useEconomyTicker(nation, true);

 const isAtWar = (nation?.activeWars?.length || 0) > 0;
 const warCount = nation?.activeWars?.length || 0;
 const divisionCount = nation?.army?.divisions?.length || 0;

 // Format big numbers
 const formatPop = (n: number | null | undefined) => {
  const val = Number(n) || 0;
  if (val >= 100000000) return `${(val / 100000000).toFixed(2)}亿`;
  if (val >= 10000) return `${(val / 10000).toFixed(1)}万`;
  return val.toLocaleString();
 };

 return (
  <div className="w-full bg-white border-b border-slate-200/90 shadow-2xs select-none sticky top-0 z-40 transition-colors">
   {/* Primary Top Command Ribbon */}
   <div className="max-w-[1920px] mx-auto px-3 sm:px-4 h-12 flex items-center justify-between gap-2 sm:gap-4 overflow-x-auto no-scrollbar text-xs">
    
    {/* Left: Nation Badge & Clock */}
    <div className="flex items-center gap-2.5 flex-shrink-0">
     <button
      type="button"
      onClick={() => onNavigateTab('my_nation')}
      className="flex items-center gap-2 px-2 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-[4px] cursor-pointer transition text-left"
      title="查看国家政务总览"
     >
      <div
       className="w-5 h-5 rounded-[2px] flex items-center justify-center font-black text-white text-[10px] shadow-2xs flex-shrink-0"
       style={{ backgroundColor: nation?.flagColor || '#4f46e5' }}
      >
       {nation?.name?.slice(0, 1) || '国'}
      </div>
      <div className="flex flex-col">
       <span className="font-bold text-slate-900 text-xs leading-tight tracking-tight whitespace-nowrap">
        {nation?.name || '未宣告国家'}
       </span>
       <span className="text-[9px] text-slate-500 font-mono leading-none">
        {politics.rulingParty.name}
       </span>
      </div>
     </button>

     {/* Strategic Campaign Clock */}
     <div className="hidden lg:flex items-center gap-1 px-2 py-1 bg-slate-100/80 border border-slate-200/60 rounded-[4px] text-slate-700 font-mono text-[11px] font-bold tabular-nums">
      <Clock className="w-3 h-3 text-indigo-600" />
      <span>{worldClockStr}</span>
     </div>
    </div>

    {/* Center: Core Strategic Gauges */}
    <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
     
     {/* 1. Population Gauge */}
     <button
      type="button"
      onClick={() => onNavigateTab('demographics')}
      className="flex items-center gap-1.5 px-2 py-1 hover:bg-slate-50 rounded-[4px] border border-transparent hover:border-slate-200 transition cursor-pointer"
      title="人口社会动态：单向稳定增长 (+0.01%/日) 与长期推演"
     >
      <Users className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
      <div className="flex items-center gap-1 font-mono">
       <span className="font-bold text-slate-900 text-xs tabular-nums">
        {formatPop(demographics.currentPopulation)}
       </span>
       <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200/60 flex items-center">
        <TrendingUp className="w-2.5 h-2.5 mr-0.5" />
        +{demographics.annualGrowthRatePercent}%/年
       </span>
      </div>
     </button>

     {/* 2. Stability Gauge */}
     <button
      type="button"
      onClick={() => onNavigateTab('governance')}
      className="flex items-center gap-1.5 px-2 py-1 hover:bg-slate-50 rounded-[4px] border border-transparent hover:border-slate-200 transition cursor-pointer"
      title="国家稳定度指数与正负修正因子"
     >
      <ShieldCheck className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
      <div className="flex items-center gap-1 font-mono">
       <span className="text-slate-500 text-[11px]">稳定度</span>
       <span className={`font-bold text-xs tabular-nums ${stability.currentScore >= 70 ? 'text-emerald-700' : stability.currentScore >= 40 ? 'text-amber-700' : 'text-rose-700'}`}>
        {stability.currentScore}%
       </span>
       <div className="w-10 h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/80 hidden sm:block">
        <div
         className={`h-full transition-all ${stability.currentScore >= 70 ? 'bg-emerald-600' : stability.currentScore >= 40 ? 'bg-amber-500' : 'bg-rose-600'}`}
         style={{ width: `${stability.currentScore}%` }}
        />
       </div>
      </div>
     </button>

     {/* 3. Treasury / Live Currency */}
     <button
      type="button"
      onClick={() => onNavigateTab('economy')}
      className="flex items-center gap-1.5 px-2 py-1 hover:bg-slate-50 rounded-[4px] border border-transparent hover:border-slate-200 transition cursor-pointer"
      title="财政国库与外汇流水"
     >
      <Coins className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
      <div className="flex items-center gap-1 font-mono">
       <span className="font-bold text-slate-900 text-xs tabular-nums">
        {economyTicker?.currencySymbol || '¥'}
        {(economyTicker?.currentTreasury ?? 0).toLocaleString('zh-CN', { maximumFractionDigits: 0 })}
       </span>
       <span className={`text-[10px] font-bold ${(economyTicker?.dailyFiscalRevenue ?? 0) >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
        {(economyTicker?.dailyFiscalRevenue ?? 0) >= 0 ? '+' : ''}{(economyTicker?.dailyFiscalRevenue ?? 0).toFixed(0)}/日
       </span>
      </div>
     </button>

     {/* 4. Strategic Resource Quick Strip (Oil, Steel, Aluminium, Rubber, Tungsten, Chromium) */}
     <div className="hidden xl:flex items-center gap-2 pl-2 border-l border-slate-200">
      {(['oil', 'steel', 'aluminium', 'rubber', 'tungsten', 'chromium'] as StrategicResourceType[]).map((key) => {
       const res = resources[key];
       const def = STRATEGIC_RESOURCES[key];
       if (!res || !def) return null;
       return (
        <button
         key={key}
         type="button"
         onClick={() => {
          if (onOpenResourceDetails) onOpenResourceDetails(key);
          else onNavigateTab('resources');
         }}
         className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-[3px] font-mono text-[11px] cursor-pointer transition"
         title={`${def.name}: 储备 ${res.stockpile} | 净变动 ${res.netDaily >= 0 ? '+' : ''}${res.netDaily}/日`}
        >
         <span className="text-slate-600 font-bold text-[10px] uppercase">{def.name}</span>
         <span className="font-bold text-slate-800 tabular-nums">{res.stockpile}</span>
         <span className={`text-[9px] font-semibold ${res.netDaily >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
          {res.netDaily >= 0 ? '+' : ''}{res.netDaily}
         </span>
        </button>
       );
      })}
     </div>

     {/* 5. Military State & War Alert */}
     <button
      type="button"
      onClick={() => onNavigateTab(isAtWar ? 'wars' : 'army')}
      className={`flex items-center gap-1.5 px-2 py-1 rounded-[4px] border transition cursor-pointer font-mono ${
       isAtWar
        ? 'bg-rose-50 border-rose-200 text-rose-900 animate-pulse'
        : 'hover:bg-slate-50 border-transparent hover:border-slate-200 text-slate-800'
      }`}
      title={isAtWar ? `战备状态：${warCount} 场前线交火进行中` : '和平常备：点击进入陆军参谋部'}
     >
      <Swords className={`w-3.5 h-3.5 ${isAtWar ? 'text-rose-600' : 'text-slate-600'}`} />
      <span className="font-bold text-xs tabular-nums">
       {divisionCount} 师
      </span>
      {isAtWar && (
       <span className="px-1 py-0.2 bg-rose-600 text-white rounded text-[9px] font-extrabold">
        战时
       </span>
      )}
     </button>
    </div>

    {/* Right: Quick Toggles & Resource Drawer Button */}
    <div className="flex items-center gap-1.5 flex-shrink-0">
     <button
      type="button"
      onClick={() => setResourceBarExpanded(!resourceBarExpanded)}
      className={`px-2 py-1 text-[11px] font-semibold rounded-[4px] border flex items-center gap-1 transition cursor-pointer ${
       resourceBarExpanded
        ? 'bg-slate-900 text-white border-slate-900'
        : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
      }`}
      title="展开/收起 6 大战略资源全球总览条"
     >
      <Layers className="w-3 h-3" />
      <span className="hidden sm:inline">战略资源库</span>
      <ChevronDown className={`w-3 h-3 transition-transform ${resourceBarExpanded ? 'rotate-180' : ''}`} />
     </button>
    </div>
   </div>

   {/* Expandable Resource Drawer Strip */}
   {resourceBarExpanded && (
    <div className="bg-slate-50/95 border-t border-slate-200 px-4 py-2 flex items-center justify-between gap-3 overflow-x-auto text-[11px] animate-fadeIn">
     <div className="flex items-center gap-2 flex-wrap">
      {(Object.keys(STRATEGIC_RESOURCES) as StrategicResourceType[]).map((key) => {
       const res = resources[key];
       const def = STRATEGIC_RESOURCES[key];
       return (
        <div
         key={key}
         onClick={() => onNavigateTab('resources')}
         className="flex items-center gap-2 px-2.5 py-1 bg-white border border-slate-200 rounded-[3px] shadow-2xs hover:border-slate-300 transition cursor-pointer"
        >
         <div className="px-1.5 py-0.5 rounded-[2px] bg-slate-900 text-white font-mono text-[9px] font-bold">
          {def.icon}
         </div>
         <div className="flex flex-col">
          <span className="text-[10px] text-slate-500 font-medium leading-none">{def.name}</span>
          <div className="flex items-center gap-1.5 font-mono">
           <span className="font-bold text-slate-900">{res.stockpile.toLocaleString()}</span>
           <span className={`text-[10px] font-bold ${res.netDaily >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
            ({res.netDaily >= 0 ? '+' : ''}{res.netDaily}/日)
           </span>
          </div>
         </div>
        </div>
       );
      })}
     </div>

     <button
      type="button"
      onClick={() => onNavigateTab('resources')}
      className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-[3px] text-xs font-bold whitespace-nowrap cursor-pointer transition shadow-2xs"
     >
      打开资源战略推演
     </button>
    </div>
   )}
  </div>
 );
};
