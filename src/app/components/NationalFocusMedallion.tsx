import React from 'react';
import { FocusStatus } from '../types';

interface NationalFocusMedallionProps {
  iconType: string;
  name: string;
  status: FocusStatus;
  isSelected?: boolean;
  tier?: number;
  size?: number; // default 64
  progress?: number; // 0~100 for in_progress
  onClick?: () => void;
}

export const NationalFocusMedallion: React.FC<NationalFocusMedallionProps> = ({
  iconType,
  name,
  status,
  isSelected = false,
  tier = 1,
  size = 64,
  progress = 0,
  onClick,
}) => {
  const isCompleted = status === 'completed';
  const isInProgress = status === 'in_progress';
  const isAvailable = status === 'available';
  const isLocked = status === 'locked';

  // Metallic color palettes
  const isGolden = tier === 0 || (!isLocked && (isCompleted || isInProgress || isAvailable));

  // Determine outer ring gradients and filters
  const goldGradientId = `gold-grad-${iconType}`;
  const silverGradientId = `silver-grad-${iconType}`;
  const diskGradientId = `disk-grad-${iconType}`;

  return (
    <div
      onClick={onClick}
      className={`group flex flex-col items-center justify-center cursor-pointer transition-all duration-200 select-none relative ${
        isSelected ? 'scale-105' : 'hover:scale-102'
      }`}
      style={{ width: size + 36, minHeight: size + 38 }}
      title={`${name} (${isCompleted ? '已实施' : isInProgress ? '实施中' : isAvailable ? '可制定' : '未解锁'})`}
    >
      {/* Halo / Glow effect when selected */}
      {isSelected && (
        <div
          className="absolute -top-2 w-20 h-20 rounded-full blur-md -z-10 animate-pulse pointer-events-none"
          style={{
            background: isGolden
              ? 'radial-gradient(circle, rgba(245, 158, 11, 0.45) 0%, rgba(217, 119, 6, 0) 70%)'
              : 'radial-gradient(circle, rgba(99, 102, 241, 0.35) 0%, rgba(99, 102, 241, 0) 70%)',
          }}
        />
      )}

      {/* SVG Medallion Emblem */}
      <div className="relative flex items-center justify-center">
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          className={`drop-shadow-md transition-transform ${
            isLocked ? 'opacity-75 saturate-50' : 'opacity-100'
          }`}
        >
          <defs>
            {/* Rich Gold Gradient */}
            <linearGradient id={goldGradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="25%" stopColor="#eab308" />
              <stop offset="50%" stopColor="#ca8a04" />
              <stop offset="75%" stopColor="#a16207" />
              <stop offset="100%" stopColor="#713f12" />
            </linearGradient>

            {/* Silver / Chrome Gradient */}
            <linearGradient id={silverGradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f8fafc" />
              <stop offset="30%" stopColor="#cbd5e1" />
              <stop offset="60%" stopColor="#94a3b8" />
              <stop offset="100%" stopColor="#475569" />
            </linearGradient>

            {/* Inner Dark Radial Gradient */}
            <radialGradient id={diskGradientId} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={isGolden ? '#1e293b' : '#334155'} />
              <stop offset="70%" stopColor={isGolden ? '#0f172a' : '#1e293b'} />
              <stop offset="100%" stopColor={isGolden ? '#020617' : '#0f172a'} />
            </radialGradient>

            {/* In-progress stroke gradient */}
            <linearGradient id="progress-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>
          </defs>

          {/* Outer Laurel / Radiance Wreath Teeth */}
          <g
            stroke={isGolden ? `url(#${goldGradientId})` : `url(#${silverGradientId})`}
            strokeWidth="2"
            fill="none"
          >
            {/* 8-pointed star burst / gear ring */}
            <circle
              cx="50"
              cy="50"
              r="47"
              strokeDasharray={isGolden ? '4 3' : '3 4'}
              strokeWidth={isGolden ? '2.5' : '1.5'}
              opacity="0.85"
            />
            <circle
              cx="50"
              cy="50"
              r="43"
              strokeWidth="1.5"
              fill={isGolden ? '#854d0e' : '#475569'}
              fillOpacity="0.25"
            />
          </g>

          {/* Outer Ornamental Laurel Leaves around the bottom rim */}
          <path
            d="M 16 58 C 12 72 25 86 50 89 C 75 86 88 72 84 58"
            stroke={isGolden ? `url(#${goldGradientId})` : `url(#${silverGradientId})`}
            strokeWidth="3.5"
            fill="none"
            strokeLinecap="round"
          />

          {/* Outer Rim Bezel */}
          <circle
            cx="50"
            cy="50"
            r="38"
            fill={`url(#${diskGradientId})`}
            stroke={isGolden ? `url(#${goldGradientId})` : `url(#${silverGradientId})`}
            strokeWidth={isSelected ? '3.5' : '2.5'}
          />

          {/* Inner Decorative Ring */}
          <circle
            cx="50"
            cy="50"
            r="32"
            fill="none"
            stroke={isGolden ? '#ca8a04' : '#64748b'}
            strokeWidth="1"
            strokeDasharray="2 2"
            opacity="0.7"
          />

          {/* Medallion Core Icon / Artwork */}
          <g
            transform="translate(26, 26) scale(0.48)"
            fill={isGolden ? '#fef08a' : '#cbd5e1'}
            stroke={isGolden ? '#ca8a04' : '#64748b'}
            strokeWidth="1.5"
          >
            {renderMedallionVector(iconType, isGolden)}
          </g>

          {/* In-Progress Outer Circular Progress Indicator */}
          {isInProgress && (
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="none"
              stroke="url(#progress-grad)"
              strokeWidth="3.5"
              strokeDasharray={`${(progress / 100) * 276.4} 276.4`}
              strokeLinecap="round"
              transform="rotate(-90 50 50)"
              className="animate-spin-slow"
            />
          )}

          {/* Completed Golden Star Crest at Top Center */}
          {isCompleted && (
            <g transform="translate(43, 2)">
              <polygon
                points="7,0 9,5 14,5 10,8 12,13 7,10 2,13 4,8 0,5 5,5"
                fill="#facc15"
                stroke="#854d0e"
                strokeWidth="0.8"
              />
            </g>
          )}
        </svg>

        {/* Status Indicator Tag Overlay */}
        {isCompleted && (
          <div className="absolute -bottom-1 -right-1 w-4.5 h-4.5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold border border-white shadow-xs">
            ✓
          </div>
        )}
        {isInProgress && (
          <div className="absolute -bottom-1 -right-1 px-1 py-0.2 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-[9px] font-black border border-amber-200 shadow-xs animate-pulse">
            进行
          </div>
        )}
        {isLocked && (
          <div className="absolute -bottom-1 -right-1 w-4.5 h-4.5 rounded-full bg-slate-600 text-slate-200 flex items-center justify-center text-[9px] font-bold border border-slate-400 shadow-xs">
            🔒
          </div>
        )}
      </div>

      {/* Label Capsule underneath */}
      <div
        className={`mt-1.5 px-2 py-0.5 rounded text-[11px] font-bold text-center tracking-tight transition-all truncate max-w-[108px] ${
          isSelected
            ? 'bg-amber-100/90 text-amber-950 shadow-xs border border-amber-300 font-black'
            : isCompleted
            ? 'text-slate-900 group-hover:text-amber-800'
            : isInProgress
            ? 'text-amber-700 font-extrabold'
            : isAvailable
            ? 'text-slate-800 group-hover:text-slate-950 font-semibold'
            : 'text-slate-400 font-medium'
        }`}
      >
        {name}
      </div>
    </div>
  );
};

/**
 * High-detail vector icons for focus medallion emblems
 */
function renderMedallionVector(iconType: string, isGolden: boolean) {
  switch (iconType) {
    case 'compass_gold': // 决策国家未来 (8-pointed helm / compass)
      return (
        <g strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          {/* Compass Rose / Star */}
          <polygon points="50,10 60,40 90,50 60,60 50,90 40,60 10,50 40,40" fill={isGolden ? '#facc15' : '#e2e8f0'} />
          <polygon points="50,10 50,50 90,50 50,50 50,90 50,50 10,50 50,50" stroke={isGolden ? '#78350f' : '#334155'} />
          <circle cx="50" cy="50" r="8" fill={isGolden ? '#78350f' : '#1e293b'} />
          <circle cx="50" cy="50" r="3" fill="#fff" />
          {/* Helm spokes */}
          <line x1="50" y1="0" x2="50" y2="100" stroke={isGolden ? '#ca8a04' : '#64748b'} strokeWidth="2" strokeDasharray="3 3" />
          <line x1="0" y1="50" x2="100" y2="50" stroke={isGolden ? '#ca8a04' : '#64748b'} strokeWidth="2" strokeDasharray="3 3" />
        </g>
      );

    case 'shield_star': // 巩固国家 (Royal Shield & Star)
      return (
        <g>
          <path
            d="M 20 20 L 80 20 C 80 55 50 85 50 85 C 50 85 20 55 20 20 Z"
            fill={isGolden ? '#f59e0b' : '#94a3b8'}
            stroke={isGolden ? '#78350f' : '#1e293b'}
            strokeWidth="4"
          />
          <path
            d="M 30 28 L 70 28 C 70 52 50 72 50 72 C 50 72 30 52 30 28 Z"
            fill={isGolden ? '#fef08a' : '#f1f5f9'}
          />
          <polygon
            points="50,35 54,45 65,45 56,52 60,63 50,56 40,63 44,52 35,45 46,45"
            fill={isGolden ? '#b45309' : '#475569'}
          />
        </g>
      );

    case 'factory_city': // 经济发展 (Industrial City Skyline)
      return (
        <g>
          <rect x="20" y="45" width="16" height="35" fill={isGolden ? '#fbbf24' : '#cbd5e1'} />
          <rect x="42" y="30" width="20" height="50" fill={isGolden ? '#f59e0b' : '#94a3b8'} />
          <rect x="68" y="40" width="14" height="40" fill={isGolden ? '#d97706' : '#64748b'} />
          <polygon points="52,15 48,30 56,30" fill={isGolden ? '#fef08a' : '#f8fafc'} />
          <line x1="28" y1="35" x2="28" y2="45" stroke={isGolden ? '#fef08a' : '#f8fafc'} strokeWidth="3" />
          <line x1="75" y1="30" x2="75" y2="40" stroke={isGolden ? '#fef08a' : '#f8fafc'} strokeWidth="3" />
          <circle cx="52" cy="50" r="7" fill={isGolden ? '#78350f' : '#1e293b'} />
          <circle cx="52" cy="50" r="3" fill="#fff" />
        </g>
      );

    case 'soldier_laurel': // 军事现代化 (Commander / Soldier)
      return (
        <g>
          <ellipse cx="50" cy="38" rx="20" ry="16" fill={isGolden ? '#fbbf24' : '#cbd5e1'} />
          <path d="M 28 38 C 28 22 72 22 72 38 Z" fill={isGolden ? '#d97706' : '#64748b'} stroke={isGolden ? '#78350f' : '#1e293b'} strokeWidth="3" />
          <rect x="25" y="36" width="50" height="6" rx="2" fill={isGolden ? '#78350f' : '#334155'} />
          <circle cx="50" cy="46" r="10" fill={isGolden ? '#fef08a' : '#e2e8f0'} />
          <path d="M 30 75 C 30 58 70 58 70 75 Z" fill={isGolden ? '#b45309' : '#475569'} />
          <polygon points="50,20 53,26 60,26 55,30 57,36 50,32 43,36 45,30 40,26 47,26" fill="#facc15" />
        </g>
      );

    case 'handshake_crest': // 外交策略 (Handshake Cooperation)
      return (
        <g strokeLinecap="round" strokeLinejoin="round" strokeWidth="4">
          <path d="M 15 50 L 35 35 L 50 48 L 40 60 Z" fill={isGolden ? '#fbbf24' : '#cbd5e1'} stroke={isGolden ? '#78350f' : '#1e293b'} />
          <path d="M 85 50 L 65 35 L 50 48 L 60 60 Z" fill={isGolden ? '#f59e0b' : '#94a3b8'} stroke={isGolden ? '#78350f' : '#1e293b'} />
          <path d="M 38 48 L 52 60 L 62 50" stroke={isGolden ? '#fef08a' : '#fff'} strokeWidth="3" fill="none" />
          <circle cx="50" cy="50" r="28" fill="none" stroke={isGolden ? '#ca8a04' : '#64748b'} strokeWidth="2" strokeDasharray="3 3" />
        </g>
      );

    case 'throne_crest': // 加强中央集权
      return (
        <g>
          <path d="M 30 75 L 30 35 L 45 48 L 50 25 L 55 48 L 70 35 L 70 75 Z" fill={isGolden ? '#f59e0b' : '#94a3b8'} stroke={isGolden ? '#78350f' : '#1e293b'} strokeWidth="3" />
          <circle cx="50" cy="60" r="8" fill={isGolden ? '#fef08a' : '#f8fafc'} />
        </g>
      );

    case 'scales_shield': // 完善法律体系
      return (
        <g strokeWidth="3" stroke={isGolden ? '#78350f' : '#1e293b'}>
          <line x1="50" y1="20" x2="50" y2="75" />
          <line x1="25" y1="35" x2="75" y2="35" />
          <path d="M 20 55 C 20 45 40 45 40 55 Z" fill={isGolden ? '#fbbf24' : '#cbd5e1'} />
          <path d="M 60 55 C 60 45 80 45 80 55 Z" fill={isGolden ? '#fbbf24' : '#cbd5e1'} />
          <line x1="30" y1="35" x2="30" y2="46" />
          <line x1="70" y1="35" x2="70" y2="46" />
        </g>
      );

    case 'wreath_sun': // 文化认同
      return (
        <g>
          <circle cx="50" cy="50" r="14" fill={isGolden ? '#f59e0b' : '#94a3b8'} stroke={isGolden ? '#78350f' : '#1e293b'} strokeWidth="2" />
          {/* Radiant Sun Rays */}
          <line x1="50" y1="22" x2="50" y2="30" stroke={isGolden ? '#fef08a' : '#cbd5e1'} strokeWidth="4" strokeLinecap="round" />
          <line x1="50" y1="70" x2="50" y2="78" stroke={isGolden ? '#fef08a' : '#cbd5e1'} strokeWidth="4" strokeLinecap="round" />
          <line x1="22" y1="50" x2="30" y2="50" stroke={isGolden ? '#fef08a' : '#cbd5e1'} strokeWidth="4" strokeLinecap="round" />
          <line x1="70" y1="50" x2="78" y2="50" stroke={isGolden ? '#fef08a' : '#cbd5e1'} strokeWidth="4" strokeLinecap="round" />
        </g>
      );

    case 'railway_bridge': // 基础设施建设
      return (
        <g strokeWidth="3" stroke={isGolden ? '#78350f' : '#1e293b'}>
          <line x1="30" y1="20" x2="20" y2="80" stroke={isGolden ? '#fbbf24' : '#cbd5e1'} strokeWidth="4" />
          <line x1="70" y1="20" x2="80" y2="80" stroke={isGolden ? '#fbbf24' : '#cbd5e1'} strokeWidth="4" />
          <line x1="28" y1="30" x2="72" y2="30" stroke={isGolden ? '#fef08a' : '#f8fafc'} />
          <line x1="26" y1="45" x2="74" y2="45" stroke={isGolden ? '#fef08a' : '#f8fafc'} />
          <line x1="24" y1="60" x2="76" y2="60" stroke={isGolden ? '#fef08a' : '#f8fafc'} />
          <line x1="22" y1="75" x2="78" y2="75" stroke={isGolden ? '#fef08a' : '#f8fafc'} />
        </g>
      );

    case 'gear_factory': // 工业化推进
      return (
        <g>
          <circle cx="50" cy="50" r="18" fill="none" stroke={isGolden ? '#f59e0b' : '#94a3b8'} strokeWidth="8" strokeDasharray="6 3" />
          <circle cx="50" cy="50" r="8" fill={isGolden ? '#fef08a' : '#f8fafc'} stroke={isGolden ? '#78350f' : '#1e293b'} strokeWidth="2" />
        </g>
      );

    case 'cargo_ship': // 贸易扩张
      return (
        <g>
          <path d="M 18 55 L 82 55 L 72 75 L 28 75 Z" fill={isGolden ? '#f59e0b' : '#94a3b8'} stroke={isGolden ? '#78350f' : '#1e293b'} strokeWidth="3" />
          <rect x="35" y="38" width="12" height="15" fill={isGolden ? '#fef08a' : '#f1f5f9'} />
          <rect x="52" y="42" width="14" height="11" fill={isGolden ? '#fbbf24' : '#cbd5e1'} />
          <line x1="40" y1="26" x2="40" y2="38" stroke={isGolden ? '#78350f' : '#1e293b'} strokeWidth="3" />
        </g>
      );

    case 'swords_crest': // 扩充陆军
      return (
        <g strokeWidth="3" stroke={isGolden ? '#78350f' : '#1e293b'}>
          <line x1="20" y1="20" x2="80" y2="80" stroke={isGolden ? '#fbbf24' : '#cbd5e1'} strokeWidth="5" strokeLinecap="round" />
          <line x1="80" y1="20" x2="20" y2="80" stroke={isGolden ? '#fbbf24' : '#cbd5e1'} strokeWidth="5" strokeLinecap="round" />
          <circle cx="50" cy="50" r="9" fill={isGolden ? '#fef08a' : '#f8fafc'} />
        </g>
      );

    case 'warship_anchor': // 海军建设
      return (
        <g strokeWidth="4" stroke={isGolden ? '#78350f' : '#1e293b'}>
          <circle cx="50" cy="30" r="7" fill="none" />
          <line x1="50" y1="37" x2="50" y2="78" />
          <line x1="32" y1="46" x2="68" y2="46" />
          <path d="M 22 62 C 22 82 78 82 78 62" fill="none" strokeLinecap="round" />
        </g>
      );

    case 'fighter_wings': // 空军发展
      return (
        <g>
          <path d="M 50 15 L 55 50 L 85 62 L 85 70 L 55 64 L 54 80 L 64 85 L 64 90 L 50 87 L 36 90 L 36 85 L 46 80 L 45 64 L 15 70 L 15 62 L 45 50 Z" fill={isGolden ? '#fbbf24' : '#cbd5e1'} stroke={isGolden ? '#78350f' : '#1e293b'} strokeWidth="2" />
        </g>
      );

    case 'peace_dove': // 区域合作
      return (
        <g>
          <path d="M 30 50 C 30 35 48 30 65 35 C 75 40 80 50 75 60 C 65 72 45 70 35 60 Z" fill={isGolden ? '#fef08a' : '#f8fafc'} stroke={isGolden ? '#78350f' : '#1e293b'} strokeWidth="2" />
          <path d="M 45 40 Q 60 20 78 25" stroke={isGolden ? '#ca8a04' : '#94a3b8'} strokeWidth="3" fill="none" strokeLinecap="round" />
        </g>
      );

    case 'shield_alliance': // 战略结盟
      return (
        <g>
          <path d="M 30 30 L 70 30 L 70 58 C 70 70 50 82 50 82 C 50 82 30 70 30 58 Z" fill={isGolden ? '#f59e0b' : '#94a3b8'} stroke={isGolden ? '#78350f' : '#1e293b'} strokeWidth="3" />
          <polygon points="50,40 54,50 64,50 56,56 59,66 50,60 41,66 44,56 36,50 46,50" fill="#fef08a" />
        </g>
      );

    case 'globe_crown': // 全球影响力
      return (
        <g>
          <circle cx="50" cy="54" r="22" fill={isGolden ? '#fbbf24' : '#cbd5e1'} stroke={isGolden ? '#78350f' : '#1e293b'} strokeWidth="3" />
          <ellipse cx="50" cy="54" rx="10" ry="22" fill="none" stroke={isGolden ? '#78350f' : '#1e293b'} strokeWidth="2" />
          <line x1="28" y1="54" x2="72" y2="54" stroke={isGolden ? '#78350f' : '#1e293b'} strokeWidth="2" />
          <polygon points="40,24 50,15 60,24 57,28 43,28" fill="#facc15" stroke="#78350f" strokeWidth="2" />
        </g>
      );

    // Deep Tier 3 & Tier 4 icons
    case 'megaphone_shield': // 宣传统合
      return (
        <g strokeLinecap="round" strokeLinejoin="round">
          <path d="M 25 45 L 45 35 L 75 25 L 75 75 L 45 65 L 25 55 Z" fill={isGolden ? '#fbbf24' : '#cbd5e1'} stroke={isGolden ? '#78350f' : '#1e293b'} strokeWidth="3" />
          <path d="M 30 55 L 35 75 L 45 75 L 40 60" fill={isGolden ? '#f59e0b' : '#94a3b8'} stroke={isGolden ? '#78350f' : '#1e293b'} strokeWidth="3" />
          <path d="M 82 38 Q 90 50 82 62" fill="none" stroke={isGolden ? '#fef08a' : '#f8fafc'} strokeWidth="3" />
        </g>
      );

    case 'eye_lock': // 国家安全保卫局 / 秘密警察
      return (
        <g strokeLinecap="round" strokeLinejoin="round">
          <path d="M 15 50 Q 50 20 85 50 Q 50 80 15 50 Z" fill={isGolden ? '#f59e0b' : '#94a3b8'} stroke={isGolden ? '#78350f' : '#1e293b'} strokeWidth="3" />
          <circle cx="50" cy="50" r="14" fill={isGolden ? '#1e293b' : '#0f172a'} />
          <circle cx="50" cy="50" r="6" fill={isGolden ? '#fef08a' : '#38bdf8'} />
        </g>
      );

    case 'torch_book': // 国家教育大纲
      return (
        <g strokeLinecap="round" strokeLinejoin="round">
          <path d="M 20 68 Q 50 60 50 80 Q 50 60 80 68 L 80 48 Q 50 40 50 60 Q 50 40 20 48 Z" fill={isGolden ? '#fef08a' : '#f1f5f9'} stroke={isGolden ? '#78350f' : '#1e293b'} strokeWidth="3" />
          <path d="M 46 45 L 50 20 L 54 45 Z" fill={isGolden ? '#f59e0b' : '#fb923c'} stroke={isGolden ? '#78350f' : '#1e293b'} strokeWidth="2" />
          <polygon points="50,15 54,26 62,26 56,31 58,40 50,34 42,40 44,31 38,26 46,26" fill="#facc15" />
        </g>
      );

    case 'flask_circuit': // 科技突破 / 原子物理
      return (
        <g strokeLinecap="round" strokeLinejoin="round">
          <path d="M 40 20 L 60 20 L 60 38 L 82 75 C 82 82 76 85 50 85 C 24 85 18 82 18 75 L 40 38 Z" fill={isGolden ? '#f59e0b' : '#94a3b8'} stroke={isGolden ? '#78350f' : '#1e293b'} strokeWidth="3" />
          <ellipse cx="50" cy="72" rx="22" ry="7" fill={isGolden ? '#fef08a' : '#38bdf8'} opacity="0.9" />
          <circle cx="42" cy="62" r="3" fill="#fff" />
          <circle cx="58" cy="54" r="2.5" fill="#fff" />
        </g>
      );

    case 'helmet_target': // 特种作战
      return (
        <g strokeLinecap="round" strokeLinejoin="round">
          <circle cx="50" cy="50" r="30" fill="none" stroke={isGolden ? '#f59e0b' : '#94a3b8'} strokeWidth="3" />
          <line x1="50" y1="12" x2="50" y2="88" stroke={isGolden ? '#fef08a' : '#f8fafc'} strokeWidth="2.5" />
          <line x1="12" y1="50" x2="88" y2="50" stroke={isGolden ? '#fef08a' : '#f8fafc'} strokeWidth="2.5" />
          <circle cx="50" cy="50" r="12" fill={isGolden ? '#b45309' : '#e11d48'} stroke="#fff" strokeWidth="2" />
        </g>
      );

    case 'factory_shield': // 战备军工
      return (
        <g>
          <path d="M 22 25 L 78 25 C 78 58 50 85 50 85 C 50 85 22 58 22 25 Z" fill={isGolden ? '#f59e0b' : '#94a3b8'} stroke={isGolden ? '#78350f' : '#1e293b'} strokeWidth="3" />
          <rect x="35" y="40" width="12" height="24" fill={isGolden ? '#1e293b' : '#0f172a'} />
          <rect x="53" y="48" width="12" height="16" fill={isGolden ? '#1e293b' : '#0f172a'} />
          <polygon points="41,30 38,40 44,40" fill={isGolden ? '#fef08a' : '#f8fafc'} />
        </g>
      );

    case 'quill_scroll': // 外交斡旋 / 国际公约
      return (
        <g strokeLinecap="round" strokeLinejoin="round">
          <rect x="25" y="25" width="50" height="50" rx="4" fill={isGolden ? '#fef08a' : '#f1f5f9'} stroke={isGolden ? '#78350f' : '#1e293b'} strokeWidth="3" />
          <line x1="34" y1="38" x2="66" y2="38" stroke={isGolden ? '#ca8a04' : '#64748b'} strokeWidth="3" />
          <line x1="34" y1="50" x2="66" y2="50" stroke={isGolden ? '#ca8a04' : '#64748b'} strokeWidth="3" />
          <line x1="34" y1="62" x2="55" y2="62" stroke={isGolden ? '#ca8a04' : '#64748b'} strokeWidth="3" />
          <path d="M 60 20 L 78 40 L 70 44 L 56 24 Z" fill={isGolden ? '#f59e0b' : '#38bdf8'} stroke={isGolden ? '#78350f' : '#1e293b'} strokeWidth="2" />
        </g>
      );

    case 'crown_laurel': // 文化输出
      return (
        <g>
          <path d="M 25 65 L 25 35 L 38 48 L 50 25 L 62 48 L 75 35 L 75 65 Z" fill={isGolden ? '#f59e0b' : '#94a3b8'} stroke={isGolden ? '#78350f' : '#1e293b'} strokeWidth="3" />
          <circle cx="50" cy="52" r="6" fill="#fef08a" />
          <circle cx="34" cy="52" r="4" fill="#fef08a" />
          <circle cx="66" cy="52" r="4" fill="#fef08a" />
        </g>
      );

    case 'coin_vault': // 廉政与金库
      return (
        <g strokeLinecap="round" strokeLinejoin="round">
          <rect x="25" y="25" width="50" height="50" rx="8" fill={isGolden ? '#fbbf24' : '#cbd5e1'} stroke={isGolden ? '#78350f' : '#1e293b'} strokeWidth="4" />
          <circle cx="50" cy="50" r="14" fill={isGolden ? '#1e293b' : '#334155'} />
          <line x1="50" y1="36" x2="50" y2="64" stroke={isGolden ? '#fef08a' : '#f8fafc'} strokeWidth="3" />
          <line x1="36" y1="50" x2="64" y2="50" stroke={isGolden ? '#fef08a' : '#f8fafc'} strokeWidth="3" />
        </g>
      );

    default:
      return (
        <g strokeWidth="2.5" stroke={isGolden ? '#78350f' : '#334155'}>
          <circle cx="50" cy="50" r="20" fill={isGolden ? '#fef08a' : '#e2e8f0'} />
          <polygon points="50,35 55,45 65,45 57,52 60,62 50,56 40,62 43,52 35,45 45,45" fill={isGolden ? '#b45309' : '#64748b'} />
        </g>
      );
  }
}
