import React, { useState } from 'react';
import {
 Users,
 TrendingUp,
 HeartPulse,
 Skull,
 ShieldAlert,
 Footprints,
 Baby,
 ArrowUpRight,
 ArrowDownRight,
 Activity,
 Calendar,
 Sparkles,
} from 'lucide-react';
import { Nation } from '../types';
import { calculateNationDemographics } from '../lib/strategicCommandEngine';

interface DemographicsViewProps {
 nation: Nation | null;
 onNavigateTab?: (tab: string) => void;
}

export const DemographicsView: React.FC<DemographicsViewProps> = ({
 nation,
 onNavigateTab,
}) => {
 const [selectedSpan, setSelectedSpan] = useState<number>(5); // 1, 5, 10, 25, 50 years
 const demographics = calculateNationDemographics(nation);

 const formatPop = (n: number | null | undefined) => {
  const val = Number(n) || 0;
  if (val >= 100000000) return `${(val / 100000000).toFixed(2)} 亿`;
  if (val >= 10000) return `${(val / 10000).toFixed(1)} 万`;
  return val.toLocaleString();
 };

 const selectedProjection = demographics.projections.find((p) => p.years === selectedSpan) || demographics.projections[1];

 // SVG Chart Dimensions for demographic curve
 const chartWidth = 600;
 const chartHeight = 160;
 const minPop = Math.min(...demographics.historyCurve.map((d) => d.population)) * 0.98;
 const maxPop = Math.max(...demographics.historyCurve.map((d) => d.population), selectedProjection.projectedPopulation) * 1.02;

 const points = demographics.historyCurve.map((d, i) => {
  const x = 40 + (i / (demographics.historyCurve.length + 1)) * (chartWidth - 80);
  const y = chartHeight - 30 - ((d.population - minPop) / (maxPop - minPop || 1)) * (chartHeight - 60);
  return { x, y, ...d };
 });

 const projX = chartWidth - 40;
 const projY = chartHeight - 30 - ((selectedProjection.projectedPopulation - minPop) / (maxPop - minPop || 1)) * (chartHeight - 60);

 const pathD = points.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '');
 const projectedPathD = `${pathD} L ${projX} ${projY}`;

 return (
  <div className="max-w-6xl mx-auto space-y-4 pb-12 animate-fadeIn select-none">
   {/* Header Bar */}
   <div className="bg-white border border-slate-200/90 rounded-[4px] p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
    <div className="flex items-center gap-3">
     <div className="w-10 h-10 rounded-[3px] bg-slate-900 text-white flex items-center justify-center">
      <Users className="w-5 h-5" />
     </div>
     <div>
      <h1 className="text-base font-bold text-slate-900">国家人口与社会动态系统</h1>
      <p className="text-xs text-slate-500 font-mono">
       NATIONAL DEMOGRAPHIC DYNAMICS · 每年动态结算模型
      </p>
     </div>
    </div>

    <div className="flex items-center gap-2 font-mono text-xs">
     <span className="text-slate-500">总人口规模：</span>
     <span className="font-bold text-slate-900 text-sm">
      {formatPop(demographics.currentPopulation)}
     </span>
     <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded-[2px] border border-emerald-200/80 flex items-center">
      <TrendingUp className="w-3 h-3 mr-1" />
      +{demographics.annualGrowthRatePercent}%/年
     </span>
    </div>
   </div>

   {/* Main Grid */}
   <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
    
    {/* Left Column: Annual Balance Flow (出生、死亡、战争损失、移民) */}
    <div className="lg:col-span-5 space-y-4">
     <div className="bg-white border border-slate-200/90 rounded-[4px] p-4 shadow-2xs space-y-3">
      <div className="text-xs font-bold text-slate-900 flex items-center justify-between border-b border-slate-100 pb-2">
       <span>年度人口净增长收支表</span>
       <span className="text-[10px] text-slate-500 font-mono">ANNUAL POPULATION LEDGER</span>
      </div>

      <div className="space-y-2 font-mono text-xs">
       {/* 1. Births */}
       <div className="p-2.5 bg-emerald-50/50 border border-emerald-100 rounded-[3px] flex items-center justify-between">
        <div className="flex items-center gap-2">
         <Baby className="w-4 h-4 text-emerald-600" />
         <div>
          <div className="font-bold text-slate-900">新生儿出生</div>
          <div className="text-[10px] text-slate-500">生育率 24‰ · 基础医疗保障</div>
         </div>
        </div>
        <span className="font-bold text-emerald-700 text-sm">
         +{demographics.annualBirths.toLocaleString()} 人/年
        </span>
       </div>

       {/* 2. Natural Deaths */}
       <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-[3px] flex items-center justify-between">
        <div className="flex items-center gap-2">
         <Skull className="w-4 h-4 text-slate-500" />
         <div>
          <div className="font-bold text-slate-900">自然老龄病故</div>
          <div className="text-[10px] text-slate-500">死亡率 11‰ · 预期寿命基准</div>
         </div>
        </div>
        <span className="font-bold text-slate-600 text-sm">
         -{demographics.annualNaturalDeaths.toLocaleString()} 人/年
        </span>
       </div>

       {/* 3. War Casualties */}
       <div className="p-2.5 bg-rose-50/60 border border-rose-100 rounded-[3px] flex items-center justify-between">
        <div className="flex items-center gap-2">
         <ShieldAlert className="w-4 h-4 text-rose-600" />
         <div>
          <div className="font-bold text-slate-900">战事阵亡与伤残</div>
          <div className="text-[10px] text-slate-500">前线交战与战略轰炸破坏</div>
         </div>
        </div>
        <span className="font-bold text-rose-700 text-sm">
         -{demographics.annualWarCasualties.toLocaleString()} 人/年
        </span>
       </div>

       {/* 4. Refugees / Migration */}
       <div className="p-2.5 bg-sky-50/50 border border-sky-100 rounded-[3px] flex items-center justify-between">
        <div className="flex items-center gap-2">
         <Footprints className="w-4 h-4 text-sky-600" />
         <div>
          <div className="font-bold text-slate-900">移民与战争难民流动</div>
          <div className="text-[10px] text-slate-500">边境通行与地缘战火溢出</div>
         </div>
        </div>
        <span className="font-bold text-sky-700 text-sm">
         {demographics.annualRefugeesAndMigration >= 0 ? '+' : ''}
         {demographics.annualRefugeesAndMigration.toLocaleString()} 人/年
        </span>
       </div>

       {/* Net Balance Total */}
       <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-sm">
        <span className="font-bold text-slate-800">年度人口净变动：</span>
        <span className={`font-black font-mono text-base ${demographics.annualNetGrowth >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
         {demographics.annualNetGrowth >= 0 ? '+' : ''}
         {demographics.annualNetGrowth.toLocaleString()} 人
        </span>
       </div>
      </div>
     </div>

     {/* Demographic Health Index */}
     <div className="bg-white border border-slate-200/90 rounded-[4px] p-3.5 shadow-2xs space-y-2">
      <div className="flex items-center justify-between text-xs">
       <span className="font-bold text-slate-900">社会人口健康度指数</span>
       <span className="font-mono font-bold text-emerald-700">{demographics.demographicHealthIndex}/100</span>
      </div>
      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
       <div
        className="bg-emerald-600 h-full transition-all"
        style={{ width: `${demographics.demographicHealthIndex}%` }}
       />
      </div>
      <p className="text-[11px] text-slate-500 leading-relaxed">
       根据国家稳定度、战备负荷与医疗法令综合测算。人口健康度直接决定军工劳动力供给与适龄兵员动员上限。
      </p>
     </div>
    </div>

    {/* Right Column: Historical Curve & Multi-Span Projections (1Y/5Y/10Y/25Y/50Y) */}
    <div className="lg:col-span-7 space-y-4">
     <div className="bg-white border border-slate-200/90 rounded-[4px] p-4 shadow-2xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
       <div>
        <h3 className="text-xs font-bold text-slate-900">人口长期发展轨迹与前瞻推演</h3>
        <p className="text-[10px] text-slate-500 font-mono">POPULATION TRAJECTORY & PROJECTIONS</p>
       </div>

       {/* Span Selector Chips */}
       <div className="flex items-center gap-1 font-mono text-xs">
        {[
         { label: '1年', val: 1 },
         { label: '5年', val: 5 },
         { label: '10年', val: 10 },
         { label: '25年', val: 25 },
         { label: '50年', val: 50 },
        ].map((s) => (
         <button
          key={s.val}
          type="button"
          onClick={() => setSelectedSpan(s.val)}
          className={`px-2 py-1 rounded-[2px] border text-[11px] font-bold cursor-pointer transition ${
           selectedSpan === s.val
            ? 'bg-slate-900 text-white border-slate-900'
            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
          }`}
         >
          {s.label}
         </button>
        ))}
       </div>
      </div>

      {/* Projection Highlight Card */}
      <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-[3px] flex items-center justify-between">
       <div>
        <span className="text-[11px] text-slate-500 font-medium">
         推演周期：{selectedProjection.spanLabel} (至 {1936 + selectedProjection.years} 年)
        </span>
        <div className="text-base font-black text-slate-900 font-mono">
         预计人口：{formatPop(selectedProjection.projectedPopulation)}
        </div>
       </div>
       <div className="text-right font-mono">
        <span className="text-[10px] text-slate-500 block">累积净增</span>
        <span className="text-xs font-bold text-emerald-700">
         +{formatPop(selectedProjection.deltaPopulation)}
        </span>
       </div>
      </div>

      {/* SVG Trajectory Chart */}
      <div className="relative pt-2">
       <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-44 overflow-visible">
        {/* Grid lines */}
        <line x1="40" y1="30" x2={chartWidth - 40} y2="30" stroke="#f1f5f9" strokeWidth="1" />
        <line x1="40" y1="80" x2={chartWidth - 40} y2="80" stroke="#f1f5f9" strokeWidth="1" />
        <line x1="40" y1="130" x2={chartWidth - 40} y2="130" stroke="#f1f5f9" strokeWidth="1" />

        {/* Historical Area */}
        <path
         d={`${pathD} L ${points[points.length - 1].x} ${chartHeight - 20} L ${points[0].x} ${chartHeight - 20} Z`}
         fill="rgba(79, 70, 229, 0.05)"
        />

        {/* Historical Line */}
        <path d={pathD} fill="none" stroke="#4f46e5" strokeWidth="2.5" strokeLinecap="round" />

        {/* Projected Dashed Line */}
        <line
         x1={points[points.length - 1].x}
         y1={points[points.length - 1].y}
         x2={projX}
         y2={projY}
         stroke="#10b981"
         strokeWidth="2"
         strokeDasharray="4 4"
        />

        {/* Points */}
        {points.map((p, i) => (
         <g key={`pt-${i}`}>
          <circle cx={p.x} cy={p.y} r="3.5" fill="#4f46e5" stroke="#ffffff" strokeWidth="1.5" />
          <text x={p.x} y={chartHeight - 5} textAnchor="middle" fontSize="9" fill="#64748b" fontFamily="monospace">
           {p.year}
          </text>
         </g>
        ))}

        {/* Projected Target Point */}
        <circle cx={projX} cy={projY} r="4.5" fill="#10b981" stroke="#ffffff" strokeWidth="1.5" />
        <text x={projX} y={chartHeight - 5} textAnchor="middle" fontSize="9" fill="#10b981" fontWeight="bold" fontFamily="monospace">
         {1936 + selectedProjection.years}年
        </text>
       </svg>
      </div>

      {/* Strategic Notes */}
      <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-[3px] text-xs text-slate-600 leading-relaxed">
       <span className="font-bold text-slate-800 mr-1">人口战略建议：</span>
       当前人口结构处于正向扩张期。若爆发大规模战争，适龄青壮年兵源将优先动员入伍，可相应调整征兵法令与社会医疗预算以维持生产力平衡。
      </div>
     </div>
    </div>

   </div>
  </div>
 );
};
