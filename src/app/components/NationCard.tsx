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

    <div>
     {/* Footer Link */}
     <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
      <span className="text-[11px] sm:text-xs font-semibold text-indigo-600 flex items-center gap-0.5 group-hover:gap-1 transition-all whitespace-nowrap shrink-0">
       查看 <ChevronRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
      </span>
      
      {/* Actions */}
      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
       {onViewTerritory && (
        <button
         type="button"
         onClick={() => onViewTerritory(nation)}
         className="px-1.5 py-0.5 text-[10px] font-medium text-slate-600 hover:text-sky-600 hover:bg-sky-50 border border-slate-200 hover:border-sky-200 rounded transition flex items-center gap-0.5 whitespace-nowrap shrink-0 cursor-pointer"
        >
         <StrategicTerritoryIcon size={10} className="shrink-0" /> <span>疆域</span>
        </button>
       )}
       
       {isMyNation && (
        <>
         <button
          type="button"
          onClick={() => onEdit(nation)}
          className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition cursor-pointer"
          title="编辑国家"
         >
          <Edit3 className="w-3.5 h-3.5" />
         </button>
         <button
          type="button"
          onClick={() => onDelete(nation)}
          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
          title="删除国家"
         >
          <Trash2 className="w-3.5 h-3.5" />
         </button>
        </>
       )}
       {isAdmin && !isMyNation && (
        <div className="flex items-center gap-1">
         <button
          type="button"
          onClick={() => onDelete(nation)}
          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
          title="管理删除"
         >
          <Trash2 className="w-3.5 h-3.5" />
         </button>
        </div>
       )}
      </div>
     </div>
    </div>
   </div>
  </div>
 );
};

