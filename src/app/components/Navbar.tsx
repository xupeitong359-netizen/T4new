import React, { useState, useEffect, useRef } from 'react';
import {
  Crown,
  Bell,
  LogOut,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Heart,
  Bug,
  Clock3,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { NotificationPopover } from './NotificationPopover';
import { TikTokIcon } from './TikTokIcon';
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
  onOpenBugFeedback?: () => void;
  onRefreshNations?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenAuth,
  onOpenCreateNation,
  onOpenConstruction,
  onOpenBugFeedback,
  onRefreshNations,
}) => {
  const { user, isAuthenticated, logout, isAdmin, toggleAdminRole, myNation } = useAuth();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationPopoverOpen, setNotificationPopoverOpen] = useState(false);
  const [unreadNotifsCount, setUnreadNotifsCount] = useState(0);
  const [isTopCollapsed, setIsTopCollapsed] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [worldClockStart, setWorldClockStart] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let active = true;
    void remoteState
      .readSection<number>('worldClockStartedAt', { fresh: true })
      .then((startedAt) => {
        if (active && typeof startedAt === 'number') setWorldClockStart(startedAt);
      })
      .catch(() => {});
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  // Update notification count
  useEffect(() => {
    const handleUpdateCount = (e: any) => {
      if (typeof e.detail?.count === 'number') {
        setUnreadNotifsCount(e.detail.count);
      }
    };
    window.addEventListener('notification-count-update', handleUpdateCount);
    return () => window.removeEventListener('notification-count-update', handleUpdateCount);
  }, []);

  // Close dropdown on click outside
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

  const brandTitle = isMapMode ? '战略地图' : isResearchMode ? '国防科研' : 'T3.0测试版本';
  const displayName = user?.douyinName || user?.username || '领主';

  return (
    <>
      {/* Pull-Down Handle when Top Bar is Collapsed (顶部任务栏下拉展开微型把手) */}
      {isTopCollapsed && (
        <div className="fixed top-0 left-1/2 -translate-x-1/2 z-50 animate-fadeIn">
          <button
            type="button"
            onClick={() => setIsTopCollapsed(false)}
            className="px-5 py-1 bg-white/95 border border-t-0 border-slate-200/90 rounded-b-xl shadow-md flex items-center gap-1 text-[10px] font-bold text-slate-600 hover:text-slate-900 transition cursor-pointer backdrop-blur-md"
            title="下拉展开顶部栏"
          >
            <span>展开导航</span>
            <ChevronDown className="w-3 h-3 text-indigo-600" />
          </button>
        </div>
      )}

      {/* Main Top Header Navbar with Smooth Pull-Up / Collapse */}
      <header
        className={`sticky top-0 z-40 w-full bg-white border-b border-slate-200/80 text-slate-900 transition-transform duration-300 ease-out ${
          isTopCollapsed ? '-translate-y-full pointer-events-none' : 'translate-y-0'
        }`}
      >
        <div className="max-w-5xl mx-auto px-3 sm:px-5 h-12 flex items-center justify-between gap-3">
          {/* Left: Brand Identity */}
          <div
            id="nav-brand-logo"
            onClick={() => setActiveTab('lobby')}
            className="flex items-center gap-2 cursor-pointer group select-none flex-shrink-0"
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 shadow-2xs border border-slate-200/80 bg-white">
              <img
                src="/logo_v13.png"
                alt="V13 商标"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <span className="font-bold text-xs sm:text-sm text-slate-800 group-hover:text-indigo-600 transition-colors tracking-tight">
                {brandTitle}
              </span>
            </div>
          </div>

          {/* Center: Subtle Campaign Clock */}
          <div className="hidden md:flex items-center justify-center pointer-events-none">
            <div className="flex items-center gap-1.5 px-3 py-1 text-slate-400">
              <Clock3 className="w-3.5 h-3.5 text-slate-400" />
              <time className="font-mono text-xs font-medium tracking-wider text-slate-600 tabular-nums">
                {worldClockStart ? formatWorldTime(worldClockStart, now) : '1936/1/1'}
              </time>
            </div>
          </div>

          {/* Right: Independent Notification Bell and User Avatar Component */}
          <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0 ml-auto relative">
            {/* Bug Feedback */}
            {onOpenBugFeedback && (
              <button
                type="button"
                onClick={onOpenBugFeedback}
                className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 text-xs text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                title="提交反馈"
              >
                <Bug className="w-3.5 h-3.5" />
                <span>反馈</span>
              </button>
            )}

            {/* Map Construction Action */}
            {isMapMode && onOpenConstruction && (
              <button
                id="map-top-construction-btn"
                type="button"
                onClick={onOpenConstruction}
                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span>筑造建设</span>
              </button>
            )}

            {/* Notification Button (Independent Component) */}
            <button
              id="notification-bell-trigger"
              type="button"
              onClick={() => {
                setNotificationPopoverOpen(!notificationPopoverOpen);
                if (profileDropdownOpen) setProfileDropdownOpen(false);
              }}
              className={`relative w-8 h-8 rounded-full bg-white hover:bg-slate-100 border border-slate-200/90 text-slate-600 hover:text-indigo-600 flex items-center justify-center transition-all shadow-2xs cursor-pointer ${
                notificationPopoverOpen ? 'text-indigo-600 border-indigo-300 ring-2 ring-indigo-100 bg-indigo-50/40' : ''
              }`}
              title="消息通知"
              aria-label="查看消息通知"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifsCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white" />
              )}
            </button>

            {/* User Avatar Component (Independent Component, right next to notification button) */}
            {isAuthenticated ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  id="user-avatar-trigger-btn"
                  type="button"
                  onClick={() => {
                    setProfileDropdownOpen(!profileDropdownOpen);
                    if (notificationPopoverOpen) setNotificationPopoverOpen(false);
                  }}
                  className="w-8 h-8 rounded-full border border-slate-200/90 hover:border-indigo-400 hover:ring-2 hover:ring-indigo-100 transition-all flex items-center justify-center overflow-hidden cursor-pointer shadow-2xs select-none bg-slate-100"
                  title={displayName}
                  aria-label="个人中心"
                >
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                  ) : user?.avatarEmoji ? (
                    <div
                      className="w-full h-full flex items-center justify-center text-sm"
                      style={{ backgroundColor: user.avatarColor || '#6366f1' }}
                    >
                      {user.avatarEmoji}
                    </div>
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundColor: user?.avatarColor || '#6366f1' }}
                    >
                      {displayName.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                </button>

                {/* Dropdown Menu */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-52 p-1.5 bg-white border border-slate-200/90 rounded-xl shadow-lg z-50 text-slate-700 animate-fadeIn">
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
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={() => onOpenAuth('login')}
                  className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  登录
                </button>
                <button
                  type="button"
                  onClick={() => onOpenAuth('register')}
                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  领主注册
                </button>
              </div>
            )}

            {/* Notification Popover */}
            <NotificationPopover
              isOpen={notificationPopoverOpen}
              onClose={() => setNotificationPopoverOpen(false)}
              onRefreshNations={onRefreshNations}
            />
          </div>
        </div>

        {/* Pull-Up Collapse Handle at Bottom of Navbar (收起顶部栏把手) */}
        <div className="flex justify-center -mb-2">
          <button
            type="button"
            onClick={() => setIsTopCollapsed(true)}
            className="px-4 py-0.5 text-[9px] text-slate-300 hover:text-slate-600 transition flex items-center gap-0.5 cursor-pointer"
            title="收起顶部栏"
          >
            <ChevronUp className="w-3 h-3" />
          </button>
        </div>
      </header>
    </>
  );
};
