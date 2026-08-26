import React from 'react';
import { Landmark, Globe, ScrollText, Flag, Settings, ShieldAlert, Microscope, Swords } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
 activeTab: string;
 setActiveTab: (tab: any) => void;
 unreadNotifsCount?: number;
}

export function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
 const { isAdmin } = useAuth();

 const navItems = [
  { id: 'lobby', label: '国家', icon: Landmark },
  { id: 'alliances', label: '申请', icon: ScrollText },
  { id: 'world_map', label: '世界地图', icon: Globe, hotkey: 'F1' },
  { id: 'my_nation', label: '国家政府', icon: Flag, hotkey: 'F2' },
  { id: 'research', label: '国家科研', icon: Microscope, hotkey: 'F3' },
  { id: 'army', label: '陆军指挥', icon: Swords, hotkey: 'F4' },
  { id: 'wars', label: '当前战争', icon: Swords },
 ];

 return (
  <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 h-screen sticky top-0 z-30 shadow-sm">
   <div className="p-6">
    <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
     <Globe className="w-6 h-6 text-indigo-600" />
     国家大厅
    </h2>
   </div>

   <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
    {navItems.map((item) => (
     <button
      key={item.id}
      onClick={() => setActiveTab(item.id)}
      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all font-medium text-sm cursor-pointer ${
       activeTab === item.id
        ? 'bg-indigo-50 text-indigo-700 shadow-sm font-bold'
        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
      }`}
     >
      <div className="flex items-center gap-3">
       <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-indigo-600' : 'text-slate-400'}`} />
       <span>{item.label}</span>
      </div>
      {item.hotkey && (
       <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
        activeTab === item.id
         ? 'bg-indigo-100/80 border-indigo-300 text-indigo-700'
         : 'bg-slate-100 border-slate-200 text-slate-400'
       }`}>
        {item.hotkey}
       </span>
      )}
     </button>
    ))}

    {isAdmin && (
     <div className="pt-4 mt-4 border-t border-slate-100">
      <button
       onClick={() => setActiveTab('admin')}
       className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm cursor-pointer ${
        activeTab === 'admin'
         ? 'bg-rose-50 text-rose-700 shadow-sm font-bold'
         : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
       }`}
      >
       <ShieldAlert className={`w-5 h-5 ${activeTab === 'admin' ? 'text-rose-600' : 'text-slate-400'}`} />
       管理中心
      </button>
     </div>
    )}
   </nav>

   <div className="p-4 mt-auto border-t border-slate-100">
    <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 cursor-pointer">
     <Settings className="w-5 h-5 text-slate-400" />
     系统设置
    </button>
   </div>
  </aside>
 );
}
