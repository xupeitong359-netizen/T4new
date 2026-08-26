import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
 Bell,
 Check,
 X,
 Swords,
 HeartHandshake,
 CheckCheck,
 Trash2,
 Inbox,
 Sparkles,
 ExternalLink,
 ShieldAlert,
 Info,
 Clock,
 ChevronRight,
} from 'lucide-react';
import { AppNotification, DiplomaticRequest } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface NotificationPopoverProps {
 isOpen: boolean;
 onClose: () => void;
 onRefreshNations?: () => void;
}

function formatRelativeTime(dateString: string): string {
 try {
  const now = Date.now();
  const target = new Date(dateString).getTime();
  const diffSec = Math.floor((now - target) / 1000);

  if (diffSec < 45) return '刚刚';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}分钟前`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}小时前`;
  if (diffSec < 86400 * 7) return `${Math.floor(diffSec / 86400)}天前`;
  
  const d = new Date(dateString);
  return `${d.getMonth() + 1}月${d.getDate()}日`;
 } catch {
  return dateString;
 }
}

export const NotificationPopover: React.FC<NotificationPopoverProps> = ({
 isOpen,
 onClose,
 onRefreshNations,
}) => {
 const { user, updateUnreadCount } = useAuth();
 const [notifications, setNotifications] = useState<AppNotification[]>([]);
 const [pendingRequests, setPendingRequests] = useState<DiplomaticRequest[]>([]);
 const [isLoading, setIsLoading] = useState(false);
 const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
 const [filterType, setFilterType] = useState<'all' | 'unread'>('all');
 const [toastMessage, setToastMessage] = useState<string | null>(null);

 const containerRef = useRef<HTMLDivElement>(null);

 const showToast = (msg: string) => {
  setToastMessage(msg);
  setTimeout(() => setToastMessage(null), 3000);
 };

 const userId = user?.id;
 const fetchNotifsAndRequests = useCallback(async () => {
  if (!userId) return;
  try {
   const [notifData, dipData] = await Promise.all([
    api.notifications.list(),
    api.diplomacy.myRequests().catch(() => ({ incoming: [], outgoing: [], activeTreaties: [], activeWars: [] })),
   ]);

   setNotifications(notifData.notifications || []);
   setPendingRequests(dipData.incoming || []);
   updateUnreadCount(notifData.unreadCount || 0);
  } catch (err) {
   console.error('Failed to fetch notifications:', err);
  }
 }, [userId, updateUnreadCount]);

 useEffect(() => {
  if (isOpen) {
   fetchNotifsAndRequests();
  }
 }, [isOpen, fetchNotifsAndRequests]);

 // Click outside to close
 useEffect(() => {
  if (!isOpen) return;

  const handlePointerDown = (e: PointerEvent | MouseEvent) => {
   const target = e.target as HTMLElement;
   if (
    containerRef.current &&
    !containerRef.current.contains(target) &&
    !target.closest('#notification-bell-trigger') &&
    !target.closest('#map-notification-bell-trigger') &&
    !target.closest('#mobile-notification-bell-trigger')
   ) {
    onClose();
   }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
   if (e.key === 'Escape') {
    onClose();
   }
  };

  document.addEventListener('pointerdown', handlePointerDown);
  document.addEventListener('mousedown', handlePointerDown);
  document.addEventListener('keydown', handleKeyDown);
  return () => {
   document.removeEventListener('pointerdown', handlePointerDown);
   document.removeEventListener('mousedown', handlePointerDown);
   document.removeEventListener('keydown', handleKeyDown);
  };
 }, [isOpen, onClose]);

 const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
  if (e) e.stopPropagation();
  try {
   await api.notifications.markAsRead(id);
   setNotifications((prev) =>
    prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
   );
   const unread = notifications.filter((n) => n.id !== id && !n.isRead).length;
   updateUnreadCount(unread);
  } catch (err) {
   console.error('Mark as read error:', err);
  }
 };

 const handleMarkAllAsRead = async () => {
  try {
   await api.notifications.markAllAsRead();
   setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
   updateUnreadCount(0);
   showToast('已将全部通知标为已读');
  } catch (err) {
   console.error('Mark all read error:', err);
  }
 };

 const handleDeleteNotif = async (id: string, e?: React.MouseEvent) => {
  if (e) e.stopPropagation();
  try {
   await api.notifications.delete(id);
   setNotifications((prev) => prev.filter((n) => n.id !== id));
   const unread = notifications.filter((n) => n.id !== id && !n.isRead).length;
   updateUnreadCount(unread);
  } catch (err) {
   console.error('Delete notification error:', err);
  }
 };

 const handleRespondDipRequest = async (
  requestId: string,
  action: 'accept' | 'reject'
 ) => {
  setActionLoadingId(requestId + '_' + action);
  try {
   const res = await api.diplomacy.respond({ requestId, action });
   showToast(res.message);
   await fetchNotifsAndRequests();
   if (onRefreshNations) onRefreshNations();
  } catch (err: any) {
   alert(err.message || '处理外交申请失败');
  } finally {
   setActionLoadingId(null);
  }
 };

 const unreadCount = notifications.filter((n) => !n.isRead).length;
 const filteredNotifs = notifications.filter((n) => {
  if (filterType === 'unread') return !n.isRead;
  return true;
 });

 return (
  <AnimatePresence>
   {isOpen && (
    <>
     {/* Transparent / light backdrop for instant click-outside dismiss */}
     <div
      id="notification-popover-backdrop"
      onClick={onClose}
      className="fixed inset-0 z-40 bg-black/10 backdrop-blur-[0.5px] md:bg-transparent md:backdrop-blur-none cursor-default"
     />

     <motion.div
      ref={containerRef}
      initial={{ opacity: 0, scale: 0.95, y: -6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -6 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      className="fixed md:absolute right-2 md:right-0 top-14 md:top-full mt-1.5 w-[calc(100vw-1.5rem)] sm:w-[310px] max-w-[320px] bg-white border border-slate-200/95 rounded-xl shadow-[0_10px_30px_-6px_rgba(0,0,0,0.15),0_2px_6px_rgba(0,0,0,0.05)] z-50 text-slate-800 overflow-hidden flex flex-col max-h-[65vh] md:max-h-[390px] animate-fadeIn"
      style={{ width: 'min(320px, calc(100vw - 1.5rem))' }}
     >
      {/* Top Header */}
      <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 backdrop-blur-md">
       <div className="flex items-center gap-1.5">
        <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 tracking-tight">通知</h3>
        {unreadCount > 0 && (
         <span className="px-1.5 py-0.5 rounded-full text-[9px] font-extrabold bg-indigo-600 text-white leading-none">
          {unreadCount > 99 ? '99+' : unreadCount}
         </span>
        )}
       </div>

       <div className="flex items-center gap-1">
        {unreadCount > 0 && (
         <button
          type="button"
          onClick={handleMarkAllAsRead}
          className="px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded transition-colors flex items-center gap-1 cursor-pointer"
          title="全部标为已读"
         >
          <CheckCheck className="w-3 h-3 text-indigo-500" />
          <span>全部已读</span>
         </button>
        )}

        {/* Filter toggle */}
        <div className="flex items-center bg-slate-200/70 p-0.5 rounded text-[10px] font-bold">
         <button
          type="button"
          onClick={() => setFilterType('all')}
          className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${
           filterType === 'all'
            ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
            : 'text-slate-500 hover:text-slate-800'
          }`}
         >
          全部
         </button>
         <button
          type="button"
          onClick={() => setFilterType('unread')}
          className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${
           filterType === 'unread'
            ? 'bg-white text-indigo-600 shadow-2xs font-extrabold'
            : 'text-slate-500 hover:text-slate-800'
          }`}
         >
          未读
         </button>
        </div>

        <button
         type="button"
         onClick={onClose}
         className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors cursor-pointer ml-0.5"
         title="关闭通知"
        >
         <X className="w-3.5 h-3.5" />
        </button>
       </div>
      </div>

      {/* Inline Feedback Toast */}
      {toastMessage && (
       <div className="px-3 py-1 bg-indigo-50 border-b border-indigo-100 text-[10px] font-semibold text-indigo-700 flex items-center gap-1.5 animate-fadeIn">
        <Sparkles className="w-3 h-3 text-indigo-500 flex-shrink-0" />
        <span>{toastMessage}</span>
       </div>
      )}

      {/* Scrollable Notification & Action Area */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 overscroll-contain">
       {/* 1. Pending Diplomatic Requests (待批复的外交呈文) */}
       {pendingRequests.length > 0 && (
        <div className="bg-indigo-50/40 p-2.5 space-y-2 border-b border-indigo-100/80">
         <div className="flex items-center justify-between">
          <span className="text-[11px] font-extrabold text-indigo-950 flex items-center gap-1.5">
           <HeartHandshake className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
           待批复外交呈文 ({pendingRequests.length})
          </span>
          <span className="text-[9px] text-indigo-600 font-bold bg-indigo-100/80 px-1.5 py-0.2 rounded">
           需裁决
          </span>
         </div>

         <div className="space-y-1.5">
          {pendingRequests.map((req) => {
           const typeNames: Record<string, string> = {
            peace: '和平条约',
            mutual_defense: '互保防御同盟',
            armistice: '停战协定',
            military_access: '军事通行权',
           };
           const isArmistice = req.type === 'armistice';

           return (
            <div
             key={req.id}
             className="p-2 bg-white border border-indigo-200/60 rounded-lg shadow-2xs space-y-1.5"
            >
             <div className="flex items-start justify-between gap-1.5">
              <div>
               <div className="text-[11px] font-bold text-slate-900 leading-tight">
                【{req.senderNationName}】
                <span className="font-normal text-slate-500 text-[10px] ml-1">
                 (领主：{req.senderOwnerName})
                </span>
               </div>
               <div className="text-[10px] text-indigo-700 font-semibold mt-0.5">
                申请签署：{typeNames[req.type] || req.type}
               </div>
              </div>
              <span className="text-[9px] text-slate-400 font-mono flex-shrink-0">
               {formatRelativeTime(req.createdAt)}
              </span>
             </div>

             {req.note && (
              <div className="text-[10px] text-slate-600 italic bg-slate-50 p-1.5 rounded border border-slate-100">
               "{req.note}"
              </div>
             )}

             <div className="flex items-center gap-1.5 pt-0.5">
              <button
               type="button"
               disabled={actionLoadingId !== null}
               onClick={() => handleRespondDipRequest(req.id, 'accept')}
               className={`flex-1 py-1 px-2.5 rounded text-[11px] font-bold text-white transition flex items-center justify-center gap-1 cursor-pointer shadow-2xs ${
                isArmistice
                 ? 'bg-amber-600 hover:bg-amber-700'
                 : 'bg-indigo-600 hover:bg-indigo-700'
               }`}
              >
               <Check className="w-3 h-3" />
               同意签署
              </button>
              <button
               type="button"
               disabled={actionLoadingId !== null}
               onClick={() => handleRespondDipRequest(req.id, 'reject')}
               className="py-1 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
              >
               <X className="w-3 h-3" />
               谢绝
              </button>
             </div>
            </div>
           );
          })}
         </div>
        </div>
       )}

       {/* 2. Notifications List Items */}
       {filteredNotifs.length === 0 && pendingRequests.length === 0 ? (
        <div className="py-10 px-3 text-center">
         <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
          <Bell className="w-4 h-4 text-slate-300" />
         </div>
         <p className="text-xs font-bold text-slate-700">暂无新通知</p>
         <p className="text-[10px] text-slate-400 mt-0.5">
          世界条约变动、宣战通告与系统裁决将在此实时呈现
         </p>
        </div>
       ) : (
        filteredNotifs.map((notif) => {
         const isWar = notif.type === 'war_alert';
         const isDipResult = notif.type === 'dip_result';
         const isDipReq = notif.type === 'dip_request';

         return (
          <div
           key={notif.id}
           onClick={() => {
            if (!notif.isRead) {
             handleMarkAsRead(notif.id);
            }
           }}
           className={`p-2.5 transition-colors flex items-start gap-2 group cursor-pointer relative ${
            !notif.isRead
             ? isWar
              ? 'bg-rose-50/60 hover:bg-rose-50'
              : 'bg-indigo-50/30 hover:bg-indigo-50/60'
             : 'bg-white hover:bg-slate-50'
           }`}
          >
           {/* Unread dot */}
           <div className="pt-1.5 flex-shrink-0">
            {!notif.isRead ? (
             <span className="block w-1.5 h-1.5 rounded-full bg-indigo-600 shadow-xs" />
            ) : (
             <span className="block w-1.5 h-1.5 rounded-full bg-transparent" />
            )}
           </div>

           {/* Icon Avatar */}
           <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 shadow-2xs ${
             isWar
              ? 'bg-rose-100 text-rose-600 border border-rose-200'
              : isDipReq
              ? 'bg-indigo-100 text-indigo-600 border border-indigo-200'
              : isDipResult
              ? 'bg-emerald-100 text-emerald-600 border border-emerald-200'
              : 'bg-slate-100 text-slate-600 border border-slate-200'
            }`}
           >
            {isWar ? (
             <Swords className="w-3.5 h-3.5" />
            ) : isDipReq ? (
             <HeartHandshake className="w-3.5 h-3.5" />
            ) : isDipResult ? (
             <CheckCheck className="w-3.5 h-3.5" />
            ) : (
             <Info className="w-3.5 h-3.5" />
            )}
           </div>

           {/* Main Content */}
           <div className="flex-1 min-w-0 pr-0.5">
            <div className="flex items-baseline justify-between gap-1">
             <h4
              className={`text-[11px] font-bold truncate leading-tight ${
               isWar ? 'text-rose-700' : 'text-slate-900'
              }`}
             >
              {notif.title}
             </h4>
             <span className="text-[9px] text-slate-400 font-mono whitespace-nowrap flex-shrink-0">
              {formatRelativeTime(notif.createdAt)}
             </span>
            </div>

            <p className="text-[10px] text-slate-600 mt-0.5 line-clamp-3 leading-normal">
             {notif.content}
            </p>
           </div>

           {/* Quick action buttons on hover / focus */}
           <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 flex-shrink-0 pt-0.5">
            {!notif.isRead && (
             <button
              type="button"
              onClick={(e) => handleMarkAsRead(notif.id, e)}
              className="p-1 hover:bg-slate-200/70 text-slate-500 hover:text-indigo-600 rounded transition cursor-pointer"
              title="标为已读"
             >
              <Check className="w-3 h-3" />
             </button>
            )}
            <button
             type="button"
             onClick={(e) => handleDeleteNotif(notif.id, e)}
             className="p-1 hover:bg-rose-100 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
             title="删除通知"
            >
             <Trash2 className="w-3 h-3" />
            </button>
           </div>
          </div>
         );
        })
       )}
      </div>

      {/* Footer Status Bar */}
      <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[9px] text-slate-500 font-medium">
       <span className="flex items-center gap-1">
        <Clock className="w-2.5 h-2.5 text-slate-400" />
        <span>实时自动同步</span>
       </span>
       <span>共 {notifications.length} 条通告</span>
      </div>
     </motion.div>
    </>
   )}
  </AnimatePresence>
 );
};
