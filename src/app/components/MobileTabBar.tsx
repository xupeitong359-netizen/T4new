import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Globe, Microscope, ChevronDown, ChevronUp, ArrowLeft, Compass } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { isTodayUsed } from '../lib/mapAdjacency';

interface MobileTabBarProps {
 activeTab: 'lobby' | 'my_nation' | 'world_map' | 'admin' | 'research' | 'alliances';
 setActiveTab: (tab: 'lobby' | 'my_nation' | 'world_map' | 'admin' | 'research' | 'alliances') => void;
 onOpenCreateNation: () => void;
 onOpenAlliance: () => void;
}

export const MobileTabBar: React.FC<MobileTabBarProps> = ({
 activeTab,
 setActiveTab,
 onOpenCreateNation,
 onOpenAlliance,
}) => {
 const { myNation, isAdmin } = useAuth();
 const [isCollapsed, setIsCollapsed] = useState(false);
 const [isScrolling, setIsScrolling] = useState(false);
 const [isExpansionActive, setIsExpansionActive] = useState(false);
 const scrollTimerRef = useRef<number | null>(null);

 useEffect(() => {
  let animFrame: number;
  const handleState = (e: any) => {
   const active = Boolean(e.detail?.active);
   animFrame = window.requestAnimationFrame(() => {
    setIsExpansionActive(active);
   });
  };
  window.addEventListener('map-peaceful-expansion-state', handleState);
  return () => {
   window.removeEventListener('map-peaceful-expansion-state', handleState);
   if (animFrame) window.cancelAnimationFrame(animFrame);
  };
 }, []);

 // Automatically collapse into complete full-screen mode when switching to world_map or research
 useEffect(() => {
  if (activeTab === 'world_map' || activeTab === 'research') {
   setIsCollapsed(true);
  } else {
   setIsCollapsed(false);
  }
 }, [activeTab]);

 // Global scroll detection with debounce: shrinks button into a clean mini dot/arrow while scrolling, restores when stopped
 useEffect(() => {
  const handleScroll = () => {
   setIsScrolling(true);
   if (scrollTimerRef.current) {
    window.clearTimeout(scrollTimerRef.current);
   }
   scrollTimerRef.current = window.setTimeout(() => {
    setIsScrolling(false);
   }, 450);
  };

  window.addEventListener('scroll', handleScroll, { passive: true, capture: true });
  return () => {
   window.removeEventListener('scroll', handleScroll, { capture: true });
   if (scrollTimerRef.current) {
    window.clearTimeout(scrollTimerRef.current);
   }
  };
 }, []);

 const isResearchMode = activeTab === 'research';
 const hasPeacefulExpansion = activeTab === 'world_map' && Boolean(myNation) && !isTodayUsed(myNation?.lastPeaceExpansionAt, myNation?.peaceExpansionCount);

 return (
  <>
   {/* Complete Fullscreen Tactical Node (完全全屏模式：紧贴屏幕底部，地球与和平扩张按钮纵向紧凑排列) */}
   {isCollapsed && (
    <motion.div
     key="tactical-fullscreen-node"
     initial={false}
     animate={{
      bottom: '1rem',
      opacity: isScrolling ? 0.4 : 1,
      scale: isScrolling ? 0.8 : 1,
     }}
     transition={{
      type: 'spring',
      stiffness: 400,
      damping: 28,
      mass: 0.8,
     }}
     className="md:hidden fixed left-1/2 -translate-x-1/2 z-40 pointer-events-auto flex flex-col items-center gap-1.5"
    >
     {/* Tactical Node Button (地球/显微镜导航节点) */}
     <div className="relative flex items-center justify-center">
      {/* Subtle Coordinate Ticks & Contour Frame (滚动时淡出收起，静止时呈现精美战术罗盘感) */}
      <svg
       className={`absolute -inset-2.5 w-[calc(100%+20px)] h-[calc(100%+20px)] pointer-events-none select-none transition-opacity duration-300 ${
        isScrolling ? 'opacity-0' : isResearchMode ? 'text-sky-400/40 opacity-100' : 'text-indigo-400/40 opacity-100'
       }`}
       viewBox="0 0 68 68"
       fill="none"
      >
       {/* Tactical corner survey brackets */}
       <path d="M14 22V14H22" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
       <path d="M54 22V14H46" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
       <path d="M14 46V54H22" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
       <path d="M54 46V54H46" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />

       {/* Coordinate axis crosshair ticks */}
       <path d="M34 6V9M34 59V62M6 34H9M59 34H62" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />

       {/* Faint theater contour / perimeter circle */}
       <circle cx="34" cy="34" r="26" stroke="currentColor" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.4" />
      </svg>

      <button
       type="button"
       onClick={() => setIsCollapsed(false)}
       className={`group relative flex items-center justify-center rounded-2xl bg-slate-950/90 text-white border backdrop-blur-xl transition-all duration-300 active:scale-90 cursor-pointer ${
        isScrolling
         ? 'w-8 h-8 rounded-full border-slate-700/60 shadow-sm'
         : 'w-11 h-11 hover:scale-105 ' +
          (isResearchMode
           ? 'border-sky-400/50 hover:border-sky-400/80 shadow-[0_10px_25px_-4px_rgba(15,23,42,0.8),0_0_15px_rgba(56,189,248,0.25)]'
           : 'border-indigo-400/50 hover:border-indigo-400/80 shadow-[0_10px_25px_-4px_rgba(15,23,42,0.8),0_0_15px_rgba(99,102,241,0.2)]')
       }`}
       title="拉出导航任务栏"
       aria-label={isResearchMode ? '国防科研导航' : '战略地图导航'}
      >
       {/* Integrated Upper Reticle Notch Indicator (滚动时隐藏) */}
       {!isScrolling && (
        <div
         className={`absolute -top-2 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded-full bg-slate-900 border flex items-center justify-center shadow-xs transition-opacity duration-200 ${
          isResearchMode ? 'border-sky-400/60' : 'border-indigo-400/60'
         }`}
        >
         <ChevronUp
          className={`w-2.5 h-2.5 group-hover:-translate-y-0.5 transition-transform ${
           isResearchMode ? 'text-sky-300' : 'text-indigo-300'
          }`}
         />
        </div>
       )}

       {/* Center Icon: 滚动时呈现微型图标或返程箭头，停止滚动时恢复完整显微镜/地球 */}
       {isScrolling ? (
        <ArrowLeft className="w-3.5 h-3.5 text-slate-300" />
       ) : isResearchMode ? (
        <Microscope className="w-5 h-5 text-sky-400 group-hover:text-white transition-colors relative z-10 shrink-0 drop-shadow-[0_1px_6px_rgba(56,189,248,0.6)]" />
       ) : (
        <Globe className="w-5 h-5 text-indigo-300 group-hover:text-white transition-colors relative z-10 shrink-0 drop-shadow-[0_1px_6px_rgba(99,102,241,0.5)]" />
       )}
      </button>
     </div>

     {/* Tactical Peaceful Expansion Button (紧贴在地球下方，平滑展开与收起) */}
     <AnimatePresence>
      {hasPeacefulExpansion && !isScrolling && (
       <motion.div
        key="peaceful-expansion-float-btn"
        initial={{ opacity: 0, height: 0, scale: 0.8, y: -4 }}
        animate={{ opacity: 1, height: 'auto', scale: 1, y: 0 }}
        exit={{ opacity: 0, height: 0, scale: 0.8, y: -4 }}
        transition={{
         type: 'spring',
         stiffness: 420,
         damping: 26,
         mass: 0.75,
        }}
        className="whitespace-nowrap overflow-visible"
       >
        <button
         type="button"
         onClick={(e) => {
          e.stopPropagation();
          window.dispatchEvent(new CustomEvent('map-toggle-peaceful-expansion'));
         }}
         className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold shadow-xl backdrop-blur-xl transition-all active:scale-95 cursor-pointer ${
          isExpansionActive
           ? 'bg-emerald-600 border-emerald-400 text-white shadow-emerald-950/60 ring-2 ring-emerald-400/40'
           : 'bg-slate-950/90 hover:bg-slate-900 border-emerald-500/40 text-emerald-300 shadow-black/80'
         }`}
         title={isExpansionActive ? '点击取消和平扩张模式' : '进入和平扩张模式'}
        >
         <Compass className={`w-3.5 h-3.5 ${isExpansionActive ? 'animate-spin' : 'text-emerald-400'}`} />
         <span>{isExpansionActive ? '取消扩张' : '和平扩张'}</span>
        </button>
       </motion.div>
      )}
     </AnimatePresence>
    </motion.div>
   )}

   {/* Main Bottom Taskbar (底部任务栏 - 带有平滑收起与拉出动画) */}
   <div
    className={`md:hidden fixed bottom-0 left-0 right-0 z-50 overflow-hidden bg-white/95 backdrop-blur-2xl border-t border-slate-200/80 px-2 pt-1.5 pb-[calc(env(safe-area-inset-bottom,0px)+6px)] shadow-[0_-4px_24px_-8px_rgba(0,0,0,0.12)] transition-transform duration-300 ease-out ${
     isCollapsed ? 'translate-y-[calc(100%+24px)] pointer-events-none' : 'translate-y-0'
    }`}
   >
    {/* Quick Collapse Handle for Fullscreen Modes */}
    {(activeTab === 'world_map' || activeTab === 'research') && (
     <div className="flex justify-center -mt-1 pb-1">
      <button
       type="button"
       onClick={() => setIsCollapsed(true)}
       className="px-4 py-0.5 text-[10px] text-slate-400 hover:text-slate-600 font-bold flex items-center gap-1 cursor-pointer transition-colors"
       title="收起任务栏，进入完全全屏"
      >
       <span>收起全屏</span>
       <ChevronDown className="w-3 h-3" />
      </button>
     </div>
    )}

    <div className={`grid ${isAdmin ? 'grid-cols-6' : 'grid-cols-5'} items-center w-full max-w-md mx-auto relative`}>
     {/* Left Item: Lobby (国家 - 纯文字) */}
     <button
      id="mobile-tab-lobby"
      type="button"
      onClick={() => {
       setActiveTab('lobby');
       setIsCollapsed(false);
      }}
      className={`w-full min-w-0 min-h-11 py-1.5 text-center text-xs transition-all duration-200 cursor-pointer active:scale-95 flex flex-col items-center justify-center ${
       activeTab === 'lobby'
        ? 'text-indigo-600 font-extrabold'
        : 'text-slate-500 hover:text-slate-800 font-medium'
      }`}
     >
      <span className="leading-tight">国家</span>
      {activeTab === 'lobby' && (
       <span className="w-4 h-0.5 bg-indigo-600 rounded-full mt-1 animate-fadeIn" />
      )}
     </button>

     {/* Alliance: placed directly to the left of the world-map globe. */}
     <button
      id="mobile-tab-alliance"
      type="button"
      onClick={() => {
       setIsCollapsed(false);
       if (myNation) onOpenAlliance();
       else onOpenCreateNation();
      }}
      className="w-full min-w-0 min-h-11 py-1.5 text-center text-xs transition-all duration-200 cursor-pointer active:scale-95 flex flex-col items-center justify-center text-slate-500 hover:text-indigo-700 font-medium"
      title={myNation ? '申请' : '先创建国家再申请'}
      aria-label="申请"
     >
      <span className="leading-tight">申请</span>
     </button>

     {/* Center Item: World Map (世界地图 - 居中战术节点纯图标，无文字，点击收起任务栏进入完全全屏) */}
     <div className="px-1 flex items-center justify-center">
      <button
       id="mobile-tab-map"
       type="button"
       onClick={() => {
        if (activeTab === 'world_map') {
         setIsCollapsed(true);
        } else {
         setActiveTab('world_map');
         setIsCollapsed(true);
        }
       }}
       className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer active:scale-90 shadow-xs ${
        activeTab === 'world_map'
         ? 'bg-slate-950 text-indigo-400 ring-1.5 ring-indigo-500/50 shadow-md'
         : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
       }`}
       title="世界地图"
       aria-label="世界地图"
      >
       <Globe className="w-5 h-5 text-indigo-400" />
      </button>
     </div>

     {/* Right Item (Original Message Button Position): Government (政府 / 国家执政 - 放置在原消息按钮位置) */}
     <button
      id="mobile-tab-government"
      type="button"
      onClick={() => {
       setIsCollapsed(false);
       if (myNation) {
        setActiveTab('my_nation');
       } else {
        onOpenCreateNation();
       }
      }}
      className={`w-full min-w-0 min-h-11 py-1.5 text-center text-xs transition-all duration-200 cursor-pointer active:scale-95 flex flex-col items-center justify-center relative ${
       activeTab === 'my_nation'
        ? 'text-indigo-600 font-extrabold'
        : 'text-slate-500 hover:text-slate-800 font-medium'
      }`}
     >
      <span className="leading-tight">{myNation ? '政府' : '建国'}</span>
      {activeTab === 'my_nation' && (
       <span className="w-4 h-0.5 bg-indigo-600 rounded-full mt-1 animate-fadeIn" />
      )}
     </button>

     {/* Research Tab */}
     <button
      id="mobile-tab-research"
      type="button"
      onClick={() => {
       setIsCollapsed(false);
       setActiveTab('research');
      }}
      className={`w-full min-w-0 min-h-11 py-1.5 text-center text-xs transition-all duration-200 cursor-pointer active:scale-95 flex flex-col items-center justify-center relative ${
       activeTab === 'research'
        ? 'text-indigo-600 font-extrabold'
        : 'text-slate-500 hover:text-slate-800 font-medium'
      }`}
     >
      <span className="leading-tight">科研</span>
      {activeTab === 'research' && (
       <span className="w-4 h-0.5 bg-indigo-600 rounded-full mt-1 animate-fadeIn" />
      )}
     </button>

     {/* Right Item 2: Admin Tab (管理 - 纯文字，仅管理员) */}
     {isAdmin && (
      <button
       id="mobile-tab-admin"
       type="button"
       onClick={() => {
        setActiveTab('admin');
        setIsCollapsed(false);
       }}
       className={`w-full min-w-0 min-h-11 py-1.5 text-center text-xs transition-all duration-200 cursor-pointer active:scale-95 flex flex-col items-center justify-center ${
        activeTab === 'admin'
         ? 'text-rose-600 font-extrabold'
         : 'text-slate-500 hover:text-slate-800 font-medium'
       }`}
      >
       <span className="leading-tight">管理</span>
       {activeTab === 'admin' && (
        <span className="w-4 h-0.5 bg-rose-600 rounded-full mt-1 animate-fadeIn" />
       )}
      </button>
     )}
    </div>
   </div>
  </>
 );
};



