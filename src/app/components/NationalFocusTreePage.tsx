import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import {
  Sparkles,
  Minus,
  Plus,
  Maximize2,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  X,
  Crown,
  Search,
  Landmark,
  Building2,
  Swords,
  Globe,
  Radio,
  Stamp,
} from 'lucide-react';
import { Nation, FocusStatus, NationalFocusNode, ActiveNationalFocus } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  NATIONAL_FOCUS_NODES,
  FOCUS_NODE_MAP,
  getFocusStatus,
  applyFocusConstructionBonus,
} from '../lib/nationalFocusData';
import { NationalFocusNodeCard } from './NationalFocusNodeCard';
import { NationalFocusModal } from './NationalFocusModal';
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

interface NationalFocusTreePageProps {
  nation: Nation | null;
  onUpdateNation?: (updated: Partial<Nation>) => void;
  onNavigateTab?: (tab: string) => void;
  onClose?: () => void;
}

type BranchFilter = 'all' | 'politics' | 'economy' | 'military' | 'diplomacy' | 'tier4';

export const NationalFocusTreePage: React.FC<NationalFocusTreePageProps> = ({
  nation,
  onUpdateNation,
  onNavigateTab,
  onClose,
}) => {
  const { user } = useAuth();

  const handleExit = useCallback(() => {
    if (onClose) {
      onClose();
    } else if (onNavigateTab) {
      onNavigateTab('lobby');
    }
  }, [onClose, onNavigateTab]);

  // World clock timer
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

  // Initial responsive zoom calculation
  const getInitialZoom = () => {
    if (typeof window === 'undefined') return 90;
    if (window.innerWidth < 640) return 65;
    if (window.innerWidth < 1024) return 80;
    return 95;
  };

  // Pan & Zoom State for Draggable Tree
  const [zoomLevel, setZoomLevel] = useState<number>(getInitialZoom);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number; startPanX: number; startPanY: number }>({
    x: 0,
    y: 0,
    startPanX: 0,
    startPanY: 0,
  });
  const dragDistanceRef = useRef<number>(0);
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);

  // Search & Branch Filter
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeBranch, setActiveBranch] = useState<BranchFilter>('all');

  // Modal State for inspecting and formulating focus
  const [modalFocusNode, setModalFocusNode] = useState<NationalFocusNode | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isFormulating, setIsFormulating] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'warn' } | null>(null);

  // Escape key to exit or close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isModalOpen) {
          setIsModalOpen(false);
        } else {
          handleExit();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, handleExit]);

  // Completed focuses list from nation / localStorage fallback
  const completedFocusIds = useMemo(() => {
    if (nation?.completedFocusIds && nation.completedFocusIds.length > 0) {
      return nation.completedFocusIds;
    }
    if (nation?.id) {
      const saved = localStorage.getItem(`focus_completed_${nation.id}`);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // ignore
        }
      }
    }
    return [];
  }, [nation]);

  const activeFocus = useMemo<ActiveNationalFocus | null>(() => {
    if (nation?.activeFocus) return nation.activeFocus;
    if (nation?.id) {
      const saved = localStorage.getItem(`focus_active_${nation.id}`);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // ignore
        }
      }
    }
    return null;
  }, [nation]);

  // Total count & progress percentage
  const totalFocusCount = NATIONAL_FOCUS_NODES.length;
  const completedCount = completedFocusIds.length;
  const progressPercent = Math.round((completedCount / totalFocusCount) * 100);

  // Zoom handlers
  const handleZoomIn = () => setZoomLevel((prev) => Math.min(150, prev + 10));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(45, prev - 10));
  const handleResetPanAndZoom = () => {
    setZoomLevel(getInitialZoom());
    setPanOffset({ x: 0, y: 0 });
    setActiveBranch('all');
    setSearchQuery('');
  };

  // Branch Quick Jump
  const handleJumpBranch = (branch: BranchFilter) => {
    setActiveBranch(branch);
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const baseZoom = isMobile ? 70 : 95;
    setZoomLevel(baseZoom);

    switch (branch) {
      case 'all':
        setPanOffset({ x: 0, y: 0 });
        break;
      case 'politics':
        setPanOffset({ x: isMobile ? 360 : 640, y: -20 });
        break;
      case 'economy':
        setPanOffset({ x: isMobile ? 120 : 210, y: -20 });
        break;
      case 'military':
        setPanOffset({ x: isMobile ? -120 : -210, y: -20 });
        break;
      case 'diplomacy':
        setPanOffset({ x: isMobile ? -360 : -640, y: -20 });
        break;
      case 'tier4':
        setPanOffset({ x: 0, y: -380 });
        break;
    }
  };

  // Mouse drag to pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    dragDistanceRef.current = 0;
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      startPanX: panOffset.x,
      startPanY: panOffset.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    dragDistanceRef.current = Math.hypot(dx, dy);

    setPanOffset({
      x: dragStartRef.current.startPanX + dx,
      y: dragStartRef.current.startPanY + dy,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch drag & pinch zoom handlers
  const touchDistanceRef = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      dragDistanceRef.current = 0;
      const touch = e.touches[0];
      dragStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        startPanX: panOffset.x,
        startPanY: panOffset.y,
      };
      touchDistanceRef.current = null;
    } else if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchDistanceRef.current = dist;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDragging) {
      const touch = e.touches[0];
      const dx = touch.clientX - dragStartRef.current.x;
      const dy = touch.clientY - dragStartRef.current.y;
      dragDistanceRef.current = Math.hypot(dx, dy);

      setPanOffset({
        x: dragStartRef.current.startPanX + dx,
        y: dragStartRef.current.startPanY + dy,
      });
    } else if (e.touches.length === 2 && touchDistanceRef.current !== null) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const delta = (dist - touchDistanceRef.current) * 0.2;
      touchDistanceRef.current = dist;
      setZoomLevel((prev) => Math.min(150, Math.max(45, prev + delta)));
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    touchDistanceRef.current = null;
  };

  // Wheel zoom handler
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      setZoomLevel((prev) => {
        const delta = e.deltaY < 0 ? 6 : -6;
        return Math.min(150, Math.max(45, prev + delta));
      });
    } else {
      setPanOffset((prev) => ({
        x: prev.x - e.deltaX * 0.8,
        y: prev.y - e.deltaY * 0.8,
      }));
    }
  }, []);

  // Node selection handler
  const handleNodeClick = (node: NationalFocusNode) => {
    if (dragDistanceRef.current > 5) {
      return;
    }
    setModalFocusNode(node);
    setIsModalOpen(true);
  };

  const handlePrerequisiteSelect = (nodeId: string) => {
    const targetNode = FOCUS_NODE_MAP.get(nodeId);
    if (targetNode) {
      setModalFocusNode(targetNode);
    }
  };

  // Formulate focus
  const handleFormulateFocus = (node: NationalFocusNode) => {
    if (!nation) {
      showToast('请先登录并宣告国家后制定国策', 'warn');
      return;
    }

    const status = getFocusStatus(node.id, completedFocusIds, activeFocus);
    if (status === 'completed') {
      showToast('该项国策已经实施完毕', 'warn');
      return;
    }
    if (status === 'locked') {
      showToast('前置国策尚未满足，无法制定', 'warn');
      return;
    }

    setIsFormulating(true);

    const newCompleted = [...completedFocusIds, node.id];

    if (nation.id) {
      localStorage.setItem(`focus_completed_${nation.id}`, JSON.stringify(newCompleted));
    }

    // 结算工厂建设加成（如果此国策包含民工/军工建造）
    const constructionResult = applyFocusConstructionBonus(nation, node);
    const updatedPayload: Partial<Nation> = {
      completedFocusIds: newCompleted,
      civilianFactories: constructionResult.updatedNation.civilianFactories,
      militaryFactories: constructionResult.updatedNation.militaryFactories,
      totalFactories: constructionResult.updatedNation.totalFactories,
      provinces: constructionResult.updatedNation.provinces,
      economy: constructionResult.updatedNation.economy,
    };

    if (onUpdateNation) {
      onUpdateNation(updatedPayload);
    }

    setTimeout(() => {
      setIsFormulating(false);
      if (constructionResult.summaryText) {
        showToast(constructionResult.summaryText, 'success');
      } else {
        showToast(`国策【${node.name}】已成功颁布实施！效果已永久生效于国家`, 'success');
      }
    }, 350);
  };

  const showToast = (text: string, type: 'success' | 'warn') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Check if a node matches search
  const isNodeHighlighted = (node: NationalFocusNode) => {
    if (!searchQuery.trim()) return false;
    const q = searchQuery.toLowerCase().trim();
    return (
      node.name.toLowerCase().includes(q) ||
      node.subtitle.toLowerCase().includes(q) ||
      node.branchName.toLowerCase().includes(q) ||
      node.effects.some((e) => e.text.toLowerCase().includes(q))
    );
  };

  // Matched search count
  const matchCount = useMemo(() => {
    if (!searchQuery.trim()) return 0;
    return NATIONAL_FOCUS_NODES.filter((n) => isNodeHighlighted(n)).length;
  }, [searchQuery]);

  // Grouped nodes
  const rootNode = NATIONAL_FOCUS_NODES[0];
  const politicsNode = NATIONAL_FOCUS_NODES.find((n) => n.id === 'consolidate_nation')!;
  const economyNode = NATIONAL_FOCUS_NODES.find((n) => n.id === 'economic_development')!;
  const militaryNode = NATIONAL_FOCUS_NODES.find((n) => n.id === 'military_modernization')!;
  const diplomacyNode = NATIONAL_FOCUS_NODES.find((n) => n.id === 'diplomatic_strategy')!;

  const tier4Nodes = NATIONAL_FOCUS_NODES.filter((n) => n.tier === 4);

  // Status for modal
  const modalNodeStatus = useMemo<FocusStatus>(() => {
    if (!modalFocusNode) return 'locked';
    return getFocusStatus(modalFocusNode.id, completedFocusIds, activeFocus);
  }, [modalFocusNode, completedFocusIds, activeFocus]);

  // Render a major HOI4 branch column
  const renderBranchColumn = (
    branchKey: BranchFilter,
    branchTitle: string,
    branchSubtitle: string,
    mainNode: NationalFocusNode,
    subNodes: { parent: NationalFocusNode; children: NationalFocusNode[] }[],
    headerIcon: React.ReactNode,
    headerColorClass: string
  ) => {
    const mainStatus = getFocusStatus(mainNode.id, completedFocusIds, activeFocus);
    const isDimmed = activeBranch !== 'all' && activeBranch !== branchKey;

    return (
      <div
        className={`flex flex-col items-center min-w-[390px] max-w-[420px] px-3 transition-all duration-300 ${
          isDimmed ? 'opacity-30 blur-[0.5px]' : 'opacity-100'
        }`}
      >
        {/* HOI4 Branch Header Plaque */}
        <div
          className={`w-full py-2 px-3 rounded-lg border flex items-center justify-between shadow-2xs mb-4 ${headerColorClass}`}
        >
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-black/20">{headerIcon}</span>
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider font-serif">
                {branchTitle}
              </h4>
              <span className="text-[10px] opacity-80 font-mono block">
                {branchSubtitle}
              </span>
            </div>
          </div>
          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-black/30 text-amber-200">
            {subNodes.reduce((acc, s) => acc + s.children.length + 1, 1)} 项国策
          </span>
        </div>

        {/* Tier 1 Main Pillar Node */}
        <div className="flex flex-col items-center relative mb-3">
          <NationalFocusNodeCard
            iconType={mainNode.iconType}
            name={mainNode.name}
            subtitle={mainNode.subtitle}
            tier={mainNode.tier}
            status={mainStatus}
            durationDays={mainNode.durationDays}
            constructionBonus={mainNode.constructionBonus}
            isSelected={modalFocusNode?.id === mainNode.id}
            isHighlighted={isNodeHighlighted(mainNode)}
            width={124}
            onClick={() => handleNodeClick(mainNode)}
          />

          {/* Stepped Connector Conduit downward */}
          <div className="w-[2px] h-7 bg-[#78350f]/80 relative mt-2">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-amber-500 border border-[#78350f]" />
          </div>
        </div>

        {/* Tier 2 Horizontal distribution conduit bar */}
        <div className="w-[92%] relative h-5 mb-3">
          <div className="absolute top-0 left-[16%] right-[16%] h-[2px] bg-[#78350f]/80" />
          <div className="absolute top-0 left-[16%] w-[2px] h-5 bg-[#78350f]/80" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[2px] h-5 bg-[#78350f]/80" />
          <div className="absolute top-0 right-[16%] w-[2px] h-5 bg-[#78350f]/80" />
        </div>

        {/* 3 Sub-Branches Row (Tier 2 & Cascading Tier 3) */}
        <div className="grid grid-cols-3 gap-3 w-full">
          {subNodes.map((sub) => {
            const parentStatus = getFocusStatus(sub.parent.id, completedFocusIds, activeFocus);

            return (
              <div key={sub.parent.id} className="flex flex-col items-center">
                {/* Tier 2 Sub-Branch Node */}
                <NationalFocusNodeCard
                  iconType={sub.parent.iconType}
                  name={sub.parent.name}
                  subtitle={sub.parent.subtitle}
                  tier={sub.parent.tier}
                  status={parentStatus}
                  durationDays={sub.parent.durationDays}
                  constructionBonus={sub.parent.constructionBonus}
                  isSelected={modalFocusNode?.id === sub.parent.id}
                  isHighlighted={isNodeHighlighted(sub.parent)}
                  width={112}
                  onClick={() => handleNodeClick(sub.parent)}
                />

                {/* Stepped line from Tier 2 down to Tier 3 */}
                <div className="w-[2px] h-6 bg-[#78350f]/60 relative my-2">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-slate-500" />
                </div>

                {/* Tier 3 Successor Nodes */}
                <div className="flex flex-col items-center gap-4 w-full">
                  {sub.children.map((child, cIdx) => {
                    const childStatus = getFocusStatus(child.id, completedFocusIds, activeFocus);
                    return (
                      <div key={child.id} className="flex flex-col items-center w-full">
                        <NationalFocusNodeCard
                          iconType={child.iconType}
                          name={child.name}
                          subtitle={child.subtitle}
                          tier={child.tier}
                          status={childStatus}
                          durationDays={child.durationDays}
                          constructionBonus={child.constructionBonus}
                          isSelected={modalFocusNode?.id === child.id}
                          isHighlighted={isNodeHighlighted(child)}
                          width={110}
                          onClick={() => handleNodeClick(child)}
                        />
                        {cIdx < sub.children.length - 1 && (
                          <div className="w-[2px] h-5 bg-[#78350f]/40 my-1 relative">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-slate-400" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const politicsSubNodes = [
    {
      parent: FOCUS_NODE_MAP.get('centralize_power')!,
      children: [FOCUS_NODE_MAP.get('propaganda_department')!, FOCUS_NODE_MAP.get('secret_police')!],
    },
    {
      parent: FOCUS_NODE_MAP.get('perfect_legal_system')!,
      children: [FOCUS_NODE_MAP.get('independent_judiciary')!, FOCUS_NODE_MAP.get('anticorruption_commission')!],
    },
    {
      parent: FOCUS_NODE_MAP.get('cultural_identity')!,
      children: [FOCUS_NODE_MAP.get('nationalist_education')!, FOCUS_NODE_MAP.get('cultural_export')!],
    },
  ];

  const economySubNodes = [
    {
      parent: FOCUS_NODE_MAP.get('infrastructure_construction')!,
      children: [FOCUS_NODE_MAP.get('national_highway_grid')!, FOCUS_NODE_MAP.get('electrification_project')!],
    },
    {
      parent: (FOCUS_NODE_MAP.get('expand_civilian_industry') || FOCUS_NODE_MAP.get('industrialization_push'))!,
      children: [
        (FOCUS_NODE_MAP.get('heavy_industry_cluster'))!,
        (FOCUS_NODE_MAP.get('inland_industrial_evacuation') || FOCUS_NODE_MAP.get('defense_industry'))!,
      ],
    },
    {
      parent: FOCUS_NODE_MAP.get('scientific_foundation')!,
      children: [FOCUS_NODE_MAP.get('electronics_semiconductor')!, FOCUS_NODE_MAP.get('nuclear_research')!],
    },
  ];

  const militarySubNodes = [
    {
      parent: (FOCUS_NODE_MAP.get('military_armament_effort') || FOCUS_NODE_MAP.get('army_expansion'))!,
      children: [
        (FOCUS_NODE_MAP.get('war_effort_factories') || FOCUS_NODE_MAP.get('defense_industry'))!,
        (FOCUS_NODE_MAP.get('defense_industry') || FOCUS_NODE_MAP.get('special_operations_corps'))!,
      ],
    },
    {
      parent: FOCUS_NODE_MAP.get('army_expansion')!,
      children: [FOCUS_NODE_MAP.get('mechanized_divisions')!, FOCUS_NODE_MAP.get('special_operations_corps')!],
    },
    {
      parent: FOCUS_NODE_MAP.get('airforce_development')!,
      children: [FOCUS_NODE_MAP.get('strategic_bombing')!, FOCUS_NODE_MAP.get('close_air_support')!],
    },
  ];

  const diplomacySubNodes = [
    {
      parent: FOCUS_NODE_MAP.get('regional_cooperation')!,
      children: [FOCUS_NODE_MAP.get('customs_union')!, FOCUS_NODE_MAP.get('continental_free_trade')!],
    },
    {
      parent: FOCUS_NODE_MAP.get('strategic_alliance')!,
      children: [FOCUS_NODE_MAP.get('joint_high_command')!, FOCUS_NODE_MAP.get('mutual_security_pact')!],
    },
    {
      parent: FOCUS_NODE_MAP.get('global_influence')!,
      children: [FOCUS_NODE_MAP.get('global_arbitration')!, FOCUS_NODE_MAP.get('world_order_architect')!],
    },
  ];

  const displayName = user?.douyinName || user?.username || nation?.name || '最高统帅';

  return (
    <div className="fixed inset-0 z-50 w-screen h-screen bg-[#ece7dc] text-slate-900 select-none overflow-hidden flex flex-col font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-fadeIn">
          <div
            className={`px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-bold border-2 backdrop-blur-md ${
              toastMessage.type === 'success'
                ? 'bg-[#1b382b] text-emerald-100 border-emerald-500/70'
                : 'bg-[#451a03] text-amber-100 border-amber-500/70'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Top Header Bar: 纯图标返回 + 1936国家战略中枢 + 快速分类导航 */}
      <header className="px-3 sm:px-5 py-2 bg-[#2d3748] text-slate-100 border-b-2 border-[#1a202c] sticky top-0 z-20 flex items-center justify-between shadow-md gap-2">
        {/* Left: 纯图标返回按钮 (无文字) + 搜索 */}
        <div className="flex items-center gap-2.5 shrink-0">
          {(onClose || onNavigateTab) && (
            <button
              type="button"
              onClick={handleExit}
              className="w-8 h-8 rounded-lg border border-slate-600 bg-slate-800 hover:bg-slate-700 text-slate-200 shadow-2xs flex items-center justify-center transition cursor-pointer active:scale-95 shrink-0"
              title="返回国家政务 (Esc)"
              aria-label="返回"
            >
              <ArrowLeft className="w-4 h-4 text-slate-200" />
            </button>
          )}

          {/* Quick Search */}
          <div className="relative hidden md:flex items-center">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="检索国策路线 (如: 工业, 军备, 宪政)..."
              className="pl-8 pr-7 py-1 text-xs rounded-lg border border-slate-600 bg-slate-900/80 text-slate-100 placeholder:text-slate-400 focus:bg-slate-900 focus:border-amber-400 focus:outline-hidden w-48 transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            {searchQuery && (
              <span className="absolute -bottom-4 left-1 text-[9px] font-mono text-amber-400 font-bold">
                匹配: {matchCount} 项
              </span>
            )}
          </div>
        </div>

        {/* Center: 领袖/国家身份 + 战略进度 + 世界时钟 */}
        <div className="flex items-center gap-2 sm:gap-3 bg-slate-900/80 border border-slate-700 px-3 py-1 rounded-lg shadow-inner">
          {/* 国徽/头像 */}
          <div className="w-6 h-6 rounded-md bg-indigo-700 text-white flex items-center justify-center font-bold text-xs shadow-2xs overflow-hidden shrink-0 border border-amber-400/40">
            {nation?.flagUrl ? (
              <img src={nation.flagUrl} alt="" className="w-full h-full object-cover" />
            ) : user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <Crown className="w-3.5 h-3.5 text-amber-300" />
            )}
          </div>

          {/* 领袖名/国名 */}
          <span className="text-xs font-black text-amber-300 truncate max-w-[90px] sm:max-w-[150px] font-serif">
            {displayName}
          </span>

          <div className="w-px h-3.5 bg-slate-700 hidden sm:block" />

          {/* 战略实施进度 */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono">
            <span className="text-[10px] text-slate-400">已颁布:</span>
            <strong className="text-amber-400 font-bold">{completedCount}/{totalFocusCount}</strong>
            <span className="text-[10px] text-emerald-400 font-semibold">({progressPercent}%)</span>
          </div>

          {/* 工厂产能显示 (实时展示建设国策收益) */}
          {nation && (
            <>
              <div className="w-px h-3.5 bg-slate-700 hidden md:block" />
              <div className="hidden md:flex items-center gap-2.5 text-xs font-mono">
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-amber-400 shrink-0" />
                  <span>民工:</span>
                  <strong className="text-amber-300 font-bold">
                    {nation.civilianFactories ?? Math.floor((nation.totalFactories || 0) * 0.6)}
                  </strong>
                </span>
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Swords className="w-3 h-3 text-rose-400 shrink-0" />
                  <span>军工:</span>
                  <strong className="text-rose-300 font-bold">
                    {nation.militaryFactories ?? Math.ceil((nation.totalFactories || 0) * 0.4)}
                  </strong>
                </span>
              </div>
            </>
          )}

          <div className="w-px h-3.5 bg-slate-700" />

          {/* 世界时钟 */}
          <div className="flex items-center gap-1 text-xs font-mono font-bold text-slate-200">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <time className="tabular-nums">
              {worldClockStart ? formatWorldTime(worldClockStart, now) : '1936/1/1'}
            </time>
          </div>
        </div>

        {/* Right: 分支快速切换 + 退出 */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="hidden lg:flex items-center gap-1 bg-slate-900/90 p-0.5 rounded-lg border border-slate-700">
            <button
              type="button"
              onClick={() => handleJumpBranch('all')}
              className={`px-2.5 py-1 rounded text-[11px] font-bold transition cursor-pointer ${
                activeBranch === 'all' ? 'bg-amber-600 text-white shadow-2xs' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              全景
            </button>
            <button
              type="button"
              onClick={() => handleJumpBranch('politics')}
              className={`px-2.5 py-1 rounded text-[11px] font-bold transition cursor-pointer ${
                activeBranch === 'politics' ? 'bg-indigo-700 text-white shadow-2xs' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              政治
            </button>
            <button
              type="button"
              onClick={() => handleJumpBranch('economy')}
              className={`px-2.5 py-1 rounded text-[11px] font-bold transition cursor-pointer ${
                activeBranch === 'economy' ? 'bg-amber-700 text-white shadow-2xs' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              工业
            </button>
            <button
              type="button"
              onClick={() => handleJumpBranch('military')}
              className={`px-2.5 py-1 rounded text-[11px] font-bold transition cursor-pointer ${
                activeBranch === 'military' ? 'bg-rose-800 text-white shadow-2xs' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              军事
            </button>
            <button
              type="button"
              onClick={() => handleJumpBranch('diplomacy')}
              className={`px-2.5 py-1 rounded text-[11px] font-bold transition cursor-pointer ${
                activeBranch === 'diplomacy' ? 'bg-sky-800 text-white shadow-2xs' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              外交
            </button>
            <button
              type="button"
              onClick={() => handleJumpBranch('tier4')}
              className={`px-2.5 py-1 rounded text-[11px] font-bold transition cursor-pointer ${
                activeBranch === 'tier4' ? 'bg-yellow-600 text-slate-950 shadow-2xs font-black' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              超级工程
            </button>
          </div>

          {(onClose || onNavigateTab) && (
            <button
              type="button"
              onClick={handleExit}
              className="w-8 h-8 rounded-lg border border-slate-600 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-100 shadow-2xs flex items-center justify-center transition cursor-pointer active:scale-95 shrink-0"
              title="退出国策树 (Esc)"
              aria-label="退出"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* Mobile Branch Quick Navigator */}
      <div className="lg:hidden px-3 py-1.5 bg-[#252f3e] border-b border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => handleJumpBranch('all')}
          className={`px-2.5 py-1 rounded text-[11px] font-bold whitespace-nowrap transition cursor-pointer shrink-0 ${
            activeBranch === 'all' ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-300 border border-slate-700'
          }`}
        >
          全景总览
        </button>
        <button
          type="button"
          onClick={() => handleJumpBranch('politics')}
          className={`px-2.5 py-1 rounded text-[11px] font-bold whitespace-nowrap transition cursor-pointer shrink-0 ${
            activeBranch === 'politics' ? 'bg-indigo-700 text-white' : 'bg-slate-800 text-slate-300 border border-slate-700'
          }`}
        >
          政治与宪政
        </button>
        <button
          type="button"
          onClick={() => handleJumpBranch('economy')}
          className={`px-2.5 py-1 rounded text-[11px] font-bold whitespace-nowrap transition cursor-pointer shrink-0 ${
            activeBranch === 'economy' ? 'bg-amber-700 text-white' : 'bg-slate-800 text-slate-300 border border-slate-700'
          }`}
        >
          工业与经济
        </button>
        <button
          type="button"
          onClick={() => handleJumpBranch('military')}
          className={`px-2.5 py-1 rounded text-[11px] font-bold whitespace-nowrap transition cursor-pointer shrink-0 ${
            activeBranch === 'military' ? 'bg-rose-800 text-white' : 'bg-slate-800 text-slate-300 border border-slate-700'
          }`}
        >
          国防与军事
        </button>
        <button
          type="button"
          onClick={() => handleJumpBranch('diplomacy')}
          className={`px-2.5 py-1 rounded text-[11px] font-bold whitespace-nowrap transition cursor-pointer shrink-0 ${
            activeBranch === 'diplomacy' ? 'bg-sky-800 text-white' : 'bg-slate-800 text-slate-300 border border-slate-700'
          }`}
        >
          地缘与外交
        </button>
        <button
          type="button"
          onClick={() => handleJumpBranch('tier4')}
          className={`px-2.5 py-1 rounded text-[11px] font-bold whitespace-nowrap transition cursor-pointer shrink-0 ${
            activeBranch === 'tier4' ? 'bg-yellow-600 text-slate-950 font-black' : 'bg-slate-800 text-slate-300 border border-slate-700'
          }`}
        >
          超级工程
        </button>
      </div>

      {/* Main Interactive War Room Canvas Area */}
      <div className="flex-1 relative flex flex-col min-w-0 bg-[#ece7dc] overflow-hidden">
        {/* Vintage Topographical / Archival Grid Texture */}
        <div
          className="absolute inset-0 opacity-[0.045] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(#1e293b 1.2px, transparent 1.2px), radial-gradient(#1e293b 1.2px, #ece7dc 1.2px)`,
            backgroundSize: '40px 40px',
            backgroundPosition: '0 0, 20px 20px',
          }}
        />

        {/* Watermark Strategic Coordinates */}
        <div className="absolute top-4 left-6 pointer-events-none opacity-20 font-mono text-[10px] text-slate-800 uppercase tracking-widest">
          TOP SECRET / STRATEGIC WAR PLANNING GRID 1936-A
        </div>

        {/* Graphical Pannable & Zoomable Tree */}
        <div
          ref={canvasContainerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onWheel={handleWheel}
          className={`flex-1 w-full h-full overflow-hidden relative select-none ${
            isDragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
        >
          {/* Draggable Tree Content */}
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{
              transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
              transition: isDragging ? 'none' : 'transform 0.12s ease-out',
            }}
          >
            <div
              className="origin-center flex flex-col items-center min-w-[1720px] max-w-[1880px] py-12 pointer-events-auto"
              style={{
                transform: `scale(${zoomLevel / 100})`,
                transition: 'transform 0.15s ease-out',
              }}
            >
              {/* 1. Level 0: 顶层战略决策 (Root Tier 1936 Decision) */}
              <div className="flex flex-col items-center relative mb-4">
                <NationalFocusNodeCard
                  iconType={rootNode.iconType}
                  name={rootNode.name}
                  subtitle={rootNode.subtitle}
                  tier={rootNode.tier}
                  status={getFocusStatus(rootNode.id, completedFocusIds, activeFocus)}
                  durationDays={rootNode.durationDays}
                  isSelected={modalFocusNode?.id === rootNode.id}
                  isHighlighted={isNodeHighlighted(rootNode)}
                  width={142}
                  onClick={() => handleNodeClick(rootNode)}
                />

                <span className="text-[10px] font-black text-amber-950 bg-gradient-to-r from-amber-200 via-amber-100 to-amber-200 border border-amber-400 px-3 py-0.5 rounded mt-2 shadow-2xs font-mono uppercase tracking-wider">
                  ★ 1936 国家最高战略纲领 ★
                </span>

                {/* Main Stepped Conduit Downward to 4 Pillars */}
                <div className="w-[2px] h-10 bg-[#78350f] relative mt-2">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-amber-400 border-2 border-[#78350f] shadow-2xs" />
                </div>
              </div>

              {/* 2. Main Horizontal Conduit Line for 4 Branches */}
              <div className="w-[88%] max-w-[1620px] relative h-6 mb-2">
                <div className="absolute top-0 left-[12%] right-[12%] h-[2px] bg-[#78350f]" />
                <div className="absolute top-0 left-[12%] w-[2px] h-6 bg-[#78350f]" />
                <div className="absolute top-0 left-[37.5%] w-[2px] h-6 bg-[#78350f]" />
                <div className="absolute top-0 left-[62.5%] w-[2px] h-6 bg-[#78350f]" />
                <div className="absolute top-0 right-[12%] w-[2px] h-6 bg-[#78350f]" />
              </div>

              {/* 3. Level 1 & 2 & 3: 4 Main Strategic Pillars Columns */}
              <div className="grid grid-cols-4 w-full gap-8 max-w-[1780px] mb-10">
                {renderBranchColumn(
                  'politics',
                  '政治与宪政体制',
                  'POLITICAL & CONSTITUTION',
                  politicsNode,
                  politicsSubNodes,
                  <Landmark className="w-4 h-4 text-indigo-200" />,
                  'bg-[#282a36] text-indigo-100 border-indigo-900/80'
                )}
                {renderBranchColumn(
                  'economy',
                  '工业与战时经济',
                  'INDUSTRY & PRODUCTION',
                  economyNode,
                  economySubNodes,
                  <Building2 className="w-4 h-4 text-amber-200" />,
                  'bg-[#342416] text-amber-100 border-amber-900/80'
                )}
                {renderBranchColumn(
                  'military',
                  '国防与军事现代化',
                  'DEFENSE & ARMED FORCES',
                  militaryNode,
                  militarySubNodes,
                  <Swords className="w-4 h-4 text-rose-200" />,
                  'bg-[#361c1c] text-rose-100 border-rose-900/80'
                )}
                {renderBranchColumn(
                  'diplomacy',
                  '地缘外交与同盟',
                  'DIPLOMACY & ALLIANCES',
                  diplomacyNode,
                  diplomacySubNodes,
                  <Globe className="w-4 h-4 text-sky-200" />,
                  'bg-[#192b38] text-sky-100 border-sky-900/80'
                )}
              </div>

              {/* 4. Level 4: 终极战略超级工程 (Tier IV Super-Projects) */}
              <div
                className={`w-full max-w-[1500px] mt-4 pt-6 border-t-2 border-dashed border-[#78350f]/50 flex flex-col items-center transition-all duration-300 ${
                  activeBranch !== 'all' && activeBranch !== 'tier4' ? 'opacity-30 blur-[0.5px]' : 'opacity-100'
                }`}
              >
                <div className="flex items-center gap-2 mb-6 bg-[#2d3748] px-4 py-1.5 rounded-lg border border-amber-500/50 shadow-md">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <h3 className="text-xs font-black text-amber-300 tracking-wider font-serif uppercase">
                    国家终极战略超级工程 (Tier IV Strategic Super-Projects)
                  </h3>
                  <Sparkles className="w-4 h-4 text-amber-400" />
                </div>

                <div className="grid grid-cols-3 gap-12 w-full max-w-[1240px]">
                  {tier4Nodes.map((node) => {
                    const status = getFocusStatus(node.id, completedFocusIds, activeFocus);
                    return (
                      <div
                        key={node.id}
                        className="flex flex-col items-center p-4 rounded-xl bg-gradient-to-b from-[#fbf8f0] to-[#eae4d5] border-2 border-[#b45309]/80 shadow-md hover:shadow-xl transition-all relative"
                      >
                        <div className="absolute -top-3 px-3 py-0.5 rounded bg-[#78350f] text-amber-200 text-[9px] font-black uppercase font-mono shadow-xs border border-amber-400">
                          ★ 终极工程 ★
                        </div>

                        <NationalFocusNodeCard
                          iconType={node.iconType}
                          name={node.name}
                          subtitle={node.subtitle}
                          tier={node.tier}
                          status={status}
                          durationDays={node.durationDays}
                          isSelected={modalFocusNode?.id === node.id}
                          isHighlighted={isNodeHighlighted(node)}
                          width={124}
                          onClick={() => handleNodeClick(node)}
                        />

                        <p className="text-[11px] text-slate-600 text-center mt-2.5 leading-relaxed font-serif">
                          {node.subtitle}
                        </p>

                        <div className="flex flex-wrap gap-1 justify-center mt-2">
                          {node.effects.map((eff, i) => (
                            <span
                              key={i}
                              className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-200/80 text-amber-950 border border-amber-300"
                            >
                              {eff.text}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Floating Minimal Zoom Controls in Bottom Right */}
          <div className="absolute bottom-4 right-4 z-10 flex items-center gap-1 bg-[#2d3748]/95 backdrop-blur-md border border-slate-600 rounded-lg p-1 shadow-xl text-xs font-bold text-slate-200">
            <button
              type="button"
              onClick={handleZoomOut}
              className="w-7 h-7 flex items-center justify-center hover:bg-slate-700 rounded text-slate-300 hover:text-white cursor-pointer active:scale-95"
              title="缩小"
              aria-label="缩小"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 font-mono text-[11px] text-amber-300 min-w-[40px] text-center">
              {zoomLevel}%
            </span>
            <button
              type="button"
              onClick={handleZoomIn}
              className="w-7 h-7 flex items-center justify-center hover:bg-slate-700 rounded text-slate-300 hover:text-white cursor-pointer active:scale-95"
              title="放大"
              aria-label="放大"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
            <div className="w-[1px] h-4 bg-slate-600 mx-0.5" />
            <button
              type="button"
              onClick={handleResetPanAndZoom}
              className="w-7 h-7 flex items-center justify-center hover:bg-slate-700 rounded text-slate-300 hover:text-white cursor-pointer active:scale-95"
              title="全景居中适配"
              aria-label="重置适配"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 1936 Grand Strategy Focus Decree Modal */}
      <NationalFocusModal
        focusNode={modalFocusNode}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        status={modalNodeStatus}
        completedFocusIds={completedFocusIds}
        onFormulate={handleFormulateFocus}
        onSelectFocus={handlePrerequisiteSelect}
        isFormulating={isFormulating}
      />
    </div>
  );
};
