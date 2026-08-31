import React, { useState, useEffect } from 'react';
import mapGeoData from '../assets/hoi4_fixed_map.json';
import {
 X,
 Crown,
 Compass,
 MapPin,
 Coins,
 Languages,
 Landmark,
 Scale,
 Sparkles,
 ArrowLeft,
 Check,
 Palette,
 Search,
 Star,
 Shield,
 Pickaxe,
 Swords,
 ChevronDown,
 ChevronUp,
 ChevronRight,
 ArrowRightLeft,
 Crop,
 Heart,
 User,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { TikTokIcon } from './TikTokIcon';
import { RegimeType, IdeologyType, ProvinceData } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { renderEmblemIcon } from '../lib/icons';
import { FlagCropperModal } from './FlagCropperModal';
import { getProvinceChineseName } from '../lib/provinceTranslations';
import { isProvinceAdjacentToNation, checkProvincesContiguity } from '../lib/mapAdjacency';

interface CreateNationModalProps {
 isOpen: boolean;
 onClose: () => void;
 onSuccess: () => void;
 onEnterMapMode?: () => void;
 onMapModeChange?: (isSelecting: boolean) => void;
}

const partyToRegime: Record<'communist' | 'fascist' | 'democratic' | 'neutral', RegimeType> = {
 communist: '苏维埃代表制',
 fascist: '军政府/军国主义',
 democratic: '民主议会制',
 neutral: '君主立宪制',
};

const partyToIdeology: Record<'communist' | 'fascist' | 'democratic' | 'neutral', IdeologyType> = {
 communist: '共产主义',
 fascist: '法西斯主义',
 democratic: '民主主义',
 neutral: '中立主义',
};

const FLAG_COLORS = [
 { name: '皇家紫', value: '#6366f1' },
 { name: '帝国红', value: '#dc2626' },
 { name: '翡翠绿', value: '#059669' },
 { name: '王权金', value: '#d97706' },
 { name: '海军蓝', value: '#2563eb' },
 { name: '夜幕青', value: '#0891b2' },
 { name: '黑曜石', value: '#334155' },
 { name: '蔷薇粉', value: '#db2777' },
];

export const CreateNationModal: React.FC<CreateNationModalProps> = ({
 isOpen,
 onClose,
 onSuccess,
 onEnterMapMode,
 onMapModeChange,
}) => {
 const { user, setMyNation } = useAuth();

 const [name, setName] = useState('');
 const [capital, setCapital] = useState('');
 const [territory, setTerritory] = useState('');
 const [selectedRulingParty, setSelectedRulingParty] = useState<'communist' | 'fascist' | 'democratic' | 'neutral'>('neutral');
 const [communistPartyName, setCommunistPartyName] = useState('人民劳动共产党');
 const [fascistPartyName, setFascistPartyName] = useState('国家复兴法西斯党');
 const [democraticPartyName, setDemocraticPartyName] = useState('自由民主进步同盟');
 const [neutralPartyName, setNeutralPartyName] = useState('国家中立秩序阵线');
 const [language, setLanguage] = useState('汉语');
 const [currencyMode, setCurrencyMode] = useState<'lingyu' | 'custom'>('lingyu');
 const [customCurrencyName, setCustomCurrencyName] = useState('');
 const [currencyRate, setCurrencyRate] = useState<number>(1);
 const [flagColor, setFlagColor] = useState('#6366f1');
 const [emblemIcon, setEmblemIcon] = useState('Crown');
 const [lng, setLng] = useState('28.97');
 const [lat, setLat] = useState('41.00');

 // Flag 3:4 Cropper State
 const [isCropperOpen, setIsCropperOpen] = useState(false);
 const [cropperSourceImage, setCropperSourceImage] = useState<string | null>(null);
 const [cropperReasonNotice, setCropperReasonNotice] = useState<string>('');

 const [error, setError] = useState<string | null>(null);
 const [isLoading, setIsLoading] = useState(false);

 const [provinces, setProvinces] = useState<ProvinceData[]>([]);
 const [availableProvinces, setAvailableProvinces] = useState<any[]>([]);
 const [provinceSearch, setProvinceSearch] = useState('');

 const [isSelectingOnMap, setIsSelectingOnMap] = useState(false);
 const [mapSelectSubMode, setMapSelectSubMode] = useState<'territory' | 'capital'>('territory');
 const [isProvincesCollapsed, setIsProvincesCollapsed] = useState(true);

 const maxAllowedProvinces = user?.isLingyuBaby ? 11 : 10;

 useEffect(() => {
  onMapModeChange?.(isSelectingOnMap);
 }, [isSelectingOnMap, onMapModeChange]);

 useEffect(() => {
  const handleMapSelect = (e: any) => {
   if (!isSelectingOnMap) return;
   const { id, name } = e.detail;

   if (mapSelectSubMode === 'territory') {
    setProvinces((prev) => {
     const exists = prev.some((p) => String(p.id) === String(id) || (p.name && p.name === name));
     if (exists) {
      const next = prev.filter((p) => String(p.id) !== String(id) && p.name !== name);
      if (capital === name) {
       setCapital(next.length > 0 ? next[0].name : '');
      }
      setError(null);
      return next;
     }

     if (prev.length >= maxAllowedProvinces) {
      setError(`初始领土最多只能选择 ${maxAllowedProvinces} 个省份`);
      return prev;
     }

     // 核心判定：建国时新增省份必须与当前已有初始领土（任一已选省份）相邻！
     if (prev.length > 0) {
      const isAdjacent = isProvinceAdjacentToNation(id, prev, name) || isProvinceAdjacentToNation(name, prev);
      if (!isAdjacent) {
       setError(`【建国判定】所选省份「${name}」与已有初始领土不相邻！建国省份必须相邻连通。`);
       return prev;
      }
     }

     setError(null);
     const next = [...prev, { id, name, isCore: true, civilianFactories: 1, militaryFactories: 1 }];
     if (!capital) {
      setCapital(name);
     }
     return next;
    });
   } else if (mapSelectSubMode === 'capital') {
    setCapital(name);
    setProvinces((prev) => {
     if (!prev.some((p) => String(p.id) === String(id) || (p.name && p.name === name))) {
      if (prev.length > 0) {
       const isAdjacent = isProvinceAdjacentToNation(id, prev, name) || isProvinceAdjacentToNation(name, prev);
       if (!isAdjacent) {
        setError(`【首都选定】省份「${name}」与现有领土不相邻，建国领土必须相连！`);
        return prev;
       }
      }
      if (prev.length < maxAllowedProvinces) {
       return [...prev, { id, name, isCore: true, civilianFactories: 1, militaryFactories: 1 }];
      }
     }
     return prev;
    });
    setIsSelectingOnMap(false);
   }
  };
  window.addEventListener('map-province-click', handleMapSelect);
  return () => window.removeEventListener('map-province-click', handleMapSelect);
 }, [isSelectingOnMap, mapSelectSubMode, capital, maxAllowedProvinces]);

 useEffect(() => {
  if (isSelectingOnMap) {
   window.dispatchEvent(
    new CustomEvent('map-preview', {
     detail: { provinces, flagColor, mode: mapSelectSubMode, capital },
    })
   );
  } else {
   window.dispatchEvent(new CustomEvent('map-preview', { detail: null }));
  }
 }, [isSelectingOnMap, provinces, flagColor, mapSelectSubMode, capital]);

 useEffect(() => {
  if (isOpen && (mapGeoData as any)?.features) {
   setAvailableProvinces(
    (mapGeoData as any).features.map((f: any) => {
     const rawName = f.properties?.name || '';
     const stateId = f.properties?.stateId;
     const cnName = getProvinceChineseName(rawName) || getProvinceChineseName(stateId) || rawName || '未知省份';
     return {
      id: stateId || Math.random().toString(),
      name: cnName,
     };
    })
   );
  }
 }, [isOpen]);

 if (!isOpen) return null;

 const totalCivFactories = provinces.reduce((acc, p) => acc + (p.civilianFactories || 0), 0);
 const totalMilFactories = provinces.reduce((acc, p) => acc + (p.militaryFactories || 0), 0);

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError(null);
  setIsLoading(true);

  try {
   if (!name.trim()) throw new Error('请填写国家名称（国号）');
   if (provinces.length === 0) throw new Error('请至少选择一个省份作为初始领土');
   if (!capital.trim()) throw new Error('请确立国家首都（首府）');
   if (provinces.length > maxAllowedProvinces) throw new Error(`最多只能选择 ${maxAllowedProvinces} 个省份作为初始领土`);

   // 校验所选领土整体连通性判定（确保所有省份均与初始省份相邻连通）
   const contiguity = checkProvincesContiguity(provinces);
   if (!contiguity.isContiguous) {
    throw new Error(contiguity.message || '建国省份必须是由相邻省份构成的连通领土，不能包含孤立省份！');
   }

   const parsedLng = parseFloat(lng) || 0;
   const parsedLat = parseFloat(lat) || 0;

   const finalCurrency = currencyMode === 'lingyu' ? '玲玉币' : (customCurrencyName.trim() || '主权货币');
   const finalCurrencyRate = currencyMode === 'lingyu' ? 1 : (Number(currencyRate) > 0 ? Number(currencyRate) : 1);

   const res = await api.nations.create({
    name: name.trim(),
    capital: capital.trim(),
    territory: territory.trim() || `领土由 ${provinces.map((p) => p.name).join('、')} 构成`,
    provinces,
    description: '国家宣告正式立宪，万民归附，疆域奠定。',
    regime: partyToRegime[selectedRulingParty] || '君主立宪制',
    ideology: partyToIdeology[selectedRulingParty] || '中立主义',
    rulingPartyId: selectedRulingParty,
    partyNames: {
     communist: communistPartyName.trim() || '人民劳动共产党',
     fascist: fascistPartyName.trim() || '国家复兴法西斯党',
     democratic: democraticPartyName.trim() || '自由民主进步同盟',
     neutral: neutralPartyName.trim() || '国家中立秩序阵线',
    },
    language: language.trim() || '汉语',
    currency: finalCurrency,
    currencyRate: finalCurrencyRate,
    flagColor,
    emblemIcon,
    mapCoordinates: [parsedLng, parsedLat],
   });

   setMyNation(res.nation);

   try {
    confetti({
     particleCount: 80,
     spread: 70,
     origin: { y: 0.6 },
    });
   } catch {
    // ignore
   }

   onSuccess();
   onClose();
  } catch (err: any) {
   setError(err.message || '宣告国家失败');
  } finally {
   setIsLoading(false);
  }
 };

 // Fullscreen Tactical Map Selector HUD
 if (isSelectingOnMap) {
  return (
   <div className="fixed inset-0 z-50 pointer-events-none flex flex-col justify-between animate-fadeIn">
    {/* Top Header Bar */}
    <div className="pointer-events-auto w-full bg-slate-950/90 text-slate-100 backdrop-blur-xl border-b border-white/10 shadow-xl px-3 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between gap-2">
     <button
      id="map-mode-back-btn"
      type="button"
      onClick={() => setIsSelectingOnMap(false)}
      className="flex-shrink-0 whitespace-nowrap px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-xs"
     >
      <ArrowLeft className="w-4 h-4 flex-shrink-0" />
      <span className="hidden sm:inline">返回建国表单</span>
      <span className="sm:hidden">返回</span>
     </button>

     <div className="flex-1 min-w-0 px-1 sm:px-2 flex flex-col items-center justify-center text-center">
      <div className="flex items-center gap-1.5 max-w-full">
       <span
        className="w-2.5 h-2.5 rounded-full flex-shrink-0 animate-pulse shadow-xs"
        style={{ backgroundColor: flagColor }}
       />
       <span className="text-xs sm:text-sm font-bold text-white tracking-wide truncate whitespace-nowrap">
        {mapSelectSubMode === 'territory' ? '地图圈地模式' : '点选国家首都'}
       </span>
       {mapSelectSubMode === 'territory' && (
        <span
         className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold text-white shadow-xs flex-shrink-0"
         style={{ backgroundColor: flagColor }}
        >
         {provinces.length}/{maxAllowedProvinces}
        </span>
       )}
      </div>
      <span className="text-[10px] sm:text-xs text-slate-300 font-medium truncate max-w-full">
       {mapSelectSubMode === 'territory'
        ? provinces.length === 0
         ? '点击地图任意未占领行省确立初始发源地'
         : `已选 ${provinces.length} 省，后续仅可圈选相邻接壤省份（上限 ${maxAllowedProvinces} 省）`
        : capital
        ? `已选首都: ${capital}`
        : '请在地图上点击目标行省作为立国核心首都'}
      </span>
     </div>

     <button
      id="map-mode-confirm-top-btn"
      type="button"
      onClick={() => setIsSelectingOnMap(false)}
      className="flex-shrink-0 whitespace-nowrap px-3.5 sm:px-4 py-1.5 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer active:scale-95"
      style={{ backgroundColor: flagColor }}
     >
      <Check className="w-4 h-4 flex-shrink-0" />
      <span>{mapSelectSubMode === 'territory' ? '确认领土' : '确认首都'}</span>
     </button>
    </div>

    {/* Bottom Drawer Bar with Palette */}
    <div className="pointer-events-auto w-full bg-slate-950/95 text-white backdrop-blur-2xl border-t border-white/10 shadow-2xl p-3 sm:px-6 pb-[calc(env(safe-area-inset-bottom,0px)+12px)]">
     {mapSelectSubMode === 'territory' ? (
      <div className="max-w-6xl mx-auto flex flex-col gap-2.5">
       <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2">
        <div className="flex items-center gap-2 flex-shrink-0">
         <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
          <MapPin className="w-3.5 h-3.5" style={{ color: flagColor }} />
          <span>已选领土</span>
          <span
           className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold text-white shadow-xs"
           style={{ backgroundColor: flagColor }}
          >
           {provinces.length}/{maxAllowedProvinces}
          </span>
         </div>
         {provinces.length > 0 && (
          <button
           type="button"
           onClick={() => setProvinces([])}
           className="text-[11px] text-slate-400 hover:text-rose-400 transition cursor-pointer underline"
          >
           清空已选
          </button>
         )}
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0 bg-white/5 border border-white/10 px-2 py-1 rounded-xl">
         <Palette className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
         <span className="text-[11px] font-medium text-slate-300 mr-1 hidden sm:inline">领土色彩:</span>
         <div className="flex items-center gap-1">
          {FLAG_COLORS.map((c) => (
           <button
            key={c.value}
            type="button"
            title={c.name}
            onClick={() => setFlagColor(c.value)}
            className={`w-5 h-5 rounded-full transition-transform cursor-pointer relative ${
             flagColor === c.value
              ? 'scale-125 ring-2 ring-white ring-offset-1 ring-offset-slate-950 shadow-md z-10'
              : 'hover:scale-110 opacity-75 hover:opacity-100'
            }`}
            style={{ backgroundColor: c.value }}
           />
          ))}
          <label
           title="自定义专属色彩"
           className="w-5 h-5 rounded-full border border-white/40 flex items-center justify-center cursor-pointer overflow-hidden relative ml-0.5 hover:scale-110 transition shadow-xs"
           style={{ background: 'conic-gradient(from 0deg, red, yellow, lime, aqua, blue, magenta, red)' }}
          >
           <input
            type="color"
            value={flagColor}
            onChange={(e) => setFlagColor(e.target.value)}
            className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
           />
          </label>
         </div>
        </div>
       </div>

       <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
         {provinces.length === 0 ? (
          <div className="text-xs text-slate-400 py-1 italic flex items-center gap-1.5">
           <Sparkles className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
           <span className="truncate">请在上方地图直接点击行省地块（最多可选 {maxAllowedProvinces} 个）</span>
          </div>
         ) : (
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
           {provinces.map((prov) => (
            <div
             key={prov.id}
             className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/15 border border-white/15 px-2.5 py-1 rounded-lg text-xs text-slate-200 flex-shrink-0 transition"
            >
             <span className="font-medium whitespace-nowrap">{prov.name}</span>
             <button
              type="button"
              onClick={() => setProvinces((prev) => prev.filter((p) => p.id !== prov.id))}
              className="text-slate-400 hover:text-rose-400 p-0.5 rounded transition cursor-pointer"
              title="移除此行省"
             >
              <X className="w-3.5 h-3.5" />
             </button>
            </div>
           ))}
          </div>
         )}
        </div>

        <button
         id="map-mode-confirm-bottom-btn"
         type="button"
         onClick={() => setIsSelectingOnMap(false)}
         className="flex-shrink-0 whitespace-nowrap px-4 py-2 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
         style={{ backgroundColor: flagColor }}
        >
         <Check className="w-4 h-4 flex-shrink-0" />
         <span>确认领土</span>
        </button>
       </div>
      </div>
     ) : (
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
       <div className="flex items-center gap-2">
        <Landmark className="w-4 h-4 flex-shrink-0" style={{ color: flagColor }} />
        <span className="text-xs text-slate-300">
         当前选中核心首都：
         <strong className="text-white ml-1 text-sm font-bold">
          {capital || '尚未选定（请直接点击地图行省）'}
         </strong>
        </span>
       </div>
       <button
        type="button"
        onClick={() => setIsSelectingOnMap(false)}
        className="w-full sm:w-auto px-4 py-2 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer flex-shrink-0 whitespace-nowrap"
        style={{ backgroundColor: flagColor }}
       >
        <Check className="w-4 h-4 flex-shrink-0" />
        <span>确认首都</span>
       </button>
      </div>
     )}
    </div>
   </div>
  );
 }

 return (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-md overflow-y-auto animate-fadeIn">
   <div
    id="create-nation-modal"
    className="w-full max-w-2xl my-auto bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-3xl shadow-2xl overflow-hidden relative text-slate-900 max-h-[90vh] flex flex-col"
   >
    {/* Top Flag accent strip */}
    <div
     className="h-2 sm:h-2.5 flex-shrink-0 transition-colors duration-300"
     style={{ backgroundColor: flagColor }}
    />

    {/* Modal Header: High-End Strategic Sovereign State Profile Terminal Card */}
    <div className="relative px-5 sm:px-8 pt-7 pb-6 bg-gradient-to-b from-[#f8faff]/98 via-[#f3f6fe]/95 to-[#edf2fb]/92 border-b border-indigo-100/70 overflow-hidden flex-shrink-0">
     {/* Faint World Map & Tech Longitude Watermark Background */}
     <svg
      className="absolute inset-0 w-full h-full pointer-events-none opacity-20 text-indigo-400/40 select-none"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 800 240"
      preserveAspectRatio="xMidYMid slice"
     >
      <defs>
       <pattern id="cardDotGrid" width="16" height="16" patternUnits="userSpaceOnUse">
        <circle cx="2" cy="2" r="0.75" fill="currentColor" fillOpacity="0.35" />
       </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#cardDotGrid)" />
      {/* Subtle Geo Map Contours on right */}
      <path
       d="M480,40 Q520,30 560,50 T620,80 T680,60 T740,110 T790,90 M500,120 Q540,110 590,140 T650,170 T720,150 T780,190 M450,160 Q490,180 540,170 T610,210"
       fill="none"
       stroke="currentColor"
       strokeWidth="0.8"
       strokeDasharray="3 4"
      />
      <circle cx="680" cy="110" r="3" fill="currentColor" fillOpacity="0.4" />
      <circle cx="680" cy="110" r="14" fill="none" stroke="currentColor" strokeWidth="0.6" strokeDasharray="2 3" />
      <line x1="20" y1="20" x2="780" y2="20" stroke="currentColor" strokeWidth="0.5" strokeDasharray="8 8" />
     </svg>

     {/* Top Left: STATE PROFILE Label */}
     <div className="absolute top-3.5 left-5 sm:left-7 flex items-center gap-2 pointer-events-none select-none z-10">
      <span className="text-[10px] font-mono font-bold tracking-[0.2em] text-slate-400 uppercase">
       STATE PROFILE
      </span>
     </div>

     {/* Top Right: Clean Minimalist Close Button */}
     <button
      id="create-nation-close-btn"
      type="button"
      onClick={onClose}
      className="absolute top-3.5 right-4 sm:top-3.5 sm:right-6 text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-all cursor-pointer z-20"
      title="关闭"
     >
      <X className="w-5 h-5" />
     </button>

     {/* Main Horizontal Header Content */}
     <div className="flex items-center gap-4 sm:gap-5 relative z-10 pt-4 sm:pt-3">
      {/* Architectural Sovereign Crest Container */}
      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-slate-900 text-white border border-slate-800 shadow-sm flex items-center justify-center p-2.5 shrink-0 relative overflow-hidden">
       {/* Subtle grid accent */}
       <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:8px_8px] pointer-events-none" />
       
       {/* Crisp Geometric Sovereign Crown */}
       <svg
        viewBox="0 0 100 90"
        className="w-9 h-9 sm:w-10 sm:h-10 text-slate-100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
       >
        <path
         d="M16 28L32 64H68L84 28L63 48L50 16L37 48L16 28Z"
         stroke="currentColor"
         strokeWidth="4"
         strokeLinecap="round"
         strokeLinejoin="round"
         fill="currentColor"
         fillOpacity="0.15"
        />
        <polygon points="50,34 56,45 50,56 44,45" fill="#f59e0b" stroke="#fbbf24" strokeWidth="1.5" />
        <rect x="22" y="72" width="56" height="4" rx="2" fill="currentColor" />
       </svg>
      </div>

      {/* Text Information Hierarchy */}
      <div className="min-w-0 flex-1">
       <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
        立国大典
       </h2>
       <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
        宣告新国家成立
       </p>

       {/* Clean User Identity Tag */}
       <div className="mt-1.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100/90 border border-slate-200/80 text-[11px] font-semibold text-slate-600">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
        <span className="truncate max-w-[200px]">
         {(user?.douyinName || user?.username || '战略试玩员4035').replace(/^领主[·・]/, '').replace(/_抖音$/, '')}
        </span>
       </div>
      </div>
     </div>
    </div>

    {/* 0. 四阶段进度导航 Stepper Bar (① 国家 → ② 首都 → ③ 领土 → ④ 政府) */}
    <div className="px-5 sm:px-7 py-2.5 border-b border-slate-200/70 bg-slate-50/50">
     <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
      {[
       {
        step: 1,
        label: '国家',
        isDone: Boolean(name.trim()),
        isCurrent: !name.trim(),
       },
       {
        step: 2,
        label: '首都',
        isDone: Boolean(capital),
        isCurrent: Boolean(name.trim()) && !capital,
       },
       {
        step: 3,
        label: '领土',
        isDone: provinces.length > 0,
        isCurrent: Boolean(capital) && provinces.length === 0,
       },
       {
        step: 4,
        label: '政府',
        isDone: Boolean(selectedRulingParty),
        isCurrent: provinces.length > 0,
       },
      ].map(({ step, label, isDone, isCurrent }) => {
       // 未完成步骤保持中性浅灰色，不让未完成的步骤看起来像已完成
       const statusClasses = isDone
        ? 'bg-emerald-50/80 border-emerald-200 text-emerald-800'
        : isCurrent
        ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-2xs'
        : 'bg-white/80 border-slate-200/70 text-slate-400';

       const badgeClasses = isDone
        ? 'bg-emerald-600 text-white'
        : isCurrent
        ? 'bg-indigo-600 text-white'
        : 'bg-slate-100 border border-slate-200 text-slate-400';

       return (
        <div
         key={step}
         className={`flex items-center gap-1.5 sm:gap-2 py-1.5 px-2 rounded-lg border transition-all text-xs font-semibold ${statusClasses}`}
        >
         <span
          className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${badgeClasses}`}
         >
          {isDone ? '✓' : step}
         </span>
         <span className="truncate">{label}</span>
        </div>
       );
      })}
     </div>
    </div>

    {/* Error notice */}
    {error && (
     <div className="mx-5 sm:mx-7 mt-3 p-3 bg-rose-50/90 border border-rose-200/80 rounded-xl text-xs text-rose-700 font-medium flex items-center gap-2 shadow-xs">
      <Shield className="w-4 h-4 text-rose-500 flex-shrink-0" />
      <span>{error}</span>
     </div>
    )}

    {/* Main scrollable body */}
    <form onSubmit={handleSubmit} className="px-5 sm:px-7 py-4 overflow-y-auto flex-1 space-y-4">
     {/* 1. 国家名称（国号） */}
     <div>
      <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1.5">
       国家名称（国号） <span className="text-rose-500 ml-0.5">*</span>
      </label>
      <div className="relative">
       <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 flex items-center justify-center pointer-events-none">
        <Crown className="w-4 h-4" />
       </div>
       <input
        id="input-nation-name"
        type="text"
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="例：大玲玉帝国"
        className="w-full pl-10 pr-4 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/10 transition-all font-medium"
       />
      </div>
     </div>

     {/* 2. 核心首都 Core Capital Strategic Card */}
     <div className="p-3.5 sm:p-4 rounded-xl border border-slate-200/90 bg-white shadow-2xs space-y-2.5">
      <div className="flex items-center justify-between">
       <div>
        <div className="text-[10px] font-mono font-bold tracking-widest text-slate-400 uppercase">
         CORE CAPITAL
        </div>
        <div className="text-sm font-black text-slate-900 flex items-center gap-1.5 mt-0.5">
         <Landmark className="w-4 h-4 text-orange-500 shrink-0" />
         <span>核心首都</span>
         <span className="text-rose-500 text-xs">*</span>
        </div>
       </div>

       {capital && (
        <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200/80 flex items-center gap-1">
         <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
         已确立首府
        </span>
       )}
      </div>

      {!capital ? (
       /* 未选择状态 */
       <div className="p-3 rounded-lg border-2 border-dashed border-slate-200 bg-slate-50/60 flex items-center justify-between gap-3">
        <div className="min-w-0">
         <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full border border-slate-400 bg-white shrink-0" />
          <span>尚未选择</span>
         </div>
         <p className="text-[11px] text-slate-500 mt-0.5 truncate">
          选择一块领土作为国家首都
         </p>
        </div>

        {/* 一级操作：白色背景 + 橙色描边/文字 */}
        <button
         type="button"
         onClick={() => {
          setMapSelectSubMode('capital');
          setIsSelectingOnMap(true);
          onEnterMapMode?.();
         }}
         className="h-8 px-3 bg-white hover:bg-orange-50/70 text-orange-600 border border-orange-300 hover:border-orange-400 text-xs font-bold rounded-lg transition shadow-2xs flex items-center gap-1 cursor-pointer shrink-0 active:scale-95"
        >
         <span>选择地块</span>
         <ChevronRight className="w-3.5 h-3.5" />
        </button>
       </div>
      ) : (
       /* 已选择状态 */
       <div className="p-3 rounded-lg border border-slate-200/90 bg-slate-50/50 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
         <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0">
          <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
         </div>
         <div className="min-w-0">
          <div className="text-sm font-black text-slate-900 tracking-tight truncate flex items-center gap-1">
           <span>★</span>
           <span>{capital}</span>
          </div>
          <div className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
           首府行政区 · 国家法统中枢
          </div>
         </div>
        </div>

        {/* 二级操作：更换 */}
        <div className="flex items-center gap-2 shrink-0">
         <button
          type="button"
          onClick={() => {
           setMapSelectSubMode('capital');
           setIsSelectingOnMap(true);
           onEnterMapMode?.();
          }}
          className="h-7 px-2.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-md border border-slate-200 transition cursor-pointer flex items-center gap-1 shadow-2xs"
         >
          <span>更换</span>
          <ChevronRight className="w-3 h-3" />
         </button>
        </div>
       </div>
      )}
     </div>

     {/* 3. 初始领土 Initial Territory Card */}
     <div className="p-3.5 sm:p-4 rounded-xl border border-slate-200/90 bg-white shadow-2xs space-y-2.5">
      <div className="flex items-center justify-between">
       <div>
        <div className="text-[10px] font-mono font-bold tracking-widest text-slate-400 uppercase">
         INITIAL TERRITORY
        </div>
        <div className="text-sm font-black text-slate-900 flex items-center gap-1.5 mt-0.5">
         <Compass className="w-4 h-4 text-orange-500 shrink-0" />
         <span>初始领土</span>
         <span className="text-rose-500 text-xs">*</span>
        </div>
       </div>

       {/* 三级信息：0 / 11 个省份 */}
       <div className="text-right">
        <div className="text-sm font-mono font-bold text-slate-900 tracking-tight">
         <span className={provinces.length > 0 ? 'text-orange-600' : 'text-slate-500'}>{provinces.length}</span>
         <span className="text-slate-400 text-xs font-normal mx-1">/</span>
         <span className="text-slate-600 text-xs">{maxAllowedProvinces}</span>
         <span className="text-slate-500 text-xs font-normal ml-1">个省份</span>
        </div>
       </div>
      </div>

      {/* 未选择状态：只保留一个最重要的主操作 */}
      {provinces.length === 0 ? (
       <div className="p-3 rounded-lg border-2 border-dashed border-slate-200 bg-slate-50/60 flex items-center justify-between gap-3">
        <div className="min-w-0">
         <div className="text-xs font-bold text-slate-800 truncate">
          在沙盘地图上圈选领土
         </div>
         <div className="text-[11px] text-slate-500 mt-0.5 truncate">
          选择相邻省份，建立你的初始版图
         </div>
        </div>

        {/* 一级操作：白色背景 + 橙色描边/文字 */}
        <button
         type="button"
         onClick={() => {
          setMapSelectSubMode('territory');
          setIsSelectingOnMap(true);
          onEnterMapMode?.();
         }}
         className="h-8 px-3 bg-white hover:bg-orange-50/70 text-orange-600 border border-orange-300 hover:border-orange-400 text-xs font-bold rounded-lg transition shadow-2xs flex items-center gap-1 cursor-pointer shrink-0 active:scale-95"
        >
         <span>圈定地块</span>
         <ChevronRight className="w-3.5 h-3.5" />
        </button>
       </div>
      ) : (
       <div className="space-y-2">
        {/* 二级辅助操作行：降级为文字与轻量操作 */}
        <div className="flex items-center justify-between gap-2">
         <button
          type="button"
          onClick={() => setIsProvincesCollapsed(!isProvincesCollapsed)}
          className="text-xs text-slate-500 hover:text-slate-800 font-medium flex items-center gap-1 transition cursor-pointer p-0.5"
         >
          <span>{isProvincesCollapsed ? `查看清单 (${provinces.length})` : '收起清单'}</span>
          {isProvincesCollapsed ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
         </button>

         <button
          type="button"
          onClick={() => {
           setMapSelectSubMode('territory');
           setIsSelectingOnMap(true);
           onEnterMapMode?.();
          }}
          className="h-6 px-2.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-md border border-slate-200 transition cursor-pointer flex items-center gap-1 shadow-2xs"
         >
          <Compass className="w-3 h-3 text-orange-500" />
          <span>圈定地块</span>
         </button>
        </div>

        {/* 已选领土：轻量标签展示（★ 大伦敦地区 ×），绝不设计成大型按钮 */}
        {isProvincesCollapsed ? (
         <div className="p-2 bg-slate-50/80 rounded-lg border border-slate-200/80 flex flex-wrap gap-1.5">
          {provinces.map((prov) => {
           const isCap = capital === prov.name;
           return (
            <div
             key={prov.id}
             className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border shadow-2xs transition ${
              isCap
               ? 'bg-amber-50/90 border-amber-200 text-amber-900 font-bold'
               : 'bg-white border-slate-200 text-slate-700'
             }`}
            >
             {isCap && <span className="text-amber-500 text-xs">★</span>}
             <span className="max-w-[120px] truncate">{prov.name}</span>
             <button
              type="button"
              onClick={(e) => {
               e.stopPropagation();
               setProvinces((prev) => {
                const next = prev.filter((p) => p.id !== prov.id);
                if (capital === prov.name) {
                 setCapital(next.length > 0 ? next[0].name : '');
                }
                return next;
               });
              }}
              className="text-slate-400 hover:text-rose-500 ml-0.5 p-0.5 cursor-pointer"
              title="移除"
             >
              <X className="w-3 h-3" />
             </button>
            </div>
           );
          })}
         </div>
        ) : (
         <div className="space-y-1 max-h-[200px] overflow-y-auto pr-1">
          {provinces.map((prov) => {
           const isCap = capital === prov.name;
           return (
            <div
             key={prov.id}
             className={`p-1.5 px-2.5 rounded-lg border flex items-center justify-between gap-2 text-xs ${
              isCap ? 'bg-amber-50/70 border-amber-200' : 'bg-white border-slate-200/80'
             }`}
            >
             <div className="flex items-center gap-1.5 min-w-0">
              {isCap ? (
               <span className="text-amber-500 font-bold">★</span>
              ) : (
               <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
              )}
              <span className="font-semibold text-slate-800 truncate">{prov.name}</span>
              <span className="text-[10px] text-slate-400 font-mono">ID: {prov.id}</span>
             </div>
             <div className="flex items-center gap-1 shrink-0">
              {isCap ? (
               <span className="text-[10px] font-bold text-amber-800 bg-amber-100/80 px-1.5 py-0.2 rounded">
                首府
               </span>
              ) : (
               <button
                type="button"
                onClick={() => setCapital(prov.name)}
                className="px-1.5 py-0.5 rounded text-[11px] font-medium text-slate-600 hover:text-amber-800 hover:bg-amber-50 border border-slate-200 transition cursor-pointer"
               >
                设为首都
               </button>
              )}
              <button
               type="button"
               onClick={() => {
                setProvinces((prev) => {
                 const next = prev.filter((p) => p.id !== prov.id);
                 if (capital === prov.name) {
                  setCapital(next.length > 0 ? next[0].name : '');
                 }
                 return next;
                });
               }}
               className="p-1 text-slate-400 hover:text-rose-500 cursor-pointer"
               title="移除"
              >
               <X className="w-3 h-3" />
              </button>
             </div>
            </div>
           );
          })}
         </div>
        )}
       </div>
      )}
     </div>

     {/* 4. 政治制度与执政党 Political System Card */}
     <div className="p-3.5 sm:p-4 rounded-xl border border-slate-200/90 bg-white shadow-2xs space-y-2.5">
      <div>
       <div className="text-[10px] font-mono font-bold tracking-widest text-slate-400 uppercase">
        POLITICAL SYSTEM
       </div>
       <div className="text-sm font-black text-slate-900 flex items-center gap-1.5 mt-0.5">
        <Scale className="w-4 h-4 text-indigo-600 shrink-0" />
        <span>政治制度与政党</span>
       </div>
       <p className="text-xs text-slate-500 mt-0.5">
        确立意识形态与执政党
       </p>
      </div>

      {/* 4 Ideology Horizontal Cards */}
      <div className="space-y-1.5">
       {[
        {
         id: 'communist' as const,
         name: '共产主义',
         colorDot: 'bg-rose-500',
         value: communistPartyName,
         setter: setCommunistPartyName,
         placeholder: '例：人民劳动共产党',
        },
        {
         id: 'democratic' as const,
         name: '民主主义',
         colorDot: 'bg-sky-500',
         value: democraticPartyName,
         setter: setDemocraticPartyName,
         placeholder: '例：自由民主进步同盟',
        },
        {
         id: 'neutral' as const,
         name: '中立主义',
         colorDot: 'bg-slate-400',
         value: neutralPartyName,
         setter: setNeutralPartyName,
         placeholder: '例：国家中立秩序阵线',
        },
        {
         id: 'fascist' as const,
         name: '法西斯主义',
         colorDot: 'bg-amber-700',
         value: fascistPartyName,
         setter: setFascistPartyName,
         placeholder: '例：国家复兴法西斯党',
        },
       ].map((party) => {
        const isSelected = selectedRulingParty === party.id;
        return (
         <div
          key={party.id}
          className={`p-2.5 rounded-lg border transition-all ${
           isSelected
            ? 'bg-slate-50/80 border-slate-800 shadow-2xs'
            : 'bg-white border-slate-200/80 hover:border-slate-300'
          }`}
         >
          <div className="flex items-center justify-between gap-3 mb-1.5">
           <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${party.colorDot} shrink-0`} />
            <div className="flex items-center gap-2">
             <span className="text-xs font-bold text-slate-900">
              {party.name}
             </span>
             <span className="text-[10px] text-slate-400">
              初始支持率 45–70%
             </span>
            </div>
           </div>

           {isSelected ? (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-900 text-white flex items-center gap-1 shadow-2xs">
             <span>✓ 执政党</span>
            </span>
           ) : (
            <button
             type="button"
             onClick={() => setSelectedRulingParty(party.id)}
             className="h-5 px-2 rounded text-[10px] font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition cursor-pointer"
            >
             设为执政党
            </button>
           )}
          </div>

          <input
           type="text"
           value={party.value}
           onChange={(e) => party.setter(e.target.value)}
           placeholder={party.placeholder}
           className="w-full px-2.5 py-1.5 bg-slate-50/70 border border-slate-200 rounded-md text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 focus:bg-white transition font-medium"
          />
         </div>
        );
       })}
      </div>
     </div>

     {/* 5. 语言 & 货币 */}
     <div className="space-y-4">
      <div>
       <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1.5">
        官方语言
       </label>
       <div className="relative">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 flex items-center justify-center pointer-events-none">
         <Languages className="w-4 h-4" />
        </div>
        <input
         id="input-nation-language"
         type="text"
         value={language}
         onChange={(e) => setLanguage(e.target.value)}
         placeholder="例：汉语"
         className="w-full pl-10 pr-4 py-2.5 bg-slate-50/80 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium"
        />
       </div>
      </div>

      {/* Currency & Exchange Rate Selector */}
      <div className="p-3.5 sm:p-4 bg-slate-50/90 border border-slate-200/90 rounded-2xl space-y-3">
       <div className="flex items-center justify-between">
        <label className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5">
         <Coins className="w-4 h-4 text-amber-500" />
         <span>流通货币体系与基准汇率</span>
        </label>
        <span className="text-[11px] text-slate-500 font-medium">全服基准货币：<strong className="text-amber-600 font-bold">玲玉币</strong></span>
       </div>

       {/* Segmented Mode Switcher */}
       <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200/60">
        <button
         type="button"
         onClick={() => setCurrencyMode('lingyu')}
         className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
          currencyMode === 'lingyu'
           ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
           : 'bg-transparent text-slate-500 hover:text-slate-800'
         }`}
        >
         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-amber-500 flex-shrink-0">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
         </svg>
         <span>玲玉币 (默认)</span>
        </button>
        <button
         type="button"
         onClick={() => setCurrencyMode('custom')}
         className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
          currencyMode === 'custom'
           ? 'bg-white text-indigo-700 shadow-xs border border-indigo-200/80'
           : 'bg-transparent text-slate-500 hover:text-slate-800'
         }`}
        >
         <Landmark className="w-4 h-4 text-indigo-500 flex-shrink-0" />
         <span>自定义主权币</span>
        </button>
       </div>

       {/* Mode 1: Direct Lingyu Coin */}
       {currencyMode === 'lingyu' ? (
        <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/60 flex items-center justify-between">
         <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs flex-shrink-0">
           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
           </svg>
          </div>
          <div>
           <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
            <span>通用基准法币 · 玲玉币</span>
            <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-mono font-bold">1:1 固定平价</span>
           </div>
           <div className="text-[11px] text-slate-500 mt-0.5">全境通用法币，在大宗商品交易、军工采购与国际条约中享零兑换损耗</div>
          </div>
         </div>
        </div>
       ) : (
        /* Mode 2: Custom Currency & Rate */
        <div className="space-y-3 pt-1">
         {/* Custom Currency Name */}
         <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
           主权货币名称
          </label>
          <div className="relative">
           <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 flex items-center justify-center pointer-events-none">
            <Coins className="w-3.5 h-3.5 text-indigo-500" />
           </div>
           <input
            type="text"
            value={customCurrencyName}
            onChange={(e) => setCustomCurrencyName(e.target.value)}
            placeholder="例如：大秦半两、帝国金镑、银元、卢布、第纳尔..."
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 font-bold transition"
           />
          </div>
         </div>

         {/* Exchange Rate Input & Presets */}
         <div className="space-y-2">
          <div className="flex items-center justify-between">
           <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
            <span>对玲玉币基准汇率</span>
            <span className="text-[10px] text-slate-400 font-normal">(1 {customCurrencyName.trim() || '主权币'} = ? 玲玉币)</span>
           </label>
          </div>

          {/* Integrated Formula Row with baseline-centered alignment */}
          <div className="flex items-center justify-center gap-2.5 p-2.5 bg-slate-50 border border-slate-200/90 rounded-xl text-sm font-medium">
           <span className="text-slate-600 text-sm font-semibold">1</span>
           <span className="text-slate-800 text-sm font-semibold truncate max-w-[120px]">{customCurrencyName.trim() || '主权币'}</span>
           <span className="text-slate-400 text-sm font-semibold">=</span>
           
           <input
            type="number"
            step="0.01"
            min="0.01"
            max="10000"
            value={currencyRate}
            onChange={(e) => setCurrencyRate(parseFloat(e.target.value) || 0)}
            className="w-20 h-8 px-2 bg-white border border-indigo-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-lg text-sm font-bold text-indigo-700 text-center font-mono focus:outline-none transition shadow-2xs"
           />

           <span className="text-slate-800 text-sm font-semibold">玲玉币</span>
          </div>

          {/* 3x2 Equal Width Grid Presets */}
          <div className="space-y-1.5 pt-1">
           <div className="text-[11px] font-bold text-slate-500">快捷档位</div>
           <div className="grid grid-cols-3 gap-2">
            {[
             { label: '微值 0.1', val: 0.1 },
             { label: '弱势 0.5', val: 0.5 },
             { label: '平价 1.0', val: 1 },
             { label: '强势 2.0', val: 2 },
             { label: '霸权 5.0', val: 5 },
             { label: '超强 10.0', val: 10 },
            ].map((preset) => (
             <button
              key={preset.label}
              type="button"
              onClick={() => setCurrencyRate(preset.val)}
              className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition cursor-pointer border text-center ${
               currencyRate === preset.val
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200/80 hover:border-slate-300'
              }`}
             >
              {preset.label}
             </button>
            ))}
           </div>
          </div>
         </div>

         {/* Visual Live Exchange Rate Calculator Card */}
         <div className="p-3 bg-slate-100/70 border border-slate-200/80 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
           <span>实时兑换预览与购买力：</span>
           <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
            currencyRate >= 5
             ? 'bg-purple-100 text-purple-700 border border-purple-200/60'
             : currencyRate > 1
             ? 'bg-indigo-100 text-indigo-700 border border-indigo-200/60'
             : currencyRate === 1
             ? 'bg-emerald-100 text-emerald-700 border border-emerald-200/60'
             : 'bg-rose-50 text-rose-700 border border-rose-200/60'
           }`}>
            {currencyRate >= 5
             ? '超强势霸权货币'
             : currencyRate > 1
             ? '强势升值货币'
             : currencyRate === 1
             ? '等价平价货币'
             : '宽松微利货币'}
           </span>
          </div>

          <div className="flex items-center justify-between gap-3 bg-white p-2.5 rounded-lg border border-slate-200/80 shadow-2xs">
           <div className="flex-1 text-left">
            <div className="text-[10px] text-slate-400">本国主权法币</div>
            <div className="text-sm font-black text-slate-800 tracking-tight mt-0.5">
             100 <span className="text-xs font-bold text-slate-500">{customCurrencyName.trim() || '主权币'}</span>
            </div>
           </div>

           <div className="flex flex-col items-center justify-center px-2 py-1 rounded bg-slate-50 border border-slate-200/60 flex-shrink-0">
            <ArrowRightLeft className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[10px] text-slate-500 font-mono font-bold mt-0.5">1 : {currencyRate}</span>
           </div>

           <div className="flex-1 text-right">
            <div className="text-[10px] text-slate-400">全服基准本位</div>
            <div className="text-sm font-black text-slate-800 tracking-tight mt-0.5">
             {(100 * (Number(currencyRate) || 0)).toFixed(1)} <span className="text-xs font-bold text-amber-600">玲玉币</span>
            </div>
           </div>
          </div>
         </div>
        </div>
       )}
      </div>
     </div>

     {/* 6. 国家旗帜 */}
     <div className="p-4 bg-slate-50/80 border border-slate-200/80 rounded-2xl space-y-3.5">
      <div>
       <div className="mb-2">
        <label className="block text-xs font-bold text-slate-700">
         国家旗帜 （4:3）
        </label>
       </div>
       <div className="flex flex-wrap items-center gap-3">
        {/* Preview Frame with 4:3 aspect ratio */}
        <div
         className="w-16 h-12 rounded-xl flex items-center justify-center text-white shadow-xs border-2 border-slate-200 bg-white overflow-hidden relative flex-shrink-0 group"
         style={
          emblemIcon && emblemIcon.startsWith('data:image')
           ? {}
           : { backgroundColor: flagColor }
         }
        >
         {renderEmblemIcon(emblemIcon, { className: 'w-6 h-6 text-white' })}
         <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition flex items-center justify-center pointer-events-none" />
        </div>

        <div className="flex flex-wrap items-center gap-2">
         <label className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 cursor-pointer transition shadow-2xs flex items-center gap-1.5">
          <span>选择图片</span>
          <input
           type="file"
           accept="image/*"
           className="hidden"
           onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
             const reader = new FileReader();
             reader.onload = (ev) => {
              const dataUrl = ev.target?.result as string;
              if (dataUrl) {
               // Test image aspect ratio for 4:3
               const img = new Image();
               img.onload = () => {
                const ratio = img.naturalWidth / img.naturalHeight;
                const targetRatio = 4 / 3; // 1.3333
                // If not strictly 4:3 (tolerance 0.03) -> auto open cropper!
                if (Math.abs(ratio - targetRatio) >= 0.03) {
                 setCropperSourceImage(dataUrl);
                 setCropperReasonNotice(
                  `检测到上传图片比例为 ${(img.naturalWidth / img.naturalHeight).toFixed(2)}:1（非 4:3）。已自动为您开启 4:3 裁切界面。`
                 );
                 setIsCropperOpen(true);
                } else {
                 setEmblemIcon(dataUrl);
                }
               };
               img.src = dataUrl;
              }
             };
             reader.readAsDataURL(file);
            }
            // Reset input so same file can be re-selected if needed
            e.target.value = '';
           }}
          />
         </label>

         {emblemIcon && emblemIcon.startsWith('data:image') && (
          <button
           type="button"
           onClick={() => setEmblemIcon('Crown')}
           className="text-xs text-rose-500 hover:text-rose-600 underline cursor-pointer ml-1"
          >
           移除自定义
          </button>
         )}
        </div>
       </div>
      </div>
     </div>

     {/* Flag 4:3 Cropper Modal */}
     <FlagCropperModal
      isOpen={isCropperOpen}
      imageSrc={cropperSourceImage}
      title="国家旗帜 4:3 规格裁切"
      reasonNotice={cropperReasonNotice}
      onClose={() => setIsCropperOpen(false)}
      onCropComplete={(croppedUrl) => {
       setEmblemIcon(croppedUrl);
      }}
     />

     {/* Submit Action */}
     <div className="pt-2">
      <button
       id="submit-create-nation-btn"
       type="submit"
       disabled={isLoading}
       className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-98"
      >
       {isLoading ? (
        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
       ) : (
        <Crown className="w-4 h-4 text-indigo-200" />
       )}
       <span>立即宣告</span>
      </button>
     </div>
    </form>
   </div>
  </div>
 );
};
