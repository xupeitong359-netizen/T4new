import { TikTokIcon } from './TikTokIcon';
import React, { useEffect, useState, useRef } from 'react';
import { AnimatePresence } from 'motion/react';
import { Crown, Globe, Bell, LogOut, ShieldAlert, ChevronDown, LogIn, Heart, Microscope, Clock3, Bug, ShieldCheck, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { NotificationPopover } from './NotificationPopover';
import { remoteState } from '../services/remoteState';

const GAME_DAYS_PER_REAL_DAY = 365;
const MS_PER_HOUR = 60 * 60 * 1000;

function formatWorldTime(realStartMs: number, nowMs: number) {
 const elapsedGameHours = Math.max(0, Math.floor(((nowMs - realStartMs) / MS_PER_HOUR) * GAME_DAYS_PER_REAL_DAY));
 const gameYear = 1936 + Math.floor(elapsedGameHours / (365 * 24));
 const hourOfYear = elapsedGameHours % (365 * 24);
 const dayOfYear = Math.floor(hourOfYear / 24);
 const monthDays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
 let month = 0;
 let remainingDays = dayOfYear;
 while (remainingDays >= monthDays[month] && month < monthDays.length - 1) {
  remainingDays -= monthDays[month];
  month += 1;
 }
 return `${gameYear}/${month + 1}/${remainingDays + 1}`;
}

interface NavbarProps {
 activeTab: string;
 setActiveTab: (tab: any) => void;
 onOpenAuth: (mode?: 'login' | 'register') => void;
 onOpenCreateNation: () => void;
 onOpenConstruction?: () => void;
 onRefreshNations?: () => void;
 onOpenBugFeedback?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
 activeTab,
 setActiveTab,
 onOpenAuth,
 onOpenCreateNation: _onOpenCreateNation,
 onOpenConstruction,
 onRefreshNations,
 onOpenBugFeedback,
}) => {
 const { user, myNation, isAuthenticated, isAdmin, logout, toggleAdminRole, unreadNotifsCount } = useAuth();
 const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
 const [notificationPopoverOpen, setNotificationPopoverOpen] = useState(false);
 const [worldClockStart, setWorldClockStart] = useState<number | null>(null);
 const [now, setNow] = useState(() => Date.now());
 const dropdownRef = useRef<HTMLDivElement>(null);

 useEffect(() => {
  let active = true;
  void remoteState.readSection<number>('worldClockStartedAt', { fresh: true })
   .then((startedAt) => {
    if (active && typeof startedAt === 'number') setWorldClockStart(startedAt);
   })
   .catch((error) => console.warn('Shared campaign clock unavailable:', error));
  const timer = window.setInterval(() => setNow(Date.now()), 1000);
  return () => { active = false; window.clearInterval(timer); };
 }, []);

 // Close dropdown on outside click
 useEffect(() => {
  const handleOutsideClick = (e: MouseEvent) => {
   if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
    setProfileDropdownOpen(false);
   }
  };
  if (profileDropdownOpen) {
   document.addEventListener('mousedown', handleOutsideClick);
  }
  return () => {
   document.removeEventListener('mousedown', handleOutsideClick);
  };
 }, [profileDropdownOpen]);

 const isMapMode = activeTab === 'world_map';
 const isResearchMode = activeTab === 'research';

 const brandTitle = isMapMode ? '战略地图' : isResearchMode ? '国防科研' : 'T4预览';
 const displayName = user?.douyinName || user?.username || '领主';

 return (
  <header className="sticky top-0 z-40 w-full bg-white border-b border-slate-200/80 text-slate-900">
   <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-4">
    {/* Left: Brand Identity */}
    <div
     id="nav-brand-logo"
     onClick={() => setActiveTab('lobby')}
     className="flex items-center gap-2.5 cursor-pointer group select-none flex-shrink-0"
    >
     {/* Purple Circular Brand Icon */}
     <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs group-hover:bg-indigo-700 transition-colors">
      {isResearchMode ? (
       <Microscope className="w-4 h-4 text-indigo-100" />
      ) : (
       <Globe className="w-4 h-4 text-indigo-100" />
      )}
     </div>

     {/* Brand Name - Refined, subtle platform/module branding */}
     <div className="flex items-center gap-1.5">
      <span className="font-semibold text-xs sm:text-sm text-slate-600 group-hover:text-indigo-600 transition-colors tracking-tight">
       {brandTitle}
      </span>
     </div>
    </div>

    {/* Center: Subtle Campaign Clock (Desktop Only, quiet & minimalist) */}
    <div className="hidden lg:flex items-center justify-center pointer-events-none">
     <div className="flex items-center gap-1.5 px-3 py-1 text-slate-400">
      <Clock3 className="w-3.5 h-3.5 text-slate-400" />
      <time className="font-mono text-xs font-medium tracking-wider text-slate-600 tabular-nums">
       {worldClockStart ? formatWorldTime(worldClockStart, now) : '1936/1/1'}
      </time>
     </div>
    </div>

    {/* Right: Unified, Lightweight Action Zone */}
    <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 ml-auto relative">
     {/* Bug Feedback (Subtle Ghost Button) */}
     {onOpenBugFeedback && (
      <button
       type="button"
       onClick={onOpenBugFeedback}
       className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
       title="提交反馈"
      >
       <Bug className="w-3.5 h-3.5" />
       <span>反馈</span>
      </button>
     )}

     {/* Map Mode: Minimalist Construction Action */}
     {isMapMode && onOpenConstruction && (
      <button
       id="map-top-construction-btn"
       type="button"
       onClick={onOpenConstruction}
       className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
      >
       <span>筑造建设</span>
      </button>
     )}

     {/* Account & Notifications Interaction Area */}
     {isAuthenticated ? (
      <div className="flex items-center bg-slate-50/80 hover:bg-slate-100/80 border border-slate-200/80 rounded-full p-1 transition-colors">
       {/* 1. Notification Trigger Button */}
       <button
        id="notification-bell-trigger"
        type="button"
        onClick={() => {
         setNotificationPopoverOpen(!notificationPopoverOpen);
         if (profileDropdownOpen) setProfileDropdownOpen(false);
        }}
        className={`relative p-1.5 rounded-full text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer ${
         notificationPopoverOpen ? 'text-indigo-600 bg-white shadow-2xs' : ''
        }`}
        title="通知"
        aria-label="查看通知"
       >
        <Bell className="w-4 h-4" />
        {unreadNotifsCount > 0 && (
         <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
        )}
       </button>

       {/* Subtle separator */}
       <span className="w-px h-3.5 bg-slate-200 mx-0.5" />

       {/* 2. User / Lord Account Trigger with Minimal Badge */}
       <div className="relative" ref={dropdownRef}>
        <button
         type="button"
         onClick={() => {
          setProfileDropdownOpen(!profileDropdownOpen);
          if (notificationPopoverOpen) setNotificationPopoverOpen(false);
         }}
         className="flex items-center gap-1.5 pl-1 pr-2 py-0.5 rounded-full hover:bg-white/80 transition-colors cursor-pointer select-none"
        >
         {/* Minimalist Lord Emblem / Avatar Badge (Round placeholder) */}
         <div
          className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[11px] font-bold shadow-2xs shrink-0"
          style={{ backgroundColor: user?.avatarColor || '#6366f1' }}
         >
          {displayName.slice(0, 1).toUpperCase()}
         </div>

         {/* Compact Lord Name (hidden on extra small screens) */}
         <span className="text-xs font-medium text-slate-800 max-w-[90px] sm:max-w-[120px] truncate hidden xs:inline-block">
          {displayName}
         </span>

         {/* Small Downward Indicator */}
         <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${profileDropdownOpen ? 'rotate-180 text-slate-600' : ''}`} />
        </button>

        {/* Dropdown Menu (Refined white popover, low noise) */}
        {profileDropdownOpen && (
         <div className="absolute right-0 mt-2 w-52 p-1.5 bg-white border border-slate-200/90 rounded-xl shadow-lg z-50 text-slate-700 animate-fadeIn">
          {/* Header Info */}
          <div className="px-2.5 py-2 border-b border-slate-100 mb-1">
           <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-1.5 min-w-0">
             <TikTokIcon className="w-3.5 h-3.5 text-slate-900 shrink-0" />
             <p className="text-xs font-bold text-slate-900 truncate">{displayName}</p>
            </div>
            {user?.isLingyuBaby && (
             <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-pink-50 text-pink-600 font-medium flex items-center gap-0.5 shrink-0 border border-pink-100">
              <Heart className="w-2.5 h-2.5 fill-pink-500 text-pink-500" />
              <span>专属</span>
             </span>
            )}
           </div>
           {myNation && (
            <p className="text-[11px] text-slate-500 truncate mt-1">
             国家：<span className="text-slate-800 font-medium">{myNation.name}</span>
            </p>
           )}
          </div>

          {/* Menu Items */}
          <button
           type="button"
           onClick={() => {
            setActiveTab('my_nation');
            setProfileDropdownOpen(false);
           }}
           className="w-full px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-2 cursor-pointer text-left"
          >
           <Crown className="w-3.5 h-3.5 text-indigo-500" />
           <span>{myNation ? '我的国家' : '宣告建立国家'}</span>
          </button>

          {isAdmin && (
           <button
            type="button"
            onClick={() => {
             toggleAdminRole();
             setProfileDropdownOpen(false);
            }}
            className="w-full px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-amber-50 hover:text-amber-700 rounded-lg transition-colors flex items-center gap-2 cursor-pointer text-left"
           >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
            <span>{isAdmin ? '退出管理权限' : '开启管理员模式'}</span>
           </button>
          )}

          <div className="border-t border-slate-100 my-1" />

          <button
           type="button"
           onClick={() => {
            logout();
            setProfileDropdownOpen(false);
           }}
           className="w-full px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-2 cursor-pointer text-left"
          >
           <LogOut className="w-3.5 h-3.5" />
           <span>退出登录</span>
          </button>
         </div>
        )}
       </div>
      </div>
     ) : (
      /* Logged out state: Lightweight, restrained entry */
      <div className="flex items-center gap-1.5 sm:gap-2">
       <button
        type="button"
        onClick={() => onOpenAuth('login')}
        className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
       >
        登录
       </button>
       <button
        type="button"
        onClick={() => onOpenAuth('register')}
        className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg shadow-xs transition-colors cursor-pointer"
       >
        领主注册
       </button>
      </div>
     )}

     {/* Popover Component Anchored to Top Right */}
     <NotificationPopover
      isOpen={notificationPopoverOpen}
      onClose={() => setNotificationPopoverOpen(false)}
      onRefreshNations={onRefreshNations}
     />
    </div>
   </div>
  </header>
 );
};



