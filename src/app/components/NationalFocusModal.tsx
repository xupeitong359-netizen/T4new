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
  Info,
} from 'lucide-react';
import { NationalFocusNode, FocusStatus } from '../types';
import { FOCUS_NODE_MAP } from '../lib/nationalFocusData';
import { NationalFocusMedallion } from './NationalFocusMedallion';

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
      ? '政治体制'
      : focusNode.category === 'economy'
      ? '工业经济'
      : focusNode.category === 'military'
      ? '国防军事'
      : focusNode.category === 'diplomacy'
      ? '地缘外交'
      : '终极工程';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn select-none"
      onClick={onClose}
    >
      {/* Compact All-in-One Modal Card (No scroll needed) */}
      <div
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col transform transition-all animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Gold Trim */}
        <div className="h-1.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600" />

        {/* Compact Header: Medallion + Title + Tags + Close */}
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between gap-3 bg-gradient-to-b from-slate-50 to-white">
          <div className="flex items-center gap-3 min-w-0">
            <div className="shrink-0 drop-shadow-xs">
              <NationalFocusMedallion
                iconType={focusNode.iconType}
                name=""
                tier={focusNode.tier}
                status={status}
                size={44}
              />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300 font-mono">
                  {focusNode.branchName}
                </span>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                  {categoryName}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    isCompleted
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                      : isInProgress
                      ? 'bg-amber-50 text-amber-800 border-amber-300'
                      : isAvailable
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-300'
                      : 'bg-slate-100 text-slate-500 border-slate-300'
                  }`}
                >
                  {isCompleted
                    ? '已实施生效'
                    : isInProgress
                    ? '进行中'
                    : isAvailable
                    ? '可制定'
                    : '前置未达成'}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight font-serif truncate mt-0.5">
                {focusNode.name}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition shrink-0 cursor-pointer"
            title="关闭 (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Compact Content: Metrics, Effects, Prerequisites & Lore (All in one view) */}
        <div className="px-4 py-3 space-y-2.5 bg-white">
          {/* Row 1: Key Metrics (Cycle & Requirements) */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center justify-between px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="text-slate-500 font-medium flex items-center gap-1.5 text-[11px]">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                实施周期
              </span>
              <span className="font-bold text-slate-900 font-mono text-xs">
                {focusNode.durationDays} 天
              </span>
            </div>

            <div className="flex items-center justify-between px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="text-slate-500 font-medium flex items-center gap-1.5 text-[11px]">
                <Layers className="w-3.5 h-3.5 text-slate-400" />
                战略阶层
              </span>
              <span className="font-bold text-slate-800 font-mono text-xs">
                Tier {focusNode.tier}
              </span>
            </div>
          </div>

          {/* Row 2: Effects & Buffs List */}
          <div className="space-y-1.5">
            <div className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>国策效果与国家加成</span>
            </div>
            <div className="p-2.5 bg-amber-50/40 rounded-xl border border-amber-200/70 space-y-1.5">
              {focusNode.effects.map((eff, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-xs font-medium"
                >
                  <span className="text-slate-800 flex items-center gap-1.5 truncate">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                    {eff.text}
                  </span>
                  {eff.value && (
                    <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 text-[11px] shrink-0 ml-2">
                      {eff.value}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Row 3: Prerequisites Conditions (Compact) */}
          <div className="space-y-1">
            <div className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
              <FileCheck className="w-3.5 h-3.5 text-slate-400" />
              <span>前置解锁条件</span>
            </div>
            {focusNode.prerequisites.length === 0 ? (
              <div className="px-2.5 py-1.5 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-600 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>无前置要求（国家初始战略即可直接制定）</span>
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {focusNode.prerequisites.map((pid) => {
                  const prereqNode = FOCUS_NODE_MAP.get(pid);
                  const isMet = completedFocusIds.includes(pid);
                  return (
                    <button
                      key={pid}
                      type="button"
                      onClick={() => onSelectFocus(pid)}
                      className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition flex items-center gap-1.5 cursor-pointer ${
                        isMet
                          ? 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100'
                          : 'bg-rose-50 text-rose-900 border-rose-200 hover:bg-rose-100'
                      }`}
                      title="点击查看此前置国策"
                    >
                      {isMet ? (
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                      ) : (
                        <Lock className="w-3 h-3 text-rose-500 shrink-0" />
                      )}
                      <span>{prereqNode?.name || pid}</span>
                      <span className="text-[9px] opacity-75 font-normal">
                        ({isMet ? '已就绪' : '未就绪'})
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Row 4: Background Lore (1~2 lines) */}
          <div className="pt-0.5">
            <p className="text-[11px] text-slate-500 italic bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200/80 leading-relaxed line-clamp-2">
              “{focusNode.description}”
            </p>
          </div>
        </div>

        {/* Compact Footer Action */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 hover:bg-white transition cursor-pointer"
          >
            关闭
          </button>

          <div className="flex-1 flex justify-end">
            {isCompleted ? (
              <button
                type="button"
                disabled
                className="px-4 py-1.5 bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-2xs cursor-default flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
                <span>此国策已实施生效</span>
              </button>
            ) : isInProgress ? (
              <button
                type="button"
                onClick={() => onFormulate(focusNode)}
                className="px-4 py-1.5 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer flex items-center gap-1.5 animate-pulse"
              >
                <RefreshCw className="w-3.5 h-3.5 text-amber-200 animate-spin" />
                <span>国策实施中 · 点击即刻完成</span>
              </button>
            ) : isAvailable ? (
              <button
                type="button"
                disabled={isFormulating}
                onClick={() => onFormulate(focusNode)}
                className="px-5 py-2 bg-gradient-to-r from-[#b3895d] via-[#a37849] to-[#8d6235] hover:from-[#9c744a] hover:to-[#7b542c] text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-1.5 active:scale-98"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                <span>{isFormulating ? '正在颁布...' : '制定并颁布国策'}</span>
              </button>
            ) : (
              <button
                type="button"
                disabled
                className="px-4 py-1.5 bg-slate-200 text-slate-500 rounded-xl text-xs font-bold border border-slate-300 cursor-not-allowed flex items-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>前置国策未满足</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
