import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
 Globe,
 Crown,
 Search,
 Swords,
 HeartHandshake,
 Landmark,
 Crosshair,
 ChevronRight,
 X,
 Building2,
 ShieldCheck,
 Compass,
 SlidersHorizontal,
 Sparkles,
 MapPin,
 Flame,
} from 'lucide-react';
import { Nation } from '../types';
import { renderEmblemIcon } from '../lib/icons';
import { TikTokIcon } from './TikTokIcon';
import { getTotalCivilianFactories } from '../lib/economyEngine';
import { getTotalMilitaryFactories } from '../lib/militaryIndustry';

interface GeopoliticalFactionsSidebarProps {
 isOpen: boolean;
 onClose: () => void;
 nations: Nation[];
 myNation?: Nation | null;
 onJumpToNation: (nation: Nation) => void;
 onViewNationDetail: (nation: Nation) => void;
 onOpenDiplomacy: (nation: Nation) => void;
}

type FilterCategory = 'all' | 'war' | 'treaties' | 'mine';

export const GeopoliticalFactionsSidebar: React.FC<GeopoliticalFactionsSidebarProps> = ({
 isOpen,
 onClose,
 nations,
 myNation,
 onJumpToNation,
 onViewNationDetail,
 onOpenDiplomacy,
}) => {
 const [searchTerm, setSearchTerm] = useState('');
 const [activeCategory, setActiveCategory] = useState<FilterCategory>('all');
 const [regimeFilter, setRegimeFilter] = useState('all');

 // Statistics calculation
 const totalNations = nations.length;
 const totalActiveWars = useMemo(() => {
  return Math.floor(
   nations.reduce((acc, n) => acc + (n.activeWars?.length || 0), 0) / 2
  );
 }, [nations]);

 const totalProvincesCount = useMemo(() => {
  return nations.reduce((acc, n) => acc + (n.provinces?.length || 0), 0);
 }, [nations]);

 // Filtered nations
 const filteredNations = useMemo(() => {
  return nations.filter((n) => {
   // 1. Text Search
   if (searchTerm.trim()) {
    const query = searchTerm.trim().toLowerCase();
    const nameMatch = (n.name || '').toLowerCase().includes(query);
    const capitalMatch = (n.capital || '').toLowerCase().includes(query);
    const ownerMatch = (n.ownerUsername || '').toLowerCase().includes(query);
    const douyinMatch = (n.ownerDouyinName || '').toLowerCase().includes(query);
    const territoryMatch = (n.territory || '').toLowerCase().includes(query);
    const regimeMatch = (n.regime || '').toLowerCase().includes(query);

    if (!nameMatch && !capitalMatch && !ownerMatch && !douyinMatch && !territoryMatch && !regimeMatch) {
     return false;
    }
   }

   // 2. Regime Filter
   if (regimeFilter !== 'all' && n.regime !== regimeFilter) {
    return false;
   }

   // 3. Category Filter
   if (activeCategory === 'war') {
    return (n.activeWars?.length || 0) > 0;
   }
   if (activeCategory === 'treaties') {
    return (n.activeTreaties?.length || 0) > 0;
   }
   if (activeCategory === 'mine') {
    return Boolean(myNation && n.id === myNation.id);
   }

   return true;
  });
 }, [nations, searchTerm, regimeFilter, activeCategory, myNation]);

 // Unique regimes for filter dropdown
 const uniqueRegimes = useMemo(() => {
  const set = new Set<string>();
  nations.forEach((n) => {
   if (n.regime) set.add(n.regime);
  });
  return Array.from(set);
 }, [nations]);

 return (
  <AnimatePresence>
   {isOpen && (
    <>
     {/* Subtle Mobile-Only Touch-To-Dismiss Backing (Zero background blur on desktop so map remains crisp) */}
     <motion.div
      key="factions-sidebar-mobile-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="sm:hidden absolute inset-0 z-40 bg-black/40"
     />

     {/* Tactical Geopolitical Factions Sidebar */}
     <motion.aside
      key="geopolitical-factions-sidebar"
      initial={{ x: '100%', opacity: 0.7 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{
       x: '100%',
       opacity: 0.6,
       transition: {
        duration: 0.25,
        ease: [0.32, 0, 0.67, 0],
       },
      }}
      transition={{
       type: 'spring',
       stiffness: 340,
       damping: 28,
       mass: 0.85,
      }}
      onClick={(e) => e.stopPropagation()}
      className="absolute top-0 right-0 bottom-0 z-40 w-[92vw] sm:w-96 md:w-[410px] max-w-[440px] bg-[#090d16]/95 text-slate-100 border-l border-slate-800/90 shadow-2xl backdrop-blur-2xl flex flex-col font-sans overflow-hidden"
      style={{
       boxShadow: `
        -15px 0 35px -5px rgba(0, 0, 0, 0.85),
        inset 1px 0 0 0 rgba(255, 255, 255, 0.08)
       `,
      }}
     >
      {/* Top Military Dossier Bar */}
      <div className="px-4 py-3.5 bg-gradient-to-b from-slate-900 via-slate-900/80 to-[#090d16] border-b border-slate-800 relative flex-shrink-0">
       <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
         <div className="w-8 h-8 rounded-lg bg-indigo-950/80 border border-indigo-500/30 flex items-center justify-center text-indigo-400 flex-shrink-0">
          <Globe className="w-4.5 h-4.5" />
         </div>
         <div className="min-w-0">
          <div className="flex items-center gap-1.5">
           <span className="text-[10px] font-mono tracking-widest text-indigo-400 uppercase font-semibold">
            GEOPOLITICAL LEDGER
           </span>
           <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <h3 className="text-sm sm:text-base font-black text-slate-100 tracking-tight truncate flex items-center gap-2">
           世界地缘势力清册
           <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-indigo-300 border border-slate-700">
            {totalNations} 方
           </span>
          </h3>
         </div>
        </div>

        <button
         type="button"
         onClick={onClose}
         className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 rounded-lg border border-transparent hover:border-slate-700 transition cursor-pointer flex-shrink-0"
         title="收起势力侧边栏"
        >
         <X className="w-4 h-4" />
        </button>
       </div>

       {/* Tactical Statistics Strip */}
       <div className="grid grid-cols-3 gap-2 mt-3 pt-2.5 border-t border-slate-800/80 text-center font-mono">
        <div className="bg-slate-900/70 border border-slate-800/60 rounded-md py-1 px-1.5">
         <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
          <Landmark className="w-3 h-3 text-indigo-400" />
          <span>列强政权</span>
         </div>
         <div className="text-xs font-bold text-slate-200 mt-0.5">{totalNations}</div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800/60 rounded-md py-1 px-1.5">
         <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
          <Swords className="w-3 h-3 text-rose-400" />
          <span>交战火线</span>
         </div>
         <div className={`text-xs font-bold mt-0.5 ${totalActiveWars > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
          {totalActiveWars} 处
         </div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800/60 rounded-md py-1 px-1.5">
         <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
          <MapPin className="w-3 h-3 text-amber-400" />
          <span>总辖省份</span>
         </div>
         <div className="text-xs font-bold text-amber-300 mt-0.5">{totalProvincesCount}</div>
        </div>
       </div>
      </div>

      {/* Search and Filter Section */}
      <div className="p-3 bg-slate-950/80 border-b border-slate-800/80 space-y-2 flex-shrink-0">
       {/* Search input */}
       <div className="relative">
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
        <input
         type="text"
         value={searchTerm}
         onChange={(e) => setSearchTerm(e.target.value)}
         placeholder="搜索国家、首都、疆域、领主、政体..."
         className="w-full pl-8 pr-7 py-1.5 bg-slate-900/90 border border-slate-700/80 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all font-sans"
        />
        {searchTerm && (
         <button
          type="button"
          onClick={() => setSearchTerm('')}
          className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-200 text-xs"
         >
          
         </button>
        )}
       </div>

       {/* Category Filter Pills & Regime Selector */}
       <div className="flex items-center justify-between gap-1.5">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
         <button
          type="button"
          onClick={() => setActiveCategory('all')}
          className={`px-2 py-1 rounded text-[11px] font-semibold transition whitespace-nowrap cursor-pointer ${
           activeCategory === 'all'
            ? 'bg-indigo-600 text-white shadow-xs'
            : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
         >
          全部 ({nations.length})
         </button>

         <button
          type="button"
          onClick={() => setActiveCategory('war')}
          className={`px-2 py-1 rounded text-[11px] font-semibold transition whitespace-nowrap cursor-pointer flex items-center gap-1 ${
           activeCategory === 'war'
            ? 'bg-rose-600 text-white shadow-xs'
            : 'bg-slate-900 text-slate-400 hover:text-rose-300 border border-slate-800'
          }`}
         >
          <Swords className="w-3 h-3 text-rose-400" />
          交战中
         </button>

         <button
          type="button"
          onClick={() => setActiveCategory('treaties')}
          className={`px-2 py-1 rounded text-[11px] font-semibold transition whitespace-nowrap cursor-pointer flex items-center gap-1 ${
           activeCategory === 'treaties'
            ? 'bg-emerald-600 text-white shadow-xs'
            : 'bg-slate-900 text-slate-400 hover:text-emerald-300 border border-slate-800'
          }`}
         >
          <HeartHandshake className="w-3 h-3 text-emerald-400" />
          已缔约
         </button>

         {myNation && (
          <button
           type="button"
           onClick={() => setActiveCategory('mine')}
           className={`px-2 py-1 rounded text-[11px] font-semibold transition whitespace-nowrap cursor-pointer flex items-center gap-1 ${
            activeCategory === 'mine'
             ? 'bg-amber-600 text-white shadow-xs'
             : 'bg-slate-900 text-slate-400 hover:text-amber-300 border border-slate-800'
           }`}
          >
           <Crown className="w-3 h-3 text-amber-400" />
           我的国家
          </button>
         )}
        </div>

        {uniqueRegimes.length > 0 && (
         <select
          value={regimeFilter}
          onChange={(e) => setRegimeFilter(e.target.value)}
          className="bg-slate-900 border border-slate-700 text-slate-300 text-[11px] rounded px-1.5 py-1 focus:outline-none focus:border-indigo-500 cursor-pointer max-w-[90px] truncate"
          title="按政体筛选"
         >
          <option value="all">所有政体</option>
          {uniqueRegimes.map((r) => (
           <option key={r} value={r}>
            {r}
           </option>
          ))}
         </select>
        )}
       </div>
      </div>

      {/* Factions Scrollable List */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
       {filteredNations.length === 0 ? (
        <div className="py-12 text-center text-slate-500 space-y-2">
         <Globe className="w-8 h-8 text-slate-700 mx-auto" />
         <p className="text-xs">未找到符合筛选条件的地缘国家</p>
         <button
          type="button"
          onClick={() => {
           setSearchTerm('');
           setActiveCategory('all');
           setRegimeFilter('all');
          }}
          className="text-xs text-indigo-400 hover:underline cursor-pointer"
         >
          重置所有筛选
         </button>
        </div>
       ) : (
        filteredNations.map((nation) => {
         const isMine = Boolean(myNation && nation.id === myNation.id);
         const isAtWar = (nation.activeWars || []).length > 0;
         const activeWars = nation.activeWars || [];
         const activeTreaties = nation.activeTreaties || [];
         const provincesCount = (nation.provinces || []).length;

         // Industrial power calculation
         const totalCivFactories = getTotalCivilianFactories(nation);
         const totalMilFactories = getTotalMilitaryFactories(nation);

         return (
          <div
           key={nation.id}
           className={`group relative bg-slate-900/80 hover:bg-slate-900 border rounded-xl transition-all duration-150 overflow-hidden ${
            isMine
             ? 'border-amber-500/50 hover:border-amber-400/80 shadow-xs'
             : isAtWar
             ? 'border-rose-500/40 hover:border-rose-400/80'
             : 'border-slate-800/80 hover:border-indigo-500/50'
           }`}
          >
           {/* Left Flag Accent Stripe */}
           <div
            className="absolute top-0 bottom-0 left-0 w-1.5"
            style={{ backgroundColor: nation.flagColor || '#6366f1' }}
           />

           <div className="pl-3.5 pr-3 py-2.5">
            {/* Top: Country Identity & Status */}
            <div className="flex items-start justify-between gap-2">
             <div className="min-w-0 flex items-center gap-2">
              {/* Emblem Avatar */}
              <div
               className="w-8 h-8 rounded-lg flex items-center justify-center text-white flex-shrink-0 shadow-sm border border-white/20"
               style={{ backgroundColor: nation.flagColor || '#6366f1' }}
              >
               {renderEmblemIcon(nation.emblemIcon, { className: 'w-4.5 h-4.5' })}
              </div>

              <div className="min-w-0">
               <div className="flex items-center gap-1.5">
                <h4 className="font-bold text-xs sm:text-sm text-slate-100 truncate group-hover:text-indigo-300 transition-colors">
                 {nation.name}
                </h4>
                {isMine && (
                 <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono font-bold">
                  领主本国
                 </span>
                )}
               </div>
               <p className="text-[11px] text-slate-400 truncate mt-0.5 flex items-center gap-1">
                <span>{nation.regime || '主权国家'}</span>
                {nation.ideology && (
                 <>
                  <span>·</span>
                  <span className="text-slate-400">{nation.ideology}</span>
                 </>
                )}
               </p>
              </div>
             </div>

             {/* Quick Jump / Locate Button */}
             <button
              type="button"
              onClick={() => onJumpToNation(nation)}
              className="p-1.5 bg-slate-800/80 hover:bg-indigo-600 text-slate-300 hover:text-white rounded-lg border border-slate-700 hover:border-indigo-400 transition cursor-pointer flex-shrink-0 flex items-center gap-1 text-[10px] font-semibold"
              title="在世界地图上对焦此国家视角"
             >
              <Crosshair className="w-3.5 h-3.5 text-indigo-400 group-hover:text-white" />
              <span className="hidden sm:inline">对焦</span>
             </button>
            </div>

            {/* Middle: Geographic & Strategic Metrics Grid */}
            <div className="mt-2 pt-2 border-t border-slate-800/60 grid grid-cols-3 gap-1.5 text-[10px] font-mono text-slate-300">
             <div className="bg-slate-950/60 px-1.5 py-1 rounded border border-slate-800/40">
              <span className="text-slate-400 block text-[9px]">首都</span>
              <span className="font-bold text-slate-200 truncate block">
               {nation.capital || '—'}
              </span>
             </div>

             <div className="bg-slate-950/60 px-1.5 py-1 rounded border border-slate-800/40">
              <span className="text-slate-400 block text-[9px]">领土省份</span>
              <span className="font-bold text-amber-300">
               {provincesCount > 0 ? `${provincesCount} 省` : nation.territory || '1 省'}
              </span>
             </div>

             <div className="bg-slate-950/60 px-1.5 py-1 rounded border border-slate-800/40">
              <span className="text-slate-400 block text-[9px]">工矿产能</span>
              <span className="font-bold text-indigo-300">
               {totalCivFactories + totalMilFactories} 座
              </span>
             </div>
            </div>

            {/* Leader & Douyin Row */}
            <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400">
             <div className="flex items-center gap-1.5 truncate">
              <span className="text-slate-400">领主:</span>
              <span className="font-medium text-slate-300 truncate">
               {nation.ownerUsername}
              </span>
              {nation.ownerDouyinName && (
               <span className="inline-flex items-center gap-0.5 text-slate-400">
                <TikTokIcon className="w-2.5 h-2.5 text-rose-400" />
                {nation.ownerDouyinName}
               </span>
              )}
             </div>
            </div>

            {/* War & Treaty Status Alerts */}
            {isAtWar && (
             <div className="mt-2 p-1.5 rounded bg-rose-950/40 border border-rose-800/60 text-rose-300 text-[10px] flex items-center gap-1.5">
              <Flame className="w-3 h-3 text-rose-400 flex-shrink-0 animate-pulse" />
              <span className="truncate">
               交战中: 与{' '}
               {activeWars.map((w) => w.withNationName).join(', ')}
              </span>
             </div>
            )}

            {!isAtWar && activeTreaties.length > 0 && (
             <div className="mt-2 p-1.5 rounded bg-emerald-950/30 border border-emerald-800/40 text-emerald-300 text-[10px] flex items-center gap-1.5">
              <ShieldCheck className="w-3 h-3 text-emerald-400 flex-shrink-0" />
              <span className="truncate">
               已签署 {activeTreaties.length} 项和平/同盟条约
              </span>
             </div>
            )}

            {/* Action Buttons Row */}
            <div className="mt-2.5 pt-2 border-t border-slate-800/70 flex items-center gap-1.5 justify-end">
             <button
              type="button"
              onClick={() => onViewNationDetail(nation)}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded text-[11px] font-semibold border border-slate-700 transition cursor-pointer"
             >
              国家档案
             </button>

             <button
              type="button"
              onClick={() => onOpenDiplomacy(nation)}
              className="px-2.5 py-1 bg-indigo-600/90 hover:bg-indigo-600 text-white rounded text-[11px] font-semibold border border-indigo-500 transition cursor-pointer flex items-center gap-1 shadow-xs"
             >
              <Swords className="w-3 h-3 text-indigo-200" />
              外交派遣
             </button>
            </div>
           </div>
          </div>
         );
        })
       )}
      </div>

      {/* Bottom Status bar */}
      <div className="px-4 py-2.5 bg-slate-950 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between flex-shrink-0 font-mono">
       <span>共 {filteredNations.length} / {nations.length} 方地缘势力</span>
       <span className="text-slate-400">点击「对焦」锁定地图坐标</span>
      </div>
     </motion.aside>
    </>
   )}
  </AnimatePresence>
 );
};
