import React, { useState } from 'react';
import {
 Nation,
 SurrenderCalculationResult,
 SurrenderFactorItem,
 AllianceFaction,
 LendLeaseOffer,
 BattleSimulationReport,
} from '../types';
import {
 calculateSurrenderProgress,
 getSurrenderTier,
} from '../lib/surrenderEngine';
import {
 ShieldAlert,
 ChevronDown,
 ChevronUp,
 AlertTriangle,
 Flame,
 Building2,
 Users,
 Swords,
 Coins,
 Handshake,
 Clock,
 ShieldCheck,
 CheckCircle2,
 HelpCircle,
} from 'lucide-react';
import { StrategicWarfareIcon } from '../lib/icons';

interface SurrenderStatusCardProps {
 nation: Nation;
 allNations?: Nation[];
 alliances?: AllianceFaction[];
 lendLeaseOffers?: LendLeaseOffer[];
 battleReports?: BattleSimulationReport[];
 overrideOccupiedProvinces?: string[];
 overrideCapitalOccupied?: boolean;
 compact?: boolean;
 onCapitulate?: (nation: Nation) => void;
 showCapitulateAction?: boolean;
}

export const SurrenderStatusCard: React.FC<SurrenderStatusCardProps> = ({
 nation,
 allNations = [],
 alliances = [],
 lendLeaseOffers = [],
 battleReports = [],
 overrideOccupiedProvinces,
 overrideCapitalOccupied,
 compact = false,
 onCapitulate,
 showCapitulateAction = false,
}) => {
 const [isExpanded, setIsExpanded] = useState(false);

 // 综合计算投降倾向
 const calculation: SurrenderCalculationResult = calculateSurrenderProgress(nation, {
  allNations,
  alliances,
  lendLeaseOffers,
  battleReports,
  overrideOccupiedProvinces,
  overrideCapitalOccupied,
 });

 const { effectiveProgress, threshold, isCapitulated, tier, topFactors, allFactors, details } = calculation;
 const progressPercent = Math.min(100, Math.max(0, (effectiveProgress / threshold) * 100));

 const getCategoryIcon = (category: SurrenderFactorItem['category']) => {
  switch (category) {
   case 'territory':
    return <Building2 className="w-3.5 h-3.5 text-amber-500" />;
   case 'capital':
    return <Flame className="w-3.5 h-3.5 text-rose-500" />;
   case 'military':
    return <Swords className="w-3.5 h-3.5 text-red-500" />;
   case 'warsupport':
    return <Users className="w-3.5 h-3.5 text-indigo-500" />;
   case 'defeats':
    return <AlertTriangle className="w-3.5 h-3.5 text-orange-500" />;
   case 'economy':
    return <Coins className="w-3.5 h-3.5 text-yellow-600" />;
   case 'allies':
    return <Handshake className="w-3.5 h-3.5 text-teal-500" />;
   case 'duration':
    return <Clock className="w-3.5 h-3.5 text-slate-400" />;
   case 'resistance':
    return <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />;
   default:
    return <ShieldAlert className="w-3.5 h-3.5 text-slate-500" />;
  }
 };

 if (compact) {
  return (
   <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl p-3 text-xs space-y-2">
    <div className="flex items-center justify-between">
     <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
      <StrategicWarfareIcon size={14} className="text-rose-500" />
      <span>投降倾向</span>
     </div>
     <div className="flex items-center gap-1.5">
      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${tier.badgeBg}`}>
       {tier.label}
      </span>
      <span className="font-mono font-bold text-slate-900 dark:text-white">
       {effectiveProgress}/{threshold}
      </span>
     </div>
    </div>

    {/* Progress bar */}
    <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
     <div
      className={`h-full transition-all duration-300 ${tier.progressBarColor}`}
      style={{ width: `${progressPercent}%` }}
     />
    </div>
   </div>
  );
 }

 return (
  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs transition-all space-y-4">
   {/* Header */}
   <div className="flex items-start justify-between gap-4">
    <div>
     <div className="flex items-center gap-2 mb-1">
      <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
       <StrategicWarfareIcon size={14} className="text-rose-500" />
       国家战争意志与投降倾向 (Capitulation Risk)
      </span>
      {isCapitulated && (
       <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-900 text-white uppercase flex items-center gap-1">
        <CheckCircle2 className="w-3 h-3 text-emerald-400" /> 已签署停火
       </span>
      )}
     </div>
     <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
      {tier.description}
     </p>
    </div>

    <div className="flex flex-col items-end shrink-0">
     <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${tier.badgeBg}`}>
      {tier.label}
     </span>
     <div className="mt-1 flex items-baseline gap-1">
      <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white font-mono">
       {effectiveProgress}
      </span>
      <span className="text-xs font-medium text-slate-400 font-mono">/ {threshold} 阈值</span>
     </div>
    </div>
   </div>

   {/* Main Progress Bar with Segment Markers */}
   <div className="space-y-1.5">
    <div className="relative w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden border border-slate-200/60 dark:border-slate-700/60">
     <div
      className={`h-full transition-all duration-500 ${tier.progressBarColor}`}
      style={{ width: `${progressPercent}%` }}
     />
     {/* Threshold markers */}
     <div className="absolute top-0 bottom-0 left-[50%] w-[1px] bg-slate-300 dark:bg-slate-600 pointer-events-none" />
     <div className="absolute top-0 bottom-0 left-[75%] w-[1px] bg-slate-400 dark:bg-slate-500 pointer-events-none" />
    </div>
    <div className="flex justify-between text-[10px] font-mono text-slate-400 px-0.5">
     <span>0 (坚定)</span>
     <span>50 (恶化)</span>
     <span>75 (危急)</span>
     <span className="text-rose-500 font-bold">100 (投降)</span>
    </div>
   </div>

   {/* Top Driving Factors */}
   {topFactors.length > 0 && (
    <div className="space-y-2">
     <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center justify-between">
      <span>主要影响因素 (Key Drivers)</span>
      <span className="text-[10px] font-mono text-slate-400 font-normal">
       {calculation.resistanceModifier !== 0 &&
        `国家抵抗修正: ${calculation.resistanceModifier > 0 ? `+${Math.round(calculation.resistanceModifier * 100)}%` : `${Math.round(calculation.resistanceModifier * 100)}%`}`}
      </span>
     </div>

     <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {topFactors.map((f) => {
       const isNegative = f.value < 0;
       return (
        <div
         key={f.id}
         className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs"
        >
         <div className="flex items-center gap-2 truncate pr-2">
          {getCategoryIcon(f.category)}
          <span className="truncate text-slate-700 dark:text-slate-300 font-medium">{f.label}</span>
         </div>
         <span
          className={`font-mono font-bold shrink-0 ${
           isNegative
            ? 'text-emerald-600 dark:text-emerald-400'
            : f.value >= 25
            ? 'text-rose-600 dark:text-rose-400'
            : 'text-amber-600 dark:text-amber-400'
          }`}
         >
          {isNegative ? `${f.value}` : `+${f.value}`}
         </span>
        </div>
       );
      })}
     </div>
    </div>
   )}

   {/* Expandable Deep Breakdown */}
   <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
    <button
     type="button"
     onClick={() => setIsExpanded(!isExpanded)}
     className="w-full flex items-center justify-between py-1 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
    >
     <span className="flex items-center gap-1.5">
      <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
      <span>查看完整投降推演数据明细</span>
     </span>
     {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
    </button>

    {isExpanded && (
     <div className="mt-3 space-y-3 text-xs animate-fadeIn">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
       <div>
        <span className="text-[10px] text-slate-400 block">领土控制沦陷</span>
        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
         {details.territoryOccupiedPercent}%
        </span>
       </div>
       <div>
        <span className="text-[10px] text-slate-400 block">法定首都失守</span>
        <span
         className={`font-mono font-bold ${
          details.capitalOccupied ? 'text-rose-500' : 'text-emerald-600'
         }`}
        >
         {details.capitalOccupied ? '已失守 (+30)' : '安全扼守'}
        </span>
       </div>
       <div>
        <span className="text-[10px] text-slate-400 block">核心本土丢失</span>
        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
         {details.coreTerritoryLostPercent}%
        </span>
       </div>
       <div>
        <span className="text-[10px] text-slate-400 block">现存军力指数</span>
        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
         {details.militaryStrengthRatio}%
        </span>
       </div>
       <div>
        <span className="text-[10px] text-slate-400 block">战争民意支持度</span>
        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
         {details.warSupport}%
        </span>
       </div>
       <div>
        <span className="text-[10px] text-slate-400 block">战役连败挫折</span>
        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
         +{details.recentDefeatsPressure}
        </span>
       </div>
      </div>

      {/* All factor items with full descriptions */}
      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
       {allFactors.map((f) => (
        <div
         key={f.id}
         className="p-2 rounded-lg bg-slate-50/80 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 flex items-start justify-between gap-2"
        >
         <div className="space-y-0.5">
          <div className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
           {getCategoryIcon(f.category)}
           <span>{f.label}</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
           {f.description}
          </p>
         </div>
         <span
          className={`font-mono font-bold shrink-0 ${
           f.value < 0
            ? 'text-emerald-600'
            : f.value >= 25
            ? 'text-rose-600'
            : 'text-amber-600'
          }`}
         >
          {f.value < 0 ? f.value : `+${f.value}`}
         </span>
        </div>
       ))}
      </div>
     </div>
    )}
   </div>

   {/* Capitulate Action button if requested */}
   {showCapitulateAction && !isCapitulated && onCapitulate && (
    <div className="pt-2">
     <button
      type="button"
      onClick={() => onCapitulate(nation)}
      className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
     >
      <ShieldAlert className="w-4 h-4 text-rose-400" />
      <span>宣告无条件投降并签署停火公报</span>
     </button>
    </div>
   )}
  </div>
 );
};
