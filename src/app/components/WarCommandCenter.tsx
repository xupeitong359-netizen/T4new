import React, { useState } from 'react';
import {
 Crosshair,
 Swords,
 Shield,
 Clock,
 TrendingUp,
 TrendingDown,
 Skull,
 Award,
 AlertTriangle,
 Flag,
 Target,
 ArrowRight,
 Sparkles,
 MapPin,
 Calendar,
 Activity,
 Layers,
} from 'lucide-react';
import { Nation } from '../types';
import { generateWarTheaters, WarTheaterSummary } from '../lib/strategicCommandEngine';

interface WarCommandCenterProps {
 nation: Nation | null;
 allNations: Nation[];
 onOpenDisputeModal?: (target?: Nation, provinceName?: string) => void;
 onNavigateToMap?: () => void;
 onOpenDiplomacy?: (target: Nation, mode?: string) => void;
}

export const WarCommandCenter: React.FC<WarCommandCenterProps> = ({
 nation,
 allNations,
 onOpenDisputeModal,
 onNavigateToMap,
 onOpenDiplomacy,
}) => {
 const theaters = generateWarTheaters(nation);
 const [selectedTheaterIdx, setSelectedTheaterIdx] = useState(0);
 const [timelineFilter, setTimelineFilter] = useState<'24h' | '7d' | '30d' | 'all'>('7d');

 const selectedTheater: WarTheaterSummary | undefined = theaters[selectedTheaterIdx] || theaters[0];

 const adversaryNation = selectedTheater
  ? allNations.find((n) => n.id === selectedTheater.adversaryNationId)
  : null;

 return (
  <div className="max-w-7xl mx-auto space-y-4 pb-12 animate-fadeIn select-none">
   {/* Top War Ops Banner */}
   <div className="bg-white border border-slate-200/90 rounded-[4px] p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
    <div className="flex items-center gap-3">
     <div className="w-10 h-10 rounded-[3px] bg-rose-700 text-white flex items-center justify-center shadow-xs">
      <Crosshair className="w-5 h-5" />
     </div>
     <div>
      <h1 className="text-base font-bold text-slate-900 flex items-center gap-2">
       <span>国家统帅部 · 战争指挥作战厅</span>
       {theaters.length > 0 && (
        <span className="px-2 py-0.5 bg-rose-50 text-rose-700 font-mono text-[10px] font-bold rounded-[2px] border border-rose-200 animate-pulse">
         战时戒严状态 (DEFCON 1)
        </span>
       )}
      </h1>
      <p className="text-xs text-slate-500 font-mono">
       JOINT MILITARY COMMAND & STRATEGIC THEATER OPERATIONS
      </p>
     </div>
    </div>

    <div className="flex items-center gap-2">
     {onOpenDisputeModal && (
      <button
       type="button"
       onClick={() => onOpenDisputeModal()}
       className="px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-[3px] text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
      >
       <Swords className="w-3.5 h-3.5" />
       <span>沙盘推演与宣战通牒</span>
      </button>
     )}

     {onNavigateToMap && (
      <button
       type="button"
       onClick={onNavigateToMap}
       className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-[3px] text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
      >
       <Target className="w-3.5 h-3.5" />
       <span>大地图前线战线操作</span>
      </button>
     )}
    </div>
   </div>

   {theaters.length === 0 ? (
    /* Peace State View */
    <div className="p-16 text-center bg-white border border-slate-200/90 rounded-[4px] space-y-4 shadow-2xs">
     <div className="w-16 h-16 rounded-[4px] bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto text-slate-400">
      <Shield className="w-8 h-8 text-emerald-600" />
     </div>
     <div className="space-y-1">
      <h3 className="text-base font-bold text-slate-900">当前处于和平戒备状态</h3>
      <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
       我国目前未卷入任何公开主权冲突或边界交火。常备陆军师团处于基地休整与要塞驻防状态。
      </p>
     </div>
     {onOpenDisputeModal && (
      <div className="pt-2">
       <button
        type="button"
        onClick={() => onOpenDisputeModal()}
        className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-[3px] transition cursor-pointer inline-flex items-center gap-1.5"
       >
        <Swords className="w-3.5 h-3.5" />
        <span>发起沙盘模拟推演 / 制造法理争端</span>
       </button>
      </div>
     )}
    </div>
   ) : (
    /* Active War Operations Dashboard */
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
     
     {/* Left Column (4 cols): Active Wars & Theaters List */}
     <div className="lg:col-span-4 space-y-4">
      <div className="bg-white border border-slate-200/90 rounded-[4px] p-4 shadow-2xs space-y-3">
       <div className="text-xs font-bold text-slate-900 flex items-center justify-between border-b border-slate-100 pb-2">
        <span>战役与交战前线列表 ({theaters.length})</span>
        <span className="text-[10px] text-slate-500 font-mono">ACTIVE THEATERS</span>
       </div>

       <div className="space-y-2">
        {theaters.map((t, idx) => (
         <div
          key={t.warId}
          onClick={() => setSelectedTheaterIdx(idx)}
          className={`p-3 rounded-[3px] border transition cursor-pointer text-xs space-y-1.5 ${
           selectedTheaterIdx === idx
            ? 'bg-rose-50/60 border-rose-300 shadow-2xs'
            : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200'
          }`}
         >
          <div className="flex items-center justify-between">
           <span className="font-bold text-slate-900">{t.warName}</span>
           <span className="px-1.5 py-0.2 bg-rose-600 text-white font-mono text-[9px] font-bold rounded">
            第 {t.elapsedDays} 天
           </span>
          </div>

          <div className="flex items-center justify-between text-slate-600 font-mono text-[11px]">
           <span>敌对国：【{t.adversaryNationName}】</span>
           <span className="font-bold text-rose-700">前线 2 条</span>
          </div>
         </div>
        ))}
       </div>
      </div>

      {/* Quick Actions Card */}
      {selectedTheater && adversaryNation && onOpenDiplomacy && (
       <div className="bg-white border border-slate-200/90 rounded-[4px] p-3.5 shadow-2xs space-y-2">
        <div className="text-xs font-bold text-slate-900">外交和谈通牒</div>
        <p className="text-[11px] text-slate-500">
         如战争已达到预期战略目的或损失过重，可通过战地使节向敌国递交停战协议。
        </p>
        <button
         type="button"
         onClick={() => onOpenDiplomacy(adversaryNation, 'armistice')}
         className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-[2px] transition cursor-pointer"
        >
         签署停战协议提议
        </button>
       </div>
      )}
     </div>

     {/* Right Column (8 cols): Theater Operational Intel & Timeline Visuals */}
     {selectedTheater && (
      <div className="lg:col-span-8 space-y-4">
       
       {/* Theater Overview Stats Ribbon */}
       <div className="bg-white border border-slate-200/90 rounded-[4px] p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
         <div>
          <h3 className="text-xs font-bold text-slate-900">{selectedTheater.warName}</h3>
          <p className="text-[10px] text-slate-500 font-mono">OPERATIONAL CASUALTIES & COMBAT FORCE RATIO</p>
         </div>
         <div className="flex items-center gap-1 font-mono text-xs">
          <span className="text-slate-500">前线胜率：</span>
          <span className="font-bold text-emerald-700">{selectedTheater.friendlyWinRate}%</span>
         </div>
        </div>

        {/* 4 Core Battlefield Metric Blocks */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs">
         {/* 1. Forces deployed */}
         <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-[3px]">
          <span className="text-[10px] text-slate-500 block">我方前线兵力</span>
          <span className="text-sm font-bold text-slate-900">
           {selectedTheater.friendlyTroopsDeployed.toLocaleString()}
          </span>
         </div>

         {/* 2. Enemy forces estimated */}
         <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-[3px]">
          <span className="text-[10px] text-slate-500 block">敌方预估兵力</span>
          <span className="text-sm font-bold text-slate-900">
           {selectedTheater.hostileTroopsEstimated.toLocaleString()}
          </span>
         </div>

         {/* 3. Friendly casualties */}
         <div className="p-2.5 bg-rose-50/60 border border-rose-100 rounded-[3px]">
          <span className="text-[10px] text-slate-500 block">我方累计战损</span>
          <span className="text-sm font-bold text-rose-700">
           {selectedTheater.friendlyCasualtiesTotal.toLocaleString()}
          </span>
         </div>

         {/* 4. Enemy casualties inflicted */}
         <div className="p-2.5 bg-emerald-50/60 border border-emerald-100 rounded-[3px]">
          <span className="text-[10px] text-slate-500 block">消灭敌军有生力量</span>
          <span className="text-sm font-bold text-emerald-700">
           {selectedTheater.enemyCasualtiesInflicted.toLocaleString()}
          </span>
         </div>
        </div>

        {/* Force Ratio Bar */}
        <div className="space-y-1 pt-1">
         <div className="flex items-center justify-between text-[11px] font-mono text-slate-600">
          <span>战场兵力对比：我军 {Math.round((selectedTheater.friendlyTroopsDeployed / (selectedTheater.friendlyTroopsDeployed + selectedTheater.hostileTroopsEstimated)) * 100)}%</span>
          <span>敌军 {Math.round((selectedTheater.hostileTroopsEstimated / (selectedTheater.friendlyTroopsDeployed + selectedTheater.hostileTroopsEstimated)) * 100)}%</span>
         </div>
         <div className="w-full h-2.5 rounded-[2px] overflow-hidden flex border border-slate-200 shadow-inner">
          <div
           className="bg-indigo-600 h-full"
           style={{
            width: `${(selectedTheater.friendlyTroopsDeployed / (selectedTheater.friendlyTroopsDeployed + selectedTheater.hostileTroopsEstimated)) * 100}%`,
           }}
          />
          <div
           className="bg-rose-600 h-full"
           style={{
            width: `${(selectedTheater.hostileTroopsEstimated / (selectedTheater.friendlyTroopsDeployed + selectedTheater.hostileTroopsEstimated)) * 100}%`,
           }}
          />
         </div>
        </div>
       </div>

       {/* Theater Casualties & Territorial Advance Trend Charts */}
       <div className="bg-white border border-slate-200/90 rounded-[4px] p-4 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
         <div>
          <h3 className="text-xs font-bold text-slate-900">战役进程时间轴与态势曲线</h3>
          <p className="text-[10px] text-slate-500 font-mono">TIMELINE CASUALTY & TERRITORY ADVANCE TRAJECTORY</p>
         </div>

         {/* Timeline Filter */}
         <div className="flex items-center gap-1 font-mono text-xs">
          {(['24h', '7d', '30d', 'all'] as const).map((t) => (
           <button
            key={t}
            type="button"
            onClick={() => setTimelineFilter(t)}
            className={`px-2 py-0.5 rounded-[2px] border text-[10px] font-bold cursor-pointer transition ${
             timelineFilter === t
              ? 'bg-slate-900 text-white border-slate-900'
              : 'bg-slate-50 text-slate-600 border-slate-200'
            }`}
           >
            {t === '24h' ? '24小时' : t === '7d' ? '7天' : t === '30d' ? '30天' : '开战以来'}
           </button>
          ))}
         </div>
        </div>

        {/* SVG Battle Chart */}
        <div className="relative pt-1">
         <svg viewBox="0 0 600 130" className="w-full h-36 overflow-visible">
          <line x1="30" y1="20" x2="570" y2="20" stroke="#f1f5f9" strokeWidth="1" />
          <line x1="30" y1="65" x2="570" y2="65" stroke="#f1f5f9" strokeWidth="1" />
          <line x1="30" y1="110" x2="570" y2="110" stroke="#f1f5f9" strokeWidth="1" />

          {/* Bars / Points for daily engagements */}
          {selectedTheater.historyTimeline.map((h, i) => {
           const x = 50 + i * 80;
           return (
            <g key={`tl-${i}`}>
             {/* Friendly casualty bar */}
             <rect x={x - 12} y={110 - h.friendlyCasualties / 70} width="10" height={h.friendlyCasualties / 70} fill="#f43f5e" rx="1" opacity="0.85" />
             {/* Enemy casualty bar */}
             <rect x={x} y={110 - h.enemyCasualties / 70} width="10" height={h.enemyCasualties / 70} fill="#10b981" rx="1" opacity="0.85" />
             <text x={x - 2} y="125" textAnchor="middle" fontSize="9" fill="#64748b" fontFamily="monospace">
              {h.date}
             </text>
            </g>
           );
          })}
         </svg>

         <div className="flex items-center justify-center gap-4 text-[10px] font-mono text-slate-600 pt-1">
          <span className="flex items-center gap-1">
           <span className="w-2.5 h-2.5 bg-rose-500 rounded-[1px]" /> 我军单日战损
          </span>
          <span className="flex items-center gap-1">
           <span className="w-2.5 h-2.5 bg-emerald-500 rounded-[1px]" /> 歼灭敌军人数
          </span>
         </div>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-[3px] text-xs text-slate-600 leading-relaxed">
         <span className="font-bold text-slate-800 mr-1">前线战役态势评估：</span>
         我方装甲突击集团在正面防线推进约 <span className="font-bold text-slate-900 font-mono">+{selectedTheater.frontlineAdvanceKm} km</span>。组织度与弹药补给充足，敌军侧翼出现动摇迹象。建议在大地图上维持进攻箭头并增派摩托化部队扩大战果。
        </div>
       </div>

      </div>
     )}
    </div>
   )}
  </div>
 );
};
