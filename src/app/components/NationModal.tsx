import { TikTokIcon } from './TikTokIcon';
import React, { useState } from 'react';
import {
 X,
 MapPin,
 Landmark,
 Scale,
 Coins,
 Languages,
 Edit3,
 Trash2,
 BookOpen,
 Calendar,
 TrendingUp,
 Building2,
 Swords,
 ScrollText,
 ShieldAlert,
} from 'lucide-react';
import { Nation, DiplomacyType } from '../types';
import { useAuth } from '../context/AuthContext';
import {
 renderEmblemIcon,
 renderEquipmentTacticalIcon,
 MilitaryFactoryPlantIcon,
 CivilianFactoryPlantIcon,
 StrategicWarfareIcon,
 StrategicTreatyIcon,
 StrategicTerritoryIcon,
 StrategicManpowerIcon,
 MilitaryInfantryDivisionIcon,
} from '../lib/icons';
import { CAPACITY_PER_MILITARY_FACTORY_24H, getTotalMilitaryFactories } from '../lib/militaryIndustry';
import { getTotalCivilianFactories } from '../lib/economyEngine';
import { NationalEconomyDashboard } from './NationalEconomyDashboard';
import { SurrenderStatusCard } from './SurrenderStatusCard';

interface NationModalProps {
 isOpen: boolean;
 nation: Nation | null;
 onClose: () => void;
 onOpenDiplomacy: (nation: Nation, defaultType?: DiplomacyType) => void;
 onEdit: (nation: Nation) => void;
 onDelete: (nation: Nation) => void;
 onTerminateTreaty?: (treatyId: string, withNationName: string) => void;
 onOpenDispute?: (nation: Nation) => void;
 onOpenAlliance?: (nation: Nation) => void;
 onUpdateNation?: (updated: Nation) => void;
 showToast?: (msg: string) => void;
}

export const NationModal: React.FC<NationModalProps> = ({
 isOpen,
 nation,
 onClose,
 onOpenDiplomacy,
 onEdit,
 onDelete,
 onTerminateTreaty,
 onOpenDispute,
 onOpenAlliance,
 onUpdateNation,
 showToast,
}) => {
 const { user, isAdmin, myNation } = useAuth();
 const [modalTab, setModalTab] = useState<'profile' | 'economy'>('profile');

 if (!isOpen || !nation) return null;

 const isMyNation = user && nation.ownerId === user.id;
 const isAtWarWithMe = myNation && (nation.activeWars || []).some((w) => w.withNationId === myNation.id);

 return (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto animate-fadeIn">
   <div
    className="w-full max-w-4xl my-auto bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden relative text-slate-900 max-h-[90vh] flex flex-col"
   >
    {/* Compact Sovereign Header with Subtle Flag Accent & Clean Typographic Hierarchy */}
    <div
     className="relative w-full min-h-[96px] sm:min-h-[104px] flex items-center px-4 sm:px-6 py-4 shrink-0 overflow-hidden border-b border-slate-200"
     style={{ backgroundColor: nation.flagColor || '#4f46e5' }}
    >
     {/* Subtle Emblem / Texture watermark in background without overpowering */}
     {nation.emblemIcon && (nation.emblemIcon.startsWith('data:image') || nation.emblemIcon.startsWith('http')) ? (
      <img
       src={nation.emblemIcon}
       alt=""
       aria-hidden="true"
       className="absolute right-0 top-0 h-full w-auto object-cover opacity-15 pointer-events-none mix-blend-overlay"
      />
     ) : (
      <div className="absolute right-4 -bottom-4 pointer-events-none opacity-15">
       {renderEmblemIcon(nation.emblemIcon, { className: 'w-32 h-32 text-white' })}
      </div>
     )}
     
     {/* Gradient overlay for readability and strategic texture */}
     <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/70 to-slate-950/40 pointer-events-none" />

     {/* Close button top right - clean circle with subtle dark glass */}
     <button
      id="btn-close-nation-modal-x"
      type="button"
      onClick={onClose}
      aria-label="关闭面板"
      className="absolute top-3 right-3 sm:top-3.5 sm:right-4 w-7 h-7 rounded-full bg-slate-900/60 hover:bg-slate-900/90 text-white/80 hover:text-white flex items-center justify-center transition-all z-20 cursor-pointer border border-white/10 active:scale-95"
     >
      <X className="w-4 h-4" />
     </button>

     {/* Sovereign Title and Primary Identity Hierarchy */}
     <div className="relative z-10 text-white flex items-center justify-between w-full pr-8">
      <div className="min-w-0">
       {/* Row 1: Section Sub-label + War/Peace State Badge */}
       <div className="flex items-center gap-2 mb-1">
        <span className="text-[11px] font-bold text-slate-300 tracking-wider">
         国家主权公报
        </span>
        {isAtWarWithMe ? (
         <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-600/90 text-white border border-rose-400/40 flex items-center gap-1">
          <StrategicWarfareIcon size={11} /> 交战状态
         </span>
        ) : (
         <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
          <StrategicTreatyIcon size={11} /> 和平邦交
         </span>
        )}
       </div>

       {/* Row 2: Sovereign Nation Name (Level 1 Highest Visual Hierarchy) */}
       <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white truncate leading-tight">
        {nation.name}
       </h2>

       {/* Row 3: Ruler & Capital Inline Summary */}
       <div className="text-[11px] text-slate-300 mt-1 flex items-center gap-2 flex-wrap">
        <span className="flex items-center gap-1">
         <TikTokIcon className="w-3 h-3 text-slate-200" />
         <strong className="text-white font-semibold">{nation.ownerDouyinName || nation.ownerUsername}</strong>
        </span>
        <span className="text-slate-500">·</span>
        <span>法定首都：<strong className="text-white font-semibold">{nation.capital}</strong></span>
       </div>
      </div>
     </div>
    </div>

    {/* Modal Navigation Tabs - Strategy Game Tabbar with Underline Indicator */}
    <div className="flex items-center px-4 sm:px-6 border-b border-slate-200 bg-slate-100/70 shrink-0 gap-6">
     <button
      type="button"
      onClick={() => setModalTab('profile')}
      className={`relative py-2.5 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
       modalTab === 'profile'
        ? 'text-indigo-700'
        : 'text-slate-500 hover:text-slate-800'
      }`}
     >
      <Landmark className={`w-3.5 h-3.5 ${modalTab === 'profile' ? 'text-indigo-600' : 'text-slate-400'}`} />
      <span>政体与概况</span>
      {modalTab === 'profile' && (
       <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-indigo-600 rounded-t-sm" />
      )}
     </button>
     <button
      type="button"
      onClick={() => setModalTab('economy')}
      className={`relative py-2.5 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
       modalTab === 'economy'
        ? 'text-amber-700'
        : 'text-slate-500 hover:text-slate-800'
      }`}
     >
      <CivilianFactoryPlantIcon size={14} className={modalTab === 'economy' ? 'text-amber-600' : 'text-slate-400'} />
      <span>经济与国库</span>
      {modalTab === 'economy' && (
       <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-amber-600 rounded-t-sm" />
      )}
     </button>
    </div>

    {/* Scrollable Body */}
    <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
     {modalTab === 'economy' ? (
      <NationalEconomyDashboard
       nation={nation}
       isOwner={isMyNation}
       onUpdateNation={onUpdateNation}
       showToast={showToast}
      />
     ) : (
      <>
     {/* Main Regime & Political Baseline Grid */}
     <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
      <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
       <span className="text-[11px] text-slate-500 flex items-center gap-1 mb-0.5 font-medium">
        <Landmark className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
        政体形式
       </span>
       <span className="font-bold text-slate-900 text-xs sm:text-sm block truncate">{nation.regime}</span>
      </div>

      <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
       <span className="text-[11px] text-slate-500 flex items-center gap-1 mb-0.5 font-medium">
        <Scale className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
        主流意识形态
       </span>
       <span className="font-bold text-slate-900 text-xs sm:text-sm block truncate">{nation.ideology}</span>
      </div>

      <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
       <span className="text-[11px] text-slate-500 flex items-center gap-1 mb-0.5 font-medium">
        <Coins className="w-3.5 h-3.5 text-amber-500 shrink-0" />
        国家法定货币
       </span>
       <span className="font-bold text-slate-900 text-xs sm:text-sm block truncate">{nation.currency}</span>
      </div>

      <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
       <span className="text-[11px] text-slate-500 flex items-center gap-1 mb-0.5 font-medium">
        <Languages className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
        官方语言
       </span>
       <span className="font-bold text-slate-900 text-xs sm:text-sm block truncate">{nation.language}</span>
      </div>
     </div>

     {/* Territory & Population & Capital */}
     <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
      <div className="p-2.5 bg-slate-50 rounded border border-slate-200 flex items-center gap-2.5">
       <div className="w-8 h-8 rounded bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0 border border-indigo-100">
        <StrategicTerritoryIcon size={16} />
       </div>
       <div className="min-w-0">
        <span className="text-[11px] text-slate-500 block font-medium leading-none">疆域领土</span>
        <span className="font-bold text-slate-900 text-xs mt-1 block truncate">{nation.territory}</span>
       </div>
      </div>

      <div className="p-2.5 bg-slate-50 rounded border border-slate-200 flex items-center gap-2.5">
       <div className="w-8 h-8 rounded bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0 border border-indigo-100">
        <StrategicManpowerIcon size={16} />
       </div>
       <div className="min-w-0">
        <span className="text-[11px] text-slate-500 block font-medium leading-none">国民总人口</span>
        <span className="font-bold text-slate-900 text-xs mt-1 block truncate">{nation.population}</span>
       </div>
      </div>

      <div className="p-2.5 bg-slate-50 rounded border border-slate-200 flex items-center gap-2.5">
       <div className="w-8 h-8 rounded bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0 border border-indigo-100">
        <MapPin className="w-4 h-4 text-indigo-600" />
       </div>
       <div className="min-w-0">
        <span className="text-[11px] text-slate-500 block font-medium leading-none">法定行政首都</span>
        <span className="font-bold text-slate-900 text-xs mt-1 block truncate">{nation.capital}</span>
       </div>
      </div>
     </div>

     {/* Ruler & Social Accounts Bar */}
     <div className="p-2.5 bg-slate-50 rounded border border-slate-200 flex items-center justify-between gap-2.5">
      <div className="flex items-center gap-2.5">
       <div className="w-7 h-7 rounded bg-indigo-500/10 text-indigo-700 border border-indigo-500/20 flex items-center justify-center font-bold text-xs shrink-0">
        <TikTokIcon className="w-4 h-4 text-slate-900" />
       </div>
       <div>
        <span className="text-[10px] text-slate-500 block font-medium leading-none">抖音缔造者</span>
        <span className="font-bold text-slate-900 text-xs leading-tight mt-0.5 block">{nation.ownerDouyinName || nation.ownerUsername}</span>
       </div>
      </div>
     </div>

     {/* Lore / Description */}
     {nation.description && (
      <div className="space-y-1">
       <h4 className="text-[11px] uppercase tracking-wider text-slate-500 font-bold flex items-center gap-1">
        <BookOpen className="w-3.5 h-3.5 text-slate-400" /> 历史纪要与背景介绍
       </h4>
       <div className="p-3 bg-slate-50 rounded border border-slate-200 text-slate-700 text-xs leading-relaxed whitespace-pre-wrap">
        {nation.description}
       </div>
      </div>
     )}

     {/* Military Industry Summary - Refined Deep Slate Command Theme */}
     {(() => {
      const totalMil = getTotalMilitaryFactories(nation);
      const totalCiv = getTotalCivilianFactories(nation);
      const dailyCap = totalMil * CAPACITY_PER_MILITARY_FACTORY_24H;
      const lines = nation.militaryIndustry?.productionLines || [];

      return (
       <div className="p-3.5 bg-[#0f172a] text-white rounded border border-slate-700/80 shadow-2xs space-y-3">
        {/* Header: Title Left + 24h Capacity Right on same row */}
        <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-800">
         <div className="flex items-center gap-1.5">
          <MilitaryFactoryPlantIcon size={16} className="text-amber-400" />
          <span className="text-xs font-bold text-slate-100">国防军事工业概况</span>
         </div>
         <div className="text-[11px] text-slate-300">
          24h 日总军用产能：<strong className="text-amber-400 font-bold font-mono">{dailyCap.toLocaleString()} 点</strong>
         </div>
        </div>

        {/* 3 Core Metric Blocks: High density & crisp numeric hierarchy */}
        <div className="grid grid-cols-3 gap-2 text-center">
         <div className="p-2 bg-slate-900/90 rounded border border-slate-800">
          <span className="text-slate-400 block text-[10px] leading-tight">军事实力</span>
          <span className="text-sm sm:text-base font-black text-amber-400 mt-1 block font-mono">
           {totalMil} <span className="text-[11px] font-normal text-slate-400">座</span>
          </span>
         </div>
         <div className="p-2 bg-slate-900/90 rounded border border-slate-800">
          <span className="text-slate-400 block text-[10px] leading-tight">民用工</span>
          <span className="text-sm sm:text-base font-black text-sky-400 mt-1 block font-mono">
           {totalCiv} <span className="text-[11px] font-normal text-slate-400">座</span>
          </span>
         </div>
         <div className="p-2 bg-slate-900/90 rounded border border-slate-800">
          <span className="text-slate-400 block text-[10px] leading-tight">运转生产线</span>
          <span className="text-sm sm:text-base font-black text-emerald-400 mt-1 block font-mono">
           {lines.length} <span className="text-[11px] font-normal text-slate-400">条</span>
          </span>
         </div>
        </div>

        {/* Production lines table list */}
        {lines.length > 0 && (
         <div className="space-y-1.5 pt-1">
          <span className="text-[11px] text-slate-400 block">主要生产线日产速率：</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
           {lines.slice(0, 4).map((l, idx) => (
            <div key={idx} className="px-2.5 py-1.5 bg-slate-900/80 rounded border border-slate-800 flex items-center justify-between gap-2">
             <span className="truncate font-medium text-slate-200 text-xs flex items-center gap-1.5">
              {renderEquipmentTacticalIcon(l.category, { size: 13, className: 'text-amber-400 shrink-0' })}
              <span className="truncate">{l.equipmentName}</span>
             </span>
             <span className="text-emerald-400 font-bold font-mono text-xs whitespace-nowrap">
              +{l.dailyOutput.toLocaleString()} /天
             </span>
            </div>
           ))}
          </div>
         </div>
        )}
       </div>
      );
     })()}

     {/* National Surrender & Capitulation Tendency Engine */}
     <SurrenderStatusCard
      nation={nation}
      showCapitulateAction={isMyNation && (nation.activeWars || []).length > 0 && !nation.isCapitulated}
      onCapitulate={async (n) => {
       if (!window.confirm(`确定要宣布【${n.name}】无条件投降并签署停火公报吗？`)) return;
       try {
        const res = await fetch('/api/diplomacy/capitulate', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ targetNationId: n.id }),
        });
        if (res.ok) {
         const data = await res.json();
         if (data.nation && onUpdateNation) {
          onUpdateNation(data.nation);
         }
         showToast?.(`【${n.name}】已正式宣告停战投降！`);
        }
       } catch (e) {
        console.error(e);
       }
      }}
     />

     {/* Wars & Treaties section */}
     <div className="space-y-3 mb-2">
      {/* Active Wars */}
      <div className="p-3 bg-white border border-rose-200 rounded shadow-2xs">
       <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-rose-600 flex items-center gap-1.5">
         <StrategicWarfareIcon size={14} />
         当前交战战争 ({nation.activeWars?.length || 0})
        </span>
       </div>

       {(nation.activeWars || []).length === 0 ? (
        <p className="text-xs text-slate-500">当前没有处于交战中的战事，国内处于和平时期。</p>
       ) : (
        <div className="space-y-1.5">
         {(nation.activeWars || []).map((w, idx) => (
          <div
           key={'war-item-' + idx}
           className="p-2.5 bg-rose-50/70 border border-rose-200/80 rounded flex items-center justify-between gap-2"
          >
           <div className="min-w-0">
            <div className="font-bold text-xs text-rose-950 flex items-center gap-1.5 truncate">
             <StrategicWarfareIcon size={13} className="text-rose-600 shrink-0" />
             <span>对【{w.withNationName}】特别军事行动 / 全面战争</span>
            </div>
            <div className="text-[11px] text-rose-700/80 mt-0.5">
             开战时间: {new Date(w.declaredAt).toLocaleDateString()}
            </div>
           </div>
           <span className="px-2 py-0.5 bg-rose-200/80 text-rose-800 rounded font-bold text-[11px] whitespace-nowrap">
            交战中
           </span>
          </div>
         ))}
        </div>
       )}
      </div>

      {/* Active Treaties */}
      <div className="p-3 bg-white border border-slate-200 rounded shadow-2xs">
       <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
         <StrategicTreatyIcon size={14} className="text-indigo-600" />
         已签署国际条约与盟约 ({nation.activeTreaties?.length || 0})
        </span>
       </div>

       {(nation.activeTreaties || []).length === 0 ? (
        <p className="text-xs text-slate-500">尚未与任何国家缔结外交或互保条约。</p>
       ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
         {(nation.activeTreaties || []).map((t, idx) => {
          const isMyTreaty = myNation && (t.withNationId === myNation.id || nation.id === myNation.id);
          return (
           <div
            key={'treaty-item-' + idx}
            className="p-2.5 bg-slate-50 border border-slate-200 rounded flex flex-col justify-between space-y-1.5"
           >
            <div className="flex items-start justify-between gap-2">
             <div className="min-w-0">
              <div className="font-bold text-xs text-slate-900 truncate">
               {t.type === 'peace' && '和平互不侵犯条约'}
               {t.type === 'mutual_defense' && '共同防御互保同盟'}
               {t.type === 'military_access' && '军事走廊过境权'}
               {t.type === 'armistice' && '停战协定'}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">签约国: {t.withNationName}</div>
             </div>
             <span className="px-1.5 py-0.2 bg-indigo-50 text-indigo-700 text-[10px] font-semibold rounded border border-indigo-200/60 whitespace-nowrap">
              生效中
             </span>
            </div>

            {isMyTreaty && onTerminateTreaty && (
             <div className="pt-1.5 border-t border-slate-200/60 flex justify-end">
              <button
               type="button"
               onClick={() => onTerminateTreaty(t.id, t.withNationName)}
               className="text-[11px] text-rose-600 hover:text-rose-800 font-semibold cursor-pointer"
              >
               废除此条约
              </button>
             </div>
            )}
           </div>
          );
         })}
        </div>
       )}
      </div>
     </div>
    </>
   )}
  </div>

    {/* Diplomatic Command Action Suite */}
    <div id="nation-modal-footer" className="p-3 sm:p-4 border-t border-slate-200 bg-slate-50/90 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
     {/* Left: Administrative actions (My Nation / Admin) */}
     <div className="flex items-center gap-2">
      {isMyNation && (
       <>
        <button
         id="btn-edit-nation-profile"
         type="button"
         onClick={() => {
          onClose();
          onEdit(nation);
         }}
         className="h-8 px-2.5 bg-white hover:bg-slate-100 active:bg-slate-200 text-slate-700 font-medium text-xs rounded border border-slate-300 shadow-2xs transition-all inline-flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap active:translate-y-px focus-visible:ring-1 focus-visible:ring-slate-400 focus-visible:outline-none"
        >
         <Edit3 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
         <span>编辑国家</span>
        </button>
        <button
         id="btn-delete-nation-profile"
         type="button"
         onClick={() => {
          onClose();
          onDelete(nation);
         }}
         className="h-8 px-2.5 bg-white hover:bg-rose-50 active:bg-rose-100 text-rose-700 font-medium text-xs rounded border border-rose-200 shadow-2xs transition-all inline-flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap active:translate-y-px focus-visible:ring-1 focus-visible:ring-rose-400 focus-visible:outline-none"
        >
         <Trash2 className="w-3.5 h-3.5 text-rose-500 shrink-0" />
         <span>注销国家</span>
        </button>
       </>
      )}
      {isAdmin && !isMyNation && (
       <button
        id="btn-admin-delete-nation"
        type="button"
        onClick={() => {
         onClose();
         onDelete(nation);
        }}
        className="h-8 px-2.5 bg-white hover:bg-rose-50 active:bg-rose-100 text-rose-700 font-medium text-xs rounded border border-rose-200 shadow-2xs transition-all inline-flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap active:translate-y-px focus-visible:ring-1 focus-visible:ring-rose-400 focus-visible:outline-none"
       >
        <Trash2 className="w-3.5 h-3.5 text-rose-500 shrink-0" />
        <span>管理员注销</span>
       </button>
      )}
     </div>

     {/* Right: Unified Foreign Affairs Command Panel */}
     <div className="flex flex-col gap-1.5 sm:ml-auto">
      {!isMyNation ? (
       <div className="p-1.5 bg-slate-200/50 rounded border border-slate-300/80 shadow-2xs flex flex-col gap-1.5">
        {/* Row 1: Regular & Special Geopolitical Actions */}
        <div className="grid grid-cols-2 gap-1.5">
         {onOpenAlliance && (
          <button
           id="btn-open-embassy-lendlease"
           type="button"
           onClick={() => {
            onClose();
            onOpenAlliance(nation);
           }}
           className="h-8 px-2.5 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 font-medium text-xs rounded border border-slate-300 shadow-2xs transition-all inline-flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap active:translate-y-px focus-visible:ring-1 focus-visible:ring-slate-400 focus-visible:outline-none"
          >
           <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
           <span>使馆/租借法案</span>
          </button>
         )}
         {onOpenDispute && (
          <button
           id="btn-open-territorial-dispute"
           type="button"
           onClick={() => {
            onClose();
            onOpenDispute(nation);
           }}
           className="h-8 px-2.5 bg-white hover:bg-amber-50/50 active:bg-amber-100/50 text-slate-800 font-medium text-xs rounded border border-amber-300/90 shadow-2xs transition-all inline-flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap active:translate-y-px focus-visible:ring-1 focus-visible:ring-amber-400 focus-visible:outline-none"
          >
           <Swords className="w-3.5 h-3.5 text-amber-700 shrink-0" />
           <span>领土争端/沙盘推演</span>
          </button>
         )}
        </div>

        {/* Row 2: Standard Treaty, War Ultimatum (Sole Danger Primary), and Dismiss */}
        <div className="grid grid-cols-3 gap-1.5">
         <button
          id="btn-open-diplomacy-peace"
          type="button"
          onClick={() => {
           onClose();
           onOpenDiplomacy(nation, 'peace');
          }}
          className="h-8 px-2 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 font-medium text-xs rounded border border-slate-300 shadow-2xs transition-all inline-flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap active:translate-y-px focus-visible:ring-1 focus-visible:ring-slate-400 focus-visible:outline-none"
         >
          <StrategicTreatyIcon size={13} className="text-slate-600 shrink-0" />
          <span>递交国书</span>
         </button>
         <button
          id="btn-open-diplomacy-war"
          type="button"
          onClick={() => {
           onClose();
           onOpenDiplomacy(nation, 'war');
          }}
          className="h-8 px-2 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-medium text-xs rounded border border-rose-700 shadow-2xs transition-all inline-flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap active:translate-y-px focus-visible:ring-1 focus-visible:ring-rose-500 focus-visible:outline-none"
         >
          <StrategicWarfareIcon size={13} className="text-white shrink-0" />
          <span>宣战通牒</span>
         </button>
         <button
          id="btn-close-nation-modal"
          type="button"
          onClick={onClose}
          className="h-8 px-2 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-600 font-medium text-xs rounded border border-slate-300/80 shadow-2xs transition-all inline-flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap active:translate-y-px focus-visible:ring-1 focus-visible:ring-slate-400 focus-visible:outline-none"
         >
          <X className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span>关闭</span>
         </button>
        </div>
       </div>
      ) : (
       <button
        id="btn-close-nation-modal"
        type="button"
        onClick={onClose}
        className="h-8 px-4 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-600 font-medium text-xs rounded border border-slate-300/80 shadow-2xs transition-all inline-flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap active:translate-y-px focus-visible:ring-1 focus-visible:ring-slate-400 focus-visible:outline-none"
       >
        <X className="w-3.5 h-3.5 text-slate-500 shrink-0" />
        <span>关闭</span>
       </button>
      )}
     </div>
    </div>
   </div>
  </div>
 );
};
