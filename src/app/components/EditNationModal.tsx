import React, { useState, useEffect } from 'react';
import {
 X,
 Crown,
 MapPin,
 Coins,
 Languages,
 Landmark,
 Scale,
 Sparkles,
 BookOpen,
 Save,
 Palette,
 FileText,
 ArrowRightLeft,
 Crop,
} from 'lucide-react';
import { Nation, RegimeType, IdeologyType } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { renderEmblemIcon } from '../lib/icons';
import { TikTokIcon } from './TikTokIcon';
import { FlagCropperModal } from './FlagCropperModal';

interface EditNationModalProps {
 isOpen: boolean;
 nation: Nation | null;
 onClose: () => void;
 onSuccess: (updatedNation: Nation) => void;
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
 { name: '海军蓝', value: '#1e40af' },
 { name: '夜幕青', value: '#0e7490' },
 { name: '黑曜石', value: '#1e293b' },
 { name: '朱砂红', value: '#991b1b' },
];

export const EditNationModal: React.FC<EditNationModalProps> = ({
 isOpen,
 nation,
 onClose,
 onSuccess,
}) => {
 const { setMyNation, user } = useAuth();

 const [name, setName] = useState('');
 const [capital, setCapital] = useState('');
 const [territory, setTerritory] = useState('');
 const [description, setDescription] = useState('');
 const [regime, setRegime] = useState<RegimeType>('君主立宪制');
 const [ideology, setIdeology] = useState<IdeologyType>('中立和平主义');
 const [language, setLanguage] = useState('汉语');
 const [currencyMode, setCurrencyMode] = useState<'lingyu' | 'custom'>('lingyu');
 const [customCurrencyName, setCustomCurrencyName] = useState('');
 const [currencyRate, setCurrencyRate] = useState<number>(1);
 const [flagColor, setFlagColor] = useState('#1e40af');
 const [emblemIcon, setEmblemIcon] = useState('Crown');

 // Flag 3:4 Cropper State
 const [isCropperOpen, setIsCropperOpen] = useState(false);
 const [cropperSourceImage, setCropperSourceImage] = useState<string | null>(null);
 const [cropperReasonNotice, setCropperReasonNotice] = useState<string>('');

 const [error, setError] = useState<string | null>(null);
 const [isLoading, setIsLoading] = useState(false);

 useEffect(() => {
  if (nation) {
   setName(nation.name || '');
   setCapital(nation.capital || '');
   setTerritory(nation.territory || '');
   setDescription(nation.description || '');
   setRegime(nation.regime || '君主立宪制');
   setIdeology(nation.ideology || '中立和平主义');
   setLanguage(nation.language || '汉语');
   
   const isDefault = !nation.currency || nation.currency === '玲玉币';
   setCurrencyMode(isDefault ? 'lingyu' : 'custom');
   setCustomCurrencyName(isDefault ? '' : (nation.currency || ''));
   setCurrencyRate(typeof nation.currencyRate === 'number' && nation.currencyRate > 0 ? nation.currencyRate : 1);

   setFlagColor(nation.flagColor || '#1e40af');
   setEmblemIcon(nation.emblemIcon || 'Crown');
   setError(null);
  }
 }, [nation]);

 if (!isOpen || !nation) return null;

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError(null);
  setIsLoading(true);

  try {
   if (!name.trim()) throw new Error('请填写国家名称');
   if (!capital.trim()) throw new Error('请填写首都名称');
   if (!territory.trim()) throw new Error('请填写国家疆域');

   const finalCurrency = currencyMode === 'lingyu' ? '玲玉币' : (customCurrencyName.trim() || '主权货币');
   const finalCurrencyRate = currencyMode === 'lingyu' ? 1 : (Number(currencyRate) > 0 ? Number(currencyRate) : 1);

   const res = await api.nations.update(nation.id, {
    name: name.trim(),
    capital: capital.trim(),
    territory: territory.trim(),
    description: description.trim(),
    regime,
    ideology,
    language: language.trim(),
    currency: finalCurrency,
    currencyRate: finalCurrencyRate,
    flagColor,
    emblemIcon,
   });

   if (user && nation.ownerId === user.id) {
    setMyNation(res.nation);
   }

   onSuccess(res.nation);
   onClose();
  } catch (err: any) {
   setError(err.message || '更新国家信息失败');
  } finally {
   setIsLoading(false);
  }
 };

 return (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto animate-fadeIn">
   <div
    id="edit-nation-modal"
    className="w-full max-w-2xl my-auto bg-[#fbfbfa] text-slate-900 border border-slate-300 rounded shadow-2xl overflow-hidden relative max-h-[92vh] flex flex-col font-sans"
   >
    {/* Top Flag accent strip */}
    <div className="h-1.5 w-full flex-shrink-0" style={{ backgroundColor: flagColor }} />

    {/* Modal Header */}
    <div className="px-4 sm:px-6 py-3.5 bg-slate-900 text-slate-100 border-b border-slate-800 flex items-center justify-between gap-3 flex-shrink-0">
     <div className="flex items-center gap-3">
      <div
       className="w-9 h-9 rounded-lg border border-slate-700 flex items-center justify-center shadow-inner flex-shrink-0"
       style={{ backgroundColor: flagColor }}
      >
       {renderEmblemIcon(emblemIcon, { className: 'w-5 h-5 text-white drop-shadow' })}
      </div>
      <div>
       <div className="flex items-center gap-2">
        <h2 className="text-base sm:text-lg font-bold tracking-wide text-slate-100 flex items-center gap-1.5">
         <Crown className="w-4 h-4 text-amber-400" />
         国家资料与政府体制修订页面
        </h2>
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
         公报提示页
        </span>
       </div>
       <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2 mt-0.5">
        <span>
         目标国家：<strong className="text-slate-200">{nation.name}</strong>
        </span>
        <span className="text-slate-600">|</span>
        <span className="flex items-center gap-1">
         <TikTokIcon className="w-3 h-3 text-slate-300" />
         <span>{user?.douyinName || user?.username || 'Lingyu'}</span>
        </span>
       </div>
      </div>
     </div>

     <button
      id="edit-nation-close-btn"
      type="button"
      onClick={onClose}
      className="text-slate-400 hover:text-slate-200 p-1.5 rounded hover:bg-slate-800 transition cursor-pointer border border-transparent hover:border-slate-700"
      title="关闭"
     >
      <X className="w-5 h-5" />
     </button>
    </div>

    {/* Prominent Prompt Box Notice Banner (提示框页面横幅) */}
    <div className="mx-4 sm:mx-6 mt-4 p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl flex items-start gap-2.5 text-xs text-amber-900 shadow-2xs">
     <div className="p-1 rounded-md bg-amber-500 text-white font-bold text-[10px] flex-shrink-0 mt-0.5">
      提示
     </div>
     <div className="leading-relaxed">
      <span className="font-bold text-amber-950">国家档案与政府修订提示：</span>
      您可以在此页面修改国家的<strong>国号、法定首都、政体形式、意识形态、官方货币及国旗国徽</strong>。点击底部保存后将实时同步至万国大厅与战略地图。
     </div>
    </div>

    {error && (
     <div className="mx-4 sm:mx-6 mt-3 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-medium">
      {error}
     </div>
    )}

    <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
     <div className="bg-white border border-slate-200 rounded p-3.5 sm:p-4 space-y-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-100 font-mono">
       <FileText className="w-3.5 h-3.5 text-amber-700" />
       第一章 · 国号与法定首府
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
       <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">
         国家名称（国号） <span className="text-rose-600">*</span>
        </label>
        <div className="relative">
         <div className="absolute left-2.5 top-2 text-slate-400 font-serif font-bold text-xs select-none">
          印
         </div>
         <input
          id="edit-nation-name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-300 rounded text-sm text-slate-900 focus:outline-none focus:border-slate-800 focus:bg-white transition"
         />
        </div>
       </div>

       <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">
         首都（首府） <span className="text-rose-600">*</span>
        </label>
        <div className="relative">
         <Landmark className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
         <input
          id="edit-nation-capital"
          type="text"
          required
          value={capital}
          onChange={(e) => setCapital(e.target.value)}
          className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-300 rounded text-sm text-slate-900 focus:outline-none focus:border-slate-800 focus:bg-white transition font-mono"
         />
        </div>
       </div>
      </div>

      <div>
       <label className="block text-xs font-bold text-slate-700 mb-1">
        国家疆域描述
       </label>
       <div className="relative">
        <MapPin className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
        <input
         id="edit-nation-territory"
         type="text"
         required
         value={territory}
         onChange={(e) => setTerritory(e.target.value)}
         className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-300 rounded text-sm text-slate-900 focus:outline-none focus:border-slate-800 focus:bg-white transition font-mono"
        />
       </div>
      </div>
     </div>

     <div className="bg-white border border-slate-200 rounded p-3.5 sm:p-4 space-y-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-100 font-mono">
       <Scale className="w-3.5 h-3.5 text-amber-700" />
       第二章 · 制度法统与社会结构
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
       <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">政体制度</label>
        <div className="relative">
         <Scale className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
         <select
          id="edit-select-regime"
          value={regime}
          onChange={(e) => setRegime(e.target.value as RegimeType)}
          className="w-full pl-8 pr-8 py-2 bg-slate-50 border border-slate-300 rounded text-sm text-slate-900 focus:outline-none focus:border-slate-800 focus:bg-white transition appearance-none cursor-pointer"
         >
          {REGIMES.map((r) => (
           <option key={r} value={r}>
            {r}
           </option>
          ))}
         </select>
        </div>
       </div>

       <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">国家意识形态</label>
        <div className="relative">
         <Sparkles className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
         <select
          id="edit-select-ideology"
          value={ideology}
          onChange={(e) => setIdeology(e.target.value as IdeologyType)}
          className="w-full pl-8 pr-8 py-2 bg-slate-50 border border-slate-300 rounded text-sm text-slate-900 focus:outline-none focus:border-slate-800 focus:bg-white transition appearance-none cursor-pointer"
         >
          {IDEOLOGIES.map((i) => (
           <option key={i} value={i}>
            {i}
           </option>
          ))}
         </select>
        </div>
       </div>

       <div className="sm:col-span-2">
        <label className="block text-xs font-bold text-slate-700 mb-1">官方语言</label>
        <div className="relative">
         <Languages className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2.5" />
         <input
          id="edit-nation-language"
          type="text"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="w-full pl-7 pr-2 py-2 bg-slate-50 border border-slate-300 rounded text-xs text-slate-900 focus:outline-none focus:border-slate-800 focus:bg-white transition"
         />
        </div>
       </div>
      </div>

      {/* Currency & Exchange Rate Selector */}
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
       <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
         <Coins className="w-3.5 h-3.5 text-amber-500" />
         <span>流通货币体系与基准汇率</span>
        </label>
        <span className="text-[10px] text-slate-500 font-medium">全服基准币：<strong className="text-amber-600 font-bold">玲玉币</strong></span>
       </div>

       {/* Mode Switcher */}
       <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200/60">
        <button
         type="button"
         onClick={() => setCurrencyMode('lingyu')}
         className={`py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
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
         className={`py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
          currencyMode === 'custom'
           ? 'bg-white text-indigo-700 shadow-xs border border-indigo-200/80'
           : 'bg-transparent text-slate-500 hover:text-slate-800'
         }`}
        >
         <Landmark className="w-4 h-4 text-indigo-500 flex-shrink-0" />
         <span>自定义主权币</span>
        </button>
       </div>

       {currencyMode === 'lingyu' ? (
        <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200/60 flex items-center gap-2">
         <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-xs flex-shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
           <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
         </div>
         <div>
          <div className="text-xs font-bold text-slate-900 flex items-center gap-1">
           <span>通用法币 · 玲玉币</span>
           <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-mono font-bold">1:1 固定平价</span>
          </div>
          <div className="text-[10px] text-slate-500">全境法定基准本位，国际条约与工业贸易零兑换损耗</div>
         </div>
        </div>
       ) : (
        <div className="space-y-2.5 pt-0.5">
         <div>
          <label className="block text-[11px] font-bold text-slate-700 mb-1">
           主权货币名称
          </label>
          <div className="relative">
           <Coins className="w-3.5 h-3.5 text-indigo-500 absolute left-2.5 top-2.5" />
           <input
            type="text"
            value={customCurrencyName}
            onChange={(e) => setCustomCurrencyName(e.target.value)}
            placeholder="例如：大秦半两、银元、卢布、第纳尔..."
            className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
           />
          </div>
         </div>

         <div className="space-y-2">
          <div className="flex items-center justify-between">
           <label className="text-[11px] font-bold text-slate-700">
            对玲玉币基准汇率 (1 {customCurrencyName.trim() || '主权币'} = ? 玲玉币)
           </label>
          </div>

          {/* Integrated Formula Row with baseline-centered alignment */}
          <div className="flex items-center justify-center gap-2 p-2 bg-slate-50 border border-slate-200/90 rounded-lg text-xs font-medium">
           <span className="text-slate-600 font-semibold">1</span>
           <span className="text-slate-800 font-semibold truncate max-w-[100px]">{customCurrencyName.trim() || '主权币'}</span>
           <span className="text-slate-400 font-semibold">=</span>
           
           <input
            type="number"
            step="0.01"
            min="0.01"
            max="10000"
            value={currencyRate}
            onChange={(e) => setCurrencyRate(parseFloat(e.target.value) || 0)}
            className="w-20 h-7 px-2 bg-white border border-indigo-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 rounded text-xs font-bold text-indigo-700 text-center font-mono focus:outline-none transition shadow-2xs"
           />

           <span className="text-slate-800 font-semibold">玲玉币</span>
          </div>

          {/* 3x2 Grid Presets: 0.1 -> 0.5 -> 1.0 -> 2.0 -> 5.0 -> 10.0 */}
          <div className="space-y-1 pt-0.5">
           <div className="text-[10px] font-bold text-slate-500">快捷档位</div>
           <div className="grid grid-cols-3 gap-1.5">
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
              className={`py-1 px-1.5 rounded text-[11px] font-semibold transition cursor-pointer border text-center ${
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

         {/* Converter summary */}
         <div className="p-2.5 bg-slate-100/70 border border-slate-200/80 rounded-lg space-y-1.5">
          <div className="flex items-center justify-between text-[10px] text-slate-500">
           <span>购买力评级：</span>
           <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
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

          <div className="p-2 bg-white rounded border border-slate-200/80 flex items-center justify-between text-xs">
           <div className="text-left font-black text-slate-800 tracking-tight">
            100 <span className="text-[11px] font-bold text-slate-500">{customCurrencyName.trim() || '主权币'}</span>
           </div>
           <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-50 border border-slate-200/60 text-slate-500 text-[10px] font-mono font-bold">
            <ArrowRightLeft className="w-3 h-3 text-slate-400" />
            <span>1:{currencyRate}</span>
           </div>
           <div className="text-right font-black text-slate-800 tracking-tight">
            {(100 * (Number(currencyRate) || 0)).toFixed(1)} <span className="text-[11px] font-bold text-amber-600">玲玉币</span>
           </div>
          </div>
         </div>
        </div>
       )}
      </div>

      <div>
       <label className="block text-xs font-bold text-slate-700 mb-1">国家简介与立国誓词</label>
       <textarea
        id="edit-nation-desc"
        rows={2}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-xs text-slate-900 focus:outline-none focus:border-slate-800 focus:bg-white resize-none"
       />
      </div>
     </div>

     {/* Color & Emblem */}
     <div className="bg-white border border-slate-200 rounded p-3.5 sm:p-4 space-y-3 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-100 font-mono">
       <Palette className="w-3.5 h-3.5 text-amber-700" />
       第三章 · 版图色彩与国徽印玺
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
       <div>
        <label className="block text-xs font-bold text-slate-700 mb-1.5">版图基准色</label>
        <div className="flex flex-wrap gap-1.5">
         {FLAG_COLORS.map((c) => (
          <button
           key={c.value}
           type="button"
           onClick={() => setFlagColor(c.value)}
           className={`w-6 h-6 rounded border transition-all cursor-pointer ${
            flagColor === c.value
             ? 'ring-2 ring-slate-900 border-white scale-110 shadow-sm'
             : 'border-slate-300 opacity-80 hover:opacity-100'
           }`}
           style={{ backgroundColor: c.value }}
           title={c.name}
          />
         ))}
        </div>
       </div>

       <div>
        <div className="flex items-center justify-between mb-1.5">
         <label className="block text-xs font-bold text-slate-700">国旗 / 国徽印玺 (4:3)</label>
         <span className="text-[10px] font-mono text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
          标准 4:3
         </span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
         <div
          className="w-13 h-10 rounded border border-slate-300 flex items-center justify-center text-white shadow-xs overflow-hidden"
          style={
           emblemIcon && emblemIcon.startsWith('data:image')
            ? {}
            : { backgroundColor: flagColor }
          }
         >
          {renderEmblemIcon(emblemIcon, { className: 'w-5 h-5 text-white' })}
         </div>

         <div className="flex flex-wrap items-center gap-1.5">
          <label className="px-2.5 py-1 bg-white border border-slate-300 text-slate-700 rounded text-xs font-mono font-medium hover:bg-slate-50 cursor-pointer transition shadow-xs">
           更换图像
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
             e.target.value = '';
            }}
           />
          </label>

          {emblemIcon && emblemIcon.startsWith('data:image') && (
           <button
            type="button"
            onClick={() => setEmblemIcon('Crown')}
            className="text-[11px] text-rose-600 hover:underline font-mono ml-1"
           >
            恢复默认
           </button>
          )}
         </div>
        </div>
       </div>
      </div>
     </div>

     {/* Flag 4:3 Cropper Modal */}
     <FlagCropperModal
      isOpen={isCropperOpen}
      imageSrc={cropperSourceImage}
      title="法典国旗 4:3 规格裁切"
      reasonNotice={cropperReasonNotice}
      onClose={() => setIsCropperOpen(false)}
      onCropComplete={(croppedUrl) => {
       setEmblemIcon(croppedUrl);
      }}
     />

     <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-200">
      <button
       type="button"
       onClick={onClose}
       className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded text-xs border border-slate-300 transition cursor-pointer font-mono"
      >
       取消
      </button>

      <button
       id="submit-edit-nation-btn"
       type="submit"
       disabled={isLoading}
       className="flex-1 sm:flex-initial px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded text-xs border border-slate-900 shadow-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 font-mono tracking-wide active:scale-98"
      >
       {isLoading ? (
        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
       ) : (
        <Save className="w-4 h-4 text-amber-400" />
       )}
       <span>保存法典修订</span>
      </button>
     </div>
    </form>
   </div>
  </div>
 );
};
