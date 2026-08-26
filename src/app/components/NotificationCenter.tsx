import React, { useState, useEffect, useCallback } from 'react';
import {
 Bell,
 Check,
 X,
 Swords,
 HeartHandshake,
 ShieldAlert,
 Info,
 CheckCheck,
 Trash2,
 Inbox,
 Sparkles,
 Calendar,
} from 'lucide-react';
import { AppNotification, DiplomaticRequest } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface NotificationCenterProps {
 onRefreshNations?: () => void;
 onOpenDiplomacyModal?: (nationId: string) => void;
}

type TabType = 'all' | 'unread' | 'dip_request' | 'dip_result' | 'war_alert';

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
 onRefreshNations,
}) => {
 const { user, myNation, updateUnreadCount } = useAuth();
 const [notifications, setNotifications] = useState<AppNotification[]>([]);
 const [pendingRequests, setPendingRequests] = useState<DiplomaticRequest[]>([]);
 const [activeTab, setActiveTab] = useState<TabType>('all');
 const [isLoading, setIsLoading] = useState(true);
 const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
 const [statusMessage, setStatusMessage] = useState<string | null>(null);

 const fetchNotifsAndRequests = useCallback(async () => {
  try {
   const [notifData, dipData] = await Promise.all([
    api.notifications.list(),
    api.diplomacy.myRequests().catch(() => ({ incoming: [], outgoing: [], activeTreaties: [], activeWars: [] })),
   ]);

   setNotifications(notifData.notifications);
   setPendingRequests(dipData.incoming || []);
   updateUnreadCount(notifData.unreadCount);
  } catch (err) {
   console.error('Failed to fetch notifications:', err);
  } finally {
   setIsLoading(false);
  }
 }, [updateUnreadCount]);

 useEffect(() => {
  fetchNotifsAndRequests();
  // Only poll while the tab is visible and never overlap requests. Background
  // tabs that fire a request and then get frozen leave the connection to be
  // torn down, which the edge function logs as an aborted/broken connection.
  let inFlight = false;
  const poll = async () => {
   if (inFlight || document.hidden) return;
   inFlight = true;
   try {
    await fetchNotifsAndRequests();
   } finally {
    inFlight = false;
   }
  };
  const timer = setInterval(poll, 15000);
  const onVisible = () => { if (!document.hidden) poll(); };
  document.addEventListener('visibilitychange', onVisible);
  return () => {
   clearInterval(timer);
   document.removeEventListener('visibilitychange', onVisible);
  };
 }, [fetchNotifsAndRequests]);

 const handleMarkAsRead = async (id: string) => {
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
   setStatusMessage('已将所有通告标记为已读');
   setTimeout(() => setStatusMessage(null), 3000);
  } catch (err) {
   console.error('Mark all read error:', err);
  }
 };

 const handleDeleteNotif = async (id: string) => {
  try {
   await api.notifications.delete(id);
   setNotifications((prev) => prev.filter((n) => n.id !== id));
   const unread = notifications.filter((n) => n.id !== id && !n.isRead).length;
   updateUnreadCount(unread);
  } catch (err) {
   console.error('Delete notification error:', err);
  }
 };

 const handleRespondDipRequest = async (requestId: string, action: 'accept' | 'reject') => {
  setActionLoadingId(requestId + '_' + action);
  try {
   const res = await api.diplomacy.respond({ requestId, action });
   setStatusMessage(res.message);
   setTimeout(() => setStatusMessage(null), 4000);

   // Refresh data
   await fetchNotifsAndRequests();
   if (onRefreshNations) onRefreshNations();
  } catch (err: any) {
   alert(err.message || '处理外交申请失败');
  } finally {
   setActionLoadingId(null);
  }
 };

 // Filter notifications
 const filteredNotifs = notifications.filter((n) => {
  if (activeTab === 'unread') return !n.isRead;
  if (activeTab === 'dip_request') return n.type === 'dip_request';
  if (activeTab === 'dip_result') return n.type === 'dip_result';
  if (activeTab === 'war_alert') return n.type === 'war_alert';
  return true;
 });

 const unreadCount = notifications.filter((n) => !n.isRead).length;

 return (
  <div className="w-full max-w-4xl mx-auto space-y-6">
   {/* Header */}
   <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 bg-white border border-slate-200 rounded-3xl shadow-sm">
    <div className="flex items-center gap-3 sm:gap-4">
     <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-indigo-50 text-indigo-500 border border-indigo-100 flex items-center justify-center flex-shrink-0 shadow-sm">
      <Bell className="w-6 h-6" />
     </div>
     <div>
      <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
       帝国枢密院 · 消息与战报
       {unreadCount > 0 && (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500 text-white shadow-sm shadow-rose-500/20 animate-pulse">
         {unreadCount} 未读
        </span>
       )}
      </h2>
      <p className="text-xs sm:text-sm text-slate-500 mt-1">
       实时接收各国外交申请、国书签署通告与前线战争警报
      </p>
     </div>
    </div>

    {unreadCount > 0 && (
     <button
      id="mark-all-read-btn"
      type="button"
      onClick={handleMarkAllAsRead}
      className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-200 text-sm font-semibold transition flex items-center gap-2 cursor-pointer self-start sm:self-auto shadow-sm"
     >
      <CheckCheck className="w-4 h-4 text-indigo-500" />
      全部标为已读
     </button>
    )}
   </div>

   {statusMessage && (
    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-sm text-emerald-700 font-semibold flex items-center gap-2 animate-fadeIn shadow-sm">
     <Sparkles className="w-5 h-5 text-emerald-500" />
     {statusMessage}
    </div>
   )}

   {/* Incoming Actionable Diplomatic Requests Section */}
   {pendingRequests.length > 0 && (
    <div className="p-5 sm:p-6 bg-indigo-50/50 border border-indigo-100 rounded-3xl space-y-4 shadow-sm">
     <div className="flex items-center justify-between">
      <span className="text-sm sm:text-base font-bold text-indigo-900 flex items-center gap-2">
       <HeartHandshake className="w-5 h-5 text-indigo-500" />
       待批复的外交国书申请 ({pendingRequests.length})
      </span>
      <span className="text-xs text-indigo-500/80 font-medium">需亲自批复</span>
     </div>

     <div className="space-y-4">
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
         className="p-4 sm:p-5 bg-white border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm hover:shadow-md transition-shadow"
        >
         <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
           <span className="font-bold text-slate-900 text-sm sm:text-base">
            【{req.senderNationName}】
           </span>
           <span className="text-xs sm:text-sm text-slate-500">
            （领主：{req.senderOwnerName}）
           </span>
           <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-indigo-100 text-indigo-700 border border-indigo-200">
            申请签署：{typeNames[req.type] || req.type}
           </span>
          </div>
          {req.note && (
           <p className="text-sm text-slate-600 italic pl-3 border-l-2 border-indigo-300">
            "{req.note}"
           </p>
          )}
          <span className="text-xs text-slate-400 font-mono block pt-1">
           发起于：{new Date(req.createdAt).toLocaleString()}
          </span>
         </div>

         <div className="flex items-center gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
          <button
           type="button"
           disabled={actionLoadingId !== null}
           onClick={() => handleRespondDipRequest(req.id, 'accept')}
           className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl text-sm font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm ${
            isArmistice
             ? 'bg-amber-500 hover:bg-amber-600 text-white'
             : 'bg-indigo-600 hover:bg-indigo-700 text-white'
           }`}
          >
           <Check className="w-4 h-4" />
           同意签署
          </button>
          <button
           type="button"
           disabled={actionLoadingId !== null}
           onClick={() => handleRespondDipRequest(req.id, 'reject')}
           className="flex-1 sm:flex-initial px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 rounded-xl border border-slate-200 text-sm font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
          >
           <X className="w-4 h-4" />
           谢绝申请
          </button>
         </div>
        </div>
       );
      })}
     </div>
    </div>
   )}

   {/* Tabs */}
   <div className="flex bg-slate-50 p-1 rounded-xl sm:rounded-2xl border border-slate-200 overflow-x-auto gap-1 [&::-webkit-scrollbar]:hidden scrollbar-hide">
    <button
     id="notif-tab-all"
     type="button"
     onClick={() => setActiveTab('all')}
     className={`px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-bold rounded-lg sm:rounded-xl transition flex justify-center items-center gap-1 sm:gap-2 whitespace-nowrap cursor-pointer flex-1 sm:flex-none ${
      activeTab === 'all'
       ? 'bg-white text-indigo-600 shadow-sm border border-slate-200'
       : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100/50'
     }`}
    >
     全部
    </button>
    <button
     id="notif-tab-unread"
     type="button"
     onClick={() => setActiveTab('unread')}
     className={`px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-bold rounded-lg sm:rounded-xl transition flex justify-center items-center gap-1 sm:gap-2 whitespace-nowrap cursor-pointer flex-1 sm:flex-none ${
      activeTab === 'unread'
       ? 'bg-white text-indigo-600 shadow-sm border border-slate-200'
       : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100/50'
     }`}
    >
     未读
    </button>
    <button
     id="notif-tab-dip-request"
     type="button"
     onClick={() => setActiveTab('dip_request')}
     className={`px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-bold rounded-lg sm:rounded-xl transition flex justify-center items-center gap-1 sm:gap-2 whitespace-nowrap cursor-pointer flex-1 sm:flex-none ${
      activeTab === 'dip_request'
       ? 'bg-white text-indigo-600 shadow-sm border border-slate-200'
       : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100/50'
     }`}
    >
     申请
    </button>
    <button
     id="notif-tab-dip-result"
     type="button"
     onClick={() => setActiveTab('dip_result')}
     className={`px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-bold rounded-lg sm:rounded-xl transition flex justify-center items-center gap-1 sm:gap-2 whitespace-nowrap cursor-pointer flex-1 sm:flex-none ${
      activeTab === 'dip_result'
       ? 'bg-white text-indigo-600 shadow-sm border border-slate-200'
       : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100/50'
     }`}
    >
     结果
    </button>
    <button
     id="notif-tab-war-alert"
     type="button"
     onClick={() => setActiveTab('war_alert')}
     className={`px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-bold rounded-lg sm:rounded-xl transition flex justify-center items-center gap-1 sm:gap-2 whitespace-nowrap cursor-pointer flex-1 sm:flex-none ${
      activeTab === 'war_alert'
       ? 'bg-white text-rose-600 shadow-sm border border-slate-200'
       : 'text-slate-500 hover:text-rose-500 hover:bg-slate-100/50'
     }`}
    >
     战争
    </button>
   </div>

   {/* Notifications List */}
   <div className="space-y-4">
    {filteredNotifs.length === 0 ? (
     <div className="p-12 text-center bg-white border border-slate-200 rounded-3xl shadow-sm">
      <Inbox className="w-12 h-12 text-slate-300 mx-auto mb-4" />
      <h3 className="text-lg font-bold text-slate-900">暂无相关消息通告</h3>
      <p className="text-sm text-slate-500 mt-2">
       当其他帝国向您发送外交呈文或宣战令时，枢密院将在此为您呈递
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
        className={`p-5 rounded-3xl border transition-all duration-200 flex items-start gap-4 shadow-sm hover:shadow-md ${
         !notif.isRead
          ? isWar
           ? 'bg-rose-50 border-rose-200 shadow-rose-500/10'
           : 'bg-indigo-50/50 border-indigo-200 shadow-indigo-500/10'
          : 'bg-white border-slate-200 hover:border-slate-300'
        }`}
       >
        {/* Icon */}
        <div
         className={`p-3 rounded-2xl flex-shrink-0 ${
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
          <Swords className="w-6 h-6" />
         ) : isDipReq ? (
          <HeartHandshake className="w-6 h-6" />
         ) : isDipResult ? (
          <CheckCheck className="w-6 h-6" />
         ) : (
          <Info className="w-6 h-6" />
         )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
         <div className="flex items-center justify-between gap-3">
          <h4
           className={`text-base font-bold truncate ${
            isWar ? 'text-rose-700' : 'text-slate-900'
           }`}
          >
           {notif.title}
          </h4>
          {!notif.isRead && (
           <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 flex-shrink-0 shadow-sm" />
          )}
         </div>

         <p className="text-sm text-slate-600 mt-2 leading-relaxed whitespace-pre-line">
          {notif.content}
         </p>

         <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 font-medium">
          <span className="flex items-center gap-1.5 font-mono">
           <Calendar className="w-3.5 h-3.5 text-slate-400" />
           {new Date(notif.createdAt).toLocaleString()}
          </span>

          <div className="flex items-center gap-3">
           {!notif.isRead && (
            <button
             type="button"
             onClick={() => handleMarkAsRead(notif.id)}
             className="text-indigo-600 hover:text-indigo-700 font-bold cursor-pointer transition-colors"
            >
             标为已读
            </button>
           )}
           <button
            type="button"
            onClick={() => handleDeleteNotif(notif.id)}
            className="text-slate-400 hover:text-rose-500 transition-colors cursor-pointer p-1.5 rounded-lg hover:bg-rose-50"
            title="删除消息"
           >
            <Trash2 className="w-4 h-4" />
           </button>
          </div>
         </div>
        </div>
       </div>
      );
     })
    )}
   </div>
  </div>
 );
};
