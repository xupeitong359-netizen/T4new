export type MapVisualTheme = 'white' | 'grey';

export interface MapThemeConfig {
  id: MapVisualTheme;
  name: string;
  shortName: string;
  ocean: string;            // 海洋
  land: string;             // 陆地 (中立/未被占领领土)
  countryBorder: string;    // 国家边界 (主权边界)
  provinceBorder: string;   // 省级边界 (内部细分地块边界)
  coastline: string;        // 海岸线 (陆海接触带)
  grid: string;             // 坐标网格虚线
  seaHatchStroke: string;   // 海洋微质感线条
  containerBg: string;      // 外层视口底色
  
  // UI 元素配色与质感
  uiPillBg: string;         // 悬浮面板背景色
  uiBorder: string;         // 面板边框
  uiText: string;           // 主文字色
  uiTextMuted: string;      // 次级文字色
  uiBtnHover: string;       // 按钮悬浮底色
  
  // 地图上国家标注文字与阴影
  labelColor: string;
  labelStroke: string;
  
  // 交互高亮状态
  selectionHighlight: string;
  selectionStroke: string;
  hoverLandFill: string;
  hoverLandStroke: string;
}

export const MAP_THEMES: Record<MapVisualTheme, MapThemeConfig> = {
  white: {
    id: 'white',
    name: '纯白极简',
    shortName: '纯白',
    ocean: '#E3EDF6',        // 高级北欧天青水蓝，通透清亮，海陆轮廓一目了然
    land: '#FFFFFF',         // 纯白中立陆地
    countryBorder: '#475569',// 深色主权国界，边界感坚实鲜明
    provinceBorder: '#94A3B8',// 清晰省界网格 (微调提升对比度)
    coastline: '#64748B',
    grid: 'rgba(148, 163, 184, 0.35)',
    seaHatchStroke: 'rgba(148, 163, 184, 0.3)',
    containerBg: '#E3EDF6',
    
    uiPillBg: 'bg-white/95 backdrop-blur-md',
    uiBorder: 'border-slate-200',
    uiText: 'text-slate-800',
    uiTextMuted: 'text-slate-500',
    uiBtnHover: 'hover:bg-slate-100',
    
    labelColor: '#1E293B',
    labelStroke: 'rgba(255, 255, 255, 0.9)',
    
    selectionHighlight: '#BFDBFE',
    selectionStroke: '#2563EB',
    hoverLandFill: '#EFF6FF',
    hoverLandStroke: '#3B82F6',
  },
  grey: {
    id: 'grey',
    name: '战术深色',
    shortName: '深色',
    ocean: '#090e17',        // 战术深海暗夜蓝
    land: '#141c2b',         // 暗夜深灰黑中立陆地 (Dark Slate)
    countryBorder: '#94a3b8',// 醒目的白银/浅亮主权国界
    provinceBorder: '#1e293b',// 细致深色内部省界
    coastline: '#334155',
    grid: 'rgba(148, 163, 184, 0.12)',
    seaHatchStroke: 'rgba(51, 65, 85, 0.35)',
    containerBg: '#060a12',
    
    uiPillBg: 'bg-slate-950/90 backdrop-blur-md',
    uiBorder: 'border-slate-800',
    uiText: 'text-slate-100',
    uiTextMuted: 'text-slate-400',
    uiBtnHover: 'hover:bg-slate-800',
    
    labelColor: '#F8FAFC',
    labelStroke: 'rgba(9, 14, 23, 0.95)',
    
    selectionHighlight: '#1e3a8a',
    selectionStroke: '#38bdf8',
    hoverLandFill: '#1f293d',
    hoverLandStroke: '#38bdf8',
  },
};

const THEME_STORAGE_KEY = 'virtual_world_map_theme_v2';

export function getSavedMapTheme(): MapVisualTheme {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'white' || saved === 'grey') {
      return saved;
    }
  } catch {
    // ignore
  }
  return 'white';
}

export function saveMapTheme(theme: MapVisualTheme): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // ignore
  }
}

/**
 * 转换国家旗帜色为现代 GIS 地理信息系统专用的柔和且对比分明的底色
 * 保证色彩饱满可辨，同时避免荧光刺眼，边界感分明
 */
export function toModernMapColor(colorHex?: string, theme: MapVisualTheme = 'white'): string {
  const raw = (colorHex || '#6366f1').replace('#', '').trim();
  if (!/^[0-9a-fA-F]{6}$/.test(raw)) {
    return theme === 'white' ? '#E2E8F0' : '#334155';
  }

  const r = parseInt(raw.slice(0, 2), 16) / 255;
  const g = parseInt(raw.slice(2, 4), 16) / 255;
  const b = parseInt(raw.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let hue = 0;
  if (delta) {
    if (max === r) hue = ((g - b) / delta) % 6;
    else if (max === g) hue = (b - r) / delta + 2;
    else hue = (r - g) / delta + 4;
    hue *= 60;
    if (hue < 0) hue += 360;
  }

  if (theme === 'white') {
    // 白色主题：饱满雅致、辨识度极高的水彩版图色（饱和度 58%，明度 84%）
    const sat = delta === 0 ? 8 : 58;
    const light = 84;
    return `hsl(${Math.round(hue)}, ${sat}%, ${light}%)`;
  } else {
    // 战术深色主题：沉稳的暗色调军用沙盘主权着色，避免过度刺眼，让暗色质感贯穿全省份
    const sat = delta === 0 ? 10 : 45;
    const light = 26;
    return `hsl(${Math.round(hue)}, ${sat}%, ${light}%)`;
  }
}
