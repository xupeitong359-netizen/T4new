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
 Compass,
 Zap,
 Megaphone,
 Skull,
 RefreshCw,
} from 'lucide-react';
import { Nation, MajorIdeology } from '../types';
import { calculateNationPolitics, calculateNationStability } from '../lib/strategicCommandEngine';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

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
 const { user, setMyNation } = useAuth();
 const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'danger' | 'info'; title: string; desc: string } | null>(null);
 const [isLoadingAction, setIsLoadingAction] = useState(false);
 const [selectedCoupParty, setSelectedCoupParty] = useState<MajorIdeology | ''>('');

 const politics = calculateNationPolitics(nation);
 const stability = calculateNationStability(nation);

 const isOwner = user && nation && nation.ownerId === user.id;

 const handleHoldElection = async () => {
  if (!nation) return;
  setIsLoadingAction(true);
  try {
   const res = await api.nations.holdElection(nation.id);
   if (res.nation && isOwner) {
    setMyNation(res.nation);
   }
   setActionNotice({
    type: 'success',
    title: '🏛️ 全民大选平稳落幕',
    desc: res.message,
   });
  } catch (err: any) {
   setActionNotice({
    type: 'danger',
    title: '大选举行受阻',
    desc: err.message || '由于政治动荡无法完成正常投票',
   });
  } finally {
   setIsLoadingAction(false);
  }
 };

 const handleCampaign = async (ideology: MajorIdeology) => {
  if (!nation) return;
  setIsLoadingAction(true);
  try {
   const res = await api.nations.partyCampaign(nation.id, ideology);
   if (res.nation && isOwner) {
    setMyNation(res.nation);
   }
   setActionNotice({
    type: 'success',
    title: '📢 政治宣传攻势见效',
    desc: res.message,
   });
  } catch (err: any) {
   setActionNotice({
    type: 'danger',
    title: '宣传受阻',
    desc: err.message || '政党宣传未能顺利展开',
   });
  } finally {
   setIsLoadingAction(false);
  }
 };

 const handleStageCoup = async (ideology: MajorIdeology) => {
  if (!nation) return;
  setIsLoadingAction(true);
  try {
   const res = await api.nations.stageCoup(nation.id, ideology);
   if (res.nation && isOwner) {
    setMyNation(res.nation);
   }
   setActionNotice({
    type: res.success ? 'success' : 'danger',
    title: res.success ? '⚡ 政变成功掌权！' : '⚠️ 政变遭遇镇压失败！',
    desc: res.message,
   });
  } catch (err: any) {
   setActionNotice({
    type: 'danger',
    title: '政变行动异常',
    desc: err.message || '突击行动受到意外阻挠',
   });
  } finally {
   setIsLoadingAction(false);
   setSelectedCoupParty('');
  }
 };

 return (
  <div className="max-w-6xl mx-auto space-y-4 pb-12 animate-fadeIn select-none">
   {/* Header Bar */}
   <div className="bg-white border border-slate-200/90 rounded-[4px] p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
    <div className="flex items-center gap-3">
     <div className="w-10 h-10 rounded-[3px] bg-slate-900 text-white flex items-center justify-center">
      <Scale className="w-5 h-5" />
     </div>
     <div>
      <h1 className="text-base font-bold text-slate-900">政治体制与四大政党治理公署</h1>
      <p className="text-xs text-slate-500 font-mono">
       POLITICAL REGIME & MAJOR PARTIES GOVERNANCE
      </p>
     </div>
    </div>

    <div className="flex items-center gap-2">
     {onNavigateTab && (
      <button
       type="button"
       onClick={() => onNavigateTab('national_focus')}
       className="px-3 py-1.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white rounded-[3px] text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
      >
       <Compass className="w-3.5 h-3.5 text-amber-200" />
       <span>制定国家国策树</span>
      </button>
     )}
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

   {/* Action Notice Alert Banner */}
   {actionNotice && (
    <div
     className={`p-3.5 rounded-[4px] border flex items-start justify-between gap-3 animate-fadeIn ${
      actionNotice.type === 'success'
       ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
       : actionNotice.type === 'danger'
       ? 'bg-rose-50 border-rose-300 text-rose-900'
       : 'bg-indigo-50 border-indigo-300 text-indigo-900'
     }`}
    >
     <div className="flex items-start gap-2.5">
      <span className="text-base mt-0.5">
       {actionNotice.type === 'success' ? '🎖️' : actionNotice.type === 'danger' ? '⚠️' : '📢'}
      </span>
      <div>
       <h4 className="text-xs font-bold">{actionNotice.title}</h4>
       <p className="text-xs mt-0.5 opacity-90">{actionNotice.desc}</p>
      </div>
     </div>
     <button
      type="button"
      onClick={() => setActionNotice(null)}
      className="text-xs font-mono font-bold hover:underline opacity-70 hover:opacity-100 cursor-pointer"
     >
      关闭
     </button>
    </div>
   )}

   {/* Main Governance Dashboard */}
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
        主流执政意识形态：<span className="font-bold text-slate-900">{nation?.ideology || '中立主义'}</span>
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

     {/* Political Actions Panel */}
     <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white rounded-[4px] p-4 border border-indigo-500/20 shadow-md space-y-3">
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
       <div className="flex items-center gap-1.5 text-xs font-bold text-slate-100">
        <Vote className="w-4 h-4 text-amber-400" />
        <span>国家政治法令决策</span>
       </div>
       <span className="text-[10px] font-mono text-indigo-300">政党博弈控制台</span>
      </div>

      <div className="space-y-2 text-xs">
       {/* Election Button */}
       <button
        id="btn-hold-election"
        type="button"
        disabled={isLoadingAction}
        onClick={handleHoldElection}
        className="w-full py-2.5 px-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold rounded-[3px] transition flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-98"
       >
        <Vote className="w-4 h-4" />
        <span>举行全国大选 (以民意决定执政党)</span>
       </button>

       {/* Coup Section */}
       <div className="pt-2 border-t border-white/10 space-y-1.5">
        <div className="text-[11px] text-slate-300 font-medium flex items-center gap-1">
         <Zap className="w-3.5 h-3.5 text-amber-400" />
         <span>密谋武装政变 (在野党强行夺权)：</span>
        </div>
        <div className="grid grid-cols-3 gap-1">
         {politics.oppositionParties.map((op) => (
          <button
           key={`coup-${op.id}`}
           type="button"
           disabled={isLoadingAction}
           onClick={() => handleStageCoup(op.id as MajorIdeology)}
           className="py-1.5 px-1 bg-white/10 hover:bg-rose-600/80 disabled:opacity-50 text-slate-200 hover:text-white rounded-[2px] text-[10px] font-bold transition text-center truncate border border-white/10"
           title={`发动政变让【${op.name}】上台`}
          >
           {op.name}
          </button>
         ))}
        </div>
       </div>
      </div>
     </div>

    </div>

    {/* Right Column (8 cols): Ruling Party & Multi-Party Bar + National Modifiers */}
    <div className="lg:col-span-8 space-y-4">
     
     {/* Ruling Party & Multi-Party Distribution Bar */}
     <div className="bg-white border border-slate-200/90 rounded-[4px] p-4 shadow-2xs space-y-3">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
       <div>
        <h3 className="text-xs font-bold text-slate-900">四大政党民意支持度与执政地位</h3>
        <p className="text-[10px] text-slate-500 font-mono">POLITICAL DISTRIBUTION & RULING PARTY (建国默认100%)</p>
       </div>
       <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-mono text-xs font-bold rounded-[2px]">
        执政历时 {politics.yearsInPower} 年
       </span>
      </div>

      {/* Horizontal Multi-Party Distribution Bar */}
      <div className="space-y-1.5">
       <div className="flex items-center justify-between text-[11px] font-mono text-slate-600">
        <span>四大党派民意分布：</span>
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
        <div className="p-3 bg-indigo-50/60 border-2 border-indigo-400 rounded-[3px] space-y-2 relative overflow-hidden">
         <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
           <span className="w-2.5 h-2.5 rounded-[2px]" style={{ backgroundColor: politics.rulingParty.color }} />
           <span className="font-bold text-slate-900 text-xs">{politics.rulingParty.name}</span>
          </div>
          <span className="px-2 py-0.5 bg-indigo-600 text-white rounded text-[10px] font-bold font-mono shadow-xs">
           执政党 {politics.rulingParty.supportPercent}%
          </span>
         </div>
         <div className="text-[11px] text-slate-600">
          意识形态：<span className="font-semibold text-slate-800">{politics.rulingParty.ideologyName}</span> · 代表：<span className="font-semibold text-slate-800">{politics.rulingParty.leaderName}</span>
         </div>
         <div className="text-[11px] text-slate-500 font-mono">
          纲领：{politics.rulingParty.policyDoctrine}
         </div>
         <div className="pt-1 flex items-center justify-between">
          <button
           type="button"
           disabled={isLoadingAction || politics.rulingParty.supportPercent >= 100}
           onClick={() => handleCampaign(politics.rulingParty.id as MajorIdeology)}
           className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-[2px] text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
          >
           <Megaphone className="w-3 h-3" />
           <span>执政党巡回宣传 (+10%)</span>
          </button>
          <span className="text-[10px] text-indigo-700 font-bold font-mono">当前掌权</span>
         </div>
        </div>

        {/* Opposition Parties */}
        {politics.oppositionParties.map((p) => (
         <div key={p.id} className="p-3 bg-slate-50 border border-slate-200/80 rounded-[3px] space-y-2">
          <div className="flex items-center justify-between">
           <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-[2px]" style={{ backgroundColor: p.color }} />
            <span className="font-bold text-slate-800 text-xs">{p.name}</span>
           </div>
           <span className="font-mono text-xs font-bold text-slate-700">
            在野党 {p.supportPercent}%
           </span>
          </div>
          <div className="text-[11px] text-slate-600">
           意识形态：<span className="font-semibold text-slate-700">{p.ideologyName}</span> · 代表：<span className="font-medium text-slate-700">{p.leaderName}</span>
          </div>
          <div className="text-[11px] text-slate-500 font-mono truncate">
           纲领：{p.policyDoctrine}
          </div>
          <div className="pt-1 flex items-center gap-1.5">
           <button
            type="button"
            disabled={isLoadingAction}
            onClick={() => handleCampaign(p.id as MajorIdeology)}
            className="flex-1 py-1 px-2 bg-slate-200 hover:bg-slate-300 disabled:opacity-50 text-slate-800 rounded-[2px] text-[10px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
           >
            <Megaphone className="w-3 h-3" />
            <span>宣传造势 (+10%)</span>
           </button>
           <button
            type="button"
            disabled={isLoadingAction}
            onClick={() => handleStageCoup(p.id as MajorIdeology)}
            className="py-1 px-2 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-[2px] text-[10px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
            title="发动武装政变"
           >
            <Zap className="w-3 h-3 text-rose-600" />
            <span>政变</span>
           </button>
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

