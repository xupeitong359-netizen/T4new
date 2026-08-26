import React, { useState } from 'react';
import {
 X,
 Landmark,
 Crown,
 Scale,
 Users,
 Shield,
 Coins,
 ScrollText,
 Zap,
 CheckCircle2,
 AlertCircle,
 TrendingUp,
 Award,
 Sparkles,
 Flame,
} from 'lucide-react';
import { Nation, PolicyDecree, CabinetMinister } from '../types';
import {
 DEFAULT_ACTIVE_DECREE_IDS,
 PRESET_DECREES,
 PRESET_MINISTERS,
 calculateNationalStability,
 calculateWorldTension,
} from '../services/strategicGameplayService';

interface DecreeAndCabinetModalProps {
 isOpen: boolean;
 onClose: () => void;
 myNation: Nation | null;
 allNations?: Nation[];
 onUpdateNation: (updated: Nation) => void;
 onShowToast: (msg: string) => void;
}

export const DecreeAndCabinetModal: React.FC<DecreeAndCabinetModalProps> = ({
 isOpen,
 onClose,
 myNation,
 allNations = [],
 onUpdateNation,
 onShowToast,
}) => {
 const [activeTab, setActiveTab] = useState<'decrees' | 'ministers' | 'stability'>('decrees');
 const [showTensionDetail, setShowTensionDetail] = useState(false);

 if (!isOpen || !myNation) return null;

 const activeDecreeIds = Array.isArray(myNation.activeDecreeIds) ? myNation.activeDecreeIds : DEFAULT_ACTIVE_DECREE_IDS;
 const appointedMinisters = myNation.ministers || {
  defense: 'min_def_1',
  finance: 'min_fin_1',
  foreign: 'min_for_1',
  industry: 'min_ind_1',
 };

 const { stability, approval, status, statusText } = calculateNationalStability(myNation);
 const worldTension = calculateWorldTension(allNations);

 // Toggle Decree
 const handleToggleDecree = (decreeId: string) => {
  const isCurrentlyActive = activeDecreeIds.includes(decreeId);

  // 检查法令特殊的世界紧张度前置要求 (HOI4 Mechanism)
  if (!isCurrentlyActive && decreeId === 'decree_war_economy') {
   const hasActiveWar = myNation.activeWars && myNation.activeWars.length > 0;
   if (worldTension.tension < 20 && !hasActiveWar) {
    onShowToast(` 无法施行【战时经济动员令】：需要世界紧张度 ≥ 20% 或处于战时状态（当前：${worldTension.tension}%）！`);
    return;
   }
  }

  let updatedIds: string[];

  if (isCurrentlyActive) {
   updatedIds = activeDecreeIds.filter((id) => id !== decreeId);
   onShowToast(`已废止法令【${PRESET_DECREES.find((d) => d.id === decreeId)?.name}】`);
  } else {
   updatedIds = [...activeDecreeIds, decreeId];
   onShowToast(` 已颁布施行法令【${PRESET_DECREES.find((d) => d.id === decreeId)?.name}】！`);
  }

  const updatedNation: Nation = {
   ...myNation,
   activeDecreeIds: updatedIds,
  };
  onUpdateNation(updatedNation);
 };

 // Appoint Minister
 const handleAppointMinister = (role: 'defense' | 'finance' | 'foreign' | 'industry', ministerId: string) => {
  const updatedMinisters = {
   ...appointedMinisters,
   [role]: ministerId,
  };

  const min = PRESET_MINISTERS.find((m) => m.id === ministerId);
  onShowToast(` 已任命【${min?.name}】为最高【${min?.roleTitle}】！`);

  const updatedNation: Nation = {
   ...myNation,
   ministers: updatedMinisters,
  };
  onUpdateNation(updatedNation);
 };

 return (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
   <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-slate-900">
    {/* Header */}
    <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
     <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
       <Landmark className="w-5 h-5" />
      </div>
      <div>
       <h3 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
        <span>国家政府内政院 · 法令树与智库内阁</span>
       </h3>
       <p className="text-xs text-slate-400">
        颁布国策法令、委任内阁大臣并调控全国民意与稳定性
       </p>
      </div>
     </div>
     <button
      onClick={onClose}
      className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
     >
      <X className="w-5 h-5" />
     </button>
    </div>

    {/* Top Stability & World Tension Banner */}
    <div className="bg-slate-950 px-6 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
     <div className="flex items-center gap-4">
      <div>
       <span className="text-slate-400">全国稳定性：</span>
       <strong
        className={`font-mono ${
         stability >= 70 ? 'text-emerald-400' : stability >= 40 ? 'text-amber-400' : 'text-rose-400'
        }`}
       >
        {stability}%
       </strong>
      </div>
      <div>
       <span className="text-slate-400">民意支持度：</span>
       <strong className="text-indigo-300 font-mono">{approval}%</strong>
      </div>
     </div>

     <div className="flex items-center gap-2">
      {/* World Tension Pill */}
      <div className="relative">
       <button
        type="button"
        onClick={() => setShowTensionDetail(!showTensionDetail)}
        className={`px-2.5 py-1 rounded-full border text-[11px] font-bold flex items-center gap-1.5 cursor-pointer transition ${
         worldTension.tension >= 75
          ? 'bg-rose-950/80 border-rose-500 text-rose-300 animate-pulse'
          : worldTension.tension >= 50
          ? 'bg-amber-950/80 border-amber-500 text-amber-300'
          : worldTension.tension >= 25
          ? 'bg-sky-950/80 border-sky-500 text-sky-300'
          : 'bg-slate-800/80 border-slate-700 text-slate-300'
        }`}
       >
        <Flame className="w-3 h-3 text-amber-400" />
        <span>世界紧张度: {worldTension.tension}%</span>
       </button>

       {showTensionDetail && (
        <div className="absolute right-0 top-8 z-30 w-72 p-3 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl text-slate-200 animate-fadeIn">
         <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <span className="font-bold text-xs text-white">地缘格局 · 世界紧张度</span>
          <span className="text-[10px] px-1.5 py-0.2 bg-amber-500/20 text-amber-300 rounded font-mono">
           {worldTension.stageText}
          </span>
         </div>
         <div className="text-[11px] text-slate-400 mt-2 space-y-1">
          {worldTension.reasons.length > 0 ? (
           worldTension.reasons.map((r, i) => (
            <div key={i} className="flex items-start gap-1">
             <span className="text-amber-400">•</span>
             <span>{r}</span>
            </div>
           ))
          ) : (
           <p className="text-slate-500">当前各大陆地缘秩序平静，无大规模主权冲突。</p>
          )}
         </div>
         <p className="text-[10px] text-indigo-300/80 border-t border-slate-800/60 pt-2 mt-2">
           提示：紧张度越高，各同盟国结盟限制越低，战时动员法令施行门槛越低。
         </p>
        </div>
       )}
      </div>

      <div className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-[11px] font-bold">
       {statusText}
      </div>
     </div>
    </div>

    {/* Sub Tabs */}
    <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-2 gap-2">
     {[
      { id: 'decrees', label: '领主执政法令树', icon: ScrollText },
      { id: 'ministers', label: '内阁大臣与智库', icon: Users },
      { id: 'stability', label: '民意与稳定性评估', icon: Scale },
     ].map((tab) => {
      const Icon = tab.icon;
      const isActive = activeTab === tab.id;
      return (
       <button
        key={tab.id}
        type="button"
        onClick={() => setActiveTab(tab.id as any)}
        className={`py-2.5 px-3.5 text-xs font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
         isActive
          ? 'border-indigo-600 text-indigo-600 bg-white rounded-t-lg'
          : 'border-transparent text-slate-500 hover:text-slate-800'
        }`}
       >
        <Icon className="w-3.5 h-3.5" />
        <span>{tab.label}</span>
       </button>
      );
     })}
    </div>

    {/* Content Body */}
    <div className="p-6 overflow-y-auto flex-1 space-y-4">
     {/* TAB 1: DECREES (法令树) */}
     {activeTab === 'decrees' && (
      <div className="space-y-3">
       <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-2xl text-xs text-indigo-900">
        <strong>国策法令施行机制：</strong> 施行法令可激活全境军工产值、关税税收或稳定性加成，同时消耗一定的维系产能。
       </div>

       <div className="grid grid-cols-1 gap-3">
        {PRESET_DECREES.map((d) => {
         const isActive = activeDecreeIds.includes(d.id);
         return (
          <div
           key={d.id}
           className={`p-4 rounded-2xl border transition-all ${
            isActive
             ? 'bg-indigo-50/40 border-indigo-300 shadow-sm ring-1 ring-indigo-200'
             : 'bg-white border-slate-200 hover:border-slate-300'
           }`}
          >
           <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
             <div className="flex items-center gap-2">
              <h4 className="text-xs sm:text-sm font-bold text-slate-900">{d.name}</h4>
              <span className="text-[10px] px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded font-medium">
               {d.category === 'economy' ? '经济法令' : d.category === 'military' ? '军事法令' : '社会法令'}
              </span>
              {isActive && (
               <span className="text-[10px] px-1.5 py-0.2 bg-emerald-100 text-emerald-700 font-bold rounded flex items-center gap-1">
                <CheckCircle2 className="w-2.5 h-2.5" />
                正在施行
               </span>
              )}
             </div>
             <p className="text-xs text-slate-600 mt-1 leading-relaxed">{d.description}</p>

             <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-mono">
              {d.effects.milCapacityMultiplier && (
               <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-100">
                军工产出 {d.effects.milCapacityMultiplier > 0 ? '+' : ''}
                {d.effects.milCapacityMultiplier * 100}%
               </span>
              )}
              {d.effects.civCapacityMultiplier && (
               <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100">
                民工产出 {d.effects.civCapacityMultiplier > 0 ? '+' : ''}
                {d.effects.civCapacityMultiplier * 100}%
               </span>
              )}
              {d.effects.researchSpeedBonus && (
               <span className="px-2 py-0.5 rounded bg-violet-50 text-violet-700 border border-violet-100">
                科研速度 +{d.effects.researchSpeedBonus * 100}%
               </span>
              )}
              {d.effects.stabilityBonus && (
               <span className="px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-100">
                稳定性 {d.effects.stabilityBonus > 0 ? '+' : ''}
                {d.effects.stabilityBonus}%
               </span>
              )}
              {d.effects.popularApprovalBonus && (
               <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-100">
                民意支持 {d.effects.popularApprovalBonus > 0 ? '+' : ''}
                {d.effects.popularApprovalBonus}%
               </span>
              )}
              <span className="text-slate-400 ml-auto">
               维系开销: {d.upkeepCostCiv} 产能/月
              </span>
             </div>
            </div>

            <button
             type="button"
             onClick={() => handleToggleDecree(d.id)}
             className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
              isActive
               ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
               : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
             }`}
            >
             {isActive ? '废止法令' : '颁布施行'}
            </button>
           </div>
          </div>
         );
        })}
       </div>
      </div>
     )}

     {/* TAB 2: CABINET MINISTERS (内阁智库) */}
     {activeTab === 'ministers' && (
      <div className="space-y-4">
       <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-700">
        <strong>国家内阁智库：</strong> 为四大支柱职务任命杰出大臣，直接获得专属国防、税收或外交加成。
       </div>

       {(['defense', 'finance', 'foreign', 'industry'] as const).map((role) => {
        const roleName =
         role === 'defense'
          ? '国防大臣 (军事与战备)'
          : role === 'finance'
          ? '财政总长 (税收与国库)'
          : role === 'foreign'
          ? '外交特使 (同盟与条约)'
          : '工业科学大臣 (奇观与科研)';

        const currentMinisterId = appointedMinisters[role];
        const candidates = PRESET_MINISTERS.filter((m) => m.role === role);

        return (
         <div key={role} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
          <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
           <span>{roleName}</span>
           <span className="text-[10px] text-slate-500 font-mono">当前委任中</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
           {candidates.map((cand) => {
            const isAppointed = currentMinisterId === cand.id;
            return (
             <div
              key={cand.id}
              className={`p-3 rounded-xl border transition ${
               isAppointed
                ? 'bg-indigo-50 border-indigo-300 ring-1 ring-indigo-200'
                : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
             >
              <div className="flex items-center justify-between mb-1">
               <span className="text-xs font-bold text-slate-900">{cand.name}</span>
               <span className="text-[10px] px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded font-medium">
                {cand.trait}
               </span>
              </div>
              <p className="text-[11px] text-slate-500 mb-2 leading-tight">{cand.description}</p>
              <div className="flex items-center justify-between">
               <div className="text-[10px] text-indigo-600 font-mono">
                {cand.buffs.milProductionBuff && `军工 +${cand.buffs.milProductionBuff}% `}
                {cand.buffs.civProductionBuff && `民工 +${cand.buffs.civProductionBuff}% `}
                {cand.buffs.diploBuff && `外交 +${cand.buffs.diploBuff}% `}
                {cand.buffs.stability && `稳定 +${cand.buffs.stability}% `}
               </div>
               <button
                type="button"
                onClick={() => handleAppointMinister(role, cand.id)}
                disabled={isAppointed}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                 isAppointed
                  ? 'bg-indigo-200 text-indigo-800 cursor-default'
                  : 'bg-slate-900 hover:bg-slate-800 text-white'
                }`}
               >
                {isAppointed ? '在任' : '委任'}
               </button>
              </div>
             </div>
            );
           })}
          </div>
         </div>
        );
       })}
      </div>
     )}

     {/* TAB 3: STABILITY (民意与稳定性系统) */}
     {activeTab === 'stability' && (
      <div className="space-y-4">
       <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl text-center">
         <div className="text-xs font-bold text-emerald-900 mb-1">国家综合稳定性</div>
         <div className="text-3xl font-black text-emerald-600 font-mono">{stability}%</div>
         <div className="text-[11px] text-emerald-700 mt-1">{statusText}</div>
        </div>

        <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-2xl text-center">
         <div className="text-xs font-bold text-indigo-900 mb-1">国民拥戴民意支持</div>
         <div className="text-3xl font-black text-indigo-600 font-mono">{approval}%</div>
         <div className="text-[11px] text-indigo-700 mt-1">民心所向 · 征兵活跃</div>
        </div>
       </div>

       <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-2 text-xs">
        <div className="font-bold text-slate-800 mb-2">稳定性动态构成要素：</div>
        <div className="flex items-center justify-between text-slate-600">
         <span>国策法令施行调节：</span>
         <span className="font-mono text-indigo-600 font-bold">
          {activeDecreeIds.length > 0 ? '+15% 正向繁荣' : '0%'}
         </span>
        </div>
        <div className="flex items-center justify-between text-slate-600">
         <span>边境交战状态损耗：</span>
         <span className="font-mono text-rose-600 font-bold">
          {(myNation.activeWars?.length || 0) > 0 ? `-${(myNation.activeWars?.length || 0) * 12}% 战时动荡` : '无战事损耗'}
         </span>
        </div>
        <div className="flex items-center justify-between text-slate-600">
         <span>省份工业与传世奇观基建：</span>
         <span className="font-mono text-emerald-600 font-bold">+10% 盛世繁华</span>
        </div>
       </div>
      </div>
     )}
    </div>
   </div>
  </div>
 );
};
