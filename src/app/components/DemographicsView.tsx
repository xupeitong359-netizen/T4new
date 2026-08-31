import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users,
  TrendingUp,
  Shield,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Info,
  Menu,
  Sparkles,
  Zap,
  Award,
  Flame,
  Check,
  Radio,
  Sliders,
  Scale,
  Crosshair,
  Flag,
} from 'lucide-react';
import { Nation } from '../types';
import { calculateNationDemographics } from '../lib/strategicCommandEngine';

interface ConscriptionLawItem {
  id: string;
  name: string;
  category: string;
  statusLabel: string;
  description: string;
  detailedEffect: string;
  metrics: {
    label: string;
    value: string;
    type: 'positive' | 'negative' | 'neutral';
  }[];
  detailedBreakdown: {
    param: string;
    effect: string;
    note: string;
  }[];
}

const CONSCRIPTION_LAWS: ConscriptionLawItem[] = [
  {
    id: 'volunteer',
    name: '志愿兵制',
    category: 'VOLUNTEER',
    statusLabel: '和平时期',
    description: '自愿参军，战力依赖经济与民心',
    detailedEffect: '维持最低限度国防开支，全体劳动力保留于民用经济与科研部门。',
    metrics: [
      { label: '人力增长', value: '+20%', type: 'positive' },
      { label: '训练速度', value: '基准', type: 'neutral' },
      { label: '民心影响', value: '+5%', type: 'positive' },
    ],
    detailedBreakdown: [
      { param: '适役动员上限', effect: '1.5% 全国人口', note: '仅招募职业志愿志愿军' },
      { param: '民用工业产能', effect: '+5.0% 效率奖励', note: '无适龄劳动力流失' },
      { param: '新兵训练周期', effect: '标准 180 天', note: '正规化精英常备军体系' },
    ],
  },
  {
    id: 'limited',
    name: '有限征募制',
    category: 'LIMITED',
    statusLabel: '有限战争时期',
    description: '有限度征募，保持国力与战力平衡，适合中小规模冲突',
    detailedEffect: '战备状态下征召适龄青年入伍，在保障战备的同时维持社会生产平衡。',
    metrics: [
      { label: '人力增长', value: '-10%', type: 'negative' },
      { label: '训练速度', value: '+10%', type: 'positive' },
      { label: '民心影响', value: '无影响', type: 'neutral' },
    ],
    detailedBreakdown: [
      { param: '适役动员上限', effect: '2.5% 全国人口', note: '满足常规常备军与预备役建制' },
      { param: '工业产能损耗', effect: '0% 基础保全', note: '严格轮替制度，不影响生产力' },
      { param: '新兵动员速度', effect: '+15% 征集提速', note: '常设地方武装部高效征收' },
    ],
  },
  {
    id: 'extensive',
    name: '广泛征募制',
    category: 'EXTENSIVE',
    statusLabel: '全面战争时期',
    description: '大规模征募，国力消耗较大，大幅提高可征召人口',
    detailedEffect: '进入全面战时体制，大幅度放宽服役年龄限制，全力保障前线兵员补给。',
    metrics: [
      { label: '人力增长', value: '-20%', type: 'negative' },
      { label: '训练速度', value: '+20%', type: 'positive' },
      { label: '民心影响', value: '-5%', type: 'negative' },
    ],
    detailedBreakdown: [
      { param: '适役动员上限', effect: '5.0% 全国人口', note: '大规模常备兵团与后备兵力' },
      { param: '工业产能损耗', effect: '-5% 民用产出', note: '部分技术劳工转入军需生产' },
      { param: '军事动员能力', effect: '+150% 兵员储备', note: '战时动员指令全面生效' },
    ],
  },
  {
    id: 'total',
    name: '全民动员',
    category: 'TOTAL_MOBILIZATION',
    statusLabel: '国家总动员',
    description: '最大化军事人力动员能力，但社会经济成本显著提高',
    detailedEffect: '生死存亡之战动员令，全国转入战时管制定向征兵，兵员动员能力达到极限。',
    metrics: [
      { label: '人力增长', value: '-30%', type: 'negative' },
      { label: '训练速度', value: '+35%', type: 'positive' },
      { label: '民心影响', value: '-15%', type: 'negative' },
    ],
    detailedBreakdown: [
      { param: '适役动员上限', effect: '10.0% 全国人口', note: '极限动员一切适龄服役人口' },
      { param: '军工优先调配', effect: '+30% 军械生产', note: '社会资源无条件向国防倾斜' },
      { param: '民生经济负荷', effect: '-15% 消费品供给', note: '战时配给制与工业重组' },
    ],
  },
];

interface DemographicsViewProps {
  nation: Nation | null;
  onNavigateTab?: (tab: string) => void;
}

export const DemographicsView: React.FC<DemographicsViewProps> = ({
  nation,
  onNavigateTab,
}) => {
  const demographics = calculateNationDemographics(nation);

  // Active conscription law state
  const [activeLawIndex, setActiveLawIndex] = useState<number>(1); // Default to '有限征募制'
  const [isDetailsExpanded, setIsDetailsExpanded] = useState<boolean>(false);
  const [showInfoModal, setShowInfoModal] = useState<boolean>(false);

  const currentLaw = CONSCRIPTION_LAWS[activeLawIndex];

  // Format large populations into 万 / 亿
  const formatPopulationDisplay = (n: number | null | undefined) => {
    const val = Number(n) || 38500000;
    if (val >= 100000000) {
      const yi = (val / 100000000).toFixed(2);
      return { number: yi, unit: '亿' };
    }
    const wan = (val / 10000).toLocaleString(undefined, {
      maximumFractionDigits: 1,
    });
    return { number: wan, unit: '万' };
  };

  const popDisplay = useMemo(
    () => formatPopulationDisplay(demographics.currentPopulation),
    [demographics.currentPopulation]
  );

  const handlePrevLaw = () => {
    setActiveLawIndex((prev) =>
      prev > 0 ? prev - 1 : CONSCRIPTION_LAWS.length - 1
    );
  };

  const handleNextLaw = () => {
    setActiveLawIndex((prev) =>
      prev < CONSCRIPTION_LAWS.length - 1 ? prev + 1 : 0
    );
  };

  return (
    <div className="w-full min-h-screen bg-slate-50/70 text-slate-900 pb-16 flex flex-col items-center">
      {/* Mobile Center Column Layout (Optimized for 390px-440px phone viewport) */}
      <div className="w-full max-w-[440px] px-3.5 sm:px-4 py-2 sm:py-3 space-y-3.5 select-none">
        
        {/* ================================================================= */}
        {/* TOP BAR / HEADER                                                  */}
        {/* ================================================================= */}
        <header className="flex items-center justify-between py-2 px-1">
          {/* Left: Hamburger menu button */}
          <button
            type="button"
            onClick={() => onNavigateTab && onNavigateTab('overview')}
            className="w-10 h-10 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:bg-slate-50 active:scale-95 transition-all flex items-center justify-center text-slate-800 cursor-pointer"
            title="导航菜单"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Center: Title & Subtitle */}
          <div className="flex flex-col items-center text-center">
            <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-tight">
              国家人口
            </h1>
            <span className="text-[9px] sm:text-[10px] font-mono tracking-widest text-slate-400 font-semibold uppercase">
              NATIONAL DEMOGRAPHY
            </span>
          </div>

          {/* Right: Independent System Status Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200/90 rounded-full shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
            <span className="text-[11px] font-bold text-slate-700">
              系统独立运行中
            </span>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
          </div>
        </header>

        {/* ================================================================= */}
        {/* MODULE 1: CURRENT POPULATION HERO CARD                            */}
        {/* ================================================================= */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="relative rounded-[28px] bg-white border border-slate-200/80 p-5 sm:p-6 shadow-[0_8px_30px_rgba(15,23,42,0.04)] overflow-hidden"
        >
          {/* Subtle Abstract Population Silhouette Background */}
          <div className="absolute right-0 top-0 bottom-0 w-48 pointer-events-none opacity-[0.14] flex items-center justify-end pr-2">
            <svg
              viewBox="0 0 240 200"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full text-slate-800"
            >
              {/* Abstract People and Dotted Globe Mesh */}
              <circle cx="160" cy="50" r="26" fill="currentColor" />
              <path
                d="M110 140 C110 98, 210 98, 210 140 Z"
                fill="currentColor"
              />
              <circle cx="100" cy="70" r="20" fill="currentColor" />
              <path
                d="M60 150 C60 115, 140 115, 140 150 Z"
                fill="currentColor"
              />
              <circle cx="210" cy="75" r="18" fill="currentColor" />
              <path
                d="M175 155 C175 125, 245 125, 245 155 Z"
                fill="currentColor"
              />
              {/* Micro tech grid dots */}
              <circle cx="50" cy="30" r="2" fill="currentColor" opacity="0.6" />
              <circle cx="70" cy="20" r="2" fill="currentColor" opacity="0.6" />
              <circle cx="90" cy="35" r="2" fill="currentColor" opacity="0.6" />
              <circle cx="190" cy="25" r="2" fill="currentColor" opacity="0.6" />
            </svg>
          </div>

          <div className="relative z-10 space-y-3">
            {/* Top Label with Squircle Icon */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#0f172a] text-white flex items-center justify-center shadow-xs">
                <Users className="w-5 h-5" />
              </div>
              <span className="text-base font-bold text-slate-900 tracking-tight">
                全国总人口
              </span>
            </div>

            {/* Core Big Number */}
            <div className="pt-2">
              <div className="flex items-baseline gap-1.5">
                <span className="text-5xl sm:text-6xl font-black text-[#0f172a] tracking-tight font-sans leading-none">
                  {popDisplay.number}
                </span>
                <span className="text-2xl font-black text-slate-800 tracking-tight pb-1">
                  {popDisplay.unit}
                </span>
              </div>

              {/* Accent Underline Bar */}
              <div className="w-12 h-1 bg-gradient-to-r from-indigo-600 to-indigo-400 rounded-full mt-2.5 mb-2" />

              {/* Sub-label */}
              <div className="text-xs font-semibold text-slate-400">
                当前总人口
              </div>
            </div>
          </div>
        </motion.section>

        {/* ================================================================= */}
        {/* MODULE 2: POPULATION GROWTH RATE                                  */}
        {/* ================================================================= */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.08, ease: 'easeOut' }}
          className="rounded-[28px] bg-white border border-slate-200/80 p-5 sm:p-6 shadow-[0_8px_30px_rgba(15,23,42,0.04)] space-y-4"
        >
          {/* Section Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                人口增长率
              </h2>
            </div>

            {/* Right green tag */}
            <span className="px-3 py-1 bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-xs font-bold rounded-full flex items-center gap-1.5 shadow-2xs">
              <span className="text-emerald-600 text-sm">🍃</span>
              <span>仅自然增长</span>
            </span>
          </div>

          {/* Core Growth Rates: 2 Columns */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            {/* Daily Growth */}
            <div className="space-y-0.5">
              <div className="flex items-center text-emerald-600 font-black text-2xl sm:text-[26px] font-mono tracking-tight">
                <span className="text-base mr-0.5">↑</span>
                <span>+0.01%</span>
                <span className="text-xs font-sans text-emerald-700 ml-1 font-bold">
                  / 日
                </span>
              </div>
              <div className="text-xs text-slate-400 font-medium">
                每日自然增长率
              </div>
            </div>

            {/* Annual Growth */}
            <div className="space-y-0.5 border-l border-slate-100 pl-4">
              <div className="flex items-center text-emerald-600 font-black text-2xl sm:text-[26px] font-mono tracking-tight">
                <span className="text-base mr-0.5">↑</span>
                <span>+3.72%</span>
                <span className="text-xs font-sans text-emerald-700 ml-1 font-bold">
                  / 年
                </span>
              </div>
              <div className="text-xs text-slate-400 font-medium">
                年化增长率
              </div>
            </div>
          </div>

          {/* Smooth Minimalist Monotonic Green Growth Curve */}
          <div className="relative pt-2 pb-1">
            <svg
              viewBox="0 0 380 60"
              className="w-full h-14 overflow-visible"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient
                  id="smoothEmeraldGrad"
                  x1="0%"
                  y1="0%"
                  x2="0%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Gradient Area Fill */}
              <path
                d="M 0 45 C 70 44, 140 40, 210 32 C 280 24, 330 18, 380 8 L 380 60 L 0 60 Z"
                fill="url(#smoothEmeraldGrad)"
              />

              {/* Main Glowing Smooth Line */}
              <path
                d="M 0 45 C 70 44, 140 40, 210 32 C 280 24, 330 18, 380 8"
                fill="none"
                stroke="#10b981"
                strokeWidth="2.75"
                strokeLinecap="round"
              />

              {/* Pulsing Target Dot */}
              <circle
                cx="380"
                cy="8"
                r="4.5"
                fill="#10b981"
                stroke="#ffffff"
                strokeWidth="2"
              />
              <circle
                cx="380"
                cy="8"
                r="8"
                fill="#10b981"
                opacity="0.25"
                className="animate-ping"
              />
            </svg>
          </div>

          {/* Bottom Note */}
          <p className="text-[11px] sm:text-xs text-slate-400 text-center leading-relaxed font-normal px-2">
            人口仅自然增长，不受战争、移民、政治或经济状态影响，不会自然减少，只会缓慢增加。
          </p>
        </motion.section>

        {/* ================================================================= */}
        {/* MODULE 3: CONSCRIPTION LAWS (CAROUSEL & ACTIVE DETAILS)          */}
        {/* ================================================================= */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.14, ease: 'easeOut' }}
          className="rounded-[28px] bg-white border border-slate-200/80 p-5 sm:p-6 shadow-[0_8px_30px_rgba(15,23,42,0.04)] space-y-4"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-[#0f172a] text-white flex items-center justify-center shadow-xs">
                <Shield className="w-4 h-4" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  征兵法案
                </h2>
                <span className="text-[10px] font-mono font-semibold text-slate-400 uppercase tracking-wider">
                  CONSCRIPTIONS
                </span>
              </div>
            </div>

            {/* Info Trigger Button */}
            <button
              type="button"
              onClick={() => setShowInfoModal(true)}
              className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200/80 text-slate-400 hover:text-slate-600 transition flex items-center justify-center cursor-pointer"
              title="法案说明"
            >
              <Info className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* =============================================================== */}
          {/* HORIZONTAL CARD CAROUSEL                                         */}
          {/* =============================================================== */}
          <div className="relative w-full pt-1 pb-2">
            <div className="flex items-center justify-center gap-2 sm:gap-3 overflow-hidden px-1">
              
              {/* Previous Card (Left Flank) */}
              {(() => {
                const prevIdx =
                  activeLawIndex > 0
                    ? activeLawIndex - 1
                    : CONSCRIPTION_LAWS.length - 1;
                const prevLaw = CONSCRIPTION_LAWS[prevIdx];
                return (
                  <div
                    onClick={handlePrevLaw}
                    className="w-24 sm:w-28 h-56 sm:h-64 rounded-2xl bg-slate-50 hover:bg-slate-100/90 border border-slate-200/80 p-3 flex flex-col items-center justify-between text-center cursor-pointer opacity-60 hover:opacity-85 transition-all shrink-0 select-none scale-90"
                  >
                    {/* Mini Icon */}
                    <div className="w-10 h-10 rounded-xl bg-slate-200/80 text-slate-600 flex items-center justify-center mt-2">
                      <MilitaryIcon category={prevLaw.category} size={20} />
                    </div>

                    <div className="space-y-1">
                      <div className="text-xs font-bold text-slate-800 line-clamp-1">
                        {prevLaw.name}
                      </div>
                      <div className="text-[10px] text-slate-400 line-clamp-1">
                        {prevLaw.statusLabel}
                      </div>
                    </div>

                    {/* Preview Metric */}
                    <div className="w-full py-1 px-1 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600">
                      {prevLaw.metrics[0].value}
                    </div>
                  </div>
                );
              })()}

              {/* Active Central Card (Hero Dark Theme) */}
              <div className="relative w-56 sm:w-64 h-64 sm:h-72 rounded-3xl bg-gradient-to-b from-[#111827] via-[#1e293b] to-[#0f172a] text-white p-4 sm:p-5 shadow-[0_16px_36px_rgba(15,23,42,0.25)] border border-slate-700/60 flex flex-col items-center justify-between text-center shrink-0 z-10">
                
                {/* Floating "当前法案" Pill */}
                <div className="px-3 py-0.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[10px] font-semibold text-slate-200 flex items-center gap-1 shadow-xs">
                  <Sparkles className="w-2.5 h-2.5 text-indigo-300" />
                  <span>当前法案</span>
                </div>

                {/* Central Military Icon with Wreath Aura */}
                <div className="relative my-1">
                  <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
                    <MilitaryIcon category={currentLaw.category} size={28} />
                  </div>
                </div>

                {/* Law Name & Status */}
                <div className="space-y-0.5">
                  <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                    {currentLaw.name}
                  </h3>
                  <p className="text-[11px] text-indigo-200/90 font-medium">
                    {currentLaw.statusLabel}
                  </p>
                  <p className="text-[10px] text-slate-300/80 line-clamp-2 px-1 leading-tight pt-1">
                    {currentLaw.description}
                  </p>
                </div>

                {/* Mini Metric Chips Bar */}
                <div className="w-full grid grid-cols-3 gap-1 pt-1 border-t border-white/10">
                  {currentLaw.metrics.map((m, idx) => (
                    <div
                      key={idx}
                      className="py-1 px-1 bg-white/5 rounded-lg text-center"
                    >
                      <div className="text-[9px] text-slate-400 leading-none truncate">
                        {m.label}
                      </div>
                      <div
                        className={`text-[11px] font-mono font-bold mt-0.5 ${
                          m.type === 'positive'
                            ? 'text-emerald-400'
                            : m.type === 'negative'
                            ? 'text-rose-400'
                            : 'text-slate-200'
                        }`}
                      >
                        {m.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Next Card (Right Flank) */}
              {(() => {
                const nextIdx =
                  activeLawIndex < CONSCRIPTION_LAWS.length - 1
                    ? activeLawIndex + 1
                    : 0;
                const nextLaw = CONSCRIPTION_LAWS[nextIdx];
                return (
                  <div
                    onClick={handleNextLaw}
                    className="w-24 sm:w-28 h-56 sm:h-64 rounded-2xl bg-slate-50 hover:bg-slate-100/90 border border-slate-200/80 p-3 flex flex-col items-center justify-between text-center cursor-pointer opacity-60 hover:opacity-85 transition-all shrink-0 select-none scale-90"
                  >
                    {/* Mini Icon */}
                    <div className="w-10 h-10 rounded-xl bg-slate-200/80 text-slate-600 flex items-center justify-center mt-2">
                      <MilitaryIcon category={nextLaw.category} size={20} />
                    </div>

                    <div className="space-y-1">
                      <div className="text-xs font-bold text-slate-800 line-clamp-1">
                        {nextLaw.name}
                      </div>
                      <div className="text-[10px] text-slate-400 line-clamp-1">
                        {nextLaw.statusLabel}
                      </div>
                    </div>

                    {/* Preview Metric */}
                    <div className="w-full py-1 px-1 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600">
                      {nextLaw.metrics[0].value}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Left & Right Floating Chevron Buttons for Easy Thumb Tapping */}
            <button
              type="button"
              onClick={handlePrevLaw}
              className="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/95 border border-slate-200/90 shadow-md text-slate-700 hover:text-slate-900 flex items-center justify-center cursor-pointer active:scale-95 transition-transform z-20"
              title="上一项法案"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleNextLaw}
              className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/95 border border-slate-200/90 shadow-md text-slate-700 hover:text-slate-900 flex items-center justify-center cursor-pointer active:scale-95 transition-transform z-20"
              title="下一项法案"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Carousel Pagination Dots */}
          <div className="flex items-center justify-center gap-1.5 pt-1">
            {CONSCRIPTION_LAWS.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveLawIndex(idx)}
                className={`transition-all rounded-full cursor-pointer ${
                  activeLawIndex === idx
                    ? 'w-5 h-1.5 bg-[#0f172a]'
                    : 'w-1.5 h-1.5 bg-slate-200 hover:bg-slate-300'
                }`}
                title={`切换到第 ${idx + 1} 项法案`}
              />
            ))}
          </div>

          {/* =============================================================== */}
          {/* EXPANDABLE ACCORDION: LAW DETAILS & PREVIEW                      */}
          {/* =============================================================== */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}
              className="w-full py-3 px-4 bg-slate-50 hover:bg-slate-100/90 active:bg-slate-100 rounded-2xl border border-slate-200/70 flex items-center justify-center gap-2 text-xs font-bold text-slate-700 transition-all cursor-pointer shadow-2xs"
            >
              <Sliders className="w-3.5 h-3.5 text-indigo-600" />
              <span>法案详情与效果预览</span>
              <ChevronDown
                className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                  isDetailsExpanded ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Expandable Content Container */}
            <AnimatePresence>
              {isDetailsExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="pt-3 space-y-2 text-xs">
                    <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-2.5">
                      <div className="flex items-center justify-between font-semibold text-slate-800 border-b border-slate-200/60 pb-2">
                        <span className="flex items-center gap-1.5">
                          <Scale className="w-3.5 h-3.5 text-indigo-600" />
                          <span>{currentLaw.name} 执行细则</span>
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {currentLaw.statusLabel}
                        </span>
                      </div>

                      {/* Detailed Parameters List */}
                      <div className="space-y-2 font-mono text-[11px]">
                        {currentLaw.detailedBreakdown.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between bg-white p-2 rounded-xl border border-slate-100"
                          >
                            <div>
                              <span className="font-bold text-slate-800 block">
                                {item.param}
                              </span>
                              <span className="text-[10px] text-slate-400 font-sans block">
                                {item.note}
                              </span>
                            </div>
                            <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md text-[10px]">
                              {item.effect}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Explicit Population Independence Confirmation */}
                      <div className="p-2 bg-emerald-50/60 border border-emerald-100 rounded-xl text-[10px] text-emerald-800 leading-tight flex items-start gap-1.5 font-sans">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>
                          <strong>零人口损耗保证</strong>：征兵法案仅影响军事可动员比例与劳工生产系数，绝不扣减国家总人口基数。
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.section>

        {/* ================================================================= */}
        {/* BOTTOM FOOTNOTE                                                   */}
        {/* ================================================================= */}
        <footer className="pt-2 text-center">
          <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1 font-medium">
            <span>🍃</span>
            <span>人口数据每日更新，所有数值仅自然变化</span>
          </p>
        </footer>
      </div>

      {/* =================================================================== */}
      {/* INFO MODAL (CONSCRIPTIONS & POPULATION EXPLANATION)                  */}
      {/* =================================================================== */}
      <AnimatePresence>
        {showInfoModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setShowInfoModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-white rounded-3xl p-5 border border-slate-200 shadow-xl space-y-3.5"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Shield className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    法案体系与人口规则
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowInfoModal(false)}
                  className="text-xs text-slate-400 hover:text-slate-600 font-bold px-2 py-1"
                >
                  关闭
                </button>
              </div>

              <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
                <p>
                  <strong>1. 单向自然增长：</strong>
                  国家人口以每日 +0.01%（年化 +3.72%）的固定速率稳步复利增长。
                </p>
                <p>
                  <strong>2. 征兵与战力平衡：</strong>
                  征兵法案决定了全国适龄人口中被征入常备役与预备役的比例（如 1.5% ~ 10%）。
                </p>
                <p>
                  <strong>3. 零总人口削减：</strong>
                  征兵只改变军事人力储备，绝不减少全国总人口总数。
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowInfoModal(false)}
                className="w-full py-2.5 bg-[#0f172a] text-white font-bold text-xs rounded-xl shadow-xs active:scale-98 transition"
              >
                我已知晓
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// =============================================================================
// Helper: Military Icon Component for Conscription Laws
// =============================================================================
function MilitaryIcon({
  category,
  size = 24,
}: {
  category: string;
  size?: number;
}) {
  switch (category) {
    case 'VOLUNTEER':
      return <Shield size={size} />;
    case 'LIMITED':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Military helmet with star and wreath */}
          <path d="M12 2a8 8 0 0 0-8 8v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3a8 8 0 0 0-8-8z" />
          <path d="M3 15h18" />
          <path d="M12 6l.8 1.6 1.8.3-1.3 1.2.3 1.8-1.6-.9-1.6.9.3-1.8-1.3-1.2 1.8-.3z" />
        </svg>
      );
    case 'EXTENSIVE':
      return <Flag size={size} />;
    case 'TOTAL_MOBILIZATION':
      return <Crosshair size={size} />;
    default:
      return <Shield size={size} />;
  }
}
