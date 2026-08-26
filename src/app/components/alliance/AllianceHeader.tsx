import React from 'react';
import { Globe, Users, Shield, Plus, Send, Package, X, Swords } from 'lucide-react';
import { AllianceFaction, Nation } from '../../types';

interface AllianceHeaderProps {
 activeTab: 'lobby' | 'my_alliance' | 'create' | 'petitions' | 'external_diplo';
 onSelectTab: (tab: 'lobby' | 'my_alliance' | 'create' | 'petitions' | 'external_diplo') => void;
 myNation: Nation;
 myAlliance?: AllianceFaction;
 alliances: AllianceFaction[];
 allNations: Nation[];
 onClose?: () => void;
 isPage?: boolean;
}

export const AllianceHeader: React.FC<AllianceHeaderProps> = ({
 activeTab,
 onSelectTab,
 myNation,
 myAlliance,
 alliances,
 allNations,
 onClose,
 isPage,
}) => {
 // Aggregate mainland coalition metrics
 const totalMemberCount = alliances.reduce((acc, a) => acc + a.memberNationIds.length, 0);
 const openApplicationsCount = alliances.filter(
  (a) => a.joinRequirements?.allowOpenApplication !== false
 ).length;
 const totalWarsCount = alliances.reduce((acc, a) => {
  const memberNations = allNations.filter((n) => a.memberNationIds.includes(n.id));
  const wars = new Set(memberNations.flatMap((n) => (n.activeWars || []).map((w) => w.withNationId)));
  return acc + wars.size;
 }, 0);

 const pendingPetitionsForMe = myAlliance?.leaderNationId === myNation.id
  ? myAlliance.pendingApplications?.length || 0
  : 0;

 const myOutgoingPetitions = alliances.filter((a) =>
  (a.pendingApplications || []).some((p) => p.nationId === myNation.id)
 ).length;

 return (
  <header className="bg-white border-b border-slate-200 shrink-0 select-none">
   {/* 顶部标题与世界国际组织数据摘要 (紧凑横向条，无 KPI Card) */}
   <div className="px-4 sm:px-6 pt-4 pb-3 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100">
    
    {/* 左侧：页面身份 */}
    <div className="space-y-0.5">
     <div className="flex items-center gap-2">
      <span className="text-[11px] font-medium text-slate-500 font-mono tracking-wider">
       外交系统 · 多边公约网络
      </span>
      <span className="text-slate-300">/</span>
      <span className="text-[11px] font-medium text-slate-700">
       国际同盟总署
      </span>
     </div>
     <div className="flex items-baseline gap-3">
      <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900">
       联盟大厅
      </h1>
      <p className="text-xs text-slate-500 hidden sm:inline">
       探索世界各国建立的政治、经济与安全防务公约
      </p>
     </div>
    </div>

    {/* 右侧：紧凑数据条 + 关闭按钮 (无独立小卡片) */}
    <div className="flex items-center justify-between md:justify-end gap-3 text-xs">
     {/* 数据横向排列 */}
     <div className="flex items-center gap-2 sm:gap-3 text-slate-600 font-mono text-[11px] bg-[#fbfbf9] px-3 py-1.5 border border-slate-200/90 rounded-xs">
      <div className="flex items-center gap-1.5">
       <span className="text-slate-400">活跃联盟</span>
       <strong className="text-slate-900 font-bold">{alliances.length}</strong>
      </div>
      <span className="text-slate-300">·</span>
      <div className="flex items-center gap-1.5">
       <span className="text-slate-400">缔约国</span>
       <strong className="text-slate-900 font-bold">{totalMemberCount}</strong>
      </div>
      <span className="text-slate-300">·</span>
      <div className="flex items-center gap-1.5">
       <span className="text-slate-400">开放申请</span>
       <strong className="text-slate-900 font-bold">{openApplicationsCount}</strong>
      </div>
      {totalWarsCount > 0 && (
       <>
        <span className="text-slate-300 hidden sm:inline">·</span>
        <div className="hidden sm:flex items-center gap-1.5 text-rose-700 font-semibold">
         <span className="text-rose-500">外部战事</span>
         <strong>{totalWarsCount}</strong>
        </div>
       </>
      )}
     </div>

     {/* 关闭按钮 (Modal 模式下) */}
     {onClose && !isPage && (
      <button
       type="button"
       onClick={onClose}
       className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xs transition-colors cursor-pointer"
       title="关闭窗口"
      >
       <X className="w-4 h-4" />
      </button>
     )}
    </div>
   </div>

   {/* 主导航条：文字 + 极简图标 + 底部 2px 强调线 */}
   <nav className="flex items-center px-4 sm:px-6 gap-4 sm:gap-6 overflow-x-auto no-scrollbar scroll-smooth">
    
    {/* 联盟大厅 */}
    <button
     type="button"
     onClick={() => onSelectTab('lobby')}
     className={`relative py-2.5 text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
      activeTab === 'lobby'
       ? 'text-slate-900 font-bold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-slate-900'
       : 'text-slate-500 hover:text-slate-800'
     }`}
    >
     <Globe className="w-3.5 h-3.5" />
     <span>联盟目录</span>
    </button>

    {/* 我的联盟 */}
    {myAlliance && (
     <button
      type="button"
      onClick={() => onSelectTab('my_alliance')}
      className={`relative py-2.5 text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
       activeTab === 'my_alliance'
        ? 'text-slate-900 font-bold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-slate-900'
        : 'text-slate-500 hover:text-slate-800'
      }`}
     >
      <Shield className="w-3.5 h-3.5" />
      <span>我的联盟 [{myAlliance.tag}]</span>
      {pendingPetitionsForMe > 0 && (
       <span className="px-1.5 py-0.2 bg-rose-600 text-white text-[10px] font-bold rounded-full">
        {pendingPetitionsForMe}
       </span>
      )}
     </button>
    )}

    {/* 我的申请 */}
    <button
     type="button"
     onClick={() => onSelectTab('petitions')}
     className={`relative py-2.5 text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
      activeTab === 'petitions'
       ? 'text-slate-900 font-bold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-slate-900'
       : 'text-slate-500 hover:text-slate-800'
     }`}
    >
     <Send className="w-3.5 h-3.5" />
     <span>我的申请</span>
     {myOutgoingPetitions > 0 && (
      <span className="px-1.5 py-0.2 bg-slate-700 text-white text-[10px] font-bold rounded-full">
       {myOutgoingPetitions}
      </span>
     )}
    </button>

    {/* 战略外援与使馆 */}
    <button
     type="button"
     onClick={() => onSelectTab('external_diplo')}
     className={`relative py-2.5 text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
      activeTab === 'external_diplo'
       ? 'text-slate-900 font-bold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-slate-900'
       : 'text-slate-500 hover:text-slate-800'
     }`}
    >
     <Package className="w-3.5 h-3.5" />
     <span>战略外援与使馆</span>
    </button>

    {/* 创建联盟 (次要功能入口) */}
    <button
     type="button"
     onClick={() => onSelectTab('create')}
     className={`relative py-2.5 text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
      activeTab === 'create'
       ? 'text-slate-900 font-bold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-slate-900'
       : 'text-slate-500 hover:text-slate-800'
     }`}
    >
     <Plus className="w-3.5 h-3.5" />
     <span>创建联盟</span>
    </button>
   </nav>
  </header>
 );
};
