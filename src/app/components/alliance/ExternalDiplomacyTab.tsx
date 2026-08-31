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
  Landmark,
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
      onShowToast(`已向【${target.name}】援助 ${amount.toLocaleString()} 件【${selectedEquipment.name}】；库存已扣减。`);
      setLendAmount(1);
    } catch (error: any) {
      onShowToast(`援助失败：${error?.message || '库存同步异常'}`);
    }
  };

  // Handler: Build Embassy
  const handleBuildEmbassy = async (target: Nation) => {
    const currentEmbassies = myNation.embassies || [];
    if (currentEmbassies.includes(target.id)) {
      onShowToast(`已在【${target.name}】首都派驻大使馆！双边互信深化，好感度提升。`);
      return;
    }

    try {
      const result = await api.diplomacy.send({
        targetNationId: target.id,
        type: 'embassy',
        note: `【${myNation.name}】申请在【${target.name}】首都设立常驻使馆。`,
      });
      onShowToast(`${result.message}`);
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
    onShowToast(`已对【${target.name}】启动【${sanctionType === 'arms' ? '军火禁运' : sanctionType === 'energy' ? '战略能源制裁' : '全方位贸易禁运'}】！`);
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto w-full text-slate-800">
      {/* 顶部标题与精致分段选择器 (Segmented Control) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h2 className="text-sm font-bold text-slate-900 tracking-tight">使馆与外援</h2>
          <p className="text-[11px] text-slate-400 mt-0.5">调配战备库存援助、派驻外交使馆与实施战略制裁</p>
        </div>

        {/* 页面内分段选择器 */}
        <div className="inline-flex p-0.5 bg-slate-100 border border-slate-200/90 rounded-md text-xs self-start sm:self-auto">
          {[
            { id: 'lend_lease', label: '租借法' },
            { id: 'embassy', label: '使馆网' },
            { id: 'sanctions', label: '制裁令' },
          ].map((tab) => {
            const isActive = subSection === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSubSection(tab.id as any)}
                className={`px-3 py-1.5 rounded-sm font-medium transition-all cursor-pointer whitespace-nowrap select-none ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SECTION 1: 租借法 */}
      {subSection === 'lend_lease' && (
        <div className="p-4 sm:p-5 bg-white border border-slate-200 rounded-sm space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 mb-1 font-medium">受援目标国家</label>
              <select
                value={lendTargetNationId}
                onChange={(e) => setLendTargetNationId(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-sm text-slate-800 focus:bg-white focus:outline-none focus:border-slate-400"
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
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-sm text-slate-800 disabled:opacity-50 focus:bg-white focus:outline-none focus:border-slate-400"
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
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-sm border border-slate-200/80">
              <div>
                <span className="text-slate-400 text-[11px] block">当前可用库存</span>
                <strong className="text-slate-900 text-sm block mt-0.5 font-mono">{selectedEquipment.stockpile.toLocaleString()} 件</strong>
              </div>
              <div>
                <span className="text-slate-400 text-[11px] block">国内生产速率</span>
                <strong className={`text-sm block mt-0.5 font-mono ${selectedEquipment.dailyOutput > 0 ? 'text-emerald-700' : 'text-slate-500'}`}>
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
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-sm text-slate-800 focus:bg-white focus:outline-none focus:border-slate-400 font-mono"
            />
          </div>

          <div className="pt-1">
            <button
              type="button"
              onClick={handleSendLendLease}
              disabled={!selectedEquipment || lendAmount < 1 || lendAmount > (selectedEquipment?.stockpile || 0)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 disabled:bg-slate-100 disabled:text-slate-400 text-white font-medium rounded-sm text-xs cursor-pointer transition-colors flex items-center justify-center gap-1.5"
            >
              <Package size={14} className="stroke-[1.75]" />
              <span>正式签署并交付库存租借装备</span>
            </button>
          </div>
        </div>
      )}

      {/* SECTION 2: 使馆网 */}
      {subSection === 'embassy' && (
        <div className="bg-white border border-slate-200 rounded-sm divide-y divide-slate-100 overflow-hidden text-xs">
          {allNations.filter((n) => n.id !== myNation.id).map((target) => {
            const hasEmbassy = (myNation.embassies || []).includes(target.id);
            return (
              <div key={target.id} className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors">
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <span>{target.name}</span>
                    {hasEmbassy && (
                      <span className="px-1.5 py-0.2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-sm text-[10px] font-medium">
                        已设使馆
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">首都：{target.capital}</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleBuildEmbassy(target)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-sm transition-colors cursor-pointer ${
                    hasEmbassy
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      : 'bg-slate-800 hover:bg-slate-900 text-white'
                  }`}
                >
                  {hasEmbassy ? '互访' : '申请'}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* SECTION 3: 制裁令 */}
      {subSection === 'sanctions' && (
        <div className="p-4 sm:p-5 bg-white border border-slate-200 rounded-sm space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 mb-1 font-medium">制裁目标国家</label>
              <select
                value={sanctionTargetId}
                onChange={(e) => setSanctionTargetId(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-sm text-slate-800 focus:bg-white focus:outline-none focus:border-slate-400"
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
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-sm text-slate-800 focus:bg-white focus:outline-none focus:border-slate-400"
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
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-sm text-slate-800 focus:bg-white focus:outline-none focus:border-slate-400"
            />
          </div>

          <div className="pt-1">
            <button
              type="button"
              onClick={handleImposeSanctions}
              className="w-full py-2.5 bg-rose-700 hover:bg-rose-800 text-white font-medium rounded-sm text-xs cursor-pointer transition-colors flex items-center justify-center gap-1.5"
            >
              <Ban size={14} className="stroke-[1.75]" />
              <span>正式实施国家间战略贸易禁运令</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

