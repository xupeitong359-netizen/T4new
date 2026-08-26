import React, { useState } from 'react';
import {
 X,
 Send,
 Shield,
 Crown,
 CheckCircle2,
 AlertTriangle,
 Building,
 FileText,
 Sparkles,
} from 'lucide-react';
import { AllianceFaction, Nation } from '../../types';
import { getTotalMilitaryFactories } from '../../lib/militaryIndustry';
import { getTotalCivilianFactories } from '../../lib/economyEngine';

interface AlliancePetitionModalProps {
 isOpen: boolean;
 onClose: () => void;
 targetAlliance: AllianceFaction | null;
 myNation: Nation;
 onSubmitPetition: (allianceId: string, memo: string) => void;
}

export const AlliancePetitionModal: React.FC<AlliancePetitionModalProps> = ({
 isOpen,
 onClose,
 targetAlliance,
 myNation,
 onSubmitPetition,
}) => {
 const [memo, setMemo] = useState(
  `【${myNation.name}】谨向【${targetAlliance?.name || '公约委员会'}】递交主权国家入盟照会，承诺遵守公约防务与多边协作章程。`
 );

 if (!isOpen || !targetAlliance) return null;

 const myMilFactories = getTotalMilitaryFactories(myNation);
 const myCivFactories = getTotalCivilianFactories(myNation);
 const myStability = myNation.stability || 80;

 // Criteria Verification
 const reqStability = targetAlliance.joinRequirements?.minStability || 40;
 const passStability = myStability >= reqStability;

 const reqFactories = targetAlliance.joinRequirements?.minFactories || 1;
 const passFactories = myMilFactories + myCivFactories >= reqFactories;

 const passOpen = targetAlliance.joinRequirements?.allowOpenApplication !== false;

 const templates = [
  {
   label: '集体边境防御与互保',
   text: `【${myNation.name}】申请加入同盟体系，承诺在集体防务受威胁时全力协同作战，筑牢地缘安全防线。`,
  },
  {
   label: '深化工业互援与军备协作',
   text: `本国拥有健全之军民重工业网络，愿与盟友分享工业产能与战备物资，实现多边共同繁荣。`,
  },
  {
   label: '抵御外敌霸权与维和',
   text: `鉴于周边地缘紧张局势，本国愿与盟主国及全体缔约国同舟共济，捍卫大陆均势与和平秩序。`,
  },
 ];

 return (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
   <div className="w-full max-w-2xl bg-white border border-slate-200/90 rounded-xl shadow-2xl flex flex-col max-h-[92vh] text-slate-800 overflow-hidden">
    {/* Header */}
    <div className="px-5 sm:px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between">
     <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs shadow-2xs">
       <Send size={18} />
      </div>
      <div>
       <div className="text-xs font-semibold text-blue-600 tracking-wide">
        入盟外交照会
       </div>
       <h3 className="text-base font-bold text-slate-900">
        申请加入【{targetAlliance.name}】
       </h3>
      </div>
     </div>
     <button
      type="button"
      onClick={onClose}
      className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition cursor-pointer"
     >
      <X className="w-4 h-4" />
     </button>
    </div>

    {/* Body */}
    <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1 text-xs">
     {/* Applicant Nation Strategic Dossier Preview */}
     <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
      <div className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
       <Building className="w-3.5 h-3.5 text-blue-600" />
       <span>申请国战略档案背书（本国）</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
       <div className="p-2 bg-white rounded-md border border-slate-200/80">
        <span className="text-slate-400 text-[10px] block font-medium">主权国名</span>
        <strong className="text-slate-800 truncate block mt-0.5">{myNation.name}</strong>
       </div>
       <div className="p-2 bg-white rounded-md border border-slate-200/80">
        <span className="text-slate-400 text-[10px] block font-medium">最高领主</span>
        <strong className="text-slate-800 truncate block mt-0.5">{myNation.ownerUsername}</strong>
       </div>
       <div className="p-2 bg-white rounded-md border border-slate-200/80">
        <span className="text-slate-400 text-[10px] block font-medium">军工厂 / 民工</span>
        <strong className="text-amber-700 truncate block mt-0.5">{myMilFactories} / {myCivFactories} 座</strong>
       </div>
       <div className="p-2 bg-white rounded-md border border-slate-200/80">
        <span className="text-slate-400 text-[10px] block font-medium">国内稳定度</span>
        <strong className="text-emerald-700 truncate block mt-0.5">{myStability}%</strong>
       </div>
      </div>
     </div>

     {/* Admission Criteria Verification */}
     <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
      <div className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
       <Crown className="w-3.5 h-3.5 text-amber-600" />
       <span>同盟准入门槛资质核验</span>
      </div>

      <div className="space-y-1.5">
       <div className="flex items-center justify-between p-2 bg-white border border-slate-200/80 rounded-md">
        <span className="text-slate-600">稳定度门槛 (≥{reqStability}%)</span>
        <span className={`flex items-center gap-1 font-semibold ${passStability ? 'text-emerald-700' : 'text-rose-600'}`}>
         {passStability ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
         <span>{myStability}% ({passStability ? '符合要求' : '未达标'})</span>
        </span>
       </div>

       <div className="flex items-center justify-between p-2 bg-white border border-slate-200/80 rounded-md">
        <span className="text-slate-600">工厂总数门槛 (≥{reqFactories}座)</span>
        <span className={`flex items-center gap-1 font-semibold ${passFactories ? 'text-emerald-700' : 'text-rose-600'}`}>
         {passFactories ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
         <span>{myMilFactories + myCivFactories} 座 ({passFactories ? '符合要求' : '未达标'})</span>
        </span>
       </div>

       <div className="flex items-center justify-between p-2 bg-white border border-slate-200/80 rounded-md">
        <span className="text-slate-600">公开申请受理状态</span>
        <span className={`font-semibold ${passOpen ? 'text-emerald-700' : 'text-amber-700'}`}>
         {passOpen ? '开放受理中' : '公约已关闭公开申请'}
        </span>
       </div>
      </div>
     </div>

     {/* Quick Memo Templates */}
     <div className="space-y-1.5">
      <span className="text-slate-500 text-xs font-medium block">选择外交照会公文模板：</span>
      <div className="flex items-center gap-2 flex-wrap">
       {templates.map((tpl, i) => (
        <button
         key={i}
         type="button"
         onClick={() => setMemo(tpl.text)}
         className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-md text-xs font-medium cursor-pointer transition-colors"
        >
         {tpl.label}
        </button>
       ))}
      </div>
     </div>

     {/* Diplomatic Statement TextArea */}
     <div className="space-y-1">
      <label className="block text-slate-600 text-xs font-medium">正式外交照会申请理由 (盟主/委员会审阅依据) *</label>
      <textarea
       rows={3}
       value={memo}
       onChange={(e) => setMemo(e.target.value)}
       className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
      />
     </div>
    </div>

    {/* Footer */}
    <div className="px-5 sm:px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
     <button
      type="button"
      onClick={onClose}
      className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium cursor-pointer transition-colors"
     >
      取消
     </button>
     <button
      type="button"
      onClick={() => {
       onSubmitPetition(targetAlliance.id, memo);
       onClose();
      }}
      className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs cursor-pointer transition-all shadow-xs flex items-center gap-1.5"
     >
      <Send className="w-3.5 h-3.5" />
      <span>正式递交外交照会</span>
     </button>
    </div>
   </div>
  </div>
 );
};
