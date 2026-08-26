import React from 'react';
import { X, RotateCcw, SlidersHorizontal, Check } from 'lucide-react';

interface NationFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRegime: string;
  onRegimeChange: (regime: string) => void;
  selectedIdeology: string;
  onIdeologyChange: (ideology: string) => void;
  totalResultsCount?: number;
  onReset: () => void;
}

const REGIME_OPTIONS: { label: string; value: string }[] = [
  { label: '全部政体', value: 'all' },
  { label: '君主立宪制', value: '君主立宪制' },
  { label: '联邦共和制', value: '联邦共和制' },
  { label: '宪政联邦共和制', value: '宪政联邦共和制' },
  { label: '民主议会制', value: '民主议会制' },
  { label: '封建帝国', value: '封建帝国' },
  { label: '军政府', value: '军政府/军国主义' },
  { label: '神权政体', value: '神权政体' },
  { label: '自由城邦', value: '自由城邦自治' },
  { label: '苏维埃代表制', value: '苏维埃代表制' },
  { label: '其他政体', value: '其他特殊政体' },
];

const IDEOLOGY_OPTIONS: { label: string; value: string }[] = [
  { label: '全部意识形态', value: 'all' },
  { label: '中立和平主义', value: '中立和平主义' },
  { label: '自由民主主义', value: '自由民主主义' },
  { label: '扩张威权主义', value: '扩张威权主义' },
  { label: '社群社会主义', value: '社群社会主义' },
  { label: '民族传统主义', value: '民族传统主义' },
  { label: '重商资本主义', value: '重商资本主义' },
  { label: '科技理性主义', value: '科技理性主义' },
  { label: '激进军国主义', value: '激进军国主义' },
];

export const NationFilterDrawer: React.FC<NationFilterDrawerProps> = ({
  isOpen,
  onClose,
  selectedRegime,
  onRegimeChange,
  selectedIdeology,
  onIdeologyChange,
  totalResultsCount,
  onReset,
}) => {
  if (!isOpen) return null;

  const hasActiveFilters = selectedRegime !== 'all' || selectedIdeology !== 'all';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Container (Bottom Sheet on Mobile, Centered Card on Desktop) */}
      <div
        className="relative w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden z-10 max-h-[85vh] flex flex-col animate-slideUp sm:animate-fadeIn"
        role="dialog"
        aria-modal="true"
        aria-label="国家筛选"
      >
        {/* Mobile Drag Indicator */}
        <div className="w-full flex items-center justify-center pt-2.5 pb-1 sm:hidden">
          <div className="w-10 h-1 bg-slate-300 rounded-full" />
        </div>

        {/* Drawer Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              国家条件筛选
            </h2>
            {hasActiveFilters && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-medium border border-indigo-100">
                已激活
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={onReset}
                className="text-xs text-slate-500 hover:text-indigo-600 transition-colors flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>重置</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="关闭"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Drawer Scrollable Content */}
        <div className="p-5 space-y-5 overflow-y-auto flex-1 text-slate-800">
          {/* 1. Regime Filter Chips */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                国家政体
              </span>
              {selectedRegime !== 'all' && (
                <button
                  type="button"
                  onClick={() => onRegimeChange('all')}
                  className="text-[11px] text-indigo-600 hover:underline cursor-pointer"
                >
                  重置全部
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {REGIME_OPTIONS.map((item) => {
                const isSelected = selectedRegime === item.value;
                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => onRegimeChange(item.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-2xs font-semibold'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Ideology Filter Chips */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                意识形态
              </span>
              {selectedIdeology !== 'all' && (
                <button
                  type="button"
                  onClick={() => onIdeologyChange('all')}
                  className="text-[11px] text-indigo-600 hover:underline cursor-pointer"
                >
                  重置全部
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {IDEOLOGY_OPTIONS.map((item) => {
                const isSelected = selectedIdeology === item.value;
                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => onIdeologyChange(item.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-2xs font-semibold'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Drawer Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-500 font-medium">
            {typeof totalResultsCount === 'number' ? (
              <span>符合条件国家：{totalResultsCount} 个</span>
            ) : (
              <span>点击确定应用筛选</span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            完成筛选
          </button>
        </div>
      </div>
    </div>
  );
};
