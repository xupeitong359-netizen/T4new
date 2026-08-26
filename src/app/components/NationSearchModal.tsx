import React, { useRef, useEffect } from 'react';
import { Search, X, SlidersHorizontal, Check, RotateCcw } from 'lucide-react';

interface NationSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  totalResultsCount?: number;
}

export const NationSearchModal: React.FC<NationSearchModalProps> = ({
  isOpen,
  onClose,
  searchTerm,
  onSearchChange,
  totalResultsCount,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 sm:pt-24">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Card */}
      <div
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden z-10 animate-fadeIn"
        role="dialog"
        aria-modal="true"
        aria-label="搜索国家"
      >
        <div className="p-3 border-b border-slate-100 flex items-center gap-2">
          <Search className="w-4 h-4 text-indigo-600 ml-1.5 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="搜索国家名称、法定首都、抖音领主..."
            className="w-full py-1.5 px-2 text-sm text-slate-900 placeholder-slate-400 bg-transparent focus:outline-none"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="清空"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-2 py-1 text-xs text-slate-500 hover:text-slate-900 rounded hover:bg-slate-100 transition-colors cursor-pointer"
          >
            关闭
          </button>
        </div>

        {/* Search Helper Footer */}
        <div className="px-4 py-2.5 bg-slate-50 text-[11px] text-slate-500 flex items-center justify-between">
          <span>
            {searchTerm.trim()
              ? `匹配到 ${totalResultsCount ?? 0} 个结果`
              : '支持按国家名、领主抖音昵称、法定首都即时检索'}
          </span>
          {searchTerm.trim() && (
            <button
              type="button"
              onClick={onClose}
              className="text-indigo-600 font-semibold hover:underline cursor-pointer"
            >
              查看结果
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
