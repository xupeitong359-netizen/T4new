import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
 Lock,
 Check,
 RotateCcw,
 X,
 Crosshair,
 ChevronLeft,
 ArrowRight,
 Globe,
 Plus,
 Layers,
 Sparkles,
 FlaskConical,
 Zap,
 Cpu,
 FileCheck,
 Info,
} from 'lucide-react';
import {
 Nation,
 ActiveResearchProject,
 ResearchTechItem,
 TechBranchType,
} from '../types';
import {
 ALL_RESEARCH_TECHS,
 TECH_BRANCHES,
 TECH_BRANCH_KEYS,
 TECH_MAP,
 getMaxResearchSlots,
 getNationalResearchSpeedBonus,
 canResearchTech,
} from '../lib/technologyRules';
import { getEquipmentAsset } from '../lib/militaryEquipmentVisuals';
import { api } from '../services/api';

interface ResearchPageProps {
 nation: Nation | null;
 onUpdateNation: (updated: Nation) => void;
 showToast: (msg: string) => void;
 onNavigateToMap?: () => void;
}

// 战略科技树节点与画布排布规格 (紧凑微型卡片，仅保留核心基本名称与状态)
const NODE_WIDTH = 184;
const NODE_HEIGHT = 60;
const COL_GAP = 56;
const ROW_GAP = 22;
const PADDING_LEFT = 32;
const PADDING_TOP = 44;

// 科技年代轴线标尺
const YEAR_COLUMNS = [
 { col: 0, year: 1936, label: '1936' },
 { col: 1, year: 1938, label: '1938' },
 { col: 2, year: 1940, label: '1940' },
 { col: 3, year: 1943, label: '1943' },
 { col: 4, year: 1945, label: '1945' },
];

export const ResearchPage: React.FC<ResearchPageProps> = ({
 nation,
 onUpdateNation,
 showToast,
 onNavigateToMap,
}) => {
 // 页面模式: 'slots_overview' (科研槽位总览中心，默认主界面) | 'tech_tree' (科技树选择界面)
 const [viewMode, setViewMode] = useState<'slots_overview' | 'tech_tree'>('slots_overview');
 // 当前正在为哪个槽位选择科技 (0, 1, 2)
 const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);

 // 当前激活的科技分类
 const [activeBranch, setActiveBranch] = useState<TechBranchType>('infantry');
 // 弹窗查看完整属性的科技 ID
 const [inspectingTechId, setInspectingTechId] = useState<string | null>(null);
 // 当前鼠标悬停的科技项目 (用于动态高亮脉络)
 const [hoveredTechId, setHoveredTechId] = useState<string | null>(null);

 // 分类导航容器
 const tabsContainerRef = useRef<HTMLDivElement>(null);

 // 科技树视口平移与缩放
 const [pan, setPan] = useState<{ x: number; y: number }>({ x: 28, y: 16 });
 const [zoom, setZoom] = useState<number>(1.0);
 const [isDragging, setIsDragging] = useState<boolean>(false);
 const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
 const canvasContainerRef = useRef<HTMLDivElement>(null);
 const isDraggingRef = useRef(false);
 const touchStartDistRef = useRef<number | null>(null);
 const touchStartZoomRef = useRef<number>(1.0);

 const researchMutationVersionRef = useRef(0);
 const navigationTimerRef = useRef<number | null>(null);

 // 清理导航延时
 useEffect(() => {
  return () => {
   if (navigationTimerRef.current) {
    window.clearTimeout(navigationTimerRef.current);
   }
  };
 }, []);

 // 科研槽位与国家科技速度加成
 const maxSlots = useMemo(() => getMaxResearchSlots(nation), [nation]);
 const speedBonus = useMemo(() => getNationalResearchSpeedBonus(nation), [nation]);

 const researchedTechIds = useMemo(() => nation?.researchedTechIds || [], [nation]);
 const activeProjects = useMemo(() => nation?.activeResearchProjects || [], [nation]);

 // 按 Escape 键关闭弹窗
 useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
   if (e.key === 'Escape' && inspectingTechId) {
    setInspectingTechId(null);
   }
  };
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
 }, [inspectingTechId]);

 const nationRef = useRef(nation);
 nationRef.current = nation;

 // 结算科研进度 (保持核心逻辑稳定)
 useEffect(() => {
  let cancelled = false;
  const advance = async () => {
   const currentNation = nationRef.current;
   const projects = currentNation?.activeResearchProjects || [];
   if (!currentNation || projects.length === 0) return;
   const mutationVersion = researchMutationVersionRef.current;
   const now = Date.now();
   let completedIds: string[] = [];
   let changed = false;
   const nextProjects = projects.flatMap((project) => {
    const previous = Date.parse(project.lastCalculatedAt || project.startedAt);
    const elapsed = Math.max(0, now - (Number.isFinite(previous) ? previous : now));
    if (elapsed < 5_000) return [project];
    const gameDays = (elapsed / 86_400_000) * 365 * (project.speedModifier || 1);
    const daysCompleted = Math.min(project.daysTotal, project.daysCompleted + gameDays);
    changed = true;
    if (daysCompleted >= project.daysTotal) {
     completedIds.push(project.techId);
     return [];
    }
    return [{
     ...project,
     daysCompleted,
     progressPercent: Math.min(99, Math.floor((daysCompleted / project.daysTotal) * 100)),
     lastCalculatedAt: new Date(now).toISOString(),
    }];
   });
   if (!changed || cancelled) return;
   const updatedNation: Nation = {
    ...currentNation,
    activeResearchProjects: nextProjects,
    researchedTechIds: Array.from(new Set([...(currentNation.researchedTechIds || []), ...completedIds])),
   };
   try {
    const result = await api.nations.update(currentNation.id, updatedNation);
    if (!cancelled && mutationVersion === researchMutationVersionRef.current) onUpdateNation(result.nation);
   } catch (error) {
    console.warn('Research progress sync deferred:', error);
   }
  };

  const timer = window.setInterval(() => void advance(), 30_000);
  return () => { cancelled = true; window.clearInterval(timer); };
 }, [onUpdateNation]);

 // 当前分类科技节点
 const currentBranchTechs = useMemo(() => {
  return ALL_RESEARCH_TECHS.filter((t) => t.branch === activeBranch);
 }, [activeBranch]);

 // 节点物理坐标映射
 const nodePositions = useMemo(() => {
  const map = new Map<string, { x: number; y: number; col: number; row: number }>();
  currentBranchTechs.forEach((tech) => {
   const x = PADDING_LEFT + tech.col * (NODE_WIDTH + COL_GAP);
   const y = PADDING_TOP + tech.row * (NODE_HEIGHT + ROW_GAP);
   map.set(tech.id, { x, y, col: tech.col, row: tech.row });
  });
  return map;
 }, [currentBranchTechs]);

 // 画布范围
 const canvasBounds = useMemo(() => {
  let maxCol = 3;
  let maxRow = 2;
  currentBranchTechs.forEach((t) => {
   if (t.col > maxCol) maxCol = t.col;
   if (t.row > maxRow) maxRow = t.row;
  });
  const width = PADDING_LEFT * 2 + (maxCol + 1) * (NODE_WIDTH + COL_GAP) + 80;
  const height = PADDING_TOP * 2 + (maxRow + 1) * (NODE_HEIGHT + ROW_GAP) + 80;
  return { width: Math.max(1050, width), height: Math.max(520, height), maxCol, maxRow };
 }, [currentBranchTechs]);

 // 总已研发科技数
 const totalResearchedCount = useMemo(() => {
  return ALL_RESEARCH_TECHS.filter((t) => researchedTechIds.includes(t.id)).length;
 }, [researchedTechIds]);

 // 当前聚焦科技
 const activeFocusTechId = inspectingTechId || hoveredTechId;

 // 上下游关联高亮计算
 const { upstreamTechIds, downstreamTechIds, upstreamLineKeys, downstreamLineKeys } = useMemo(() => {
  const upstreamIds = new Set<string>();
  const downstreamIds = new Set<string>();
  const upLines = new Set<string>();
  const downLines = new Set<string>();

  if (!activeFocusTechId) {
   return {
    upstreamTechIds: upstreamIds,
    downstreamTechIds: downstreamIds,
    upstreamLineKeys: upLines,
    downstreamLineKeys: downLines,
   };
  }

  const findUpstream = (currId: string) => {
   const item = TECH_MAP.get(currId);
   if (!item || !item.prerequisiteIds) return;
   item.prerequisiteIds.forEach((pId) => {
    upstreamIds.add(pId);
    upLines.add(`${pId}->${currId}`);
    findUpstream(pId);
   });
  };

  const findDownstream = (currId: string) => {
   currentBranchTechs.forEach((t) => {
    if (t.prerequisiteIds && t.prerequisiteIds.includes(currId)) {
     downstreamIds.add(t.id);
     downLines.add(`${currId}->${t.id}`);
     findDownstream(t.id);
    }
   });
  };

  findUpstream(activeFocusTechId);
  findDownstream(activeFocusTechId);

  return {
   upstreamTechIds: upstreamIds,
   downstreamTechIds: downstreamIds,
   upstreamLineKeys: upLines,
   downstreamLineKeys: downLines,
  };
 }, [activeFocusTechId, currentBranchTechs]);

 // 正交拓扑连接线
 const connectorLines = useMemo(() => {
  const lines: Array<{
   sourceId: string;
   targetId: string;
   pathD: string;
   state: 'locked' | 'available' | 'researching' | 'completed';
  }> = [];

  currentBranchTechs.forEach((targetTech) => {
   if (!targetTech.prerequisiteIds || targetTech.prerequisiteIds.length === 0) return;

   const targetPos = nodePositions.get(targetTech.id);
   if (!targetPos) return;

   targetTech.prerequisiteIds.forEach((sourceId) => {
    const sourcePos = nodePositions.get(sourceId);
    if (!sourcePos) return;

    const startX = sourcePos.x + NODE_WIDTH;
    const startY = sourcePos.y + NODE_HEIGHT / 2;
    const endX = targetPos.x;
    const endY = targetPos.y + NODE_HEIGHT / 2;

    let pathD = '';
    if (Math.abs(startY - endY) < 4) {
     pathD = `M ${startX} ${startY} L ${endX} ${endY}`;
    } else {
     const midX = startX + (endX - startX) * 0.45;
     pathD = `M ${startX} ${startY} L ${midX} ${startY} L ${midX} ${endY} L ${endX} ${endY}`;
    }

    const isSourceCompleted = researchedTechIds.includes(sourceId);
    const isTargetCompleted = researchedTechIds.includes(targetTech.id);
    const isTargetResearching = activeProjects.some((p) => p.techId === targetTech.id);

    let state: 'locked' | 'available' | 'researching' | 'completed' = 'locked';
    if (isTargetCompleted) {
     state = 'completed';
    } else if (isTargetResearching) {
     state = 'researching';
    } else if (isSourceCompleted) {
     state = 'available';
    }

    lines.push({
     sourceId,
     targetId: targetTech.id,
     pathD,
     state,
    });
   });
  });

  return lines;
 }, [currentBranchTechs, nodePositions, researchedTechIds, activeProjects]);

 // 画布鼠标平移
 const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
  if ((e.target as HTMLElement).closest('[data-interactive="true"]')) return;
  setIsDragging(true);
  isDraggingRef.current = true;
  dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
 };

 const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
  if (!isDraggingRef.current) return;
  setPan({
   x: e.clientX - dragStartRef.current.x,
   y: e.clientY - dragStartRef.current.y,
  });
 };

 const handleMouseUp = () => {
  setIsDragging(false);
  isDraggingRef.current = false;
  touchStartDistRef.current = null;
 };

 const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
  if ((e.target as HTMLElement).closest('[data-interactive="true"]')) return;
  if (e.touches.length === 1) {
   setIsDragging(true);
   isDraggingRef.current = true;
   dragStartRef.current = { x: e.touches[0].clientX - pan.x, y: e.touches[0].clientY - pan.y };
  } else if (e.touches.length === 2) {
   const dist = Math.hypot(
    e.touches[0].clientX - e.touches[1].clientX,
    e.touches[0].clientY - e.touches[1].clientY
   );
   touchStartDistRef.current = dist;
   touchStartZoomRef.current = zoom;
  }
 };

 const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
  if (e.touches.length === 1 && isDraggingRef.current) {
   setPan({
    x: e.touches[0].clientX - dragStartRef.current.x,
    y: e.touches[0].clientY - dragStartRef.current.y,
   });
  } else if (e.touches.length === 2 && touchStartDistRef.current) {
   const dist = Math.hypot(
    e.touches[0].clientX - e.touches[1].clientX,
    e.touches[0].clientY - e.touches[1].clientY
   );
   const ratio = dist / touchStartDistRef.current;
   setZoom(Math.min(1.5, Math.max(0.5, touchStartZoomRef.current * ratio)));
  }
 };

 const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
  e.preventDefault();
  const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
  setZoom((prevZoom) => Math.min(1.5, Math.max(0.5, prevZoom * zoomFactor)));
 };

 const handleResetView = () => {
  setPan({ x: 28, y: 16 });
  setZoom(1.0);
 };

 const handleFocusResearching = () => {
  const projectInBranch = activeProjects.find((p) => p.branch === activeBranch);
  if (!projectInBranch) {
   const anyProject = activeProjects[0];
   if (anyProject) {
    const item = TECH_MAP.get(anyProject.techId);
    if (item) setActiveBranch(item.branch);
   }
   return;
  }
  const pos = nodePositions.get(projectInBranch.techId);
  if (pos && canvasContainerRef.current) {
   const containerWidth = canvasContainerRef.current.clientWidth;
   const containerHeight = canvasContainerRef.current.clientHeight;
   setPan({
    x: containerWidth / 2 - (pos.x + NODE_WIDTH / 2) * zoom,
    y: containerHeight / 2 - (pos.y + NODE_HEIGHT / 2) * zoom,
   });
  }
 };

 // 点击科研槽位进入科技树选择模式
 const handleSelectSlot = (slotIdx: number) => {
  setSelectedSlotIndex(slotIdx);
  setViewMode('tech_tree');
 };

 // 启动研究：指派项目给指定的科研槽位，并在指派后返回科研槽位主界面；若全部槽位已满则自动跳转世界地图
 const handleStartResearch = async (tech: ResearchTechItem) => {
  if (!nation) return;
  const status = canResearchTech(tech, researchedTechIds, activeProjects);
  if (!status.canResearch) {
   showToast(status.missingPrereqNames.length > 0 ? `缺少前置科技: ${status.missingPrereqNames.join('、')}` : '无法研究该科技');
   return;
  }

  // 确定目标槽位
  let targetSlot = selectedSlotIndex;
  if (targetSlot === null || targetSlot < 0 || targetSlot >= maxSlots) {
   const occupiedSlots = activeProjects.map((p) => p.slotIndex);
   for (let i = 0; i < maxSlots; i++) {
    if (!occupiedSlots.includes(i)) {
     targetSlot = i;
     break;
    }
   }
   if (targetSlot === null) targetSlot = 0;
  }

  const adjustedDays = Math.max(1, Math.round(tech.baseDays / (speedBonus.totalMultiplier || 1)));
  const newProject: ActiveResearchProject = {
   id: `proj_${tech.id}_${Date.now()}`,
   slotIndex: targetSlot,
   techId: tech.id,
   techName: tech.name,
   branch: tech.branch,
   progressPercent: 0,
   daysTotal: adjustedDays,
   daysCompleted: 0,
   startedAt: new Date().toISOString(),
   speedModifier: speedBonus.totalMultiplier,
   lastCalculatedAt: new Date().toISOString(),
  };

  // 过滤掉原本占用该槽位的旧项目（若有），放入新项目
  const otherProjects = activeProjects.filter((p) => p.slotIndex !== targetSlot && p.techId !== tech.id);
  const updatedProjects = [...otherProjects, newProject].sort((a, b) => a.slotIndex - b.slotIndex);

  const updatedNation: Nation = {
   ...nation,
   activeResearchProjects: updatedProjects,
  };

  researchMutationVersionRef.current += 1;
  onUpdateNation(updatedNation);

  // 关闭弹窗并返回科研槽位主界面
  setInspectingTechId(null);
  setViewMode('slots_overview');
  setSelectedSlotIndex(null);

  // 判断三个科研槽位是否全部配置完成
  const isAllSlotsConfigured = updatedProjects.length >= maxSlots;
  if (isAllSlotsConfigured) {
   showToast(` 三个科研槽位已全部配置完成！即将进入世界地图...`);
   if (navigationTimerRef.current) {
    window.clearTimeout(navigationTimerRef.current);
   }
   navigationTimerRef.current = window.setTimeout(() => {
    if (onNavigateToMap) {
     onNavigateToMap();
    }
   }, 1200);
  } else {
   showToast(`已指派【${tech.name}】至科研槽位 #${targetSlot + 1}`);
  }
 };

 // 中止研究
 const handleCancelResearch = async (techId: string) => {
  if (!nation) return;
  const project = activeProjects.find((p) => p.techId === techId);
  if (!project) return;

  const updatedProjects = activeProjects.filter((p) => p.techId !== techId);
  const updatedNation: Nation = {
   ...nation,
   activeResearchProjects: updatedProjects,
  };

  researchMutationVersionRef.current += 1;
  onUpdateNation(updatedNation);
  showToast(`已中止研发: ${project.techName} (槽位 #${project.slotIndex + 1} 已释放)`);
 };

 // 当前弹窗查看的技术
 const inspectingTech = inspectingTechId ? TECH_MAP.get(inspectingTechId) : null;
 const inspectingTechStatus = inspectingTech
  ? canResearchTech(inspectingTech, researchedTechIds, activeProjects)
  : null;
 const inspectingAsset = inspectingTech ? getEquipmentAsset(inspectingTech.artKey || 'rifle_bolt') : null;

 return (
  <div
   id="grand-strategy-research-interface"
   className="flex-1 min-h-0 w-full h-full flex flex-col bg-[#EEF1F4] text-[#26313D] select-none overflow-hidden font-sans"
  >
   {/* =========================================================================
     VIEW 1: 科研槽位总览主界面 (进入科研后的第一视角，清晰展示三个科研槽位)
   ========================================================================= */}
   {viewMode === 'slots_overview' && (
    <div className="flex-1 w-full h-full flex flex-col overflow-y-auto bg-[#EEF1F4]">
     {/* 顶栏控制条 - 确保所有状态指标和按钮文字不换行 */}
     <header className="bg-white border-b border-[#CBD5E1] px-3 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between gap-2 shrink-0 overflow-x-auto no-scrollbar">
      <div className="flex items-center gap-2 shrink-0">
       <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-[2px] bg-[#26313D] text-[#FEF9E7] flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
        <FlaskConical className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#C99A00]" />
       </div>
       <span className="px-2 py-0.5 bg-[#FEF9E7] border border-[#F6E09E] text-[#9F7A00] text-xs font-mono font-bold rounded-[2px] whitespace-nowrap">
        科研槽位中心
       </span>
      </div>

      {/* 右侧数据指标 - 严格设置 whitespace-nowrap 和 shrink-0，避免挤压折行 */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 font-mono text-xs whitespace-nowrap">
       <div className="bg-[#F8FAFC] border border-[#CBD5E1] px-2 sm:px-2.5 py-1 rounded-[2px] flex items-center gap-1 text-[#475569] whitespace-nowrap shrink-0">
        <span className="text-[#64748B] text-[11px]">在研槽位</span>
        <span className={`font-bold ${activeProjects.length === maxSlots ? 'text-[#15803D]' : 'text-[#C99A00]'}`}>
         {activeProjects.length} / {maxSlots}
        </span>
       </div>

       <div className="bg-[#F8FAFC] border border-[#CBD5E1] px-2 sm:px-2.5 py-1 rounded-[2px] flex items-center gap-1 text-[#475569] whitespace-nowrap shrink-0">
        <span className="text-[#64748B] text-[11px]">综合加成</span>
        <span className="font-bold text-[#C99A00]">+{speedBonus.percentageBonus}%</span>
       </div>
      </div>
     </header>

     {/* 主体区域：三个科研槽位展示卡片 + 下方科研加成明细清单 */}
     <main className="flex-1 max-w-4xl w-full mx-auto p-3 sm:p-5 lg:p-6 flex flex-col gap-4">
      <div className="space-y-3">
       {/* 槽位状态提示条 */}
       <div className="flex items-center justify-between border-b border-[#CBD5E1] pb-1.5">
        <div className="flex items-center gap-2 text-xs font-mono text-[#475569] whitespace-nowrap">
         <span className="w-2 h-2 rounded-full bg-[#C99A00] shrink-0" />
         <span className="font-bold text-[#26313D]">国家科研槽位 (共 {maxSlots} 个)</span>
        </div>
        <span className="text-[11px] font-mono text-[#64748B] whitespace-nowrap">
         已解锁科技: <strong className="text-[#26313D]">{totalResearchedCount}</strong> / {ALL_RESEARCH_TECHS.length}
        </span>
       </div>

       {/* 三个科研槽位 Grid：低高度卡片 */}
       <div className="grid grid-cols-1 md:grid-cols-3 gap-3 max-w-sm md:max-w-none mx-auto w-full">
        {Array.from({ length: maxSlots }).map((_, slotIdx) => {
         const slotNum = String(slotIdx + 1).padStart(2, '0');
         const activeProject = activeProjects.find((p) => p.slotIndex === slotIdx);
         const techItem = activeProject ? TECH_MAP.get(activeProject.techId) : null;
         const asset = techItem ? getEquipmentAsset(techItem.artKey || 'rifle_bolt') : null;

         // 1. 槽位已被指派（正在研发中）
         if (activeProject && techItem) {
          const remainingDays = Math.max(1, Math.ceil(activeProject.daysTotal - activeProject.daysCompleted));
          return (
           <div
            key={`slot-card-${slotIdx}`}
            className="bg-white border-2 border-[#C99A00]/70 rounded-[3px] shadow-xs flex flex-col justify-between overflow-hidden relative"
           >
            {/* 顶栏 */}
            <div className="px-2.5 py-1.5 bg-[#FEF9E7] border-b border-[#F6E09E] flex items-center justify-between whitespace-nowrap">
             <div className="flex items-center gap-1.5">
              <span className="px-1.5 py-0.5 bg-[#26313D] text-[#FEF9E7] text-[10px] font-mono font-bold rounded-[2px]">
               #{slotNum}
              </span>
              <span className="text-[11px] font-bold text-[#C99A00] font-mono">
               攻关中 · {activeProject.progressPercent}%
              </span>
             </div>
             <span className="text-[10px] font-mono text-[#9F7A00] font-bold">
              余 {remainingDays}天
             </span>
            </div>

            {/* 科技档案主体 */}
            <div className="p-2.5 space-y-1.5 flex-1 flex flex-col justify-between">
             <div className="space-y-0.5">
              <div className="flex items-center justify-between text-[10px] font-mono text-[#64748B]">
               <span>{TECH_BRANCHES[techItem.branch]?.name}</span>
               <span>{techItem.year || 1936}</span>
              </div>
              <h3 className="text-xs font-bold text-[#26313D] tracking-tight truncate">
               {techItem.name}
              </h3>
              {asset && (
               <div className="bg-[#F8FAFC] border border-[#E2E8F0] px-1.5 py-0.5 rounded-[2px] font-mono text-[10px] text-[#64748B] truncate">
                <span className="font-bold text-[#26313D]">{asset.historicalModel}</span>
               </div>
              )}
             </div>

             {/* 进度条与周期信息 */}
             <div className="space-y-1 pt-1 border-t border-[#F1F5F9] font-mono">
              <div className="flex items-center justify-between text-[10px] text-[#64748B]">
               <span>{Math.round(activeProject.daysCompleted)}/{activeProject.daysTotal}天</span>
               <span className="text-[#C99A00] font-bold">{activeProject.progressPercent}%</span>
              </div>
              <div className="w-full h-1.5 bg-[#E2E8F0] overflow-hidden rounded-[1px]">
               <div
                className="h-full bg-[#C99A00] transition-all duration-300"
                style={{ width: `${Math.max(4, activeProject.progressPercent)}%` }}
               />
              </div>
             </div>
            </div>

            {/* 操作栏 */}
            <div className="px-2.5 py-1 bg-[#F8FAFC] border-t border-[#CBD5E1] flex items-center justify-between gap-1.5">
             <button
              type="button"
              onClick={() => {
               setActiveBranch(techItem.branch);
               handleSelectSlot(slotIdx);
              }}
              className="flex-1 py-0.5 px-1.5 bg-white hover:bg-[#F1F5F9] border border-[#CBD5E1] text-[#26313D] font-mono font-bold text-[10px] rounded-[2px] transition cursor-pointer text-center"
             >
              更换
             </button>
             <button
              type="button"
              onClick={() => handleCancelResearch(activeProject.techId)}
              className="py-0.5 px-2 bg-white hover:bg-[#FEF2F2] border border-[#FCA5A5] text-[#DC2626] font-mono font-bold text-[10px] rounded-[2px] transition cursor-pointer"
              title="中止当前研究并释放槽位"
             >
              中止
             </button>
            </div>
           </div>
          );
         }

         // 2. 槽位空闲（待指派）
         return (
          <div
           key={`slot-card-empty-${slotIdx}`}
           onClick={() => handleSelectSlot(slotIdx)}
           className="bg-white hover:bg-[#FAFCFE] border-2 border-dashed border-[#CBD5E1] hover:border-[#C99A00] rounded-[3px] p-2.5 sm:p-3 shadow-xs flex flex-col justify-between items-center text-center transition cursor-pointer group"
          >
           {/* 顶栏 */}
           <div className="w-full flex items-center justify-between">
            <span className="px-1.5 py-0.5 bg-[#F1F5F9] group-hover:bg-[#FEF9E7] text-[#64748B] group-hover:text-[#9F7A00] text-[10px] font-mono font-bold rounded-[2px] transition">
             科研槽位 #{slotNum}
            </span>
            <span className="text-[10px] font-mono text-[#94A3B8] font-semibold">
             待指派
            </span>
           </div>

           {/* 中间加号与引导文案 */}
           <div className="my-auto py-1 space-y-1">
            <div className="w-7 h-7 rounded-[2px] bg-[#F8FAFC] group-hover:bg-[#FEF9E7] border border-[#CBD5E1] group-hover:border-[#C99A00] text-[#64748B] group-hover:text-[#C99A00] flex items-center justify-center mx-auto transition shadow-xs">
             <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
            <h3 className="text-xs font-bold text-[#26313D] group-hover:text-[#C99A00] transition">
             空闲科研槽位
            </h3>
           </div>

           {/* 底部按钮 */}
           <button
            type="button"
            className="w-full py-1 bg-[#26313D] group-hover:bg-[#1E293B] text-[#FEF9E7] border border-[#C99A00] font-bold font-mono text-[11px] rounded-[2px] transition flex items-center justify-center gap-1 shadow-xs"
           >
            <span>选择科技课题</span>
            <ArrowRight className="w-3 h-3 text-[#C99A00]" />
           </button>
          </div>
         );
        })}
       </div>
      </div>

      {/* 科研加成明细清单 */}
      <div className="bg-white border border-[#CBD5E1] rounded-[3px] shadow-xs overflow-hidden">
       {/* 明细清单顶栏 */}
       <div className="px-3 py-2 bg-[#F8FAFC] border-b border-[#CBD5E1] flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-[#26313D]">
         <Zap className="w-3.5 h-3.5 text-[#C99A00]" />
         <span>国家科研攻关加成明细</span>
        </div>
        <div className="flex items-center gap-2 font-mono text-[11px]">
         <span className="text-[#64748B]">综合速率:</span>
         <span className="font-bold text-[#C99A00] bg-[#FEF9E7] border border-[#F6E09E] px-1.5 py-0.2 rounded-[2px]">
          +{speedBonus.percentageBonus}% ({speedBonus.totalMultiplier.toFixed(2)}x)
         </span>
        </div>
       </div>

       {/* 明细条目列表 */}
       <div className="p-3 space-y-2 font-mono text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
         {/* 基础科研基准 */}
         <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-2 rounded-[2px] flex items-center justify-between">
          <div className="flex items-center gap-1.5 min-w-0">
           <span className="w-1.5 h-1.5 rounded-full bg-[#64748B] shrink-0" />
           <span className="text-[#334155] font-sans font-semibold text-[11px] truncate">基础攻关基准</span>
          </div>
          <span className="text-[#475569] font-bold text-[11px] shrink-0">100% (1.00x)</span>
         </div>

         {/* 实际生效的各项科研加成 */}
         {speedBonus.breakdown.map((item, idx) => (
          <div
           key={`bonus-item-${idx}`}
           className="bg-[#FEF9E7]/60 border border-[#F6E09E] p-2 rounded-[2px] flex items-center justify-between"
          >
           <div className="flex items-center gap-1.5 min-w-0">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C99A00] shrink-0" />
            <span className="text-[#26313D] font-sans font-semibold text-[11px] truncate">
             {item.label}
            </span>
           </div>
           <span className="text-[#9F7A00] font-bold text-[11px] shrink-0">
            +{item.bonus}%
           </span>
          </div>
         ))}
        </div>

        {/* 加成拓展引导提示 */}
        <div className="pt-2 border-t border-[#F1F5F9] flex items-start gap-1.5 text-[11px] text-[#64748B] font-sans">
         <Info className="w-3.5 h-3.5 text-[#94A3B8] shrink-0 mt-0.5" />
         <span>
          研发【电子学与计算】分支（机械差分机 +4%、电子管计算机 +7%、通用数字计算机 +10%）、颁布科研动员政令或确立科技理性主义国策，可进一步提升全国攻关速率并解锁更多科研槽位。
         </span>
        </div>
       </div>
      </div>
     </main>
    </div>
   )}

   {/* =========================================================================
     VIEW 2: 科技树选择界面 (点击某槽位后进入，选定科技后自动返回科研槽位主界面)
   ========================================================================= */}
   {viewMode === 'tech_tree' && (
    <div className="flex-1 w-full h-full flex flex-col overflow-hidden bg-[#EEF1F4]">
     {/* 顶部导航栏 */}
     <header className="bg-white border-b border-[#CBD5E1] shrink-0 z-20 select-none">
      {/* 第一行：返回槽位按钮 + 目标槽位提示 + 科研速度 */}
      <div className="px-4 sm:px-6 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E2E8F0]">
       <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
        {/* 返回科研槽位总览按钮 */}
        <button
         type="button"
         onClick={() => {
          setViewMode('slots_overview');
          setSelectedSlotIndex(null);
         }}
         className="px-3 py-1 bg-[#26313D] hover:bg-[#1E293B] text-[#FEF9E7] border border-[#475569] font-bold rounded-[2px] transition cursor-pointer flex items-center gap-1.5 text-xs font-mono shrink-0 shadow-xs"
         title="返回科研槽位"
        >
         <ChevronLeft className="w-4 h-4 text-[#C99A00]" />
         <span>返回科研槽位</span>
        </button>

        {/* 目标槽位指示 */}
        <div className="flex items-center gap-2 font-mono text-xs text-[#26313D] bg-[#FEF9E7] border border-[#F6E09E] px-2.5 py-1 rounded-[2px] shrink-0">
         <span className="text-[#9F7A00] font-bold">
          正在为【科研槽位 #{String((selectedSlotIndex ?? 0) + 1).padStart(2, '0')}】选择研发项目
         </span>
        </div>
       </div>

       {/* 右侧：科研速度与总体进度指标 */}
       <div className="flex items-center gap-3 text-xs font-mono text-[#64748B] shrink-0">
        <div>
         <span>已研究 </span>
         <span className="text-[#26313D] font-bold">{totalResearchedCount}</span>
         <span>/{ALL_RESEARCH_TECHS.length}</span>
        </div>
        <span className="text-[#CBD5E1]">|</span>
        <div>
         <span>科研速度 </span>
         <span className="text-[#C99A00] font-bold">+{speedBonus.percentageBonus}%</span>
        </div>
       </div>
      </div>

      {/* 第二行：科研分类导航栏 (暗黄色文字 + 底部细线) */}
      <div
       ref={tabsContainerRef}
       className="px-4 sm:px-6 flex items-center gap-6 overflow-x-auto no-scrollbar bg-white"
      >
       {TECH_BRANCH_KEYS.map((key) => {
        const meta = TECH_BRANCHES[key];
        const isActive = activeBranch === key;
        const branchTechs = ALL_RESEARCH_TECHS.filter((t) => t.branch === key);
        const researchedInBranch = branchTechs.filter((t) =>
         researchedTechIds.includes(t.id)
        ).length;
        const isAnyResearching = activeProjects.some((p) => p.branch === key);

        return (
         <button
          key={key}
          type="button"
          onClick={() => setActiveBranch(key)}
          className={`py-2 text-xs font-medium transition cursor-pointer shrink-0 bg-transparent flex items-center gap-1.5 border-b-2 ${
           isActive
            ? 'text-[#C99A00] font-bold border-[#C99A00]'
            : 'text-[#64748B] hover:text-[#26313D] border-transparent'
          }`}
         >
          <span>{meta.name}</span>
          <span
           className={`text-[10px] font-mono ${
            isActive ? 'text-[#C99A00] font-bold' : 'text-[#94A3B8]'
           }`}
          >
           ({researchedInBranch}/{branchTechs.length})
          </span>
          {isAnyResearching && (
           <span className="w-1.5 h-1.5 rounded-full bg-[#C99A00] shrink-0" />
          )}
         </button>
        );
       })}
      </div>
     </header>

     {/* 科技树画布区域 */}
     <div className="flex-1 w-full relative overflow-hidden flex min-h-0 bg-[#EEF1F4]">
      <div
       ref={canvasContainerRef}
       onMouseDown={handleMouseDown}
       onMouseMove={handleMouseMove}
       onMouseUp={handleMouseUp}
       onMouseLeave={handleMouseUp}
       onTouchStart={handleTouchStart}
       onTouchMove={handleTouchMove}
       onTouchEnd={handleMouseUp}
       onTouchCancel={handleMouseUp}
       onWheel={handleWheel}
       className={`flex-1 h-full relative overflow-hidden touch-none select-none ${
        isDragging ? 'cursor-grabbing' : 'cursor-grab'
       }`}
       style={{
        backgroundImage: `
         linear-gradient(to right, rgba(155, 168, 181, 0.15) 1px, transparent 1px),
         linear-gradient(to bottom, rgba(155, 168, 181, 0.15) 1px, transparent 1px)
        `,
        backgroundSize: '48px 48px, 48px 48px',
       }}
      >
       {/* 可平移缩放科技树主体 */}
       <div
        className="absolute top-0 left-0 transition-transform duration-75 ease-out will-change-transform"
        style={{
         transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
         transformOrigin: '0 0',
         width: canvasBounds.width,
         height: canvasBounds.height,
        }}
       >
        {/* 年代标尺横栏 (结构轴线) */}
        <div className="absolute top-0 left-0 right-0 h-9 border-b border-[#CBD5E1] pointer-events-none flex items-center">
         {YEAR_COLUMNS.slice(0, canvasBounds.maxCol + 2).map((colMeta) => {
          const colX = PADDING_LEFT + colMeta.col * (NODE_WIDTH + COL_GAP);
          return (
           <div
            key={colMeta.label}
            className="absolute font-mono text-xs font-bold text-[#475569] flex items-center gap-1.5"
            style={{ left: colX, width: NODE_WIDTH }}
           >
            <span className="text-[#C99A00] text-sm leading-none">◆</span>
            <span className="tracking-wider">{colMeta.label}</span>
           </div>
          );
         })}
        </div>

        {/* 科技树正交拓扑连线与年代竖向参考线 */}
        <svg
         className="absolute inset-0 pointer-events-none w-full h-full"
         style={{ overflow: 'visible' }}
        >
         {/* 年代列竖向参考线 */}
         {YEAR_COLUMNS.slice(0, canvasBounds.maxCol + 2).map((colMeta) => {
          const colX = PADDING_LEFT + colMeta.col * (NODE_WIDTH + COL_GAP) + NODE_WIDTH + COL_GAP / 2;
          return (
           <line
            key={`col-line-${colMeta.col}`}
            x1={colX}
            y1={32}
            x2={colX}
            y2={canvasBounds.height}
            stroke="#CBD5E1"
            strokeWidth={1}
            strokeDasharray="4 4"
            opacity={0.6}
           />
          );
         })}

         {/* 科技连接线 */}
         {connectorLines.map((line) => {
          const lineKey = `${line.sourceId}->${line.targetId}`;
          const isHighlighted = upstreamLineKeys.has(lineKey) || downstreamLineKeys.has(lineKey);

          let strokeColor = '#9BA8B5'; // 默认灰蓝
          let strokeWidth = 1.5;
          let strokeOpacity = 0.5;

          if (line.state === 'completed') {
           strokeColor = '#475569'; // 已研究较深
           strokeWidth = 2;
           strokeOpacity = 0.9;
          } else if (line.state === 'researching') {
           strokeColor = '#C99A00'; // 正在研究暗金
           strokeWidth = 2.5;
           strokeOpacity = 1.0;
          } else if (line.state === 'available') {
           strokeColor = '#64748B'; // 可研究
           strokeWidth = 1.75;
           strokeOpacity = 0.7;
          } else {
           strokeOpacity = 0.3; // 未解锁
          }

          if (isHighlighted) {
           strokeColor = '#C99A00';
           strokeWidth = 3;
           strokeOpacity = 1.0;
          }

          return (
           <g key={lineKey}>
            <path
             d={line.pathD}
             fill="none"
             stroke={strokeColor}
             strokeWidth={strokeWidth}
             strokeOpacity={strokeOpacity}
             strokeLinecap="square"
             strokeLinejoin="miter"
            />
           </g>
          );
         })}
        </svg>

        {/* 科技节点 (纯正军事技术档案风格 · 紧凑排版) */}
        {currentBranchTechs.map((tech) => {
         const pos = nodePositions.get(tech.id);
         if (!pos) return null;

         const isResearched = researchedTechIds.includes(tech.id);
         const activeProject = activeProjects.find((p) => p.techId === tech.id);
         const isResearching = Boolean(activeProject);
         const status = canResearchTech(tech, researchedTechIds, activeProjects);
         const isAvailable = status.canResearch;
         const isSelected = inspectingTechId === tech.id;
         const isHovered = hoveredTechId === tech.id;
         const isUpstream = upstreamTechIds.has(tech.id);
         const isDownstream = downstreamTechIds.has(tech.id);

         const asset = getEquipmentAsset(tech.artKey || 'rifle_bolt');
         const adjustedDays = Math.max(1, Math.round(tech.baseDays / (speedBonus.totalMultiplier || 1)));

         // 边框与状态外观 (细边框 + 轻微背景色差)
         let borderClass = 'border-[#CBD5E1]';
         let bgClass = 'bg-white';
         let ringClass = '';

         if (isResearching) {
          borderClass = 'border-[#C99A00]';
          ringClass = 'ring-1 ring-[#C99A00]';
         } else if (isResearched) {
          borderClass = 'border-[#94A3B8]';
          bgClass = 'bg-[#FAFCFE]';
         } else if (isAvailable) {
          borderClass = 'border-[#CBD5E1] hover:border-[#64748B]';
         } else {
          borderClass = 'border-[#E2E8F0]';
          bgClass = 'bg-[#F8FAFC] opacity-60';
         }

         if (isSelected) {
          ringClass = 'ring-2 ring-[#26313D]';
         } else if (isUpstream || isDownstream || isHovered) {
          ringClass = 'ring-1 ring-[#C99A00]';
         }

         return (
          <div
           key={tech.id}
           data-interactive="true"
           onClick={() => setInspectingTechId(tech.id)}
           onMouseEnter={() => setHoveredTechId(tech.id)}
           onMouseLeave={() => setHoveredTechId(null)}
           className={`absolute rounded-[2px] border ${borderClass} ${bgClass} ${ringClass} transition-all duration-100 cursor-pointer flex flex-col justify-between p-1.5 overflow-hidden font-sans select-none shadow-xs`}
           style={{
            left: pos.x,
            top: pos.y,
            width: NODE_WIDTH,
            height: NODE_HEIGHT,
           }}
           title="点击查看完整技术属性与研发决策"
          >
           {/* 1. 顶部小字行：年份 + 状态角标 */}
           <div className="flex items-center justify-between text-[9px] font-mono leading-none">
            <span className="text-[#64748B] font-semibold">{tech.year || 1936}</span>
            <div>
             {isResearched ? (
              <span className="text-[#15803D] font-bold flex items-center gap-0.5">
               <Check className="w-2.5 h-2.5" /> 已研
              </span>
             ) : isResearching ? (
              <span className="text-[#C99A00] font-bold">
               {activeProject?.progressPercent}%
              </span>
             ) : isAvailable ? (
              <span className="text-[#C99A00] font-bold">可研</span>
             ) : (
              <span className="text-[#94A3B8] flex items-center gap-0.5">
               <Lock className="w-2 h-2" /> 锁定
              </span>
             )}
            </div>
           </div>

           {/* 2. 中部核心行：科技名称 (加粗单行) */}
           <div className="min-w-0 my-auto">
            <h3 className="text-[11px] font-bold text-[#26313D] tracking-tight truncate leading-tight">
             {tech.name}
            </h3>
           </div>

           {/* 3. 底部辅助行：装备代表型号 + 周期天数 */}
           <div className="flex items-center justify-between text-[9px] font-mono text-[#64748B] leading-none">
            <span className="truncate max-w-[100px] text-[#475569]">{asset.historicalModel}</span>
            <span className="shrink-0 font-medium">
             {isResearching && activeProject
              ? `余${Math.max(1, Math.ceil(activeProject.daysTotal - activeProject.daysCompleted))}天`
              : isResearched
              ? '已列装'
              : `${adjustedDays}天`}
            </span>
           </div>

           {/* 底部在研细金进度线 */}
           {isResearching && activeProject && (
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#E2E8F0]">
             <div
              className="h-full bg-[#C99A00]"
              style={{ width: `${Math.max(4, activeProject.progressPercent)}%` }}
             />
            </div>
           )}
          </div>
         );
        })}
       </div>

       {/* 底部微型辅助条 */}
       <div className="absolute bottom-4 right-4 z-20 flex items-center gap-1.5 bg-white border border-[#CBD5E1] rounded-[2px] px-2.5 py-1 text-xs font-mono text-[#475569] select-none">
        {activeProjects.length > 0 && (
         <button
          type="button"
          data-interactive="true"
          onClick={handleFocusResearching}
          className="px-1.5 py-0.5 hover:bg-[#F1F5F9] text-[#C99A00] font-bold rounded-[2px] transition cursor-pointer flex items-center gap-1"
          title="对准正在研究的节点"
         >
          <Crosshair className="w-3.5 h-3.5" />
          <span>在研</span>
         </button>
        )}

        <button
         type="button"
         data-interactive="true"
         onClick={handleResetView}
         className="px-1.5 py-0.5 hover:bg-[#F1F5F9] hover:text-[#26313D] rounded-[2px] transition cursor-pointer flex items-center gap-1"
         title="重置视口位置"
        >
         <RotateCcw className="w-3.5 h-3.5" />
         <span>居中</span>
        </button>

        <span className="text-[#CBD5E1]">|</span>

        <button
         type="button"
         data-interactive="true"
         onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}
         className="w-5 h-5 flex items-center justify-center hover:bg-[#F1F5F9] hover:text-[#26313D] rounded-[2px] transition cursor-pointer font-bold"
         title="缩小"
        >
         −
        </button>

        <span className="px-1 text-[11px] text-[#26313D] w-8 text-center font-bold font-mono">
         {Math.round(zoom * 100)}%
        </span>

        <button
         type="button"
         data-interactive="true"
         onClick={() => setZoom((z) => Math.min(1.5, z + 0.1))}
         className="w-5 h-5 flex items-center justify-center hover:bg-[#F1F5F9] hover:text-[#26313D] rounded-[2px] transition cursor-pointer font-bold"
         title="放大"
        >
         +
        </button>
       </div>
      </div>
     </div>
    </div>
   )}

   {/* =========================================================================
     VIEW 3: 科技完整属性军事档案弹窗 (Modal)
   ========================================================================= */}
   {inspectingTech && (
    <div
     id="tech-dossier-modal-overlay"
     onClick={() => setInspectingTechId(null)}
     className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/45 backdrop-blur-[2px]"
    >
     <div
      id="tech-dossier-modal-card"
      onClick={(e) => e.stopPropagation()}
      className="w-full max-w-xl max-h-[88vh] bg-white border border-[#CBD5E1] shadow-2xl rounded-[3px] flex flex-col font-sans select-text overflow-hidden"
     >
      {/* 弹窗顶部 */}
      <div className="px-5 py-3.5 bg-[#F8FAFC] border-b border-[#CBD5E1] flex items-center justify-between gap-3 shrink-0">
       <div className="min-w-0">
        <div className="flex items-center gap-2 text-[10px] font-mono text-[#64748B]">
         <span className="bg-[#E2E8F0] px-1.5 py-0.5 rounded-[2px] font-bold text-[#334155]">
          {inspectingTech.year || 1936} 年代
         </span>
         <span>·</span>
         <span className="font-semibold text-[#475569]">
          {TECH_BRANCHES[inspectingTech.branch]?.name}
         </span>
        </div>
        <h2 className="text-base sm:text-lg font-bold text-[#26313D] truncate mt-1">
         {inspectingTech.name}
        </h2>
       </div>

       <button
        type="button"
        onClick={() => setInspectingTechId(null)}
        className="p-1.5 text-[#64748B] hover:text-[#26313D] hover:bg-[#E2E8F0] rounded-[2px] transition cursor-pointer"
        title="关闭弹窗 (Esc)"
       >
        <X className="w-5 h-5" />
       </button>
      </div>

      {/* 弹窗主体内容 */}
      <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
       {/* 1. 装备技术档案核心信息 (无图片) */}
       {inspectingAsset && (
        <div className="bg-[#F8FAFC] border border-[#CBD5E1] rounded-[2px] p-3.5 space-y-2">
         <div className="flex items-baseline justify-between gap-2">
          <span className="font-mono font-bold text-sm sm:text-base text-[#26313D]">
           {inspectingAsset.historicalModel}
          </span>
          <span className="text-[11px] text-[#64748B] font-mono">
           {inspectingAsset.eraLabel}
          </span>
         </div>

         <div className="pt-2 border-t border-[#E2E8F0] space-y-1.5 font-mono text-[11px]">
          <div className="flex items-start justify-between text-[#475569]">
           <span className="text-[#64748B] shrink-0 mr-2">技术规格:</span>
           <span className="font-medium text-right text-[#26313D]">
            {inspectingAsset.specSnippet}
           </span>
          </div>
          {inspectingAsset.blueprintDetails && (
           <div className="text-[10px] text-[#64748B] pt-1.5 border-t border-dashed border-[#E2E8F0] leading-relaxed">
            {inspectingAsset.blueprintDetails}
           </div>
          )}
         </div>
        </div>
       )}

       {/* 2. 研究状态指示 */}
       {(() => {
        const isResearched = researchedTechIds.includes(inspectingTech.id);
        const activeProject = activeProjects.find((p) => p.techId === inspectingTech.id);

        if (isResearched) {
         return (
          <div className="p-3 bg-[#F0FDF4] border border-[#BBF7D0] rounded-[2px] flex items-center gap-2 text-[#15803D]">
           <Check className="w-4 h-4 text-[#15803D] shrink-0" />
           <span className="font-semibold text-xs">该技术已完成科研攻关并列装全军。</span>
          </div>
         );
        }

        if (activeProject) {
         return (
          <div className="p-3.5 bg-[#FEF9E7] border border-[#F6E09E] rounded-[2px] space-y-2">
           <div className="flex items-center justify-between font-bold text-[#26313D]">
            <span className="text-xs">
             正在研究中 (科研槽位 #{activeProject.slotIndex + 1})
            </span>
            <span className="font-mono text-[#C99A00]">{activeProject.progressPercent}%</span>
           </div>
           <div className="w-full h-1.5 bg-[#E2E8F0] overflow-hidden rounded-[1px]">
            <div
             className="h-full bg-[#C99A00]"
             style={{ width: `${Math.max(5, activeProject.progressPercent)}%` }}
            />
           </div>
           <div className="text-[11px] font-mono text-[#64748B] flex items-center justify-between">
            <span>
             已研制 {Math.round(activeProject.daysCompleted)} / {activeProject.daysTotal} 天
            </span>
            <span className="text-[#C99A00] font-bold">
             剩余约 {Math.max(1, Math.ceil(activeProject.daysTotal - activeProject.daysCompleted))} 天
            </span>
           </div>
          </div>
         );
        }

        return null;
       })()}

       {/* 3. 技术说明与科研效果 */}
       <div className="space-y-1.5">
        <h4 className="font-bold text-[#26313D] text-xs">技术说明</h4>
        <p className="text-[#475569] leading-relaxed bg-[#F8FAFC] p-3 rounded-[2px] border border-[#E2E8F0]">
         {inspectingTech.summary}
        </p>
       </div>

       <div className="space-y-1.5">
        <h4 className="font-bold text-[#26313D] text-xs">科研效果与属性增益</h4>
        <div className="space-y-1.5">
         {inspectingTech.effects.map((effect, idx) => (
          <div
           key={idx}
           className="px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[2px] text-[#26313D] flex items-center justify-between font-mono text-[11px]"
          >
           <span>{effect}</span>
           <span className="text-[#15803D] font-bold"></span>
          </div>
         ))}
        </div>
       </div>

       {/* 4. 前置与后继科技 */}
       <div className="space-y-1.5">
        <h4 className="font-bold text-[#26313D] text-xs">科技路线依赖</h4>
        <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[2px]">
         <span className="text-[10px] font-mono text-[#64748B] block mb-1.5">前置科技要求:</span>
         {inspectingTech.prerequisiteIds && inspectingTech.prerequisiteIds.length > 0 ? (
          <div className="space-y-1.5">
           {inspectingTech.prerequisiteIds.map((pId) => {
            const prereq = TECH_MAP.get(pId);
            const isDone = researchedTechIds.includes(pId);
            return (
             <div
              key={pId}
              onClick={() => setInspectingTechId(pId)}
              className="flex items-center justify-between text-[11px] p-1.5 hover:bg-white rounded-[2px] cursor-pointer border border-transparent hover:border-[#CBD5E1]"
              title="点击查看此前置科技"
             >
              <span className={isDone ? 'text-[#26313D] font-medium' : 'text-[#DC2626]'}>
               {prereq?.name || pId}
              </span>
              <span className="text-[10px] font-mono">
               {isDone ? (
                <span className="text-[#15803D] font-bold"> 已解锁</span>
               ) : (
                <span className="text-[#DC2626] font-bold"> 未满足</span>
               )}
              </span>
             </div>
            );
           })}
          </div>
         ) : (
          <span className="text-[11px] text-[#64748B]">基础科技，无前置依赖，可直接签署研发</span>
         )}
        </div>
       </div>

       {/* 5. 战史名言 */}
       {inspectingTech.historicalQuote && (
        <div className="border-l-2 border-[#CBD5E1] pl-3 py-1.5 text-[11px] text-[#64748B] italic">
         "{inspectingTech.historicalQuote}"
        </div>
       )}
      </div>

      {/* 弹窗底部操作栏 */}
      <div className="px-5 py-3.5 bg-[#F8FAFC] border-t border-[#CBD5E1] flex items-center justify-between gap-3 shrink-0">
       <button
        type="button"
        onClick={() => setInspectingTechId(null)}
        className="px-4 py-2 bg-white hover:bg-[#F1F5F9] border border-[#CBD5E1] text-[#475569] font-medium rounded-[2px] transition cursor-pointer text-xs font-mono"
       >
        关闭
       </button>

       {(() => {
        const isResearched = researchedTechIds.includes(inspectingTech.id);
        const activeProject = activeProjects.find((p) => p.techId === inspectingTech.id);

        if (isResearched) {
         return (
          <div className="py-2 px-4 bg-[#F0FDF4] border border-[#BBF7D0] text-[#15803D] font-bold font-mono text-xs rounded-[2px]">
           技术已完全掌握
          </div>
         );
        }

        if (activeProject) {
         return (
          <button
           type="button"
           onClick={() => {
            handleCancelResearch(inspectingTech.id);
           }}
           className="py-2 px-5 bg-white hover:bg-[#FEF2F2] border border-[#FCA5A5] text-[#DC2626] font-bold rounded-[2px] transition cursor-pointer text-xs font-mono"
          >
           中止研发 (释放槽位 #{activeProject.slotIndex + 1})
          </button>
         );
        }

        if (inspectingTechStatus?.canResearch) {
         const targetSlotDisplay = (selectedSlotIndex ?? 0) + 1;
         const adjustedDays = Math.max(1, Math.round(inspectingTech.baseDays / (speedBonus.totalMultiplier || 1)));
         return (
          <button
           type="button"
           onClick={() => {
            handleStartResearch(inspectingTech);
           }}
           className="py-2 px-6 bg-[#26313D] hover:bg-[#1E293B] text-[#FEF9E7] border border-[#C99A00] font-bold rounded-[2px] transition cursor-pointer text-xs font-mono flex items-center gap-1.5 shadow-xs"
          >
           <span>指派至槽位 #{targetSlotDisplay} 开始研究 (预计 {adjustedDays} 天)</span>
          </button>
         );
        }

        return (
         <div className="py-2 px-4 text-[#94A3B8] font-mono text-xs bg-[#F1F5F9] border border-[#E2E8F0] rounded-[2px]">
          前置条件未满足，无法研究
         </div>
        );
       })()}
      </div>
     </div>
    </div>
   )}
  </div>
 );
};
