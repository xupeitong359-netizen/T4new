import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
 Search,
 Filter,
 ArrowUpDown,
 Plus,
 Minus,
 Trash2,
 Save,
 CheckCircle2,
 AlertTriangle,
 Layers,
 Factory,
 RotateCcw,
 Zap,
 Sparkles,
 ChevronRight,
 X,
 Shield,
 Clock,
 TrendingUp,
 AlertCircle,
 HelpCircle,
 BookOpen,
 RefreshCw,
 Sliders,
 Flame,
} from 'lucide-react';
import {
 Nation,
 MilitaryProductionLine,
 MilitaryIndustryState,
 ArmyDivision,
} from '../types';
import {
 CAPACITY_PER_MILITARY_FACTORY_24H,
 STANDARD_EQUIPMENT_TEMPLATES,
 StandardEquipmentTemplate,
 createDefaultProductionLines,
 settleMilitaryProduction,
 calculateNationalStockpileBreakdown,
 StockpileItemBreakdown,
 getTotalMilitaryFactories,
} from '../lib/militaryIndustry';
import {
 MilitaryFactoryPlantIcon,
 MilitaryTankIcon,
 MilitaryTankDestroyerIcon,
 MilitarySPArtilleryIcon,
 MilitaryFighterIcon,
 renderEquipmentTacticalIcon,
} from '../lib/icons';
import { MilitaryCostRuleTable } from './MilitaryCostRuleTable';
import { api } from '../services/api';

interface MilitaryIndustryDashboardProps {
 nation: Nation;
 isOwner: boolean;
 onUpdateNation: (updated: Nation) => void;
 showToast?: (msg: string) => void;
}

export type PriorityLevel = 1 | 2 | 3;

export const MilitaryIndustryDashboard: React.FC<MilitaryIndustryDashboardProps> = ({
 nation,
 isOwner,
 onUpdateNation,
 showToast,
}) => {
 // 1. Total military factories count across all claimed provinces
 const totalMilitaryFactories = getTotalMilitaryFactories(nation);

 // 2. Production lines & stockpiles state
 const [productionLines, setProductionLines] = useState<MilitaryProductionLine[]>(
  nation.militaryIndustry?.productionLines || createDefaultProductionLines(totalMilitaryFactories)
 );

 const [stockpiles, setStockpiles] = useState<Record<string, number>>(
  nation.militaryIndustry?.stockpiles || {
   eq_rifle: 15000,
   eq_artillery: 350,
   eq_support: 400,
   eq_truck: 300,
   eq_armored_car: 120,
   eq_mechanized: 80,
   eq_tank_medium: 60,
  }
 );

 // Priority mapping (stored locally or derived from line order)
 const [equipmentPriorities, setEquipmentPriorities] = useState<Record<string, PriorityLevel>>({
  eq_rifle: 1,
  eq_artillery: 2,
  eq_support: 2,
  eq_tank_medium: 1,
  eq_truck: 2,
 });

 // UI States
 const [searchQuery, setSearchQuery] = useState('');
 const [categoryFilter, setCategoryFilter] = useState<string>('all');
 const [statusFilter, setStatusFilter] = useState<'all' | 'deficit' | 'surplus' | 'producing'>('all');
 const [sortBy, setSortBy] = useState<'deficit' | 'demand' | 'stock' | 'output' | 'factories'>('deficit');
 const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
 const [selectedEquipmentId, setSelectedEquipmentId] = useState<string | null>(null);
 const [isSaving, setIsSaving] = useState(false);
 const [isSettling, setIsSettling] = useState(false);
 const [showRuleModal, setShowRuleModal] = useState(false);

 const nationRef = useRef(nation);
 nationRef.current = nation;
 const productionLinesRef = useRef(productionLines);
 productionLinesRef.current = productionLines;

 // Synchronize state when nation changes from outside
 useEffect(() => {
  if (nation.militaryIndustry?.productionLines) {
   setProductionLines((prev) => {
    const next = nation.militaryIndustry?.productionLines || [];
    if (JSON.stringify(prev) === JSON.stringify(next)) return prev;
    return next;
   });
  }
  if (nation.militaryIndustry?.stockpiles) {
   setStockpiles((prev) => {
    const next = nation.militaryIndustry?.stockpiles || {};
    if (JSON.stringify(prev) === JSON.stringify(next)) return prev;
    return next;
   });
  }
 }, [nation.militaryIndustry?.lastUpdated]);

 // Periodic automatic production settlement (15s loop)
 useEffect(() => {
  if (!isOwner) return;

  const performProductionSettlement = async () => {
   const currentNation = nationRef.current;
   const currentLines = productionLinesRef.current;
   const { updatedStockpiles, lastUpdated, hasProduced } = settleMilitaryProduction(
    currentNation,
    Date.now()
   );
   if (hasProduced) {
    setStockpiles(updatedStockpiles);
    try {
     const stateToSave: MilitaryIndustryState = {
      productionLines: currentNation.militaryIndustry?.productionLines || currentLines,
      customDesigns: [],
      stockpiles: updatedStockpiles,
      lastUpdated,
     };
     const res = await api.nations.updateMilitaryIndustry(currentNation.id, stateToSave);
     onUpdateNation(res.nation);
    } catch (e) {
     console.error('Failed to auto-settle military production:', e);
    }
   }
  };

  const timer = window.setInterval(performProductionSettlement, 15_000);
  return () => window.clearInterval(timer);
 }, [isOwner, onUpdateNation]);

 // Factory totals
 const allocatedFactories = productionLines.reduce((acc, l) => acc + (l.assignedFactories || 0), 0);
 const idleFactories = Math.max(0, totalMilitaryFactories - allocatedFactories);
 const isOverAllocated = allocatedFactories > totalMilitaryFactories;

 // Realtime Stockpile & Demand calculation
 const breakdown = useMemo(() => {
  const nationWithCurrentState: Nation = {
   ...nation,
   militaryIndustry: {
    productionLines,
    customDesigns: nation.militaryIndustry?.customDesigns || [],
    stockpiles,
    lastUpdated: nation.militaryIndustry?.lastUpdated || new Date().toISOString(),
   },
  };
  return calculateNationalStockpileBreakdown(nationWithCurrentState);
 }, [nation, productionLines, stockpiles]);

 // Efficiency calculation
 const overallEfficiency = totalMilitaryFactories > 0 ? Math.min(100, Math.round((allocatedFactories / totalMilitaryFactories) * 100)) : 0;
 const activeProductionLinesCount = productionLines.filter((l) => l.assignedFactories > 0).length;
 const totalDailyIC = allocatedFactories * CAPACITY_PER_MILITARY_FACTORY_24H;

 // Persist helper
 const persistChanges = async (
  newLines: MilitaryProductionLine[],
  newStockpiles?: Record<string, number>,
  feedbackMsg?: string
 ) => {
  try {
   setIsSaving(true);
   const stateToSave: MilitaryIndustryState = {
    productionLines: newLines,
    customDesigns: [],
    stockpiles: newStockpiles || stockpiles,
    lastUpdated: new Date().toISOString(),
   };
   const res = await api.nations.updateMilitaryIndustry(nation.id, stateToSave);
   onUpdateNation(res.nation);
   if (feedbackMsg) showToast?.(feedbackMsg);
  } catch (err: any) {
   console.error(err);
   showToast?.(`排产同步失败: ${err.message || '网络错误'}`);
  } finally {
   setIsSaving(false);
  }
 };

 // Adjust factory allocation for a specific equipment
 const handleSetFactoryAllocation = (equipmentId: string, targetCount: number) => {
  const template = STANDARD_EQUIPMENT_TEMPLATES.find((t) => t.id === equipmentId);
  if (!template) return;

  let nextLines = [...productionLines];
  const existingIndex = nextLines.findIndex((l) => l.equipmentId === equipmentId);

  const otherLinesUsed = nextLines
   .filter((l) => l.equipmentId !== equipmentId)
   .reduce((sum, l) => sum + (l.assignedFactories || 0), 0);
  const maxAvailableForThis = Math.max(0, totalMilitaryFactories - otherLinesUsed);
  const clampedCount = Math.max(0, Math.min(maxAvailableForThis, targetCount));

  if (existingIndex >= 0) {
   const line = nextLines[existingIndex];
   const newCap = clampedCount * CAPACITY_PER_MILITARY_FACTORY_24H;
   const newOutput = Math.round((newCap / line.unitCost) * 100) / 100;
   nextLines[existingIndex] = {
    ...line,
    assignedFactories: clampedCount,
    dailyCapacity: newCap,
    dailyOutput: newOutput,
   };
  } else if (clampedCount > 0) {
   const tier = template.tiers[0];
   const newCap = clampedCount * CAPACITY_PER_MILITARY_FACTORY_24H;
   const newOutput = Math.round((newCap / tier.totalCost) * 100) / 100;
   nextLines.push({
    id: 'line_' + Math.random().toString(36).substring(2, 9),
    equipmentId: template.id,
    equipmentName: tier.name,
    category: template.category,
    unitCost: tier.totalCost,
    unitCostDisplay: tier.costDisplay,
    assignedFactories: clampedCount,
    dailyCapacity: newCap,
    dailyOutput: newOutput,
   });
  }

  setProductionLines(nextLines);
  persistChanges(nextLines);
 };

 const handleStepFactoryAllocation = (equipmentId: string, delta: number) => {
  const currentLine = productionLines.find((l) => l.equipmentId === equipmentId);
  const currentCount = currentLine?.assignedFactories || 0;
  handleSetFactoryAllocation(equipmentId, currentCount + delta);
 };

 // Immediate settlement
 const handleImmediateSettle = async () => {
  try {
   setIsSettling(true);
   const { updatedStockpiles, lastUpdated, hasProduced } = settleMilitaryProduction(
    nation,
    Date.now()
   );
   const stateToSave: MilitaryIndustryState = {
    productionLines,
    customDesigns: [],
    stockpiles: updatedStockpiles,
    lastUpdated,
   };
   const res = await api.nations.updateMilitaryIndustry(nation.id, stateToSave);
   setStockpiles(updatedStockpiles);
   onUpdateNation(res.nation);
   showToast?.(
    hasProduced
     ? '战备军械仓库已即时盘点结算，军工厂产出已全额入库！'
     : '当前暂无新增累积产能，仓库账目已校准！'
   );
  } catch (err: any) {
   console.error(err);
   showToast?.(`入库结算失败: ${err.message || '网络错误'}`);
  } finally {
   setIsSettling(false);
  }
 };

 // Production simulation (e.g. 1 day, 7 days)
 const handleSimulateProduction = async (days: number) => {
  const newStockpiles = { ...stockpiles };
  let totalProducedUnits = 0;
  productionLines.forEach((line) => {
   if (line.assignedFactories > 0 && line.dailyOutput > 0) {
    const produced = Math.round(line.dailyOutput * days);
    newStockpiles[line.equipmentId] = (newStockpiles[line.equipmentId] || 0) + produced;
    totalProducedUnits += produced;
   }
  });

  setStockpiles(newStockpiles);
  await persistChanges(
   productionLines,
   newStockpiles,
   `成功推演 ${days} 天军备生产，共新增入库约 ${totalProducedUnits.toLocaleString()} 件装备！`
  );
 };

 // Manual save all
 const handleSaveAll = () => {
  persistChanges(productionLines, stockpiles, '国家军工排产方案与战备配置已成功保存！');
 };

 // Smart suggestion: find worst deficit equipment and suggest factories
 const worstDeficitItem = useMemo(() => {
  const deficitItems = breakdown.items.filter((item) => item.isDeficit);
  if (deficitItems.length === 0) return null;
  return deficitItems.sort((a, b) => b.deficitAmount - a.deficitAmount)[0];
 }, [breakdown.items]);

 // Merge table rows
 interface EquipmentRowData extends StockpileItemBreakdown {
  template: StandardEquipmentTemplate;
  priority: PriorityLevel;
  assignedFactories: number;
  dailyOutput: number;
 }

 const tableRows: EquipmentRowData[] = useMemo(() => {
  return STANDARD_EQUIPMENT_TEMPLATES.map((template) => {
   const breakdownItem = breakdown.items.find((i) => i.id === template.id) || {
    id: template.id,
    name: template.name,
    category: template.category,
    categoryLabel: template.category,
    unitName: template.unitName,
    currentStock: stockpiles[template.id] || 0,
    armyDemand: 0,
    balance: (stockpiles[template.id] || 0),
    isDeficit: false,
    deficitAmount: 0,
    surplusAmount: (stockpiles[template.id] || 0),
    dailyOutput: 0,
    assignedFactories: 0,
    fulfillmentPercent: 100,
    daysToBalance: null,
    productionLineCount: 0,
   };

   const line = productionLines.find((l) => l.equipmentId === template.id);
   const assignedFactories = line ? line.assignedFactories : 0;
   const dailyOutput = line ? line.dailyOutput : 0;
   const priority = equipmentPriorities[template.id] || 2;

   return {
    ...breakdownItem,
    template,
    priority,
    assignedFactories,
    dailyOutput,
   };
  });
 }, [breakdown.items, productionLines, stockpiles, equipmentPriorities]);

 // Filter & Sort table rows
 const filteredAndSortedRows = useMemo(() => {
  let result = tableRows.filter((row) => {
   // Category filter
   if (categoryFilter !== 'all' && row.category !== categoryFilter) return false;
   // Status filter
   if (statusFilter === 'deficit' && !row.isDeficit) return false;
   if (statusFilter === 'surplus' && row.isDeficit) return false;
   if (statusFilter === 'producing' && row.assignedFactories <= 0) return false;
   // Search
   if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    const matchName = row.name.toLowerCase().includes(q);
    const matchCat = row.categoryLabel.toLowerCase().includes(q);
    if (!matchName && !matchCat) return false;
   }
   return true;
  });

  // Sorting
  result.sort((a, b) => {
   let comparison = 0;
   if (sortBy === 'deficit') {
    // Prioritize deficit severity
    const aVal = a.isDeficit ? a.deficitAmount : -a.surplusAmount;
    const bVal = b.isDeficit ? b.deficitAmount : -b.surplusAmount;
    comparison = bVal - aVal;
   } else if (sortBy === 'demand') {
    comparison = b.armyDemand - a.armyDemand;
   } else if (sortBy === 'stock') {
    comparison = b.currentStock - a.currentStock;
   } else if (sortBy === 'output') {
    comparison = b.dailyOutput - a.dailyOutput;
   } else if (sortBy === 'factories') {
    comparison = b.assignedFactories - a.assignedFactories;
   }
   return sortOrder === 'asc' ? -comparison : comparison;
  });

  return result;
 }, [tableRows, categoryFilter, statusFilter, searchQuery, sortBy, sortOrder]);

 // Selected Equipment Details
 const selectedEquipment = useMemo(() => {
  if (!selectedEquipmentId) return null;
  return tableRows.find((r) => r.id === selectedEquipmentId) || null;
 }, [selectedEquipmentId, tableRows]);

 // Division demands for selected equipment
 const consumingDivisions = useMemo(() => {
  if (!selectedEquipment) return [];
  const divisions = nation.army?.divisions || [];
  const results: { division: ArmyDivision; countPerDiv: number; totalNeeded: number }[] = [];

  for (const div of divisions) {
   let count = 0;
   if (selectedEquipment.id === 'eq_rifle') {
    count = div.type === '步兵师' ? 9000 : div.type === '摩托化师' ? 6500 : div.type === '装甲师' ? 4000 : ((div.template?.infantry || 9) * 1000);
   } else if (selectedEquipment.id === 'eq_artillery') {
    count = div.type === '步兵师' ? 72 : div.type === '摩托化师' ? 60 : div.type === '装甲师' ? 54 : ((div.template?.artillery || 2) * 36);
   } else if (selectedEquipment.id === 'eq_support') {
    count = div.type === '步兵师' ? 180 : div.type === '摩托化师' ? 220 : div.type === '装甲师' ? 260 : ((div.template?.support || 1) * 180);
   } else if (selectedEquipment.id === 'eq_truck') {
    count = div.type === '步兵师' ? 20 : div.type === '摩托化师' ? 650 : div.type === '装甲师' ? 350 : 50;
   } else if (selectedEquipment.id === 'eq_tank_medium') {
    count = div.type === '装甲师' ? 320 : ((div.template?.armor || 0) * 80);
   }

   if (count > 0) {
    results.push({
     division: div,
     countPerDiv: count,
     totalNeeded: count,
    });
   }
  }
  return results;
 }, [selectedEquipment, nation.army?.divisions]);

 // Set priority
 const handleSetPriority = (equipmentId: string, level: PriorityLevel) => {
  setEquipmentPriorities((prev) => ({ ...prev, [equipmentId]: level }));
  showToast?.(`已将优先级调整为【${level === 1 ? 'Ⅰ 战略核心' : level === 2 ? 'Ⅱ 常规排产' : 'Ⅲ 低优先级'}】`);
 };

 return (
  <div className="space-y-4 text-slate-100 font-sans">
   {/* ─────────────────────────────────────────────────────────────
     1. 顶部搜索、兵种分类与排序过滤
     ───────────────────────────────────────────────────────────── */}
   <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 text-xs">
    {/* Left: Search & Category Chips */}
    <div className="flex items-center gap-2 flex-wrap min-w-0">
     {/* Search Box */}
     <div className="relative min-w-[160px] sm:min-w-[200px]">
      <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
      <input
       type="text"
       value={searchQuery}
       onChange={(e) => setSearchQuery(e.target.value)}
       placeholder="搜索装备名称或分类..."
       className="w-full pl-8 pr-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-medium"
      />
      {searchQuery && (
       <button
        type="button"
        onClick={() => setSearchQuery('')}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
       >
        <X className="w-3 h-3" />
       </button>
      )}
     </div>

     {/* Category tabs */}
     <div className="flex items-center gap-1.5 flex-wrap">
      {[
       { id: 'all', label: '全部' },
       { id: 'infantry', label: '步兵轻武器' },
       { id: 'artillery', label: '火炮' },
       { id: 'armor', label: '装甲坦克' },
       { id: 'support', label: '战地后勤' },
       { id: 'motorized', label: '机动车辆' },
       { id: 'mechanized', label: '机械化' },
       { id: 'aviation', label: '航空战机' },
      ].map((tab) => (
       <button
        key={tab.id}
        type="button"
        onClick={() => setCategoryFilter(tab.id)}
        className={`px-2.5 py-1 rounded-lg font-bold transition whitespace-nowrap cursor-pointer text-xs ${
         categoryFilter === tab.id
          ? 'bg-indigo-600 text-white shadow-2xs'
          : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800'
        }`}
       >
        {tab.label}
       </button>
      ))}
     </div>
    </div>

    {/* Right: Status Filter & Sort by Dropdown */}
    <div className="flex items-center gap-2 justify-between md:justify-end shrink-0">
     {/* Status Quick Toggle */}
     <div className="flex items-center bg-slate-950 rounded-lg p-0.5 border border-slate-800 text-[11px]">
      <button
       type="button"
       onClick={() => setStatusFilter('all')}
       className={`px-2 py-0.5 rounded font-bold transition cursor-pointer ${
        statusFilter === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
       }`}
      >
       全部
      </button>
      <button
       type="button"
       onClick={() => setStatusFilter('deficit')}
       className={`px-2 py-0.5 rounded font-bold transition cursor-pointer flex items-center gap-1 ${
        statusFilter === 'deficit' ? 'bg-rose-600 text-white' : 'text-rose-400 hover:text-rose-300'
       }`}
      >
       仅缺口 ({breakdown.deficitItemCount})
      </button>
      <button
       type="button"
       onClick={() => setStatusFilter('producing')}
       className={`px-2 py-0.5 rounded font-bold transition cursor-pointer ${
        statusFilter === 'producing' ? 'bg-amber-600 text-white' : 'text-amber-400 hover:text-amber-300'
       }`}
      >
       生产中 ({activeProductionLinesCount})
      </button>
     </div>

     {/* Sort selection */}
     <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800 text-slate-400">
      <ArrowUpDown className="w-3 h-3 text-slate-400" />
      <select
       value={sortBy}
       onChange={(e) => setSortBy(e.target.value as any)}
       className="bg-transparent text-slate-200 font-bold text-xs focus:outline-none cursor-pointer"
      >
       <option value="deficit" className="bg-slate-900 text-white">缺口严重程度</option>
       <option value="demand" className="bg-slate-900 text-white">军队总需求</option>
       <option value="stock" className="bg-slate-900 text-white">库存现量</option>
       <option value="output" className="bg-slate-900 text-white">日产速率</option>
       <option value="factories" className="bg-slate-900 text-white">军工厂分配</option>
      </select>
      <button
       type="button"
       onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
       className="px-1 text-slate-400 hover:text-white font-mono"
       title="切换升序/降序"
      >
       {sortOrder === 'desc' ? '↓' : '↑'}
      </button>
     </div>
    </div>
   </div>

   {/* ─────────────────────────────────────────────────────────────
     3. 核心区域：高信息密度装备生产总表 (Dense Equipment Matrix)
     ───────────────────────────────────────────────────────────── */}
   <div className="w-full bg-slate-900 border border-slate-800 rounded-xl shadow-md flex flex-col">
    {/* Desktop Header */}
    <div className="hidden md:grid grid-cols-[50px_1fr_60px_60px_70px_70px_100px_32px] lg:grid-cols-[60px_1fr_80px_80px_90px_90px_110px_32px] gap-2 items-center p-2 px-3 bg-slate-950/90 text-slate-400 font-bold uppercase tracking-wider text-[11px] border-b border-slate-800 shrink-0">
     <div className="text-center">状态</div>
     <div>装备与兵种</div>
     <div className="text-right">库存</div>
     <div className="text-right">需求</div>
     <div className="text-right">缺口</div>
     <div className="text-right">日产</div>
     <div className="text-center">生产线</div>
     <div></div>
    </div>

    {/* List Body */}
    <div className="flex flex-col divide-y divide-slate-800/60">
     {filteredAndSortedRows.map((row) => {
      const isSelected = selectedEquipmentId === row.id;

      // Split equipment name into primary title and subtitle for military systematic hierarchy
      const rawName = row.name || '';
      let primaryName = rawName;
      let subName = '';

      if (rawName.includes('/')) {
       const parts = rawName.split('/');
       primaryName = parts[0].trim();
       subName = parts.slice(1).join(' / ').trim();
      } else if (rawName.includes('（') || rawName.includes('(')) {
       const match = rawName.match(/^(.*?)[（(](.*?)[）)]$/);
       if (match) {
        primaryName = match[1].trim();
        subName = match[2].trim();
       }
      }

      return (
       <div
        key={row.id}
        onClick={() => setSelectedEquipmentId(row.id === selectedEquipmentId ? null : row.id)}
        className={`relative p-3 md:p-2 md:px-3 hover:bg-slate-800/70 transition cursor-pointer ${
         isSelected ? 'bg-indigo-950/20' : ''
        } ${row.isDeficit ? 'bg-rose-950/10' : ''}`}
       >
        {isSelected && <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-indigo-500"></div>}

        {/* 桌面端布局 (Desktop Grid) */}
        <div className="hidden md:grid grid-cols-[50px_1fr_60px_60px_70px_70px_100px_32px] lg:grid-cols-[60px_1fr_80px_80px_90px_90px_110px_32px] gap-2 items-center text-xs">
         {/* Status: + Ⅱ */}
         <div className="flex items-center justify-center gap-1.5 shrink-0">
          {row.isDeficit ? (
           <span
            className="w-4 h-4 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/60 flex items-center justify-center text-[10px] font-mono font-bold shrink-0"
            title={`严重短缺: 缺额 ${row.deficitAmount.toLocaleString()} ${row.unitName}`}
           >
            -
           </span>
          ) : (
           <span
            className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/60 flex items-center justify-center text-[10px] font-mono font-bold shrink-0"
            title="战备盈余 / 编制满装"
           >
            +
           </span>
          )}
          <span
           className={`text-[9px] lg:text-[10px] font-mono font-bold px-1 rounded border shrink-0 ${
            row.priority === 1
             ? 'bg-rose-950/40 text-rose-300 border-rose-800/60'
             : row.priority === 2
             ? 'bg-slate-800/80 text-slate-300 border-slate-700/60'
             : 'bg-slate-900 text-slate-500 border-slate-800'
           }`}
           title={`排产优先级: ${row.priority === 1 ? 'Ⅰ 核心战略' : row.priority === 2 ? 'Ⅱ 常规配发' : 'Ⅲ 后备物资'}`}
          >
           {row.priority === 1 ? 'Ⅰ' : row.priority === 2 ? 'Ⅱ' : 'Ⅲ'}
          </span>
         </div>

         {/* Equipment info: break-keep to naturally wrap words without vertical splitting */}
         <div className="min-w-0 flex flex-col justify-center" style={{ wordBreak: 'keep-all', overflowWrap: 'normal' }}>
          <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
           <span className="font-bold text-white text-[13px] tracking-wide">{primaryName}</span>
           <span className="text-[10px] text-slate-500 font-mono">
            ({row.template.baseCost} IC)
           </span>
          </div>
          <div className="text-[10px] text-slate-400 flex flex-wrap items-center gap-x-1 mt-0.5 leading-tight">
           {subName ? (
            <>
             <span className="text-slate-300 font-medium">{subName}</span>
             <span className="text-slate-600">·</span>
            </>
           ) : null}
           <span className="text-slate-500">{row.categoryLabel}</span>
          </div>
         </div>

         {/* Stockpile */}
         <div className="text-right font-mono font-bold text-slate-200 truncate">
          {Math.floor(row.currentStock).toLocaleString()}
         </div>

         {/* Demand */}
         <div className="text-right font-mono text-slate-400 truncate">
          {row.armyDemand > 0 ? row.armyDemand.toLocaleString() : '0'}
         </div>

         {/* Deficit */}
         <div className="text-right font-mono font-bold truncate">
          {row.isDeficit ? (
           <span className="text-rose-400">-{row.deficitAmount.toLocaleString()}</span>
          ) : (
           <span className="text-slate-500 font-normal">—</span>
          )}
         </div>

         {/* Daily Output */}
         <div className="text-right font-mono truncate">
          {row.dailyOutput > 0 ? (
           <span className="font-bold text-amber-300">+{row.dailyOutput.toLocaleString()}</span>
          ) : (
           <span className="text-slate-600 font-normal">0</span>
          )}
         </div>

         {/* Factory Stepper */}
         <div
          className="flex justify-center shrink-0"
          onClick={(e) => e.stopPropagation()}
         >
          {isOwner ? (
           <div className="inline-flex items-center bg-slate-900/80 p-0.5 rounded border border-slate-700/60">
            <button
             type="button"
             onClick={() => handleStepFactoryAllocation(row.id, -1)}
             disabled={isSaving || row.assignedFactories <= 0}
             className="w-6 h-6 lg:w-7 lg:h-7 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 hover:text-white rounded flex items-center justify-center cursor-pointer transition text-sm font-bold leading-none"
             title="减少 1 座军工厂"
            >
             -
            </button>
            <span
             className={`font-mono font-bold text-[11px] lg:text-xs w-6 lg:w-8 text-center ${
              row.assignedFactories > 0 ? 'text-amber-400' : 'text-slate-500'
             }`}
            >
             {row.assignedFactories}
            </span>
            <button
             type="button"
             onClick={() => handleStepFactoryAllocation(row.id, 1)}
             disabled={isSaving || idleFactories <= 0}
             className="w-6 h-6 lg:w-7 lg:h-7 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 text-white rounded flex items-center justify-center cursor-pointer transition text-sm font-bold leading-none"
             title={idleFactories <= 0 ? '无空闲军工厂' : '增加 1 座军工厂'}
            >
             +
            </button>
           </div>
          ) : (
           <span className="font-mono text-amber-400 font-bold text-xs">{row.assignedFactories} 厂</span>
          )}
         </div>

         {/* Detail Chevron */}
         <div className="flex justify-center shrink-0 text-center">
          <button
           type="button"
           className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition cursor-pointer"
           title="点击查看装备战备详情"
          >
           <ChevronRight className={`w-4 h-4 transition-transform ${isSelected ? 'rotate-90 text-indigo-400' : ''}`} />
          </button>
         </div>
        </div>

        {/* 移动端/窄屏端布局 (Mobile Flex Stack) */}
        <div className="flex flex-col gap-2.5 md:hidden text-xs">
         {/* Row 1: Status & Equip & Stock */}
         <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 flex-1 min-w-0">
           <div className="flex items-center gap-1 shrink-0 mt-0.5">
            {row.isDeficit ? (
             <span className="w-3.5 h-3.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/60 flex items-center justify-center text-[9px] font-mono font-bold">
              -
             </span>
            ) : (
             <span className="w-3.5 h-3.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/60 flex items-center justify-center text-[9px] font-mono font-bold">
              +
             </span>
            )}
            <span
             className={`text-[9px] font-mono font-bold px-1 rounded border ${
              row.priority === 1
               ? 'bg-rose-950/40 text-rose-300 border-rose-800/60'
               : row.priority === 2
               ? 'bg-slate-800/80 text-slate-300 border-slate-700/60'
               : 'bg-slate-900 text-slate-500 border-slate-800'
             }`}
            >
             {row.priority === 1 ? 'Ⅰ' : row.priority === 2 ? 'Ⅱ' : 'Ⅲ'}
            </span>
           </div>
           <div className="font-bold text-white text-[13px] tracking-wide leading-tight" style={{ wordBreak: 'keep-all', overflowWrap: 'normal' }}>
            {primaryName}
            <span className="text-[10px] text-slate-500 font-mono ml-1.5 font-normal whitespace-nowrap">({row.template.baseCost} IC)</span>
           </div>
          </div>
         </div>

         {/* Row 2: Data grid */}
         <div className="grid grid-cols-4 gap-2 bg-slate-950/50 p-2 rounded border border-slate-800/50 text-center font-mono">
          <div className="flex flex-col justify-center">
           <span className="text-[10px] text-slate-500 mb-0.5">库存</span>
           <span className="font-bold text-slate-200">{Math.floor(row.currentStock).toLocaleString()}</span>
          </div>
          <div className="flex flex-col justify-center border-l border-slate-800/50">
           <span className="text-[10px] text-slate-500 mb-0.5">需求</span>
           <span className="text-slate-400">{row.armyDemand > 0 ? row.armyDemand.toLocaleString() : '0'}</span>
          </div>
          <div className="flex flex-col justify-center border-l border-slate-800/50">
           <span className="text-[10px] text-slate-500 mb-0.5">缺口</span>
           <span className="font-bold">
            {row.isDeficit ? <span className="text-rose-400">-{row.deficitAmount.toLocaleString()}</span> : <span className="text-slate-500 font-normal">—</span>}
           </span>
          </div>
          <div className="flex flex-col justify-center border-l border-slate-800/50">
           <span className="text-[10px] text-slate-500 mb-0.5">日产</span>
           <span>
            {row.dailyOutput > 0 ? <span className="font-bold text-amber-300">+{row.dailyOutput.toLocaleString()}</span> : <span className="text-slate-600">0</span>}
           </span>
          </div>
         </div>

         {/* Row 3: Subtitle & Control */}
         <div className="flex items-center justify-between gap-3 mt-0.5">
          <div className="text-[11px] text-slate-400 leading-tight" style={{ wordBreak: 'keep-all', overflowWrap: 'normal' }}>
           {subName ? <span className="text-slate-300 font-medium mr-1">{subName} ·</span> : null}
           {row.categoryLabel}
          </div>
          <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
           {isOwner ? (
            <div className="inline-flex items-center bg-slate-900/80 p-0.5 rounded border border-slate-700/60">
             <button
              type="button"
              onClick={() => handleStepFactoryAllocation(row.id, -1)}
              disabled={isSaving || row.assignedFactories <= 0}
              className="w-7 h-7 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 hover:text-white rounded flex items-center justify-center cursor-pointer transition text-sm font-bold"
             >
              -
             </button>
             <span
              className={`font-mono font-bold text-[11px] w-8 text-center ${
               row.assignedFactories > 0 ? 'text-amber-400' : 'text-slate-500'
              }`}
             >
              {row.assignedFactories}
             </span>
             <button
              type="button"
              onClick={() => handleStepFactoryAllocation(row.id, 1)}
              disabled={isSaving || idleFactories <= 0}
              className="w-7 h-7 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 text-white rounded flex items-center justify-center cursor-pointer transition text-sm font-bold"
             >
              +
             </button>
            </div>
           ) : (
            <span className="font-mono text-amber-400 font-bold text-xs bg-slate-950 px-2 py-1 rounded border border-slate-800">{row.assignedFactories} 厂</span>
           )}
           <button type="button" className="p-1 text-slate-400">
            <ChevronRight className={`w-4 h-4 transition-transform ${isSelected ? 'rotate-90 text-indigo-400' : ''}`} />
           </button>
          </div>
         </div>
        </div>
       </div>
      );
     })}

     {filteredAndSortedRows.length === 0 && (
      <div className="py-8 text-center text-slate-500 text-sm">
       未检索到符合条件的装备项目
      </div>
     )}
    </div>

    {/* ─────────────────────────────────────────────────────────────
      2. 底部生产控制工具栏 (Production Toolbar)
      ───────────────────────────────────────────────────────────── */}
    <div className="border-t border-slate-800 bg-slate-900/50 flex flex-col text-xs rounded-b-xl overflow-hidden">
     {/* Smart Deficit Diagnostic Suggestion Banner (Optional inline strip) */}
     {worstDeficitItem && isOwner && (
      <div className="px-3 py-2 bg-rose-950/20 border-b border-rose-900/30 flex flex-wrap items-center justify-between gap-2">
       <div className="flex items-center gap-1.5 text-rose-300 font-medium text-[11px] leading-tight">
        <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
        <span>
         短缺预警：<strong className="text-rose-200">{worstDeficitItem.name}</strong> 缺口 <strong className="font-mono text-rose-400">-{worstDeficitItem.deficitAmount.toLocaleString()}</strong>
         {worstDeficitItem.assignedFactories === 0 ? '，未分配产线' : `，预计 ${worstDeficitItem.daysToBalance ?? '—'} 天补齐`}。
        </span>
       </div>
       {idleFactories > 0 && (
        <button
         type="button"
         onClick={() => {
          const addCount = Math.min(idleFactories, 3);
          handleStepFactoryAllocation(worstDeficitItem.id, addCount);
          showToast?.(`已增调 ${addCount} 厂`);
         }}
         className="px-2 py-0.5 bg-rose-900/60 hover:bg-rose-800 text-rose-200 border border-rose-800/60 rounded text-[10px] transition cursor-pointer shrink-0"
        >
         一键增产 (+{Math.min(idleFactories, 3)})
        </button>
       )}
      </div>
     )}

     {/* Main Toolbar */}
     <div className="p-3 sm:px-4 sm:py-3 flex flex-col gap-3 sm:gap-2">
      {/* Row 1: 状态信息 */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-slate-400 font-mono text-[11px] sm:text-xs">
       <div className="flex items-center gap-1.5">
        <MilitaryFactoryPlantIcon size={14} className="text-amber-400/80" />
        <span>军工厂 <strong className="text-amber-300 font-bold">{allocatedFactories}/{totalMilitaryFactories}</strong></span>
       </div>
       <div className="w-px h-3 bg-slate-800 hidden sm:block"></div>
       
       <div className="flex items-center gap-1.5">
        <Layers className="w-3.5 h-3.5 text-indigo-400/80" />
        <span>活跃产线 <strong className="text-white font-bold">{activeProductionLinesCount}</strong></span>
       </div>
       <div className="w-px h-3 bg-slate-800 hidden sm:block"></div>
       
       <div className="flex items-center gap-1.5">
        <Zap className="w-3.5 h-3.5 text-emerald-400/80" />
        <span>日产 <strong className="text-emerald-400 font-bold">+{totalDailyIC.toLocaleString()}</strong> IC/24h</span>
       </div>
       <div className="w-px h-3 bg-slate-800 hidden md:block"></div>
       
       <div className="flex items-center gap-1.5">
        <Shield className="w-3.5 h-3.5 text-sky-400/80" />
        <span>全军需求 <strong className="text-slate-200 font-bold">{breakdown.totalArmyDemandCount.toLocaleString()}</strong></span>
       </div>
       <div className="w-px h-3 bg-slate-800 hidden md:block"></div>
       
       <div className="flex items-center gap-1.5">
        {breakdown.deficitItemCount > 0 ? (
         <>
          <AlertTriangle className="w-3.5 h-3.5 text-rose-400/80" />
          <span>装备缺口 <strong className="text-rose-400 font-bold">-{breakdown.totalDeficitCount.toLocaleString()}</strong></span>
         </>
        ) : (
         <>
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400/80" />
          <span className="text-emerald-400">100% 满编</span>
         </>
        )}
       </div>
      </div>

      {/* Row 2: 操作按钮 */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 sm:pt-1 border-t border-slate-800/50 sm:border-t-0">
       <div className="flex items-center gap-2 flex-wrap">
        {/* 造价法典 (Ghost) */}
        <button
         type="button"
         onClick={() => setShowRuleModal(true)}
         className="px-2 py-1 text-slate-400 hover:text-white transition flex items-center gap-1 cursor-pointer font-medium text-[11px] sm:text-xs bg-slate-950/30 sm:bg-transparent rounded sm:rounded-none border border-slate-800/50 sm:border-0"
        >
         <BookOpen className="w-3.5 h-3.5" />
         造价法典
        </button>
        
        <div className="w-px h-3 bg-slate-800 hidden sm:block"></div>

        {/* 时间推演 (Secondary) */}
        {isOwner && (
         <div className="flex items-center gap-1">
          <span className="text-slate-500 mr-1 hidden sm:inline text-[11px]">模拟时间</span>
          <button
           type="button"
           onClick={() => handleSimulateProduction(1)}
           disabled={isSaving}
           className="px-2.5 py-1 bg-slate-800/50 hover:bg-slate-700 text-slate-300 rounded border border-slate-700/50 transition cursor-pointer disabled:opacity-50 text-[11px] sm:text-xs font-medium"
          >
           +1天
          </button>
          <button
           type="button"
           onClick={() => handleSimulateProduction(7)}
           disabled={isSaving}
           className="px-2.5 py-1 bg-slate-800/50 hover:bg-slate-700 text-slate-300 rounded border border-slate-700/50 transition cursor-pointer disabled:opacity-50 text-[11px] sm:text-xs font-medium"
          >
           +7天
          </button>
         </div>
        )}

        {/* 即时结算 (Secondary) */}
        <button
         type="button"
         onClick={handleImmediateSettle}
         disabled={isSettling}
         className="px-2.5 py-1 bg-slate-800/50 hover:bg-slate-700 text-slate-300 rounded border border-slate-700/50 transition flex items-center gap-1 cursor-pointer disabled:opacity-50 text-[11px] sm:text-xs font-medium ml-1 sm:ml-0"
        >
         <RefreshCw className={`w-3.5 h-3.5 ${isSettling ? 'animate-spin' : ''}`} />
         即时结算
        </button>
       </div>

       {/* 主要操作：保存排产 (Primary) */}
       {isOwner && (
        <button
         type="button"
         onClick={handleSaveAll}
         disabled={isSaving}
         className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-sm text-xs w-full sm:w-auto justify-center"
        >
         <Save className="w-4 h-4" />
         {isSaving ? '保存中...' : '保存排产'}
        </button>
       )}
      </div>
     </div>
    </div>
   </div>

   {/* ─────────────────────────────────────────────────────────────
     4. 抽屉式侧边面板：装备详情与编制消耗 (Slide-Over Strategic Inspector)
     ───────────────────────────────────────────────────────────── */}
   {selectedEquipment && (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-xs animate-fadeIn" onClick={() => setSelectedEquipmentId(null)}>
     <div
      className="w-full sm:w-96 md:w-[440px] h-full bg-slate-900 border-l border-slate-800 p-5 shadow-2xl space-y-4 overflow-y-auto"
      onClick={(e) => e.stopPropagation()}
     >
      {/* Header with Close */}
      <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-3">
       <div>
        <h4 className="font-bold text-white text-base">{selectedEquipment.name}</h4>
        <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-1 font-mono">
         <span className="text-indigo-400 font-sans font-bold">{selectedEquipment.categoryLabel}</span>
         <span>·</span>
         <span className="text-amber-400 font-bold">
          {selectedEquipment.template.baseCost} IC / {selectedEquipment.unitName}
         </span>
        </div>
       </div>

       <button
        type="button"
        onClick={() => setSelectedEquipmentId(null)}
        className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
        title="关闭详情"
       >
        <X className="w-5 h-5" />
       </button>
      </div>

      {/* Strategic Balances Breakdown */}
      <div className="grid grid-cols-2 gap-2.5 bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 text-xs">
       <div>
        <span className="text-[11px] text-slate-400 block">战备库存现量</span>
        <div className="text-lg font-black font-mono text-white mt-0.5">
         {Math.floor(selectedEquipment.currentStock).toLocaleString()}
         <span className="text-[10px] font-normal text-slate-500 ml-1">{selectedEquipment.unitName}</span>
        </div>
       </div>

       <div>
        <span className="text-[11px] text-slate-400 block">在役军队总需求</span>
        <div className="text-lg font-black font-mono text-slate-300 mt-0.5">
         {selectedEquipment.armyDemand.toLocaleString()}
         <span className="text-[10px] font-normal text-slate-500 ml-1">{selectedEquipment.unitName}</span>
        </div>
       </div>

       <div className="col-span-2 pt-2.5 border-t border-slate-800/60 flex items-center justify-between">
        <span className="text-slate-400 font-medium">战备平衡状态:</span>
        {selectedEquipment.isDeficit ? (
         <span className="font-mono font-bold text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-900 text-xs">
          亏空 -{selectedEquipment.deficitAmount.toLocaleString()} {selectedEquipment.unitName}
         </span>
        ) : (
         <span className="font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-900 text-xs">
          盈余 +{selectedEquipment.surplusAmount.toLocaleString()} {selectedEquipment.unitName}
         </span>
        )}
       </div>
      </div>

      {/* Factory Allocation Slider & Stepper */}
      {isOwner && (
       <div className="space-y-2 bg-slate-950 p-3.5 rounded-xl border border-slate-800/80">
        <div className="flex items-center justify-between text-xs">
         <span className="font-bold text-slate-300 flex items-center gap-1.5">
          <Factory className="w-3.5 h-3.5 text-amber-400" />
          军工厂排产分配
         </span>
         <span className="font-mono font-bold text-amber-300">
          {selectedEquipment.assignedFactories} / {totalMilitaryFactories} 座
         </span>
        </div>

        <div className="flex items-center gap-2 pt-1">
         <input
          type="range"
          min="0"
          max={selectedEquipment.assignedFactories + idleFactories}
          value={selectedEquipment.assignedFactories}
          onChange={(e) => handleSetFactoryAllocation(selectedEquipment.id, parseInt(e.target.value) || 0)}
          className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
         />
         <div className="flex items-center gap-1 shrink-0">
          <button
           type="button"
           onClick={() => handleStepFactoryAllocation(selectedEquipment.id, -1)}
           disabled={selectedEquipment.assignedFactories <= 0}
           className="w-6 h-6 bg-slate-800 hover:bg-slate-700 disabled:opacity-20 rounded text-white font-bold text-xs cursor-pointer"
          >
           -
          </button>
          <button
           type="button"
           onClick={() => handleStepFactoryAllocation(selectedEquipment.id, 1)}
           disabled={idleFactories <= 0}
           className="w-6 h-6 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-20 rounded text-white font-bold text-xs cursor-pointer"
          >
           +
          </button>
         </div>
        </div>

        <div className="text-[11px] text-slate-400 pt-1 flex items-center justify-between font-mono">
         <span>
          预计日产: <strong className="text-emerald-400">+{selectedEquipment.dailyOutput.toLocaleString()}</strong> {selectedEquipment.unitName}/天
         </span>
         <span>
          占用工业力: <strong className="text-amber-400">{selectedEquipment.assignedFactories * 500}</strong> IC
         </span>
        </div>
       </div>
      )}

      {/* Production Priority Controls */}
      <div className="space-y-1.5">
       <span className="text-[11px] text-slate-400 font-bold block uppercase tracking-wider">
        战略生产优先级
       </span>
       <div className="grid grid-cols-3 gap-1.5 text-xs">
        {[
         { level: 1 as PriorityLevel, label: 'Ⅰ 战略核心', color: 'border-rose-700 text-rose-300' },
         { level: 2 as PriorityLevel, label: 'Ⅱ 常规排产', color: 'border-indigo-700 text-indigo-300' },
         { level: 3 as PriorityLevel, label: 'Ⅲ 低级储备', color: 'border-slate-700 text-slate-400' },
        ].map((p) => (
         <button
          key={p.level}
          type="button"
          onClick={() => handleSetPriority(selectedEquipment.id, p.level)}
          className={`py-1.5 px-2 rounded-lg font-bold border transition text-center cursor-pointer ${
           selectedEquipment.priority === p.level
            ? `bg-slate-800 ${p.color} ring-1 ring-white/20`
            : 'bg-slate-950 border-slate-800/80 text-slate-500 hover:text-slate-300'
          }`}
         >
          {p.label}
         </button>
        ))}
       </div>
      </div>

      {/* Army Demand Divisions Breakdown */}
      <div className="space-y-2 pt-1 border-t border-slate-800">
       <div className="flex items-center justify-between text-xs">
        <span className="font-bold text-slate-300 flex items-center gap-1">
         <Shield className="w-3.5 h-3.5 text-sky-400" />
         陆军编制消耗明细
        </span>
        <span className="text-[10px] text-slate-400 font-mono font-bold">
         {consumingDivisions.length} 个师级部队
        </span>
       </div>

       {consumingDivisions.length === 0 ? (
        <div className="p-3 bg-slate-950 rounded-lg border border-slate-800/80 text-slate-500 text-[11px] text-center">
         当前陆军编制暂未配装此项装备
        </div>
       ) : (
        <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
         {consumingDivisions.map((item, idx) => (
          <div
           key={idx}
           className="p-2.5 bg-slate-950 rounded-lg border border-slate-800/60 flex items-center justify-between text-xs"
          >
           <div>
            <div className="font-bold text-slate-200">{item.division.name}</div>
            <div className="text-[10px] text-slate-500">{item.division.type} · {item.division.provinceName}</div>
           </div>
           <div className="text-right font-mono font-bold text-amber-400">
            {item.countPerDiv.toLocaleString()} <span className="text-[10px] font-normal text-slate-500">{selectedEquipment.unitName}</span>
           </div>
          </div>
         ))}
        </div>
       )}
      </div>

      {/* Equipment Description & Tech Spec */}
      <div className="text-[11px] text-slate-400 bg-slate-950 p-3 rounded-xl border border-slate-800 leading-relaxed space-y-1.5">
       <div className="font-bold text-slate-300">技术规范与研发代号:</div>
       <div>{selectedEquipment.template.description}</div>
       <div className="text-indigo-400 font-mono">
        标准产出公式：1座军工厂 24h 产出 {selectedEquipment.template.outputFormula}
       </div>
      </div>
     </div>
    </div>
   )}

   {/* ─────────────────────────────────────────────────────────────
     5. 造价与产能换算表弹窗 (Rule Modal)
     ───────────────────────────────────────────────────────────── */}
   {showRuleModal && (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
     <div className="w-full max-w-4xl xl:max-w-5xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-5 text-white max-h-[90vh] overflow-y-auto space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
       <div className="flex items-center gap-2">
        <MilitaryFactoryPlantIcon size={20} className="text-amber-400" />
        <h3 className="font-black text-base text-white">国家军事工业造价与产能换算表</h3>
       </div>
       <button
        type="button"
        onClick={() => setShowRuleModal(false)}
        className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
       >
        <X className="w-5 h-5" />
       </button>
      </div>

      <MilitaryCostRuleTable />

      <div className="flex justify-end pt-2">
       <button
        type="button"
        onClick={() => setShowRuleModal(false)}
        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition cursor-pointer"
       >
        关闭速查表
       </button>
      </div>
     </div>
    </div>
   )}
  </div>
 );
};
