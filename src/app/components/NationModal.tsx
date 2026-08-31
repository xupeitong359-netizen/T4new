import { TikTokIcon } from './TikTokIcon';
import React, { useState, useMemo } from 'react';
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
 Layers,
 ChevronDown,
 ChevronUp,
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
 MilitaryArmorDivisionIcon,
} from '../lib/icons';
import { CAPACITY_PER_MILITARY_FACTORY_24H, getTotalMilitaryFactories } from '../lib/militaryIndustry';
import { getTotalCivilianFactories } from '../lib/economyEngine';
import { calculateNationalDemographics } from '../lib/manpowerEngine';
import { NationalEconomyDashboard } from './NationalEconomyDashboard';
import { getCountryTerritoryComponents } from '../lib/territoryComponents';

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

 const territoryAnalysis = useMemo(() => {
  if (!nation) return null;
  return getCountryTerritoryComponents(nation.id, { nations: [nation] });
 }, [nation]);

 if (!isOpen || !nation) return null;

 const isMyNation = user && nation.ownerId === user.id;
 const isAtWarWithMe = myNation && (nation.activeWars || []).some((w) => w.withNationId === myNation.id);

 return (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto animate-fadeIn">
   <div
    className="w-full max-w-4xl my-auto bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden relative text-slate-900 max-h-[90vh] flex flex-col"
   >
    <div className="flex-1 overflow-y-auto flex flex-col relative">
    {/* Compact Sovereign Header with Subtle Flag Accent & Clean Typographic Hierarchy */}
    <div
     className="relative w-full px-5 py-5 sm:px-6 sm:py-6 shrink-0 overflow-hidden border-b border-slate-800 bg-[#090d16]"
    >
     {/* Ghost Sovereign Emblem / Grand Strategy Watermark */}
     <div className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 pointer-events-none opacity-[0.06] text-white select-none">
      <svg width="130" height="130" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.2">
       <polygon points="50,6 90,26 90,74 50,94 10,74 10,26" />
       <circle cx="50" cy="50" r="26" strokeDasharray="3 3" />
       <polygon points="50,22 61,39 82,41 66,56 71,76 50,65 29,76 34,56 18,41 39,39" strokeWidth="0.8" />
       <line x1="50" y1="6" x2="50" y2="94" strokeWidth="0.6" strokeDasharray="2 2" />
       <line x1="10" y1="50" x2="90" y2="50" strokeWidth="0.6" strokeDasharray="2 2" />
      </svg>
     </div>

     {/* Very subtle background tint if flag color exists */}
     {nation.flagColor && (
      <div 
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{ backgroundColor: nation.flagColor }}
      />
     )}

     {/* Close button top right */}
     <button
      id="btn-close-nation-modal-x"
      type="button"
      onClick={onClose}
      aria-label="关闭面板"
      className="absolute top-3.5 right-3.5 w-8 h-8 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-all z-20 cursor-pointer"
     >
      <X className="w-4 h-4" />
     </button>

     {/* Sovereign Title and Primary Identity Hierarchy */}
     <div className="relative z-10 w-full pr-10 flex flex-col gap-1">
       {/* Game-like Status Indicator */}
       {(isAtWarWithMe || (!isAtWarWithMe && myNation)) && (
         <div className="flex items-center gap-1.5 mb-0.5">
          {isAtWarWithMe ? (
           <div className="inline-flex items-center gap-1.5 text-[11px] font-mono tracking-wider text-rose-400">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            <span>交战状态 · AT WAR</span>
           </div>
          ) : (
           <div className="inline-flex items-center gap-1.5 text-[11px] font-mono tracking-wider text-emerald-400/90">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>和平邦交 · PEACE</span>
           </div>
          )}
         </div>
       )}

       {/* Sovereign Nation Name */}
       <h2 className="text-2xl sm:text-[30px] font-extrabold tracking-tight text-white truncate leading-tight">
        {nation.name}
       </h2>

       {/* Regime · Ideology */}
       <div className="text-[13px] sm:text-sm flex items-center flex-wrap gap-1.5 mt-0.5 leading-snug">
         <span className="text-slate-100 font-semibold">{nation.regime || '未知政体'}</span>
         <span className="text-slate-600 font-bold">·</span>
         <span className="text-slate-400 font-normal">{nation.ideology || '中立主义'}</span>
       </div>

       {/* Subordinate info: Capital · Creator */}
       <div className="text-[12px] text-slate-400/80 flex items-center flex-wrap gap-2.5 mt-1">
        <span>{nation.capital ? nation.capital.replace(/[()]/g, ' · ') : '暂无首都'}</span>
        <span className="text-slate-700">·</span>
        <span className="flex items-center gap-1 text-slate-400/70">
         <TikTokIcon className="w-2.5 h-2.5 opacity-60" />
         {nation.ownerDouyinName || nation.ownerUsername}
        </span>
       </div>
     </div>
    </div>

    {/* Modal Navigation Tabs - Strategy Game Tabbar with Underline Indicator */}
    <div className="sticky top-0 z-30 flex items-center px-4 sm:px-6 border-b border-slate-200 bg-slate-50/95 backdrop-blur-sm shrink-0 gap-8">
     <button
      type="button"
      onClick={() => setModalTab('profile')}
      className={`relative py-3 text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
       modalTab === 'profile'
        ? 'text-indigo-700'
        : 'text-slate-500 hover:text-slate-800'
      }`}
     >
      <Landmark className={`w-4 h-4 ${modalTab === 'profile' ? 'text-indigo-600' : 'text-slate-400'}`} />
      <span>政治与概况</span>
      {modalTab === 'profile' && (
       <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-indigo-600 rounded-t-sm" />
      )}
     </button>
     <button
      type="button"
      onClick={() => setModalTab('economy')}
      className={`relative py-3 text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
       modalTab === 'economy'
        ? 'text-amber-700'
        : 'text-slate-500 hover:text-slate-800'
      }`}
     >
      <CivilianFactoryPlantIcon size={16} className={modalTab === 'economy' ? 'text-amber-600' : 'text-slate-400'} />
      <span>经济与国库</span>
      {modalTab === 'economy' && (
       <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-amber-600 rounded-t-sm" />
      )}
     </button>
    </div>

    {/* Scrollable Body */}
    <div className="p-4 sm:p-5 flex-1 space-y-4">
     {modalTab === 'economy' ? (
      <NationalEconomyDashboard
       nation={nation}
       isOwner={isMyNation}
       onUpdateNation={onUpdateNation}
       showToast={showToast}
      />
     ) : (
      <>
     {/* Core Information Section */}
     <div className="flex flex-col gap-6 sm:gap-8 pt-2 pb-4">
       
       {/* State & Politics Overview */}
       <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 border-b border-slate-100 pb-6 sm:pb-8">
         <div className="flex flex-col gap-1.5">
           <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold flex items-center gap-1.5">
             <Landmark className="w-3 h-3"/> 政体
           </span>
           <span className="text-base font-bold text-slate-800 leading-tight">{nation.regime || '-'}</span>
         </div>
         <div className="flex flex-col gap-1.5">
           <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold flex items-center gap-1.5">
             <Scale className="w-3 h-3"/> 意识形态
           </span>
           <span className="text-base font-bold text-slate-800 leading-tight">{nation.ideology || '-'}</span>
         </div>
         <div className="flex flex-col gap-1.5">
           <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold flex items-center gap-1.5">
             <Coins className="w-3 h-3"/> 法定货币
           </span>
           <span className="text-base font-bold text-slate-800 leading-tight">{nation.currency || '-'}</span>
         </div>
         <div className="flex flex-col gap-1.5">
           <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold flex items-center gap-1.5">
             <Languages className="w-3 h-3"/> 官方语言
           </span>
           <span className="text-base font-bold text-slate-800 leading-tight">{nation.language || '-'}</span>
         </div>
       </div>

       {/* Territory & Demographics */}
       <div className="flex flex-col gap-5 sm:gap-6">
         <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">国家疆域与人口分布</div>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
           
           {/* Territory Block */}
           <div className="md:col-span-2 flex flex-col gap-2.5">
             <div className="flex items-baseline gap-2">
               <span className="text-3xl font-black text-slate-800 tracking-tight leading-none">{territoryAnalysis?.stateCount || 0}</span>
               <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">个控制地区</span>
             </div>
             
             <div className="text-sm text-slate-600 leading-relaxed font-medium line-clamp-3">
               {nation.territory || '暂无详细领土记录'}
             </div>
           </div>

           {/* Demographics Block */}
           <div className="flex flex-col gap-6">
             <div className="flex flex-col gap-1.5">
               <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">总人口</span>
               {nation.population ? (
                 <div className="flex items-baseline gap-2">
                   <span className="text-2xl font-black text-slate-800 tracking-tight leading-none">{nation.population}</span>
                   <span className="text-[10px] font-bold text-emerald-600 tracking-wider bg-emerald-50 px-1.5 py-0.5 rounded">+0.0%</span>
                 </div>
               ) : (
                 <span className="text-sm font-bold text-slate-300 italic leading-none pt-1">No Data</span>
               )}
             </div>
             <div className="flex flex-col gap-1.5">
               <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold flex items-center gap-1.5">
                 <MapPin className="w-3 h-3"/> 行政首都
               </span>
               <span className="text-base font-bold text-slate-800 leading-tight">{nation.capital || '-'}</span>
             </div>
           </div>

         </div>
       </div>

     </div>





     {/* National Army & Land Forces Showcase - Strategy Game Roster Theme */}
     {(() => {
      const army = nation.army;
      const demo = calculateNationalDemographics(nation);
      const rawDivisions = army?.divisions || [];

      // If no divisions exist, construct a standard standing army preview based on nation's territory/capital
      const divisions = rawDivisions.length > 0 ? rawDivisions : [
       {
        id: 'default-1',
        name: `${nation.capital || '皇家'}第1禁卫装甲师`,
        type: '装甲师',
        corps: '第1中央集团军',
        provinceName: nation.capital || '主城防区',
        status: 'ready' as const,
        manpower: 8500,
        manpowerMax: 8500,
        equipmentRate: 100,
        organization: 100,
        supply: 100,
        experience: 3,
        template: { infantry: 4, artillery: 2, support: 2, armor: 4 },
        createdAt: nation.createdAt,
       },
       {
        id: 'default-2',
        name: '国防第3摩托化步兵师',
        type: '摩托化师',
        corps: '第1中央集团军',
        provinceName: '西部战区',
        status: 'ready' as const,
        manpower: 9000,
        manpowerMax: 9000,
        equipmentRate: 100,
        organization: 95,
        supply: 98,
        experience: 2,
        template: { infantry: 6, artillery: 2, support: 2, armor: 0 },
        createdAt: nation.createdAt,
       },
       {
        id: 'default-3',
        name: '边境守备第7步兵师',
        type: '步兵师',
        corps: '北方边防守备区',
        provinceName: '边境警戒区',
        status: 'garrison' as const,
        manpower: 10000,
        manpowerMax: 10000,
        equipmentRate: 98,
        organization: 90,
        supply: 95,
        experience: 1,
        template: { infantry: 9, artillery: 2, support: 1, armor: 0 },
        createdAt: nation.createdAt,
       },
      ];

      const totalDivisionsCount = rawDivisions.length > 0 ? rawDivisions.length : divisions.length;
      const activeDutyManpower = rawDivisions.length > 0 
       ? rawDivisions.reduce((sum, d) => sum + (d.manpower || 0), 0)
       : divisions.reduce((sum, d) => sum + (d.manpower || 0), 0);
      const reserveManpower = demo.availableReserve;

      return (
       <div className="p-3.5 bg-[#090d16] text-white rounded border border-slate-800 shadow-2xs space-y-3">
        {/* Header: Title Left + Manpower / Conscription Right */}
        <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-800">
         <div className="flex items-center gap-1.5">
          <MilitaryInfantryDivisionIcon size={16} className="text-amber-400" />
          <span className="text-xs font-bold text-slate-100">国防陆军现役编制</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-900 text-slate-400 border border-slate-800">
           {demo.activeLaw.name}
          </span>
         </div>
         <div className="text-[11px] text-slate-400">
          常备军总员额：<strong className="text-amber-400 font-bold font-mono">{activeDutyManpower.toLocaleString()} 人</strong>
         </div>
        </div>

        {/* 3 Core Metric Blocks: High density & crisp numeric hierarchy */}
        <div className="grid grid-cols-3 gap-2 text-center">
         <div className="p-2 bg-slate-900/90 rounded border border-slate-800">
          <span className="text-slate-400 block text-[10px] leading-tight">现役师团</span>
          <span className="text-sm sm:text-base font-black text-amber-400 mt-1 block font-mono">
           {totalDivisionsCount} <span className="text-[11px] font-normal text-slate-400">个师</span>
          </span>
         </div>
         <div className="p-2 bg-slate-900/90 rounded border border-slate-800">
          <span className="text-slate-400 block text-[10px] leading-tight">在役总兵力</span>
          <span className="text-sm sm:text-base font-black text-sky-400 mt-1 block font-mono">
           {activeDutyManpower.toLocaleString()} <span className="text-[11px] font-normal text-slate-400">人</span>
          </span>
         </div>
         <div className="p-2 bg-slate-900/90 rounded border border-slate-800">
          <span className="text-slate-400 block text-[10px] leading-tight">后备动员兵力</span>
          <span className="text-sm sm:text-base font-black text-emerald-400 mt-1 block font-mono">
           {reserveManpower > 10000 ? `${(reserveManpower / 10000).toFixed(1)}万` : reserveManpower.toLocaleString()} <span className="text-[11px] font-normal text-slate-400">人</span>
          </span>
         </div>
        </div>

        {/* Deployed Formations & Division Roster */}
        <div className="space-y-1.5 pt-0.5">
         <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span>部署序列与主力师团：</span>
          <span className="text-[10px] text-slate-500 font-mono">前 {Math.min(4, divisions.length)} 个战术编制</span>
         </div>
         <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {divisions.slice(0, 4).map((div) => {
           const isArmor = div.type.includes('装甲') || div.type.includes('坦克');
           const isMotorized = div.type.includes('摩托') || div.type.includes('机械');
           const statusText = div.status === 'training' ? '训练中' : div.status === 'fighting' ? '交战中' : div.status === 'garrison' ? '驻防' : '战备就绪';
           const statusColor = div.status === 'fighting' 
            ? 'text-rose-400 border-rose-500/30 bg-rose-950/40' 
            : div.status === 'training' 
            ? 'text-sky-300 border-sky-500/30 bg-sky-950/40' 
            : 'text-emerald-400 border-emerald-500/30 bg-emerald-950/40';

           return (
            <div key={div.id} className="px-2.5 py-1.5 bg-slate-900/80 rounded border border-slate-800 flex items-center justify-between gap-2">
             <div className="flex items-center gap-2 min-w-0">
              <div className="w-5 h-5 rounded bg-slate-800 flex items-center justify-center shrink-0 text-amber-400">
               {isArmor ? (
                <MilitaryArmorDivisionIcon size={13} />
               ) : isMotorized ? (
                <MilitaryArmorDivisionIcon size={13} className="text-sky-400" />
               ) : (
                <MilitaryInfantryDivisionIcon size={13} className="text-amber-400" />
               )}
              </div>
              <div className="min-w-0 flex flex-col">
               <span className="truncate font-semibold text-slate-200 text-xs leading-tight">
                {div.name}
               </span>
               <span className="text-[10px] text-slate-500 truncate mt-0.5">
                {div.provinceName || '防区'} · {div.type}
               </span>
              </div>
             </div>

             <div className="flex flex-col items-end shrink-0 gap-0.5">
              <span className={`px-1 py-0.2 rounded text-[9px] font-mono border ${statusColor}`}>
               {statusText}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
               {(div.manpower || 0).toLocaleString()} 人
              </span>
             </div>
            </div>
           );
          })}
         </div>
        </div>
       </div>
      );
     })()}

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
  </div>

    {/* Diplomatic Command Action Suite */}
    <div id="nation-modal-footer" className="shrink-0 z-40 px-6 py-4 border-t border-slate-200/60 bg-white flex flex-col sm:flex-row items-center justify-between gap-4">
     
     {isMyNation ? (
       <div className="w-full flex items-center justify-between sm:justify-end gap-3">
        <button
         id="btn-delete-nation-profile"
         type="button"
         disabled={(nation.activeWars || []).length > 0}
         onClick={() => {
          if ((nation.activeWars || []).length > 0) {
           alert('处于战争状态时无法解散国家！必须先达成和平停战协议或宣布投降。');
           return;
          }
          if (window.confirm('您确定要注销此国家吗？此操作不可撤销。')) {
            onClose();
            onDelete(nation);
          }
         }}
         className={`w-9 h-9 flex items-center justify-center rounded transition-colors ${
          (nation.activeWars || []).length > 0
           ? 'text-slate-300 cursor-not-allowed opacity-50'
           : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer active:scale-95'
         }`}
         title={(nation.activeWars || []).length > 0 ? '处于战争状态时无法解散国家' : '注销国家'}
        >
         <Trash2 className="w-4 h-4" />
        </button>
        
        <button
         id="btn-edit-nation-profile"
         type="button"
         onClick={() => {
          onClose();
          onEdit(nation);
         }}
         className="px-6 h-9 bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm rounded shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 cursor-pointer active:scale-95 whitespace-nowrap"
        >
         编辑国家概况
        </button>
       </div>
     ) : (
       <div className="w-full flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        
        {/* Admin Delete */}
        {isAdmin && !isMyNation ? (
         <button
          id="btn-admin-delete-nation"
          type="button"
          disabled={(nation.activeWars || []).length > 0}
          onClick={() => {
           if ((nation.activeWars || []).length > 0) {
            alert('该国当前处于战时交火状态，处于战争状态时无法解散国家！');
            return;
           }
           onClose();
           onDelete(nation);
          }}
          className={`h-9 px-3 font-medium text-sm rounded border transition-all inline-flex items-center justify-center gap-1.5 whitespace-nowrap ${
           (nation.activeWars || []).length > 0
            ? 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
            : 'bg-white hover:bg-rose-50 text-rose-600 border-rose-200 cursor-pointer active:scale-95'
          }`}
          title={(nation.activeWars || []).length > 0 ? '处于战争状态时无法解散国家' : '管理员注销'}
         >
          <Trash2 className="w-4 h-4 shrink-0" />
          <span>管理员注销</span>
         </button>
        ) : <div className="hidden sm:block"></div>}

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
         {/* Secondary Actions */}
         <div className="flex items-center gap-2">
          {onOpenAlliance && (
           <button
            onClick={() => { onClose(); onOpenAlliance(nation); }}
            className="px-3 h-9 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-sm rounded transition-all cursor-pointer whitespace-nowrap active:scale-95"
           >
            使馆/租借法案
           </button>
          )}
          {onOpenDispute && (
           <button
            onClick={() => { onClose(); onOpenDispute(nation); }}
            className="px-3 h-9 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-sm rounded transition-all cursor-pointer whitespace-nowrap active:scale-95"
           >
            领土争端
           </button>
          )}
           <button
            onClick={() => { onClose(); onOpenDiplomacy(nation, 'peace'); }}
            className="px-3 h-9 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-sm rounded transition-all cursor-pointer whitespace-nowrap active:scale-95"
           >
            递交国书
           </button>
         </div>
         
         {/* Danger Primary Action */}
         <button
          onClick={() => { onClose(); onOpenDiplomacy(nation, 'war'); }}
          className="px-5 h-9 bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-600 hover:text-white font-bold text-sm rounded transition-all cursor-pointer shadow-sm flex items-center justify-center gap-1.5 whitespace-nowrap active:scale-95"
         >
          <StrategicWarfareIcon size={14} className="shrink-0" />
          <span>宣战通牒</span>
         </button>
        </div>
       </div>
     )}
    </div>
   </div>
  </div>
 );
};
