import { TikTokIcon } from './TikTokIcon';
import React, { useState, useRef } from 'react';
import { X, ShieldCheck, Lock, Heart, Sparkles, Upload, Image as ImageIcon, Check, UserCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const PRESET_AVATARS = [
 { emoji: '👑', label: '统御帝王' },
 { emoji: '🦅', label: '苍鹰统帅' },
 { emoji: '🛡️', label: '坚盾卫士' },
 { emoji: '⚔️', label: '先锋战将' },
 { emoji: '♟️', label: '地缘棋圣' },
 { emoji: '🎖️', label: '铁血元帅' },
 { emoji: '🦁', label: '狂狮霸主' },
 { emoji: '⚡', label: '雷霆迅击' },
 { emoji: '🐉', label: '华夏神龙' },
 { emoji: '⚓', label: '远洋提督' },
];

const PRESET_COLORS = [
 '#4f46e5', // Indigo
 '#0284c7', // Sky blue
 '#059669', // Emerald
 '#d97706', // Amber
 '#dc2626', // Crimson
 '#7c3aed', // Purple
 '#db2777', // Pink
 '#334155', // Slate
];

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
 
 // Avatar State for Registration
 const [avatarTab, setAvatarTab] = useState<'preset' | 'upload'>('preset');
 const [selectedEmoji, setSelectedEmoji] = useState('👑');
 const [selectedColor, setSelectedColor] = useState('#4f46e5');
 const [uploadedAvatarUrl, setUploadedAvatarUrl] = useState<string | null>(null);
 const fileInputRef = useRef<HTMLInputElement>(null);

 const [error, setError] = useState<string | null>(null);
 const [isLoading, setIsLoading] = useState(false);

 if (!isOpen) return null;

 const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) {
   setError('请选择有效的图片文件');
   return;
  }
  if (file.size > 2 * 1024 * 1024) {
   setError('头像图片不能超过 2MB');
   return;
  }

  const reader = new FileReader();
  reader.onload = () => {
   setUploadedAvatarUrl(reader.result as string);
   setAvatarTab('upload');
   setError(null);
  };
  reader.readAsDataURL(file);
 };

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
    
    // Avatar data
    const avatarData = {
     avatarColor: selectedColor,
     avatarUrl: avatarTab === 'upload' && uploadedAvatarUrl ? uploadedAvatarUrl : undefined,
     avatarEmoji: avatarTab === 'preset' ? selectedEmoji : undefined,
    };

    await register(cleanDouyin, password, cleanDouyin, isLingyuBaby, adminPassword, avatarData);
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

      {/* Avatar Selection (Required on Register) */}
      {mode === 'register' && (
       <div className="p-3 bg-slate-50/90 border border-slate-200/90 rounded-xl space-y-2.5">
        <div className="flex items-center justify-between">
         <label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
          <UserCircle className="w-3.5 h-3.5 text-indigo-600" />
          <span>领袖账号头像</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 font-medium">必填</span>
         </label>
         <div className="flex items-center gap-1 bg-slate-200/70 p-0.5 rounded-lg text-[11px]">
          <button
           type="button"
           onClick={() => setAvatarTab('preset')}
           className={`px-2 py-0.5 rounded-md font-medium transition cursor-pointer ${
            avatarTab === 'preset' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
           }`}
          >
           预设徽记
          </button>
          <button
           type="button"
           onClick={() => {
            setAvatarTab('upload');
            if (!uploadedAvatarUrl) {
             fileInputRef.current?.click();
            }
           }}
           className={`px-2 py-0.5 rounded-md font-medium transition cursor-pointer ${
            avatarTab === 'upload' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
           }`}
          >
           上传头像
          </button>
         </div>
        </div>

        {/* Live Avatar Preview */}
        <div className="flex items-center gap-3">
         <div
          className="w-12 h-12 rounded-full flex items-center justify-center shadow-xs border-2 border-white ring-2 ring-indigo-200 overflow-hidden flex-shrink-0"
          style={{ backgroundColor: avatarTab === 'preset' ? selectedColor : '#f1f5f9' }}
         >
          {avatarTab === 'upload' && uploadedAvatarUrl ? (
           <img src={uploadedAvatarUrl} alt="Uploaded Avatar" className="w-full h-full object-cover" />
          ) : (
           <span className="text-xl select-none">{selectedEmoji}</span>
          )}
         </div>

         <div className="flex-1 min-w-0">
          {avatarTab === 'preset' ? (
           <div>
            <div className="text-[11px] text-slate-500 mb-1.5">选择徽记与主题色：</div>
            {/* Emojis */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 mb-1.5 scrollbar-none">
             {PRESET_AVATARS.map((item) => (
              <button
               key={item.emoji}
               type="button"
               title={item.label}
               onClick={() => setSelectedEmoji(item.emoji)}
               className={`w-7 h-7 flex-shrink-0 rounded-lg flex items-center justify-center text-sm transition cursor-pointer border ${
                selectedEmoji === item.emoji
                 ? 'bg-white border-indigo-500 shadow-xs ring-1 ring-indigo-400 scale-110'
                 : 'bg-white/80 border-slate-200 hover:bg-white text-slate-700'
               }`}
              >
               {item.emoji}
              </button>
             ))}
            </div>

            {/* Colors */}
            <div className="flex items-center gap-1.5">
             {PRESET_COLORS.map((c) => (
              <button
               key={c}
               type="button"
               onClick={() => setSelectedColor(c)}
               className={`w-4 h-4 rounded-full transition cursor-pointer flex items-center justify-center ${
                selectedColor === c ? 'ring-2 ring-offset-1 ring-slate-800 scale-110' : 'hover:opacity-80'
               }`}
               style={{ backgroundColor: c }}
              >
               {selectedColor === c && <Check className="w-2.5 h-2.5 text-white" />}
              </button>
             ))}
            </div>
           </div>
          ) : (
           <div className="space-y-1.5">
            <input
             ref={fileInputRef}
             type="file"
             accept="image/*"
             className="hidden"
             onChange={handleFileUpload}
            />
            <button
             type="button"
             onClick={() => fileInputRef.current?.click()}
             className="w-full py-1.5 px-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
            >
             <Upload className="w-3.5 h-3.5 text-indigo-600" />
             <span>{uploadedAvatarUrl ? '更换本地图片' : '点击上传自定义头像'}</span>
            </button>
            <p className="text-[10px] text-slate-400">支持 JPG、PNG 格式（小于 2MB）</p>
           </div>
          )}
         </div>
        </div>
       </div>
      )}

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

