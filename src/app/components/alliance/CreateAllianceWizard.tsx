import React, { useState } from 'react';
import {
 Shield,
 Swords,
 Coins,
 Landmark,
 Globe,
 ArrowRight,
 ArrowLeft,
 Check,
 Crown,
 Scale,
 FileText,
 Sparkles,
 Maximize2,
 Minimize2,
 X,
 Scroll,
 CheckCircle2,
 Building2,
 ShieldCheck,
 Award,
} from 'lucide-react';
import { AllianceFaction, AllianceRules, AllianceType, Nation } from '../../types';
import { ALLIANCE_TYPE_CONFIG } from '../../lib/allianceConstants';

interface CreateAllianceWizardProps {
 myNation: Nation;
 onCreateSuccess: (newAlliance: AllianceFaction) => void;
 onCancel: () => void;
 isFullScreen?: boolean;
 onToggleFullScreen?: () => void;
}

// Vertically Stacked Step Header Component
interface WizardStepHeaderProps {
 step: string;
 icon: React.ReactNode;
 title: string;
 subtext: string;
 extraRight?: React.ReactNode;
}

const WizardStepHeader: React.FC<WizardStepHeaderProps> = ({
 step,
 icon,
 title,
 subtext,
 extraRight,
}) => (
 <div className="border-b border-slate-200 pb-3 mb-5">
  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
   <div className="space-y-1.5 min-w-0">
    {/* 步骤徽章 */}
    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200/90 text-blue-700 text-[11px] font-bold tracking-wider uppercase shadow-2xs">
     {icon}
     <span>步骤 {step}</span>
    </div>
    {/* 标题 */}
    <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight whitespace-nowrap">
     {title}
    </h2>
    {/* 说明 */}
    <p className="text-xs text-slate-500 font-normal leading-relaxed">
     {subtext}
    </p>
   </div>
   {extraRight && <div className="shrink-0 pt-0.5">{extraRight}</div>}
  </div>
 </div>
);

export const CreateAllianceWizard: React.FC<CreateAllianceWizardProps> = ({
 myNation,
 onCreateSuccess,
 onCancel,
 isFullScreen = true,
 onToggleFullScreen,
}) => {
 const [currentStep, setCurrentStep] = useState<number>(1);

 // Step 1 State
 const [name, setName] = useState('');
 const [tag, setTag] = useState('');
 const [bannerColor, setBannerColor] = useState('#2563eb');
 const [headquartersCity, setHeadquartersCity] = useState(myNation.capital || '日光主城');
 const [description, setDescription] = useState('');

 // Step 2 State
 const [allianceType, setAllianceType] = useState<AllianceType>('defensive');

 // Step 3 State (Rules)
 const [rules, setRules] = useState<AllianceRules>({
  autoMutualDefense: true,
  allowIndependentWar: true,
  allowSecession: true,
  leaderCanKick: true,
  requireVoteForNewMembers: false,
  requireVoteForRuleChange: false,
 });

 // Step 4 State (Requirements)
 const [allowOpenApplication, setAllowOpenApplication] = useState(true);
 const [minStability, setMinStability] = useState(50);
 const [minFactories, setMinFactories] = useState(1);
 const [ideologyRequirement, setIdeologyRequirement] = useState('包容各政体主权国');

 // Available Banner Color Palette (Vibrant on light backgrounds)
 const colorOptions = [
  { hex: '#2563eb', label: '天青蓝' },
  { hex: '#dc2626', label: '绯红赤' },
  { hex: '#d97706', label: '琥珀金' },
  { hex: '#059669', label: '翡翠绿' },
  { hex: '#7c3aed', label: '紫罗兰' },
  { hex: '#0284c7', label: '极地冰' },
  { hex: '#475569', label: '钛合金' },
  { hex: '#9a3412', label: '帝国铜' },
 ];

 // Submit Handler
 const handleFinalSign = () => {
  if (!name.trim() || !tag.trim()) return;

  const newAlliance: AllianceFaction = {
   id: 'all_' + Date.now(),
   name: name.trim(),
   tag: tag.trim().toUpperCase(),
   leaderNationId: myNation.id,
   leaderNationName: myNation.name,
   memberNationIds: [myNation.id],
   memberNationNames: [myNation.name],
   description: description.trim() || ALLIANCE_TYPE_CONFIG[allianceType].desc,
   mutualDefense: rules.autoMutualDefense,
   bannerColor,
   createdAt: new Date().toISOString(),
   allianceType,
   rules,
   headquartersCity: headquartersCity.trim() || myNation.capital || '日光主城',
   joinRequirements: {
    allowOpenApplication,
    minStability,
    minFactories,
    ideologyRequirement,
   },
   memberRoles: {
    [myNation.id]: 'leader',
   },
   announcements: [
    {
     id: 'ann_' + Date.now(),
     title: `【${name.trim()}】最高战略公约正式公布`,
     content: `由盟主国【${myNation.name}】牵头创立，总部设于【${headquartersCity}】。恪守${ALLIANCE_TYPE_CONFIG[allianceType].label}宗旨，欢迎全大陆主权国家递交外交照会！`,
     authorNationName: myNation.name,
     createdAt: new Date().toISOString(),
     priority: 'urgent',
    },
   ],
   pendingApplications: [],
   chatMessages: [
    {
     id: 'msg_' + Date.now(),
     senderNationName: myNation.name,
     content: `【${myNation.name}】盟主在此设立最高阵营议事厅，全体缔约领主在此共商地缘大计。`,
     time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
   ],
  };

  onCreateSuccess(newAlliance);
 };

 const steps = [
  { num: 1, label: '公约确名与代码', desc: '宪章定名与战略识别' },
  { num: 2, label: '阵营宗旨定位', desc: '战略信条与地缘加成' },
  { num: 3, label: '同盟法定规约', desc: '集体防卫与决策特权' },
  { num: 4, label: '入盟准入门槛', desc: '申请门槛与意识形态' },
  { num: 5, label: '核准成立公约', desc: '多边条约文书签署' },
 ];

 return (
  <div className="w-full h-full min-h-screen flex flex-col font-mono bg-[#f1f5f9] text-slate-900 select-none bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px]">
   {/* 顶部白色调现代极简导航栏 */}
   <header className="px-4 sm:px-6 py-3 bg-white/95 backdrop-blur-xs border-b border-slate-200 shrink-0 shadow-xs z-10">
    <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
     {/* 左侧标题 */}
     <div className="min-w-0 flex flex-col justify-center">
      <div className="text-[10px] font-bold tracking-wider text-blue-600 uppercase">
       多边公约缔约工坊
      </div>
      <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-snug">
       创立国际多边同盟
      </h1>
     </div>

     {/* 右侧控制按钮栏 */}
     <div className="flex items-center gap-2 shrink-0">
      {onToggleFullScreen && (
       <button
        type="button"
        onClick={onToggleFullScreen}
        className="h-8 px-2.5 sm:px-3 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 rounded-sm text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
        title={isFullScreen ? '退出全屏' : '全屏模式'}
       >
        {isFullScreen ? (
         <>
          <Minimize2 className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden sm:inline">退出全屏</span>
         </>
        ) : (
         <>
          <Maximize2 className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden sm:inline">全屏模式</span>
         </>
        )}
       </button>
      )}
      <button
       type="button"
       onClick={onCancel}
       className="h-8 px-3 bg-white hover:bg-red-50 border border-slate-300 hover:border-red-300 text-slate-600 hover:text-red-600 rounded-sm text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
       title="取消创建并返回同盟大厅"
      >
       <X className="w-3.5 h-3.5 shrink-0" />
       <span>退出建盟</span>
      </button>
     </div>
    </div>

    {/* 5 步骤指示器 */}
    <div className="max-w-7xl mx-auto mt-3 grid grid-cols-5 gap-2">
     {steps.map((s) => {
      const isPassed = currentStep > s.num;
      const isCurrent = currentStep === s.num;

      return (
       <div
        key={s.num}
        onClick={() => {
         if (isPassed) setCurrentStep(s.num);
        }}
        className={`flex items-center gap-2 px-2.5 py-1.5 sm:py-2 rounded-sm transition-all border ${
         isCurrent
          ? 'bg-blue-50/90 border-blue-400 text-blue-900 shadow-xs'
          : isPassed
          ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer'
          : 'bg-slate-50/40 border-slate-100 text-slate-400 opacity-60'
        }`}
       >
        <div
         className={`w-5 h-5 rounded-xs flex items-center justify-center text-[11px] font-bold shrink-0 transition-colors ${
          isCurrent
           ? 'bg-blue-600 text-white'
           : isPassed
           ? 'bg-blue-100 text-blue-700'
           : 'bg-slate-200 text-slate-500'
         }`}
        >
         {isPassed ? <Check className="w-3 h-3 stroke-[2.5]" /> : `0${s.num}`}
        </div>
        <div className="min-w-0 hidden sm:block">
         <div className={`text-xs font-bold truncate ${isCurrent ? 'text-blue-900' : 'text-slate-700'}`}>
          {s.label}
         </div>
         <div className="text-[9px] text-slate-400 truncate hidden md:block">{s.desc}</div>
        </div>
       </div>
      );
     })}
    </div>
   </header>

   {/* 主体操作区域（白色高保真卡片，确保自顶部向下自然排版与平滑滚动） */}
   <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-5 max-w-7xl w-full mx-auto">
    {/* STEP 1: Basic Info */}
    {currentStep === 1 && (
     <div className="max-w-2xl w-full mx-auto space-y-6 animate-fadeIn">
      <WizardStepHeader
       step="01"
       icon={<FileText className="w-3.5 h-3.5" />}
       title="确立同盟公约与战略代号"
       subtext="国际识别码将用于全服战略广播"
      />

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-white p-6 rounded-sm border border-slate-200 shadow-xs">
       {/* Form Left */}
       <div className="md:col-span-8 space-y-4">
        <div>
         <label className="block text-xs font-bold text-slate-700 mb-1.5">
          同盟公约官方全称 <span className="text-red-500">*</span>
         </label>
         <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="例如：亚欧大陆共同安全与防御条约组织"
          maxLength={32}
          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 focus:border-blue-500 focus:bg-white rounded-sm text-xs text-slate-900 placeholder-slate-400 focus:outline-none transition-colors"
         />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
         <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
           战略代码 TAG (3-5位英文字符) <span className="text-red-500">*</span>
          </label>
          <input
           type="text"
           maxLength={5}
           value={tag}
           onChange={(e) => setTag(e.target.value.toUpperCase())}
           placeholder="例如：EATO"
           className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 focus:border-blue-500 focus:bg-white rounded-sm text-xs uppercase text-blue-700 font-bold tracking-wider placeholder-slate-400 focus:outline-none transition-colors"
          />
         </div>

         <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
           公约总部常驻地
          </label>
          <input
           type="text"
           value={headquartersCity}
           onChange={(e) => setHeadquartersCity(e.target.value)}
           placeholder={myNation.capital || '首都'}
           className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 focus:border-blue-500 focus:bg-white rounded-sm text-xs text-slate-900 focus:outline-none transition-colors"
          />
         </div>
        </div>

        <div>
         <label className="block text-xs font-bold text-slate-700 mb-1.5">
          同盟旗帜徽记主色调
         </label>
         <div className="flex items-center gap-3 flex-wrap bg-slate-50 p-3 rounded-sm border border-slate-200">
          {colorOptions.map((c) => (
           <button
            key={c.hex}
            type="button"
            onClick={() => setBannerColor(c.hex)}
            className={`group relative w-8 h-8 rounded-sm border-2 cursor-pointer transition-all flex items-center justify-center ${
             bannerColor === c.hex
              ? 'border-slate-900 scale-110 shadow-xs'
              : 'border-transparent opacity-80 hover:opacity-100 hover:scale-105'
            }`}
            style={{ backgroundColor: c.hex }}
            title={c.label}
           >
            {bannerColor === c.hex && <Check className="w-4 h-4 text-white stroke-[3]" />}
           </button>
          ))}
         </div>
        </div>

        <div>
         <label className="block text-xs font-bold text-slate-700 mb-1.5">
          公约前言与地缘宗旨宣言
         </label>
         <textarea
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="阐述同盟地缘宗旨、边境安全倡议与互保原则（若留空将采用阵营默认法典宣言）..."
          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 focus:border-blue-500 focus:bg-white rounded-sm text-xs text-slate-800 placeholder-slate-400 focus:outline-none transition-colors leading-relaxed"
         />
        </div>
       </div>

       {/* Preview Right */}
       <div className="md:col-span-4 flex flex-col">
        <div className="text-xs font-bold text-slate-600 mb-1.5">战略徽章实时预览</div>
        <div className="p-5 bg-slate-50 border border-slate-200 rounded-sm flex-1 flex flex-col items-center justify-center text-center space-y-3.5 shadow-xs">
         <div
          className="w-16 h-16 rounded-sm border-2 border-white flex items-center justify-center font-bold text-xl text-white shadow-md transition-all"
          style={{ backgroundColor: bannerColor }}
         >
          {tag || 'TAG'}
         </div>
         <div>
          <div className="text-xs font-bold text-slate-900 truncate max-w-[180px]">
           {name || '公约全称待确立'}
          </div>
          <div className="text-[11px] text-blue-600 font-semibold mt-0.5">
           常驻总部：{headquartersCity || myNation.capital || '待定'}
          </div>
         </div>
         <div className="text-[11px] text-slate-500 pt-2.5 border-t border-slate-200 w-full">
          创始盟主国：<strong className="text-slate-800">{myNation.name}</strong>
         </div>
        </div>
       </div>
      </div>
     </div>
    )}

    {/* STEP 2: Doctrine / Type */}
    {currentStep === 2 && (
     <div className="max-w-3xl w-full mx-auto space-y-4 animate-fadeIn">
      <WizardStepHeader
       step="02"
       icon={<Scale className="w-3.5 h-3.5" />}
       title="选择同盟战略定位与阵营类型"
       subtext="阵营类型代表同盟的地缘宗旨与多边协作方向"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
       {(Object.keys(ALLIANCE_TYPE_CONFIG) as AllianceType[]).map((key) => {
        const item = ALLIANCE_TYPE_CONFIG[key];
        const Icon = item.icon;
        const isSelected = allianceType === key;

        // 阵营类型战术分类
        const tacticalCodes: Record<
         AllianceType,
         {
          code: string;
          category: string;
         }
        > = {
         defensive: {
          code: '01',
          category: '集体防务与互保',
         },
         military: {
          code: '02',
          category: '多边军事条约',
         },
         economic: {
          code: '03',
          category: '关税同盟体系',
         },
         federation: {
          code: '04',
          category: '主权联邦联合体',
         },
         entente: {
          code: '05',
          category: '战略协约体系',
         },
        };

        const meta = tacticalCodes[key];

        return (
         <div
          key={key}
          onClick={() => setAllianceType(key)}
          className={`relative overflow-hidden border cursor-pointer transition-all duration-150 bg-white group select-none flex flex-col justify-between ${
           isSelected
            ? 'border-blue-600 bg-white shadow-md shadow-blue-500/10 ring-1 ring-blue-600'
            : 'border-slate-300/90 hover:border-slate-400 hover:shadow-xs'
          }`}
          style={{
           clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)',
          }}
         >
          {/* 左侧状态指示条 */}
          <div
           className={`absolute left-0 top-0 bottom-0 w-1.5 transition-colors ${
            isSelected ? 'bg-blue-600' : 'bg-slate-300 group-hover:bg-slate-400'
           }`}
          />

          {/* 背景水印图标 */}
          <div className="absolute -right-3 -bottom-3 pointer-events-none opacity-[0.04] text-slate-900 group-hover:opacity-[0.07] transition-opacity">
           <Icon size={110} strokeWidth={1} />
          </div>

          <div className="pl-3.5 pr-3 py-3.5 flex flex-col justify-between gap-3 h-full">
           {/* 顶部标题栏 */}
           <div>
            <div className="flex items-start justify-between gap-1.5 mb-1.5">
             <span className="font-black text-sm text-slate-900 tracking-tight whitespace-nowrap">
              {item.label}
             </span>

             {/* 状态徽章 */}
             <div className="shrink-0">
              {isSelected ? (
               <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-600 text-white font-mono text-[9px] font-bold tracking-wider shadow-2xs">
                <Check className="w-2.5 h-2.5 stroke-[3]" />
                <span>已选择</span>
               </span>
              ) : (
               <span className="inline-block px-1.5 py-0.5 bg-slate-100 text-slate-500 font-mono text-[9px] font-bold tracking-wider border border-slate-200">
                待选
               </span>
              )}
             </div>
            </div>

            <div className="font-mono text-[9.5px] font-bold text-blue-700 bg-blue-50/90 px-1.5 py-0.5 border border-blue-200/90 w-fit whitespace-nowrap mb-2.5">
             类型 {meta.code} · {meta.category}
            </div>

            {/* 说明描述 */}
            <p className="text-xs text-slate-600 leading-relaxed font-sans">
             {item.desc}
            </p>
           </div>
          </div>
         </div>
        );
       })}
      </div>
     </div>
    )}

    {/* STEP 3: Rules & Charter */}
    {currentStep === 3 && (
     <div className="max-w-3xl w-full mx-auto space-y-5 animate-fadeIn">
      <WizardStepHeader
       step="03"
       icon={<Shield className="w-3.5 h-3.5" />}
       title="裁定同盟公约法定规约章程"
       subtext="点击卡片切换条约法定权限与多边防务条款"
      />

      <div className="space-y-3">
       {[
        {
         key: 'autoMutualDefense',
         label: '自动触发集体共同防御',
         desc: '当任一成员国遭外部入侵时，全体缔约成员国自动宣告进入防御战争状态并协同参战。',
         recommended: true,
        },
        {
         key: 'allowIndependentWar',
         label: '允许成员国独立对外宣战',
         desc: '各缔约国保留自主发起对外军事行动的权力，无需同盟全体特别表决。',
         recommended: false,
        },
        {
         key: 'allowSecession',
         label: '允许成员国和平脱离公约',
         desc: '成员国可在非交战时期签署退出备忘录，和平脱离同盟体系而免受惩戒。',
         recommended: true,
        },
        {
         key: 'leaderCanKick',
         label: '盟主国拥有一票除名特权',
         desc: '盟主国元首拥有最高宪章裁决权，可单方面将严重违反公约的成员国逐出阵营。',
         recommended: true,
        },
        {
         key: 'requireVoteForNewMembers',
         label: '新成员准入需全体议事公投',
         desc: '开启后新成员申请需经全体缔约国公投表决通过，关闭则由盟主国统一裁定。',
         recommended: false,
        },
       ].map((rule) => {
        const isChecked = (rules as any)[rule.key];
        return (
         <div
          key={rule.key}
          onClick={() => setRules({ ...rules, [rule.key]: !isChecked })}
          className={`p-4 rounded-sm border flex items-center justify-between gap-4 cursor-pointer transition-all bg-white ${
           isChecked
            ? 'border-blue-400 ring-1 ring-blue-400/30 bg-blue-50/30 shadow-xs'
            : 'border-slate-200 hover:border-slate-400'
          }`}
         >
          <div className="space-y-1">
           <div className="flex items-center gap-2">
            <span className="font-bold text-xs text-slate-900">{rule.label}</span>
            {rule.recommended && (
             <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-300 text-emerald-700 text-[10px] rounded-sm font-bold">
              推荐开启
             </span>
            )}
           </div>
           <div className="text-xs text-slate-600 leading-relaxed">{rule.desc}</div>
          </div>
          <div
           className={`w-5 h-5 rounded-sm border flex items-center justify-center shrink-0 transition-colors ${
            isChecked
             ? 'bg-blue-600 border-blue-600 text-white'
             : 'border-slate-300 bg-slate-50'
           }`}
          >
           {isChecked && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
          </div>
         </div>
        );
       })}
      </div>
     </div>
    )}

    {/* STEP 4: Accession Requirements */}
    {currentStep === 4 && (
     <div className="max-w-3xl w-full mx-auto space-y-5 animate-fadeIn">
      <WizardStepHeader
       step="04"
       icon={<Crown className="w-3.5 h-3.5" />}
       title="设定新成员国入盟准入门槛与审核机制"
       subtext="过滤不符合地缘战略标准的申请国与工业基础要求"
      />

      <div className="space-y-4 bg-white p-6 rounded-sm border border-slate-200 shadow-xs">
       {/* Application Mode Switch */}
       <div className="p-4 bg-slate-50 border border-slate-200 rounded-sm flex items-center justify-between">
        <div>
         <div className="font-bold text-xs text-slate-900">开放全大陆公开外交申请</div>
         <div className="text-xs text-slate-500 mt-0.5">
          允许其他主权国家在大厅向本同盟递交入盟照会；关闭后仅接受盟主特邀。
         </div>
        </div>
        <button
         type="button"
         onClick={() => setAllowOpenApplication(!allowOpenApplication)}
         className={`px-4 py-1.5 text-xs rounded-sm font-bold transition-all cursor-pointer ${
          allowOpenApplication
           ? 'bg-blue-600 text-white shadow-xs'
           : 'bg-slate-200 text-slate-700'
         }`}
        >
         {allowOpenApplication ? '已开放申请' : '仅限邀约'}
        </button>
       </div>

       {/* Stability Requirement Slider */}
       <div className="p-4 bg-slate-50 border border-slate-200 rounded-sm space-y-2">
        <div className="flex justify-between items-center text-xs">
         <span className="text-slate-800 font-bold">申请国最低稳定度门槛</span>
         <strong className="text-emerald-600 font-bold text-sm">≥ {minStability}%</strong>
        </div>
        <input
         type="range"
         min={20}
         max={90}
         step={5}
         value={minStability}
         onChange={(e) => setMinStability(Number(e.target.value))}
         className="w-full accent-blue-600 cursor-pointer"
        />
        <div className="flex justify-between text-[11px] text-slate-500">
         <span>20% (极度宽松)</span>
         <span>50% (标准防务)</span>
         <span>90% (极度严苛)</span>
        </div>
       </div>

       {/* Factories Requirement Slider */}
       <div className="p-4 bg-slate-50 border border-slate-200 rounded-sm space-y-2">
        <div className="flex justify-between items-center text-xs">
         <span className="text-slate-800 font-bold">申请国最低军工厂规模</span>
         <strong className="text-amber-600 font-bold text-sm">≥ {minFactories} 座</strong>
        </div>
        <input
         type="range"
         min={0}
         max={20}
         step={1}
         value={minFactories}
         onChange={(e) => setMinFactories(Number(e.target.value))}
         className="w-full accent-amber-600 cursor-pointer"
        />
        <div className="flex justify-between text-[11px] text-slate-500">
         <span>0 座 (无工业门槛)</span>
         <span>5 座 (区域中等强国)</span>
         <span>20 座 (工业巨头)</span>
        </div>
       </div>

       {/* Ideology Requirement Dropdown */}
       <div className="p-4 bg-slate-50 border border-slate-200 rounded-sm space-y-1.5">
        <label className="text-slate-800 font-bold text-xs block">
         意识形态政体准入导向
        </label>
        <select
         value={ideologyRequirement}
         onChange={(e) => setIdeologyRequirement(e.target.value)}
         className="w-full p-2.5 bg-white border border-slate-300 focus:border-blue-500 text-slate-800 text-xs rounded-sm focus:outline-none font-medium"
        >
         <option value="包容各政体主权国">包容各政体主权国 (无限制，兼收并蓄)</option>
         <option value="军国主义与独裁体制">仅限 军国主义与集权独裁体制国家</option>
         <option value="民主共和与立宪政体">仅限 民主共和与代议立宪政体国家</option>
         <option value="绝对君主制政体">仅限 传统皇权与绝对君主制国家</option>
        </select>
       </div>
      </div>
     </div>
    )}

    {/* STEP 5: Final Review & Formal Treaty Signing (White Theme Sovereign Dossier) */}
    {currentStep === 5 && (
     <div className="max-w-4xl w-full mx-auto space-y-5 animate-fadeIn">
      <WizardStepHeader
       step="05"
       icon={<Sparkles className="w-3.5 h-3.5" />}
       title="核准公约文本并举行多边成立仪式"
       subtext="公约宪章核准就绪，签署生效并昭告天下"
       extraRight={
        <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-300 px-2.5 py-1 rounded-sm font-bold shadow-2xs">
         <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> 公约宪章核准就绪
        </div>
       }
      />

      {/* 白底庄严条约文书档案 */}
      <div className="bg-white border border-slate-200 rounded-sm shadow-md overflow-hidden">
       {/* Treaty Header */}
       <div className="px-6 py-5 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
         <div
          className="w-14 h-14 rounded-sm border-2 border-white flex items-center justify-center font-bold text-lg text-white shadow-md shrink-0"
          style={{ backgroundColor: bannerColor }}
         >
          {tag}
         </div>
         <div>
          <div className="flex items-center gap-2.5">
           <h3 className="text-lg font-bold text-slate-900">{name}</h3>
           <span className="px-2.5 py-0.5 bg-blue-100 border border-blue-200 text-blue-800 text-xs font-bold rounded-sm">
            代码：{tag}
           </span>
          </div>
          <div className="text-xs text-slate-600 font-medium mt-1 flex items-center gap-2">
           <span className="text-blue-700 font-bold">{ALLIANCE_TYPE_CONFIG[allianceType].label}</span>
           <span className="text-slate-300">|</span>
           <span>常驻总部：{headquartersCity}</span>
          </div>
         </div>
        </div>

        <div className="text-left sm:text-right text-xs text-slate-500 space-y-0.5 shrink-0">
         <div>公约签署状态：<strong className="text-emerald-600">已核准就绪</strong></div>
         <div>创始盟主主权国：<strong className="text-slate-800">{myNation.name}</strong></div>
        </div>
       </div>

       {/* 核心条约规格属性网格（8格单行不换行不截断） */}
       <div className="p-6 space-y-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
         <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-sm">
          <span className="text-[11px] text-slate-500 block font-semibold">盟主国</span>
          <strong className="text-slate-900 font-bold block truncate mt-0.5">{myNation.name}</strong>
         </div>
         <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-sm">
          <span className="text-[11px] text-slate-500 block font-semibold">阵营定位</span>
          <strong className="text-blue-700 font-bold block truncate mt-0.5">
           {ALLIANCE_TYPE_CONFIG[allianceType].label}
          </strong>
         </div>
         <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-sm">
          <span className="text-[11px] text-slate-500 block font-semibold">共同防御机制</span>
          <strong className={`font-bold block truncate mt-0.5 ${rules.autoMutualDefense ? 'text-emerald-700' : 'text-slate-600'}`}>
           {rules.autoMutualDefense ? '强制开启 (侵略即宣战)' : '协商自愿参战'}
          </strong>
         </div>
         <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-sm">
          <span className="text-[11px] text-slate-500 block font-semibold">开放申请机制</span>
          <strong className="text-amber-700 font-bold block truncate mt-0.5">
           {allowOpenApplication ? '开放全服照会申请' : '仅限邀约'}
          </strong>
         </div>
         <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-sm">
          <span className="text-[11px] text-slate-500 block font-semibold">准入稳定度门槛</span>
          <strong className="text-slate-900 font-bold block truncate mt-0.5">≥ {minStability}%</strong>
         </div>
         <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-sm">
          <span className="text-[11px] text-slate-500 block font-semibold">准入军工门槛</span>
          <strong className="text-slate-900 font-bold block truncate mt-0.5">≥ {minFactories} 座</strong>
         </div>
         <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-sm">
          <span className="text-[11px] text-slate-500 block font-semibold">意识形态准入</span>
          <strong className="text-slate-900 font-bold block truncate mt-0.5">{ideologyRequirement}</strong>
         </div>
         <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-sm">
          <span className="text-[11px] text-slate-500 block font-semibold">盟主特权</span>
          <strong className="text-indigo-700 font-bold block truncate mt-0.5">
           {rules.leaderCanKick ? '拥有一票除名特权' : '同盟议事会共决'}
          </strong>
         </div>
        </div>

        {/* 公约前言宣言文书板 */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-sm space-y-2">
         <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
          <Scroll className="w-4 h-4 text-blue-600" />
          <span>《公约前言宣言与最高战略宗旨》</span>
         </div>
         <p className="text-xs text-slate-700 leading-relaxed italic px-3 py-2 border-l-2 border-blue-500 bg-white rounded-r-sm">
          “{description.trim() || ALLIANCE_TYPE_CONFIG[allianceType].desc}”
         </p>
         <div className="text-[11px] text-slate-500 pt-1">
          依据国际战略公约法典，自全体缔约国签署之日起，本同盟各项章程即刻产生最高地缘法律效力。
         </div>
        </div>

        {/* 签字盖章栏 */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
         <div className="flex items-center gap-2 text-slate-600">
          <Award className="w-4 h-4 text-blue-600 shrink-0" />
          <span>
           盟主国战略统帅部：<strong className="text-slate-900">{myNation.name}</strong>
          </span>
         </div>
         <div className="text-xs text-slate-500 font-mono">
          公约生效纪元时间：{new Date().toLocaleDateString()}
         </div>
        </div>
       </div>
      </div>
     </div>
    )}
   </main>

   {/* 底部导航操作条（白底高对比按钮） */}
   <footer className="px-6 py-4 bg-white border-t border-slate-200 shrink-0 shadow-xs">
    <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
     <button
      type="button"
      onClick={() => {
       if (currentStep === 1) onCancel();
       else setCurrentStep(currentStep - 1);
      }}
      className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-sm text-xs font-bold cursor-pointer transition-colors flex items-center gap-2 whitespace-nowrap"
     >
      <ArrowLeft className="w-4 h-4" />
      <span>{currentStep === 1 ? '取消并返回大厅' : '返回上一步'}</span>
     </button>

     <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 font-mono">
      <span>步骤</span>
      <strong className="text-blue-600">0{currentStep}</strong>
      <span>/ 05</span>
     </div>

     {currentStep < 5 ? (
      <button
       type="button"
       onClick={() => {
        if (currentStep === 1 && (!name.trim() || !tag.trim())) {
         return alert('请先填写完整的同盟公约全称与战略代码 TAG (3-5位英文字符)');
        }
        setCurrentStep(currentStep + 1);
       }}
       className="px-8 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-sm text-xs cursor-pointer transition-all shadow-xs flex items-center gap-2 whitespace-nowrap"
      >
       <span>进入下一步</span>
       <ArrowRight className="w-4 h-4" />
      </button>
     ) : (
      <button
       type="button"
       onClick={handleFinalSign}
       className="px-9 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-sm text-xs sm:text-sm cursor-pointer transition-all shadow-md flex items-center gap-2 whitespace-nowrap"
      >
       <Check className="w-4 h-4 stroke-[3]" />
       <span>正式签署昭告天下 · 创立公约同盟</span>
      </button>
     )}
    </div>
   </footer>
  </div>
 );
};
