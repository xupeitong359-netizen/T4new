import React from 'react';
import { CapitulationResolution } from '../types';
import {
 X,
 FileCheck2,
 ShieldAlert,
 Coins,
 MapPin,
 CheckCircle2,
 Scale,
 Building,
} from 'lucide-react';
import { StrategicWarfareIcon } from '../lib/icons';

interface CapitulationModalProps {
 isOpen: boolean;
 resolution: CapitulationResolution | null;
 onClose: () => void;
}

export const CapitulationModal: React.FC<CapitulationModalProps> = ({
 isOpen,
 resolution,
 onClose,
}) => {
 if (!isOpen || !resolution) return null;

 return (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
   <div className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden text-slate-900 dark:text-slate-100 flex flex-col">
    {/* Header */}
    <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 text-white relative">
     <button
      onClick={onClose}
      className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
     >
      <X className="w-4 h-4" />
     </button>

     <div className="flex items-center gap-2 mb-2">
      <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-rose-600/80 text-white uppercase tracking-wider flex items-center gap-1">
       <StrategicWarfareIcon size={12} /> 停战与战后处置决议公报
      </span>
     </div>

     <h2 className="text-xl font-extrabold tracking-tight">
      【{resolution.capitulatedNationName}】无条件投降决议
     </h2>
     <p className="text-xs text-slate-300 mt-1">
      签署日期：{new Date(resolution.timestamp).toLocaleString('zh-CN')}
     </p>
    </div>

    {/* Content */}
    <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
     {/* Summary Box */}
     <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-xs leading-relaxed text-rose-900 dark:text-rose-200 flex items-start gap-3">
      <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
      <div>
       <p className="font-bold mb-1">最高战略停火公报摘要</p>
       <p>{resolution.summary}</p>
      </div>
     </div>

     {/* Key Parties */}
     <div className="grid grid-cols-2 gap-3 text-xs">
      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
       <span className="text-[10px] text-slate-400 block uppercase font-bold">战胜国 (Victor)</span>
       <span className="font-extrabold text-sm text-emerald-600 dark:text-emerald-400 block mt-0.5">
        {resolution.victorNationName}
       </span>
       <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">全权受降统帅部</span>
      </div>

      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
       <span className="text-[10px] text-slate-400 block uppercase font-bold">战败投降国 (Capitulated)</span>
       <span className="font-extrabold text-sm text-rose-600 dark:text-rose-400 block mt-0.5">
        {resolution.capitulatedNationName}
       </span>
       <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">投降倾向达到 100 阈值</span>
      </div>
     </div>

     {/* Terms Breakdown */}
     <div className="space-y-3">
      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
       <Scale className="w-3.5 h-3.5 text-indigo-500" />
       <span>条约法定执行条款 (Binding Settlement Terms)</span>
      </h4>

      <div className="space-y-2 text-xs">
       {/* Ceded Provinces */}
       <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 flex items-start gap-2.5">
        <MapPin className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
         <span className="font-bold text-slate-800 dark:text-slate-200">领土移交与主权割让</span>
         <p className="text-[11px] text-slate-600 dark:text-slate-400">
          {resolution.terms.cededProvinces.length > 0
           ? `被占领与争议省份【${resolution.terms.cededProvinces.join('、')}】的主权管辖权正式移交至【${resolution.victorNationName}】。`
           : '无额外领土割让要求，恢复战前停火分界线。'}
         </p>
        </div>
       </div>

       {/* Reparations */}
       <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 flex items-start gap-2.5">
        <Coins className="w-4 h-4 text-yellow-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
         <span className="font-bold text-slate-800 dark:text-slate-200">战后工业与经济赔偿</span>
         <p className="text-[11px] text-slate-600 dark:text-slate-400">
          向战胜国交付总计 <strong className="text-amber-600">{resolution.terms.reparationsTotal}</strong> 战略产能基金作为停战清算金。
         </p>
        </div>
       </div>

       {/* Demilitarization */}
       <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 flex items-start gap-2.5">
        <Building className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
         <span className="font-bold text-slate-800 dark:text-slate-200">非军事缓冲区设立</span>
         <p className="text-[11px] text-slate-600 dark:text-slate-400">
          设立【{resolution.terms.demilitarizedZones.join('、')}】为非军事安全缓冲区，双方撤出重型武装。
         </p>
        </div>
       </div>
      </div>
     </div>
    </div>

    {/* Footer */}
    <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-700/60 flex justify-end">
     <button
      type="button"
      onClick={onClose}
      className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 transition cursor-pointer"
     >
      确认并归档公报
     </button>
    </div>
   </div>
  </div>
 );
};
