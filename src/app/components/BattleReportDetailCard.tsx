import React from 'react';
import { BattleSimulationReport } from '../types';
import { Swords, ShieldAlert, Crosshair, MapPin, Plane, Shield, Trophy } from 'lucide-react';
import { getProvinceChineseName } from '../lib/provinceTranslations';

interface BattleReportDetailCardProps {
 report: BattleSimulationReport;
 className?: string;
}

export const BattleReportDetailCard: React.FC<BattleReportDetailCardProps> = ({
 report,
 className = '',
}) => {
 const isAttackerWin = report.winner === 'attacker';
 const isDefenderWin = report.winner === 'defender';
 const totalPower = Math.max(1, report.attackerCombatPower + report.defenderCombatPower);
 const attackerPowerPct = Math.round((report.attackerCombatPower / totalPower) * 100);
 const defenderPowerPct = 100 - attackerPowerPct;

 return (
  <div
   className={`bg-slate-900 border border-slate-700/80 rounded-2xl p-4 sm:p-5 text-slate-100 space-y-4 shadow-xl select-none ${className}`}
  >
   {/* 1. 战报顶部：战役代号、胜负公报徽章与时间戳 */}
   <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
    <div className="space-y-1">
     <div className="flex items-center gap-2">
      <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded">
       AAR 战地公报
      </span>
      <h3 className="font-bold text-sm sm:text-base text-slate-100 tracking-tight">
       {report.title}
      </h3>
     </div>
     <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
      <span className="flex items-center gap-1">
       <MapPin className="w-3 h-3 text-rose-400" />
       <span>目标省份: {getProvinceChineseName(report.provinceName) || '战区核心'}</span>
      </span>
      {report.territoryCeded && (
       <span className="text-emerald-400 font-bold bg-emerald-950/40 px-1.5 py-0.2 rounded border border-emerald-500/30">
        领土已移交占领
       </span>
      )}
     </div>
    </div>

    {/* 胜负状态徽章 */}
    <div className="flex items-center gap-2">
     {isAttackerWin ? (
      <div className="flex items-center gap-1.5 px-3 py-1 bg-rose-950/60 border border-rose-500/50 rounded-xl text-xs font-bold text-rose-300">
       <Trophy className="w-3.5 h-3.5 text-rose-400" />
       <span>进攻方【{report.attackerNationName}】大胜</span>
      </div>
     ) : isDefenderWin ? (
      <div className="flex items-center gap-1.5 px-3 py-1 bg-sky-950/60 border border-sky-500/50 rounded-xl text-xs font-bold text-sky-300">
       <Shield className="w-3.5 h-3.5 text-sky-400" />
       <span>防守方【{report.defenderNationName}】击退敌军</span>
      </div>
     ) : (
      <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-950/60 border border-amber-500/50 rounded-xl text-xs font-bold text-amber-300">
       <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
       <span>战线胶着 · 双方对峙</span>
      </div>
     )}
     <span className="text-[10px] font-mono text-slate-500 hidden sm:inline">
      {new Date(report.timestamp).toLocaleTimeString()}
     </span>
    </div>
   </div>

   {/* 2. 战力天平对比条 (Combat Power Ratio) */}
   <div className="space-y-1.5 bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
    <div className="flex items-center justify-between text-xs font-mono">
     <div className="flex items-center gap-1.5 text-rose-400 font-bold">
      <Swords className="w-3.5 h-3.5" />
      <span>【进攻方】{report.attackerNationName}</span>
      <span className="text-slate-400">({report.attackerCombatPower} 战力)</span>
     </div>
     <div className="flex items-center gap-1.5 text-sky-400 font-bold">
      <span>({report.defenderCombatPower} 战力)</span>
      <span>【防守方】{report.defenderNationName}</span>
      <Shield className="w-3.5 h-3.5" />
     </div>
    </div>

    {/* 双色对比条 */}
    <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden flex border border-slate-800">
     <div
      className="h-full bg-gradient-to-r from-rose-600 to-red-500 transition-all duration-300"
      style={{ width: `${attackerPowerPct}%` }}
      title={`进攻方战力占比 ${attackerPowerPct}%`}
     />
     <div
      className="h-full bg-gradient-to-r from-sky-500 to-blue-600 transition-all duration-300"
      style={{ width: `${defenderPowerPct}%` }}
      title={`防守方战力占比 ${defenderPowerPct}%`}
     />
    </div>
    <div className="flex justify-between text-[10px] font-mono text-slate-500">
     <span>{attackerPowerPct}% 进攻战力比</span>
     <span>{defenderPowerPct}% 防守战力比</span>
    </div>
   </div>

   {/* 3. 两军战损详细比对网格 (Casualties & Equipment Losses) */}
   <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
    {/* 进攻方战损 */}
    <div className="bg-slate-950/80 border border-rose-900/30 rounded-xl p-3 space-y-2">
     <div className="flex items-center justify-between border-b border-rose-900/20 pb-1.5">
      <span className="text-xs font-bold text-rose-400 flex items-center gap-1">
       <Swords className="w-3.5 h-3.5" />
       <span>【{report.attackerNationName}】进攻损失</span>
      </span>
      <span className="text-[10px] font-mono text-slate-400">战备消耗</span>
     </div>

     <div className="grid grid-cols-3 gap-2 text-center">
      <div className="bg-slate-900/90 rounded-lg p-2 border border-slate-800">
       <span className="text-[10px] text-slate-400 block">步兵阵亡</span>
       <span className="text-xs font-mono font-bold text-rose-300">
        {report.attackerLosses.infantry.toLocaleString()} 人
       </span>
      </div>
      <div className="bg-slate-900/90 rounded-lg p-2 border border-slate-800">
       <span className="text-[10px] text-slate-400 block">装甲损毁</span>
       <span className="text-xs font-mono font-bold text-rose-300">
        {report.attackerLosses.armor.toLocaleString()} 辆
       </span>
      </div>
      <div className="bg-slate-900/90 rounded-lg p-2 border border-slate-800">
       <span className="text-[10px] text-slate-400 block">战机坠落</span>
       <span className="text-xs font-mono font-bold text-rose-300">
        {report.attackerLosses.aircraft.toLocaleString()} 架
       </span>
      </div>
     </div>
    </div>

    {/* 防守方战损 */}
    <div className="bg-slate-950/80 border border-sky-900/30 rounded-xl p-3 space-y-2">
     <div className="flex items-center justify-between border-b border-sky-900/20 pb-1.5">
      <span className="text-xs font-bold text-sky-400 flex items-center gap-1">
       <Shield className="w-3.5 h-3.5" />
       <span>【{report.defenderNationName}】守军战损</span>
      </span>
      <span className="text-[10px] font-mono text-slate-400">防御消耗</span>
     </div>

     <div className="grid grid-cols-3 gap-2 text-center">
      <div className="bg-slate-900/90 rounded-lg p-2 border border-slate-800">
       <span className="text-[10px] text-slate-400 block">守军阵亡</span>
       <span className="text-xs font-mono font-bold text-sky-300">
        {report.defenderLosses.infantry.toLocaleString()} 人
       </span>
      </div>
      <div className="bg-slate-900/90 rounded-lg p-2 border border-slate-800">
       <span className="text-[10px] text-slate-400 block">装甲损耗</span>
       <span className="text-xs font-mono font-bold text-sky-300">
        {report.defenderLosses.armor.toLocaleString()} 辆
       </span>
      </div>
      <div className="bg-slate-900/90 rounded-lg p-2 border border-slate-800">
       <span className="text-[10px] text-slate-400 block">防空坠毁</span>
       <span className="text-xs font-mono font-bold text-sky-300">
        {report.defenderLosses.aircraft.toLocaleString()} 架
       </span>
      </div>
     </div>
    </div>
   </div>

   {/* 4. 战役推演分阶段实录日志 (Chronological War Log) */}
   <div className="space-y-2 pt-1 border-t border-slate-800">
    <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
     <span className="flex items-center gap-1 text-amber-300 font-bold">
      <Crosshair className="w-3.5 h-3.5" />
      <span>战役战术阶段推演实录</span>
     </span>
     <span>共 {report.logs.length} 阶段通报</span>
    </div>

    <div className="space-y-1.5 bg-slate-950/90 border border-slate-800/80 rounded-xl p-3 font-mono text-xs text-slate-300">
     {report.logs.map((log, index) => {
      const isPhaseHeader = log.includes('【') && log.includes('】');
      return (
       <div
        key={index}
        className={`flex items-start gap-2 leading-relaxed ${
         isPhaseHeader ? 'text-amber-300/90 font-medium pt-1 first:pt-0' : 'text-slate-300 pl-3 border-l border-slate-800'
        }`}
       >
        <span className="text-[10px] text-slate-500 font-mono select-none mt-0.5">
         {(index + 1).toString().padStart(2, '0')}
        </span>
        <span className="flex-1">{log}</span>
       </div>
      );
     })}
    </div>
   </div>
  </div>
 );
};
