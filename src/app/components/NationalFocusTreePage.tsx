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
} from 'lucide-react';
import { Nation, FocusStatus, NationalFocusNode, ActiveNationalFocus } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  NATIONAL_FOCUS_NODES,
  FOCUS_NODE_MAP,
  getFocusStatus,
} from '../lib/nationalFocusData';
import { NationalFocusMedallion } from './NationalFocusMedallion';
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
}

export const NationalFocusTreePage: React.FC<NationalFocusTreePageProps> = ({
  nation,
  onUpdateNation,
  onNavigateTab,
}) => {
  const { user } = useAuth();

  // Time ticker
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

  // Pan & Zoom State for Draggable Tree
  const [zoomLevel, setZoomLevel] = useState<number>(95);
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

  // Modal State for inspecting and formulating focus
  const [modalFocusNode, setModalFocusNode] = useState<NationalFocusNode | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isFormulating, setIsFormulating] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'warn' } | null>(null);

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

  // Zoom handlers
  const handleZoomIn = () => setZoomLevel((prev) => Math.min(150, prev + 10));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(50, prev - 10));
  const handleResetPanAndZoom = () => {
    setZoomLevel(95);
    setPanOffset({ x: 0, y: 0 });
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

  // Touch drag to pan handlers
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
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const touch = e.touches[0];
    const dx = touch.clientX - dragStartRef.current.x;
    const dy = touch.clientY - dragStartRef.current.y;
    dragDistanceRef.current = Math.hypot(dx, dy);

    setPanOffset({
      x: dragStartRef.current.startPanX + dx,
      y: dragStartRef.current.startPanY + dy,
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Wheel zoom handler
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      setZoomLevel((prev) => {
        const delta = e.deltaY < 0 ? 5 : -5;
        return Math.min(150, Math.max(50, prev + delta));
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

    if (onUpdateNation) {
      onUpdateNation({
        completedFocusIds: newCompleted,
      });
    }

    setTimeout(() => {
      setIsFormulating(false);
      showToast(`国策【${node.name}】已成功颁布实施！效果已永久生效于国家`, 'success');
    }, 350);
  };

  const showToast = (text: string, type: 'success' | 'warn') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Grouped by Tier for Tree View
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

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isModalOpen && onNavigateTab) {
        onNavigateTab('lobby');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, onNavigateTab]);

  // Helper to render a branch column in Tree View
  const renderBranchTreeColumn = (
    mainNode: NationalFocusNode,
    subNodes: { parent: NationalFocusNode; children: NationalFocusNode[] }[]
  ) => {
    const mainStatus = getFocusStatus(mainNode.id, completedFocusIds, activeFocus);

    return (
      <div className="flex flex-col items-center min-w-[340px] max-w-[380px] px-2">
        {/* Tier 1 Main Branch Medallion */}
        <div className="flex flex-col items-center relative mb-2">
          <NationalFocusMedallion
            iconType={mainNode.iconType}
            name={mainNode.name}
            tier={mainNode.tier}
            status={mainStatus}
            isSelected={modalFocusNode?.id === mainNode.id}
            size={68}
            onClick={() => handleNodeClick(mainNode)}
          />
          <span className="text-[10px] text-slate-500 font-semibold px-2 py-0.5 rounded-full bg-slate-100 mt-1">
            {mainNode.subtitle}
          </span>
          <div className="w-[2px] h-6 bg-slate-300 relative mt-1" />
        </div>

        {/* Tier 2 Horizontal distribution bar */}
        <div className="w-[90%] relative h-4 mb-2">
          <div className="absolute top-0 left-[16%] right-[16%] h-[2px] bg-slate-300" />
          <div className="absolute top-0 left-[16%] w-[2px] h-4 bg-slate-300" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[2px] h-4 bg-slate-300" />
          <div className="absolute top-0 right-[16%] w-[2px] h-4 bg-slate-300" />
        </div>

        {/* 3 Sub-Branches Row */}
        <div className="grid grid-cols-3 gap-2 w-full">
          {subNodes.map((sub) => {
            const parentStatus = getFocusStatus(sub.parent.id, completedFocusIds, activeFocus);

            return (
              <div key={sub.parent.id} className="flex flex-col items-center">
                <NationalFocusMedallion
                  iconType={sub.parent.iconType}
                  name={sub.parent.name}
                  tier={sub.parent.tier}
                  status={parentStatus}
                  isSelected={modalFocusNode?.id === sub.parent.id}
                  size={54}
                  onClick={() => handleNodeClick(sub.parent)}
                />

                <div className="w-[1.5px] h-6 bg-slate-300 relative my-1">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-slate-400" />
                </div>

                <div className="flex flex-col items-center gap-3 w-full">
                  {sub.children.map((child, cIdx) => {
                    const childStatus = getFocusStatus(child.id, completedFocusIds, activeFocus);
                    return (
                      <div key={child.id} className="flex flex-col items-center w-full">
                        <NationalFocusMedallion
                          iconType={child.iconType}
                          name={child.name}
                          tier={child.tier}
                          status={childStatus}
                          isSelected={modalFocusNode?.id === child.id}
                          size={48}
                          onClick={() => handleNodeClick(child)}
                        />
                        {cIdx < sub.children.length - 1 && (
                          <div className="w-[1.5px] h-4 border-l border-dashed border-slate-300 my-1" />
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
      parent: FOCUS_NODE_MAP.get('industrialization_push')!,
      children: [FOCUS_NODE_MAP.get('heavy_industry_cluster')!, FOCUS_NODE_MAP.get('defense_industry')!],
    },
    {
      parent: FOCUS_NODE_MAP.get('scientific_foundation')!,
      children: [FOCUS_NODE_MAP.get('electronics_semiconductor')!, FOCUS_NODE_MAP.get('nuclear_research')!],
    },
  ];

  const militarySubNodes = [
    {
      parent: FOCUS_NODE_MAP.get('army_expansion')!,
      children: [FOCUS_NODE_MAP.get('mechanized_divisions')!, FOCUS_NODE_MAP.get('special_operations_corps')!],
    },
    {
      parent: FOCUS_NODE_MAP.get('naval_construction')!,
      children: [FOCUS_NODE_MAP.get('carrier_strike_group')!, FOCUS_NODE_MAP.get('submarine_wolfpack')!],
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
    <div className="fixed inset-0 z-50 w-screen h-screen bg-[#fbfbf9] text-slate-900 select-none overflow-hidden flex flex-col">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-fadeIn">
          <div
            className={`px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold border backdrop-blur-md ${
              toastMessage.type === 'success'
                ? 'bg-emerald-950/90 text-emerald-100 border-emerald-500/50'
                : 'bg-amber-950/90 text-amber-100 border-amber-500/50'
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

      {/* Top Header Bar: 极简纯净排版（只有：时间、昵称、图标，以及轻量返回按钮） */}
      <header className="px-3 sm:px-6 py-2 bg-white/95 backdrop-blur-md border-b border-slate-200/90 sticky top-0 z-20 flex items-center justify-between shadow-2xs">
        {/* Left: Minimal Back / Exit */}
        <div className="flex items-center gap-2">
          {onNavigateTab && (
            <button
              type="button"
              onClick={() => onNavigateTab('lobby')}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-xs font-bold text-slate-700 shadow-2xs transition cursor-pointer"
              title="返回国家大厅 (Esc)"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">返回</span>
            </button>
          )}
        </div>

        {/* Center: 时间 · 昵称 · 图标 (核心三合一展示) */}
        <div className="flex items-center gap-3 bg-slate-50/90 border border-slate-200/90 px-3.5 py-1.5 rounded-full shadow-2xs">
          {/* 1. 图标 (国旗 / 头像 / 徽章) */}
          <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs overflow-hidden shrink-0">
            {nation?.flagUrl ? (
              <img src={nation.flagUrl} alt="" className="w-full h-full object-cover" />
            ) : user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <Crown className="w-3.5 h-3.5 text-amber-300" />
            )}
          </div>

          {/* 2. 昵称 */}
          <span className="text-xs font-bold text-slate-800 truncate max-w-[130px] sm:max-w-[220px]">
            {displayName}
          </span>

          {/* 分隔微线 */}
          <div className="w-px h-3.5 bg-slate-200" />

          {/* 3. 时间 */}
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-700">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <time className="tabular-nums">
              {worldClockStart ? formatWorldTime(worldClockStart, now) : '1936/1/1'}
            </time>
          </div>
        </div>

        {/* Right: Minimal Exit Icon */}
        <div className="flex items-center gap-1.5">
          {onNavigateTab && (
            <button
              type="button"
              onClick={() => onNavigateTab('lobby')}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              title="退出 (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* Main Interactive Canvas Area */}
      <div className="flex-1 relative flex flex-col min-w-0 bg-[#fbfbf9] overflow-hidden">
        {/* Vintage Topographical Watermark Background */}
        <div
          className="absolute inset-0 opacity-[0.035] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(#1e293b 1px, transparent 1px), radial-gradient(#1e293b 1px, #fbfbf9 1px)`,
            backgroundSize: '36px 36px',
            backgroundPosition: '0 0, 18px 18px',
          }}
        />

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
              transition: isDragging ? 'none' : 'transform 0.1s ease-out',
            }}
          >
            <div
              className="origin-center flex flex-col items-center min-w-[1550px] max-w-[1700px] py-10 pointer-events-auto"
              style={{
                transform: `scale(${zoomLevel / 100})`,
                transition: 'transform 0.15s ease-out',
              }}
            >
              {/* 1. Root Tier (Level 0) */}
              <div className="flex flex-col items-center relative mb-3">
                <NationalFocusMedallion
                  iconType={rootNode.iconType}
                  name={rootNode.name}
                  tier={rootNode.tier}
                  status={getFocusStatus(rootNode.id, completedFocusIds, activeFocus)}
                  isSelected={modalFocusNode?.id === rootNode.id}
                  size={80}
                  onClick={() => handleNodeClick(rootNode)}
                />
                <span className="text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-0.5 rounded-full mt-1">
                  最高战略纲领
                </span>

                <div className="w-[2px] h-10 bg-slate-300 relative mt-1">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-amber-400 border border-amber-600 shadow-2xs" />
                </div>
              </div>

              {/* 2. Main Horizontal Conduit Line for 4 Branches */}
              <div className="w-[88%] max-w-[1450px] relative h-6">
                <div className="absolute top-0 left-[12%] right-[12%] h-[2px] bg-slate-300" />
                <div className="absolute top-0 left-[12%] w-[2px] h-6 bg-slate-300" />
                <div className="absolute top-0 left-[37%] w-[2px] h-6 bg-slate-300" />
                <div className="absolute top-0 left-[63%] w-[2px] h-6 bg-slate-300" />
                <div className="absolute top-0 right-[12%] w-[2px] h-6 bg-slate-300" />
              </div>

              {/* 3. Level 1 & 2 & 3: 4 Main Branch Columns */}
              <div className="grid grid-cols-4 w-full gap-8 max-w-[1580px] mb-8">
                {renderBranchTreeColumn(politicsNode, politicsSubNodes)}
                {renderBranchTreeColumn(economyNode, economySubNodes)}
                {renderBranchTreeColumn(militaryNode, militarySubNodes)}
                {renderBranchTreeColumn(diplomacyNode, diplomacySubNodes)}
              </div>

              {/* 4. Level 4: 终极战略超级工程 */}
              <div className="w-full max-w-[1400px] mt-6 pt-6 border-t-2 border-dashed border-slate-300/80 flex flex-col items-center">
                <div className="flex items-center gap-2 mb-6">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <h3 className="text-sm font-black text-slate-800 tracking-wider font-serif uppercase">
                    国家终极战略超级工程 (Tier IV Super-Projects)
                  </h3>
                  <Sparkles className="w-4 h-4 text-amber-600" />
                </div>

                <div className="grid grid-cols-3 gap-12 w-full max-w-[1100px]">
                  {tier4Nodes.map((node) => {
                    const status = getFocusStatus(node.id, completedFocusIds, activeFocus);
                    return (
                      <div
                        key={node.id}
                        className="flex flex-col items-center p-4 rounded-2xl bg-gradient-to-b from-amber-50/50 to-white border border-amber-200 shadow-2xs hover:shadow-md transition-all relative"
                      >
                        <div className="absolute -top-3 px-2 py-0.5 rounded-full bg-amber-600 text-white text-[9px] font-black uppercase font-mono shadow-xs">
                          终极工程
                        </div>
                        <NationalFocusMedallion
                          iconType={node.iconType}
                          name={node.name}
                          tier={node.tier}
                          status={status}
                          isSelected={modalFocusNode?.id === node.id}
                          size={64}
                          onClick={() => handleNodeClick(node)}
                        />
                        <p className="text-[11px] text-slate-500 text-center mt-2 leading-relaxed">
                          {node.subtitle}
                        </p>
                        <div className="flex flex-wrap gap-1 justify-center mt-2">
                          {node.effects.map((eff, i) => (
                            <span
                              key={i}
                              className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100/70 text-amber-900"
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
          <div className="absolute bottom-4 right-4 z-10 flex items-center gap-1 bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl p-1 shadow-md text-xs font-bold text-slate-700">
            <button
              type="button"
              onClick={handleZoomOut}
              className="w-7 h-7 flex items-center justify-center hover:bg-slate-100 rounded-lg text-slate-600 cursor-pointer"
              title="缩小"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 font-mono text-[11px] text-slate-600 min-w-[40px] text-center">
              {zoomLevel}%
            </span>
            <button
              type="button"
              onClick={handleZoomIn}
              className="w-7 h-7 flex items-center justify-center hover:bg-slate-100 rounded-lg text-slate-600 cursor-pointer"
              title="放大"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
            <div className="w-[1px] h-4 bg-slate-200 mx-0.5" />
            <button
              type="button"
              onClick={handleResetPanAndZoom}
              className="w-7 h-7 flex items-center justify-center hover:bg-slate-100 rounded-lg text-slate-600 cursor-pointer"
              title="重置居中"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Attributes Popup Modal Dialog (No scrolling needed) */}
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
