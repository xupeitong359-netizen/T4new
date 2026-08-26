import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
 isOpen: boolean;
 title: string;
 message: string;
 confirmText?: string;
 cancelText?: string;
 isDangerous?: boolean;
 onConfirm: () => void;
 onCancel: () => void;
 isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
 isOpen,
 title,
 message,
 confirmText = '确定',
 cancelText = '取消',
 isDangerous = false,
 onConfirm,
 onCancel,
 isLoading = false,
}) => {
 if (!isOpen) return null;

 return (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
   <div
    id="confirm-modal-box"
    className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden p-6 relative text-slate-900"
   >
    <button
     id="confirm-modal-close-btn"
     onClick={onCancel}
     className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition"
    >
     <X className="w-5 h-5" />
    </button>

    <div className="flex items-start gap-4 mb-4">
     <div
      className={`p-3 rounded-2xl flex-shrink-0 ${
       isDangerous
        ? 'bg-rose-50 text-rose-600'
        : 'bg-amber-50 text-amber-600'
      }`}
     >
      <AlertTriangle className="w-6 h-6" />
     </div>
     <div>
      <h3 className="text-lg font-bold text-slate-900">{title}</h3>
      <p className="mt-1.5 text-sm text-slate-500 leading-relaxed">{message}</p>
     </div>
    </div>

    {isDangerous && (
     <div className="mb-5 px-4 py-3 bg-rose-50 border border-rose-100 rounded-2xl text-xs text-rose-600 font-medium">
       警告：此项属于重大地缘决策（危险操作），执行后将对国家局势产生直接且不可逆的影响！
     </div>
    )}

    <div className="flex items-center justify-end gap-3 pt-2">
     <button
      id="confirm-modal-cancel-btn"
      type="button"
      onClick={onCancel}
      disabled={isLoading}
      className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 transition"
     >
      {cancelText}
     </button>
     <button
      id="confirm-modal-action-btn"
      type="button"
      onClick={onConfirm}
      disabled={isLoading}
      className={`px-5 py-2 text-sm font-semibold rounded-xl transition flex items-center gap-2 ${
       isDangerous
        ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/20'
        : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20'
      } ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
     >
      {isLoading && (
       <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      )}
      {confirmText}
     </button>
    </div>
   </div>
  </div>
 );
};
