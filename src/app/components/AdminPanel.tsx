import { TikTokIcon } from './TikTokIcon';
import React, { useState, useEffect, useCallback } from 'react';
import {
 ShieldAlert,
 Users,
 Crown,
 Swords,
 HeartHandshake,
 Edit3,
 Trash2,
 RefreshCw,
 Search,
 ShieldCheck,
 ToggleLeft,
 ToggleRight,
 Landmark,
 } from 'lucide-react';
import { Nation } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { renderEmblemIcon } from '../lib/icons';

interface AdminPanelProps {
 nations: Nation[];
 onEditNation: (nation: Nation) => void;
 onDeleteNation: (nation: Nation) => void;
 onRefreshData: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
 nations,
 onEditNation,
 onDeleteNation,
 onRefreshData,
}) => {
 const { user, toggleAdminRole, isAdmin } = useAuth();
 const [stats, setStats] = useState<any>(null);
 const [searchTerm, setSearchTerm] = useState('');
 const [isLoading, setIsLoading] = useState(true);

 const fetchStats = useCallback(async () => {
  try {
   setIsLoading(true);
   const data = await api.admin.stats();
   setStats(data);
  } catch (err) {
   console.error('Failed to fetch admin stats:', err);
  } finally {
   setIsLoading(false);
  }
 }, []);

 useEffect(() => {
  fetchStats();
 }, [fetchStats]);

 const filteredNations = nations.filter(
  (n) =>
   n.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
   n.ownerUsername.toLowerCase().includes(searchTerm.toLowerCase()) ||
   n.ownerDouyinName.toLowerCase().includes(searchTerm.toLowerCase()) ||
   n.capital.toLowerCase().includes(searchTerm.toLowerCase())
 );

 return (
  <div className="w-full max-w-6xl mx-auto space-y-6">
   {/* Top Banner */}
   <div className="p-6 bg-gradient-to-r from-amber-50 via-white to-indigo-50 border border-amber-200 rounded-3xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5">
    <div className="flex items-center gap-4">
     <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 border border-amber-200 flex items-center justify-center shadow-sm">
      <ShieldAlert className="w-7 h-7" />
     </div>
     <div>
      <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
       全域监管枢纽 · 管理员终审席
       <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200 shadow-sm shadow-amber-500/10">
        最高权限
       </span>
      </h2>
      <p className="text-sm text-slate-500 mt-1">
       拥有编辑、裁决与销毁所有宣告国家的最高行政权限
      </p>
     </div>
    </div>

    <div className="flex items-center gap-3">
     <button
      id="admin-toggle-role-btn"
      type="button"
      onClick={async () => {
       await toggleAdminRole();
       onRefreshData();
      }}
      className="px-4 py-2 bg-white hover:bg-slate-50 text-amber-700 border border-amber-200 rounded-xl text-sm font-bold transition flex items-center gap-2 cursor-pointer shadow-sm"
     >
      {isAdmin ? <ToggleRight className="w-5 h-5 text-amber-500" /> : <ToggleLeft className="w-5 h-5" />}
      {isAdmin ? '切换回普通领主' : '启用管理员模式'}
     </button>

     <button
      type="button"
      onClick={() => {
       fetchStats();
       onRefreshData();
      }}
      className="p-2.5 bg-white hover:bg-slate-50 text-slate-600 rounded-xl border border-slate-200 transition shadow-sm cursor-pointer"
      title="刷新数据"
     >
      <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
     </button>
    </div>
   </div>

   {/* Metrics Cards */}
   <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
    <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm">
     <div className="flex items-center justify-between text-slate-500 text-sm font-semibold mb-3">
      <span>注册领主总数</span>
      <Users className="w-5 h-5 text-indigo-500" />
     </div>
     <p className="text-3xl font-black text-slate-900">{stats?.userCount ?? '-'}</p>
    </div>

    <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm">
     <div className="flex items-center justify-between text-slate-500 text-sm font-semibold mb-3">
      <span>宣告国家总数</span>
      <Crown className="w-5 h-5 text-amber-500" />
     </div>
     <p className="text-3xl font-black text-slate-900">{nations.length}</p>
    </div>

    <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm">
     <div className="flex items-center justify-between text-slate-500 text-sm font-semibold mb-3">
      <span>生效中条约</span>
      <HeartHandshake className="w-5 h-5 text-emerald-500" />
     </div>
     <p className="text-3xl font-black text-slate-900">{stats?.activeTreatyCount ?? '-'}</p>
    </div>

    <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm">
     <div className="flex items-center justify-between text-slate-500 text-sm font-semibold mb-3">
      <span>激烈交战中</span>
      <Swords className="w-5 h-5 text-rose-500" />
     </div>
     <p className="text-3xl font-black text-slate-900">{stats?.activeWarCount ?? '-'}</p>
    </div>
   </div>

   {/* Nations Management Table */}
   <div className="p-6 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-5">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
     <div>
      <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
       <Crown className="w-5 h-5 text-amber-500" />
       全部宣告国家总览与管理 ({filteredNations.length})
      </h3>
      <p className="text-sm text-slate-500 mt-1">可对任意国家进行强制信息修正或国家销毁</p>
     </div>

     <div className="relative w-full sm:w-72">
      <Search className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" />
      <input
       type="text"
       value={searchTerm}
       onChange={(e) => setSearchTerm(e.target.value)}
       placeholder="搜索国名、领主、抖音..."
       className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10 transition-all"
      />
     </div>
    </div>

    <div className="overflow-x-auto">
     <table className="w-full text-left text-sm border-collapse">
      <thead>
       <tr className="border-b-2 border-slate-100 text-slate-500 font-bold bg-slate-50">
        <th className="py-3 px-4 first:rounded-tl-xl">国家/国徽</th>
        <th className="py-3 px-4">首都</th>
        <th className="py-3 px-4">领主及抖音</th>
        <th className="py-3 px-4">政体与意识形态</th>
        <th className="py-3 px-4">交战/条约</th>
        <th className="py-3 px-4 text-right last:rounded-tr-xl">管理操作</th>
       </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
       {filteredNations.map((nation) => (
        <tr key={nation.id} className="hover:bg-slate-50/80 transition-colors">
         <td className="py-4 px-4">
          <div className="flex items-center gap-3">
           <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs flex-shrink-0 shadow-sm"
            style={{ backgroundColor: nation.flagColor }}
           >
            {renderEmblemIcon(nation.emblemIcon, { className: 'w-5 h-5' })}
           </div>
           <div>
            <span className="font-bold text-slate-900 block">{nation.name}</span>
            <span className="text-xs text-slate-400 font-mono mt-0.5 block">{nation.id}</span>
           </div>
          </div>
         </td>
         <td className="py-4 px-4 text-slate-700 font-semibold">{nation.capital}</td>
         <td className="py-4 px-4">
          <div className="space-y-1">
           <span className="text-slate-900 font-bold block">{nation.ownerUsername}</span>
           <span className="text-xs text-rose-500 flex items-center gap-1 font-mono font-medium">
            <TikTokIcon className="w-3.5 h-3.5" /> {nation.ownerDouyinName}
           </span>
          </div>
         </td>
         <td className="py-4 px-4">
          <div className="space-y-1">
           <span className="text-slate-700 font-medium block">{nation.regime}</span>
           <span className="text-xs text-slate-500 block">{nation.ideology}</span>
          </div>
         </td>
         <td className="py-4 px-4">
          <div className="flex items-center gap-2 flex-wrap">
           {(nation.activeWars || []).length > 0 && (
            <span className="px-2 py-1 rounded-md text-xs font-bold bg-rose-50 text-rose-600 border border-rose-200 flex items-center gap-1">
             <Swords className="w-3 h-3" />
             {nation.activeWars?.length} 场战争
            </span>
           )}
           {(nation.activeTreaties || []).length > 0 && (
            <span className="px-2 py-1 rounded-md text-xs font-bold bg-indigo-50 text-indigo-600 border border-indigo-200">
             {nation.activeTreaties?.length} 条约
            </span>
           )}
           {(nation.activeWars || []).length === 0 && (nation.activeTreaties || []).length === 0 && (
            <span className="text-slate-400 text-xs font-medium">-</span>
           )}
          </div>
         </td>
         <td className="py-4 px-4 text-right">
          <div className="flex items-center justify-end gap-2">
           <button
            type="button"
            onClick={() => onEditNation(nation)}
            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
           >
            <Edit3 className="w-4 h-4" /> 编辑
           </button>
           <button
            type="button"
            onClick={() => onDeleteNation(nation)}
            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
           >
            <Trash2 className="w-4 h-4" /> 销毁
           </button>
          </div>
         </td>
        </tr>
       ))}
      </tbody>
     </table>
    </div>
   </div>
  </div>
 );
};
