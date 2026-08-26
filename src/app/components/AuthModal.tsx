import { TikTokIcon } from './TikTokIcon';
import React, { useState } from 'react';
import { X, ShieldCheck, Lock, Heart, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AuthModalProps {
 isOpen: boolean;
 onClose: () => void;
 defaultMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
 isOpen,
 onClose,
 defaultMode = 'register',
}) => {
 const { login, register, quickGuestLogin } = useAuth();
 const [mode, setMode] = useState<'login' | 'register'>(defaultMode);
 const [douyinName, setDouyinName] = useState('');
 const [password, setPassword] = useState('');
 const [isLingyuBaby, setIsLingyuBaby] = useState(false);
 const [adminPassword, setAdminPassword] = useState('');
 const [error, setError] = useState<string | null>(null);
 const [isLoading, setIsLoading] = useState(false);

 if (!isOpen) return null;

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError(null);
  setIsLoading(true);

  try {
   const cleanDouyin = douyinName.trim();
   if (mode === 'login') {
    if (!cleanDouyin || !password) {
     setError('请输入抖音用户名和密码');
     setIsLoading(false);
     return;
    }
    await login(cleanDouyin, password);
   } else {
    if (!cleanDouyin || !password) {
     setError('请填写抖音用户名和密码');
     setIsLoading(false);
     return;
    }
    await register(cleanDouyin, password, cleanDouyin, isLingyuBaby, adminPassword);
   }
   onClose();
  } catch (err: any) {
   setError(err.message || '操作失败，请重试');
  } finally {
   setIsLoading(false);
  }
 };

 return (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
   <div
    id="auth-modal-container"
    className="w-full max-w-[420px] bg-white border border-slate-200/90 rounded-2xl shadow-xl overflow-hidden relative text-slate-800"
   >
    <button
     id="auth-modal-close-btn"
     onClick={onClose}
     className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
     aria-label="关闭"
    >
     <X className="w-4 h-4" />
    </button>

    <div className="px-6 pt-7 pb-6 sm:px-7 sm:pt-8 sm:pb-7">
     {/* Header */}
     <div className="text-center mb-6">
      <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-slate-100 text-indigo-600 mb-3 border border-slate-200/60 shadow-2xs">
       <ShieldCheck className="w-5 h-5" />
      </div>
      <h2 className="text-xl font-bold text-slate-900 tracking-tight">
       {mode === 'login' ? '抖音账号登录' : '抖音账号注册'}
      </h2>
      <p className="text-xs text-slate-500 mt-1">
       {mode === 'login'
        ? '输入您的抖音用户名与密码返回地缘沙盘'
        : '绑定抖音用户名，建立属于你的国家。'}
      </p>
     </div>

     {error && (
      <div className="mb-4 px-3.5 py-2.5 bg-rose-50 border border-rose-200/80 rounded-xl text-xs text-rose-600 font-medium flex items-center gap-2">
       <span className="w-1.5 h-1.5 rounded-full bg-rose-500 flex-shrink-0" />
       <span>{error}</span>
      </div>
     )}

     <form onSubmit={handleSubmit} className="space-y-4">
      {/* Douyin Username */}
      <div>
       <label className="block text-xs font-semibold text-slate-700 mb-1.5">
        抖音用户名 <span className="text-slate-400 font-normal text-[11px] ml-1">(无需邮箱)</span>
       </label>
       <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
         <TikTokIcon className="w-4 h-4 text-slate-700" />
        </div>
        <input
         id="auth-input-douyin"
         type="text"
         required
         value={douyinName}
         onChange={(e) => setDouyinName(e.target.value)}
         placeholder={mode === 'login' ? '请输入您的抖音用户名' : '例如：大玲玉之光_Official'}
         className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-500/15 transition"
        />
       </div>
      </div>

      {/* Password */}
      <div>
       <label className="block text-xs font-semibold text-slate-700 mb-1.5">
        登录密码
       </label>
       <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
         <Lock className="w-4 h-4" />
        </div>
        <input
         id="auth-input-password"
         type="password"
         required
         value={password}
         onChange={(e) => setPassword(e.target.value)}
         placeholder={mode === 'login' ? '请输入密码' : '设置至少 4 位登录密码'}
         className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-500/15 transition"
        />
       </div>
      </div>

      {/* Easter Egg: Lingyu Baby */}
      {mode === 'register' && (
       <div className="pt-0.5">
        <div className="p-3 bg-slate-50/90 border border-slate-200/80 rounded-xl">
         <div className="text-xs font-medium text-slate-700 mb-2 flex items-center gap-1.5">
          <Heart className={`w-3.5 h-3.5 transition-colors ${isLingyuBaby ? 'text-pink-500 fill-pink-500' : 'text-slate-400'}`} />
          <span>你是不是玲玉的宝宝？</span>
         </div>

         <div className="grid grid-cols-2 gap-2">
          <button
           id="auth-lingyu-baby-yes"
           type="button"
           onClick={() => setIsLingyuBaby(true)}
           className={`py-1.5 px-3 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
            isLingyuBaby
             ? 'bg-pink-50 border-pink-300 text-pink-700 shadow-2xs font-semibold'
             : 'bg-white hover:bg-slate-100/70 text-slate-600 border-slate-200'
           }`}
          >
           <span className={isLingyuBaby ? 'text-pink-600' : 'text-slate-400'}></span>
           <span>是</span>
          </button>

          <button
           id="auth-lingyu-baby-no"
           type="button"
           onClick={() => setIsLingyuBaby(false)}
           className={`py-1.5 px-3 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
            !isLingyuBaby
             ? 'bg-slate-800 text-white border-slate-800 shadow-2xs font-semibold'
             : 'bg-white hover:bg-slate-100/70 text-slate-600 border-slate-200'
           }`}
          >
           <span className={!isLingyuBaby ? 'text-slate-300' : 'text-slate-400'}></span>
           <span>否</span>
          </button>
         </div>
        </div>
       </div>
      )}

      {mode === 'register' && (
       <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
         管理员密码 <span className="text-slate-400 font-normal text-[11px] ml-1">(可选)</span>
        </label>
        <div className="relative">
         <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
          <ShieldCheck className="w-4 h-4" />
         </div>
         <input
          id="auth-input-admin-password"
          type="password"
          value={adminPassword}
          onChange={(e) => setAdminPassword(e.target.value)}
          placeholder="输入后将授予管理员权限"
          className="w-full pl-9 pr-3.5 py-2 bg-amber-50/50 border border-amber-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/15 transition"
         />
        </div>
        <p className="mt-1.5 text-[11px] leading-4 text-slate-500">验证成功后，管理员身份将自动激活。</p>
       </div>
      )}

      {/* Main Action Button */}
      <button
       id="auth-submit-btn"
       type="submit"
       disabled={isLoading}
       className="w-full mt-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-medium rounded-xl text-sm shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
      >
       {isLoading && (
        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
       )}
       {mode === 'login' ? '登录' : '注册'}
      </button>
     </form>

     {/* Quick Demo/Guest Test Login */}
     <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
      <button
       id="auth-quick-guest-btn"
       type="button"
       disabled={isLoading}
       onClick={async () => {
        setError(null);
        setIsLoading(true);
        try {
         await quickGuestLogin();
         onClose();
        } catch (e: any) {
         setError(e.message || '快捷试玩登录失败');
        } finally {
         setIsLoading(false);
        }
       }}
       className="w-full py-2 bg-amber-50 hover:bg-amber-100 active:bg-amber-200 border border-amber-200 rounded-xl text-xs font-bold text-amber-900 flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
      >
       <Sparkles className="w-3.5 h-3.5 text-amber-600" />
       <span>一键试玩体验 (无需输入/直接进入)</span>
      </button>
     </div>

     {/* Secondary Switch Link */}
     <div className="mt-3 text-center">
      {mode === 'register' ? (
       <p className="text-xs text-slate-500">
        已有账号？{' '}
        <button
         type="button"
         onClick={() => {
          setMode('login');
          setError(null);
         }}
         className="text-indigo-600 hover:text-indigo-700 font-semibold cursor-pointer underline-offset-2 hover:underline ml-1"
        >
         登录
        </button>
       </p>
      ) : (
       <p className="text-xs text-slate-500">
        还没有账号？{' '}
        <button
         type="button"
         onClick={() => {
          setMode('register');
          setError(null);
         }}
         className="text-indigo-600 hover:text-indigo-700 font-semibold cursor-pointer underline-offset-2 hover:underline ml-1"
        >
         注册
        </button>
       </p>
      )}
     </div>
    </div>
   </div>
  </div>
 );
};

