import React from 'react';
import {
 Globe,
 Landmark,
 Scale,
 Users,
 Layers,
 Swords,
 Crosshair,
 ShieldBan,
 Microscope,
 ScrollText,
 ShieldAlert,
 Settings,
 Flame,
 Compass,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface CommandSidebarProps {
 activeTab: string;
 setActiveTab: (tab: any) => void;
 activeWarsCount?: number;
 unreadNotifsCount?: number;
}

export const CommandSidebar: React.FC<CommandSidebarProps> = ({
 activeTab,
 setActiveTab,
 activeWarsCount = 0,
}) => {
 const { isAdmin } = useAuth();

 const navCategories = [
  {
   group: '战略态势与领土',
   items: [
    { id: 'world_map', label: '战略大地图', icon: Globe, hotkey: 'F1', badge: '核心' },
    { id: 'lobby', label: '万国国牒大厅', icon: Landmark },
   ],
  },
  {
   group: '国家治理与内政',
   items: [
    { id: 'national_focus', label: '国家战略国策树', icon: Compass, badge: '国策', badgeColor: 'bg-amber-600 text-white font-bold' },
    { id: 'governance', label: '国家治理公署', icon: Landmark, hotkey: 'F2' },
    { id: 'politics', label: '政治体制与政党', icon: Scale },
    { id: 'demographics', label: '人口社会动态', icon: Users },
    { id: 'resources', label: '战略资源储备', icon: Layers },
   ],
  },
  {
   group: '国防统帅与作战',
   items: [
    { id: 'army', label: '陆军常备战备', icon: Swords, hotkey: 'F3' },
    {
     id: 'wars',
     label: '战争指挥中心',
     icon: Crosshair,
     hotkey: 'F4',
     badge: activeWarsCount > 0 ? `${activeWarsCount} 战役` : undefined,
     badgeColor: activeWarsCount > 0 ? 'bg-rose-600 text-white' : undefined,
    },
    { id: 'research', label: '国防科技研发', icon: Microscope, hotkey: 'F5' },
   ],
  },
  {
   group: '国际外交与制裁',
   items: [
    { id: 'embargo', label: '贸易禁运与制裁', icon: ShieldBan },
    { id: 'alliances', label: '条约同盟与使馆', icon: ScrollText },
   ],
  },
 ];

 return (
  <aside className="hidden md:flex flex-col w-60 bg-white border-r border-slate-200/90 h-screen sticky top-0 z-30 select-none overflow-y-auto">
   {/* Sidebar Header */}
   <div className="p-3.5 border-b border-slate-100 flex items-center justify-between">
    <div className="flex items-center gap-2">
     <div className="w-6 h-6 rounded-[3px] bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
      CMD
     </div>
     <div>
      <h2 className="text-xs font-bold text-slate-900 leading-tight">战略指挥中心</h2>
      <p className="text-[10px] text-slate-500 font-mono">NATIONAL OPS CONSOLE</p>
     </div>
    </div>
   </div>

   {/* Navigation Groups */}
   <div className="flex-1 py-2 px-2 space-y-4">
    {navCategories.map((cat, gIdx) => (
     <div key={`group-${gIdx}`} className="space-y-0.5">
      <div className="px-2.5 py-1 text-[10px] font-bold text-slate-600 uppercase tracking-wider">
       {cat.group}
      </div>
      {cat.items.map((item) => {
       const isActive = activeTab === item.id;
       const Icon = item.icon;
       return (
        <button
         key={item.id}
         type="button"
         onClick={() => setActiveTab(item.id)}
         className={`w-full flex items-center justify-between px-2.5 py-2 rounded-[4px] text-xs transition cursor-pointer font-medium ${
          isActive
           ? 'bg-slate-900 text-white font-bold shadow-2xs'
           : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
         }`}
        >
         <div className="flex items-center gap-2.5 min-w-0">
          <Icon
           className={`w-4 h-4 flex-shrink-0 ${
            isActive ? 'text-white' : 'text-slate-600'
           }`}
          />
          <span className="truncate">{item.label}</span>
         </div>

         <div className="flex items-center gap-1.5 flex-shrink-0">
          {item.badge && (
           <span
            className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold ${
             item.badgeColor || (isActive ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-800')
            }`}
           >
            {item.badge}
           </span>
          )}
          {item.hotkey && (
           <span
            className={`text-[9px] font-mono px-1 py-0.2 rounded border ${
             isActive
              ? 'border-slate-700 text-slate-300 bg-slate-800'
              : 'border-slate-200 text-slate-600 bg-slate-50'
            }`}
           >
            {item.hotkey}
           </span>
          )}
         </div>
        </button>
       );
      })}
     </div>
    ))}

    {isAdmin && (
     <div className="pt-2 border-t border-slate-100 space-y-0.5">
      <div className="px-2.5 py-1 text-[10px] font-bold text-slate-600 uppercase tracking-wider">
       最高权限
      </div>
      <button
       type="button"
       onClick={() => setActiveTab('admin')}
       className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-[4px] text-xs transition cursor-pointer font-medium ${
        activeTab === 'admin'
         ? 'bg-rose-900 text-white font-bold'
         : 'text-rose-700 hover:bg-rose-50'
       }`}
      >
       <ShieldAlert className="w-4 h-4 text-rose-600" />
       <span>统帅管理控制台</span>
      </button>
     </div>
    )}
   </div>

   {/* Footer Info */}
   <div className="p-3 border-t border-slate-100 bg-slate-50 text-[10px] text-slate-500 font-mono flex items-center justify-between">
    <span>战备态势：DEFCON 3</span>
    <span className="text-emerald-700 font-bold">● ONLINE</span>
   </div>
  </aside>
 );
};
