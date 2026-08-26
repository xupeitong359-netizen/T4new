import React, { useState } from 'react';
import {
 Scale,
 Landmark,
 ShieldCheck,
 Award,
 Vote,
 Sparkles,
 TrendingUp,
 AlertTriangle,
 FileText,
 UserCheck,
 CheckCircle2,
 Sliders,
 ChevronRight,
} from 'lucide-react';
import { Nation } from '../types';
import { calculateNationPolitics, calculateNationStability } from '../lib/strategicCommandEngine';

interface PoliticsAndGovernanceViewProps {
 nation: Nation | null;
 onOpenDecreeModal?: () => void;
 onNavigateTab?: (tab: string) => void;
}

export const PoliticsAndGovernanceView: React.FC<PoliticsAndGovernanceViewProps> = ({
 nation,
 onOpenDecreeModal,
 onNavigateTab,
}) => {
 const politics = calculateNationPolitics(nation);
 const stability = calculateNationStability(nation);

 return (
  <div className="max-w-6xl mx-auto space-y-4 pb-12 animate-fadeIn select-none">
   {/* Header Bar */}
   <div className="bg-white border border-slate-200/90 rounded-[4px] p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
    <div className="flex items-center gap-3">
     <div className="w-10 h-10 rounded-[3px] bg-slate-900 text-white flex items-center justify-center">
      <Scale className="w-5 h-5" />
     </div>
     <div>
      <h1 className="text-base font-bold text-slate-900">政治体制与国家治理公署</h1>
      <p className="text-xs text-slate-500 font-mono">
       POLITICAL REGIME & GOVERNANCE MODIFIERS
      </p>
     </div>
    </div>

    <div className="flex items-center gap-2">
     {onOpenDecreeModal && (
      <button
       type="button"
       onClick={onOpenDecreeModal}
       className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-[3px] text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
      >
       <FileText className="w-3.5 h-3.5" />
       <span>内阁智库与法令树</span>
      </button>
     )}
    </div>
   </div>

   {/* Main Governance Dashboard: Central Regime + Left Profile + Right Modifiers */}
   <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
    
    {/* Left Column (4 cols): Central Regime Card & Stability Drivers */}
    <div className="lg:col-span-4 space-y-4">
     
     {/* Regime Profile */}
     <div className="bg-white border border-slate-200/90 rounded-[4px] p-4 shadow-2xs space-y-3">
      <div className="text-xs font-bold text-slate-900 flex items-center justify-between border-b border-slate-100 pb-2">
       <span>国家宪政根本体制</span>
       <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 font-mono text-[10px] font-bold rounded-[2px] border border-indigo-200/60">
        生效中
       </span>
      </div>

      <div className="space-y-2">
       <div className="text-base font-black text-slate-900">
        {politics.currentRegime}
       </div>
       <div className="text-xs text-slate-600">
        主流意识形态：<span className="font-semibold text-slate-900">{nation?.ideology || '中立自卫'}</span>
       </div>
       <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-[3px] space-y-1.5 text-xs font-mono">
        <div className="flex items-center justify-between text-slate-600">
         <span>政府效能指数</span>
         <span className="font-bold text-slate-900">{politics.governmentEfficiency}%</span>
        </div>
        <div className="w-full bg-slate-200/80 h-1.5 rounded-full overflow-hidden">
         <div className="bg-indigo-600 h-full" style={{ width: `${politics.governmentEfficiency}%` }} />
        </div>
        <div className="flex items-center justify-between text-slate-600 pt-1">
         <span>宪政改革推进度</span>
         <span className="font-bold text-slate-900">{politics.reformProgress}%</span>
        </div>
       </div>
      </div>
     </div>

     {/* Stability Breakdown */}
     <div className="bg-white border border-slate-200/90 rounded-[4px] p-4 shadow-2xs space-y-3">
      <div className="text-xs font-bold text-slate-900 flex items-center justify-between border-b border-slate-100 pb-2">
       <span>稳定度正负修正因子</span>
       <span className="font-mono text-xs font-bold text-emerald-700">
        当前: {stability.currentScore}%
       </span>
      </div>

      <div className="space-y-2 text-xs">
       {/* Positive Factors */}
       <div className="space-y-1">
        <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
         ● 正向巩固动能
        </span>
        {stability.positiveFactors.map((f, i) => (
         <div key={`pos-${i}`} className="p-2 bg-emerald-50/40 border border-emerald-100/80 rounded-[2px] flex items-center justify-between">
          <span className="text-slate-800 text-[11px]">{f.name}</span>
          <span className="font-mono font-bold text-emerald-700 text-[11px]">+{f.impact}%</span>
         </div>
        ))}
       </div>

       {/* Negative Factors */}
       {stability.negativeFactors.length > 0 && (
        <div className="space-y-1 pt-1">
         <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block">
          ● 动荡扣减负荷
         </span>
         {stability.negativeFactors.map((f, i) => (
          <div key={`neg-${i}`} className="p-2 bg-rose-50/40 border border-rose-100/80 rounded-[2px] flex items-center justify-between">
           <span className="text-slate-800 text-[11px]">{f.name}</span>
           <span className="font-mono font-bold text-rose-700 text-[11px]">-{f.impact}%</span>
          </div>
         ))}
        </div>
       )}
      </div>
     </div>

    </div>

    {/* Right Column (8 cols): Ruling Party & Multi-Party Bar + National Modifiers */}
    <div className="lg:col-span-8 space-y-4">
     
     {/* Ruling Party & Multi-Party Distribution Bar */}
     <div className="bg-white border border-slate-200/90 rounded-[4px] p-4 shadow-2xs space-y-3">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
       <div>
        <h3 className="text-xs font-bold text-slate-900">执政党派与议会政治支持度</h3>
        <p className="text-[10px] text-slate-500 font-mono">POLITICAL DISTRIBUTION & RULING COALITION</p>
       </div>
       <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-mono text-xs font-bold rounded-[2px]">
        执政历时 {politics.yearsInPower} 年
       </span>
      </div>

      {/* Horizontal Multi-Party Distribution Bar */}
      <div className="space-y-1.5">
       <div className="flex items-center justify-between text-[11px] font-mono text-slate-600">
        <span>党派民意分布：</span>
        <span>议席基准 100%</span>
       </div>
       
       <div className="w-full h-4 rounded-[2px] overflow-hidden flex border border-slate-200/90 shadow-inner">
        <div
         style={{ width: `${politics.rulingParty.supportPercent}%`, backgroundColor: politics.rulingParty.color }}
         title={`${politics.rulingParty.name}: ${politics.rulingParty.supportPercent}%`}
        />
        {politics.oppositionParties.map((p) => (
         <div
          key={p.id}
          style={{ width: `${p.supportPercent}%`, backgroundColor: p.color }}
          title={`${p.name}: ${p.supportPercent}%`}
         />
        ))}
       </div>

       {/* Legend & Breakdown Cards */}
       <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
        {/* Ruling Party */}
        <div className="p-3 bg-indigo-50/40 border border-indigo-200/80 rounded-[3px] space-y-1">
         <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
           <span className="w-2.5 h-2.5 rounded-[2px]" style={{ backgroundColor: politics.rulingParty.color }} />
           <span className="font-bold text-slate-900 text-xs">{politics.rulingParty.name}</span>
          </div>
          <span className="px-1.5 py-0.2 bg-indigo-600 text-white rounded text-[10px] font-bold font-mono">
           执政党 {politics.rulingParty.supportPercent}%
          </span>
         </div>
         <div className="text-[11px] text-slate-600">
          领袖：<span className="font-semibold text-slate-800">{politics.rulingParty.leaderName}</span>
         </div>
         <div className="text-[11px] text-slate-500 font-mono">
          纲领：{politics.rulingParty.policyDoctrine}
         </div>
        </div>

        {/* Opposition Parties */}
        {politics.oppositionParties.map((p) => (
         <div key={p.id} className="p-3 bg-slate-50 border border-slate-200/80 rounded-[3px] space-y-1">
          <div className="flex items-center justify-between">
           <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-[2px]" style={{ backgroundColor: p.color }} />
            <span className="font-bold text-slate-800 text-xs">{p.name}</span>
           </div>
           <span className="font-mono text-xs font-bold text-slate-700">
            {p.supportPercent}%
           </span>
          </div>
          <div className="text-[11px] text-slate-600">
           代表：<span className="font-medium text-slate-700">{p.leaderName}</span>
          </div>
          <div className="text-[11px] text-slate-500 font-mono truncate">
           纲领：{p.policyDoctrine}
          </div>
         </div>
        ))}
       </div>
      </div>
     </div>

     {/* National Modifiers (国家加成与修正) */}
     <div className="bg-white border border-slate-200/90 rounded-[4px] p-4 shadow-2xs space-y-3">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
       <div>
        <h3 className="text-xs font-bold text-slate-900">国家体制修正效果 (National Modifiers)</h3>
        <p className="text-[10px] text-slate-500 font-mono">BUFFS & DEBUFFS APPLIED TO INDUSTRY & MILITARY</p>
       </div>
       <span className="text-slate-500 font-mono text-[10px]">全局生效中</span>
      </div>

      <div className="space-y-2">
       {politics.modifiers.map((m, i) => (
        <div
         key={`mod-${i}`}
         className={`p-2.5 rounded-[3px] border flex items-center justify-between text-xs ${
          m.type === 'buff'
           ? 'bg-emerald-50/40 border-emerald-200/80 text-slate-900'
           : 'bg-rose-50/40 border-rose-200/80 text-slate-900'
         }`}
        >
         <div className="space-y-0.5">
          <div className="flex items-center gap-1.5">
           <span className={`w-1.5 h-1.5 rounded-full ${m.type === 'buff' ? 'bg-emerald-600' : 'bg-rose-600'}`} />
           <span className="font-bold text-slate-900">{m.name}</span>
          </div>
          <p className="text-[11px] text-slate-600">{m.description}</p>
         </div>

         <span
          className={`font-mono font-bold text-xs px-2 py-0.5 rounded-[2px] border ${
           m.type === 'buff'
            ? 'bg-emerald-100/70 border-emerald-300 text-emerald-800'
            : 'bg-rose-100/70 border-rose-300 text-rose-800'
          }`}
         >
          {m.value}
         </span>
        </div>
       ))}
      </div>
     </div>

    </div>

   </div>
  </div>
 );
};
