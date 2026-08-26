import React, { useState } from 'react';
import {
 HelpCircle,
 Calculator,
 ArrowRight,
 Table as TableIcon,
 LayoutGrid,
 Zap,
 Info,
 Shield,
 Layers,
} from 'lucide-react';
import {
 CAPACITY_PER_MILITARY_FACTORY_24H,
 STANDARD_EQUIPMENT_TEMPLATES,
} from '../lib/militaryIndustry';
import {
 MilitaryFactoryPlantIcon,
 renderEquipmentTacticalIcon,
} from '../lib/icons';

export const MilitaryCostRuleTable: React.FC = () => {
 const [calcEquipment, setCalcEquipment] = useState<string>('eq_rifle');
 const [calcFactories, setCalcFactories] = useState<number>(1);
 const [viewMode, setViewMode] = useState<'matrix' | 'cards'>('matrix');

 // Find selected equipment template
 const selectedTemplate =
  STANDARD_EQUIPMENT_TEMPLATES.find((t) => t.id === calcEquipment) ||
  STANDARD_EQUIPMENT_TEMPLATES[0];

 const currentUnitCost = selectedTemplate.baseCost;
 const currentName = selectedTemplate.name;
 const currentUnit = selectedTemplate.unitName;

 const totalDailyCap = calcFactories * CAPACITY_PER_MILITARY_FACTORY_24H;
 const totalDailyOutput = Math.floor((totalDailyCap / currentUnitCost) * 100) / 100;

 return (
  <div className="space-y-4 text-slate-100 animate-fadeIn text-xs">
   {/* 1. Golden Core Rule Banner */}
   <div className="p-4 bg-slate-950/90 border border-amber-500/30 rounded-xl shadow-md">
    <div className="flex items-start gap-3.5">
     <div className="p-2.5 bg-amber-500/20 border border-amber-500/40 text-amber-400 rounded-xl shrink-0">
      <MilitaryFactoryPlantIcon size={22} />
     </div>
     <div className="space-y-1 min-w-0">
      <div className="flex items-center gap-2 flex-wrap">
       <h4 className="font-extrabold text-white text-sm">军事工业黄金基准产出法则</h4>
       <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 whitespace-nowrap">
        标准工业力常数 (IC)
       </span>
      </div>
      <p className="text-xs text-slate-300 leading-relaxed">
       单座军事工厂 <strong className="text-amber-300 font-mono font-bold">24小时 (1天) 产出军用产能 500 点 (IC)</strong>。
       全军所有步兵轻武器、压制火炮、装甲车辆、战机与后勤装备均严格以此基准公式换算产出速率与补给周期。
      </p>
     </div>
    </div>
   </div>

   {/* 2. Baseline Cost Matrix / Cards */}
   <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 shadow-sm space-y-3">
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
     <div className="flex items-center gap-2">
      <MilitaryFactoryPlantIcon size={16} className="text-amber-400" />
      <h4 className="font-bold text-white text-xs sm:text-sm">
       标准制式装备基准造价与单厂产出换算表
      </h4>
     </div>

     <div className="flex items-center gap-2">
      <span className="text-[11px] text-slate-400 font-mono hidden md:inline">
       基准: 1厂/24h = 500 IC
      </span>
      <div className="flex items-center bg-slate-900 rounded-lg p-0.5 border border-slate-800">
       <button
        type="button"
        onClick={() => setViewMode('matrix')}
        className={`px-2 py-1 rounded text-[11px] font-bold transition flex items-center gap-1 cursor-pointer ${
         viewMode === 'matrix' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
        }`}
       >
        <TableIcon className="w-3 h-3" />
        <span>表格速查</span>
       </button>
       <button
        type="button"
        onClick={() => setViewMode('cards')}
        className={`px-2 py-1 rounded text-[11px] font-bold transition flex items-center gap-1 cursor-pointer ${
         viewMode === 'cards' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
        }`}
       >
        <LayoutGrid className="w-3 h-3" />
        <span>图文卡片</span>
       </button>
      </div>
     </div>
    </div>

    {viewMode === 'matrix' ? (
     /* Table Matrix View */
     <div className="rounded-lg border border-slate-800 overflow-hidden">
      <table className="w-full text-left text-xs border-collapse">
       <thead>
        <tr className="bg-slate-900 text-slate-400 font-bold border-b border-slate-800 text-[11px]">
         <th className="py-2.5 px-3">装备名称</th>
         <th className="py-2.5 px-2 hidden sm:table-cell">兵种分类</th>
         <th className="py-2.5 px-3 text-right font-mono">单件造价</th>
         <th className="py-2.5 px-3 text-right font-mono">单厂日产 (24h)</th>
         <th className="py-2.5 px-3 hidden md:table-cell">战术说明</th>
        </tr>
       </thead>
       <tbody className="divide-y divide-slate-800/60 font-medium">
        {STANDARD_EQUIPMENT_TEMPLATES.map((tmpl) => {
         const singleOutput = Math.round((500 / tmpl.baseCost) * 10) / 10;
         return (
          <tr key={tmpl.id} className="hover:bg-slate-900/60 transition">
           <td className="py-2.5 px-3">
            <div className="flex items-center gap-2">
             <div className="p-1 bg-slate-900 rounded border border-slate-800 text-indigo-400 shrink-0">
              {renderEquipmentTacticalIcon(tmpl.category, { size: 16 })}
             </div>
             <div className="min-w-0">
              <div className="font-bold text-white whitespace-nowrap">{tmpl.name}</div>
              <div className="text-[10px] text-slate-500 sm:hidden">{tmpl.category}</div>
             </div>
            </div>
           </td>
           <td className="py-2.5 px-2 text-slate-400 whitespace-nowrap hidden sm:table-cell">{tmpl.category}</td>
           <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-300 whitespace-nowrap">
            <span className="px-2 py-0.5 bg-amber-950/40 border border-amber-800/60 rounded text-[11px]">
             {tmpl.baseCost} IC/{tmpl.unitName}
            </span>
           </td>
           <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400 whitespace-nowrap">
            +{singleOutput.toLocaleString()} {tmpl.unitName}/日
           </td>
           <td className="py-2.5 px-3 text-slate-400 text-[11px] hidden md:table-cell">{tmpl.description}</td>
          </tr>
         );
        })}
       </tbody>
      </table>
     </div>
    ) : (
     /* Card Grid View with protected wrapping */
     <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
      {STANDARD_EQUIPMENT_TEMPLATES.map((tmpl) => {
       const singleOutput = Math.round((500 / tmpl.baseCost) * 10) / 10;
       return (
        <div
         key={tmpl.id}
         className="p-3.5 bg-slate-900/80 hover:bg-slate-900 border border-slate-800 rounded-xl transition space-y-2"
        >
         <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
           <div className="p-1.5 bg-slate-950 rounded-lg border border-slate-800 text-indigo-400 shrink-0">
            {renderEquipmentTacticalIcon(tmpl.category, { size: 18 })}
           </div>
           <span className="font-bold text-white text-xs truncate">
            {tmpl.name}
           </span>
          </div>
          <span className="px-2 py-0.5 bg-indigo-950/80 border border-indigo-800 text-indigo-300 text-[11px] font-bold rounded-md font-mono whitespace-nowrap shrink-0">
           {tmpl.baseCost} 产能/{tmpl.unitName}
          </span>
         </div>

         <div className="text-[11px] text-slate-400 leading-relaxed">
          {tmpl.description}
         </div>

         <div className="pt-1.5 border-t border-slate-800 flex items-center justify-between font-mono">
          <span className="text-slate-500 text-[10px]">单厂 24h 产出</span>
          <span className="text-emerald-400 font-bold">
           +{singleOutput.toLocaleString()} {tmpl.unitName}
          </span>
         </div>
        </div>
       );
      })}
     </div>
    )}
   </div>

   {/* 3. Interactive Daily Output Calculator */}
   <div className="p-4 sm:p-5 bg-slate-950 border border-slate-800 rounded-xl shadow-md space-y-3">
    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
     <div className="flex items-center gap-2">
      <Calculator className="w-4 h-4 text-amber-400" />
      <h4 className="text-xs sm:text-sm font-bold text-white">军备排产效率与日产模拟推演计算器</h4>
     </div>
     <span className="text-[11px] text-slate-400 font-mono">500 IC / 厂 / 24h</span>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
     <div>
      <label className="block text-[11px] font-bold text-slate-400 mb-1.5">选择需推演装备</label>
      <select
       value={calcEquipment}
       onChange={(e) => setCalcEquipment(e.target.value)}
       className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-semibold text-white focus:outline-none focus:border-amber-400 cursor-pointer"
      >
       {STANDARD_EQUIPMENT_TEMPLATES.map((t) => (
        <option key={t.id} value={t.id}>
         {t.name} ({t.baseCost} 产能/{t.unitName})
        </option>
       ))}
      </select>
     </div>

     <div>
      <label className="block text-[11px] font-bold text-slate-400 mb-1.5">分配军工厂数量 (座)</label>
      <input
       type="number"
       min={1}
       max={500}
       value={calcFactories}
       onChange={(e) => setCalcFactories(Math.max(1, parseInt(e.target.value) || 1))}
       className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-bold text-white focus:outline-none focus:border-amber-400 font-mono"
      />
     </div>

     <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex flex-col justify-center">
      <span className="text-[11px] text-slate-400">24小时 (1天) 预期产出量：</span>
      <div className="text-base sm:text-lg font-black text-emerald-400 font-mono mt-0.5">
       +{totalDailyOutput.toLocaleString()} {currentUnit}
      </div>
      <span className="text-[10px] text-slate-500 mt-0.5 font-mono">
       总计消耗 {totalDailyCap.toLocaleString()} IC (每厂 500 点/24h)
      </span>
     </div>
    </div>
   </div>
  </div>
 );
};
