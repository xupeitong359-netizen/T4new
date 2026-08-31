import React, { useState } from 'react';
import { X, ShieldAlert, Lock, CheckCircle2, ShieldCheck, KeyRound, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import confetti from 'canvas-confetti';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (msg: string) => void;
}

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { isAdmin, verifyAdminPassword, toggleAdminRole, user } = useAuth();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('请输入管理员密码');
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      const msg = await verifyAdminPassword(password.trim());
      setSuccessNotice(msg);
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
      if (onSuccess) onSuccess(msg);
      setTimeout(() => {
        onClose();
        setPassword('');
        setSuccessNotice(null);
      }, 1200);
    } catch (err: any) {
      setError(err.message || '管理员密码错误，请重新输入');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleOff = async () => {
    try {
      await toggleAdminRole();
      onClose();
    } catch (err: any) {
      setError(err.message || '操作失败');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
      <div
        id="admin-auth-modal-container"
        className="w-full max-w-[400px] bg-white border border-slate-200/90 rounded-2xl shadow-2xl overflow-hidden relative text-slate-800"
      >
        {/* Top Decorative Amber/Indigo Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-500" />

        {/* Close Button */}
        <button
          id="admin-modal-close-btn"
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          aria-label="关闭"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="px-6 pt-6 pb-6 sm:px-7 sm:pt-7 sm:pb-7">
          {/* Header */}
          <div className="text-center mb-5">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-100 text-indigo-600 mb-3 border border-indigo-100 shadow-xs">
              <ShieldAlert className="w-6 h-6 text-indigo-600" />
            </div>
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-[11px] font-mono font-semibold text-slate-600 mb-1">
              <span>T3.0测试版本</span>
              <span className="text-indigo-600">· 管理员入口</span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
              中央控制台 · 管理员授权
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              请输入最高指挥密钥以解锁全局沙盘与国家管理权限
            </p>
          </div>

          {/* Success notice */}
          {successNotice && (
            <div className="mb-4 px-3.5 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 font-semibold flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{successNotice}</span>
            </div>
          )}

          {/* Error notice */}
          {error && (
            <div className="mb-4 px-3.5 py-2.5 bg-rose-50 border border-rose-200/80 rounded-xl text-xs text-rose-600 font-medium flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* If already Admin */}
          {isAdmin ? (
            <div className="space-y-4">
              <div className="p-3.5 bg-emerald-50/80 border border-emerald-200/80 rounded-xl flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-emerald-900">
                    当前账号已具备管理员权限
                  </div>
                  <div className="text-[11px] text-emerald-700 mt-0.5">
                    已激活全沙盘国家管理、科技全开及全局广播特权。
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleToggleOff}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition cursor-pointer"
                >
                  切回普通玩家
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer"
                >
                  保持并关闭
                </button>
              </div>
            </div>
          ) : (
            /* Admin Password Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  管理员密码
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="w-4 h-4 text-indigo-500" />
                  </div>
                  <input
                    id="admin-auth-input"
                    type="password"
                    autoFocus
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="请输入管理员密码"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-500/15 transition font-mono"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  提示：通过验证后将立即自动授予管理员最高权限。
                </p>
              </div>

              <button
                id="admin-auth-submit-btn"
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 active:opacity-90 text-white font-semibold rounded-xl text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isLoading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>验证并激活管理员权限</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
