import React, { useState } from 'react';
import {
 PackageCheck,
 AlertTriangle,
 CheckCircle2,
 TrendingUp,
 Plus,
 Minus,
 Factory,
 Layers,
 ArrowUpRight,
 Shield,
 Zap,
 Filter,
 RefreshCw,
 Search,
} from 'lucide-react';
import { Nation, MilitaryProductionLine, MilitaryIndustryState } from '../types';
import {
 calculateNationalStockpileBreakdown,
 StockpileItemBreakdown,
 STANDARD_EQUIPMENT_TEMPLATES,
 CAPACITY_PER_MILITARY_FACTORY_24H,
 settleMilitaryProduction,
 getTotalMilitaryFactories,
} from '../lib/militaryIndustry';
import {
 MilitaryTankIcon,
 MilitaryFighterIcon,
 MilitaryTankDestroyerIcon,
 MilitarySPArtilleryIcon,
} from '../lib/icons';
import { api } from '../services/api';

interface NationalStockpileViewProps {
 nation: Nation;
 onUpdateNation: (nation: Nation) => void;
 showToast?: (message: string) => void;
 onSwitchToLines?: () => void;
}

export const NationalStockpileView: React.FC<NationalStockpileViewProps> = ({
 nation,
 onUpdateNation,
 showToast,
 onSwitchToLines,
}) => {
 const [filterCategory, setFilterCategory] = useState<string>('all');
 const [searchQuery, setSearchQuery] = useState('');
 const [filterStatus, setFilterStatus] = useState<'all' | 'deficit' | 'surplus'>('all');
 const [isUpdating, setIsUpdating] = useState(false);

 // 计算全国后备仓库全景
 const breakdown = calculateNationalStockpileBreakdown(nation);

 // 计算总军工厂与已分配军工厂
 const totalMilitaryFactories = getTotalMilitaryFactories(nation);
 const allocatedFactories = (nation.militaryIndustry?.productionLines || []).reduce(
  (acc, l) => acc + (l.assignedFactories || 0),
  0
 );
 const idleFactories = Math.max(0, totalMilitaryFactories - allocatedFactories);

 // 快速为某项装备调整军工厂排产
 const handleQuickAdjustFactory = async (equipmentId: string, delta: number) => {
  const lines = nation.militaryIndustry?.productionLines || [];
  const template = STANDARD_EQUIPMENT_TEMPLATES.find((t) => t.id === equipmentId);
  if (!template) return;

  let nextLines: MilitaryProductionLine[] = [...lines];
  const existingIndex = nextLines.findIndex((l) => l.equipmentId === equipmentId);

  if (delta > 0 && idleFactories < delta) {
   showToast?.(`全国空闲军工厂不足！当前仅剩 ${idleFactories} 座可用军工厂。`);
   return;
  }

  if (existingIndex >= 0) {
   const current = nextLines[existingIndex];
   const newFactories = Math.max(0, current.assignedFactories + delta);
   if (newFactories === 0 && delta < 0) {
    // 保留产线但工厂置0
    nextLines[existingIndex] = {
     ...current,
     assignedFactories: 0,
     dailyCapacity: 0,
     dailyOutput: 0,
    };
   } else {
    const newCap = newFactories * CAPACITY_PER_MILITARY_FACTORY_24H;
    const newOutput = Math.round((newCap / current.unitCost) * 100) / 100;
    nextLines[existingIndex] = {
     ...current,
     assignedFactories: newFactories,
     dailyCapacity: newCap,
     dailyOutput: newOutput,
    };
   }
  } else if (delta > 0) {
   // 新建一条产线
   const tier = template.tiers[0];
   const newCap = delta * CAPACITY_PER_MILITARY_FACTORY_24H;
   const newOutput = Math.round((newCap / tier.totalCost) * 100) / 100;
   nextLines.push({
    id: 'line_' + Math.random().toString(36).substring(2, 9),
    equipmentId: template.id,
    equipmentName: tier.name,
    category: template.category,
    unitCost: tier.totalCost,
    unitCostDisplay: tier.costDisplay,
    assignedFactories: delta,
    dailyCapacity: newCap,
    dailyOutput: newOutput,
   });
  }

  try {
   setIsUpdating(true);
   const stateToSave: MilitaryIndustryState = {
    productionLines: nextLines,
    customDesigns: nation.militaryIndustry?.customDesigns || [],
    stockpiles: nation.militaryIndustry?.stockpiles || {},
    lastUpdated: new Date().toISOString(),
   };
   const res = await api.nations.updateMilitaryIndustry(nation.id, stateToSave);
   onUpdateNation(res.nation);
   showToast?.(`已成功调整【${template.name}】军工排产分配（${delta > 0 ? '+' : ''}${delta} 厂）！`);
  } catch (err: any) {
   console.error(err);
   showToast?.(`调整排产失败: ${err.message || '网络错误'}`);
  } finally {
   setIsUpdating(false);
  }
 };

 // 手动即时结算入库
 const handleImmediateSettle = async () => {
  try {
   setIsUpdating(true);
   const { updatedStockpiles, lastUpdated, hasProduced } = settleMilitaryProduction(
    nation,
    Date.now()
   );
   const stateToSave: MilitaryIndustryState = {
    productionLines: nation.militaryIndustry?.productionLines || [],
    customDesigns: nation.militaryIndustry?.customDesigns || [],
    stockpiles: updatedStockpiles,
    lastUpdated,
   };
   const res = await api.nations.updateMilitaryIndustry(nation.id, stateToSave);
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
   setIsUpdating(false);
  }
 };

 // 渲染图标
 const renderItemIcon = (item: StockpileItemBreakdown) => {
  if (item.category === 'armor' && item.id.includes('tank_destroyer')) {
   return <MilitaryTankDestroyerIcon size={20} className="text-amber-400" />;
  }
  if (item.category === 'armor') {
   return <MilitaryTankIcon size={20} className="text-amber-500" />;
  }
  if (item.category === 'artillery' && item.id.includes('sp_artillery')) {
   return <MilitarySPArtilleryIcon size={20} className="text-rose-400" />;
  }
  if (item.category === 'aviation') {
   return <MilitaryFighterIcon size={20} className="text-sky-400" />;
  }
  return <PackageCheck className="w-5 h-5 text-indigo-400" />;
 };

 // 过滤列表
 const filteredItems = breakdown.items.filter((item) => {
  if (filterCategory !== 'all' && item.category !== filterCategory) return false;
  if (filterStatus === 'deficit' && !item.isDeficit) return false;
  if (filterStatus === 'surplus' && item.isDeficit) return false;
  if (searchQuery.trim() && !item.name.toLowerCase().includes(searchQuery.toLowerCase().trim())) {
   return false;
  }
  return true;
 });

 return (
  <div className="space-y-6 animate-fadeIn">
   {/* Overview Stats Bar */}
   <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
    {/* Card 1: Total Stockpile */}
    <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-white shadow-sm flex flex-col justify-between">
     <div className="flex items-center justify-between text-slate-400 text-xs">
      <span>全域战备库存总量</span>
      <PackageCheck className="w-4 h-4 text-indigo-400" />
     </div>
     <div className="mt-2">
      <div className="text-2xl font-black font-mono text-white tracking-tight">
       {breakdown.totalStockpileCount.toLocaleString()}
      </div>
      <div className="text-xs text-slate-400 mt-0.5">各类制式武器与重装备总和</div>
     </div>
    </div>

    {/* Card 2: Active Army Demand */}
    <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-white shadow-sm flex flex-col justify-between">
     <div className="flex items-center justify-between text-slate-400 text-xs">
      <span>在役军队编制总需求</span>
      <Shield className="w-4 h-4 text-sky-400" />
     </div>
     <div className="mt-2">
      <div className="text-2xl font-black font-mono text-white tracking-tight">
       {breakdown.totalArmyDemandCount.toLocaleString()}
      </div>
      <div className="text-xs text-slate-400 mt-0.5">
       全军现有 {nation.army?.divisions?.length || 0} 个师级编制额定满装
      </div>
     </div>
    </div>

    {/* Card 3: Deficit vs Surplus Summary */}
    <div
     className={`p-4 border rounded-2xl text-white shadow-sm flex flex-col justify-between ${
      breakdown.deficitItemCount > 0
       ? 'bg-rose-950/40 border-rose-900/50'
       : 'bg-emerald-950/40 border-emerald-900/50'
     }`}
    >
     <div className="flex items-center justify-between text-xs">
      <span className={breakdown.deficitItemCount > 0 ? 'text-rose-300' : 'text-emerald-300'}>
       {breakdown.deficitItemCount > 0 ? '装备缺口 / 亏空项目' : '战备库存充足率'}
      </span>
      {breakdown.deficitItemCount > 0 ? (
       <AlertTriangle className="w-4 h-4 text-rose-400" />
      ) : (
       <CheckCircle2 className="w-4 h-4 text-emerald-400" />
      )}
     </div>
     <div className="mt-2">
      <div
       className={`text-2xl font-black font-mono tracking-tight ${
        breakdown.deficitItemCount > 0 ? 'text-rose-400' : 'text-emerald-400'
       }`}
      >
       {breakdown.deficitItemCount > 0
        ? `${breakdown.deficitItemCount} 项存在亏空`
        : '100% 满编储备'}
      </div>
      <div className="text-xs text-slate-400 mt-0.5">
       {breakdown.deficitItemCount > 0
        ? `总亏空缺编 ${breakdown.totalDeficitCount.toLocaleString()} 件`
        : '所有装备均处于健康盈余状态'}
      </div>
     </div>
    </div>

    {/* Card 4: Operating Factories */}
    <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-white shadow-sm flex flex-col justify-between">
     <div className="flex items-center justify-between text-slate-400 text-xs">
      <span>军工运转与闲置</span>
      <Factory className="w-4 h-4 text-amber-400" />
     </div>
     <div className="mt-2">
      <div className="text-2xl font-black font-mono text-amber-400 tracking-tight">
       {allocatedFactories} / {totalMilitaryFactories}{' '}
       <span className="text-xs font-normal text-slate-400">座</span>
      </div>
      <div className="text-xs text-slate-400 mt-0.5">
       {idleFactories > 0 ? (
        <span className="text-amber-300 font-semibold">闲置 {idleFactories} 座可用</span>
       ) : (
        <span className="text-slate-400">100% 满负荷排产</span>
       )}
      </div>
     </div>
    </div>
   </div>

   {/* Deficit Alert Callout (if deficits exist) */}
   {breakdown.deficitItemCount > 0 && (
    <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
     <div className="flex items-start gap-3">
      <div className="p-2 bg-rose-500/20 rounded-xl text-rose-400 shrink-0 mt-0.5">
       <AlertTriangle className="w-5 h-5" />
      </div>
      <div>
       <div className="text-sm font-bold text-rose-400 flex items-center gap-2">
         国家军械后备库发现装备亏空缺口！
       </div>
       <div className="text-xs text-slate-300 mt-0.5 leading-relaxed">
        在役部队中有 {breakdown.deficitItemCount} 类核心武器未达到额定编制满员（共亏空{' '}
        <span className="font-mono font-bold text-rose-300">
         {breakdown.totalDeficitCount.toLocaleString()}
        </span>{' '}
        件）。请在下方点击加号「+」为亏空装备迅速调派军工厂增产！
       </div>
      </div>
     </div>

     <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
      {onSwitchToLines && (
       <button
        type="button"
        onClick={onSwitchToLines}
        className="w-full sm:w-auto px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
       >
        <Layers className="w-4 h-4" />
        前往排产线调整
       </button>
      )}
     </div>
    </div>
   )}

   {/* Control Bar: Filters, Search, Settle Button */}
   <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
    {/* Category Filters */}
    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
     {[
      { id: 'all', label: '全部军械' },
      { id: 'infantry', label: '步兵轻武器' },
      { id: 'artillery', label: '压制火炮' },
      { id: 'armor', label: '坦克与装甲' },
      { id: 'support', label: '战地后勤' },
      { id: 'motorized', label: '机动车辆' },
      { id: 'mechanized', label: '机械化载具' },
      { id: 'aviation', label: '航空战机' },
     ].map((tab) => (
      <button
       key={tab.id}
       type="button"
       onClick={() => setFilterCategory(tab.id)}
       className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
        filterCategory === tab.id
         ? 'bg-indigo-600 text-white shadow-sm'
         : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'
       }`}
      >
       {tab.label}
      </button>
     ))}
    </div>

    {/* Status toggles & Actions */}
    <div className="flex items-center gap-2 shrink-0">
     <div className="flex items-center bg-slate-800 rounded-xl p-0.5 text-xs">
      <button
       type="button"
       onClick={() => setFilterStatus('all')}
       className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
        filterStatus === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
       }`}
      >
       全部
      </button>
      <button
       type="button"
       onClick={() => setFilterStatus('deficit')}
       className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1 ${
        filterStatus === 'deficit'
         ? 'bg-rose-600 text-white'
         : 'text-rose-400 hover:text-rose-300'
       }`}
      >
       仅亏空 ({breakdown.deficitItemCount})
      </button>
      <button
       type="button"
       onClick={() => setFilterStatus('surplus')}
       className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
        filterStatus === 'surplus'
         ? 'bg-emerald-600 text-white'
         : 'text-emerald-400 hover:text-emerald-300'
       }`}
      >
       仅盈余 ({breakdown.surplusItemCount})
      </button>
     </div>

     <button
      type="button"
      onClick={handleImmediateSettle}
      disabled={isUpdating}
      title="手动校准并即时入库军工产出"
      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold border border-slate-700 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
     >
      <RefreshCw className={`w-3.5 h-3.5 ${isUpdating ? 'animate-spin' : ''}`} />
      <span>即时结算</span>
     </button>
    </div>
   </div>

   {/* Equipment Detailed Grid Cards */}
   <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
    {filteredItems.map((item) => {
     const satisfactionRatio = item.armyDemand > 0 ? (item.currentStock / item.armyDemand) * 100 : 100;

     return (
      <div
       key={item.id}
       className={`p-4.5 rounded-2xl border transition-all duration-200 flex flex-col justify-between relative overflow-hidden ${
        item.isDeficit
         ? 'bg-slate-900/90 border-rose-900/60 shadow-rose-950/20'
         : 'bg-slate-900/90 border-slate-800 shadow-slate-950/20'
       }`}
      >
       {/* Top Accent Indicator */}
       <div
        className={`h-1 absolute top-0 left-0 right-0 ${
         item.isDeficit ? 'bg-rose-500' : 'bg-emerald-500/70'
        }`}
       />

       <div>
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
         <div className="flex items-center gap-2.5">
          <div className="p-2 bg-slate-800/80 border border-slate-700/60 rounded-xl shrink-0">
           {renderItemIcon(item)}
          </div>
          <div>
           <h5 className="font-bold text-white text-sm leading-snug">{item.name}</h5>
           <span className="text-[11px] text-slate-400 font-medium">{item.categoryLabel}</span>
          </div>
         </div>

         {/* Status Badge */}
         <div
          className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold flex items-center gap-1 shrink-0 ${
           item.isDeficit
            ? 'bg-rose-500/20 border border-rose-500/40 text-rose-400'
            : 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400'
          }`}
         >
          {item.isDeficit ? (
           <>
            <AlertTriangle className="w-3 h-3" />
            亏空 -{item.deficitAmount.toLocaleString()} {item.unitName}
           </>
          ) : (
           <>
            <CheckCircle2 className="w-3 h-3" />
            盈余 +{item.surplusAmount.toLocaleString()} {item.unitName}
           </>
          )}
         </div>
        </div>

        {/* Numbers Grid */}
        <div className="grid grid-cols-2 gap-2 mt-4 p-3 bg-slate-950/70 rounded-xl border border-slate-800/60">
         <div>
          <div className="text-[11px] text-slate-400">战备库存现量</div>
          <div className="text-lg font-black font-mono text-white mt-0.5">
           {item.currentStock.toLocaleString()}
           <span className="text-xs font-normal text-slate-400 ml-1">{item.unitName}</span>
          </div>
         </div>

         <div>
          <div className="text-[11px] text-slate-400">军队在役总需求</div>
          <div className="text-lg font-black font-mono text-slate-300 mt-0.5">
           {item.armyDemand.toLocaleString()}
           <span className="text-xs font-normal text-slate-500 ml-1">{item.unitName}</span>
          </div>
         </div>
        </div>

        {/* Fulfillment Progress Bar */}
        <div className="mt-3 space-y-1">
         <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-400">部队满装满足率</span>
          <span
           className={`font-mono font-bold ${
            item.isDeficit ? 'text-rose-400' : 'text-emerald-400'
           }`}
          >
           {Math.min(999, Math.round(satisfactionRatio))}%
          </span>
         </div>
         <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800">
          <div
           className={`h-full transition-all duration-300 rounded-full ${
            item.isDeficit ? 'bg-rose-500' : 'bg-emerald-500'
           }`}
           style={{ width: `${Math.min(100, satisfactionRatio)}%` }}
          />
         </div>
        </div>

        {/* Production Stats & Replenishment Days */}
        <div className="mt-3 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/60 pt-2.5">
         <div className="flex items-center gap-1.5">
          <Factory className="w-3.5 h-3.5 text-amber-400" />
          <span>日产速率:</span>
          <span className="font-mono font-bold text-amber-300">
           +{item.dailyOutput.toLocaleString()} {item.unitName}/24h
          </span>
         </div>

         {item.isDeficit && (
          <div className="text-[11px] text-rose-300 font-medium">
           {item.daysToBalance !== null
            ? `预计 ${item.daysToBalance} 天补齐缺口`
            : '未排产 (无法补齐)'}
          </div>
         )}
        </div>
       </div>

       {/* Bottom Quick Factory Allocation Controls */}
       <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
        <div className="text-xs text-slate-400 flex items-center gap-1">
         <span>当前排产:</span>
         <span className="font-bold text-white font-mono">{item.assignedFactories} 座军工厂</span>
        </div>

        <div className="flex items-center gap-1.5">
         <button
          type="button"
          onClick={() => handleQuickAdjustFactory(item.id, -1)}
          disabled={isUpdating || item.assignedFactories <= 0}
          title="减少1座分配给该装备的军工厂"
          className="p-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition cursor-pointer"
         >
          <Minus className="w-3.5 h-3.5" />
         </button>

         <button
          type="button"
          onClick={() => handleQuickAdjustFactory(item.id, 1)}
          disabled={isUpdating || idleFactories <= 0}
          title={idleFactories <= 0 ? '无闲置军工厂' : '增加1座军工厂为此装备增产'}
          className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
         >
          <Plus className="w-3.5 h-3.5" />
          <span>分配增产</span>
         </button>
        </div>
       </div>
      </div>
     );
    })}
   </div>

   {filteredItems.length === 0 && (
    <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-400">
     未检索到符合条件的装备后备记录
    </div>
   )}
  </div>
 );
};
