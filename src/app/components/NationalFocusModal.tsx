import React, { useEffect } from 'react';
import {
  X,
  Sparkles,
  Clock,
  CheckCircle2,
  Lock,
  Layers,
  FileCheck,
  RefreshCw,
  Stamp,
  ShieldAlert,
} from 'lucide-react';
import { NationalFocusNode, FocusStatus } from '../types';
import { FOCUS_NODE_MAP } from '../lib/nationalFocusData';
import { NationalFocusNodeCard } from './NationalFocusNodeCard';

interface NationalFocusModalProps {
  focusNode: NationalFocusNode | null;
  isOpen: boolean;
  onClose: () => void;
  status: FocusStatus;
  completedFocusIds: string[];
  onFormulate: (node: NationalFocusNode) => void;
  onSelectFocus: (focusId: string) => void;
  isFormulating?: boolean;
}

/**
 * 钢铁雄心4 (HOI4) 风格国家内阁国策决议公文 / 令状弹窗
 */
export const NationalFocusModal: React.FC<NationalFocusModalProps> = ({
  focusNode,
  isOpen,
  onClose,
  status,
  completedFocusIds,
  onFormulate,
  onSelectFocus,
  isFormulating = false,
}) => {
  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !focusNode) return null;

  const isCompleted = status === 'completed';
  const isInProgress = status === 'in_progress';
  const isAvailable = status === 'available';
  const isLocked = status === 'locked';

  const categoryName =
    focusNode.category === 'politics'
      ? '政治与宪政体制'
      : focusNode.category === 'economy'
      ? '工业与战时经济'
      : focusNode.category === 'military'
      ? '国防与三军军事'
      : focusNode.category === 'diplomacy'
      ? '地缘外交与同盟'
      : '国家终极战略工程';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-fadeIn select-none"
      onClick={onClose}
    >
      {/* 1936 Cabinet Strategic Decree Document Modal */}
      <div
        className="relative w-full max-w-lg bg-[#fbf9f4] text-slate-900 rounded-xl shadow-2xl border-2 border-[#854d0e]/60 overflow-hidden flex flex-col transform transition-all animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Vintage Top Archival Header Bar */}
        <div className="px-4 py-2 bg-[#2d3748] text-slate-200 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] font-mono tracking-widest uppercase text-amber-300 font-bold">
            <Stamp className="w-3.5 h-3.5 text-amber-400" />
            <span>国家最高战略发展案 · DECREE {focusNode.id.toUpperCase()}</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-6 h-6 rounded bg-slate-700/80 hover:bg-slate-600 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer"
            title="关闭 (Esc)"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Header: HOI4 Node Card + Title + Status */}
        <div className="p-4 bg-[#f3efe6] border-b border-slate-300/80 flex items-center gap-4">
          <div className="shrink-0 drop-shadow-md">
            <NationalFocusNodeCard
              iconType={focusNode.iconType}
              name={focusNode.name}
              status={status}
              durationDays={focusNode.durationDays}
              width={96}
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-slate-800 text-amber-300 font-mono">
                {focusNode.branchName}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100/80 text-amber-900 border border-amber-300">
                {categoryName}
              </span>
            </div>

            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight font-serif">
              {focusNode.name}
            </h2>
            <p className="text-xs text-slate-600 font-medium">{focusNode.subtitle}</p>

            <div className="mt-2 flex items-center gap-3 text-xs font-mono">
              <span className="flex items-center gap-1 text-slate-600">
                <Clock className="w-3.5 h-3.5 text-amber-700" />
                周期: <strong className="text-slate-900">{focusNode.durationDays} 天</strong>
              </span>
              <span className="flex items-center gap-1 text-slate-600">
                <Layers className="w-3.5 h-3.5 text-indigo-700" />
                阶段: <strong className="text-slate-900">Tier {focusNode.tier}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-4 space-y-3 bg-[#fbf9f4] text-xs">
          {/* Construction Factory Direct Delivery Highlight (建设样国策专属工业交付卡) */}
          {focusNode.constructionBonus && ((focusNode.constructionBonus.civilianFactories || 0) > 0 || (focusNode.constructionBonus.militaryFactories || 0) > 0) && (
            <div className="p-3 rounded-lg bg-gradient-to-r from-amber-950/90 via-slate-900 to-amber-950/90 border-2 border-amber-500/70 text-amber-100 shadow-md">
              <div className="flex items-center gap-2 text-[11px] font-bold text-amber-300 uppercase tracking-wide mb-1 font-serif">
                <span className="text-base">🏗️</span>
                <span>国家重点工业基建直接交付</span>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                {(focusNode.constructionBonus.civilianFactories || 0) > 0 && (
                  <div className="p-2 rounded bg-slate-800/80 border border-amber-500/40 flex items-center justify-between">
                    <span className="text-slate-300 font-medium">民用工厂落成</span>
                    <span className="font-mono font-black text-amber-400 text-sm">
                      +{focusNode.constructionBonus.civilianFactories} 座
                    </span>
                  </div>
                )}
                {(focusNode.constructionBonus.militaryFactories || 0) > 0 && (
                  <div className="p-2 rounded bg-slate-800/80 border border-amber-500/40 flex items-center justify-between">
                    <span className="text-slate-300 font-medium">军用工厂落成</span>
                    <span className="font-mono font-black text-amber-400 text-sm">
                      +{focusNode.constructionBonus.militaryFactories} 座
                    </span>
                  </div>
                )}
              </div>
              <p className="mt-1.5 text-[10px] text-amber-200/80">
                ★ 签署后将直接在国家首都及核心工业省份实装落成，真实增加地图与经济产能统计。
              </p>
            </div>
          )}

          {/* Effects Section */}
          <div>
            <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1 font-serif">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>颁布后国家战略加成与永久效果</span>
            </div>
            <div className="p-3 bg-white rounded-lg border border-slate-300/80 shadow-2xs space-y-2">
              {focusNode.effects.map((eff, i) => (
                <div key={i} className="flex items-center justify-between text-xs font-medium">
                  <span className="text-slate-800 flex items-center gap-2 truncate">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600 shrink-0" />
                    {eff.text}
                  </span>
                  {eff.value && (
                    <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-300 text-[11px] shrink-0 ml-2">
                      {eff.value}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Prerequisites Section */}
          <div>
            <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1 font-serif">
              <FileCheck className="w-3.5 h-3.5 text-slate-500" />
              <span>前置国策与解锁关系</span>
            </div>
            {focusNode.prerequisites.length === 0 ? (
              <div className="px-3 py-1.5 bg-emerald-50/70 border border-emerald-200 rounded-lg text-emerald-900 text-xs flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>国家战略最高起点（无前置国策要求，随时可签署颁布）</span>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {focusNode.prerequisites.map((pid) => {
                  const prereqNode = FOCUS_NODE_MAP.get(pid);
                  const isMet = completedFocusIds.includes(pid);
                  return (
                    <button
                      key={pid}
                      type="button"
                      onClick={() => onSelectFocus(pid)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-2xs ${
                        isMet
                          ? 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100'
                          : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                      }`}
                      title="点击跳转至此前置国策"
                    >
                      {isMet ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <ShieldAlert className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                      )}
                      <span>{prereqNode?.name || pid}</span>
                      <span className="text-[10px] opacity-75 font-mono font-normal">
                        ({isMet ? '已就绪' : '需先完成'})
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Historical Description Lore */}
          <div className="p-2.5 bg-[#f0ecdf] border-l-2 border-amber-700 text-slate-700 italic text-[11px] leading-relaxed rounded-r-md">
            “{focusNode.description}”
          </div>
        </div>

        {/* Footer Actions: HOI4 Grand Decision Button */}
        <div className="px-4 py-3 bg-[#ebe5d8] border-t border-slate-300 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg border border-slate-400 bg-white hover:bg-slate-100 text-xs font-bold text-slate-700 transition cursor-pointer"
          >
            返回树状图
          </button>

          <div className="flex-1 flex justify-end">
            {isCompleted ? (
              <button
                type="button"
                disabled
                className="px-5 py-2 bg-[#2d5a3f] text-emerald-100 border border-emerald-500/50 rounded-lg text-xs font-bold shadow-xs cursor-default flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span>此项国策已签署并永久生效</span>
              </button>
            ) : isInProgress ? (
              <button
                type="button"
                onClick={() => onFormulate(focusNode)}
                className="px-5 py-2 bg-gradient-to-r from-amber-700 to-amber-800 text-amber-100 border border-amber-500 rounded-lg text-xs font-bold shadow-md transition cursor-pointer flex items-center gap-2 animate-pulse"
              >
                <RefreshCw className="w-4 h-4 text-amber-200 animate-spin" />
                <span>正在实施中 · 立即签署生效</span>
              </button>
            ) : isAvailable ? (
              <button
                type="button"
                disabled={isFormulating}
                onClick={() => onFormulate(focusNode)}
                className="px-6 py-2.5 bg-gradient-to-r from-[#92400e] via-[#b45309] to-[#78350f] hover:from-[#78350f] hover:to-[#92400e] text-amber-100 border-2 border-amber-300 rounded-lg text-xs font-black tracking-wide shadow-lg hover:shadow-xl transition-all cursor-pointer flex items-center gap-2 active:scale-98"
              >
                <Stamp className="w-4 h-4 text-amber-300" />
                <span>{isFormulating ? '正在盖印生效...' : '★ 签署并颁布实施此项国策'}</span>
              </button>
            ) : (
              <button
                type="button"
                disabled
                className="px-4 py-2 bg-slate-200 text-slate-500 border border-slate-300 rounded-lg text-xs font-bold cursor-not-allowed flex items-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>前置国策尚未满足</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
