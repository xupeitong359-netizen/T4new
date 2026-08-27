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
 BookOpen,
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

const REGIMES: RegimeType[] = [
 '君主立宪制',
 '联邦共和制',
 '宪政联邦共和制',
 '民主议会制',
 '封建帝国',
 '军政府/军国主义',
 '神权政体',
 '苏维埃代表制',
 '自由城邦自治',
 '其他特殊政体',
];

const IDEOLOGIES: IdeologyType[] = [
 '中立和平主义',
 '自由民主主义',
 '扩张威权主义',
 '社群社会主义',
 '民族传统主义',
 '重商资本主义',
 '科技理性主义',
 '激进军国主义',
];

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
 const [description, setDescription] = useState('');
 const [regime, setRegime] = useState<RegimeType>('君主立宪制');
 const [ideology, setIdeology] = useState<IdeologyType>('中立和平主义');
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

     // 核心判定：建国时新增省份必须与当前已有初始领土相邻！
     if (prev.length > 0) {
      const isAdjacent = isProvinceAdjacentToNation(id, prev, name) || isProvinceAdjacentToNation(name, prev);
      if (!isAdjacent) {
       setError(`【建国判定】所选省份「${name}」与已有初始领土不相邻！建国省份必须相邻连通。`);
       return prev;
      }
     }

     setError(null);
     const next = [...prev, { id, name, civilianFactories: 1, militaryFactories: 1 }];
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
       return [...prev, { id, name, civilianFactories: 1, militaryFactories: 1 }];
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
    description: description.trim() || '国家宣告正式立宪，万民归附，疆域奠定。',
    regime,
    ideology,
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

    {/* Modal Header: Refined Light Purple-Blue Gradient & Structured Hierarchy */}
    <div className="px-5 sm:px-7 pt-5 pb-4 border-b border-slate-100 flex items-center justify-between gap-3 flex-shrink-0 relative">
     <div className="flex items-center gap-3.5 min-w-0">
      {/* Crown Avatar */}
      <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-2xl bg-gradient-to-br from-indigo-50 via-purple-50 to-indigo-100 border border-indigo-100/80 flex items-center justify-center text-indigo-600 shadow-sm flex-shrink-0">
       <Crown className="w-6 h-6 sm:w-6.5 sm:h-6.5 text-indigo-600 drop-shadow-xs" />
      </div>

      {/* Title & Subtitle Hierarchy */}
      <div className="min-w-0">
       <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
        立国大典 · 宣告国家
       </h2>
       <div className="flex flex-wrap items-center gap-1.5 mt-1 text-xs text-slate-500">
        <TikTokIcon className="w-3.5 h-3.5 text-slate-900" />
        <span className="text-slate-600 font-medium">抖音用户</span>
        <span className="px-1.5 py-0.5 rounded-md bg-indigo-50/90 text-indigo-700 font-bold text-[11px] border border-indigo-100/70">
         {user?.douyinName || user?.username || '天下布武_Official'}
        </span>
       </div>
       <p className="text-[11px] text-slate-400 mt-0.5 font-normal">
        请确立您的疆域法统与首府，谱写帝国篇章
       </p>
      </div>
     </div>

     {/* Close button */}
     <button
      id="create-nation-close-btn"
      type="button"
      onClick={onClose}
      className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100/80 transition cursor-pointer -mr-1 flex-shrink-0"
      title="关闭"
     >
      <X className="w-5 h-5" />
     </button>
    </div>

    {/* Error notice */}
    {error && (
     <div className="mx-5 sm:mx-7 mt-3 p-3 bg-rose-50/90 border border-rose-200/80 rounded-2xl text-xs text-rose-700 font-medium flex items-center gap-2 shadow-xs">
      <Shield className="w-4 h-4 text-rose-500 flex-shrink-0" />
      <span>{error}</span>
     </div>
    )}

    {/* Main scrollable body */}
    <form onSubmit={handleSubmit} className="px-5 sm:px-7 py-5 overflow-y-auto flex-1 space-y-5">
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
        className="w-full pl-10 pr-4 py-2.5 bg-slate-50/80 border border-slate-200 rounded-2xl text-sm text-slate-900 placeholder:text-slate-400/90 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium"
       />
      </div>
     </div>

     {/* 2. 首都（首府） */}
     <div>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
       <label className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5 whitespace-nowrap shrink-0">
        <Landmark className="w-4 h-4 text-amber-500 shrink-0" />
        <span>核心首都（首府）</span>
        <span className="text-rose-500 ml-0.5">*</span>
       </label>
       {capital && (
        <span className="text-[11px] font-bold text-amber-600 bg-amber-50 border border-amber-200/80 px-2.5 py-0.5 rounded-full flex items-center gap-1 whitespace-nowrap shrink-0">
         <Star className="w-3 h-3 fill-amber-500 text-amber-500 shrink-0" />
         已确立首府
        </span>
       )}
      </div>

      {!capital ? (
       <button
        type="button"
        onClick={() => {
         setMapSelectSubMode('capital');
         setIsSelectingOnMap(true);
         onEnterMapMode?.();
        }}
        className="w-full h-12 px-4 bg-gradient-to-r from-amber-500/5 via-slate-50 to-indigo-50/20 hover:from-amber-500/10 hover:to-indigo-50/40 border-2 border-dashed border-amber-300/80 hover:border-amber-500 rounded-2xl text-xs sm:text-sm text-slate-600 hover:text-amber-700 font-semibold flex items-center justify-between transition cursor-pointer group shadow-2xs"
       >
        <div className="flex items-center gap-2.5">
         <div className="w-7 h-7 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
          <MapPin className="w-4 h-4" />
         </div>
         <span>选择首都</span>
        </div>
        <div className="flex items-center gap-1 text-amber-600 text-xs font-bold whitespace-nowrap shrink-0">
         <span>选择地块</span>
         <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </div>
       </button>
      ) : (
       <div className="relative flex items-center bg-gradient-to-r from-amber-50/60 to-white border border-amber-200/90 focus-within:border-amber-500 focus-within:ring-4 focus-within:ring-amber-500/10 rounded-2xl h-12 px-3.5 transition-all shadow-xs">
        <div className="w-7 h-7 rounded-xl bg-amber-100/90 text-amber-700 flex items-center justify-center flex-shrink-0 mr-2.5 shadow-2xs">
         <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
        </div>
        <input
         id="input-nation-capital"
         type="text"
         required
         value={capital}
         onChange={(e) => setCapital(e.target.value)}
         placeholder="请输入或选择首都名称"
         className="w-full bg-transparent text-sm font-bold text-slate-900 focus:outline-none"
        />
        <button
         type="button"
         onClick={() => {
          setMapSelectSubMode('capital');
          setIsSelectingOnMap(true);
          onEnterMapMode?.();
         }}
         className="flex-shrink-0 ml-1.5 px-2.5 py-1 text-xs font-bold text-amber-700 bg-amber-100/80 hover:bg-amber-200/80 rounded-xl transition cursor-pointer flex items-center gap-1 whitespace-nowrap"
         title="在地图上重新圈定首都"
        >
         <Compass className="w-3.5 h-3.5 shrink-0" />
         <span>地图重选</span>
        </button>
       </div>
      )}

      {/* Quick Capital Selection from Territory chips */}
      {provinces.length > 0 && (
       <div className="mt-2 p-2.5 bg-slate-50/80 border border-slate-200/70 rounded-2xl">
        <div className="flex items-center justify-between mb-1.5 text-[11px] text-slate-500">
         <span className="font-medium">从当前已选领土快速指定首都：</span>
         <span className="text-[10px] text-slate-400">点击省份设为首都</span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
         {provinces.map((p) => {
          const isSelected = capital === p.name;
          return (
           <button
            key={p.id}
            type="button"
            onClick={() => setCapital(p.name)}
            className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 border whitespace-nowrap shrink-0 ${
             isSelected
              ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
              : 'bg-white hover:bg-amber-50/70 text-slate-700 border-slate-200 hover:border-amber-200'
            }`}
           >
            {isSelected && <Star className="w-3 h-3 fill-white text-white shrink-0" />}
            <span>{p.name}</span>
           </button>
          );
         })}
        </div>
       </div>
      )}
     </div>

     {/* 3. 初始领土 */}
     <div>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
       <div className="flex items-center gap-2 flex-wrap min-w-0">
        <label className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5 whitespace-nowrap shrink-0">
         <Compass className="w-4 h-4 text-indigo-600 shrink-0" />
         <span>初始领土</span>
         <span className="text-rose-500 ml-0.5">*</span>
        </label>
        <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono font-bold whitespace-nowrap shrink-0">
         {provinces.length}/{maxAllowedProvinces} 个省份
        </span>
       </div>

       {provinces.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap shrink-0">
         <button
          type="button"
          onClick={() => setIsProvincesCollapsed(!isProvincesCollapsed)}
          className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold flex items-center gap-1 transition cursor-pointer whitespace-nowrap shrink-0"
         >
          <span>{isProvincesCollapsed ? `展开明细 (${provinces.length})` : '收起明细'}</span>
          {isProvincesCollapsed ? (
           <ChevronDown className="w-3.5 h-3.5 shrink-0" />
          ) : (
           <ChevronUp className="w-3.5 h-3.5 shrink-0" />
          )}
         </button>
         <button
          type="button"
          onClick={() => {
           setMapSelectSubMode('territory');
           setIsSelectingOnMap(true);
           onEnterMapMode?.();
          }}
          className="px-3 py-1 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-bold flex items-center gap-1.5 transition shadow-2xs border border-indigo-100 cursor-pointer active:scale-95 whitespace-nowrap shrink-0"
         >
          <Compass className="w-3.5 h-3.5 shrink-0" />
          <span>地图圈划领土</span>
         </button>
        </div>
       )}
      </div>

      {/* Empty state: Clean single-row 42px select box */}
      {provinces.length === 0 ? (
       <button
        type="button"
        onClick={() => {
         setMapSelectSubMode('territory');
         setIsSelectingOnMap(true);
         onEnterMapMode?.();
        }}
        className="w-full h-12 px-4 bg-slate-50/80 hover:bg-indigo-50/60 border-2 border-dashed border-slate-300 hover:border-indigo-400 rounded-2xl text-xs sm:text-sm text-slate-500 hover:text-indigo-600 font-medium flex items-center justify-between transition cursor-pointer group mb-2"
       >
        <div className="flex items-center gap-2.5">
         <div className="w-7 h-7 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
          <Compass className="w-4 h-4" />
         </div>
         <span>选择领土</span>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all flex-shrink-0" />
       </button>
      ) : (
       <div className="mb-2.5">
        {/* Default Stacked Chips View (When Collapsed) */}
        {isProvincesCollapsed ? (
         <div className="p-3 bg-slate-50/80 border border-slate-200/80 rounded-2xl">
          <div className="flex items-center gap-1.5 flex-wrap">
           {provinces.map((prov) => {
            const isCap = capital === prov.name;
            return (
             <div
              key={prov.id}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold border shadow-2xs transition ${
               isCap
                ? 'bg-amber-50 border-amber-300 text-amber-900 font-bold'
                : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
              }`}
             >
              {isCap ? (
               <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
              ) : (
               <MapPin className="w-3 h-3 text-slate-400" />
              )}
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
               className="text-slate-400 hover:text-rose-500 ml-0.5 p-0.5 rounded-full hover:bg-slate-100 transition"
               title="移除"
              >
               <X className="w-3 h-3" />
              </button>
             </div>
            );
           })}
          </div>
         </div>
        ) : (
         /* Expanded Detailed Province Cards */
         <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
          {provinces.map((prov) => {
           const isCap = capital === prov.name;
           return (
            <div
             key={prov.id}
             className={`p-2.5 sm:p-3 rounded-2xl border transition-all flex items-center justify-between gap-2 shadow-2xs ${
              isCap
               ? 'bg-gradient-to-r from-amber-50/60 via-indigo-50/20 to-white border-amber-300 shadow-xs'
               : 'bg-white border-slate-200/90 hover:border-slate-300'
             }`}
            >
             <div className="flex items-center gap-2 min-w-0">
              <div
               className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 ${
                isCap
                 ? 'bg-amber-100 text-amber-600'
                 : 'bg-slate-100 text-slate-600'
               }`}
              >
               {isCap ? (
                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
               ) : (
                <MapPin className="w-3.5 h-3.5" />
               )}
              </div>
              <div className="min-w-0">
               <span
                className="font-bold text-xs sm:text-sm text-slate-900 block truncate"
                title={prov.name}
               >
                {prov.name}
               </span>
               <span className="text-[10px] text-slate-400 font-mono">
                ID: {prov.id}
               </span>
              </div>
             </div>

             <div className="flex items-center gap-1.5 flex-shrink-0">
              {isCap ? (
               <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500 text-white text-xs font-bold shadow-2xs">
                <Star className="w-3 h-3 fill-white text-white" />
                核心首府
               </span>
              ) : (
               <button
                type="button"
                onClick={() => setCapital(prov.name)}
                className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-amber-50 text-slate-600 hover:text-amber-700 text-xs font-semibold transition cursor-pointer border border-slate-200 hover:border-amber-200"
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
               className="p-1.5 text-slate-400 hover:text-rose-500 rounded-xl hover:bg-rose-50 transition cursor-pointer ml-0.5"
               title="移除省份"
              >
               <X className="w-4 h-4" />
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

     {/* 4. 政体制度 */}
     <div>
      <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1.5">
       政体制度
      </label>
      <div className="relative">
       <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 flex items-center justify-center pointer-events-none">
        <Scale className="w-4 h-4" />
       </div>
       <select
        id="select-nation-regime"
        value={regime}
        onChange={(e) => setRegime(e.target.value as RegimeType)}
        className="w-full pl-10 pr-8 py-2.5 bg-slate-50/80 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all appearance-none cursor-pointer font-medium"
       >
        {REGIMES.map((r) => (
         <option key={r} value={r}>
          {r}
         </option>
        ))}
       </select>
       <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>
     </div>

     {/* 4.5 四大政党命名 */}
     <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/90 space-y-3">
      <div className="flex items-center justify-between pb-1 border-b border-slate-200/60">
       <label className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5">
        <Scale className="w-4 h-4 text-indigo-600" />
        <span>政党命名</span>
       </label>
       <span className="text-[11px] text-slate-400 font-medium">
        指定执政党（初始支持率 45%~70%）
       </span>
      </div>

      {/* 4 Party Input Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
       {/* 1. 共产主义 */}
       <div className={`p-2.5 rounded-xl border transition-all space-y-1.5 shadow-2xs ${selectedRulingParty === 'communist' ? 'bg-rose-50/40 border-rose-400 ring-2 ring-rose-400/20' : 'bg-white border-slate-200/80 hover:border-rose-200'}`}>
        <div className="flex items-center justify-between">
         <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-rose-500"></span>
          <span className="text-xs font-bold text-slate-800">共产主义</span>
         </div>
         {selectedRulingParty === 'communist' ? (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-600 text-white shadow-2xs">
           ★ 执政党
          </span>
         ) : (
          <button
           type="button"
           onClick={() => setSelectedRulingParty('communist')}
           className="px-2 py-0.5 rounded-md text-[10px] font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition cursor-pointer"
          >
           设为执政党
          </button>
         )}
        </div>
        <input
         id="input-party-communist"
         type="text"
         value={communistPartyName}
         onChange={(e) => setCommunistPartyName(e.target.value)}
         placeholder="例：人民劳动共产党"
         className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-rose-500 focus:bg-white focus:ring-2 focus:ring-rose-500/10 transition-all font-medium"
        />
       </div>

       {/* 2. 法西斯主义 */}
       <div className={`p-2.5 rounded-xl border transition-all space-y-1.5 shadow-2xs ${selectedRulingParty === 'fascist' ? 'bg-amber-50/40 border-amber-700/50 ring-2 ring-amber-700/20' : 'bg-white border-slate-200/80 hover:border-amber-700/30'}`}>
        <div className="flex items-center justify-between">
         <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-700"></span>
          <span className="text-xs font-bold text-slate-800">法西斯主义</span>
         </div>
         {selectedRulingParty === 'fascist' ? (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-700 text-white shadow-2xs">
           ★ 执政党
          </span>
         ) : (
          <button
           type="button"
           onClick={() => setSelectedRulingParty('fascist')}
           className="px-2 py-0.5 rounded-md text-[10px] font-medium text-slate-500 hover:text-amber-700 hover:bg-amber-50 border border-slate-200 hover:border-amber-700/30 transition cursor-pointer"
          >
           设为执政党
          </button>
         )}
        </div>
        <input
         id="input-party-fascist"
         type="text"
         value={fascistPartyName}
         onChange={(e) => setFascistPartyName(e.target.value)}
         placeholder="例：国家复兴法西斯党"
         className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-600 focus:bg-white focus:ring-2 focus:ring-amber-600/10 transition-all font-medium"
        />
       </div>

       {/* 3. 民主主义 */}
       <div className={`p-2.5 rounded-xl border transition-all space-y-1.5 shadow-2xs ${selectedRulingParty === 'democratic' ? 'bg-blue-50/40 border-blue-400 ring-2 ring-blue-400/20' : 'bg-white border-slate-200/80 hover:border-blue-200'}`}>
        <div className="flex items-center justify-between">
         <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
          <span className="text-xs font-bold text-slate-800">民主主义</span>
         </div>
         {selectedRulingParty === 'democratic' ? (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-600 text-white shadow-2xs">
           ★ 执政党
          </span>
         ) : (
          <button
           type="button"
           onClick={() => setSelectedRulingParty('democratic')}
           className="px-2 py-0.5 rounded-md text-[10px] font-medium text-slate-500 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 transition cursor-pointer"
          >
           设为执政党
          </button>
         )}
        </div>
        <input
         id="input-party-democratic"
         type="text"
         value={democraticPartyName}
         onChange={(e) => setDemocraticPartyName(e.target.value)}
         placeholder="例：自由民主进步同盟"
         className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 transition-all font-medium"
        />
       </div>

       {/* 4. 中立主义 */}
       <div className={`p-2.5 rounded-xl border transition-all space-y-1.5 shadow-2xs ${selectedRulingParty === 'neutral' ? 'bg-slate-100/70 border-slate-400 ring-2 ring-slate-400/20' : 'bg-white border-slate-200/80 hover:border-slate-300'}`}>
        <div className="flex items-center justify-between">
         <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-slate-400"></span>
          <span className="text-xs font-bold text-slate-800">中立主义</span>
         </div>
         {selectedRulingParty === 'neutral' ? (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-700 text-white shadow-2xs">
           ★ 执政党
          </span>
         ) : (
          <button
           type="button"
           onClick={() => setSelectedRulingParty('neutral')}
           className="px-2 py-0.5 rounded-md text-[10px] font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 hover:border-slate-400 transition cursor-pointer"
          >
           设为执政党
          </button>
         )}
        </div>
        <input
         id="input-party-neutral"
         type="text"
         value={neutralPartyName}
         onChange={(e) => setNeutralPartyName(e.target.value)}
         placeholder="例：国家中立秩序阵线"
         className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-500 focus:bg-white focus:ring-2 focus:ring-slate-500/10 transition-all font-medium"
        />
       </div>
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

     {/* 6. 简介与立国誓词 */}
     <div>
      <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1.5">
       国家简介与立国誓词
      </label>
      <div className="relative">
       <div className="absolute left-3.5 top-3 text-slate-400 flex items-center justify-center pointer-events-none">
        <BookOpen className="w-4 h-4" />
       </div>
       <textarea
        id="textarea-nation-desc"
        rows={2}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="书写您帝国的起源、宗旨与地缘宏愿..."
        className="w-full pl-10 pr-4 py-2.5 bg-slate-50/80 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all resize-none font-medium"
       />
      </div>
     </div>

     {/* 7. 国家旗帜 */}
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
