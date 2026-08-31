import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Search,
  Filter,
  Shield,
  Globe,
  Plus,
  ArrowUpDown,
  Check,
  ChevronDown,
  X,
  Users,
} from 'lucide-react';
import { AllianceFaction, Nation } from '../../types';
import { ALLIANCE_TYPE_CONFIG } from '../../lib/allianceConstants';
import { getTotalMilitaryFactories } from '../../lib/militaryIndustry';
import { getTotalCivilianFactories } from '../../lib/economyEngine';

interface AllianceLobbyViewProps {
  alliances: AllianceFaction[];
  allNations: Nation[];
  myNation: Nation;
  onInspectAlliance: (alliance: AllianceFaction) => void;
  onRequestJoinAlliance: (alliance: AllianceFaction) => void;
  onCreateAllianceClick: () => void;
}

export const AllianceLobbyView: React.FC<AllianceLobbyViewProps> = ({
  alliances,
  allNations,
  myNation,
  onInspectAlliance,
  onRequestJoinAlliance,
  onCreateAllianceClick,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [onlyOpenApp, setOnlyOpenApp] = useState(false);
  const [sortBy, setSortBy] = useState<'default' | 'members' | 'military' | 'territory'>('default');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const filterRef = useRef<HTMLDivElement>(null);

  // Close filter popover on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    };
    if (isFilterOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isFilterOpen]);

  // Compute aggregated stats for each alliance
  const enrichedAlliances = useMemo(() => {
    return alliances.map((alliance) => {
      const memberNations = allNations.filter((n) => alliance.memberNationIds.includes(n.id));
      const leaderNation = allNations.find((n) => n.id === alliance.leaderNationId);

      const totalMilFactories = memberNations.reduce(
        (acc, n) => acc + getTotalMilitaryFactories(n),
        0
      );
      const totalCivFactories = memberNations.reduce(
        (acc, n) => acc + getTotalCivilianFactories(n),
        0
      );
      const totalProvinces = memberNations.reduce(
        (acc, n) => acc + (n.provinces || []).length,
        0
      );

      const isMyAlliance = alliance.memberNationIds.includes(myNation.id);
      const hasApplied = (alliance.pendingApplications || []).some((p) => p.nationId === myNation.id);

      return {
        ...alliance,
        leaderNation,
        memberNations,
        totalMilFactories,
        totalCivFactories,
        totalProvinces,
        isMyAlliance,
        hasApplied,
      };
    });
  }, [alliances, allNations, myNation]);

  // Filtered & sorted alliances
  const filteredAlliances = useMemo(() => {
    let result = enrichedAlliances.filter((a) => {
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchName = a.name.toLowerCase().includes(term);
        const matchTag = a.tag.toLowerCase().includes(term);
        const matchLeader = a.leaderNationName.toLowerCase().includes(term);
        const matchMember = a.memberNationNames.some((m) => m.toLowerCase().includes(term));
        if (!matchName && !matchTag && !matchLeader && !matchMember) return false;
      }
      if (selectedTypeFilter !== 'all' && a.allianceType !== selectedTypeFilter) {
        return false;
      }
      if (onlyOpenApp && a.joinRequirements?.allowOpenApplication === false) {
        return false;
      }
      return true;
    });

    if (sortBy === 'members') {
      result = [...result].sort((a, b) => b.memberNationIds.length - a.memberNationIds.length);
    } else if (sortBy === 'military') {
      result = [...result].sort((a, b) => b.totalMilFactories - a.totalMilFactories);
    } else if (sortBy === 'territory') {
      result = [...result].sort((a, b) => b.totalProvinces - a.totalProvinces);
    }

    return result;
  }, [enrichedAlliances, searchTerm, selectedTypeFilter, onlyOpenApp, sortBy]);

  const activeFilterCount =
    (selectedTypeFilter !== 'all' ? 1 : 0) + (onlyOpenApp ? 1 : 0) + (sortBy !== 'default' ? 1 : 0);

  const handleClearFilters = () => {
    setSelectedTypeFilter('all');
    setOnlyOpenApp(false);
    setSortBy('default');
  };

  return (
    <div className="w-full text-slate-800 space-y-6">
      {/* ─────────────────────────────────────────────────────────────
        3. 搜索与操作区 (宽大简洁搜索框为主入口，合并筛选，右侧唯一创建主按钮)
        ───────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3">
        {/* 左侧主要区域：搜索框 + 统一筛选按钮 */}
        <div className="flex items-center gap-2 flex-1 max-w-2xl">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜索联盟名称、标签或成员国..."
              className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-sm text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-700 transition-colors"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* 合并后的“筛选”按钮及弹出面板 */}
          <div className="relative" ref={filterRef}>
            <button
              type="button"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`px-3 py-2 text-xs sm:text-sm font-medium rounded-sm border transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeFilterCount > 0
                  ? 'bg-slate-100 text-slate-900 border-slate-400 font-semibold'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <span>筛选</span>
              {activeFilterCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-slate-800 text-white text-[10px] flex items-center justify-center font-mono">
                  {activeFilterCount}
                </span>
              )}
              <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
            </button>

            {/* 筛选 Popover 面板 */}
            {isFilterOpen && (
              <div className="absolute left-0 sm:right-0 sm:left-auto mt-1.5 w-72 bg-white border border-slate-200 rounded-sm shadow-lg p-3.5 z-30 space-y-3.5 animate-fadeIn">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs">
                  <span className="font-bold text-slate-800">公约筛选与排序</span>
                  {activeFilterCount > 0 && (
                    <button
                      type="button"
                      onClick={handleClearFilters}
                      className="text-[11px] text-slate-500 hover:text-slate-900 cursor-pointer"
                    >
                      重置
                    </button>
                  )}
                </div>

                {/* 公约类型 */}
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-500 block">公约类型</label>
                  <select
                    value={selectedTypeFilter}
                    onChange={(e) => setSelectedTypeFilter(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-sm px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-slate-600"
                  >
                    <option value="all">全部类型</option>
                    <option value="defensive">共同防御同盟</option>
                    <option value="military">多边战略公约</option>
                    <option value="economic">关税贸易同盟</option>
                    <option value="federation">主权联邦同盟</option>
                    <option value="entente">战略互保协定</option>
                  </select>
                </div>

                {/* 排序规则 */}
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-500 block">排序规则</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-sm px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-slate-600"
                  >
                    <option value="default">默认排序</option>
                    <option value="members">按成员国规模</option>
                    <option value="military">按军工产能</option>
                    <option value="territory">按控制疆域</option>
                  </select>
                </div>

                {/* 仅看开放加入 */}
                <div className="pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 select-none">
                    <input
                      type="checkbox"
                      checked={onlyOpenApp}
                      onChange={(e) => setOnlyOpenApp(e.target.checked)}
                      className="rounded-xs border-slate-300 text-slate-800 focus:ring-0 cursor-pointer"
                    />
                    <span>仅显示开放申请的联盟</span>
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 右侧唯一主要按钮：创建联盟 */}
        <button
          type="button"
          onClick={onCreateAllianceClick}
          className="px-3.5 sm:px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-sm text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer transition-colors shrink-0 shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>创建联盟</span>
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────
        4. 联盟列表
        ───────────────────────────────────────────────────────────── */}
      <div className="space-y-2">
        {/* 标题与数量指示 */}
        <div className="flex items-center justify-between text-xs text-slate-500 px-0.5 pb-1">
          <h2 className="text-sm font-bold text-slate-900 tracking-tight">
            全球活跃联盟
          </h2>
          <span className="font-mono text-xs text-slate-500">
            {filteredAlliances.length} 个联盟
          </span>
        </div>

        {/* ─────────────────────────────────────────────────────────────
          5. 空状态与列表渲染
          ───────────────────────────────────────────────────────────── */}
        {filteredAlliances.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-sm py-16 px-6 text-center">
            {alliances.length === 0 ? (
              <div className="max-w-sm mx-auto space-y-4">
                <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto text-slate-400">
                  <Globe className="w-5 h-5 stroke-[1.5]" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-800">
                    暂无活跃联盟
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    世界尚未建立国际联盟，你可以创建第一个联盟。
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={onCreateAllianceClick}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-medium rounded-sm cursor-pointer transition-colors"
                  >
                    创建联盟
                  </button>
                </div>
              </div>
            ) : (
              <div className="max-w-sm mx-auto space-y-3">
                <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto text-slate-400">
                  <Search className="w-5 h-5 stroke-[1.5]" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-800">
                    未找到匹配的联盟
                  </h3>
                  <p className="text-xs text-slate-500">
                    请尝试调整搜索关键词或重置筛选条件。
                  </p>
                </div>
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSearchTerm('');
                      handleClearFilters();
                    }}
                    className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-sm text-xs font-medium cursor-pointer transition-colors"
                  >
                    清除筛选
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* 简洁纵向列表：极简白底，细线分割，仅显示核心字段 */
          <div className="bg-white border border-slate-200 rounded-sm divide-y divide-slate-100 overflow-hidden">
            {filteredAlliances.map((alliance) => {
              const typeConfig = alliance.allianceType
                ? ALLIANCE_TYPE_CONFIG[alliance.allianceType]
                : null;

              return (
                <div
                  key={alliance.id}
                  className="p-3.5 sm:p-4 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  {/* 左侧：联盟图标 + 名称 + 简短描述 */}
                  <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                    {/* 联盟图标 */}
                    <div
                      className="w-10 h-10 rounded-sm flex flex-col items-center justify-center text-white shrink-0 select-none shadow-2xs border border-black/10"
                      style={{ backgroundColor: alliance.bannerColor || '#1e3a8a' }}
                    >
                      <Shield className="w-4 h-4 text-white/90" />
                      <span className="font-mono font-bold text-[9px] uppercase tracking-wider leading-none mt-0.5">
                        {alliance.tag ? alliance.tag.slice(0, 4) : 'PACT'}
                      </span>
                    </div>

                    {/* 联盟名称与描述 */}
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => onInspectAlliance(alliance)}
                          className="font-bold text-slate-900 text-sm hover:text-slate-600 cursor-pointer text-left truncate transition-colors"
                        >
                          {alliance.name}
                        </button>
                        {typeConfig && (
                          <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[10px] rounded-sm font-medium shrink-0">
                            {typeConfig.label}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-1">
                        {alliance.description || '多边集体安全条约组织，维护地缘防务秩序与发展。'}
                      </p>
                    </div>
                  </div>

                  {/* 右侧：成员数量 + 公约状态 + 操作按钮 */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    {/* 成员数量 */}
                    <div className="flex items-center gap-1 text-xs text-slate-600 font-mono">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>{alliance.memberNationIds.length} 个成员国</span>
                    </div>

                    {/* 操作与加入状态 */}
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onInspectAlliance(alliance)}
                        className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-sm cursor-pointer transition-colors"
                      >
                        详情
                      </button>

                      {alliance.isMyAlliance ? (
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-sm text-xs font-medium">
                          所属同盟
                        </span>
                      ) : alliance.hasApplied ? (
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-500 rounded-sm text-xs font-medium">
                          审核中
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onRequestJoinAlliance(alliance)}
                          className="px-3 py-1 bg-slate-800 hover:bg-slate-900 text-white rounded-sm text-xs font-medium cursor-pointer transition-colors shadow-2xs"
                        >
                          申请加入
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

