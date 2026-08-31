import React, { useState } from 'react';
import {
 ShieldBan,
 AlertTriangle,
 Globe,
 Plus,
 ArrowRight,
 TrendingDown,
 Building2,
 Trash2,
 CheckCircle2,
 Coins,
 Layers,
} from 'lucide-react';
import { Nation } from '../types';
import { InternationalEmbargoItem, STRATEGIC_RESOURCES } from '../lib/strategicCommandEngine';

interface InternationalEmbargoViewProps {
 nation: Nation | null;
 allNations: Nation[];
 onPersistNation?: (nation: Nation) => void;
 onNavigateToMap?: () => void;
}

export const InternationalEmbargoView: React.FC<InternationalEmbargoViewProps> = ({
 nation,
 allNations,
 onPersistNation,
 onNavigateToMap,
}) => {
 const [activeTab, setActiveTab] = useState<'imposed_by_me' | 'targeted_at_me'>('imposed_by_me');
 const [showCreateModal, setShowCreateModal] = useState(false);
 const [targetNationId, setTargetNationId] = useState('');
 const [embargoType, setEmbargoType] = useState<'arms' | 'energy' | 'total'>('total');
 const [embargoReason, setEmbargoReason] = useState('抵御地缘扩张与保障领土安全');

 const mySanctions = (nation?.activeSanctionsEnforced || []).map((s, idx): InternationalEmbargoItem => {
  const targetN = allNations.find((n) => n.id === s.targetNationId);
  return {
   id: `embargo-${idx}`,
   targetNationId: s.targetNationId,
   targetNationName: targetN?.name || '指定目标国',
   initiatorNationId: nation?.id || '',
   initiatorNationName: nation?.name || '我国',
   direction: 'imposed_by_me',
   type: s.type === 'arms' ? 'arms' : s.type === 'energy' ? 'energy_oil' : 'total_trade',
   typeZh: s.type === 'arms' ? '军火与战略军械禁运' : s.type === 'energy' ? '石油与重化能源封锁' : '全面综合贸易禁运',
   reason: s.reason || '地缘争端与安全制裁',
   startedAt: s.since || new Date().toISOString(),
   elapsedDays: 18,
   affectedResources: s.type === 'energy' ? ['oil', 'rubber'] : s.type === 'arms' ? ['steel', 'aluminium', 'chromium'] : ['oil', 'steel', 'rubber', 'tungsten'],
   estimatedDailyTradeLossTreasury: 420,
   targetIndustrialPenaltyPercent: 15,
   status: 'active',
  };
 });

 // Simulated sanctions targeted at me by adversaries
 const wars = nation?.activeWars || [];
 const sanctionsAgainstMe: InternationalEmbargoItem[] = wars.map((w, idx) => ({
  id: `sanction-against-${idx}`,
  targetNationId: nation?.id || '',
  targetNationName: nation?.name || '我国',
  initiatorNationId: w.withNationId,
  initiatorNationName: w.withNationName,
  direction: 'targeted_at_me',
  type: 'total_trade',
  typeZh: '战时全面经济封锁与禁运',
  reason: '战时交火敌对封锁',
  startedAt: w.since,
  elapsedDays: 14,
  affectedResources: ['oil', 'iron', 'chromium', 'rubber'],
  estimatedDailyTradeLossTreasury: 580,
  targetIndustrialPenaltyPercent: 12,
  status: 'active',
 }));

 const handleCreateEmbargo = () => {
  if (!targetNationId || !nation) return;
  const targetN = allNations.find((n) => n.id === targetNationId);
  if (!targetN) return;

  const newSanction = {
   targetNationId,
   type: embargoType,
   reason: embargoReason,
   since: new Date().toISOString(),
  };

  const updatedSanctions = [...(nation.activeSanctionsEnforced || []), newSanction];
  const updatedNation: Nation = {
   ...nation,
   activeSanctionsEnforced: updatedSanctions,
  };

  if (onPersistNation) onPersistNation(updatedNation);
  setShowCreateModal(false);
 };

 const handleLiftEmbargo = (targetId: string) => {
  if (!nation) return;
  const updatedSanctions = (nation.activeSanctionsEnforced || []).filter((s) => s.targetNationId !== targetId);
  const updatedNation: Nation = {
   ...nation,
   activeSanctionsEnforced: updatedSanctions,
  };
  if (onPersistNation) onPersistNation(updatedNation);
 };

 const displayList = activeTab === 'imposed_by_me' ? mySanctions : sanctionsAgainstMe;

 return (
  <div className="max-w-6xl mx-auto space-y-4 pb-12 animate-fadeIn select-none">
   {/* Header Bar */}
   <div className="bg-white border border-slate-200/90 rounded-[4px] p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
    <div className="flex items-center gap-3">
     <div className="w-10 h-10 rounded-[3px] bg-slate-900 text-white flex items-center justify-center">
      <ShieldBan className="w-5 h-5" />
     </div>
     <div>
      <h1 className="text-base font-bold text-slate-900">国际贸易禁运与战略经济制裁系统</h1>
      <p className="text-xs text-slate-500 font-mono">
       INTERNATIONAL EMBARGO & GEOPOLITICAL SANCTIONS
      </p>
     </div>
    </div>

    <button
     type="button"
     onClick={() => setShowCreateModal(true)}
     className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-[3px] text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
    >
     <Plus className="w-3.5 h-3.5" />
     <span>签署对外国禁运令</span>
    </button>
   </div>

   {/* Filter Tabs */}
   <div className="flex items-center gap-2 border-b border-slate-200">
    <button
     type="button"
     onClick={() => setActiveTab('imposed_by_me')}
     className={`px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-2 ${
      activeTab === 'imposed_by_me'
       ? 'border-slate-900 text-slate-900'
       : 'border-transparent text-slate-500 hover:text-slate-800'
     }`}
    >
     <span>我方正在实施的禁运</span>
     <span className="px-1.5 py-0.2 bg-slate-100 text-slate-700 rounded font-mono text-[10px]">
      {mySanctions.length}
     </span>
    </button>

    <button
     type="button"
     onClick={() => setActiveTab('targeted_at_me')}
     className={`px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-2 ${
      activeTab === 'targeted_at_me'
       ? 'border-rose-600 text-rose-700'
       : 'border-transparent text-slate-500 hover:text-slate-800'
     }`}
    >
     <span>外部对我方实施的禁运</span>
     <span className="px-1.5 py-0.2 bg-rose-100 text-rose-800 rounded font-mono text-[10px]">
      {sanctionsAgainstMe.length}
     </span>
    </button>
   </div>

   {/* Embargo List View */}
   {displayList.length === 0 ? (
    <div className="p-12 text-center bg-white border border-slate-200/90 rounded-[4px] space-y-2">
     <ShieldBan className="w-8 h-8 text-slate-400 mx-auto" />
     <h3 className="text-sm font-bold text-slate-800">当前无生效中的禁运制裁条目</h3>
     <p className="text-xs text-slate-500 max-w-sm mx-auto">
      {activeTab === 'imposed_by_me'
       ? '我国目前未对任何外国实施单边战略物资禁运。'
       : '暂无外国对我国执行经济制裁或海运封锁。'}
     </p>
    </div>
   ) : (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
     {displayList.map((item) => (
      <div
       key={item.id}
       className="bg-white border border-slate-200/90 rounded-[4px] p-4 shadow-2xs space-y-3"
      >
       <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <div className="flex items-center gap-2">
         <div
          className={`w-7 h-7 rounded-[2px] flex items-center justify-center font-bold text-xs ${
           item.direction === 'imposed_by_me'
            ? 'bg-slate-900 text-white'
            : 'bg-rose-600 text-white'
          }`}
         >
          {item.direction === 'imposed_by_me' ? '封' : '禁'}
         </div>
         <div>
          <h4 className="text-xs font-bold text-slate-900">
           {item.direction === 'imposed_by_me'
            ? `对【${item.targetNationName}】制裁`
            : `来自【${item.initiatorNationName}】封锁`}
          </h4>
          <span className="text-[10px] text-slate-500 font-mono">
           生效历时 {item.elapsedDays} 天 · {item.typeZh}
          </span>
         </div>
        </div>

        {item.direction === 'imposed_by_me' && (
         <button
          type="button"
          onClick={() => handleLiftEmbargo(item.targetNationId)}
          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-[2px] text-[11px] font-bold transition cursor-pointer"
         >
          解除禁运
         </button>
        )}
       </div>

       <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-[3px] space-y-1.5 text-xs font-mono">
        <div className="flex items-center justify-between text-slate-600">
         <span>受阻战略资源种类：</span>
         <div className="flex items-center gap-1.5">
          {item.affectedResources.map((r) => (
           <span key={r} className="px-1.5 py-0.5 rounded-[2px] bg-slate-200 text-slate-800 text-[10px] font-bold" title={STRATEGIC_RESOURCES[r]?.name}>
            {STRATEGIC_RESOURCES[r]?.name}
           </span>
          ))}
         </div>
        </div>

        <div className="flex items-center justify-between text-slate-600">
         <span>双边每日外贸关税损失：</span>
         <span className="font-bold text-rose-700">-{item.estimatedDailyTradeLossTreasury} 币/日</span>
        </div>

        <div className="flex items-center justify-between text-slate-600">
         <span>目标国军工厂产能压制：</span>
         <span className="font-bold text-slate-900">-{item.targetIndustrialPenaltyPercent}%</span>
        </div>
       </div>

       <div className="text-[11px] text-slate-500">
        制裁法理依据：<span className="text-slate-800">{item.reason}</span>
       </div>
      </div>
     ))}
    </div>
   )}

   {/* Create Embargo Modal */}
   {showCreateModal && (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
     <div className="bg-white border border-slate-200 rounded-[4px] max-w-md w-full p-5 shadow-xl space-y-4 animate-scaleUp">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
       <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
        <ShieldBan className="w-4 h-4 text-slate-900" />
        <span>签署下达对外贸易禁运令</span>
       </h3>
       <button
        type="button"
        onClick={() => setShowCreateModal(false)}
        className="text-slate-400 hover:text-slate-600 text-xs font-bold"
       >
        
       </button>
      </div>

      <div className="space-y-3 text-xs">
       <div>
        <label className="block text-slate-600 font-bold mb-1">选择制裁目标主权国家：</label>
        <select
         value={targetNationId}
         onChange={(e) => setTargetNationId(e.target.value)}
         className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-[2px] font-medium text-slate-900"
        >
         <option value="">-- 请选择目标国家 --</option>
         {allNations
          .filter((n) => n.id !== nation?.id)
          .map((n) => (
           <option key={n.id} value={n.id}>
            {n.name} ({n.territory || '周边领土'})
           </option>
          ))}
        </select>
       </div>

       <div>
        <label className="block text-slate-600 font-bold mb-1">禁运与封锁类型：</label>
        <div className="grid grid-cols-3 gap-2">
         {[
          { id: 'arms', label: '军火装备' },
          { id: 'energy', label: '石油能源' },
          { id: 'total', label: '全面贸易' },
         ].map((t) => (
          <button
           key={t.id}
           type="button"
           onClick={() => setEmbargoType(t.id as any)}
           className={`py-2 rounded-[2px] border text-xs font-bold transition cursor-pointer ${
            embargoType === t.id
             ? 'bg-slate-900 text-white border-slate-900'
             : 'bg-slate-50 text-slate-700 border-slate-200'
           }`}
          >
           {t.label}
          </button>
         ))}
        </div>
       </div>

       <div>
        <label className="block text-slate-600 font-bold mb-1">官方宣示通报理由：</label>
        <input
         type="text"
         value={embargoReason}
         onChange={(e) => setEmbargoReason(e.target.value)}
         className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-[2px] font-medium text-slate-900"
        />
       </div>
      </div>

      <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
       <button
        type="button"
        onClick={() => setShowCreateModal(false)}
        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-[2px] cursor-pointer"
       >
        取消
       </button>
       <button
        type="button"
        onClick={handleCreateEmbargo}
        disabled={!targetNationId}
        className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold rounded-[2px] cursor-pointer"
       >
        正式施行禁运
       </button>
      </div>
     </div>
    </div>
   )}
  </div>
 );
};
