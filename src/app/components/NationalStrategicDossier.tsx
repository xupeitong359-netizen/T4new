import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  MapPin,
  Landmark,
  Building2,
  Users,
  Swords,
  HeartHandshake,
  Shield,
  ShieldCheck,
  Compass,
  Globe,
  ChevronRight,
  MoreHorizontal,
  Edit3,
  Trash2,
  BookOpen,
  FileText,
  Flame,
  Scale,
  TrendingUp,
  ShieldAlert,
  ArrowUpRight,
  CheckCircle2,
} from 'lucide-react';
import { Nation, DiplomacyType } from '../types';
import { TikTokIcon } from './TikTokIcon';
import { renderEmblemIcon } from '../lib/icons';
import { getTotalCivilianFactories } from '../lib/economyEngine';
import { getTotalMilitaryFactories } from '../lib/militaryIndustry';
import { useEconomyTicker } from '../lib/useEconomyTicker';

interface NationalStrategicDossierProps {
  nation: Nation;
  isOwner: boolean;
  onEdit?: (nation: Nation) => void;
  onDelete?: (nation: Nation) => void;
  onOpenDispute?: (nation: Nation) => void;
  onOpenDecrees?: () => void;
  onOpenAlliance?: (nation: Nation) => void;
  onOpenChronicle?: () => void;
  onOpenEconomy?: () => void;
  onOpenMilitary?: () => void;
  onOpenDiplomacy?: (nation: Nation, type?: DiplomacyType) => void;
  onTerminateTreaty?: (treatyId: string, withNationName: string) => void;
  allNations?: Nation[];
}

function LiveCurrencyAmount({ nation }: { nation: Nation }) {
  const stats = useEconomyTicker(nation, true);
  const formatted = stats.currentTreasury.toLocaleString('zh-CN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });

  return (
    <span className="font-mono font-bold tabular-nums text-emerald-700">
      {stats.currencySymbol}{formatted}
    </span>
  );
}

export const NationalStrategicDossier: React.FC<NationalStrategicDossierProps> = ({
  nation,
  isOwner,
  onEdit,
  onDelete,
  onOpenDispute,
  onOpenDecrees,
  onOpenAlliance,
  onOpenChronicle,
  onOpenEconomy,
  onOpenMilitary,
  onOpenDiplomacy,
  onTerminateTreaty,
  allNations = [],
}) => {
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMoreMenuOpen(false);
      }
    };
    if (moreMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [moreMenuOpen]);

  // 基础统计数据
  const civFactories = getTotalCivilianFactories(nation);
  const milFactories = getTotalMilitaryFactories(nation);
  const totalFactories = civFactories + milFactories;

  const totalPop = nation.totalPopulation || 28500000;
  const popInWan = (totalPop / 10000).toLocaleString('zh-CN', { maximumFractionDigits: 1 });
  const reserveManpower = nation.army?.manpowerReserve ?? 120000;
  const reserveInWan = (reserveManpower / 10000).toFixed(1);

  const divisionsCount = nation.army?.divisions?.length || 0;
  const activeWars = nation.activeWars || [];
  const activeTreaties = nation.activeTreaties || [];
  const stability = nation.stabilityIndex ?? 88;
  const approval = nation.popularApproval ?? 65;

  // 综合战略实力评级算法
  const strategicRating = useMemo(() => {
    const score = totalFactories * 12 + divisionsCount * 18 + (totalPop / 1000000) * 8 + stability * 0.4;
    if (score >= 260) {
      return { grade: 'S', title: '超级强国', badgeClass: 'bg-amber-50 text-amber-800 border-amber-300' };
    }
    if (score >= 150) {
      return { grade: 'A', title: '区域核心国', badgeClass: 'bg-indigo-50 text-indigo-800 border-indigo-200' };
    }
    if (score >= 80) {
      return { grade: 'B', title: '独立主权国', badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
    }
    return { grade: 'C', title: '新兴实体', badgeClass: 'bg-slate-100 text-slate-700 border-slate-200' };
  }, [totalFactories, divisionsCount, totalPop, stability]);

  // 规范的国家档案注册号
  const registryCode = useMemo(() => {
    const rawId = (nation.id || 'NATION').replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase();
    return `STATE-ARCHIVE #${rawId}`;
  }, [nation.id]);

  // 国家整体运行状态
  const nationState = useMemo(() => {
    if (activeWars.length > 0) {
      return {
        label: '战时动员戒备',
        dot: 'bg-rose-500 animate-pulse',
        badge: 'bg-rose-50 text-rose-700 border-rose-200',
      };
    }
    if (stability < 50) {
      return {
        label: '局势动荡预警',
        dot: 'bg-amber-500',
        badge: 'bg-amber-50 text-amber-700 border-amber-200',
      };
    }
    return {
      label: '政局常态平稳',
      dot: 'bg-emerald-500',
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    };
  }, [activeWars.length, stability]);

  return (
    <div className="space-y-4 font-sans text-slate-800">
      {/* ========================================================================= */}
      {/* 1. 现代国家战略档案抬头与核心身份区 (WHITE / STRATEGIC DOSSIER) */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
        {/* 顶部档案元数据公报条 */}
        <div className="px-4 sm:px-6 py-2.5 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between gap-3 text-xs flex-wrap">
          <div className="flex items-center gap-2.5 text-slate-500 font-mono text-[11px]">
            <span className="font-semibold text-slate-700 tracking-wider">国家战略档案</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-600 font-medium">{registryCode}</span>
          </div>

          <div className="flex items-center gap-2">
            {/* 国家状态标签 */}
            <div className={`px-2 py-0.5 rounded-md border text-[11px] font-medium flex items-center gap-1.5 ${nationState.badge}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${nationState.dot}`} />
              <span>{nationState.label}</span>
            </div>

            {/* 实力评级 */}
            <div className={`px-2 py-0.5 rounded-md border text-[11px] font-bold flex items-center gap-1 ${strategicRating.badgeClass}`}>
              <span className="font-mono">{strategicRating.grade}级</span>
              <span className="hidden xs:inline font-medium text-[10px]">· {strategicRating.title}</span>
            </div>
          </div>
        </div>

        {/* 核心主权身份主体区 */}
        <div className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* 左侧：国家徽记 + 国家主权名 + 首都/领主 */}
            <div className="flex items-start sm:items-center gap-4 min-w-0">
              {/* 主权国徽/旗帜纹章方牌 */}
              <div
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl border border-slate-200/90 shadow-2xs flex items-center justify-center relative overflow-hidden flex-shrink-0"
                style={{
                  backgroundColor: nation.flagColor || '#2563eb',
                  background: `linear-gradient(135deg, ${nation.flagColor || '#2563eb'} 0%, ${nation.flagColor ? nation.flagColor + 'dd' : '#1d4ed8'} 100%)`,
                }}
              >
                {nation.emblemIcon && (nation.emblemIcon.startsWith('data:image') || nation.emblemIcon.startsWith('http')) ? (
                  <img
                    src={nation.emblemIcon}
                    alt={nation.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-white drop-shadow-xs">
                    {renderEmblemIcon(nation.emblemIcon || 'crown', { className: 'w-8 h-8 sm:w-9 sm:h-9' })}
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-tr from-black/15 via-transparent to-white/20 pointer-events-none" />
              </div>

              {/* 国家名称与基本标识 */}
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight truncate">
                    {nation.name}
                  </h1>
                  {nation.allianceId && (
                    <span className="px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200 text-[11px] font-medium flex items-center gap-1">
                      <Globe className="w-3 h-3 text-sky-500" />
                      条约阵营国
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500 flex-wrap">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span>首都：</span>
                    <strong className="text-slate-700 font-semibold">{nation.capital || '未设首都'}</strong>
                  </span>
                  <span className="text-slate-300">·</span>
                  <span className="flex items-center gap-1">
                    <TikTokIcon className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span>执政领主：</span>
                    <strong className="text-slate-700 font-medium font-mono">
                      {nation.ownerDouyinName || nation.ownerUsername || '临时执政团'}
                    </strong>
                  </span>
                </div>
              </div>
            </div>

            {/* 右侧：次级沉稳操作 + 更多操作下拉菜单 */}
            <div className="flex items-center gap-2 self-start sm:self-center flex-shrink-0">
              {isOwner ? (
                <>
                  <button
                    type="button"
                    onClick={() => onEdit?.(nation)}
                    className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                    <span>编辑资料</span>
                  </button>

                  {/* 更多操作菜单 */}
                  <div className="relative" ref={menuRef}>
                    <button
                      type="button"
                      onClick={() => setMoreMenuOpen((prev) => !prev)}
                      className="p-1.5 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg text-xs transition cursor-pointer shadow-2xs"
                      title="更多管理选项"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>

                    {moreMenuOpen && (
                      <div className="absolute right-0 top-full mt-1.5 w-44 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-30 text-xs animate-in fade-in zoom-in-95">
                        <button
                          type="button"
                          onClick={() => {
                            setMoreMenuOpen(false);
                            onEdit?.(nation);
                          }}
                          className="w-full px-3 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                          <span>修改国家配置</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setMoreMenuOpen(false);
                            onOpenChronicle?.();
                          }}
                          className="w-full px-3 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition"
                        >
                          <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                          <span>国家档案编年史</span>
                        </button>
                        <div className="my-1 border-t border-slate-100" />
                        <button
                          type="button"
                          onClick={() => {
                            setMoreMenuOpen(false);
                            onDelete?.(nation);
                          }}
                          className="w-full px-3 py-2 text-left text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition font-medium"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                          <span>解散国家实体</span>
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => onOpenDiplomacy?.(nation)}
                    className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
                  >
                    <HeartHandshake className="w-3.5 h-3.5" />
                    <span>外交公约</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenDispute?.(nation)}
                    className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
                  >
                    <Swords className="w-3.5 h-3.5 text-rose-600" />
                    <span>战略宣战</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 排版驱动的双栏/矩阵式国家基本面 (替代原先的 4 个独立彩色小卡片) */}
          {/* ========================================================================= */}
          <div className="mt-5 pt-4 border-t border-slate-100">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-y-3 gap-x-6 text-xs">
              {/* 1. 政体 */}
              <div className="space-y-0.5">
                <span className="text-[11px] text-slate-400 block font-normal">政体建制</span>
                <span className="font-semibold text-slate-900 text-sm">{nation.regime || '立宪代议制'}</span>
              </div>

              {/* 2. 意识形态 */}
              <div className="space-y-0.5">
                <span className="text-[11px] text-slate-400 block font-normal">国家意识形态</span>
                <span className="font-semibold text-slate-900 text-sm">{nation.ideology || '中立共和主义'}</span>
              </div>

              {/* 3. 官方语言 */}
              <div className="space-y-0.5">
                <span className="text-[11px] text-slate-400 block font-normal">官方通用语</span>
                <span className="font-semibold text-slate-900 text-sm">{nation.language || '汉语'}</span>
              </div>

              {/* 4. 流通货币与国库 */}
              <div
                onClick={onOpenEconomy}
                className="space-y-0.5 cursor-pointer group"
                title="点击查看国家财政与货币流动"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 block font-normal group-hover:text-slate-600 transition">
                    流通主权货币
                  </span>
                  <ChevronRight className="w-3 h-3 text-slate-300 group-hover:text-slate-600 transition" />
                </div>
                <div className="flex items-baseline gap-1.5 flex-wrap">
                  <span className="font-semibold text-slate-900 text-sm">{nation.currency || '主权货币'}</span>
                  <span className="text-xs">
                    (<LiveCurrencyAmount nation={nation} />)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. 国家实力概览带 (NATIONAL POWER DASHBOARD - 完全对齐图二的高精度现代战略指示板，支持移动端双列) */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs p-4 sm:p-6 md:p-8 relative overflow-hidden">
        {/* 背景右上角科技世界地图点阵与柔和光晕装饰 */}
        <div className="absolute top-0 right-0 w-80 h-64 pointer-events-none opacity-40 select-none overflow-hidden flex items-start justify-end">
          <svg className="w-72 h-60 text-indigo-900/10" viewBox="0 0 200 150" fill="currentColor">
            {/* 世界地图点阵示意轮廓 */}
            <circle cx="170" cy="30" r="2" />
            <circle cx="178" cy="32" r="1.5" />
            <circle cx="165" cy="38" r="1.5" />
            <circle cx="155" cy="42" r="2.5" />
            <circle cx="145" cy="50" r="3" />
            <circle cx="152" cy="56" r="2" />
            <circle cx="160" cy="65" r="2.5" />
            <circle cx="172" cy="72" r="2" />
            <circle cx="180" cy="80" r="1.5" />
            <circle cx="130" cy="45" r="2" />
            <circle cx="135" cy="52" r="2" />
            <circle cx="120" cy="35" r="1.5" />
            <circle cx="110" cy="40" r="2" />
            <circle cx="115" cy="48" r="2.5" />
            <circle cx="125" cy="60" r="2" />
            <circle cx="95" cy="30" r="2" />
            <circle cx="90" cy="38" r="1.5" />
            <circle cx="85" cy="45" r="2.5" />
            <circle cx="140" cy="90" r="2" />
            <circle cx="150" cy="98" r="2.5" />
            <circle cx="160" cy="105" r="2" />
            <circle cx="170" cy="115" r="1.5" />
            {/* 核心战略高亮点 */}
            <circle cx="155" cy="42" r="4" className="text-indigo-600 animate-pulse fill-indigo-600" />
            <circle cx="155" cy="42" r="8" className="text-indigo-400/30 stroke-indigo-500" strokeWidth="1" fill="none" />
          </svg>
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-indigo-50/60 rounded-full blur-2xl -z-10" />
        </div>

        {/* 顶部标题区 */}
        <div className="relative z-10">
          <div className="flex items-center gap-2 sm:gap-2.5">
            <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 stroke-[2.5]" />
            <h2 className="text-lg sm:text-xl md:text-2xl font-black text-slate-950 tracking-tight">国家综合实力基本面</h2>
          </div>
          <span className="block text-[10px] sm:text-[11px] font-bold tracking-[0.2em] sm:tracking-[0.25em] text-slate-400 font-mono mt-0.5 sm:mt-1">
            STRATEGIC INDICATORS
          </span>
          {/* 下方专属紫色指示横条 */}
          <div className="w-12 sm:w-14 h-1 bg-indigo-600 rounded-full mt-2.5 sm:mt-3 mb-5 sm:mb-7" />
        </div>

        {/* 移动端与桌面端保持双列矩阵 (grid-cols-2) */}
        <div className="grid grid-cols-2 gap-x-3 sm:gap-x-8 md:gap-x-12 gap-y-5 sm:gap-y-7 relative z-10">
          {/* 指标 1：人口总规模 (左上) */}
          <div className="space-y-2 sm:space-y-3 pb-4 sm:pb-6 border-b border-slate-100">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
              </div>
              <div className="min-w-0">
                <span className="text-xs sm:text-sm font-bold text-slate-800 block leading-none truncate">人口总规模</span>
                <div className="w-5 sm:w-6 h-0.5 bg-indigo-600 rounded-full mt-1 sm:mt-1.5" />
              </div>
            </div>

            <div className="flex items-baseline gap-0.5 sm:gap-1 font-mono pt-0.5 sm:pt-1">
              <span className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-950 tracking-tight">{popInWan}</span>
              <span className="text-xs sm:text-base font-normal text-slate-700 ml-0.5 sm:ml-1">万</span>
            </div>

            <div className="flex items-center justify-between pt-0.5 sm:pt-1 text-[11px] sm:text-xs md:text-sm">
              <span className="text-slate-500 sm:text-slate-600">适役兵源</span>
              <span className="font-mono font-bold text-indigo-600">{reserveInWan}万</span>
            </div>
          </div>

          {/* 指标 2：工业工厂 (右上) */}
          <div
            onClick={onOpenEconomy}
            className="space-y-2 sm:space-y-3 pb-4 sm:pb-6 border-b border-slate-100 cursor-pointer group"
            title="点击进入工业与产能调控"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                  <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs sm:text-sm font-bold text-slate-800 block leading-none group-hover:text-indigo-600 transition truncate">
                    工业工厂
                  </span>
                  <div className="w-5 sm:w-6 h-0.5 bg-indigo-600 rounded-full mt-1 sm:mt-1.5" />
                </div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-300 group-hover:text-slate-600 transition shrink-0" />
            </div>

            <div className="flex items-baseline gap-0.5 sm:gap-1 font-mono pt-0.5 sm:pt-1">
              <span className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-950 tracking-tight">{totalFactories}</span>
              <span className="text-xs sm:text-base font-normal text-slate-700 ml-0.5 sm:ml-1">座</span>
            </div>

            {/* 工业双色进度条：橙色民工 + 紫色军工 */}
            <div className="pt-1.5 sm:pt-2">
              <div className="w-full h-1.5 sm:h-2 rounded-full bg-slate-100 overflow-hidden flex">
                <div
                  className="h-full bg-amber-500"
                  style={{ width: `${totalFactories > 0 ? (civFactories / totalFactories) * 100 : 50}%` }}
                  title={`民用工业: ${civFactories}座`}
                />
                <div
                  className="h-full bg-indigo-600"
                  style={{ width: `${totalFactories > 0 ? (milFactories / totalFactories) * 100 : 50}%` }}
                  title={`军用工业: ${milFactories}座`}
                />
              </div>
            </div>
          </div>

          {/* 指标 3：正规陆军 (左中) */}
          <div
            onClick={() => onOpenDispute?.(nation)}
            className="space-y-2 sm:space-y-3 pb-4 sm:pb-6 border-b border-slate-100 cursor-pointer group"
            title="查看正规军编制与战备部署"
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
                <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
              </div>
              <div className="min-w-0">
                <span className="text-xs sm:text-sm font-bold text-slate-800 block leading-none group-hover:text-indigo-600 transition truncate">
                  正规陆军
                </span>
                <div className="w-5 sm:w-6 h-0.5 bg-indigo-600 rounded-full mt-1.5" />
              </div>
            </div>

            <div className="flex items-baseline gap-0.5 sm:gap-1 font-mono pt-0.5 sm:pt-1">
              <span className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-950 tracking-tight">{divisionsCount}</span>
              <span className="text-xs sm:text-base font-normal text-slate-700 ml-0.5 sm:ml-1">个师</span>
            </div>

            <div className="flex items-center justify-between pt-0.5 sm:pt-1 text-[11px] sm:text-xs md:text-sm">
              <span className="text-slate-500 sm:text-slate-600">交火前线</span>
              <span
                className={`font-mono font-bold ${
                  activeWars.length > 0 ? 'text-rose-600 animate-pulse' : 'text-slate-900'
                }`}
              >
                {activeWars.length} 处
              </span>
            </div>
          </div>

          {/* 指标 4：国家稳定度 (右中) */}
          <div
            onClick={onOpenDecrees}
            className="space-y-2 sm:space-y-3 pb-4 sm:pb-6 border-b border-slate-100 cursor-pointer group"
            title="国家政令与稳定度控制"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs sm:text-sm font-bold text-slate-800 block leading-none group-hover:text-emerald-600 transition truncate">
                    国家稳定度
                  </span>
                  <div className="w-5 sm:w-6 h-0.5 bg-indigo-600 rounded-full mt-1.5" />
                </div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-300 group-hover:text-slate-600 transition shrink-0" />
            </div>

            <div className="flex items-baseline gap-0.5 font-mono pt-0.5 sm:pt-1">
              <span className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-emerald-600 tracking-tight">{stability}</span>
              <span className="text-base sm:text-lg font-bold text-emerald-600 ml-0.5 sm:ml-1">%</span>
            </div>

            {/* 绿色单色稳定度进度条 */}
            <div className="pt-1.5 sm:pt-2">
              <div className="w-full h-1.5 sm:h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${stability}%` }} />
              </div>
            </div>
          </div>

          {/* 指标 5：主权疆域管辖 (左下) */}
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
              </div>
              <div className="min-w-0">
                <span className="text-xs sm:text-sm font-bold text-slate-800 block leading-none truncate">领土管辖</span>
                <div className="w-5 sm:w-6 h-0.5 bg-indigo-600 rounded-full mt-1.5" />
              </div>
            </div>

            <div className="flex items-baseline gap-0.5 sm:gap-1 font-mono pt-0.5 sm:pt-1">
              <span className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-950 tracking-tight">
                {(nation.provinces || []).length}
              </span>
              <span className="text-xs sm:text-base font-normal text-slate-700 ml-0.5 sm:ml-1">个省区</span>
            </div>

            <div className="flex items-center justify-between pt-0.5 sm:pt-1 text-[11px] sm:text-xs md:text-sm">
              <span className="text-slate-500 sm:text-slate-600">首都辖区</span>
              <span className="font-mono font-bold text-slate-900 truncate max-w-[80px] sm:max-w-none">{nation.capital || '直辖领'}</span>
            </div>
          </div>

          {/* 指标 6：国际条约 (右下) */}
          <div
            onClick={() => onOpenAlliance?.(nation)}
            className="space-y-2 sm:space-y-3 cursor-pointer group"
            title="查看同盟公约与国际条约"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
                  <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs sm:text-sm font-bold text-slate-800 block leading-none group-hover:text-indigo-600 transition truncate">
                    国际条约
                  </span>
                  <div className="w-5 sm:w-6 h-0.5 bg-indigo-600 rounded-full mt-1.5" />
                </div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-300 group-hover:text-slate-600 transition shrink-0" />
            </div>

            <div className="flex items-baseline gap-0.5 sm:gap-1 font-mono pt-0.5 sm:pt-1">
              <span className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-950 tracking-tight">
                {activeTreaties.length}
              </span>
              <span className="text-xs sm:text-base font-normal text-slate-700 ml-0.5 sm:ml-1">份公约</span>
            </div>

            <div className="flex items-center justify-between pt-0.5 sm:pt-1 text-[11px] sm:text-xs md:text-sm">
              <span className="text-slate-500 sm:text-slate-600">同盟状态</span>
              <span className="font-medium text-indigo-600 truncate font-mono">
                {nation.allianceId ? '已结盟' : '无同盟'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. 详细国情与地缘战略深度档案 (向下展开的公报系统) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* ========================================================= */}
        {/* 模块 A (6 cols): 工业制造与产能配置 (细致数据) */}
        {/* ========================================================= */}
        <div className="lg:col-span-6 bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs pb-2.5 border-b border-slate-100">
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-slate-700" />
                <span>工业制造与双轨产能结构</span>
              </span>
              <button
                type="button"
                onClick={onOpenEconomy}
                className="text-[11px] text-slate-500 hover:text-slate-800 font-medium flex items-center gap-0.5 transition"
              >
                经济调控 <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <div className="mt-3.5 space-y-3 text-xs">
              <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-slate-600">民用工业工厂（民生/基建/税基）</span>
                <span className="font-mono font-bold text-slate-900">
                  {civFactories} 座{' '}
                  <span className="text-[11px] font-normal text-slate-400">
                    ({totalFactories > 0 ? Math.round((civFactories / totalFactories) * 100) : 50}%)
                  </span>
                </span>
              </div>

              <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-slate-600">军用工业工厂（陆军重装/军备量产）</span>
                <span className="font-mono font-bold text-slate-900">
                  {milFactories} 座{' '}
                  <span className="text-[11px] font-normal text-slate-400">
                    ({totalFactories > 0 ? Math.round((milFactories / totalFactories) * 100) : 50}%)
                  </span>
                </span>
              </div>

              {/* 细双色产能条 */}
              <div className="pt-1">
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden flex">
                  <div
                    className="h-full bg-amber-500"
                    style={{ width: `${totalFactories > 0 ? (civFactories / totalFactories) * 100 : 50}%` }}
                  />
                  <div
                    className="h-full bg-indigo-600"
                    style={{ width: `${totalFactories > 0 ? (milFactories / totalFactories) * 100 : 50}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                  <span>民用工业产能</span>
                  <span>军工制造转化</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 模块 B (6 cols): 政治光谱与已签署国策法令 */}
        {/* ========================================================= */}
        <div className="lg:col-span-6 bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs pb-2.5 border-b border-slate-100">
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-slate-700" />
                <span>国策法令与执政法令库</span>
              </span>
              <button
                type="button"
                onClick={onOpenDecrees}
                className="text-[11px] text-slate-500 hover:text-slate-800 font-medium flex items-center gap-0.5 transition"
              >
                法令决策 <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <div className="mt-3.5 space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-600">当前已生效施行法令</span>
                <span className="font-mono font-bold text-slate-900">
                  {nation.activeDecreeIds?.length || 1} 项国家法令
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 block">行政效率</span>
                  <span className="font-semibold text-slate-800">政令畅通</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 block">兵役制度</span>
                  <span className="font-semibold text-slate-800">常备兵役法</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 pt-0.5">
                法令将直接作用于国家税收流速、兵源征召上限及政治稳定度修正。
              </div>
            </div>
          </div>
        </div>


        {/* ========================================================= */}
        {/* 模块 D (12 cols): 国际地缘公约与战争交火状态 */}
        {/* ========================================================= */}
        <div className="lg:col-span-12 space-y-3">
          {/* 进行中的战事 */}
          {activeWars.length > 0 && (
            <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-rose-800">
                <span className="flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-rose-600 animate-pulse" />
                  <span>前线交战状态 ({activeWars.length} 处冲突)</span>
                </span>
                <span className="text-[10px] font-mono text-rose-500">ACTIVE WAR THEATRE</span>
              </div>

              <div className="space-y-2">
                {activeWars.map((w, idx) => (
                  <div
                    key={'war-' + idx}
                    className="p-3 bg-white border border-rose-200/80 rounded-xl flex items-center justify-between text-xs sm:text-sm flex-wrap gap-2"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0">
                        <Swords className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="font-bold text-slate-900">交战国：【{w.withNationName}】</span>
                        <span className="text-[11px] text-slate-500 block font-mono">
                          {w.initiatedByMe ? '我方发起宣战' : '敌方发起宣战'} · 开战日期：{new Date(w.since).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const target = allNations.find((n) => n.id === w.withNationId);
                        if (target && onOpenDiplomacy) {
                          onOpenDiplomacy(target, 'armistice');
                        }
                      }}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold text-xs transition cursor-pointer shadow-2xs"
                    >
                      提议停战
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 生效中的国际条约 */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-900">
              <span className="flex items-center gap-1.5">
                <HeartHandshake className="w-4 h-4 text-slate-700" />
                <span>生效中的双边外交公约 ({activeTreaties.length})</span>
              </span>
              <span className="text-[10px] font-mono text-slate-400">INTERNATIONAL TREATIES</span>
            </div>

            {activeTreaties.length === 0 ? (
              <div className="py-4 text-center text-xs text-slate-400 font-mono">
                暂未签署生效任何双边条约
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {activeTreaties.map((t) => {
                  const typeNames: Record<string, { label: string; icon: React.ReactNode }> = {
                    peace: { label: '和平互不侵犯公约', icon: <HeartHandshake className="w-3.5 h-3.5 text-emerald-600" /> },
                    mutual_defense: { label: '互保共同防御同盟', icon: <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" /> },
                    military_access: { label: '军事通行权协定', icon: <Compass className="w-3.5 h-3.5 text-sky-600" /> },
                  };

                  const config = typeNames[t.type] || {
                    label: t.type,
                    icon: <FileText className="w-3.5 h-3.5 text-slate-500" />,
                  };

                  return (
                    <div
                      key={t.id}
                      className="p-3 bg-slate-50/70 border border-slate-200/80 rounded-xl flex items-center justify-between text-xs gap-2"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center flex-shrink-0">
                          {config.icon}
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-slate-900 truncate block">【{t.withNationName}】</span>
                          <span className="text-[10px] text-slate-500 font-mono">{config.label}</span>
                        </div>
                      </div>

                      {isOwner && onTerminateTreaty && (
                        <button
                          type="button"
                          onClick={() => onTerminateTreaty(t.id, t.withNationName)}
                          className="px-2.5 py-1 bg-white hover:bg-rose-50 text-rose-600 border border-slate-200 hover:border-rose-200 rounded-lg text-[11px] font-semibold transition cursor-pointer flex-shrink-0"
                        >
                          单方废约
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* 模块 E (12 cols): 4 大战略调度快捷通道 (Navigation Gateway) */}
        {/* ========================================================= */}
        <div className="lg:col-span-12 grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          <button
            type="button"
            onClick={() => onOpenDispute?.(nation)}
            className="p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-left transition flex items-center justify-between cursor-pointer group shadow-2xs"
          >
            <div className="min-w-0">
              <span className="text-xs font-bold text-slate-900 group-hover:text-rose-700 flex items-center gap-1.5 truncate">
                <Swords className="w-3.5 h-3.5 text-slate-500 group-hover:text-rose-600 flex-shrink-0" />
                地缘争端沙盘
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5 font-mono truncate">
                {activeWars.length > 0 ? `${activeWars.length} 场前线战事` : '前线战备推演'}
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 transition flex-shrink-0 ml-1" />
          </button>

          <button
            type="button"
            onClick={onOpenDecrees}
            className="p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-left transition flex items-center justify-between cursor-pointer group shadow-2xs"
          >
            <div className="min-w-0">
              <span className="text-xs font-bold text-slate-900 group-hover:text-indigo-700 flex items-center gap-1.5 truncate">
                <Landmark className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-600 flex-shrink-0" />
                国策法令内阁
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5 font-mono truncate">
                {nation.activeDecreeIds?.length || 1} 项施行法令
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 transition flex-shrink-0 ml-1" />
          </button>

          <button
            type="button"
            onClick={() => onOpenAlliance?.(nation)}
            className="p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-left transition flex items-center justify-between cursor-pointer group shadow-2xs"
          >
            <div className="min-w-0">
              <span className="text-xs font-bold text-slate-900 group-hover:text-sky-700 flex items-center gap-1.5 truncate">
                <Globe className="w-3.5 h-3.5 text-slate-500 group-hover:text-sky-600 flex-shrink-0" />
                国际同盟公约
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5 font-mono truncate">
                {nation.allianceId ? '已加入条约同盟' : '多边阵营使馆'}
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 transition flex-shrink-0 ml-1" />
          </button>

          <button
            type="button"
            onClick={onOpenChronicle}
            className="p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-left transition flex items-center justify-between cursor-pointer group shadow-2xs"
          >
            <div className="min-w-0">
              <span className="text-xs font-bold text-slate-900 group-hover:text-amber-700 flex items-center gap-1.5 truncate">
                <BookOpen className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-600 flex-shrink-0" />
                国家编年史册
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5 font-mono truncate">
                勋章与建国典籍
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 transition flex-shrink-0 ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
};
