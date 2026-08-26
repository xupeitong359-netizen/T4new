import React, { useState, useMemo, useEffect } from 'react';
import {
 Package,
 Building,
 Ban,
 Send,
 Coins,
 Shield,
 CheckCircle2,
 AlertTriangle,
} from 'lucide-react';
import { Nation, LendLeaseOffer } from '../../types';
import { STANDARD_EQUIPMENT_TEMPLATES } from '../../lib/militaryIndustry';
import { strategicStorage } from '../../services/strategicGameplayService';
import { api } from '../../services/api';

interface ExternalDiplomacyTabProps {
 myNation: Nation;
 allNations: Nation[];
 onUpdateNation: (updated: Nation) => void;
 onShowToast: (msg: string) => void;
}

export const ExternalDiplomacyTab: React.FC<ExternalDiplomacyTabProps> = ({
 myNation,
 allNations,
 onUpdateNation,
 onShowToast,
}) => {
 const [subSection, setSubSection] = useState<'lend_lease' | 'embassy' | 'sanctions'>('lend_lease');

 // Lend-Lease State
 const [lendTargetNationId, setLendTargetNationId] = useState(
  allNations.find((n) => n.id !== myNation?.id)?.id || ''
 );
 const [lendEquipmentId, setLendEquipmentId] = useState('');
 const [lendAmount, setLendAmount] = useState(1);

 // Sanctions State
 const [sanctionTargetId, setSanctionTargetId] = useState(
  allNations.find((n) => n.id !== myNation?.id)?.id || ''
 );
 const [sanctionType, setSanctionType] = useState<'arms' | 'energy' | 'total'>('arms');
 const [sanctionReason, setSanctionReason] = useState('单方面破坏边境和平协议与非法军备扩张');

 const lendableEquipment = useMemo(() => {
  const industry = myNation?.militaryIndustry;
  const stockpiles = industry?.stockpiles || {};
  const lines = industry?.productionLines || [];
  const designs = industry?.customDesigns || [];
  const ids = new Set([...Object.keys(stockpiles), ...lines.map((line) => line.equipmentId)]);

  return Array.from(ids)
   .map((id) => {
    const matchingLines = lines.filter((line) => line.equipmentId === id);
    const template = STANDARD_EQUIPMENT_TEMPLATES.find((item) => item.id === id);
    const design = designs.find((item) => item.id === id);
    return {
     id,
     name: matchingLines[0]?.equipmentName || design?.name || template?.name || id,
     stockpile: Math.max(0, Number(stockpiles[id]) || 0),
     dailyOutput: matchingLines.reduce(
      (total, line) => total + (line.assignedFactories > 0 ? Number(line.dailyOutput) || 0 : 0),
      0
     ),
    };
   })
   .filter((item) => item.stockpile > 0);
 }, [myNation]);

 const selectedEquipment = lendableEquipment.find((item) => item.id === lendEquipmentId) || null;

 useEffect(() => {
  if (lendableEquipment.length === 0) {
   if (lendEquipmentId) setLendEquipmentId('');
   return;
  }
  if (!lendableEquipment.some((item) => item.id === lendEquipmentId)) {
   setLendEquipmentId(lendableEquipment[0].id);
   setLendAmount(Math.min(1, lendableEquipment[0].stockpile));
  }
 }, [lendEquipmentId, lendableEquipment]);

 // Handler: Send Lend-Lease
 const handleSendLendLease = async () => {
  if (!myNation) return;
  const target = allNations.find((n) => n.id === lendTargetNationId);
  if (!target) return onShowToast('请选择受援目标国家');
  if (!selectedEquipment) return onShowToast('当前没有可援助的库存装备');
  const amount = Math.floor(Number(lendAmount));
  if (!Number.isFinite(amount) || amount < 1) return onShowToast('援助数量至少为 1');
  if (amount > selectedEquipment.stockpile) {
   return onShowToast(`库存不足：当前最多可援助 ${selectedEquipment.stockpile.toLocaleString()} 件`);
  }

  const updatedIndustry = {
   ...(myNation.militaryIndustry || { productionLines: [], customDesigns: [], stockpiles: {} }),
   stockpiles: {
    ...(myNation.militaryIndustry?.stockpiles || {}),
    [selectedEquipment.id]: selectedEquipment.stockpile - amount,
   },
   lastUpdated: new Date().toISOString(),
  };

  try {
   const result = await api.nations.updateMilitaryIndustry(myNation.id, updatedIndustry);
   onUpdateNation(result.nation);
   const newOffer: LendLeaseOffer = {
    id: 'll_' + Date.now(),
    senderNationId: myNation.id,
    senderNationName: myNation.name,
    receiverNationId: target.id,
    receiverNationName: target.name,
    itemType: 'equipment',
    itemName: selectedEquipment.name,
    amount,
    note: '国家最高领主签署的库存装备援助备忘录',
    createdAt: new Date().toISOString(),
    status: 'accepted',
   };
   strategicStorage.saveLendLeaseOffers([newOffer, ...strategicStorage.getLendLeaseOffers()]);
   onShowToast(` 已向【${target.name}】援助 ${amount.toLocaleString()} 件【${selectedEquipment.name}】；库存已扣减。`);
   setLendAmount(1);
  } catch (error: any) {
   onShowToast(`援助失败：${error?.message || '库存同步异常'}`);
  }
 };

 // Handler: Build Embassy
 const handleBuildEmbassy = async (target: Nation) => {
  const currentEmbassies = myNation.embassies || [];
  if (currentEmbassies.includes(target.id)) {
   onShowToast(` 已在【${target.name}】首都派驻大使馆！最高领主国事访问圆满成功，双边好感度 +30！`);
   return;
  }

  try {
   const result = await api.diplomacy.send({
    targetNationId: target.id,
    type: 'embassy',
    note: `【${myNation.name}】申请在【${target.name}】首都设立常驻使馆。`,
   });
   onShowToast(` ${result.message}`);
  } catch (error: any) {
   onShowToast(`使馆申请未能送达：${error?.message || '外交档案同步异常'}`);
  }
 };

 // Handler: Impose Sanctions
 const handleImposeSanctions = () => {
  const target = allNations.find((n) => n.id === sanctionTargetId);
  if (!target) return;

  const currentSanctions = myNation.activeSanctionsEnforced || [];
  const newSanction = {
   targetNationId: target.id,
   type: sanctionType,
   reason: sanctionReason,
   since: new Date().toISOString(),
  };

  const updatedNation: Nation = {
   ...myNation,
   activeSanctionsEnforced: [newSanction, ...currentSanctions],
  };
  onUpdateNation(updatedNation);
  onShowToast(` 已对【${target.name}】启动【${sanctionType === 'arms' ? '军火禁运' : sanctionType === 'energy' ? '战略能源制裁' : '全方位贸易禁运'}】！`);
 };

 return (
  <div className="space-y-4 max-w-5xl mx-auto w-full text-slate-800">
   {/* Sub tabs - 3 Chinese Characters Each */}
   <div className="flex items-center gap-2 border-b border-slate-200 bg-white px-3 pt-1 rounded-t-xl">
    {[
     { id: 'lend_lease', label: '租借法', icon: Package },
     { id: 'embassy', label: '使馆网', icon: Building },
     { id: 'sanctions', label: '制裁令', icon: Ban },
    ].map((tab) => {
     const Icon = tab.icon;
     const isActive = subSection === tab.id;
     return (
      <button
       key={tab.id}
       type="button"
       onClick={() => setSubSection(tab.id as any)}
       className={`py-2.5 px-3 text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
        isActive
         ? 'border-blue-600 text-blue-600 font-semibold'
         : 'border-transparent text-slate-500 hover:text-slate-900'
       }`}
      >
       <Icon size={14} className={isActive ? 'text-blue-600' : 'text-slate-400'} />
       <span>{tab.label}</span>
      </button>
     );
    })}
   </div>

   {/* SECTION 1: LEND LEASE */}
   {subSection === 'lend_lease' && (
    <div className="p-4 sm:p-5 bg-white border border-slate-200/90 rounded-xl space-y-4 text-xs shadow-2xs">
     <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-lg text-blue-800 leading-relaxed">
      <strong>战备库存装备援助：</strong> 支持向友好国家直接调配战备库存装备，支援友邦前线作战或换取地缘影响力。
     </div>

     <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
       <label className="block text-slate-600 mb-1 font-medium">受援目标国家</label>
       <select
        value={lendTargetNationId}
        onChange={(e) => setLendTargetNationId(e.target.value)}
        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
       >
        {allNations.filter((n) => n.id !== myNation.id).map((nation) => (
         <option key={nation.id} value={nation.id}>{nation.name}</option>
        ))}
       </select>
      </div>

      <div>
       <label className="block text-slate-600 mb-1 font-medium">选择可调配库存装备</label>
       <select
        value={lendEquipmentId}
        onChange={(e) => {
         setLendEquipmentId(e.target.value);
         setLendAmount(1);
        }}
        disabled={lendableEquipment.length === 0}
        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 disabled:opacity-50 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
       >
        {lendableEquipment.length === 0 ? (
         <option value="">暂无可调拨库存</option>
        ) : lendableEquipment.map((item) => (
         <option key={item.id} value={item.id}>{item.name} · 库存 {item.stockpile.toLocaleString()} 件</option>
        ))}
       </select>
      </div>
     </div>

     {selectedEquipment && (
      <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200/80">
       <div>
        <span className="text-slate-500 text-[11px] block">当前可用库存</span>
        <strong className="text-slate-900 text-sm block mt-0.5">{selectedEquipment.stockpile.toLocaleString()} 件</strong>
       </div>
       <div>
        <span className="text-slate-500 text-[11px] block">国内生产速率</span>
        <strong className={`text-sm block mt-0.5 ${selectedEquipment.dailyOutput > 0 ? 'text-emerald-700' : 'text-slate-500'}`}>
         {selectedEquipment.dailyOutput > 0 ? `日产 ${Math.floor(selectedEquipment.dailyOutput).toLocaleString()} 件` : '当前未排产'}
        </strong>
       </div>
      </div>
     )}

     <div>
      <label className="block text-slate-600 mb-1 font-medium">援助调拨数量</label>
      <input
       type="number"
       min="1"
       max={selectedEquipment?.stockpile || 0}
       value={lendAmount}
       onChange={(e) => setLendAmount(Math.max(1, Math.floor(Number(e.target.value) || 1)))}
       disabled={!selectedEquipment}
       className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
      />
     </div>

     <button
      type="button"
      onClick={handleSendLendLease}
      disabled={!selectedEquipment || lendAmount < 1 || lendAmount > (selectedEquipment?.stockpile || 0)}
      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold rounded-lg text-xs cursor-pointer transition-colors flex items-center justify-center gap-1.5 shadow-xs"
     >
      <Package size={14} />
      <span>正式签署并交付库存租借装备</span>
     </button>
    </div>
   )}

   {/* SECTION 2: EMBASSY NETWORK */}
   {subSection === 'embassy' && (
    <div className="p-4 sm:p-5 bg-white border border-slate-200/90 rounded-xl space-y-3 text-xs shadow-2xs">
     <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-lg text-emerald-800 leading-relaxed">
      <strong>常驻使馆与国事访问：</strong> 向目标国首都派驻常驻外交使团，深化双边互信，并在受邀时开启最高领主国事访问。
     </div>

     <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
      {allNations.filter((n) => n.id !== myNation.id).map((target) => {
       const hasEmbassy = (myNation.embassies || []).includes(target.id);
       return (
        <div key={target.id} className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg flex items-center justify-between gap-2">
         <div>
          <div className="font-semibold text-slate-900">{target.name}</div>
          <div className="text-[11px] text-slate-500">首都：{target.capital} · 元首：{target.ownerUsername}</div>
         </div>
         <button
          type="button"
          onClick={() => handleBuildEmbassy(target)}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
           hasEmbassy
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200'
          }`}
         >
          {hasEmbassy ? '开启国事互访' : '申请设立使馆'}
         </button>
        </div>
       );
      })}
     </div>
    </div>
   )}

   {/* SECTION 3: SANCTIONS */}
   {subSection === 'sanctions' && (
    <div className="p-4 sm:p-5 bg-white border border-slate-200/90 rounded-xl space-y-3 text-xs shadow-2xs">
     <div className="p-3 bg-rose-50/70 border border-rose-100 rounded-lg text-rose-800 leading-relaxed">
      <strong>国家战略禁运与多边制裁：</strong> 对敌对国家施加军火禁运、战略能源封锁或全方位海关贸易制裁。
     </div>

     <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
       <label className="block text-slate-600 mb-1 font-medium">制裁目标国家</label>
       <select
        value={sanctionTargetId}
        onChange={(e) => setSanctionTargetId(e.target.value)}
        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
       >
        {allNations.filter((n) => n.id !== myNation.id).map((n) => (
         <option key={n.id} value={n.id}>{n.name}</option>
        ))}
       </select>
      </div>

      <div>
       <label className="block text-slate-600 mb-1 font-medium">禁运制裁类型</label>
       <select
        value={sanctionType}
        onChange={(e) => setSanctionType(e.target.value as any)}
        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
       >
        <option value="arms">军火装备与航空零部件禁运</option>
        <option value="energy">战略石油与核能燃料禁运</option>
        <option value="total">全方位跨国海关贸易封锁与资产冻结</option>
       </select>
      </div>
     </div>

     <div>
      <label className="block text-slate-600 mb-1 font-medium">制裁公报理由与依据</label>
      <textarea
       rows={2}
       value={sanctionReason}
       onChange={(e) => setSanctionReason(e.target.value)}
       className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
      />
     </div>

     <button
      type="button"
      onClick={handleImposeSanctions}
      className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg text-xs cursor-pointer transition-colors flex items-center justify-center gap-1.5 shadow-xs"
     >
      <Ban size={14} />
      <span>正式实施国家间战略贸易禁运令</span>
     </button>
    </div>
   )}
  </div>
 );
};
