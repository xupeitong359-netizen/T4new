import React, { useState } from 'react';
import {
 Layers,
 TrendingUp,
 TrendingDown,
 Globe,
 Factory,
 Shield,
 Coins,
 ArrowRight,
 Sparkles,
 MapPin,
 Fuel,
 Flame,
 Hammer,
 Boxes,
 Gem,
 Disc,
} from 'lucide-react';
import { Nation } from '../types';
import {
 STRATEGIC_RESOURCES,
 calculateNationResourceOverview,
 StrategicResourceType,
 getProvinceResourceDeposits,
} from '../lib/strategicCommandEngine';

interface StrategicResourcesViewProps {
 nation: Nation | null;
 onNavigateToMap?: (provinceId?: string | number) => void;
}

export function renderResourceLucideIcon(resKey: StrategicResourceType, className = 'w-4 h-4') {
 switch (resKey) {
  case 'oil':
   return <Fuel className={className} />;
  case 'steel':
   return <Hammer className={className} />;
  case 'aluminium':
   return <Boxes className={className} />;
  case 'rubber':
   return <Disc className={className} />;
  case 'tungsten':
   return <Layers className={className} />;
  case 'chromium':
   return <Gem className={className} />;
  default:
   return <Layers className={className} />;
 }
}

export const StrategicResourcesView: React.FC<StrategicResourcesViewProps> = ({
 nation,
 onNavigateToMap,
}) => {
 const [selectedResKey, setSelectedResKey] = useState<StrategicResourceType>('oil');
 const resources = calculateNationResourceOverview(nation);
 const selectedDef = STRATEGIC_RESOURCES[selectedResKey];
 const selectedStats = resources[selectedResKey];

 // Find provinces possessing the selected resource
 const provincesWithRes = (nation?.provinces || []).filter((p) => {
  const dep = getProvinceResourceDeposits(p.id, p.name, (p as any).properties);
  return (dep[selectedResKey] || 0) > 0;
 });

 return (
  <div className="max-w-6xl mx-auto space-y-4 pb-12 animate-fadeIn select-none">
   {/* Header Bar */}
   <div className="bg-white border border-slate-200/90 rounded-[4px] p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
    <div className="flex items-center gap-3">
     <div className="w-10 h-10 rounded-[3px] bg-slate-900 text-white flex items-center justify-center">
      <Layers className="w-5 h-5" />
     </div>
     <div>
      <h1 className="text-base font-bold text-slate-900">6大战略资源全球储量与产销中枢</h1>
      <p className="text-xs text-slate-500 font-mono">
       STRATEGIC COMMODITIES & INDUSTRIAL INPUTS
      </p>
     </div>
    </div>

    <div className="flex items-center gap-2 text-xs font-mono">
     <span className="text-slate-500">资源体系：</span>
     <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-[2px] border border-emerald-200">
      石油 · 煤炭 · 铁矿 · 铝矿 · 铬 · 橡胶
     </span>
    </div>
   </div>

   {/* 6 Resources Interactive Strip */}
   <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
    {(Object.keys(STRATEGIC_RESOURCES) as StrategicResourceType[]).map((key) => {
     const def = STRATEGIC_RESOURCES[key];
     const stats = resources[key];
     const isSelected = selectedResKey === key;
     return (
      <button
       key={key}
       type="button"
       onClick={() => setSelectedResKey(key)}
       className={`p-3 rounded-[4px] border text-left transition cursor-pointer flex flex-col justify-between ${
        isSelected
         ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
         : 'bg-white hover:bg-slate-50 text-slate-900 border-slate-200'
       }`}
      >
       <div className="flex items-center justify-between">
        <div className={`p-1.5 rounded-[3px] ${isSelected ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-700'}`}>
         {renderResourceLucideIcon(key, 'w-4 h-4')}
        </div>
        <span
         className={`text-[9px] font-mono font-bold px-1 py-0.5 rounded ${
          stats.netDaily >= 0
           ? isSelected
            ? 'bg-emerald-800 text-emerald-200'
            : 'bg-emerald-50 text-emerald-700'
           : isSelected
           ? 'bg-rose-800 text-rose-200'
           : 'bg-rose-50 text-rose-700'
         }`}
        >
         {stats.netDaily >= 0 ? '+' : ''}
         {stats.netDaily}/日
        </span>
       </div>

       <div className="mt-2">
        <div className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-900'}`}>
         {def.name}
        </div>
        <div className={`text-xs font-mono font-bold ${isSelected ? 'text-slate-200' : 'text-slate-700'}`}>
         {stats.stockpile.toLocaleString()} {def.unit}
        </div>
       </div>
      </button>
     );
    })}
   </div>

   {/* Selected Resource Deep Dive Details */}
   <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
    
    {/* Left Column (5 cols): Commodity Balance Sheet */}
    <div className="lg:col-span-5 space-y-4">
     <div className="bg-white border border-slate-200/90 rounded-[4px] p-4 shadow-2xs space-y-3">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
       <div className="flex items-center gap-2">
        <div className="p-1.5 bg-slate-100 rounded-[3px] text-slate-800">
         {renderResourceLucideIcon(selectedResKey, 'w-5 h-5')}
        </div>
        <div>
         <h3 className="text-xs font-bold text-slate-900">{selectedDef.name} 全局收支平衡表</h3>
         <span className="text-[10px] text-slate-500 font-mono">DAILY CONSUMPTION & STOCKPILE</span>
        </div>
       </div>
      </div>

      <p className="text-xs text-slate-600 leading-relaxed">
       {selectedDef.description}
      </p>

      <div className="space-y-2 font-mono text-xs pt-1">
       {/* Daily Output */}
       <div className="p-2.5 bg-emerald-50/50 border border-emerald-100 rounded-[3px] flex items-center justify-between">
        <span className="text-slate-700">全国省份矿藏日产量</span>
        <span className="font-bold text-emerald-700 text-sm">
         +{selectedStats.dailyProduction} {selectedDef.unit}/日
        </span>
       </div>

       {/* Daily Consumption */}
       <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-[3px] flex items-center justify-between">
        <span className="text-slate-700">军工厂及部队每日消耗</span>
        <span className="font-bold text-rose-700 text-sm">
         -{selectedStats.dailyConsumption} {selectedDef.unit}/日
        </span>
       </div>

       {/* Net Daily Delta */}
       <div className="p-2.5 bg-slate-100/70 border border-slate-200 rounded-[3px] flex items-center justify-between">
        <span className="font-bold text-slate-900">净增长/损耗率</span>
        <span className={`font-black text-sm ${selectedStats.netDaily >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
         {selectedStats.netDaily >= 0 ? '+' : ''}{selectedStats.netDaily} {selectedDef.unit}/日
        </span>
       </div>

       {/* Current National Stockpile */}
       <div className="p-3 bg-slate-900 text-white rounded-[3px] flex items-center justify-between">
        <div>
         <div className="text-[10px] text-slate-400">国家战备安全总库存</div>
         <div className="text-base font-black font-mono">
          {selectedStats.stockpile.toLocaleString()} {selectedDef.unit}
         </div>
        </div>
        <div className="text-right text-[10px] text-slate-300">
         可支撑持续战备消耗：<br />
         <span className="font-bold text-emerald-400 font-mono text-xs">
          {Math.round(selectedStats.stockpile / (selectedStats.dailyConsumption || 1))} 天
         </span>
        </div>
       </div>
      </div>
     </div>

     {/* Strategic Usages */}
     <div className="bg-white border border-slate-200/90 rounded-[4px] p-4 shadow-2xs space-y-2 text-xs">
      <div className="font-bold text-slate-900 border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
       <Factory className="w-3.5 h-3.5 text-slate-700" />
       <span>工业与国防战术用途</span>
      </div>
      <div className="space-y-1.5 text-slate-600">
       <div>
        <span className="font-semibold text-slate-800">● 军事战备：</span>
        {selectedDef.militaryUsage}
       </div>
       <div>
        <span className="font-semibold text-slate-800">● 民用基建：</span>
        {selectedDef.civilianUsage}
       </div>
      </div>
     </div>
    </div>

    {/* Right Column (7 cols): Deposits on Map / Provinces List */}
    <div className="lg:col-span-7 space-y-4">
     <div className="bg-white border border-slate-200/90 rounded-[4px] p-4 shadow-2xs space-y-3">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
       <div>
        <h3 className="text-xs font-bold text-slate-900">产出省份分布清单 ({provincesWithRes.length} 处产地)</h3>
        <p className="text-[10px] text-slate-500 font-mono">PROVINCIAL DEPOSITS & MINING SITES</p>
       </div>

       {onNavigateToMap && (
        <button
         type="button"
         onClick={() => onNavigateToMap()}
         className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-[2px] transition flex items-center gap-1 cursor-pointer"
        >
         <Globe className="w-3.5 h-3.5" />
         <span>在大地图查看资源层</span>
        </button>
       )}
      </div>

      {provincesWithRes.length === 0 ? (
       <div className="p-8 text-center bg-slate-50 border border-slate-200/70 rounded-[3px] space-y-2">
        <div className="w-10 h-10 mx-auto bg-slate-100 rounded-full flex items-center justify-center text-slate-500">
         {renderResourceLucideIcon(selectedResKey, 'w-5 h-5')}
        </div>
        <div className="text-xs font-bold text-slate-800">本国本土暂无特大 {selectedDef.name} 矿藏</div>
        <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
         可依靠国家对外贸易进口、建立跨国条约同盟或在地缘前线中夺取产油产矿重镇。
        </p>
       </div>
      ) : (
       <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
        {provincesWithRes.map((p) => {
         const dep = getProvinceResourceDeposits(p.id, p.name, (p as any).properties);
         const amount = dep[selectedResKey] || 0;
         return (
          <div
           key={p.id}
           className="p-2.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 rounded-[3px] flex items-center justify-between transition cursor-pointer text-xs"
           onClick={() => onNavigateToMap && onNavigateToMap(p.id)}
          >
           <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
            <div>
             <span className="font-bold text-slate-900">{p.name}</span>
             <span className="text-[10px] text-slate-500 font-mono ml-2">ID: #{p.id}</span>
            </div>
           </div>

           <div className="flex items-center gap-3 font-mono">
            <span className="text-xs font-bold text-emerald-700">
             +{amount} {selectedDef.unit}/日
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
           </div>
          </div>
         );
        })}
       </div>
      )}

      <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-[3px] text-xs text-slate-600 leading-relaxed">
       <span className="font-bold text-slate-800 mr-1">地质判定机制：</span>
       全球 1048 个省份地块依据真实世界地缘矿产分布计算（如德州石油、鲁尔煤田、基律纳铁矿、土耳其与南非铬矿、马来亚橡胶等），并非每个省份均有资源，符合真实战略推演规律。
      </div>
     </div>
    </div>

   </div>
  </div>
 );
};
