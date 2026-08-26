import React, { useState } from 'react';
import {
 X,
 AlertTriangle,
 Send,
 Check,
} from 'lucide-react';
import { Nation, DiplomacyType } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
 renderEmblemIcon,
 StrategicTreatyIcon,
 StrategicWarfareIcon,
 MilitaryInfantryDivisionIcon,
} from '../lib/icons';

interface DiplomacyModalProps {
 isOpen: boolean;
 targetNation: Nation | null;
 onClose: () => void;
 onSuccess: (message: string) => void;
 initialType?: DiplomacyType;
}

interface TreatyOption {
 type: DiplomacyType;
 title: string;
 badge: string;
 description: string;
 icon: React.ReactNode;
 isDangerous?: boolean;
}

const TREATY_OPTIONS: TreatyOption[] = [
 {
  type: 'peace',
  title: '和平条约',
  badge: '互不侵犯',
  description: '确立友好邻邦邦交，签署互不侵犯协定，促进民间贸易与文化交融。',
  icon: <StrategicTreatyIcon size={16} className="text-emerald-600" />,
 },
 {
  type: 'mutual_defense',
  title: '互保条约',
  badge: '军事同盟',
  description: '建立攻守同盟与共同防御阵线，一旦任一方遭遇入侵，另一方有义务提供军事支援。',
  icon: <MilitaryInfantryDivisionIcon size={16} className="text-indigo-600" />,
 },
 {
  type: 'military_access',
  title: '军事通行权',
  badge: '通行许可',
  description: '互相开放领土走廊与边境哨卡，准许盟邦军队安全过境与后勤借道。',
  icon: <StrategicTreatyIcon size={16} className="text-sky-600" />,
 },
 {
  type: 'armistice',
  title: '停战协定',
  badge: '终结战争',
  description: '停止双方前线战火，恢复边境秩序，解除当前的交战敌对状态。',
  icon: <StrategicTreatyIcon size={16} className="text-amber-600" />,
 },
 {
  type: 'war',
  title: '宣战令 (最高军事行动)',
  badge: '全面开战',
  description: '正式撕毁一切和平条约，下达全国动员令，对目标国家开启全面战争状态！',
  icon: <StrategicWarfareIcon size={16} className="text-rose-600" />,
  isDangerous: true,
 },
];

export const DiplomacyModal: React.FC<DiplomacyModalProps> = ({
 isOpen,
 targetNation,
 onClose,
 onSuccess,
 initialType = 'peace',
}) => {
 const { myNation } = useAuth();
 const [selectedType, setSelectedType] = useState<DiplomacyType>(initialType);
 const [note, setNote] = useState('');
 const [error, setError] = useState<string | null>(null);
 const [isLoading, setIsLoading] = useState(false);
 const [warConfirmChecked, setWarConfirmChecked] = useState(false);

 if (!isOpen || !targetNation) return null;

 const isTargetAtWar = myNation?.activeWars?.some((w) => w.withNationId === targetNation.id);

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError(null);

  if (!myNation) {
   setError('您尚未建立国家，无法进行外交派遣');
   return;
  }

  if (selectedType === 'war' && !warConfirmChecked) {
   setError('发起全面战争需勾选誓约确认框');
   return;
  }

  try {
   setIsLoading(true);
   await api.diplomacy.send({
    targetNationId: targetNation.id,
    type: selectedType,
    note: note.trim() || undefined,
   });

   if (selectedType === 'war') {
    onSuccess(`已向【${targetNation.name}】正式下达宣战通牒！`);
   } else {
    onSuccess(`已向【${targetNation.name}】提交【${TREATY_OPTIONS.find((o) => o.type === selectedType)?.title}】草案！`);
   }
   onClose();
  } catch (err: any) {
   console.error(err);
   setError(err.message || '外交派遣失败，请稍后重试');
  } finally {
   setIsLoading(false);
  }
 };

 return (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
   <div className="w-full max-w-xl my-auto bg-white border border-slate-300/90 rounded-lg shadow-xl overflow-hidden relative text-slate-900 flex flex-col max-h-[92vh]">
    {/* Header - Compact Strategic Game Style */}
    <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
     <div className="flex items-center gap-2.5">
      <div className="w-7 h-7 rounded bg-indigo-700 text-white flex items-center justify-center shadow-2xs shrink-0">
       <StrategicTreatyIcon size={16} />
      </div>
      <div>
       <h3 className="text-sm font-bold text-slate-900 leading-none">
        最高外交国书署理中心
       </h3>
       <p className="text-[11px] text-slate-500 mt-1 leading-none">
        对【{targetNation.name}】递交外交文书或发布军事通牒
       </p>
      </div>
     </div>

     <button
      id="btn-close-diplomacy-header"
      type="button"
      onClick={onClose}
      className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-slate-700 rounded hover:bg-slate-200/70 transition-colors cursor-pointer"
     >
      <X className="w-4 h-4" />
     </button>
    </div>

    {/* Scrollable Form Content */}
    <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-3.5">
     {error && (
      <div className="p-2.5 bg-rose-50 border border-rose-200 rounded text-xs text-rose-700 font-medium flex items-center gap-2">
       <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
       <span>{error}</span>
      </div>
     )}

     {/* Target nation profile - Streamlined Object Bar */}
     <div className="px-3 py-2 bg-slate-50/90 rounded border border-slate-200 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5 min-w-0">
       <div
        className="w-9 h-6.5 rounded flex items-center justify-center border border-black/10 shadow-2xs shrink-0"
        style={{ backgroundColor: targetNation.flagColor || '#6366f1' }}
       >
        {renderEmblemIcon(targetNation.emblemIcon, { size: 13, className: 'text-white drop-shadow-xs' })}
       </div>
       <div className="min-w-0">
        <h4 className="font-bold text-xs text-slate-900 truncate leading-tight">{targetNation.name}</h4>
        <p className="text-[11px] text-slate-500 truncate leading-tight mt-0.5">
         元首: {targetNation.ownerUsername} · 首都: {targetNation.capital}
        </p>
       </div>
      </div>

      <div className="shrink-0">
       {isTargetAtWar ? (
        <span className="px-2 py-0.5 bg-rose-50 border border-rose-200/80 text-rose-700 text-[11px] font-semibold rounded inline-flex items-center gap-1">
         <StrategicWarfareIcon size={12} className="text-rose-600" />
         <span>交战敌对</span>
        </span>
       ) : (
        <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-[11px] font-semibold rounded inline-flex items-center gap-1">
         <StrategicTreatyIcon size={12} className="text-emerald-600" />
         <span>和平状态</span>
        </span>
       )}
      </div>
     </div>

     {/* Treaty options section */}
     <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
       <label className="text-xs font-bold text-slate-800">
        选择派遣条约类型或决策
       </label>
       <span className="text-[11px] text-slate-400">
        选择与该国家建立的外交关系类型
       </span>
      </div>

      {/* Structured Compact Decision List */}
      <div className="p-1 bg-slate-100/70 border border-slate-200/90 rounded flex flex-col gap-1.5">
       {TREATY_OPTIONS.map((opt) => {
        const isSelected = selectedType === opt.type;
        return (
         <div
          key={opt.type}
          id={`treaty-option-${opt.type}`}
          onClick={() => setSelectedType(opt.type)}
          className={`px-2.5 py-2 rounded border cursor-pointer transition-all flex items-center justify-between gap-3 ${
           isSelected
            ? opt.isDangerous
             ? 'bg-rose-50/70 border-rose-500 ring-1 ring-rose-500/30'
             : 'bg-blue-50/70 border-blue-500/90 ring-1 ring-blue-500/30'
            : opt.isDangerous
            ? 'bg-white border-slate-200/90 hover:border-rose-300 hover:bg-rose-50/30'
            : 'bg-white border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/50'
          }`}
         >
          {/* Left: Icon + Content */}
          <div className="flex items-center gap-2.5 min-w-0">
           <div
            className={`w-7.5 h-7.5 rounded flex items-center justify-center shrink-0 border ${
             opt.isDangerous
              ? 'bg-rose-50 border-rose-200/80'
              : isSelected
              ? 'bg-blue-100/80 border-blue-200'
              : 'bg-slate-50 border-slate-200/80'
            }`}
           >
            {opt.icon}
           </div>

           <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
             <span className="font-bold text-xs text-slate-900 leading-tight">
              {opt.title}
             </span>
             <span
              className={`text-[10px] font-medium px-1.5 py-0.2 rounded border leading-tight ${
               opt.isDangerous
                ? 'bg-rose-50 text-rose-700 border-rose-200/60'
                : 'bg-slate-100 text-slate-600 border-slate-200/70'
              }`}
             >
              {opt.badge}
             </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5 leading-snug truncate sm:whitespace-normal">
             {opt.description}
            </p>
           </div>
          </div>

          {/* Right: Selection indicator */}
          <div className="shrink-0 pl-1">
           {isSelected ? (
            <span
             className={`text-[11px] font-bold inline-flex items-center gap-1 px-1.5 py-0.5 rounded ${
              opt.isDangerous
               ? 'bg-rose-100/80 text-rose-700'
               : 'bg-blue-100/80 text-blue-700'
             }`}
            >
             <Check className="w-3 h-3 stroke-[2.5]" />
             <span className="hidden sm:inline">已选择</span>
            </span>
           ) : (
            <div className="w-3.5 h-3.5 rounded-full border border-slate-300" />
           )}
          </div>
         </div>
        );
       })}
      </div>
     </div>

     {/* War Confirmation Warning */}
     {selectedType === 'war' && (
      <div className="p-2.5 bg-rose-50/80 border border-rose-300 rounded space-y-2 animate-fadeIn">
       <div className="flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
        <div className="text-xs text-rose-900 space-y-0.5">
         <p className="font-bold leading-tight">战争通牒誓约警告：开战将使两国即刻进入交战状态！</p>
         <p className="text-[11px] text-rose-700 leading-tight">
          开战后将撕毁所有已有互保条约，并在国家大厅与大地图向全体元首广播战报。
         </p>
        </div>
       </div>

       <label className="flex items-center gap-2 text-xs font-semibold text-rose-900 cursor-pointer pt-1.5 border-t border-rose-200/80">
        <input
         id="checkbox-confirm-war"
         type="checkbox"
         checked={warConfirmChecked}
         onChange={(e) => setWarConfirmChecked(e.target.checked)}
         className="rounded text-rose-600 focus:ring-rose-500 w-3.5 h-3.5"
        />
        <span>本国统帅部已知悉重大后果，确认正式下达开战通牒</span>
       </label>
      </div>
     )}

     {/* Notes textarea - Compact */}
     <div className="space-y-1">
      <div className="flex items-center justify-between">
       <label className="text-xs font-bold text-slate-700">
        国书密函与外交致辞（选填）
       </label>
       <span className="text-slate-400 text-[11px]">将附录于国书送达对方元首</span>
      </div>
      <textarea
       rows={2}
       value={note}
       onChange={(e) => setNote(e.target.value)}
       placeholder="例如: 谨代表本国最高统帅部，愿与贵国结万世友好盟约..."
       className="w-full px-3 py-1.5 bg-slate-50/70 border border-slate-300 rounded text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white resize-none"
      />
     </div>
    </form>

    {/* Fixed Footer Buttons */}
    <div className="px-4 py-3 border-t border-slate-200 bg-slate-50/90 flex items-center justify-end gap-2 shrink-0">
     <button
      id="btn-cancel-diplomacy"
      type="button"
      onClick={onClose}
      className="h-8 px-3.5 bg-white hover:bg-slate-100 active:bg-slate-200 text-slate-700 font-medium text-xs rounded border border-slate-300 shadow-2xs transition-all cursor-pointer whitespace-nowrap active:translate-y-px"
     >
      取消
     </button>
     <button
      id="btn-submit-diplomacy"
      type="button"
      onClick={handleSubmit}
      disabled={isLoading}
      className={`h-8 px-4 font-bold text-xs rounded border shadow-2xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 text-white whitespace-nowrap active:translate-y-px ${
       selectedType === 'war'
        ? 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 border-rose-700'
        : 'bg-indigo-700 hover:bg-indigo-800 active:bg-indigo-900 border-indigo-800'
      }`}
     >
      <Send className="w-3.5 h-3.5 shrink-0" />
      <span>{isLoading ? '正在派遣...' : selectedType === 'war' ? '正式下达宣战通牒' : '签署并递交国书'}</span>
     </button>
    </div>
   </div>
  </div>
 );
};

