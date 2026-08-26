import React, { useState } from 'react';
import {
 X,
 Swords,
 Shield,
 AlertTriangle,
 Flame,
 FileText,
 Send,
 Flag,
 Handshake,
 CheckCircle2,
 Skull,
 TrendingUp,
 ShieldAlert,
} from 'lucide-react';
import { Nation, BattleSimulationReport, ProvinceDispute, ArmisticeProposal, CapitulationResolution } from '../types';
import { simulateBattle, strategicStorage } from '../services/strategicGameplayService';
import {
 calculateSurrenderProgress,
 handleCapitulation,
} from '../lib/surrenderEngine';
import { SurrenderStatusCard } from './SurrenderStatusCard';
import { CapitulationModal } from './CapitulationModal';
import { BattleReportDetailCard } from './BattleReportDetailCard';
import { getTotalMilitaryFactories } from '../lib/militaryIndustry';

interface DisputeAndWarModalProps {
 isOpen: boolean;
 onClose: () => void;
 myNation: Nation | null;
 targetNation?: Nation | null;
 allNations: Nation[];
 onUpdateNation: (updated: Nation) => void;
 onShowToast: (msg: string) => void;
}

export const DisputeAndWarModal: React.FC<DisputeAndWarModalProps> = ({
 isOpen,
 onClose,
 myNation,
 targetNation,
 allNations,
 onUpdateNation,
 onShowToast,
}) => {
 const [activeSubTab, setActiveSubTab] = useState<'simulator' | 'surrender' | 'dispute' | 'armistice' | 'reports'>('simulator');
 const [selectedTargetNationId, setSelectedTargetNationId] = useState<string>(
  targetNation?.id || allNations.find((n) => n.id !== myNation?.id)?.id || ''
 );
 const [targetProvinceName, setTargetProvinceName] = useState<string>('边境要塞省');
 const [disputeReason, setDisputeReason] = useState<string>('历史归属争议与边境防空挑衅');
 const [currentReport, setCurrentReport] = useState<BattleSimulationReport | null>(null);
 const [isSimulating, setIsSimulating] = useState(false);
 const [capitulationResolution, setCapitulationResolution] = useState<CapitulationResolution | null>(null);
 const [isCapitulationModalOpen, setIsCapitulationModalOpen] = useState(false);

 // Armistice Form
 const [cededProvince, setCededProvince] = useState('');
 const [reparationsAmount, setReparationsAmount] = useState<number>(3000);
 const [createDMZ, setCreateDMZ] = useState(true);

 if (!isOpen || !myNation) return null;

 const currentOpponent = allNations.find((n) => n.id === selectedTargetNationId) || targetNation || allNations[0];
 const reports = strategicStorage.getBattleReports();
 const disputes = strategicStorage.getDisputes();

 // Surrender calculations
 const mySurrender = calculateSurrenderProgress(myNation, { allNations, battleReports: reports });
 const oppSurrender = currentOpponent
  ? calculateSurrenderProgress(currentOpponent, { allNations, battleReports: reports })
  : null;

 // Handler: Initiate Province Dispute Claim
 const handleInitiateDispute = () => {
  if (!currentOpponent) return;

  const newDispute: ProvinceDispute = {
   id: 'disp_' + Date.now(),
   provinceId: 'prov_' + Date.now(),
   provinceName: targetProvinceName,
   claimantNationId: myNation.id,
   claimantNationName: myNation.name,
   targetNationId: currentOpponent.id,
   targetNationName: currentOpponent.name,
   reason: disputeReason,
   createdAt: new Date().toISOString(),
   status: 'ultimatum',
   deadline: new Date(Date.now() + 86400000 * 2).toLocaleDateString(),
  };

  const updated = [newDispute, ...disputes];
  strategicStorage.saveDisputes(updated);
  onShowToast(` 已向【${currentOpponent.name}】就省份【${targetProvinceName}】正式递交主权争端通牒！`);
  setActiveSubTab('dispute');
 };

 // Handler: Run Battle Simulator
 const handleRunBattleSimulation = () => {
  if (!currentOpponent) return;
  setIsSimulating(true);

  setTimeout(() => {
   const report = simulateBattle(myNation, currentOpponent, targetProvinceName);
   setCurrentReport(report);
   const updatedReports = [report, ...reports];
   strategicStorage.saveBattleReports(updatedReports);
   setIsSimulating(false);
   onShowToast(` 【${targetProvinceName} 战役】沙盘兵力推演完成！`);

   // 动态根据战果施加投降压力与领土占领
   if (report.winner === 'attacker' && report.territoryCeded) {
    // 我方胜利，敌方领土沦陷加剧
    const defOccupied = [...(currentOpponent.occupiedProvinces || [])];
    if (!defOccupied.includes(targetProvinceName)) {
     defOccupied.push(targetProvinceName);
    }
    const updatedOpponent: Nation = {
     ...currentOpponent,
     occupiedProvinces: defOccupied,
     recentDefeats: Math.min(30, (currentOpponent.recentDefeats || 0) + 8),
    };
    const oppCalc = calculateSurrenderProgress(updatedOpponent, { allNations, battleReports: updatedReports });

    if (oppCalc.isCapitulated && !currentOpponent.isCapitulated) {
     // 敌方达到投降阈值！自动触发投降结算公报！
     const result = handleCapitulation(updatedOpponent, myNation, allNations);
     onUpdateNation(result.updatedVictorNation);
     setCapitulationResolution(result.resolution);
     setIsCapitulationModalOpen(true);
     onShowToast(` 战果大捷！【${currentOpponent.name}】投降倾向达到 100 阈值宣告正式投降！`);
    }
   } else if (report.winner === 'defender') {
    // 防守方胜利，我方受挫
    const myDefeats = Math.min(30, (myNation.recentDefeats || 0) + 5);
    const updatedMy: Nation = {
     ...myNation,
     recentDefeats: myDefeats,
    };
    onUpdateNation(updatedMy);
   }
  }, 900);
 };

 // Handler: Propose Armistice
 const handleProposeArmistice = () => {
  if (!currentOpponent) return;

  // Remove active war if any
  const updatedWars = (myNation.activeWars || []).filter((w) => w.withNationId !== currentOpponent.id);
  const updatedNation: Nation = {
   ...myNation,
   activeWars: updatedWars,
  };

  onUpdateNation(updatedNation);
  onShowToast(` 已向【${currentOpponent.name}】签署并递交停战协议（赔款 ${reparationsAmount} 产能，设立非军事区）！`);
  onClose();
 };

 if (!myNation) return null;

 return (
  <>
   <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
    <div className="w-full max-w-3xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-slate-900">
     {/* Header */}
     <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
      <div className="flex items-center gap-3">
       <div className="w-10 h-10 rounded-xl bg-rose-600/30 border border-rose-500/40 flex items-center justify-center text-rose-400">
        <Swords className="w-5 h-5" />
       </div>
       <div>
        <h3 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
         <span>最高军事指挥所 · 战役推演与投降判定</span>
        </h3>
        <p className="text-xs text-slate-400">
         主权宣战声明、国家投降倾向（0~100）动态计算、沙盘兵力推演与停火结算
        </p>
       </div>
      </div>
      <button
       onClick={onClose}
       className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
      >
       <X className="w-5 h-5" />
      </button>
     </div>

     {/* Sub Navigation */}
     <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-2 gap-1 sm:gap-2 overflow-x-auto">
      {[
       { id: 'simulator', label: '沙盘兵力推演', icon: Flame },
       { id: 'surrender', label: '两国投降意志对比', icon: ShieldAlert },
       { id: 'dispute', label: '省份争端声明', icon: Flag },
       { id: 'armistice', label: '停火协议与割让', icon: Handshake },
       { id: 'reports', label: '战役历史通报', icon: FileText },
      ].map((tab) => {
       const Icon = tab.icon;
       const isActive = activeSubTab === tab.id;
       return (
        <button
         key={tab.id}
         type="button"
         onClick={() => setActiveSubTab(tab.id as any)}
         className={`py-2.5 px-3.5 text-xs font-bold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
          isActive
           ? 'border-rose-600 text-rose-600 bg-white rounded-t-lg'
           : 'border-transparent text-slate-500 hover:text-slate-800'
         }`}
        >
         <Icon className="w-3.5 h-3.5" />
         <span>{tab.label}</span>
        </button>
       );
      })}
     </div>

     {/* Content */}
     <div className="p-6 overflow-y-auto flex-1 space-y-5">
      {/* Target Nation Selection */}
      <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
       <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
        <Shield className="w-4 h-4 text-slate-500" />
        <span>目标交战/推演国家：</span>
       </div>
       <select
        value={selectedTargetNationId}
        onChange={(e) => setSelectedTargetNationId(e.target.value)}
        className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-rose-500"
       >
        {allNations
         .filter((n) => n.id !== myNation.id)
         .map((n) => (
          <option key={n.id} value={n.id}>
           {n.name} (领主: {n.ownerUsername}) {n.isCapitulated ? '【已投降】' : ''}
          </option>
         ))}
       </select>
      </div>

      {/* TAB 1: BATTLE SIMULATOR (沙盘推演) */}
      {activeSubTab === 'simulator' && (
       <div className="space-y-4">
        {/* Dual Mini Surrender Meters */}
        {currentOpponent && oppSurrender && (
         <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-900 text-white text-xs">
          <div className="space-y-1.5">
           <div className="flex justify-between items-center text-[11px]">
            <span className="text-slate-300 font-bold">我方投降倾向 ({myNation.name})</span>
            <span className="font-mono text-emerald-400 font-bold">{mySurrender.effectiveProgress}/100</span>
           </div>
           <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
             className={`h-full ${mySurrender.tier.progressBarColor}`}
             style={{ width: `${mySurrender.effectiveProgress}%` }}
            />
           </div>
           <span className="text-[10px] text-slate-400 block">{mySurrender.tier.label}</span>
          </div>

          <div className="space-y-1.5">
           <div className="flex justify-between items-center text-[11px]">
            <span className="text-slate-300 font-bold">敌方投降倾向 ({currentOpponent.name})</span>
            <span className="font-mono text-rose-400 font-bold">{oppSurrender.effectiveProgress}/100</span>
           </div>
           <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
             className={`h-full ${oppSurrender.tier.progressBarColor}`}
             style={{ width: `${oppSurrender.effectiveProgress}%` }}
            />
           </div>
           <span className="text-[10px] text-slate-400 block">{oppSurrender.tier.label}</span>
          </div>
         </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
         {/* Attacker Panel */}
         <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-2xl">
          <div className="text-xs font-bold text-rose-900 mb-1 flex items-center justify-between">
           <span>【进攻方】{myNation.name}</span>
           <span className="text-[10px] px-1.5 py-0.5 bg-rose-200 text-rose-800 rounded font-mono">我方统帅</span>
          </div>
          <div className="text-[11px] text-slate-600 space-y-1">
           <div>军工厂规模：{getTotalMilitaryFactories(myNation)} 座</div>
           <div>重型装备库：{Object.values(myNation.militaryIndustry?.stockpiles || {}).reduce<number>((a, b) => a + Number(b || 0), 0)} 件编制</div>
          </div>
         </div>

         {/* Defender Panel */}
         <div className="p-4 bg-slate-100 border border-slate-200 rounded-2xl">
          <div className="text-xs font-bold text-slate-900 mb-1 flex items-center justify-between">
           <span>【防守方】{currentOpponent?.name || '对阵国'}</span>
           <span className="text-[10px] px-1.5 py-0.5 bg-slate-200 text-slate-800 rounded font-mono">守备部队</span>
          </div>
          <div className="text-[11px] text-slate-600 space-y-1">
           <div>要塞驻防优势：+20% 防空要塞</div>
           <div>军工生产线：活跃运转中</div>
          </div>
         </div>
        </div>

        <div>
         <label className="block text-xs font-bold text-slate-700 mb-1">
          目标进攻省份 / 战略要冲
         </label>
         <input
          type="text"
          value={targetProvinceName}
          onChange={(e) => setTargetProvinceName(e.target.value)}
          placeholder="例如：北部工业走廊 / 边境重镇"
          className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-rose-500"
         />
        </div>

        <button
         type="button"
         onClick={handleRunBattleSimulation}
         disabled={isSimulating || currentOpponent?.isCapitulated}
         className="w-full py-3 bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-700 hover:to-red-800 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 transition"
        >
         {isSimulating ? (
          <>
           <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
           <span>沙盘兵棋推演结算中...</span>
          </>
         ) : currentOpponent?.isCapitulated ? (
          <span>【{currentOpponent.name}】已宣告投降，全线停火中</span>
         ) : (
          <>
           <Swords className="w-4 h-4" />
           <span>下达战备指令 · 启动沙盘兵力推演</span>
          </>
         )}
        </button>

        {/* Simulation Result */}
        {currentReport && (
         <div className="pt-2 animate-fadeIn">
          <BattleReportDetailCard report={currentReport} />
         </div>
        )}
       </div>
      )}

      {/* TAB 2: SURRENDER COMPARISON (两国投降意志对比) */}
      {activeSubTab === 'surrender' && currentOpponent && (
       <div className="space-y-4 animate-fadeIn">
        <div className="p-3.5 bg-rose-50/60 border border-rose-200/80 rounded-2xl text-xs text-rose-950 leading-relaxed">
         <strong>国家投降倾向机制（0～100）：</strong> 动态综合衡量战时国土控制率、法定首都安危、核心领土丢失比例、主力部队战备、民众战争支持度、战役连败挫折、财政工业崩溃以及多国联盟外援。当达到 100 阈值时自动触发无条件投降与停战割让！
        </div>

        <div className="space-y-4">
         <div className="space-y-1">
          <span className="text-xs font-bold text-slate-700">【本国】{myNation.name} 投降状态</span>
          <SurrenderStatusCard nation={myNation} allNations={allNations} battleReports={reports} />
         </div>

         <div className="space-y-1">
          <span className="text-xs font-bold text-slate-700">【对阵国】{currentOpponent.name} 投降状态</span>
          <SurrenderStatusCard nation={currentOpponent} allNations={allNations} battleReports={reports} />
         </div>
        </div>
       </div>
      )}

      {/* TAB 3: PROVINCE DISPUTE (省份争端声明) */}
      {activeSubTab === 'dispute' && (
       <div className="space-y-4">
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900">
         <strong>领土争端通牒机制：</strong> 向邻国发出主权索求声明，要求在指定期限内归还或移交争议省份。若谈判破裂，将直接触发宣战状态。
        </div>

        <div>
         <label className="block text-xs font-bold text-slate-700 mb-1">
          索求争议省份名称
         </label>
         <input
          type="text"
          value={targetProvinceName}
          onChange={(e) => setTargetProvinceName(e.target.value)}
          placeholder="例如：东部铁矿要塞 / 边境缓冲区"
          className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-amber-500"
         />
        </div>

        <div>
         <label className="block text-xs font-bold text-slate-700 mb-1">
          争端主权法理依据 / 通牒事由
         </label>
         <textarea
          value={disputeReason}
          onChange={(e) => setDisputeReason(e.target.value)}
          rows={3}
          placeholder="说明主权历史法理依据与诉求理由..."
          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-amber-500 resize-none"
         />
        </div>

        <button
         type="button"
         onClick={handleInitiateDispute}
         className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
        >
         <Flag className="w-4 h-4" />
         <span>正式签署并递交主权通牒</span>
        </button>
       </div>
      )}

      {/* TAB 4: ARMISTICE (停火与割让) */}
      {activeSubTab === 'armistice' && (
       <div className="space-y-4">
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900">
         <strong>停火公报与和谈：</strong> 签署和平条约并终止双方一切主动敌对状态。可设定割让省份、赔偿产能及建立非军事区。
        </div>

        <div>
         <label className="block text-xs font-bold text-slate-700 mb-1">
          割让省份名称 (可选)
         </label>
         <input
          type="text"
          value={cededProvince}
          onChange={(e) => setCededProvince(e.target.value)}
          placeholder="例如：边境非军事省"
          className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
         />
        </div>

        <div>
         <label className="block text-xs font-bold text-slate-700 mb-1">
          战后赔偿产能点数：{reparationsAmount.toLocaleString()} 点
         </label>
         <input
          type="range"
          min={0}
          max={10000}
          step={500}
          value={reparationsAmount}
          onChange={(e) => setReparationsAmount(Number(e.target.value))}
          className="w-full accent-emerald-600"
         />
        </div>

        <div className="flex items-center gap-2">
         <input
          type="checkbox"
          id="dmz"
          checked={createDMZ}
          onChange={(e) => setCreateDMZ(e.target.checked)}
          className="rounded text-emerald-600 focus:ring-0"
         />
         <label htmlFor="dmz" className="text-xs font-bold text-slate-700 cursor-pointer">
          同时设立边境 50km 非军事安全缓冲区
         </label>
        </div>

        <button
         type="button"
         onClick={handleProposeArmistice}
         className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
        >
         <Handshake className="w-4 h-4" />
         <span>签署停战协议并生效</span>
        </button>
       </div>
      )}

      {/* TAB 5: BATTLE REPORTS (历史战报) */}
      {activeSubTab === 'reports' && (
       <div className="space-y-4">
        {reports.length === 0 ? (
         <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl">
          暂无战役推演通报记录
         </div>
        ) : (
         reports.map((r) => (
          <BattleReportDetailCard key={r.id} report={r} />
         ))
        )}
       </div>
      )}
     </div>
    </div>
   </div>

   {/* Capitulation Settlement Modal */}
   <CapitulationModal
    isOpen={isCapitulationModalOpen}
    resolution={capitulationResolution}
    onClose={() => setIsCapitulationModalOpen(false)}
   />
  </>
 );
};
