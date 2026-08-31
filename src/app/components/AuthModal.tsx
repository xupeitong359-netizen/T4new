import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MorphIcon } from 'morphicons/react';
import {
  Eye,
  EyeOff,
  Heart,
  Check,
  X,
  ArrowLeft,
  ArrowRight,
  Upload,
  Plus,
  Lock,
  Unlock,
  Globe,
  Sparkles,
  Loader2,
} from 'lucide';
import { useAuth } from '../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'register';
}

// Precision monoline Douyin icon node conforming to Lucide 24x24 geometry
const DouyinIconNode = [
  ['path', { d: 'M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5' }],
] as const;

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultMode = 'register',
}) => {
  const { login, register, quickGuestLogin } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>(defaultMode);
  const [douyinName, setDouyinName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Focus & hover states for spring-driven MorphIcon micro-interactions
  const [focusedField, setFocusedField] = useState<'douyin' | 'password' | null>(null);
  const [isCloseHovered, setIsCloseHovered] = useState(false);

  // Avatar Upload States with MorphIcon transitions (Plus -> Upload -> Loader2 -> Check)
  const [uploadedAvatarUrl, setUploadedAvatarUrl] = useState<string | null>(null);
  const [avatarHover, setAvatarHover] = useState(false);
  const [isAvatarProcessing, setIsAvatarProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Inline Identity Confirmation ("这是你的账号吗？" -> Heart / Check / X)
  const [identityChoice, setIdentityChoice] = useState<'yes' | 'no' | null>(null);
  const [adminPassword, setAdminPassword] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  // Determine active icon for Avatar Slot
  const currentAvatarIcon = uploadedAvatarUrl
    ? Check
    : isAvatarProcessing
    ? Loader2
    : avatarHover
    ? Upload
    : Plus;

  // Determine active icon for Identity Verification inline widget
  const currentIdentityIcon =
    identityChoice === 'yes' ? Check : identityChoice === 'no' ? X : Heart;

  // Determine active icon for Submit CTA button
  const currentSubmitIcon = isSuccess ? Check : isLoading ? Loader2 : ArrowRight;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('请选择有效的图片格式');
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setError('头像大小不能超过 3MB');
      return;
    }

    setIsAvatarProcessing(true);
    const reader = new FileReader();
    reader.onload = () => {
      setTimeout(() => {
        setUploadedAvatarUrl(reader.result as string);
        setIsAvatarProcessing(false);
        setError(null);
      }, 150);
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
          setError('请填写抖音用户名和登录密码');
          setIsLoading(false);
          return;
        }

        const isLingyu = identityChoice === 'yes';
        const avatarData = {
          avatarUrl: uploadedAvatarUrl || undefined,
        };

        await register(
          cleanDouyin,
          password,
          cleanDouyin,
          isLingyu,
          isLingyu && adminPassword.trim() ? adminPassword.trim() : undefined,
          avatarData
        );
      }
      setIsSuccess(true);
      setTimeout(() => {
        onClose();
      }, 350);
    } catch (err: any) {
      setError(err.message || '操作失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 select-none">
        {/* Backdrop */}
        <motion.div
          id="auth-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/35 backdrop-blur-sm cursor-pointer"
        />

        {/* Modal Window Container */}
        <motion.div
          id="auth-modal-container"
          role="dialog"
          aria-modal="true"
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={{ type: 'spring', damping: 28, stiffness: 360, mass: 0.8 }}
          className="relative w-full max-w-[390px] sm:max-w-[410px] bg-white border border-slate-200/90 rounded-[22px] shadow-[0_16px_44px_-12px_rgba(15,23,42,0.12),0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden text-slate-800"
        >
          {/* Top 1px precision hairline accent */}
          <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-[#5B4BFF]/40 to-transparent" />

          {/* Morphicons Close/Back Button (X <-> ArrowLeft morph on hover) */}
          <button
            id="auth-modal-close-btn"
            type="button"
            onClick={onClose}
            onMouseEnter={() => setIsCloseHovered(true)}
            onMouseLeave={() => setIsCloseHovered(false)}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100/80 transition-colors cursor-pointer"
            aria-label="关闭"
          >
            <MorphIcon
              icon={isCloseHovered ? ArrowLeft : X}
              spring="snappy"
              size={16}
              strokeWidth={1.75}
              color="currentColor"
            />
          </button>

          <div className="px-6 pt-6 pb-5 sm:px-7 sm:pt-7 sm:pb-6">
            {/* Header: Geometric Emblem + Editorial Title */}
            <div className="text-center mb-5">
              <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 350, damping: 24, delay: 0.05 }}
                className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-slate-50 text-[#5B4BFF] mb-2.5 border border-slate-200/80"
              >
                <MorphIcon
                  icon={Globe}
                  spring="snappy"
                  size={20}
                  strokeWidth={1.75}
                  color="#5B4BFF"
                />
              </motion.div>

              <h2 className="text-xl font-bold text-slate-900 tracking-tight leading-snug">
                {mode === 'register' ? '建立你的国家' : '返回你的国家'}
              </h2>
              <p className="text-xs text-slate-500 mt-1 font-normal">
                {mode === 'register' ? '使用抖音账号继续' : '使用抖音账号登录'}
              </p>
            </div>

            {/* Error Notice */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -4, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -4, height: 0 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  className="mb-3.5 px-3 py-2 bg-rose-50/90 border border-rose-200/80 rounded-xl text-xs text-rose-600 font-medium flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                  <span className="flex-1 text-left">{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* 1. Douyin Username */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5 text-left">
                  抖音用户名
                </label>
                <div
                  className={`relative flex items-center h-[50px] bg-slate-50/70 border rounded-xl transition-all duration-200 ${
                    focusedField === 'douyin'
                      ? 'border-[#5B4BFF] bg-white ring-2 ring-[#5B4BFF]/10'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div
                    className={`pl-3.5 pr-2.5 flex items-center pointer-events-none transition-colors duration-200 ${
                      focusedField === 'douyin' ? 'text-[#5B4BFF]' : 'text-slate-400'
                    }`}
                  >
                    <MorphIcon
                      icon={DouyinIconNode}
                      spring="snappy"
                      size={16}
                      strokeWidth={1.75}
                      color="currentColor"
                    />
                  </div>
                  <input
                    id="auth-input-douyin"
                    type="text"
                    required
                    value={douyinName}
                    onFocus={() => setFocusedField('douyin')}
                    onBlur={() => setFocusedField(null)}
                    onChange={(e) => setDouyinName(e.target.value)}
                    placeholder="@ 请输入抖音用户名"
                    className="w-full h-full pr-3.5 bg-transparent text-sm text-slate-900 placeholder-slate-400 focus:outline-none font-normal"
                  />
                </div>
              </div>

              {/* 2. Password (with MorphIcon Lock <-> Unlock & Eye <-> EyeOff) */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5 text-left">
                  登录密码
                </label>
                <div
                  className={`relative flex items-center h-[50px] bg-slate-50/70 border rounded-xl transition-all duration-200 ${
                    focusedField === 'password'
                      ? 'border-[#5B4BFF] bg-white ring-2 ring-[#5B4BFF]/10'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Morphing Lock <-> Unlock based on focus / entry */}
                  <div
                    className={`pl-3.5 pr-2.5 flex items-center pointer-events-none transition-colors duration-200 ${
                      focusedField === 'password' || password.length > 0
                        ? 'text-[#5B4BFF]'
                        : 'text-slate-400'
                    }`}
                  >
                    <MorphIcon
                      icon={focusedField === 'password' || password.length > 0 ? Unlock : Lock}
                      spring="snappy"
                      size={16}
                      strokeWidth={1.75}
                      color="currentColor"
                    />
                  </div>

                  <input
                    id="auth-input-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="请输入登录密码"
                    className="w-full h-full pr-10 bg-transparent text-sm text-slate-900 placeholder-slate-400 focus:outline-none font-normal"
                  />

                  {/* Morphing Eye <-> EyeOff Toggle */}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-0 pr-3.5 h-full flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    title={showPassword ? '隐藏密码' : '显示密码'}
                  >
                    <MorphIcon
                      icon={showPassword ? EyeOff : Eye}
                      spring="snappy"
                      size={16}
                      strokeWidth={1.75}
                      color="currentColor"
                    />
                  </button>
                </div>
              </div>

              {/* 3. Avatar Slot (Register Mode Only) with MorphIcon Plus -> Upload -> Check */}
              {mode === 'register' && (
                <div className="pt-0.5 pb-0.5">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onMouseEnter={() => setAvatarHover(true)}
                    onMouseLeave={() => setAvatarHover(false)}
                    className="group flex items-center gap-3 p-1.5 rounded-xl hover:bg-slate-50/90 border border-transparent hover:border-slate-200/80 transition-all cursor-pointer"
                  >
                    {/* Morphing Icon Avatar Slot */}
                    <div
                      className={`w-9 h-9 rounded-full border border-dashed flex items-center justify-center overflow-hidden shrink-0 transition-colors ${
                        uploadedAvatarUrl
                          ? 'border-emerald-400 bg-emerald-50 text-emerald-600'
                          : avatarHover
                          ? 'border-[#5B4BFF] bg-[#5B4BFF]/5 text-[#5B4BFF]'
                          : 'border-slate-300 bg-slate-50 text-slate-400'
                      }`}
                    >
                      {uploadedAvatarUrl ? (
                        <img
                          src={uploadedAvatarUrl}
                          alt="Avatar Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <MorphIcon
                          icon={currentAvatarIcon}
                          spring="snappy"
                          size={16}
                          strokeWidth={1.75}
                          color="currentColor"
                        />
                      )}
                    </div>

                    {/* Metadata & Actions */}
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-slate-700 group-hover:text-[#5B4BFF] transition-colors">
                          {uploadedAvatarUrl ? '已选择领袖头像' : '上传领袖头像'}
                        </span>
                        {uploadedAvatarUrl && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setUploadedAvatarUrl(null);
                              if (fileInputRef.current) fileInputRef.current.value = '';
                            }}
                            className="text-[10px] text-rose-500 hover:text-rose-600 hover:underline cursor-pointer"
                          >
                            清除
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">可选 · JPG / PNG / WEBP</p>
                    </div>
                  </div>
                </div>
              )}

              {/* 4. Precision Inline Identity Control ("这是你的账号吗？" -> Heart <-> Check / X) */}
              {mode === 'register' && (
                <div className="p-2.5 bg-slate-50/80 border border-slate-200/70 rounded-xl space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`transition-colors duration-200 ${
                          identityChoice === 'yes'
                            ? 'text-[#5B4BFF]'
                            : identityChoice === 'no'
                            ? 'text-slate-400'
                            : 'text-pink-500'
                        }`}
                      >
                        <MorphIcon
                          icon={currentIdentityIcon}
                          spring="snappy"
                          size={15}
                          strokeWidth={1.75}
                          color="currentColor"
                        />
                      </div>
                      <span className="text-xs text-slate-700 font-medium truncate">
                        这是你的账号吗？
                      </span>
                    </div>

                    <div className="flex items-center bg-white border border-slate-200/90 rounded-lg p-0.5 shadow-[0_1px_2px_rgba(0,0,0,0.02)] shrink-0">
                      <button
                        type="button"
                        onClick={() => setIdentityChoice(identityChoice === 'yes' ? null : 'yes')}
                        className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all cursor-pointer ${
                          identityChoice === 'yes'
                            ? 'bg-[#5B4BFF] text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                      >
                        是
                      </button>
                      <button
                        type="button"
                        onClick={() => setIdentityChoice(identityChoice === 'no' ? null : 'no')}
                        className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all cursor-pointer ${
                          identityChoice === 'no'
                            ? 'bg-slate-800 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                      >
                        不是
                      </button>
                    </div>
                  </div>

                  {/* Optional Admin Passcode when "是" is selected */}
                  <AnimatePresence>
                    {identityChoice === 'yes' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.18, ease: 'easeOut' }}
                        className="pt-1.5"
                      >
                        <input
                          type="password"
                          value={adminPassword}
                          onChange={(e) => setAdminPassword(e.target.value)}
                          placeholder="领袖验证口令（非必填）"
                          className="w-full h-8 px-2.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#5B4BFF]"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* 5. Primary CTA with MorphIcon (ArrowRight -> Loader2 -> Check) */}
              <motion.button
                id="auth-submit-btn"
                type="submit"
                disabled={isLoading}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.985 }}
                transition={{ type: 'spring', stiffness: 450, damping: 25 }}
                className="w-full h-[50px] mt-2 bg-[#5B4BFF] hover:bg-[#4E3EFF] text-white font-medium rounded-xl text-sm shadow-[0_2px_8px_rgba(91,75,255,0.25)] hover:shadow-[0_4px_14px_rgba(91,75,255,0.35)] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                <span>{mode === 'register' ? '注册并建立国家' : '登录国家终端'}</span>
                <MorphIcon
                  icon={currentSubmitIcon}
                  spring="snappy"
                  size={16}
                  strokeWidth={2}
                  color="#ffffff"
                />
              </motion.button>
            </form>

            {/* Subtle Divider */}
            <div className="relative my-3.5 flex items-center justify-center">
              <div className="w-full border-t border-slate-100" />
              <span className="absolute bg-white px-2.5 text-[11px] text-slate-400 select-none">
                或者
              </span>
            </div>

            {/* Secondary Trial Quick Entry (Sparkles) */}
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
              className="w-full py-2.5 bg-slate-50/80 hover:bg-slate-100 active:bg-slate-150 text-slate-600 hover:text-slate-900 text-xs font-medium rounded-xl border border-slate-200/70 transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <MorphIcon
                icon={Sparkles}
                spring="snappy"
                size={14}
                strokeWidth={1.75}
                color="#5B4BFF"
              />
              <span>直接体验，不创建账号</span>
            </button>

            {/* Bottom Switch Link */}
            <div className="mt-3.5 text-center">
              {mode === 'register' ? (
                <p className="text-xs text-slate-400">
                  已有账号？
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setError(null);
                    }}
                    className="text-[#5B4BFF] hover:text-[#4E3EFF] font-semibold cursor-pointer underline-offset-2 hover:underline ml-1"
                  >
                    登录
                  </button>
                </p>
              ) : (
                <p className="text-xs text-slate-400">
                  还没有账号？
                  <button
                    type="button"
                    onClick={() => {
                      setMode('register');
                      setError(null);
                    }}
                    className="text-[#5B4BFF] hover:text-[#4E3EFF] font-semibold cursor-pointer underline-offset-2 hover:underline ml-1"
                  >
                    注册
                  </button>
                </p>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
