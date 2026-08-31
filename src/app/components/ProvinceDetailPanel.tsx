import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
 X,
 Hammer,
 ChevronDown,
 ChevronUp,
 ChevronLeft,
 ChevronRight,
 Route,
 Factory,
 Cog,
 Castle,
 Crosshair,
 Plane,
 Radio,
 Droplets,
 Clock,
 Zap,
 Truck,
 ShieldAlert,
 Fuel,
 Activity,
} from 'lucide-react';
import { Nation } from '../types';
import { getProvinceChineseName } from '../lib/provinceTranslations';
import { getProvinceTerrain } from '../lib/terrainEngine';
import {
 STRATEGIC_RESOURCES,
 StrategicResourceType,
 getProvinceResourceDeposits,
} from '../lib/strategicCommandEngine';
import {
 STRATEGIC_BUILDINGS,
 StrategicBuildingType,
 ProvinceDetailedBuildings,
 getTotalBuildingsInProvince,
 MAX_BUILDINGS_PER_PROVINCE,
 getInfrastructureBonus,
 RADAR_TECH_TIERS,
} from '../lib/constructionRules';

export interface ProvinceDetailPanelProps {
  provinceData: {
   id: string | number;
   name: string;
   properties: any;
  };
  ownerNation: Nation | null;
  myNation: Nation | null;
  onClose: () => void;
  onOpenConstruction?: () => void;
  onBuildInProvince?: (
   provinceId: string | number,
   provinceName: string,
   buildingType: StrategicBuildingType
  ) => void;
  onSelectNation?: (nation: Nation) => void;
  onNavigateProvince?: (direction: 'prev' | 'next') => void;
  onOpenDispute?: (targetNation: Nation, provinceName: string) => void;
 }

export const ProvinceDetailPanel: React.FC<ProvinceDetailPanelProps> = ({
  provinceData,
  ownerNation,
  myNation,
  onClose,
  onOpenConstruction,
  onBuildInProvince,
  onSelectNation,
  onNavigateProvince,
  onOpenDispute,
 }) => {
  const [activeTab, setActiveTab] = useState<'buildings' | 'garrison' | 'geo'>('buildings');
  const [expandedBuilding, setExpandedBuilding] = useState<string | null>(null);

  const { id: stateId, name, properties } = provinceData;
  const isMyProvince = Boolean(myNation && ownerNation && ownerNation.id === myNation.id);

  // Demographics & Terrain
  const rawManpower = Number(properties?.manpower || 1500000);
  const manpowerText =
   rawManpower >= 10000 ? `${(rawManpower / 10000).toFixed(1)}万` : rawManpower.toLocaleString();
  const subProvincesCount =
   properties?.provinceCount || properties?.provinceIds?.length || 1;
  const terrain = getProvinceTerrain(stateId, name, properties);
  const originalOwner = properties?.owner || '—';

  // Find nation custom record
  const myProvRecord = ownerNation?.provinces?.find(
   (p) =>
    String(p.id) === String(stateId) ||
    String(p.name).toLowerCase() === String(name).toLowerCase()
  );

  // Determine if this province is in an occupied or non-core annexed territory state
  const isOccupiedTerritory = Boolean(
   myProvRecord?.isCore === false ||
   myProvRecord?.occupationStatus === 'occupied' ||
   myProvRecord?.occupationStatus === 'combat' ||
   (ownerNation?.occupiedProvinces && (
    ownerNation.occupiedProvinces.includes(String(stateId)) ||
    ownerNation.occupiedProvinces.includes(name) ||
    (myProvRecord?.name && ownerNation.occupiedProvinces.includes(String(myProvRecord.name)))
   )) ||
   properties?.isOccupied ||
   properties?.occupationStatus === 'occupied' ||
   properties?.occupiedBy ||
   (originalOwner && originalOwner !== '—' && ownerNation && originalOwner !== ownerNation.name && myProvRecord?.isCore !== true)
  );

  // Buildings data
  const detailed: ProvinceDetailedBuildings = {
   infrastructure:
    myProvRecord?.detailedBuildings?.infrastructure ??
    terrain.infrastructureBase,
   anti_air: myProvRecord?.detailedBuildings?.anti_air ?? 0,
   air_base:
    myProvRecord?.detailedBuildings?.air_base ??
    (terrain.type === 'urban' ? 3 : terrain.type === 'plains' ? 2 : 1),
   radar_station: myProvRecord?.detailedBuildings?.radar_station ?? 0,
   civilian_factory:
    myProvRecord?.detailedBuildings?.civilian_factory ??
    (typeof myProvRecord?.civilianFactories === 'number'
     ? myProvRecord.civilianFactories
     : (terrain.type === 'urban' ? 4 : terrain.type === 'plains' ? 2 : 1)),
   military_factory:
    myProvRecord?.detailedBuildings?.military_factory ??
    (typeof myProvRecord?.militaryFactories === 'number'
     ? myProvRecord.militaryFactories
     : (terrain.type === 'urban' ? 3 : terrain.type === 'plains' ? 2 : 1)),
   naval_dockyard: myProvRecord?.detailedBuildings?.naval_dockyard ?? 0,
   synthetic_refinery: myProvRecord?.detailedBuildings?.synthetic_refinery ?? 0,
   fuel_silo: myProvRecord?.detailedBuildings?.fuel_silo ?? 0,
   railway: myProvRecord?.detailedBuildings?.railway ?? (terrain.type === 'urban' ? 3 : 2),
   supply_hub: myProvRecord?.detailedBuildings?.supply_hub ?? 1,
   fortress: myProvRecord?.detailedBuildings?.fortress ?? 0,
  };

  const totalBuildings = getTotalBuildingsInProvince(detailed);
  const infraBonus = Math.round(getInfrastructureBonus(detailed.infrastructure) * 100);
  const maxSlots = MAX_BUILDINGS_PER_PROVINCE;
  const radarTech = ownerNation?.radarTech || 'decimeter';

  // Active construction queues in this province
  const activeQueuesInProvince = (ownerNation?.constructionQueue || []).filter(
   (q) => String(q.provinceId) === String(stateId) || String(q.provinceName) === String(name)
  );

  // Garrison & Defense & Logistics Linkage
  const garrisonCount = Math.min(
   65000,
   Math.max(4500, Math.round(rawManpower * (isOccupiedTerritory ? 0.00075 : 0.00045)) + detailed.military_factory * 800)
  );
  const fortressBonus = detailed.fortress * 15;
  const airDefenseReduction = detailed.anti_air * 10 + (detailed.radar_station > 0 ? 5 : 0);

  // 1. 基建与后勤通量联动 (Supply Throughput %)
  const supplyThroughput = Math.min(
   200,
   Math.round(45 + detailed.infrastructure * 20 + detailed.supply_hub * 35 + detailed.railway * 8)
  );

  // 2. 部队战略机动速度增益 (%)
  const troopSpeedModifier =
   detailed.infrastructure === 1
    ? -15
    : Math.round((detailed.infrastructure - 2) * 12 + detailed.railway * 6);

  // 3. 恶劣路况与后勤缺额耗损率 (%)
  const attritionRateGrade =
   supplyThroughput < 80 ? Number(((80 - supplyThroughput) * 0.12).toFixed(1)) : 0.0;

  // 4. Strategic Resources of this province
  const rawDeposits = myProvRecord?.resources || getProvinceResourceDeposits(stateId, name, properties);
  const activeDeposits = (Object.keys(rawDeposits) as StrategicResourceType[])
   .filter((key) => rawDeposits[key] && rawDeposits[key]! > 0)
   .map((key) => ({
    key,
    def: STRATEGIC_RESOURCES[key],
    amount: rawDeposits[key]!,
   }));

  const toggleBuildingExpand = (key: string) => {
   setExpandedBuilding((prev) => (prev === key ? null : key));
  };

  const handleQuickBuild = (e: React.MouseEvent, type: StrategicBuildingType) => {
   e.stopPropagation();
   if (!isMyProvince) return;
   onBuildInProvince?.(stateId, name, type);
  };

  return (
   <div
    className="fixed inset-0 z-50 flex flex-col items-center justify-end pb-2 sm:pb-4 pointer-events-auto overflow-hidden"
    onWheel={(e) => e.stopPropagation()}
    onTouchStart={(e) => e.stopPropagation()}
    onTouchMove={(e) => e.stopPropagation()}
    onTouchEnd={(e) => e.stopPropagation()}
    onMouseDown={(e) => e.stopPropagation()}
    onMouseMove={(e) => e.stopPropagation()}
    onMouseUp={(e) => e.stopPropagation()}
    onPointerDown={(e) => e.stopPropagation()}
   >
    {/* Background Soft Backdrop */}
    <motion.div
     initial={{ opacity: 0 }}
     animate={{ opacity: 1 }}
     exit={{ opacity: 0 }}
     onClick={onClose}
     className="absolute inset-0 bg-black/40 cursor-pointer"
    />

    {/* PC Grand Strategy Province Command Panel */}
    <motion.div
     id="province-detail-panel"
     initial={{ y: 40, opacity: 0 }}
     animate={{ y: 0, opacity: 1 }}
     exit={{ y: 40, opacity: 0 }}
     transition={{
      type: 'spring',
      stiffness: 400,
      damping: 32,
      mass: 0.6,
     }}
     onClick={(e) => e.stopPropagation()}
     onWheel={(e) => e.stopPropagation()}
     onTouchStart={(e) => e.stopPropagation()}
     onTouchMove={(e) => e.stopPropagation()}
     onTouchEnd={(e) => e.stopPropagation()}
     onMouseDown={(e) => e.stopPropagation()}
     onMouseMove={(e) => e.stopPropagation()}
     onMouseUp={(e) => e.stopPropagation()}
     onPointerDown={(e) => e.stopPropagation()}
     className={`relative z-10 w-[96%] sm:w-[540px] max-h-[68vh] sm:max-h-[65vh] text-slate-200 shadow-2xl overflow-hidden flex flex-col font-sans select-none rounded-[2px] ${
      isOccupiedTerritory
       ? 'bg-[#140a0f] border border-rose-600/90'
       : 'bg-[#0c121e] border border-slate-700/90'
     }`}
     style={{
      boxShadow: isOccupiedTerritory
       ? '0 16px 40px -4px rgba(225, 29, 72, 0.45), 0 0 0 1px rgba(244, 63, 94, 0.4)'
       : '0 16px 36px -4px rgba(0, 0, 0, 0.9), 0 0 0 1px rgba(255, 255, 255, 0.05)',
     }}
    >
     {/* Top Accent Bar */}
     <div
      className="h-[3px] w-full shrink-0"
      style={{ backgroundColor: isOccupiedTerritory ? '#e11d48' : (ownerNation?.flagColor || '#475569') }}
     />

     {/* 1. Header: Province Identity & Administrative Level */}
     <div
      className={`px-3.5 py-2.5 border-b shrink-0 ${
       isOccupiedTerritory
        ? 'border-rose-900/60 bg-[#1c0d16]'
        : 'border-slate-800 bg-[#0e1626]'
      }`}
     >
      <div className="flex items-start justify-between gap-3">
       <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2 flex-wrap">
         <h2 className="text-base sm:text-lg font-bold text-slate-100 tracking-tight truncate">
          {getProvinceChineseName(name, stateId) || name}
         </h2>
         <span
          className={`text-xs font-mono font-bold tracking-wide shrink-0 ${
           isOccupiedTerritory ? 'text-rose-400' : 'text-amber-400'
          }`}
         >
          #{stateId}
         </span>
         <span className="text-[11px] text-slate-500 font-mono shrink-0">
          [UID: {stateId}]
         </span>
         {isOccupiedTerritory && (
          <span className="px-1.5 py-0.2 text-[10px] font-bold rounded-[2px] bg-rose-950 text-rose-300 border border-rose-600/80 flex items-center gap-1 shrink-0 whitespace-nowrap">
           <ShieldAlert className="w-3 h-3 text-rose-400 shrink-0" />
           <span>军管区</span>
          </span>
         )}
        </div>

        {/* Subtitle: Clean text row separated by subtle vertical bars */}
        <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-400 truncate flex-wrap">
         {ownerNation ? (
          <button
           type="button"
           onClick={() => onSelectNation?.(ownerNation)}
           className="hover:text-slate-200 transition flex items-center gap-1 cursor-pointer text-slate-300 font-medium shrink-0 whitespace-nowrap"
          >
           <span
            className="w-2.5 h-2.5 inline-block border border-slate-600 rounded-[1px] shrink-0"
            style={{ backgroundColor: ownerNation.flagColor }}
           />
           <span className="font-semibold text-slate-200">{ownerNation.name}</span>
           {isMyProvince && (
            <span
             className={`text-[10px] font-mono font-bold ${
              isOccupiedTerritory ? 'text-rose-400' : 'text-amber-400'
             }`}
            >
             ({isOccupiedTerritory ? '占领军管' : '领地'})
            </span>
           )}
          </button>
         ) : (
          <span className="text-slate-400 font-medium shrink-0 whitespace-nowrap">中立 · 原属 {originalOwner}</span>
         )}
         <span className={isOccupiedTerritory ? 'text-rose-900' : 'text-slate-600'}>|</span>
         <span
          className={`px-1.5 py-0.2 text-[10px] font-bold rounded-[2px] border flex items-center gap-1 shrink-0 whitespace-nowrap ${terrain.bgClass} ${terrain.textClass} ${terrain.borderClass}`}
          title={`${terrain.label} · ${terrain.combatEffect}`}
         >
          <span className="text-[10px]">{terrain.tacticalIcon}</span>
          <span>{terrain.label}</span>
         </span>
         <span className={isOccupiedTerritory ? 'text-rose-900' : 'text-slate-600'}>|</span>
         <span className="text-slate-400 truncate whitespace-nowrap">{subProvincesCount}地块辖区</span>
        </div>
       </div>

       {/* Navigation & Close */}
       <div className="flex items-center gap-1 shrink-0">
        {onNavigateProvince && (
         <div
          className={`flex items-center border rounded-[2px] mr-1 ${
           isOccupiedTerritory
            ? 'bg-rose-950/60 border-rose-800/80'
            : 'bg-slate-900 border-slate-700/80'
          }`}
         >
          <button
           type="button"
           onClick={() => onNavigateProvince('prev')}
           className="px-1.5 py-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
           title="上一个省份"
          >
           <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className={isOccupiedTerritory ? 'text-rose-900' : 'text-slate-700'}>|</span>
          <button
           type="button"
           onClick={() => onNavigateProvince('next')}
           className="px-1.5 py-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
           title="下一个省份"
          >
           <ChevronRight className="w-3.5 h-3.5" />
          </button>
         </div>
        )}
        <button
         type="button"
         onClick={onClose}
         className={`p-1 rounded-[2px] transition cursor-pointer shrink-0 border ${
          isOccupiedTerritory
           ? 'text-rose-300 hover:text-white hover:bg-rose-900/60 border-transparent hover:border-rose-700'
           : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800 border-transparent hover:border-slate-700'
         }`}
         title="关闭"
        >
         <X className="w-4 h-4" />
        </button>
       </div>
      </div>

      {/* 2. Grand Strategy Macro Status Bar */}
      <div
       className={`mt-2 pt-1.5 border-t grid grid-cols-4 divide-x text-left ${
        isOccupiedTerritory
         ? 'border-rose-900/50 divide-rose-900/40 bg-rose-950/20'
         : 'border-slate-800/90 divide-slate-800/80'
       }`}
      >
       <div className="pr-2">
        <div className="text-[10px] text-slate-400 font-medium whitespace-nowrap">当地人口</div>
        <div
         className={`text-xs sm:text-sm font-bold font-mono mt-0.5 whitespace-nowrap ${
          isOccupiedTerritory ? 'text-rose-300' : 'text-slate-100'
         }`}
        >
         {manpowerText}
         {isOccupiedTerritory && (
          <span className="text-[9px] text-rose-400/90 font-normal ml-0.5">(-75%)</span>
         )}
        </div>
       </div>

       <div className="px-2">
        <div className="text-[10px] text-slate-400 font-medium whitespace-nowrap">工业产能</div>
        <div className="text-xs sm:text-sm font-bold font-mono text-slate-100 mt-0.5 whitespace-nowrap">
         {detailed.civilian_factory + detailed.military_factory}{' '}
         <span className="text-[10px] font-normal text-slate-400">
          ({detailed.civilian_factory}民/{detailed.military_factory}军)
         </span>
        </div>
       </div>

       <div className="px-2">
        <div className="text-[10px] text-slate-400 font-medium whitespace-nowrap">基础设施</div>
        <div className="text-xs sm:text-sm font-bold font-mono text-slate-100 mt-0.5 whitespace-nowrap">
         Lv.{detailed.infrastructure}
        </div>
       </div>

       <div className="pl-2">
        <div className="text-[10px] text-slate-400 font-medium whitespace-nowrap">要塞工事</div>
        <div className="text-xs sm:text-sm font-bold font-mono text-slate-100 mt-0.5 whitespace-nowrap">
         Lv.{detailed.fortress}
        </div>
       </div>
      </div>

      {/* Strategic Resources Bar */}
      <div
       className={`mt-2 pt-1.5 border-t flex items-center justify-between gap-2 flex-wrap text-left ${
        isOccupiedTerritory
         ? 'border-rose-900/40 bg-rose-950/20'
         : 'border-slate-800/80 bg-slate-900/40'
       } p-1.5 rounded-[2px]`}
      >
       <div className="flex items-center gap-1.5 shrink-0">
        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">战略资源:</span>
       </div>
       <div className="flex items-center gap-1.5 flex-wrap">
        {activeDeposits.length > 0 ? (
         activeDeposits.map((item) => (
          <div
           key={item.key}
           className="flex items-center gap-1 px-1.5 py-0.5 rounded-[2px] bg-slate-950/80 border border-slate-700/80 font-mono text-[11px]"
           title={`${item.def.name}: 基础日产量 +${item.amount}`}
          >
           <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: item.def.color }} />
           <span className="text-slate-300 font-medium text-[10px]">{item.def.name}</span>
           <span className="font-bold text-amber-300 tabular-nums">+{item.amount}</span>
          </div>
         ))
        ) : (
         <span className="text-[10px] text-slate-500 font-medium">无战略资源</span>
        )}
       </div>
      </div>
     </div>

     {/* Occupied Territory Red Alert Notice Banner */}
     {isOccupiedTerritory && (
      <div className="px-3.5 py-1.5 bg-[#180911] border-b border-rose-900/70 flex items-center justify-between gap-2 overflow-hidden text-xs">
       <div className="flex items-center gap-1.5 min-w-0 shrink truncate">
        <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0" />
        <span className="text-[11px] font-semibold text-rose-200 truncate whitespace-nowrap">
         非核心领土 · 军事戒严管制
        </span>
       </div>
       <div className="flex items-center gap-1.5 text-[10px] font-mono text-rose-300 shrink-0 whitespace-nowrap">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block shrink-0" />
        <span>抵抗风险: 低 (驻军压制中)</span>
       </div>
      </div>
     )}

     {/* 3. Text Tab Navigation */}
     <div
      className={`flex items-center justify-between border-b px-4 shrink-0 ${
       isOccupiedTerritory
        ? 'border-rose-900/50 bg-[#12080e]'
        : 'border-slate-800 bg-[#0a0f18]'
      }`}
     >
      <div className="flex items-center gap-6">
       {[
        { id: 'buildings', label: '建设与工业' },
        { id: 'garrison', label: isOccupiedTerritory ? '占领与卫戍' : '驻军与防御' },
        { id: 'geo', label: '行政法理' },
       ].map((tab) => {
        const isActive = activeTab === tab.id;
        return (
         <button
          key={tab.id}
          type="button"
          onClick={() => setActiveTab(tab.id as any)}
          className={`py-2.5 text-xs font-semibold tracking-wide transition cursor-pointer border-b-2 ${
           isActive
            ? isOccupiedTerritory
              ? 'border-rose-500 text-rose-300'
              : 'border-amber-500 text-amber-300'
            : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
         >
          {tab.label}
         </button>
        );
       })}
      </div>

      <div className="flex items-center gap-2">
       {isMyProvince && onOpenConstruction && (
        <button
         type="button"
         onClick={onOpenConstruction}
         className={`text-[11px] font-medium transition flex items-center gap-1 px-2 py-1 border rounded-[2px] cursor-pointer ${
          isOccupiedTerritory
           ? 'text-rose-300 hover:text-rose-100 bg-rose-950/70 hover:bg-rose-900/80 border-rose-600/50'
           : 'text-amber-300 hover:text-amber-200 bg-slate-900 hover:bg-slate-800 border-amber-500/40'
         }`}
        >
         <Hammer className="w-3 h-3" />
         <span>规划面板</span>
        </button>
       )}

       {!isMyProvince && ownerNation && onOpenDispute && (
        <button
         type="button"
         onClick={() => onOpenDispute(ownerNation, name)}
         className="text-[11px] text-rose-300 hover:text-rose-200 font-medium transition flex items-center gap-1 px-2 py-1 bg-rose-950/70 hover:bg-rose-900/80 border border-rose-600/60 rounded-[2px] cursor-pointer"
        >
         <Crosshair className="w-3 h-3 text-rose-400" />
         <span>领土宣称 / 推演</span>
        </button>
       )}
      </div>
     </div>

     {/* Combat Status Block */}
     {(myProvRecord as any)?.occupationValue > 0 || (myProvRecord as any)?.occupationStatus === 'combat' ? (
      <div className="px-3.5 py-2.5 bg-rose-950/30 border-b border-rose-900/40 flex flex-col gap-2">
       <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-rose-300 font-bold text-xs">
         <Crosshair className="w-4 h-4 text-rose-400" />
         <span>战场争夺状态</span>
        </div>
        <span className="text-xs font-mono font-bold text-rose-400">
         {(myProvRecord as any).occupationStatus === 'combat' ? '交战中' : '易手'}
        </span>
       </div>
       
       <div className="relative w-full h-2.5 bg-slate-900 rounded overflow-hidden border border-slate-800">
        <div
         className="absolute left-0 top-0 bottom-0 bg-rose-600 transition-all duration-1000"
         style={{ width: `${(myProvRecord as any).occupationValue}%` }}
        />
        <div className="absolute inset-0 flex items-center justify-center text-[8px] font-mono font-bold text-white mix-blend-difference">
         {Math.round((myProvRecord as any).occupationValue)}%
        </div>
       </div>

       <div className="flex justify-between items-center text-[11px] font-mono mt-1">
        <div className="flex flex-col text-amber-400">
         <span className="text-slate-500 text-[9px]">进攻方兵力</span>
         <span className="font-bold">{(myProvRecord as any).attackerStrength?.toLocaleString()}</span>
        </div>
        <div className="flex flex-col items-end text-emerald-400">
         <span className="text-slate-500 text-[9px]">防守方兵力</span>
         <span className="font-bold">{(myProvRecord as any).defenderStrength?.toLocaleString()}</span>
        </div>
       </div>
       {((myProvRecord as any).attackerStrength || 0) > ((myProvRecord as any).defenderStrength || 0) ? (
        <div className="text-[10px] text-rose-400 text-center mt-1">进攻方优势，占领值上升</div>
       ) : (
        <div className="text-[10px] text-emerald-400 text-center mt-1">防守方优势，夺回控制权</div>
       )}
      </div>
     ) : null}

     {/* 4. Scrollable Content Body */}
     <div
      className={`p-4 overflow-y-auto flex-1 space-y-4 custom-scrollbar text-xs ${
       isOccupiedTerritory ? 'bg-[#13080e]' : 'bg-[#0c121e]'
      }`}
      style={{
       touchAction: 'pan-y',
       overscrollBehavior: 'contain',
      }}
      onWheel={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onMouseMove={(e) => e.stopPropagation()}
      onMouseUp={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
     >
      {/* TAB 1: BUILDINGS & INDUSTRY */}
      {activeTab === 'buildings' && (
       <div className="space-y-4">
        {/* Construction Slots Gauge */}
        <div
         className={`space-y-1.5 pb-2 border-b ${
          isOccupiedTerritory ? 'border-rose-900/40' : 'border-slate-800'
         }`}
        >
         <div className="flex items-center justify-between text-xs">
          <span className="text-slate-300 font-medium">建设槽位</span>
          <span className="font-mono font-bold text-slate-100">
           {totalBuildings} <span className="text-slate-500 font-normal">/</span> {maxSlots}
          </span>
         </div>
         <div
          className={`w-full h-1.5 rounded-none overflow-hidden border ${
           isOccupiedTerritory
            ? 'bg-slate-950 border-rose-900/60'
            : 'bg-slate-900 border-slate-800'
          }`}
         >
          <div
           className={`h-full transition-all duration-300 ${
            isOccupiedTerritory ? 'bg-rose-500' : 'bg-amber-500'
           }`}
           style={{ width: `${Math.min(100, (totalBuildings / maxSlots) * 100)}%` }}
          />
         </div>
        </div>

        {/* Primary Strategic Infrastructure & Facilities List */}
        <div
         className={`divide-y border-y ${
          isOccupiedTerritory
           ? 'divide-rose-900/40 border-rose-900/40'
           : 'divide-slate-800/90 border-slate-800/90'
         }`}
        >
         {/* 1. Infrastructure */}
         <div className="py-2.5">
          <div
           onClick={() => toggleBuildingExpand('infrastructure')}
           className="flex items-center justify-between cursor-pointer group"
          >
           <div>
            <div
             className={`text-xs font-bold transition-colors ${
              isOccupiedTerritory
               ? 'text-slate-100 group-hover:text-rose-300'
               : 'text-slate-100 group-hover:text-amber-300'
             }`}
            >
             基础设施
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
             建设速度 +{infraBonus}% · 战区补给与调动通量
            </div>
           </div>
           <div className="flex items-center gap-3">
            <span className="font-mono font-bold text-slate-100 text-xs">
             Lv.{detailed.infrastructure} <span className="text-slate-500 text-[10px]">/ 5</span>
            </span>
            {expandedBuilding === 'infrastructure' ? (
             <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
            ) : (
             <ChevronDown className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300" />
            )}
           </div>
          </div>

          {expandedBuilding === 'infrastructure' && (
           <div
            className={`mt-2 pt-2 border-t text-[11px] text-slate-300 space-y-2 p-2.5 rounded-[2px] ${
             isOccupiedTerritory
              ? 'border-rose-900/50 bg-[#1c0d16]'
              : 'border-slate-800 bg-[#0e1626]'
            }`}
            onClick={(e) => e.stopPropagation()}
           >
            <p className="text-slate-400 leading-relaxed">
             基础设施等级决定该省份所有建筑的施工周期以及军队过境补给效率。最高可升至 Lv.5。
            </p>
            {isMyProvince && (
             <div className="flex justify-end">
              <button
               type="button"
               onClick={(e) => handleQuickBuild(e, 'infrastructure')}
               className={`px-2.5 py-1 text-xs font-medium rounded-[2px] transition cursor-pointer border ${
                isOccupiedTerritory
                 ? 'bg-rose-900 hover:bg-rose-800 text-rose-100 border-rose-700'
                 : 'bg-slate-800 hover:bg-slate-700 text-slate-100 border-slate-600'
               }`}
              >
               + 扩建基础设施
              </button>
             </div>
            )}
           </div>
          )}
         </div>

         {/* 2. Civilian Factory */}
         <div className="py-2.5">
          <div
           onClick={() => toggleBuildingExpand('civilian_factory')}
           className="flex items-center justify-between cursor-pointer group"
          >
           <div>
            <div
             className={`text-xs font-bold transition-colors ${
              isOccupiedTerritory
               ? 'text-slate-100 group-hover:text-rose-300'
               : 'text-slate-100 group-hover:text-amber-300'
             }`}
            >
             民用工厂
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
             每日产出 {(detailed.civilian_factory * 2000).toLocaleString()} 工业产能 · 支持工程与贸易
            </div>
           </div>
           <div className="flex items-center gap-3">
            <span className="font-mono font-bold text-slate-100 text-xs">
             {detailed.civilian_factory} <span className="text-slate-400 text-[10px]">座</span>
            </span>
            {expandedBuilding === 'civilian_factory' ? (
             <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
            ) : (
             <ChevronDown className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300" />
            )}
           </div>
          </div>

          {expandedBuilding === 'civilian_factory' && (
           <div
            className={`mt-2 pt-2 border-t text-[11px] text-slate-300 space-y-2 p-2.5 rounded-[2px] ${
             isOccupiedTerritory
              ? 'border-rose-900/50 bg-[#1c0d16]'
              : 'border-slate-800 bg-[#0e1626]'
            }`}
            onClick={(e) => e.stopPropagation()}
           >
            <p className="text-slate-400 leading-relaxed">
             民用工厂是国家经济的基础，支持新建筑施工、贸易购买与物资储备。
            </p>
            {isMyProvince && (
             <div className="flex justify-end">
              <button
               type="button"
               onClick={(e) => handleQuickBuild(e, 'civilian_factory')}
               className={`px-2.5 py-1 text-xs font-medium rounded-[2px] transition cursor-pointer border ${
                isOccupiedTerritory
                 ? 'bg-rose-900 hover:bg-rose-800 text-rose-100 border-rose-700'
                 : 'bg-slate-800 hover:bg-slate-700 text-slate-100 border-slate-600'
               }`}
              >
               + 增建民用工厂
              </button>
             </div>
            )}
           </div>
          )}
         </div>

         {/* 3. Military Factory */}
         <div className="py-2.5">
          <div
           onClick={() => toggleBuildingExpand('military_factory')}
           className="flex items-center justify-between cursor-pointer group"
          >
           <div>
            <div
             className={`text-xs font-bold transition-colors ${
              isOccupiedTerritory
               ? 'text-slate-100 group-hover:text-rose-300'
               : 'text-slate-100 group-hover:text-amber-300'
             }`}
            >
             军用工厂
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
             每日产出 {(detailed.military_factory * 500).toLocaleString()} 军工产能 · 供应武器与军备制造
            </div>
           </div>
           <div className="flex items-center gap-3">
            <span className="font-mono font-bold text-slate-100 text-xs">
             {detailed.military_factory} <span className="text-slate-400 text-[10px]">座</span>
            </span>
            {expandedBuilding === 'military_factory' ? (
             <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
            ) : (
             <ChevronDown className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300" />
            )}
           </div>
          </div>

          {expandedBuilding === 'military_factory' && (
           <div
            className={`mt-2 pt-2 border-t text-[11px] text-slate-300 space-y-2 p-2.5 rounded-[2px] ${
             isOccupiedTerritory
              ? 'border-rose-900/50 bg-[#1c0d16]'
              : 'border-slate-800 bg-[#0e1626]'
            }`}
            onClick={(e) => e.stopPropagation()}
           >
            <p className="text-slate-400 leading-relaxed">
             用于制造武器、步枪、坦克、火炮与飞机，直接供给前线与军备库存。
            </p>
            {isMyProvince && (
             <div className="flex justify-end">
              <button
               type="button"
               onClick={(e) => handleQuickBuild(e, 'military_factory')}
               className={`px-2.5 py-1 text-xs font-medium rounded-[2px] transition cursor-pointer border ${
                isOccupiedTerritory
                 ? 'bg-rose-900 hover:bg-rose-800 text-rose-100 border-rose-700'
                 : 'bg-slate-800 hover:bg-slate-700 text-slate-100 border-slate-600'
               }`}
              >
               + 增建军用工厂
              </button>
             </div>
            )}
           </div>
          )}
         </div>

         {/* 4. Fortress */}
         <div className="py-2.5">
          <div
           onClick={() => toggleBuildingExpand('fortress')}
           className="flex items-center justify-between cursor-pointer group"
          >
           <div>
            <div
             className={`text-xs font-bold transition-colors ${
              isOccupiedTerritory
               ? 'text-slate-100 group-hover:text-rose-300'
               : 'text-slate-100 group-hover:text-amber-300'
             }`}
            >
             永备要塞
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
             陆军防守掩体伤害减免 +{detailed.fortress * 15}%
            </div>
           </div>
           <div className="flex items-center gap-3">
            <span className="font-mono font-bold text-slate-100 text-xs">
             Lv.{detailed.fortress} <span className="text-slate-500 text-[10px]">/ 10</span>
            </span>
            {expandedBuilding === 'fortress' ? (
             <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
            ) : (
             <ChevronDown className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300" />
            )}
           </div>
          </div>

          {expandedBuilding === 'fortress' && (
           <div
            className={`mt-2 pt-2 border-t text-[11px] text-slate-300 space-y-2 p-2.5 rounded-[2px] ${
             isOccupiedTerritory
              ? 'border-rose-900/50 bg-[#1c0d16]'
              : 'border-slate-800 bg-[#0e1626]'
            }`}
            onClick={(e) => e.stopPropagation()}
           >
            <p className="text-slate-400 leading-relaxed">
             在遭到敌方陆军进攻时提供高额掩体防护加成，每级提供 15% 伤害减免。
            </p>
            {isMyProvince && (
             <div className="flex justify-end">
              <button
               type="button"
               onClick={(e) => handleQuickBuild(e, 'fortress')}
               className={`px-2.5 py-1 text-xs font-medium rounded-[2px] transition cursor-pointer border ${
                isOccupiedTerritory
                 ? 'bg-rose-900 hover:bg-rose-800 text-rose-100 border-rose-700'
                 : 'bg-slate-800 hover:bg-slate-700 text-slate-100 border-slate-600'
               }`}
              >
               + 构筑要塞防线
              </button>
             </div>
            )}
           </div>
          )}
         </div>
        </div>

        {/* Secondary Strategic Installations */}
        <div>
         <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
          战区支援与特种设施
         </div>
         <div className="grid grid-cols-2 gap-2">
          {/* Anti-Air */}
          <div
           className={`p-2.5 border flex flex-col justify-between rounded-[2px] ${
            isOccupiedTerritory
             ? 'bg-[#1c0d16] border-rose-900/50'
             : 'bg-[#0e1626] border-slate-800'
           }`}
          >
           <div>
            <div className="flex items-center justify-between">
             <span className="font-bold text-slate-200 text-xs">防空高炮</span>
             <span className="font-mono font-bold text-slate-100 text-xs">Lv.{detailed.anti_air}</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
             敌军制空压制 -{detailed.anti_air * 10}%
            </div>
           </div>
           {isMyProvince && (
            <div
             className={`mt-2 pt-1.5 border-t flex justify-end ${
              isOccupiedTerritory ? 'border-rose-900/40' : 'border-slate-800/80'
             }`}
            >
             <button
              type="button"
              onClick={(e) => handleQuickBuild(e, 'anti_air')}
              className={`px-2 py-0.5 text-[10px] font-medium rounded-[2px] cursor-pointer border ${
               isOccupiedTerritory
                ? 'bg-rose-900 hover:bg-rose-800 text-rose-200 border-rose-700'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
             >
              + 增设
             </button>
            </div>
           )}
          </div>

          {/* Air Base */}
          <div
           className={`p-2.5 border flex flex-col justify-between rounded-[2px] ${
            isOccupiedTerritory
             ? 'bg-[#1c0d16] border-rose-900/50'
             : 'bg-[#0e1626] border-slate-800'
           }`}
          >
           <div>
            <div className="flex items-center justify-between">
             <span className="font-bold text-slate-200 text-xs">空军基地</span>
             <span className="font-mono font-bold text-slate-100 text-xs">Lv.{detailed.air_base}</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
             容量 {detailed.air_base * 200} 架战机
            </div>
           </div>
           {isMyProvince && (
            <div
             className={`mt-2 pt-1.5 border-t flex justify-end ${
              isOccupiedTerritory ? 'border-rose-900/40' : 'border-slate-800/80'
             }`}
            >
             <button
              type="button"
              onClick={(e) => handleQuickBuild(e, 'air_base')}
              className={`px-2 py-0.5 text-[10px] font-medium rounded-[2px] cursor-pointer border ${
               isOccupiedTerritory
                ? 'bg-rose-900 hover:bg-rose-800 text-rose-200 border-rose-700'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
             >
              + 扩建
             </button>
            </div>
           )}
          </div>

          {/* Radar Station */}
          <div
           className={`p-2.5 border flex flex-col justify-between rounded-[2px] ${
            isOccupiedTerritory
             ? 'bg-[#1c0d16] border-rose-900/50'
             : 'bg-[#0e1626] border-slate-800'
           }`}
          >
           <div>
            <div className="flex items-center justify-between">
             <span className="font-bold text-slate-200 text-xs">雷达站</span>
             <span className="font-mono font-bold text-slate-100 text-xs">Lv.{detailed.radar_station}</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
             预警半径 {detailed.radar_station > 0 ? RADAR_TECH_TIERS[radarTech].rangeKm : 0} km
            </div>
           </div>
           {isMyProvince && (
            <div
             className={`mt-2 pt-1.5 border-t flex justify-end ${
              isOccupiedTerritory ? 'border-rose-900/40' : 'border-slate-800/80'
             }`}
            >
             <button
              type="button"
              onClick={(e) => handleQuickBuild(e, 'radar_station')}
              className={`px-2 py-0.5 text-[10px] font-medium rounded-[2px] cursor-pointer border ${
               isOccupiedTerritory
                ? 'bg-rose-900 hover:bg-rose-800 text-rose-200 border-rose-700'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
             >
              + 架设
             </button>
            </div>
           )}
          </div>

          {/* Synthetic Refinery */}
          <div
           className={`p-2.5 border flex flex-col justify-between rounded-[2px] ${
            isOccupiedTerritory
             ? 'bg-[#1c0d16] border-rose-900/50'
             : 'bg-[#0e1626] border-slate-800'
           }`}
          >
           <div>
            <div className="flex items-center justify-between">
             <span className="font-bold text-slate-200 text-xs">合成炼油</span>
             <span className="font-mono font-bold text-slate-100 text-xs">Lv.{detailed.synthetic_refinery}</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
             产出合成燃油与橡胶
            </div>
           </div>
           {isMyProvince && (
            <div
             className={`mt-2 pt-1.5 border-t flex justify-end ${
              isOccupiedTerritory ? 'border-rose-900/40' : 'border-slate-800/80'
             }`}
            >
             <button
              type="button"
              onClick={(e) => handleQuickBuild(e, 'synthetic_refinery')}
              className={`px-2 py-0.5 text-[10px] font-medium rounded-[2px] cursor-pointer border ${
               isOccupiedTerritory
                ? 'bg-rose-900 hover:bg-rose-800 text-rose-200 border-rose-700'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
             >
              + 增建
             </button>
            </div>
           )}
          </div>
         </div>
        </div>

        {/* Active Construction Queue in this Province */}
        {activeQueuesInProvince.length > 0 && (
         <div
          className={`pt-2 border-t ${
           isOccupiedTerritory ? 'border-rose-900/50' : 'border-slate-800'
          }`}
         >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
           <span
            className={`font-bold ${
             isOccupiedTerritory ? 'text-rose-400' : 'text-amber-400'
            }`}
           >
            进行中的施工队列 ({activeQueuesInProvince.length})
           </span>
           <span className="text-[11px] text-slate-500 font-mono">
            基建提速 +{infraBonus}%
           </span>
          </div>

          <div className="space-y-2">
           {activeQueuesInProvince.map((item) => {
            const bConfig = STRATEGIC_BUILDINGS[item.buildingType];
            const currentProgress = item.currentProgress ?? 0;
            const totalCost = item.totalCost ?? 0;
            const pct = Math.min(100, Math.round((currentProgress / (totalCost || 1)) * 100));
            return (
             <div
              key={item.id}
              className={`p-2.5 border space-y-2 rounded-[2px] ${
               isOccupiedTerritory
                ? 'bg-[#1c0d16] border-rose-900/50'
                : 'bg-[#0e1626] border-slate-800'
              }`}
             >
              <div className="flex items-center justify-between text-xs">
               <div className="flex items-center gap-2">
                <span className="text-slate-100 font-bold">
                 {item.buildingName || bConfig?.name}
                </span>
                <span
                 className={`text-[10px] px-1 py-0.2 font-mono border ${
                  isOccupiedTerritory
                   ? 'bg-rose-950 text-rose-300 border-rose-800'
                   : 'bg-slate-800 text-slate-300 border-slate-700'
                 }`}
                >
                 目标 Lv.{item.targetLevel}
                </span>
               </div>
               <span
                className={`font-mono font-bold ${
                 isOccupiedTerritory ? 'text-rose-400' : 'text-amber-400'
                }`}
               >
                {pct}%
               </span>
              </div>

              {/* Linear sharp progress bar */}
              <div
               className={`w-full h-1.5 border overflow-hidden ${
                isOccupiedTerritory
                 ? 'bg-slate-950 border-rose-900/60'
                 : 'bg-slate-900 border-slate-800'
               }`}
              >
               <div
                className={`h-full transition-all duration-300 ${
                 isOccupiedTerritory ? 'bg-rose-500' : 'bg-amber-500'
                }`}
                style={{ width: `${pct}%` }}
               />
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
               <span>
                工程量: {currentProgress.toLocaleString()} / {totalCost.toLocaleString()} 点
               </span>
               <span>
                分配民用工厂: {item.assignedCivFactories} 厂
               </span>
              </div>
             </div>
            );
           })}
          </div>
         </div>
        )}
       </div>
      )}

      {/* TAB 2: GARRISON & DEFENSE */}
      {activeTab === 'garrison' && (
       <div className="space-y-4">
        {/* Defense Roster Table */}
        <div>
         <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
          {isOccupiedTerritory ? '军管卫戍与治安镇压指标' : '守备兵力与阵地防御指标'}
         </div>
         <div
          className={`border divide-y rounded-[2px] ${
           isOccupiedTerritory
            ? 'border-rose-900/50 divide-rose-900/40 bg-[#1c0d16]'
            : 'border-slate-800 divide-slate-800 bg-[#0e1626]'
          }`}
         >
          <div className="p-2.5 flex items-center justify-between">
           <span className="text-slate-400">
            {isOccupiedTerritory ? '占领军管驻屯军' : '行省驻守部队'}
           </span>
           <span
            className={`font-bold font-mono ${
             isOccupiedTerritory ? 'text-rose-300' : 'text-slate-100'
            }`}
           >
            {garrisonCount.toLocaleString()} 人
           </span>
          </div>
          <div className="p-2.5 flex items-center justify-between">
           <span className="text-slate-400">
            {isOccupiedTerritory ? '占领戒严治安度' : '治安与秩序'}
           </span>
           <span
            className={`font-bold font-mono ${
             isOccupiedTerritory ? 'text-amber-400' : 'text-emerald-400'
            }`}
           >
            {isOccupiedTerritory ? '92% 戒严压制中' : '100% 稳定'}
           </span>
          </div>
          <div className="p-2.5 flex items-center justify-between">
           <span className="text-slate-400">要塞掩体减伤</span>
           <span className="text-slate-100 font-bold font-mono">+{fortressBonus}%</span>
          </div>
          <div className="p-2.5 flex items-center justify-between">
           <span className="text-slate-400">战区防空制空压制</span>
           <span className="text-slate-100 font-bold font-mono">
            -{airDefenseReduction}%
           </span>
          </div>
         </div>
        </div>

        {/* Logistics & Supply Network */}
        <div>
         <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
          战区后勤与战略补给网络
         </div>
         <div
          className={`border divide-y rounded-[2px] ${
           isOccupiedTerritory
            ? 'border-rose-900/50 divide-rose-900/40 bg-[#1c0d16]'
            : 'border-slate-800 divide-slate-800 bg-[#0e1626]'
          }`}
         >
          <div className="p-2.5 flex items-center justify-between">
           <span className="text-slate-400">补给网络状态</span>
           <span className="font-bold text-xs font-mono text-emerald-400">
            {supplyThroughput >= 100 ? '补给充沛' : supplyThroughput >= 80 ? '供需吃紧' : '后勤匮乏'}
           </span>
          </div>
          <div className="p-2.5 flex items-center justify-between">
           <span className="text-slate-400">补给通量指数</span>
           <span className="font-mono font-bold text-slate-100">
            {supplyThroughput}% <span className="text-[10px] font-normal text-slate-400">(基建Lv.{detailed.infrastructure} + 枢纽{detailed.supply_hub})</span>
           </span>
          </div>
          <div className="p-2.5 flex items-center justify-between">
           <span className="text-slate-400">战略机动速度修正</span>
           <span className="font-mono font-bold text-slate-100">
            {troopSpeedModifier >= 0 ? `+${troopSpeedModifier}%` : `${troopSpeedModifier}%`}{' '}
            <span className="text-[10px] font-normal text-slate-400">(铁路Lv.{detailed.railway})</span>
           </span>
          </div>
          <div className="p-2.5 flex items-center justify-between">
           <span className="text-slate-400">路况非战斗损耗率</span>
           <span className={`font-mono font-bold ${attritionRateGrade > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {attritionRateGrade > 0 ? `+${attritionRateGrade}% / 日` : '0.0% / 日'}
           </span>
          </div>
         </div>
        </div>

        <div
         className={`p-3 border text-xs leading-relaxed rounded-[2px] ${
          isOccupiedTerritory
           ? 'bg-[#180a12] border-rose-900/50 text-rose-300/90'
           : 'bg-[#0a0f18] border-slate-800/80 text-slate-400'
         }`}
        >
         {isOccupiedTerritory
          ? '⚠️ 军事占领区提示：由于该地区处于占领管制状态，需长期维持卫戍驻军以压制当地抵抗力量。若驻军不足，可能会发生游击破坏或生产效率骤降。'
          : '驻守部队由行省人口与军工厂自动征发维持。若遇敌方进攻，守备部队将依托要塞工事、防空网及补给线进行持续协同抵抗。'}
        </div>
       </div>
      )}

      {/* TAB 3: GEO / ADMINISTRATIVE INTELLIGENCE */}
      {activeTab === 'geo' && (
       <div className="space-y-4">
        <div>
         <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
          行省法理与行政核心档案
         </div>
         <div
          className={`border divide-y rounded-[2px] ${
           isOccupiedTerritory
            ? 'border-rose-900/50 divide-rose-900/40 bg-[#1c0d16]'
            : 'border-slate-800 divide-slate-800 bg-[#0e1626]'
          }`}
         >
          <div className="p-2.5 flex items-center justify-between">
           <span className="text-slate-400">省份唯一标识 (UID)</span>
           <span
            className={`font-bold font-mono ${
             isOccupiedTerritory ? 'text-rose-400' : 'text-amber-400'
            }`}
           >
            #{stateId}
           </span>
          </div>
          <div className="p-2.5 flex items-center justify-between">
           <span className="text-slate-400">核心总人口</span>
           <span className="text-slate-100 font-bold font-mono">
            {rawManpower.toLocaleString()} 人
           </span>
          </div>
          <div className="p-2.5 flex items-center justify-between">
           <span className="text-slate-400">辖区细分地块</span>
           <span className="text-slate-100 font-bold font-mono">
            {subProvincesCount} 块
           </span>
          </div>
          <div className="p-2.5 flex items-center justify-between">
           <span className="text-slate-400">自然地形地貌</span>
           <span
            className={`px-2 py-0.5 text-xs font-bold rounded-[2px] border flex items-center gap-1 ${terrain.bgClass} ${terrain.textClass} ${terrain.borderClass}`}
           >
            <span>{terrain.tacticalIcon}</span>
            <span>{terrain.label}</span>
           </span>
          </div>
          <div className="p-2.5 flex items-center justify-between">
           <span className="text-slate-400">法理状态</span>
           <span
            className={`font-bold text-xs ${
             isOccupiedTerritory ? 'text-rose-400' : 'text-emerald-400'
            }`}
           >
            {isOccupiedTerritory ? '非核心领土 (军事占领区)' : '国家核心本土'}
           </span>
          </div>
          <div className="p-2.5 flex items-center justify-between">
           <span className="text-slate-400">历史法理归属</span>
           <span className="text-slate-200 font-bold">{originalOwner}</span>
          </div>
         </div>
        </div>

        <div
         className={`p-3 border text-xs leading-relaxed rounded-[2px] space-y-1.5 ${
          isOccupiedTerritory
           ? 'bg-[#180a12] border-rose-900/50 text-slate-300'
           : 'bg-[#0a0f18] border-slate-800/80 text-slate-400'
         }`}
        >
         <div className="text-slate-200 font-semibold flex items-center gap-1.5">
          <span>{terrain.tacticalIcon}</span>
          <span>{terrain.label}环境与战役机动评估</span>
         </div>
         <div className="text-slate-400">{terrain.description}</div>
         <div className="text-slate-500 text-[11px] pt-1 border-t border-slate-800/60 flex items-center gap-1">
          <span className="text-slate-400 font-medium">通行与后勤：</span>
          <span>{terrain.movementEffect}</span>
         </div>
        </div>
       </div>
      )}
     </div>
    </motion.div>
   </div>
  );
 };
