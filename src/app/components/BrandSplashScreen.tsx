import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface BrandSplashScreenProps {
  isLoading: boolean;
  onFinish?: () => void;
}

export const BrandSplashScreen: React.FC<BrandSplashScreenProps> = ({
  isLoading,
  onFinish,
}) => {
  const [progress, setProgress] = useState(15);
  const [shouldRender, setShouldRender] = useState(true);

  useEffect(() => {
    // Smooth progress simulation while loading
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return prev;
        const jump = Math.floor(Math.random() * 15) + 5;
        return Math.min(prev + jump, 95);
      });
    }, 180);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isLoading) {
      setProgress(100);
      const timer = setTimeout(() => {
        setShouldRender(false);
        if (onFinish) onFinish();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isLoading, onFinish]);

  if (!shouldRender) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="brand-splash-screen"
        initial={{ opacity: 1 }}
        animate={{ opacity: 1 }}
        exit={{
          opacity: 0,
          scale: 1.03,
          filter: 'blur(4px)',
          transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
        }}
        className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center select-none overflow-hidden"
      >
        {/* Ambient Subtle Glow */}
        <div className="absolute w-[420px] h-[420px] bg-[#5B4BFF]/5 rounded-full blur-3xl pointer-events-none" />

        {/* Central Brand Unit */}
        <div className="relative flex flex-col items-center text-center px-6 z-10">
          {/* Direct Raw Trademark Logo without any modification or borders */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: 'spring', damping: 24, stiffness: 320, mass: 0.9 }}
            className="relative mb-6 flex items-center justify-center"
          >
            <img
              src="/Tm.png"
              alt="商标"
              className="w-36 h-36 sm:w-44 sm:h-44 object-contain select-none drop-shadow-none"
              draggable={false}
            />
          </motion.div>

          {/* Trademark Title & Version */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.35, ease: 'easeOut' }}
            className="flex items-center justify-center gap-2.5 mb-6"
          >
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>T3.0测试版本</span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#5B4BFF] shadow-[0_0_8px_rgba(91,75,255,0.6)] animate-pulse" />
            </h1>
          </motion.div>

          {/* Progress Bar & Status */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25, duration: 0.3 }}
            className="w-56 sm:w-64 flex flex-col items-center"
          >
            {/* Precision Loading Track */}
            <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
              <motion.div
                className="h-full bg-[#5B4BFF] rounded-full"
                animate={{ width: `${progress}%` }}
                transition={{ ease: 'easeOut', duration: 0.2 }}
              />
            </div>

            {/* Subtext */}
            <div className="mt-3 flex items-center justify-between w-full text-[11px] font-mono text-slate-400">
              <span>国家终端档案载入中</span>
              <span className="tabular-nums font-semibold text-slate-600">{progress}%</span>
            </div>
          </motion.div>
        </div>

        {/* Footer Sub-indicator */}
        <div className="absolute bottom-8 text-[11px] text-slate-400 font-mono tracking-widest uppercase">
          NATIONAL OPERATIONAL NETWORK
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
