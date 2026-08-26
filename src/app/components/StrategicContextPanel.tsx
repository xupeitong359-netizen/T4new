import React, { useState } from 'react';
import {
 X,
 MapPin,
 ShieldAlert,
 Flame,
 Factory,
 Swords,
 Crosshair,
 ArrowRight,
 TrendingUp,
 TrendingDown,
 Navigation,
 Compass,
 CheckCircle2,
 AlertTriangle,
 Layers,
 HeartPulse,
 UserCheck,
 Hammer,
} from 'lucide-react';
import { Nation, ProvinceData, ArmyDivision } from '../types';
import {
 getProvinceResourceDeposits,
 STRATEGIC_RESOURCES,
 StrategicResourceType,
 TacticalMovementOrder,
 TacticalFrontline,
} from '../lib/strategicCommandEngine';
import { getProvinceTerrain } from '../lib/terrainEngine';

export type ContextPanelType = 'province' | 'division' | 'frontline' | 'war' | null;

interface StrategicContextPanelProps {
 type: ContextPanelType;
 selectedProvince?: ProvinceData | null;
 selectedDivision?: ArmyDivision | null;
 selectedFrontline?: TacticalFrontline | null;
 movementOrder?: TacticalMovementOrder | null;
 myNation: Nation | null;
 onClose: () => void;
 onIssueDivisionMove?: (divisionId: string, targetProvinceId: string | number) => void;
 onSetAttackObjective?: (frontlineId: string, targetProvinceId: string | number) => void;
 onOpenConstruction?: (provinceId: string | number) => void;
 onDeployGarrison?: (provinceId: string | number) => void;
}

export const StrategicContextPanel: React.FC<StrategicContextPanelProps> = ({
 type,
 selectedProvince,
 selectedDivision,
 selectedFrontline,
 movementOrder,
 myNation,
 onClose,
 onIssueDivisionMove,
 onSetAttackObjective,
 onOpenConstruction,
 onDeployGarrison,
}) => {
 if (!type) return null;

 // Render Province Inspector
 if (type === 'province' && selectedProvince) {
  const p = selectedProvince;
  const terrain = getProvinceTerrain(p.id, p.name, p.properties);
  const deposits = getProvinceResourceDeposits(p.id, p.name);
  const hasResources = Object.keys(deposits).length > 0;

  // Tactical & Rebellion stats
  const occupation = Number(p.properties?.occupationRatio ?? 100);
  const unrest = Number(p.properties?.unrestLevel ?? (occupation < 100 ? 45 : 12));
  const devastation = Number(p.properties?.devastation ?? (occupation < 100 ? 28 : 2));
  const garrison = Number(p.properties?.garrison ?? 12000);

  const unrestTier =
   unrest >= 80 ? '全境武装起义' : unrest >= 60 ? '游击叛乱' : unrest >= 40 ? '高危预警' : unrest >= 20 ? '民心紧张' : '社会平稳';

  return (
   <div className="w-80 md:w-96 bg-white/95 backdrop-blur-md border-l border-slate-200/90 h-[calc(100vh-48px)] sticky top-12 z-30 shadow-lg flex flex-col select-none animate-slideLeft">
    {/* Header */}
    <div className="p-3.5 border-b border-slate-200/80 flex items-center justify-between">
     <div className="flex items-center gap-2">
      <MapPin className="w-4 h-4 text-indigo-600 flex-shrink-0" />
      <div>
       <h3 className="text-xs font-bold text-slate-900 leading-tight">
        {p.name}
       </h3>
       <span className="text-[10px] text-slate-500 font-mono">
        PROVINCE INSPECTOR · ID: #{p.id}
       </span>
      </div>
     </div>
     <button
      type="button"
      onClick={onClose}
      className="w-6 h-6 rounded-[2px] bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer transition text-xs font-bold"
     >
      <X className="w-3.5 h-3.5" />
     </button>
    </div>

    {/* Scrollable Body */}
    <div className="flex-1 p-3.5 space-y-3.5 overflow-y-auto text-xs">
     
     {/* Natural Terrain Strip */}
     <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-[3px] flex items-center justify-between">
      <span className="text-slate-600">自然地形地貌</span>
      <span className={`px-2 py-0.5 rounded-[2px] text-[11px] font-bold border flex items-center gap-1 ${terrain.bgClass} ${terrain.textClass} ${terrain.borderClass}`}>
       <span>{terrain.tacticalIcon}</span>
       <span>{terrain.label}</span>
      </span>
     </div>

     {/* Occupation & Control Status (0% ~ 100%) */}
     <div className="p-3 bg-white border border-slate-200 rounded-[3px] shadow-2xs space-y-2">
      <div className="flex items-center justify-between text-xs">
       <span className="font-bold text-slate-900">实际控制与占领比例</span>
       <span className={`font-mono font-bold ${occupation === 100 ? 'text-emerald-700' : occupation >= 50 ? 'text-amber-700' : 'text-rose-700'}`}>
        {occupation}% {occupation === 100 ? '(完全稳固控制)' : occupation >= 50 ? '(激烈争夺中)' : '(敌方渗透控制)'}
       </span>
      </div>
      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
       <div
        className={`h-full transition-all ${occupation === 100 ? 'bg-emerald-600' : occupation >= 50 ? 'bg-amber-500' : 'bg-rose-600'}`}
        style={{ width: `${occupation}%` }}
       />
      </div>
      <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-0.5">
       <span>所属国家：{myNation?.name || '我国'}</span>
       <span>战乱破坏度：{devastation}%</span>
      </div>
     </div>

     {/* Provincial Rebellion & Unrest Level (0% ~ 100%) */}
     <div className="p-3 bg-white border border-slate-200 rounded-[3px] shadow-2xs space-y-2">
      <div className="flex items-center justify-between">
       <span className="font-bold text-slate-900 flex items-center gap-1">
        <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
        <span>省份叛乱度与治安风险</span>
       </span>
       <span
        className={`px-1.5 py-0.2 rounded text-[10px] font-bold font-mono ${
         unrest >= 60
          ? 'bg-rose-600 text-white animate-pulse'
          : unrest >= 30
          ? 'bg-amber-100 text-amber-800'
          : 'bg-emerald-100 text-emerald-800'
        }`}
       >
        {unrestTier} ({unrest}%)
       </span>
      </div>

      <div className="p-2 bg-slate-50 border border-slate-200/80 rounded-[2px] space-y-1 font-mono text-[11px]">
       <div className="flex items-center justify-between text-slate-600">
        <span>当地驻防军团：</span>
        <span className="font-bold text-slate-900">{garrison.toLocaleString()} 兵力</span>
       </div>
       <div className="flex items-center justify-between text-slate-600">
        <span>治安压制效率：</span>
        <span className="font-bold text-emerald-700">+85% (稳控)</span>
       </div>
      </div>

      {onDeployGarrison && (
       <button
        type="button"
        onClick={() => onDeployGarrison(p.id)}
        className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-[2px] font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
       >
        <UserCheck className="w-3.5 h-3.5 text-slate-700" />
        <span>调派卫戍卫戍旅入驻镇压</span>
       </button>
      )}
     </div>

     {/* Strategic Resources Mineral Deposits */}
     <div className="p-3 bg-white border border-slate-200 rounded-[3px] shadow-2xs space-y-2">
      <div className="font-bold text-slate-900 flex items-center gap-1.5">
       <Layers className="w-3.5 h-3.5 text-indigo-600" />
       <span>地下战略矿藏与产出</span>
      </div>

      {!hasResources ? (
       <div className="p-2 bg-slate-50 border border-slate-200/70 rounded-[2px] text-slate-500 text-[11px] text-center">
        该省份地表无特大战略矿脉（常规农林自给）
       </div>
      ) : (
       <div className="space-y-1.5">
        {(Object.keys(deposits) as StrategicResourceType[]).map((resKey) => {
         const def = STRATEGIC_RESOURCES[resKey];
         const amount = deposits[resKey] || 0;
         return (
          <div
           key={resKey}
           className="p-2 bg-slate-50 border border-slate-200/80 rounded-[2px] flex items-center justify-between text-xs"
          >
           <div className="flex items-center gap-1.5">
            <span className="text-base">{def.icon}</span>
            <span className="font-bold text-slate-800">{def.name}矿床</span>
           </div>
           <span className="font-mono font-bold text-emerald-700">
            +{amount} {def.unit}/日
           </span>
          </div>
         );
        })}
       </div>
      )}
     </div>

     {/* Infrastructure & Construction */}
     {onOpenConstruction && (
      <button
       type="button"
       onClick={() => onOpenConstruction(p.id)}
       className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-[2px] font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
      >
       <Hammer className="w-3.5 h-3.5" />
       <span>扩建军工厂 / 铁路要塞基建</span>
      </button>
     )}
    </div>
   </div>
  );
 }

 // Render Army Division Inspector (with map tactical movement orders)
 if (type === 'division' && selectedDivision) {
  const div = selectedDivision;
  const isMoving = !!movementOrder;

  return (
   <div className="w-80 md:w-96 bg-white/95 backdrop-blur-md border-l border-slate-200/90 h-[calc(100vh-48px)] sticky top-12 z-30 shadow-lg flex flex-col select-none animate-slideLeft">
    {/* Header */}
    <div className="p-3.5 border-b border-slate-200/80 flex items-center justify-between">
     <div className="flex items-center gap-2">
      <div className="w-7 h-7 rounded-[2px] bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
       陆
      </div>
      <div>
       <h3 className="text-xs font-bold text-slate-900 leading-tight">{div.name}</h3>
       <span className="text-[10px] text-slate-500 font-mono">
        {div.corps} · {div.type}
       </span>
      </div>
     </div>
     <button
      type="button"
      onClick={onClose}
      className="w-6 h-6 rounded-[2px] bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer transition text-xs font-bold"
     >
      <X className="w-3.5 h-3.5" />
     </button>
    </div>

    {/* Division Stats Body */}
    <div className="flex-1 p-3.5 space-y-3.5 overflow-y-auto text-xs">
     
     {/* Tactical Status & Location */}
     <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-[3px] space-y-1.5 font-mono">
      <div className="flex items-center justify-between text-slate-600">
       <span>当前驻扎省份：</span>
       <span className="font-bold text-slate-900 flex items-center gap-1">
        <MapPin className="w-3.5 h-3.5 text-indigo-600" />
        {div.provinceName || `#${div.provinceId}`}
       </span>
      </div>
      <div className="flex items-center justify-between text-slate-600">
       <span>战备部署状态：</span>
       <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">
        {isMoving ? '战略行军调动中' : '阵地战备休整'}
       </span>
      </div>
     </div>

     {/* Movement Vector Info (If active order) */}
     {isMoving && movementOrder && (
      <div className="p-3 bg-indigo-50/50 border border-indigo-200 rounded-[3px] space-y-2 animate-fadeIn">
       <div className="flex items-center justify-between text-xs">
        <span className="font-bold text-indigo-900 flex items-center gap-1.5">
         <Navigation className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
         <span>战术行军矢量推进</span>
        </span>
        <span className="font-mono font-bold text-indigo-700 text-[10px]">
         ETA: 约 {Math.round(movementOrder.etaSeconds * (1 - movementOrder.progressRatio))} 秒
        </span>
       </div>

       <div className="flex items-center justify-between text-[11px] font-mono text-slate-700">
        <span>{movementOrder.sourceProvinceName}</span>
        <ArrowRight className="w-3.5 h-3.5 text-indigo-600" />
        <span className="font-bold text-indigo-900">{movementOrder.targetProvinceName}</span>
       </div>

       <div className="w-full bg-indigo-100 h-1.5 rounded-full overflow-hidden">
        <div
         className="bg-indigo-600 h-full transition-all duration-300"
         style={{ width: `${Math.round(movementOrder.progressRatio * 100)}%` }}
        />
       </div>
      </div>
     )}

     {/* Combat Readiness Metrics (兵力、装备率、组织度、士气) */}
     <div className="space-y-2">
      <div className="text-xs font-bold text-slate-900">战术作战效能指标</div>
      
      <div className="grid grid-cols-2 gap-2 font-mono text-xs">
       <div className="p-2.5 bg-white border border-slate-200 rounded-[2px] shadow-2xs">
        <span className="text-[10px] text-slate-500 block">建制兵员人数</span>
        <span className="font-bold text-slate-900 text-sm">
         {div.manpower?.toLocaleString()} / {div.manpowerMax?.toLocaleString()}
        </span>
       </div>

       <div className="p-2.5 bg-white border border-slate-200 rounded-[2px] shadow-2xs">
        <span className="text-[10px] text-slate-500 block">装备填配率</span>
        <span className="font-bold text-emerald-700 text-sm">
         {div.equipmentRate || 100}%
        </span>
       </div>

       <div className="p-2.5 bg-white border border-slate-200 rounded-[2px] shadow-2xs">
        <span className="text-[10px] text-slate-500 block">部队组织度</span>
        <span className="font-bold text-indigo-700 text-sm">
         {div.organization || 95}%
        </span>
       </div>

       <div className="p-2.5 bg-white border border-slate-200 rounded-[2px] shadow-2xs">
        <span className="text-[10px] text-slate-500 block">后勤补给充足率</span>
        <span className="font-bold text-slate-900 text-sm">
         {div.supply || 100}%
        </span>
       </div>
      </div>
     </div>

     {/* Map Movement Prompt */}
     <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-[3px] space-y-2">
      <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
       <Crosshair className="w-3.5 h-3.5 text-indigo-600" />
       <span>直接在战略地图下达调动指令</span>
      </div>
      <p className="text-[11px] text-slate-500 leading-relaxed">
       选择此部队后，直接在主地图上点击任意本国省份或前线敌对省份，系统将自动绘制战术行军矢量虚线并展开推进。
      </p>
     </div>

    </div>
   </div>
  );
 }

 // Render Frontline & Offensive Vector Inspector
 if (type === 'frontline' && selectedFrontline) {
  const fl = selectedFrontline;

  return (
   <div className="w-80 md:w-96 bg-white/95 backdrop-blur-md border-l border-slate-200/90 h-[calc(100vh-48px)] sticky top-12 z-30 shadow-lg flex flex-col select-none animate-slideLeft">
    {/* Header */}
    <div className="p-3.5 border-b border-slate-200/80 flex items-center justify-between">
     <div className="flex items-center gap-2">
      <Crosshair className="w-4 h-4 text-rose-600 flex-shrink-0" />
      <div>
       <h3 className="text-xs font-bold text-slate-900 leading-tight">{fl.name}</h3>
       <span className="text-[10px] text-slate-500 font-mono">
        对【{fl.warWithNationName}】对峙战线
       </span>
      </div>
     </div>
     <button
      type="button"
      onClick={onClose}
      className="w-6 h-6 rounded-[2px] bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer transition text-xs font-bold"
     >
      <X className="w-3.5 h-3.5" />
     </button>
    </div>

    {/* Frontline Stats Body */}
    <div className="flex-1 p-3.5 space-y-3.5 overflow-y-auto text-xs">
     <div className="grid grid-cols-2 gap-2 font-mono text-xs">
      <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-[2px]">
       <span className="text-[10px] text-slate-500 block">战线总长度</span>
       <span className="font-bold text-slate-900 text-sm">{fl.frontLengthKm} km</span>
      </div>
      <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-[2px]">
       <span className="text-[10px] text-slate-500 block">分配师团数量</span>
       <span className="font-bold text-slate-900 text-sm">{fl.assignedDivisionsCount} 个师</span>
      </div>
     </div>

     {/* Force Balance */}
     <div className="p-3 bg-white border border-slate-200 rounded-[3px] shadow-2xs space-y-2">
      <div className="flex items-center justify-between font-mono text-xs">
       <span className="font-bold text-slate-900">前线兵力对比</span>
       <span className="text-slate-500">
        我军 {fl.friendlyManpower.toLocaleString()} vs 敌军 {fl.enemyEstimatedManpower.toLocaleString()}
       </span>
      </div>
      <div className="w-full h-2 rounded-[2px] overflow-hidden flex border border-slate-200">
       <div
        className="bg-indigo-600 h-full"
        style={{
         width: `${(fl.friendlyManpower / (fl.friendlyManpower + fl.enemyEstimatedManpower)) * 100}%`,
        }}
       />
       <div
        className="bg-rose-600 h-full"
        style={{
         width: `${(fl.enemyEstimatedManpower / (fl.friendlyManpower + fl.enemyEstimatedManpower)) * 100}%`,
        }}
       />
      </div>
     </div>

     {/* Offensive Spearhead / 进攻线 */}
     <div className="p-3 bg-rose-50/50 border border-rose-200 rounded-[3px] space-y-2">
      <div className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
       <Swords className="w-3.5 h-3.5 text-rose-600" />
       <span>进攻线与突击矛头计划</span>
      </div>

      {fl.attackSpearhead ? (
       <div className="space-y-1.5 font-mono text-xs">
        <div className="text-slate-700">
         主攻目标省份：<span className="font-bold text-rose-900">{fl.attackSpearhead.targetProvinceName}</span>
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-500">
         <span>突击推进度：</span>
         <span className="font-bold text-rose-700">{fl.attackSpearhead.offensiveProgress}%</span>
        </div>
       </div>
      ) : (
       <p className="text-[11px] text-slate-600 leading-relaxed">
        当前前线保持防守态势。点击下方按钮后在地图上选择敌对目标省份，即可生成战略进攻矛头箭头。
       </p>
      )}
     </div>
    </div>
   </div>
  );
 }

 return null;
};
