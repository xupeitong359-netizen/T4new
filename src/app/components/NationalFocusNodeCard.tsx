import React from 'react';
import { FocusStatus } from '../types';
import { Check, Sparkles } from 'lucide-react';

interface NationalFocusNodeCardProps {
  iconType: string;
  name: string;
  subtitle?: string;
  status: FocusStatus;
  isSelected?: boolean;
  isHighlighted?: boolean;
  tier?: number;
  durationDays?: number;
  costPoints?: number;
  constructionBonus?: {
    civilianFactories?: number;
    militaryFactories?: number;
  };
  width?: number; // default 114
  onClick?: () => void;
}

/**
 * 钢铁雄心4 (HOI4) 风格经典方形国策节点卡片
 * 具备严肃厚重的历史档案感、大战略军政插画、金属外框与鲜明清晰的状态阶梯
 */
export const NationalFocusNodeCard: React.FC<NationalFocusNodeCardProps> = ({
  iconType,
  name,
  subtitle,
  status,
  isSelected = false,
  isHighlighted = false,
  tier = 1,
  durationDays = 70,
  constructionBonus,
  width = 114,
  onClick,
}) => {
  const isCompleted = status === 'completed';
  const isInProgress = status === 'in_progress';
  const isAvailable = status === 'available';
  const isLocked = status === 'locked';

  // 渲染 HOI4 风格方形历史政治/军事/工业矢量插画
  const renderArtwork = () => {
    switch (iconType) {
      // 1. 顶层最高决议 / 航天星辰 (Compass / Celestial / Crown)
      case 'compass_gold':
        return (
          <g>
            <rect width="64" height="64" fill="#1e2430" rx="3" />
            {/* Vintage Sunburst rays */}
            <circle cx="32" cy="32" r="28" fill="none" stroke="#d97706" strokeWidth="1" strokeDasharray="2 3" opacity="0.6" />
            <path d="M 32 4 L 35 28 L 60 32 L 35 36 L 32 60 L 29 36 L 4 32 L 29 28 Z" fill="url(#hoi4-gold-grad)" />
            <circle cx="32" cy="32" r="8" fill="#451a03" stroke="#fef08a" strokeWidth="1.5" />
            <circle cx="32" cy="32" r="3" fill="#fef08a" />
            <path d="M 12 50 C 20 44 44 44 52 50" stroke="#f59e0b" strokeWidth="1.5" fill="none" />
            <path d="M 22 14 L 32 4 L 42 14" stroke="#fbbf24" strokeWidth="1.5" fill="none" />
          </g>
        );

      // 2. 政治体制 / 宪政要塞 (Shield & Star / Citadel)
      case 'shield_star':
        return (
          <g>
            <rect width="64" height="64" fill="#1a202c" rx="3" />
            {/* Heraldic Shield */}
            <path d="M 16 12 L 48 12 C 48 38 32 52 32 52 C 32 52 16 38 16 12 Z" fill="#2d3748" stroke="#d97706" strokeWidth="2" />
            {/* National Star */}
            <polygon points="32,18 35,26 44,26 37,31 40,39 32,34 24,39 27,31 20,26 29,26" fill="url(#hoi4-gold-grad)" stroke="#78350f" strokeWidth="0.5" />
            {/* Laurel sprigs */}
            <path d="M 10 42 C 14 54 26 58 32 58 C 38 58 50 54 54 42" stroke="#b45309" strokeWidth="2" fill="none" strokeLinecap="round" />
            <line x1="32" y1="40" x2="32" y2="50" stroke="#fef08a" strokeWidth="1.5" />
          </g>
        );

      // 3. 经济发展 / 工业城市 (Industrial City & Factory)
      case 'factory_city':
        return (
          <g>
            <rect width="64" height="64" fill="#24211d" rx="3" />
            {/* Smokestack smoke clouds */}
            <path d="M 20 18 Q 24 10 32 12 Q 40 8 46 14 Q 52 10 56 16" stroke="#94a3b8" strokeWidth="2.5" fill="none" opacity="0.4" strokeLinecap="round" />
            {/* Sawtooth Factory Roofs */}
            <path d="M 8 50 L 8 36 L 22 28 L 22 50 L 36 28 L 36 50 L 56 28 L 56 50 Z" fill="#451a03" stroke="#d97706" strokeWidth="1.5" />
            {/* Smokestacks */}
            <rect x="14" y="20" width="5" height="16" fill="#78350f" stroke="#d97706" strokeWidth="1" />
            <rect x="42" y="16" width="6" height="20" fill="#78350f" stroke="#d97706" strokeWidth="1" />
            {/* Factory Windows grid */}
            <rect x="12" y="38" width="6" height="8" fill="#fef08a" opacity="0.85" />
            <rect x="26" y="38" width="6" height="8" fill="#fef08a" opacity="0.85" />
            <rect x="40" y="38" width="6" height="8" fill="#fef08a" opacity="0.85" />
            <line x1="6" y1="52" x2="58" y2="52" stroke="#d97706" strokeWidth="2" />
          </g>
        );

      // 4. 军事现代化 / 陆军将士 (Soldier Helmet & Laurel)
      case 'soldier_laurel':
        return (
          <g>
            <rect width="64" height="64" fill="#201a18" rx="3" />
            {/* Crossed Rifles in backdrop */}
            <line x1="12" y1="12" x2="52" y2="52" stroke="#78350f" strokeWidth="3" strokeLinecap="round" />
            <line x1="52" y1="12" x2="12" y2="52" stroke="#78350f" strokeWidth="3" strokeLinecap="round" />
            {/* 1936 Steel Helmet */}
            <path d="M 14 36 C 14 20 22 14 32 14 C 42 14 50 20 50 36 C 54 38 54 42 50 42 L 14 42 C 10 42 10 38 14 36 Z" fill="#3f3f46" stroke="#fbbf24" strokeWidth="1.5" />
            {/* Helmet Rim & Chin strap */}
            <path d="M 12 40 L 52 40" stroke="#fef08a" strokeWidth="1.5" />
            {/* Laurel sprig beneath */}
            <path d="M 16 52 C 24 58 40 58 48 52" stroke="#d97706" strokeWidth="2" fill="none" strokeLinecap="round" />
          </g>
        );

      // 5. 外交策略 / 国际同盟 (Diplomatic Handshake & Crest)
      case 'handshake_crest':
        return (
          <g>
            <rect width="64" height="64" fill="#142129" rx="3" />
            {/* Meridian globe behind */}
            <circle cx="32" cy="32" r="22" fill="#1e293b" stroke="#0284c7" strokeWidth="1" strokeDasharray="3 2" />
            <ellipse cx="32" cy="32" rx="12" ry="22" fill="none" stroke="#0284c7" strokeWidth="1" opacity="0.6" />
            {/* Clasping Diplomatic Hands */}
            <path d="M 14 36 L 24 30 L 32 34 L 40 30 L 50 36 L 46 44 L 38 40 L 32 44 L 26 40 L 18 44 Z" fill="url(#hoi4-gold-grad)" stroke="#451a03" strokeWidth="1" />
            <path d="M 28 32 L 36 32" stroke="#78350f" strokeWidth="2" strokeLinecap="round" />
            <circle cx="32" cy="18" r="4" fill="#38bdf8" stroke="#0284c7" strokeWidth="1" />
            {/* Olive branch underneath */}
            <path d="M 14 52 C 24 56 40 56 50 52" stroke="#38bdf8" strokeWidth="1.5" fill="none" />
          </g>
        );

      // 6. 中央集权 / 权力中枢 (Throne / Capitol Authority)
      case 'throne_crest':
        return (
          <g>
            <rect width="64" height="64" fill="#1e1b2e" rx="3" />
            {/* Capitol Dome Silhouette */}
            <path d="M 20 48 L 20 34 L 26 34 L 26 26 C 26 20 32 14 32 14 C 32 14 38 20 38 26 L 38 34 L 44 34 L 44 48 Z" fill="#312e81" stroke="#a78bfa" strokeWidth="1.5" />
            {/* Columns */}
            <line x1="24" y1="36" x2="24" y2="48" stroke="#c4b5fd" strokeWidth="1.5" />
            <line x1="32" y1="36" x2="32" y2="48" stroke="#c4b5fd" strokeWidth="1.5" />
            <line x1="40" y1="36" x2="40" y2="48" stroke="#c4b5fd" strokeWidth="1.5" />
            {/* Pediment & Crown */}
            <polygon points="18,34 32,24 46,34" fill="#4338ca" stroke="#fbbf24" strokeWidth="1" />
            <circle cx="32" cy="12" r="3" fill="#fbbf24" stroke="#78350f" strokeWidth="1" />
            <rect x="14" y="48" width="36" height="6" fill="#1e1b4b" stroke="#a78bfa" strokeWidth="1" />
          </g>
        );

      // 7. 完善法律体系 / 宪政司法 (Scales of Justice & Shield)
      case 'scales_shield':
        return (
          <g>
            <rect width="64" height="64" fill="#18232c" rx="3" />
            {/* Balance beam pillar */}
            <line x1="32" y1="12" x2="32" y2="52" stroke="#d97706" strokeWidth="2.5" />
            <line x1="14" y1="20" x2="50" y2="20" stroke="#d97706" strokeWidth="2" />
            <circle cx="32" cy="14" r="3" fill="#fef08a" />
            {/* Left Pan */}
            <line x1="16" y1="20" x2="12" y2="34" stroke="#94a3b8" strokeWidth="1" />
            <line x1="22" y1="20" x2="26" y2="34" stroke="#94a3b8" strokeWidth="1" />
            <path d="M 10 34 Q 19 40 28 34 Z" fill="url(#hoi4-gold-grad)" stroke="#78350f" strokeWidth="1" />
            {/* Right Pan */}
            <line x1="42" y1="20" x2="38" y2="34" stroke="#94a3b8" strokeWidth="1" />
            <line x1="48" y1="20" x2="52" y2="34" stroke="#94a3b8" strokeWidth="1" />
            <path d="M 36 34 Q 45 40 54 34 Z" fill="url(#hoi4-gold-grad)" stroke="#78350f" strokeWidth="1" />
            {/* Base pedestal */}
            <rect x="22" y="48" width="20" height="5" fill="#475569" stroke="#d97706" strokeWidth="1" />
          </g>
        );

      // 8. 弘扬国家认同 / 民族精神 (Rising Sun & Wreath)
      case 'wreath_sun':
        return (
          <g>
            <rect width="64" height="64" fill="#2a1f18" rx="3" />
            {/* Rising Sun Rays */}
            <path d="M 32 38 L 10 20 M 32 38 L 18 10 M 32 38 L 32 6 M 32 38 L 46 10 M 32 38 L 54 20" stroke="#f59e0b" strokeWidth="2" opacity="0.7" />
            <circle cx="32" cy="38" r="14" fill="#b45309" stroke="#fef08a" strokeWidth="2" />
            <circle cx="32" cy="38" r="8" fill="#fef08a" />
            {/* Wheat/Laurel Wreath */}
            <path d="M 12 44 C 12 56 22 58 32 58 C 42 58 52 56 52 44" stroke="#d97706" strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M 8 36 C 8 48 18 54 32 54" stroke="#fbbf24" strokeWidth="1.5" fill="none" />
          </g>
        );

      // 9. 基础设施建设 / 铁路干线 (Railway & Truss Bridge)
      case 'railway_bridge':
        return (
          <g>
            <rect width="64" height="64" fill="#1c2226" rx="3" />
            {/* Mountain backdrop */}
            <polygon points="4,42 22,18 40,42" fill="#334155" />
            <polygon points="26,42 46,14 62,42" fill="#1e293b" />
            {/* Truss Bridge structure */}
            <line x1="6" y1="42" x2="58" y2="42" stroke="#d97706" strokeWidth="3" />
            <polygon points="10,42 22,26 34,42 46,26 58,42" stroke="#d97706" strokeWidth="1.5" fill="none" />
            {/* Locomotive silhouette */}
            <rect x="22" y="32" width="20" height="10" fill="#0f172a" stroke="#fbbf24" strokeWidth="1" />
            <rect x="18" y="34" width="6" height="8" fill="#0f172a" />
            <circle cx="26" cy="44" r="3" fill="#fbbf24" />
            <circle cx="36" cy="44" r="3" fill="#fbbf24" />
          </g>
        );

      // 10. 工业化推进 / 重工机械 (Heavy Gear & Anvil)
      case 'gear_factory':
        return (
          <g>
            <rect width="64" height="64" fill="#241e17" rx="3" />
            {/* Large Cogwheel Gear */}
            <circle cx="32" cy="30" r="18" fill="#451a03" stroke="#d97706" strokeWidth="2" strokeDasharray="6 4" />
            <circle cx="32" cy="30" r="10" fill="#1c1917" stroke="#fbbf24" strokeWidth="1.5" />
            <circle cx="32" cy="30" r="4" fill="#fef08a" />
            {/* Heavy Forging Hammer & Anvil */}
            <rect x="14" y="46" width="36" height="8" rx="2" fill="#78350f" stroke="#fbbf24" strokeWidth="1" />
            <polygon points="12,46 22,38 42,38 52,46" fill="#57534e" stroke="#d97706" strokeWidth="1" />
            <line x1="32" y1="12" x2="32" y2="4" stroke="#fbbf24" strokeWidth="2" />
          </g>
        );

      // 11. 国家科研奠基 / 前沿科学 (Flask & Circuit)
      case 'flask_circuit':
        return (
          <g>
            <rect width="64" height="64" fill="#142328" rx="3" />
            {/* Atomic Rings */}
            <ellipse cx="32" cy="32" rx="24" ry="9" fill="none" stroke="#0284c7" strokeWidth="1.5" transform="rotate(30 32 32)" />
            <ellipse cx="32" cy="32" rx="24" ry="9" fill="none" stroke="#0284c7" strokeWidth="1.5" transform="rotate(-30 32 32)" />
            {/* Laboratory Flask */}
            <path d="M 28 14 L 36 14 L 36 24 L 46 44 C 48 48 44 52 38 52 L 26 52 C 20 52 16 48 18 44 L 28 24 Z" fill="#0369a1" stroke="#38bdf8" strokeWidth="1.5" />
            {/* Glowing Liquid */}
            <path d="M 21 42 Q 32 46 43 42 L 40 48 C 38 50 36 50 32 50 C 28 50 26 50 24 48 Z" fill="#38bdf8" opacity="0.8" />
            <circle cx="32" cy="32" r="3.5" fill="#fef08a" stroke="#d97706" strokeWidth="1" />
          </g>
        );

      // 12. 扩充陆军战备 / 步兵师团 (Crossed Sabers & Infantry Crest)
      case 'swords_crest':
        return (
          <g>
            <rect width="64" height="64" fill="#261b18" rx="3" />
            {/* Crossed Broadswords */}
            <path d="M 12 12 L 24 24 M 40 40 L 52 52" stroke="#e2e8f0" strokeWidth="3" strokeLinecap="round" />
            <path d="M 52 12 L 40 24 M 24 40 L 12 52" stroke="#e2e8f0" strokeWidth="3" strokeLinecap="round" />
            <line x1="14" y1="14" x2="50" y2="50" stroke="#94a3b8" strokeWidth="1.5" />
            <line x1="50" y1="14" x2="14" y2="50" stroke="#94a3b8" strokeWidth="1.5" />
            {/* Golden Guard & Pommel */}
            <circle cx="12" cy="12" r="3" fill="#fbbf24" stroke="#78350f" strokeWidth="1" />
            <circle cx="52" cy="12" r="3" fill="#fbbf24" stroke="#78350f" strokeWidth="1" />
            {/* Central Army Shield */}
            <polygon points="32,20 44,26 44,38 32,46 20,38 20,26" fill="#991b1b" stroke="#fbbf24" strokeWidth="1.5" />
            <polygon points="32,26 34,31 39,31 35,34 37,39 32,36 27,39 29,34 25,31 30,31" fill="#fef08a" />
          </g>
        );

      // 13. 海军舰队建设 / 战舰主力 (Battleship & Anchor)
      case 'warship_anchor':
        return (
          <g>
            <rect width="64" height="64" fill="#13232e" rx="3" />
            {/* Ocean Waves */}
            <path d="M 4 48 Q 18 42 32 48 Q 46 54 60 48" stroke="#0284c7" strokeWidth="2" fill="none" />
            {/* Battleship Profile with Heavy Turrets */}
            <path d="M 8 44 L 14 36 L 50 36 L 56 44 Z" fill="#334155" stroke="#94a3b8" strokeWidth="1.5" />
            <rect x="22" y="28" width="16" height="8" fill="#475569" stroke="#94a3b8" strokeWidth="1" />
            {/* Heavy Gun Barrels */}
            <line x1="16" y1="36" x2="6" y2="32" stroke="#e2e8f0" strokeWidth="2" strokeLinecap="round" />
            <line x1="44" y1="36" x2="56" y2="32" stroke="#e2e8f0" strokeWidth="2" strokeLinecap="round" />
            {/* Admiralty Anchor */}
            <path d="M 24 12 C 24 8 40 8 40 12" stroke="#fbbf24" strokeWidth="1.5" fill="none" />
            <circle cx="32" cy="14" r="3" fill="none" stroke="#fbbf24" strokeWidth="1.5" />
          </g>
        );

      // 14. 空军战术发展 / 鹰击长空 (Fighter Wings & Roundel)
      case 'fighter_wings':
        return (
          <g>
            <rect width="64" height="64" fill="#192833" rx="3" />
            {/* Cloud contours */}
            <path d="M 8 20 C 14 16 26 16 32 20" stroke="#64748b" strokeWidth="1.5" fill="none" opacity="0.5" />
            {/* 1936 Monoplane Fighter Top View */}
            {/* Fuselage */}
            <ellipse cx="32" cy="32" rx="4" ry="18" fill="#475569" stroke="#e2e8f0" strokeWidth="1.5" />
            {/* Swept Wings */}
            <path d="M 6 30 L 32 26 L 58 30 L 52 36 L 32 32 L 12 36 Z" fill="#334155" stroke="#fbbf24" strokeWidth="1.5" />
            {/* Tail wing */}
            <path d="M 22 46 L 32 44 L 42 46 L 38 49 L 32 48 L 26 49 Z" fill="#334155" stroke="#e2e8f0" strokeWidth="1" />
            {/* Propeller Disk */}
            <ellipse cx="32" cy="14" rx="8" ry="2" fill="none" stroke="#fef08a" strokeWidth="1.5" opacity="0.8" />
            {/* National Roundel on wings */}
            <circle cx="16" cy="32" r="3" fill="#b91c1c" stroke="#fef08a" strokeWidth="1" />
            <circle cx="48" cy="32" r="3" fill="#b91c1c" stroke="#fef08a" strokeWidth="1" />
          </g>
        );

      // 15. 区域多边合作 / 和平自贸 (Peace Dove & Olive Branch)
      case 'peace_dove':
        return (
          <g>
            <rect width="64" height="64" fill="#17242e" rx="3" />
            {/* Peace Dove Silhouette with Olive Branch */}
            <path d="M 16 38 C 22 24 38 18 46 22 C 40 28 36 34 32 38 L 48 34 C 44 42 36 46 26 44 L 16 50 Z" fill="#e2e8f0" stroke="#38bdf8" strokeWidth="1.5" />
            <circle cx="43" cy="23" r="1.5" fill="#0f172a" />
            {/* Olive branch in beak */}
            <path d="M 46 22 Q 52 18 56 20 M 50 19 L 52 16 M 53 20 L 55 18" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M 12 46 C 24 54 40 54 52 46" stroke="#0284c7" strokeWidth="1.5" fill="none" />
          </g>
        );

      // 16. 战略同盟构建 / 集体安全 (Allied Shields Linked)
      case 'shield_alliance':
        return (
          <g>
            <rect width="64" height="64" fill="#1a222f" rx="3" />
            {/* Left Allied Shield */}
            <path d="M 14 18 L 32 18 C 32 36 22 46 22 46 C 22 46 14 36 14 18 Z" fill="#1e3a8a" stroke="#60a5fa" strokeWidth="1.5" />
            {/* Right Allied Shield */}
            <path d="M 32 18 L 50 18 C 50 36 42 46 42 46 C 42 46 32 36 32 18 Z" fill="#b91c1c" stroke="#f87171" strokeWidth="1.5" />
            {/* Interlocking Steel Chain Link in Center */}
            <ellipse cx="32" cy="28" rx="8" ry="4" fill="none" stroke="#fbbf24" strokeWidth="2" />
            <circle cx="32" cy="28" r="2.5" fill="#fef08a" />
            <path d="M 18 52 C 26 56 38 56 46 52" stroke="#d97706" strokeWidth="2" fill="none" strokeLinecap="round" />
          </g>
        );

      // 17. 全球大国威望 / 世界霸权 (Globe & Imperial Crown)
      case 'globe_crown':
        return (
          <g>
            <rect width="64" height="64" fill="#241c14" rx="3" />
            {/* Imperial Crown on top */}
            <path d="M 20 22 L 24 14 L 32 20 L 40 14 L 44 22 Z" fill="url(#hoi4-gold-grad)" stroke="#78350f" strokeWidth="1.5" />
            <circle cx="24" cy="14" r="1.5" fill="#fef08a" />
            <circle cx="32" cy="12" r="2" fill="#fef08a" />
            <circle cx="40" cy="14" r="1.5" fill="#fef08a" />
            {/* World Globe */}
            <circle cx="32" cy="38" r="16" fill="#1e293b" stroke="#d97706" strokeWidth="2" />
            <ellipse cx="32" cy="38" rx="7" ry="16" fill="none" stroke="#d97706" strokeWidth="1" />
            <line x1="16" y1="38" x2="48" y2="38" stroke="#d97706" strokeWidth="1" />
            {/* Golden Radiance */}
            <path d="M 12 52 C 22 58 42 58 52 52" stroke="#fbbf24" strokeWidth="2" fill="none" strokeLinecap="round" />
          </g>
        );

      // Default historical seal
      default:
        return (
          <g>
            <rect width="64" height="64" fill="#1f2937" rx="3" />
            <circle cx="32" cy="32" r="20" fill="#374151" stroke="#d97706" strokeWidth="2" />
            <polygon points="32,18 35,27 45,27 37,33 40,42 32,36 24,42 27,33 19,27 29,27" fill="url(#hoi4-gold-grad)" stroke="#78350f" strokeWidth="0.5" />
            <circle cx="32" cy="32" r="4" fill="#fef08a" />
          </g>
        );
    }
  };

  return (
    <div
      onClick={onClick}
      className={`group flex flex-col items-center select-none cursor-pointer transition-all duration-150 relative ${
        isCompleted
          ? 'filter drop-shadow-xs'
          : isAvailable
          ? 'scale-102 filter drop-shadow-md z-10'
          : isInProgress
          ? 'scale-102 filter drop-shadow-md z-10'
          : 'opacity-70 grayscale-[60%] hover:opacity-90 hover:grayscale-[20%]'
      } ${isSelected ? 'ring-2 ring-blue-500 rounded-lg scale-105 z-20' : ''}`}
      style={{ width }}
      title={`${name} (${isCompleted ? '已实施' : isInProgress ? '实施中' : isAvailable ? '当前可制定' : '未解锁'})`}
    >
      {/* Glow aura for AVAILABLE node (视觉核心焦点) */}
      {isAvailable && (
        <div className="absolute -inset-1.5 rounded-xl bg-amber-400/25 blur-sm animate-pulse pointer-events-none -z-10" />
      )}

      {/* Glow aura for IN_PROGRESS node */}
      {isInProgress && (
        <div className="absolute -inset-1.5 rounded-xl bg-amber-500/30 blur-sm animate-pulse pointer-events-none -z-10" />
      )}

      {/* HOI4 Rectangular Card Container */}
      <div
        className={`w-full flex flex-col rounded-lg overflow-hidden border-2 transition-colors ${
          isCompleted
            ? 'bg-[#f4efe4] border-[#b45309] shadow-xs'
            : isAvailable
            ? 'bg-[#fffdfa] border-amber-500 shadow-md ring-1 ring-amber-300'
            : isInProgress
            ? 'bg-[#fffbeb] border-amber-600 shadow-md'
            : 'bg-[#ebe7df] border-slate-400/80 shadow-2xs'
        }`}
      >
        {/* Top: Square Framed Illustration Plate */}
        <div className="relative w-full aspect-square p-1.5 bg-[#1a1f26] flex items-center justify-center border-b border-slate-700/80">
          <svg
            viewBox="0 0 64 64"
            className="w-full h-full drop-shadow-xs overflow-hidden rounded-[2px]"
          >
            <defs>
              <linearGradient id="hoi4-gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="30%" stopColor="#f59e0b" />
                <stop offset="70%" stopColor="#d97706" />
                <stop offset="100%" stopColor="#78350f" />
              </linearGradient>
            </defs>
            {renderArtwork()}
          </svg>

          {/* Status Corner Stamp / Badge */}
          {isCompleted && (
            <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-emerald-600 border border-emerald-300 text-white flex items-center justify-center shadow-xs">
              <Check className="w-2.5 h-2.5 stroke-[3]" />
            </div>
          )}

          {isAvailable && (
            <div className="absolute top-1 right-1 px-1 py-0.2 rounded bg-amber-500 border border-amber-200 text-slate-950 font-black text-[8px] font-mono tracking-tighter flex items-center gap-0.5 shadow-xs animate-pulse">
              <Sparkles className="w-2 h-2" />
              可制定
            </div>
          )}

          {isInProgress && (
            <div className="absolute top-1 right-1 px-1 py-0.2 rounded bg-amber-600 text-white font-bold text-[8px] font-mono shadow-xs animate-pulse">
              实施中
            </div>
          )}

          {/* Construction Factory Badge (建设样国策专属徽章) */}
          {constructionBonus && ((constructionBonus.civilianFactories || 0) > 0 || (constructionBonus.militaryFactories || 0) > 0) && (
            <div className="absolute bottom-1 left-1 px-1 py-0.5 rounded bg-slate-900/90 border border-amber-500/80 text-[8px] font-mono font-bold tracking-tight text-amber-300 flex items-center gap-0.5 shadow-sm">
              <span className="text-[9px]">🏭</span>
              <span>
                {(constructionBonus.civilianFactories || 0) > 0 ? `+${constructionBonus.civilianFactories}民` : ''}
                {(constructionBonus.civilianFactories || 0) > 0 && (constructionBonus.militaryFactories || 0) > 0 ? '/' : ''}
                {(constructionBonus.militaryFactories || 0) > 0 ? `+${constructionBonus.militaryFactories}军` : ''}
              </span>
            </div>
          )}
        </div>

        {/* Bottom: HOI4 Focus Nameplate & Days strip */}
        <div
          className={`p-1.5 flex flex-col items-center justify-between text-center min-h-[44px] ${
            isCompleted
              ? 'bg-gradient-to-b from-[#f8f5ee] to-[#ede7d8] text-amber-950'
              : isAvailable
              ? 'bg-gradient-to-b from-[#fffbf0] to-[#fef3c7] text-amber-950 font-bold'
              : isInProgress
              ? 'bg-gradient-to-b from-[#fffbeb] to-[#fef08a] text-amber-950 font-bold'
              : 'bg-gradient-to-b from-[#f1ede5] to-[#e4ded4] text-slate-700'
          }`}
        >
          <span className="text-[11px] font-bold leading-tight line-clamp-2 font-serif tracking-tight">
            {name}
          </span>

          {/* Bottom Micro Status Bar */}
          <div className="mt-1 w-full flex items-center justify-center gap-1 border-t border-black/10 pt-0.5 text-[9px] font-mono">
            {isCompleted ? (
              <span className="text-emerald-800 font-bold flex items-center gap-1">
                <span>已生效</span>
                {constructionBonus && ((constructionBonus.civilianFactories || 0) > 0 || (constructionBonus.militaryFactories || 0) > 0) && (
                  <span className="text-[8px] bg-emerald-200/80 text-emerald-900 px-0.5 rounded">
                    +{(constructionBonus.civilianFactories || 0) + (constructionBonus.militaryFactories || 0)}厂
                  </span>
                )}
              </span>
            ) : isInProgress ? (
              <span className="text-amber-700 font-bold">进行中</span>
            ) : isAvailable ? (
              <span className="text-amber-800 font-black flex items-center gap-0.5">
                <span>{durationDays}天</span>
                <span className="text-[8px] bg-amber-400/80 px-1 rounded text-amber-950">可签署</span>
              </span>
            ) : (
              <span className="text-slate-500 font-medium">{durationDays}天</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
