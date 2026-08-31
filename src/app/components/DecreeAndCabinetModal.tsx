import React, { useState, useMemo } from 'react';
import {
  X,
  Lock,
  Check,
  ChevronRight,
  ArrowRight,
  RotateCcw,
  Info,
  Building2,
  ShieldAlert,
  Crown,
  Zap,
} from 'lucide-react';
import { Nation, PolicyDecree } from '../types';
import {
  DEFAULT_ACTIVE_DECREE_IDS,
  PRESET_DECREES,
  PRESET_MINISTERS,
  calculateNationalStability,
  calculateWorldTension,
} from '../services/strategicGameplayService';

interface DecreeAndCabinetModalProps {
  isOpen: boolean;
  onClose: () => void;
  myNation: Nation | null;
  allNations?: Nation[];
  onUpdateNation: (updated: Nation) => void;
  onShowToast: (msg: string) => void;
}

export const DecreeAndCabinetModal: React.FC<DecreeAndCabinetModalProps> = ({
  isOpen,
  onClose,
  myNation,
  allNations = [],
  onUpdateNation,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'decrees' | 'cabinet' | 'stability'>('decrees');
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [selectedDecreeId, setSelectedDecreeId] = useState<string | null>(null);
  const [showTensionInfo, setShowTensionInfo] = useState(false);

  // 路线分组配置
  const branchGroups = useMemo(() => {
    const groups: {
      id: string;
      name: string;
      icon: React.ReactNode;
      decrees: PolicyDecree[];
    }[] = [
      {
        id: 'branch_economy',
        name: '经济与重工产业',
        icon: <Building2 className="w-3.5 h-3.5 text-slate-500" />,
        decrees: PRESET_DECREES.filter((d) => d.branchId === 'branch_economy'),
      },
      {
        id: 'branch_military',
        name: '国防动员与武装安全',
        icon: <ShieldAlert className="w-3.5 h-3.5 text-slate-500" />,
        decrees: PRESET_DECREES.filter((d) => d.branchId === 'branch_military'),
      },
      {
        id: 'branch_society',
        name: '社会契约与国家认同',
        icon: <Crown className="w-3.5 h-3.5 text-slate-500" />,
        decrees: PRESET_DECREES.filter((d) => d.branchId === 'branch_society'),
      },
      {
        id: 'branch_technology',
        name: '尖端科技与学术战略',
        icon: <Zap className="w-3.5 h-3.5 text-slate-500" />,
        decrees: PRESET_DECREES.filter((d) => d.branchId === 'branch_technology'),
      },
    ];

    if (selectedBranch === 'all') return groups;
    return groups.filter((g) => g.id === selectedBranch);
  }, [selectedBranch]);

  if (!isOpen || !myNation) return null;

  const activeDecreeIds = Array.isArray(myNation.activeDecreeIds)
    ? myNation.activeDecreeIds
    : DEFAULT_ACTIVE_DECREE_IDS;

  const appointedMinisters = myNation.ministers || {
    defense: 'min_def_1',
    finance: 'min_fin_1',
    foreign: 'min_for_1',
    industry: 'min_ind_1',
  };

  const { stability, approval, statusText } = calculateNationalStability(myNation);
  const worldTension = calculateWorldTension(allNations);

  // 计算总维系开销
  const totalUpkeep = activeDecreeIds.reduce((sum, id) => {
    const d = PRESET_DECREES.find((item) => item.id === id);
    return sum + (d?.upkeepCostCiv || 0);
  }, 0);

  // 选中的法令详情
  const selectedDecree = PRESET_DECREES.find((d) => d.id === selectedDecreeId) || null;

  // 判定法令可用状态
  const getDecreeStatus = (decree: PolicyDecree) => {
    const isActive = activeDecreeIds.includes(decree.id);
    if (isActive) return { status: 'active', label: '施行中' };

    if (decree.prerequisiteId && !activeDecreeIds.includes(decree.prerequisiteId)) {
      const prereq = PRESET_DECREES.find((p) => p.id === decree.prerequisiteId);
      return {
        status: 'locked_prereq',
        label: '前置未就绪',
        reason: `需先施行【${prereq?.name || '前置法令'}】`,
      };
    }

    if (decree.unlockCondition) {
      if (decree.unlockCondition.type === 'world_tension') {
        const threshold = decree.unlockCondition.threshold || 20;
        const hasWar = myNation.activeWars && myNation.activeWars.length > 0;
        if (worldTension.tension < threshold && !hasWar) {
          return {
            status: 'locked_condition',
            label: '条件不足',
            reason: `需世界紧张度 ≥ ${threshold}% 或处于战时状态`,
          };
        }
      }
    }

    return { status: 'available', label: '可施行' };
  };

  // 切换法令执行
  const handleToggleDecree = (decree: PolicyDecree) => {
    const isCurrentlyActive = activeDecreeIds.includes(decree.id);

    if (!isCurrentlyActive) {
      const statusCheck = getDecreeStatus(decree);
      if (statusCheck.status !== 'available') {
        onShowToast(`无法施行【${decree.name}】：${statusCheck.reason || '未满足条件'}`);
        return;
      }
    }

    let updatedIds: string[];
    if (isCurrentlyActive) {
      const dependentDecrees = PRESET_DECREES.filter(
        (d) => d.prerequisiteId === decree.id && activeDecreeIds.includes(d.id)
      );
      if (dependentDecrees.length > 0) {
        const depNames = dependentDecrees.map((d) => `【${d.name}】`).join('、');
        onShowToast(`废止【${decree.name}】将连带废除 ${depNames}`);
        const toRemoveIds = new Set([decree.id, ...dependentDecrees.map((d) => d.id)]);
        updatedIds = activeDecreeIds.filter((id) => !toRemoveIds.has(id));
      } else {
        updatedIds = activeDecreeIds.filter((id) => id !== decree.id);
        onShowToast(`已废止【${decree.name}】`);
      }
    } else {
      updatedIds = [...activeDecreeIds, decree.id];
      onShowToast(`已正式施行【${decree.name}】`);
    }

    onUpdateNation({
      ...myNation,
      activeDecreeIds: updatedIds,
    });
  };

  // 任命大臣
  const handleAppointMinister = (role: 'defense' | 'finance' | 'foreign' | 'industry', ministerId: string) => {
    const min = PRESET_MINISTERS.find((m) => m.id === ministerId);
    onShowToast(`已任命【${min?.name}】为【${min?.roleTitle}】`);
    onUpdateNation({
      ...myNation,
      ministers: {
        ...appointedMinisters,
        [role]: ministerId,
      },
    });
  };

  // 计算政策实施前后指标变化
  const calculateProjectedMetrics = (decree: PolicyDecree, isCurrentlyActive: boolean) => {
    const stabDelta = (decree.effects.stabilityBonus || 0) * (isCurrentlyActive ? -1 : 1);
    const projStability = Math.max(10, Math.min(100, stability + stabDelta));

    const appDelta = (decree.effects.popularApprovalBonus || 0) * (isCurrentlyActive ? -1 : 1);
    const projApproval = Math.max(10, Math.min(100, approval + appDelta));

    return {
      projStability,
      stabDelta,
      projApproval,
      appDelta,
    };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/60 backdrop-blur-xs animate-fadeIn font-sans text-slate-800">
      <div className="w-full max-w-3xl bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* ========================================================================= */}
        {/* 1. 顶部标题区 (Quiet & Editorial) */}
        {/* ========================================================================= */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white z-10">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              国家政府内政院
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {myNation.name} · 最高政治决策机构 · 国家政策与内政治理
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
            title="关闭"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 滚动容器：包裹国家状态数据栏、导航栏与法令列表内容 */}
        <div className="overflow-y-auto flex-1">
          {/* ========================================================================= */}
          {/* 2. 国家状态数据栏 (跟随页面自然滚动) */}
          {/* ========================================================================= */}
          <div className="px-5 py-3.5 bg-slate-50/60 border-b border-slate-100">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              {/* 全国稳定性 */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-slate-500 text-[11px]">
                  <span>全国稳定性</span>
                  <span className="text-slate-700 font-medium">{statusText}</span>
                </div>
                <div className="flex items-baseline gap-1 font-mono">
                  <span className="text-lg font-bold text-slate-900">{stability}%</span>
                </div>
                <div className="w-full h-1 rounded-full bg-slate-200/80 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      stability >= 70 ? 'bg-emerald-600' : stability >= 40 ? 'bg-amber-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${stability}%` }}
                  />
                </div>
              </div>

              {/* 国民民意 */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-slate-500 text-[11px]">
                  <span>国民民意</span>
                  <span className="text-slate-700 font-medium">支持率</span>
                </div>
                <div className="flex items-baseline gap-1 font-mono">
                  <span className="text-lg font-bold text-slate-900">{approval}%</span>
                </div>
                <div className="w-full h-1 rounded-full bg-slate-200/80 overflow-hidden">
                  <div
                    className="h-full bg-slate-800 rounded-full transition-all"
                    style={{ width: `${approval}%` }}
                  />
                </div>
              </div>

              {/* 生效法令 */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-slate-500 text-[11px]">
                  <span>生效法令</span>
                  <span className="text-slate-700 font-medium">{activeDecreeIds.length} 项施行</span>
                </div>
                <div className="flex items-baseline gap-1 font-mono">
                  <span className="text-lg font-bold text-slate-900">{totalUpkeep}</span>
                  <span className="text-[10px] text-slate-400 font-sans">产能/月</span>
                </div>
                <div className="w-full h-1 rounded-full bg-slate-200/80 overflow-hidden">
                  <div className="h-full bg-slate-500 rounded-full" style={{ width: '100%' }} />
                </div>
              </div>

              {/* 世界紧张度 */}
              <div className="relative space-y-1">
                <div className="flex items-center justify-between text-slate-500 text-[11px]">
                  <span>世界紧张度</span>
                  <button
                    type="button"
                    onClick={() => setShowTensionInfo(!showTensionInfo)}
                    className="text-slate-400 hover:text-slate-700 cursor-pointer"
                    title="查看简报"
                  >
                    <Info className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex items-baseline gap-1 font-mono">
                  <span className={`text-lg font-bold ${worldTension.tension >= 20 ? 'text-amber-700' : 'text-slate-900'}`}>
                    {worldTension.tension}%
                  </span>
                  <span className="text-[10px] text-slate-400 font-sans">{worldTension.stageText}</span>
                </div>
                <div className="w-full h-1 rounded-full bg-slate-200/80 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      worldTension.tension >= 50 ? 'bg-rose-500' : worldTension.tension >= 20 ? 'bg-amber-500' : 'bg-slate-400'
                    }`}
                    style={{ width: `${worldTension.tension}%` }}
                  />
                </div>

                {/* 简要气压计弹层 */}
                {showTensionInfo && (
                  <div className="absolute right-0 top-full mt-1 z-30 w-64 p-3 bg-white border border-slate-200 rounded-xl shadow-lg text-[11px] text-slate-600 animate-in fade-in">
                    <div className="font-semibold text-slate-900 pb-1 border-b border-slate-100 mb-1.5 flex justify-between">
                      <span>地缘局势评估</span>
                      <span className="text-amber-700">{worldTension.stageText}</span>
                    </div>
                    {worldTension.reasons.length > 0 ? (
                      <ul className="space-y-1 text-slate-500">
                        {worldTension.reasons.map((r, i) => (
                          <li key={i}>• {r}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-slate-400">大陆局势目前平稳，无大规模战争。</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 3. 导航与分类筛选 (Sticky Underline Tabs) */}
          {/* ========================================================================= */}
          <div className="sticky top-0 bg-white/95 backdrop-blur-xs z-10 px-5 border-b border-slate-100 flex items-center justify-between gap-4 overflow-x-auto">
            <div className="flex gap-5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('decrees');
                  setSelectedDecreeId(null);
                }}
                className={`py-3 border-b-2 transition cursor-pointer whitespace-nowrap ${
                  activeTab === 'decrees'
                    ? 'border-slate-900 text-slate-900'
                    : 'border-transparent text-slate-400 hover:text-slate-700'
                }`}
              >
                执政法令 ({activeDecreeIds.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('cabinet');
                  setSelectedDecreeId(null);
                }}
                className={`py-3 border-b-2 transition cursor-pointer whitespace-nowrap ${
                  activeTab === 'cabinet'
                    ? 'border-slate-900 text-slate-900'
                    : 'border-transparent text-slate-400 hover:text-slate-700'
                }`}
              >
                内阁大臣 (4 席)
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('stability');
                  setSelectedDecreeId(null);
                }}
                className={`py-3 border-b-2 transition cursor-pointer whitespace-nowrap ${
                  activeTab === 'stability'
                    ? 'border-slate-900 text-slate-900'
                    : 'border-transparent text-slate-400 hover:text-slate-700'
                }`}
              >
                稳定与民意
              </button>
            </div>

            {activeTab === 'decrees' && (
              <div className="flex items-center gap-1.5 py-2 overflow-x-auto text-[11px]">
                {[
                  { id: 'all', label: '全部' },
                  { id: 'branch_economy', label: '经济' },
                  { id: 'branch_military', label: '军事' },
                  { id: 'branch_society', label: '民生' },
                  { id: 'branch_technology', label: '科技' },
                ].map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setSelectedBranch(b.id)}
                    className={`px-2.5 py-1 rounded-md transition cursor-pointer whitespace-nowrap ${
                      selectedBranch === b.id
                        ? 'bg-slate-900 text-white font-medium'
                        : 'text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* 4. 核心工作区 (Clean Editorial Policy List & Detail) */}
          {/* ========================================================================= */}
          <div className="p-5 space-y-4">
          
          {/* TAB 1: 执政法令列表 */}
          {activeTab === 'decrees' && (
            <div className="space-y-4">
              
              {/* 法令路线分组列表 */}
              <div className="space-y-4">
                {branchGroups.map((branch) => (
                  <div key={branch.id} className="space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 pt-1">
                      {branch.icon}
                      <span>{branch.name}</span>
                    </div>

                    <div className="border border-slate-200/80 rounded-xl divide-y divide-slate-100 overflow-hidden bg-white">
                      {branch.decrees.map((decree) => {
                        const statusInfo = getDecreeStatus(decree);
                        const isActive = statusInfo.status === 'active';
                        const isSelected = selectedDecreeId === decree.id;

                        return (
                          <div
                            key={decree.id}
                            onClick={() => setSelectedDecreeId(isSelected ? null : decree.id)}
                            className={`p-3.5 transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                              isSelected
                                ? 'bg-slate-50'
                                : 'hover:bg-slate-50/70'
                            }`}
                          >
                            {/* 左侧：状态指示、名称、一句话描述 */}
                            <div className="flex items-start gap-2.5 min-w-0 flex-1">
                              {/* 状态标记 */}
                              <div className="mt-0.5 flex-shrink-0">
                                {isActive ? (
                                  <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                                    <Check className="w-2.5 h-2.5" />
                                  </span>
                                ) : statusInfo.status === 'available' ? (
                                  <span className="w-4 h-4 rounded-full border border-slate-300 flex items-center justify-center" />
                                ) : (
                                  <span className="w-4 h-4 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
                                    <Lock className="w-2.5 h-2.5" />
                                  </span>
                                )}
                              </div>

                              <div className="min-w-0 flex-1 space-y-0.5">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="text-xs sm:text-sm font-semibold text-slate-900">
                                    {decree.name}
                                  </h4>
                                  {isActive && (
                                    <span className="text-[10px] text-emerald-700 font-medium">
                                      施行中
                                    </span>
                                  )}
                                  {decree.prerequisiteName && !isActive && (
                                    <span className="text-[10px] text-slate-400">
                                      前置: {decree.prerequisiteName}
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-slate-500 leading-relaxed truncate">
                                  {decree.description}
                                </p>
                              </div>
                            </div>

                            {/* 右侧：关键影响、开销、审议按钮 */}
                            <div className="flex items-center justify-between sm:justify-end gap-3 flex-shrink-0 text-xs">
                              {/* 关键效果 */}
                              <div className="flex items-center gap-2 font-mono text-[11px]">
                                {decree.effects.milCapacityMultiplier && (
                                  <span className={decree.effects.milCapacityMultiplier > 0 ? 'text-emerald-700' : 'text-rose-600'}>
                                    军工 {decree.effects.milCapacityMultiplier > 0 ? '+' : ''}
                                    {decree.effects.milCapacityMultiplier * 100}%
                                  </span>
                                )}
                                {decree.effects.civCapacityMultiplier && (
                                  <span className={decree.effects.civCapacityMultiplier > 0 ? 'text-emerald-700' : 'text-rose-600'}>
                                    民工 {decree.effects.civCapacityMultiplier > 0 ? '+' : ''}
                                    {decree.effects.civCapacityMultiplier * 100}%
                                  </span>
                                )}
                                {decree.effects.stabilityBonus && (
                                  <span className={decree.effects.stabilityBonus > 0 ? 'text-emerald-700' : 'text-rose-600'}>
                                    稳定 {decree.effects.stabilityBonus > 0 ? '+' : ''}
                                    {decree.effects.stabilityBonus}%
                                  </span>
                                )}
                                {decree.effects.popularApprovalBonus && (
                                  <span className={decree.effects.popularApprovalBonus > 0 ? 'text-emerald-700' : 'text-amber-700'}>
                                    民意 {decree.effects.popularApprovalBonus > 0 ? '+' : ''}
                                    {decree.effects.popularApprovalBonus}%
                                  </span>
                                )}
                              </div>

                              <span className="text-slate-400 font-mono text-[11px] hidden md:inline">
                                {decree.upkeepCostCiv} 产能/月
                              </span>

                              <span className={`text-[11px] font-medium transition flex items-center gap-0.5 ${
                                isSelected ? 'text-slate-900 font-bold' : 'text-slate-400 hover:text-slate-700'
                              }`}>
                                {isSelected ? '收起' : '审议'}
                                <ChevronRight className={`w-3 h-3 transition-transform ${isSelected ? 'rotate-90' : ''}`} />
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* 展开的审议决策抽屉 (Inline Restrained Drawer) */}
              {selectedDecree && (
                <div className="mt-4 p-4 rounded-xl border border-slate-900 bg-white space-y-3.5 shadow-sm animate-in fade-in">
                  <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-2.5">
                    <div>
                      <div className="text-[11px] text-slate-500 font-medium">
                        {selectedDecree.branchName} · Tier {selectedDecree.tier || 1}
                      </div>
                      <h4 className="text-sm sm:text-base font-bold text-slate-900 mt-0.5">
                        {selectedDecree.name}
                      </h4>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedDecreeId(null)}
                      className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* 政策背景立意 */}
                  {selectedDecree.historicalContext && (
                    <p className="text-xs text-slate-600 leading-relaxed italic bg-slate-50 p-2.5 rounded-lg">
                      “{selectedDecree.historicalContext}”
                    </p>
                  )}

                  {/* Before → After 指标推演 */}
                  {(() => {
                    const isActive = activeDecreeIds.includes(selectedDecree.id);
                    const { projStability, stabDelta, projApproval, appDelta } = calculateProjectedMetrics(
                      selectedDecree,
                      isActive
                    );

                    return (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        <div className="p-2.5 bg-slate-50/70 rounded-lg">
                          <span className="text-[11px] text-slate-400 block">全国稳定性</span>
                          <div className="flex items-center gap-1 mt-0.5 font-mono font-semibold">
                            <span>{stability}%</span>
                            <ArrowRight className="w-3 h-3 text-slate-400" />
                            <span className={projStability >= stability ? 'text-emerald-700' : 'text-rose-700'}>
                              {projStability}%
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            {stabDelta >= 0 ? `+${stabDelta}%` : `${stabDelta}%`}
                          </span>
                        </div>

                        <div className="p-2.5 bg-slate-50/70 rounded-lg">
                          <span className="text-[11px] text-slate-400 block">民意支持度</span>
                          <div className="flex items-center gap-1 mt-0.5 font-mono font-semibold">
                            <span>{approval}%</span>
                            <ArrowRight className="w-3 h-3 text-slate-400" />
                            <span className={projApproval >= approval ? 'text-emerald-700' : 'text-amber-700'}>
                              {projApproval}%
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            {appDelta >= 0 ? `+${appDelta}%` : `${appDelta}%`}
                          </span>
                        </div>

                        <div className="p-2.5 bg-slate-50/70 rounded-lg">
                          <span className="text-[11px] text-slate-400 block">产能影响</span>
                          <div className="font-mono text-xs font-semibold mt-0.5">
                            {selectedDecree.effects.milCapacityMultiplier && (
                              <span className={selectedDecree.effects.milCapacityMultiplier > 0 ? 'text-emerald-700' : 'text-slate-700'}>
                                军工 {selectedDecree.effects.milCapacityMultiplier > 0 ? '+' : ''}{selectedDecree.effects.milCapacityMultiplier * 100}%
                              </span>
                            )}
                            {selectedDecree.effects.civCapacityMultiplier && (
                              <span className={`ml-1 ${selectedDecree.effects.civCapacityMultiplier > 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                                民工 {selectedDecree.effects.civCapacityMultiplier > 0 ? '+' : ''}{selectedDecree.effects.civCapacityMultiplier * 100}%
                              </span>
                            )}
                            {!selectedDecree.effects.milCapacityMultiplier && !selectedDecree.effects.civCapacityMultiplier && (
                              <span className="text-slate-400">无直接修正</span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 block mt-0.5">制度产出加成</span>
                        </div>

                        <div className="p-2.5 bg-slate-50/70 rounded-lg">
                          <span className="text-[11px] text-slate-400 block">月度维系开销</span>
                          <div className="font-mono text-xs font-semibold text-slate-900 mt-0.5">
                            {selectedDecree.upkeepCostCiv} 产能/月
                          </div>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            {isActive ? '当前已划扣' : '施行后自动划扣'}
                          </span>
                        </div>
                      </div>
                    );
                  })()}

                  {/* 决策操作栏 */}
                  <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100 flex-wrap text-xs">
                    <div className="text-slate-500">
                      {(() => {
                        const statusCheck = getDecreeStatus(selectedDecree);
                        if (statusCheck.status === 'locked_prereq' || statusCheck.status === 'locked_condition') {
                          return <span className="text-rose-600 font-medium">{statusCheck.reason}</span>;
                        }
                        return activeDecreeIds.includes(selectedDecree.id)
                          ? '该法令目前正在全境施行中。'
                          : '满足施行条件，可随时颁布生效。';
                      })()}
                    </div>

                    <div className="flex items-center gap-2">
                      {activeDecreeIds.includes(selectedDecree.id) ? (
                        <button
                          type="button"
                          onClick={() => handleToggleDecree(selectedDecree)}
                          className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition cursor-pointer flex items-center gap-1.5"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>废止该法令</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleToggleDecree(selectedDecree)}
                          disabled={getDecreeStatus(selectedDecree).status !== 'available'}
                          className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                            getDecreeStatus(selectedDecree).status === 'available'
                              ? 'bg-slate-900 hover:bg-slate-800 text-white cursor-pointer'
                              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>颁布施行</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: 内阁大臣 */}
          {activeTab === 'cabinet' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-500 leading-relaxed">
                为四大核心职务委任内阁大臣。每位大臣具备专属执政特质（Trait），直接提供常驻国家加成。
              </p>

              {(['defense', 'finance', 'foreign', 'industry'] as const).map((role) => {
                const roleConfig = {
                  defense: { title: '国防统领府', desc: '掌控军队装备动员与战时防御' },
                  finance: { title: '财政总署', desc: '调控国家税收效率与国库储备' },
                  foreign: { title: '外交特使公署', desc: '主理国际条约谈判与使馆事务' },
                  industry: { title: '工业科技部', desc: '统筹民工军工产能与前沿科研' },
                }[role];

                const currentMinisterId = appointedMinisters[role];
                const candidates = PRESET_MINISTERS.filter((m) => m.role === role);

                return (
                  <div key={role} className="border border-slate-200/80 rounded-xl p-3.5 bg-white space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900">{roleConfig.title}</h4>
                        <span className="text-[11px] text-slate-400">{roleConfig.desc}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {candidates.map((cand) => {
                        const isAppointed = currentMinisterId === cand.id;
                        return (
                          <div
                            key={cand.id}
                            className={`p-3 rounded-lg border transition text-xs flex flex-col justify-between ${
                              isAppointed
                                ? 'bg-slate-50 border-slate-900 ring-1 ring-slate-900'
                                : 'bg-white border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-slate-900">{cand.name}</span>
                                <span className="text-[10px] text-slate-500 font-mono">{cand.trait}</span>
                              </div>
                              <p className="text-[11px] text-slate-500 leading-relaxed">
                                {cand.description}
                              </p>
                            </div>

                            <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-100">
                              <div className="text-[10px] font-mono text-emerald-700 flex gap-2">
                                {cand.buffs.milProductionBuff && <span>军工 +{cand.buffs.milProductionBuff}%</span>}
                                {cand.buffs.civProductionBuff && <span>民工 +{cand.buffs.civProductionBuff}%</span>}
                                {cand.buffs.diploBuff && <span>外交 +{cand.buffs.diploBuff}%</span>}
                                {cand.buffs.stability && <span>稳定 +{cand.buffs.stability}%</span>}
                              </div>

                              <button
                                type="button"
                                onClick={() => handleAppointMinister(role, cand.id)}
                                disabled={isAppointed}
                                className={`px-2.5 py-1 rounded text-xs font-semibold transition cursor-pointer ${
                                  isAppointed
                                    ? 'bg-slate-200 text-slate-700 cursor-default'
                                    : 'bg-slate-900 hover:bg-slate-800 text-white'
                                }`}
                              >
                                {isAppointed ? '在任' : '任命'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 3: 稳定度与民意评估 */}
          {activeTab === 'stability' && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-1">
                  <span className="text-[11px] text-slate-500">全国综合稳定性</span>
                  <div className="text-2xl font-bold font-mono text-slate-900">{stability}%</div>
                  <p className="text-[11px] text-slate-500 pt-1">
                    高稳定性可保障全境工厂满负荷运转，降低政变风险。
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-1">
                  <span className="text-[11px] text-slate-500">国民民意支持率</span>
                  <div className="text-2xl font-bold font-mono text-slate-900">{approval}%</div>
                  <p className="text-[11px] text-slate-500 pt-1">
                    民意决定全境适役青年入伍积极性与常备师团组织度。
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2.5">
                <h4 className="font-semibold text-slate-900 pb-2 border-b border-slate-100">
                  稳定性动态构成明细：
                </h4>
                <div className="space-y-2 text-[11px]">
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-600">已施行国策法令</span>
                    <span className="font-mono text-emerald-700 font-semibold">
                      +{activeDecreeIds.length * 5}%
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-600">外部战事影响</span>
                    <span className="font-mono text-rose-600 font-semibold">
                      {(myNation.activeWars?.length || 0) > 0
                        ? `-${(myNation.activeWars?.length || 0) * 12}% (交火中)`
                        : '0% (和平)'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-600">内阁执政特质</span>
                    <span className="font-mono text-emerald-700 font-semibold">+8%</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-600">基建与民生底座</span>
                    <span className="font-mono text-emerald-700 font-semibold">+10%</span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  </div>
);
};
