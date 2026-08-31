import React from 'react';
import { Globe, Shield, FileText, Landmark, X } from 'lucide-react';
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
  const totalMemberCount = alliances.reduce((acc, a) => acc + a.memberNationIds.length, 0);
  const openApplicationsCount = alliances.filter(
    (a) => a.joinRequirements?.allowOpenApplication !== false
  ).length;

  const pendingPetitionsForMe =
    myAlliance?.leaderNationId === myNation.id
      ? myAlliance.pendingApplications?.length || 0
      : 0;

  const myOutgoingPetitions = alliances.filter((a) =>
    (a.pendingApplications || []).some((p) => p.nationId === myNation.id)
  ).length;

  return (
    <header className="bg-white border-b border-slate-200 shrink-0 select-none">
      {/* 1. 顶部：仅保留“联盟大厅”与单行简洁统计 */}
      <div className="px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            联盟大厅
          </h1>
        </div>

        {/* 简洁统计 + 关闭按钮 */}
        <div className="flex items-center justify-between sm:justify-end gap-3 text-xs text-slate-500 font-mono">
          <div className="flex items-center gap-2 text-[11px] sm:text-xs">
            <span>活跃联盟 <strong className="text-slate-800 font-semibold">{alliances.length}</strong></span>
            <span className="text-slate-300">·</span>
            <span>缔约国 <strong className="text-slate-800 font-semibold">{totalMemberCount}</strong></span>
            <span className="text-slate-300">·</span>
            <span>开放申请 <strong className="text-slate-800 font-semibold">{openApplicationsCount}</strong></span>
          </div>

          {onClose && !isPage && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-sm transition-colors cursor-pointer ml-1"
              title="关闭"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 2. 导航：语义化图标 + 均衡字数 + 现代克制指示线 */}
      <nav className="flex items-center px-4 sm:px-6 gap-6 sm:gap-8 overflow-x-auto no-scrollbar border-t border-slate-100">
        {/* 联盟目录 */}
        <button
          type="button"
          onClick={() => onSelectTab('lobby')}
          className={`py-2.5 text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap relative ${
            activeTab === 'lobby'
              ? 'text-slate-900 font-bold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-slate-900'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Globe className="w-4 h-4 stroke-[1.75]" />
          <span>联盟目录</span>
        </button>

        {/* 我的联盟 (仅在已加入时显示) */}
        {myAlliance && (
          <button
            type="button"
            onClick={() => onSelectTab('my_alliance')}
            className={`py-2.5 text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap relative ${
              activeTab === 'my_alliance'
                ? 'text-slate-900 font-bold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-slate-900'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Shield className="w-4 h-4 stroke-[1.75]" />
            <span>我的联盟 [{myAlliance.tag}]</span>
            {pendingPetitionsForMe > 0 && (
              <span className="px-1.5 py-0.2 bg-rose-600 text-white text-[10px] font-bold rounded-full ml-0.5">
                {pendingPetitionsForMe}
              </span>
            )}
          </button>
        )}

        {/* 我的申请 */}
        <button
          type="button"
          onClick={() => onSelectTab('petitions')}
          className={`py-2.5 text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap relative ${
            activeTab === 'petitions'
              ? 'text-slate-900 font-bold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-slate-900'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4 stroke-[1.75]" />
          <span>公约申请</span>
          {myOutgoingPetitions > 0 && (
            <span className="px-1.5 py-0.2 bg-slate-700 text-white text-[10px] font-bold rounded-full ml-0.5">
              {myOutgoingPetitions}
            </span>
          )}
        </button>

        {/* 使馆与外援 (替换包裹图标为 Landmark 政务使馆图标，字数均衡) */}
        <button
          type="button"
          onClick={() => onSelectTab('external_diplo')}
          className={`py-2.5 text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap relative ${
            activeTab === 'external_diplo'
              ? 'text-slate-900 font-bold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-slate-900'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Landmark className="w-4 h-4 stroke-[1.75]" />
          <span>使馆与外援</span>
        </button>
      </nav>
    </header>
  );
};

