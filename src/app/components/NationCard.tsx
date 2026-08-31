import React from 'react';
import {
 ChevronRight,
 Edit3,
 Trash2,
} from 'lucide-react';
import { TikTokIcon } from './TikTokIcon';
import { Nation, DiplomacyType } from '../types';
import { useAuth } from '../context/AuthContext';
import {
 renderEmblemIcon,
 StrategicTerritoryIcon,
 StrategicDossierIcon,
 StrategicTreatyIcon,
} from '../lib/icons';
import { calculateNationalStability } from '../services/strategicGameplayService';
import { NationStateCore, NationStatusType } from './NationStateCore';

interface NationCardProps {
 nation: Nation;
 onViewDetails: (nation: Nation) => void;
 onViewTerritory?: (nation: Nation) => void;
 onOpenDiplomacy: (nation: Nation, defaultType?: DiplomacyType) => void;
 onEdit: (nation: Nation) => void;
 onDelete: (nation: Nation) => void;
}

export const NationCard: React.FC<NationCardProps> = ({
 nation,
 onViewDetails,
 onViewTerritory,
 onOpenDiplomacy,
 onEdit,
 onDelete,
}) => {
 const { user, isAdmin, myNation } = useAuth();

 const isMyNation = user && nation.ownerId === user.id;
 const isAtWar = (nation.activeWars || []).length > 0;
 const isAtWarWithMe = myNation && (nation.activeWars || []).some((w) => w.withNationId === myNation.id);
 const { stability } = calculateNationalStability(nation);
 const douyinNickname = nation.ownerDouyinName || nation.ownerUsername;

 // Dynamic state determination
 let statusType: NationStatusType = 'peace';
 let statusLabel = '和平';

 if (isAtWar) {
  statusType = 'war';
  statusLabel = isAtWarWithMe ? '交战(与我国)' : '战争中';
 } else {
  const treaty = myNation ? (nation.activeTreaties || []).find((t) => t.withNationId === myNation.id) : null;
  if (treaty) {
   if (treaty.type === 'peace') {
    statusType = 'peace';
    statusLabel = '和平条约';
   } else if (treaty.type === 'mutual_defense') {
    statusType = 'treaty';
    statusLabel = '互保条约';
   } else {
    statusType = 'truce';
    statusLabel = '军事通行';
   }
  } else if (stability < 30) {
   statusType = 'unrest';
   statusLabel = '内乱';
  } else if (stability < 50) {
   statusType = 'tension';
   statusLabel = '紧张';
  } else {
   statusType = 'peace';
   statusLabel = '和平';
  }
 }

 return (
  <div
   onClick={() => onViewDetails(nation)}
   className="group bg-white hover:bg-slate-50 transition-colors duration-300 flex flex-col h-full overflow-hidden cursor-pointer relative"
  >
   {/* Full-bleed Flag Cover matching standard flag ratio */}
   <div 
    className="w-full aspect-[3/2] shrink-0 flex items-center justify-center relative overflow-hidden" 
    style={{ backgroundColor: nation.flagColor || '#6366f1' }}
   >
    {nation.emblemIcon && (nation.emblemIcon.startsWith('data:image') || nation.emblemIcon.startsWith('http')) ? (
     <img
      src={nation.emblemIcon}
      alt={nation.name}
      className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
     />
    ) : (
     renderEmblemIcon(nation.emblemIcon, { className: 'w-8 h-8 sm:w-14 sm:h-14 text-white drop-shadow-md group-hover:scale-110 transition-transform duration-300' })
    )}
    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
   </div>
   
   <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between">
    <div>
     {/* 1. 国家名称 */}
     <h3 className="font-bold text-sm sm:text-base text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
      {nation.name}
     </h3>
     {/* 2. 首都 */}
     <p className="text-[11px] sm:text-xs text-slate-500 truncate mt-0.5 mb-2">{nation.capital}</p>

     {/* 3. 抖音昵称 */}
     <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-slate-700 mb-3">
      <TikTokIcon className="w-3.5 h-3.5 text-slate-900 shrink-0" />
      <span className="font-medium truncate">{douyinNickname}</span>
     </div>

     {/* 4. 国家信息栏 (稳定度 + 实时状态核心) */}
     <div className="flex items-center justify-between text-xs py-2 border-t border-slate-100">
      <div className="flex items-center gap-1.5 font-mono">
       <span className={`font-bold ${
        stability >= 70 ? 'text-emerald-600' : stability >= 40 ? 'text-amber-600' : 'text-rose-600'
       }`}>
        {stability}%
       </span>
       <span className="text-[11px] text-slate-400 font-sans">稳定度</span>
      </div>
      <NationStateCore type={statusType} label={statusLabel} />
     </div>
    </div>

    <div className="pt-1.5 border-t border-slate-100 mt-1 space-y-1">
     {/* Action Buttons Grid Filling Card Width - Ultra-compact styling */}
     <div className="grid grid-cols-2 gap-1 w-full" onClick={(e) => e.stopPropagation()}>
      <button
       type="button"
       onClick={() => onViewDetails(nation)}
       className="h-6 w-full px-1.5 bg-indigo-50/80 hover:bg-indigo-100/90 text-indigo-700 font-semibold text-[10px] sm:text-[11px] border border-indigo-200/60 rounded transition-all active:scale-[0.98] flex items-center justify-center gap-0.5 sm:gap-1 cursor-pointer whitespace-nowrap overflow-visible shadow-2xs group/btn"
       title="查看国牒"
      >
       <StrategicDossierIcon size={11} className="shrink-0 text-indigo-600 group-hover/btn:scale-105 transition-transform" />
       <span className="shrink-0">查看国牒</span>
       <ChevronRight className="w-2.5 h-2.5 text-indigo-400 shrink-0" />
      </button>

      {onViewTerritory ? (
       <button
        type="button"
        onClick={() => onViewTerritory(nation)}
        className="h-6 w-full px-1.5 bg-slate-50/90 hover:bg-sky-50 text-slate-700 hover:text-sky-700 font-semibold text-[10px] sm:text-[11px] border border-slate-200/80 hover:border-sky-200/80 rounded transition-all active:scale-[0.98] flex items-center justify-center gap-0.5 sm:gap-1 cursor-pointer whitespace-nowrap overflow-visible shadow-2xs group/btn"
        title="疆域沙盘"
       >
        <StrategicTerritoryIcon size={11} className="shrink-0 text-slate-500 group-hover/btn:text-sky-600 group-hover/btn:scale-105 transition-transform" />
        <span className="shrink-0">疆域沙盘</span>
       </button>
      ) : (
       <button
        type="button"
        onClick={() => onOpenDiplomacy(nation)}
        className="h-6 w-full px-1.5 bg-slate-50/90 hover:bg-slate-100 text-slate-700 font-semibold text-[10px] sm:text-[11px] border border-slate-200/80 rounded transition-all active:scale-[0.98] flex items-center justify-center gap-0.5 sm:gap-1 cursor-pointer whitespace-nowrap overflow-visible shadow-2xs group/btn"
        title="外交公约"
       >
        <StrategicTreatyIcon size={11} className="shrink-0 text-slate-500 group-hover/btn:text-slate-700" />
        <span className="shrink-0">外交公约</span>
       </button>
      )}
     </div>

     {/* Secondary Management Row if applicable */}
     {(isMyNation || (isAdmin && !isMyNation)) && (
      <div className="flex items-center gap-1.5 w-full pt-1" onClick={(e) => e.stopPropagation()}>
       {isMyNation && (
        <>
         <button
          type="button"
          onClick={() => onEdit(nation)}
          className="flex-1 py-1 px-2 text-[11px] font-medium text-slate-600 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-md transition flex items-center justify-center gap-1 cursor-pointer"
         >
          <Edit3 className="w-3 h-3" />
          <span>更迭政令</span>
         </button>
         <button
          type="button"
          disabled={(nation.activeWars || []).length > 0}
          onClick={() => {
           if ((nation.activeWars || []).length > 0) {
            alert('处于战争状态时无法解散国家！');
            return;
           }
           onDelete(nation);
          }}
          className={`py-1 px-2 text-[11px] font-medium border rounded-md transition flex items-center justify-center gap-1 ${
           (nation.activeWars || []).length > 0
            ? 'text-slate-300 border-slate-200 cursor-not-allowed opacity-50'
            : 'text-rose-600 hover:bg-rose-50 border-rose-200/80 cursor-pointer'
          }`}
          title={(nation.activeWars || []).length > 0 ? '处于战争状态时无法解散国家' : '解散国家'}
         >
          <Trash2 className="w-3 h-3" />
         </button>
        </>
       )}
       {isAdmin && !isMyNation && (
        <button
         type="button"
         disabled={(nation.activeWars || []).length > 0}
         onClick={() => {
          if ((nation.activeWars || []).length > 0) {
           alert('处于战争状态时无法解散国家！');
           return;
          }
          onDelete(nation);
         }}
         className={`w-full py-1 px-2 text-[11px] font-medium border rounded-md transition flex items-center justify-center gap-1 ${
          (nation.activeWars || []).length > 0
           ? 'text-slate-300 border-slate-200 bg-slate-50 cursor-not-allowed opacity-50'
           : 'text-rose-600 hover:bg-rose-50 border-rose-200 cursor-pointer'
         }`}
         title={(nation.activeWars || []).length > 0 ? '处于战争状态时无法解散国家' : '管理终结归档'}
        >
         <Trash2 className="w-3 h-3" />
         <span>管理终结归档</span>
        </button>
       )}
      </div>
     )}
    </div>
   </div>
  </div>
 );
};

