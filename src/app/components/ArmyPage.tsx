import React, { useEffect, useMemo, useState, useRef } from "react";
import { ArmyDivision, ArmyState, Nation } from "../types";
import {
 Activity,
 AlertTriangle,
 CheckCircle2,
 Clock3,
 Crosshair,
 FileText,
 GraduationCap,
 HeartHandshake,
 Layers,
 MapPin,
 Plus,
 RefreshCw,
 Scale,
 Shield,
 ShieldAlert,
 ShieldCheck,
 Swords,
 Users,
 Wrench,
 Zap,
 Package,
 Boxes,
 Award,
 ChevronRight,
 Sparkles,
 Info,
 X,
} from "lucide-react";
import {
 CONSCRIPTION_LAWS,
 ConscriptionLaw,
 calculateNationalDemographics,
 getDivisionFillRateMeta,
} from "../lib/manpowerEngine";
import { getProvinceChineseName } from "../lib/provinceTranslations";

const GAME_DAYS_PER_REAL_DAY = 365;
const TRAINING_DAYS = 180;

const templates = {
 "步兵师": {
  infantry: 9,
  artillery: 2,
  support: 1,
  armor: 0,
  manpower: 10000,
  rifles: 9000,
  artilleryNeed: 72,
  trucks: 20,
  supportNeed: 180,
 },
 "摩托化师": {
  infantry: 6,
  artillery: 2,
  support: 2,
  armor: 0,
  manpower: 9000,
  rifles: 6500,
  artilleryNeed: 60,
  trucks: 650,
  supportNeed: 220,
 },
 "装甲师": {
  infantry: 4,
  artillery: 2,
  support: 2,
  armor: 4,
  manpower: 8500,
  rifles: 4000,
  artilleryNeed: 54,
  trucks: 350,
  supportNeed: 260,
 },
};

const emptyArmy = (): ArmyState => ({
 manpowerReserve: 128500,
 armyExperience: 0,
 divisions: [],
 generals: [],
});

function statusMeta(status: ArmyDivision["status"]) {
 if (status === "training")
  return { label: "训练中", tone: "text-sky-300 border-sky-500/40 bg-sky-950/40" };
 if (status === "deploying")
  return { label: "待部署", tone: "text-amber-300 border-amber-500/40 bg-amber-950/40" };
 if (status === "fighting")
  return { label: "交战中", tone: "text-rose-300 border-rose-500/40 bg-rose-950/40" };
 if (status === "moving")
  return { label: "机动中", tone: "text-indigo-300 border-indigo-500/40 bg-indigo-950/40" };
 return {
  label: status === "garrison" ? "驻防防区" : status === "undersupplied" ? "补给短缺" : "战备就绪",
  tone: "text-emerald-300 border-emerald-500/40 bg-emerald-950/40",
 };
}

export function ArmyPage({
 nation,
 onUpdateNation,
 showToast,
}: {
 nation: Nation | null;
 onUpdateNation: (nation: Nation) => void;
 showToast: (message: string) => void;
}) {
 const [selectedId, setSelectedId] = useState<string | null>(null);
 const [recruitOpen, setRecruitOpen] = useState(false);
 const [lawModalOpen, setLawModalOpen] = useState(false);
 const [equipmentModalOpen, setEquipmentModalOpen] = useState(false);
 const [type, setType] = useState<keyof typeof templates>("步兵师");
 const [name, setName] = useState("");
 const [deployProvinceId, setDeployProvinceId] = useState("");

 const army = nation?.army || emptyArmy();
 const stock = nation?.militaryIndustry?.stockpiles || {};
 const selected = army.divisions.find((division) => division.id === selectedId) || army.divisions[0];

 // 人口与动员兵力体系实时计算
 const demo = useMemo(() => calculateNationalDemographics(nation), [nation]);
 const trainingDivisions = army.divisions.filter((division) => division.status === "training");
 const deployableDivisions = army.divisions.filter((division) => division.status === "deploying");
 const activeDivisions = army.divisions.filter((division) => division.status !== "training");

 const persist = (nextArmy: ArmyState, nextStock = stock, nextNationOverride: Partial<Nation> = {}) => {
  if (!nation) return;
  onUpdateNation({
   ...nation,
   ...nextNationOverride,
   army: nextArmy,
   militaryIndustry: {
    ...(nation.militaryIndustry || { productionLines: [], customDesigns: [], stockpiles: {} }),
    stockpiles: nextStock,
    lastUpdated: new Date().toISOString(),
   },
  });
 };

 const armyRef = useRef(army);
 armyRef.current = army;
 const nationRef = useRef(nation);
 nationRef.current = nation;

 // 训练进度按全局世界时间结算
 useEffect(() => {
  const settleTraining = () => {
   const currentArmy = armyRef.current;
   const currentNation = nationRef.current;
   if (!currentNation) return;
   const now = Date.now();
   let changed = false;
   const nextDivisions = currentArmy.divisions.map((division) => {
    if (division.status !== "training") return division;
    const last = Date.parse(
     division.trainingLastCalculatedAt || division.trainingStartedAt || division.createdAt
    );
    const elapsed = Math.max(0, now - (Number.isFinite(last) ? last : now));
    if (elapsed < 15_000) return division;
    const completed = Math.min(
     division.trainingDaysTotal || TRAINING_DAYS,
     (division.trainingDaysCompleted || 0) + (elapsed / 86_400_000) * GAME_DAYS_PER_REAL_DAY
    );
    changed = true;
    if (completed >= (division.trainingDaysTotal || TRAINING_DAYS)) {
     return {
      ...division,
      status: "deploying" as const,
      trainingDaysCompleted: division.trainingDaysTotal || TRAINING_DAYS,
      trainingLastCalculatedAt: new Date(now).toISOString(),
     };
    }
    return {
     ...division,
     trainingDaysCompleted: completed,
     trainingLastCalculatedAt: new Date(now).toISOString(),
    };
   });
   if (changed) persist({ ...currentArmy, divisions: nextDivisions });
  };

  const timer = window.setInterval(settleTraining, 30_000);
  return () => window.clearInterval(timer);
 }, []);

 // 征募新部队
 const recruit = () => {
  if (!nation) return;
  const blueprint = templates[type];
  if (demo.availableReserve < blueprint.manpower) {
   return showToast("全国战略后备兵员不足，请调整征兵动员法案或等待复员！");
  }
  const currentTanks = (stock.eq_tank_medium || 0) + (stock.eq_tank || 0) + (stock.des_default_tank || 0);
  const available = {
   rifle: stock.eq_rifle || 0,
   artillery: stock.eq_artillery || 0,
   truck: stock.eq_truck || 0,
   support: stock.eq_support || 0,
   armor: currentTanks,
  };
  const needs = {
   rifle: blueprint.rifles,
   artillery: blueprint.artilleryNeed,
   truck: blueprint.trucks,
   support: blueprint.supportNeed,
   armor: blueprint.armor * 80,
  };
  const rate = Math.min(
   1,
   ...Object.keys(needs).map((key) =>
    needs[key as keyof typeof needs] ? available[key as keyof typeof available] / needs[key as keyof typeof needs] : 1
   )
  );
  const nextTanks = Math.max(0, currentTanks - needs.armor);
  const nextStock = {
   ...stock,
   eq_rifle: Math.max(0, available.rifle - needs.rifle),
   eq_artillery: Math.max(0, available.artillery - needs.artillery),
   eq_truck: Math.max(0, available.truck - needs.truck),
   eq_support: Math.max(0, available.support - needs.support),
   eq_tank_medium: nextTanks,
   eq_tank: nextTanks,
  };
  const now = new Date().toISOString();
  const division: ArmyDivision = {
   id: `div_${Date.now()}`,
   name: name.trim() || `第${army.divisions.length + 1}${type}`,
   type,
   corps: "第1集团军",
   provinceId: "",
   provinceName: "新兵训练中心",
   status: "training",
   manpower: blueprint.manpower,
   manpowerMax: blueprint.manpower,
   equipmentRate: Math.max(0, Math.min(100, Math.round(rate * 100))),
   organization: Math.round(35 + rate * 25),
   supply: 100,
   experience: 0,
   template: {
    infantry: blueprint.infantry,
    artillery: blueprint.artillery,
    support: blueprint.support,
    armor: blueprint.armor,
   },
   createdAt: now,
   trainingStartedAt: now,
   trainingLastCalculatedAt: now,
   trainingDaysCompleted: 0,
   trainingDaysTotal: TRAINING_DAYS,
  };

  persist(
   {
    ...army,
    manpowerReserve: Math.max(0, army.manpowerReserve - blueprint.manpower),
    divisions: [...army.divisions, division],
   },
   nextStock
  );
  setSelectedId(division.id);
  setRecruitOpen(false);
  setName("");
  showToast(`【${division.name}】已建立并进入国家军事训练中心。`);
 };

 // 部署部队
 const deploySelected = () => {
  if (!nation || !selected || selected.status !== "deploying") return;
  const province = nation.provinces?.find((item) => String(item.id) === deployProvinceId);
  if (!province) return showToast("请选择本国控制的部署省份");
  const nextDivisions = army.divisions.map((division) =>
   division.id === selected.id
    ? {
      ...division,
      provinceId: province.id,
      provinceName: getProvinceChineseName(province.name || province.id) || province.name,
      status: "ready" as const,
      organization: Math.max(division.organization, 60),
     }
    : division
  );
  persist({ ...army, divisions: nextDivisions });
  showToast(`【${selected.name}】已正式部署至 ${getProvinceChineseName(province.name || province.id) || province.name} 防区。`);
 };

 // 单个部队战地补充兵员 (Reinforce Single Division)
 const reinforceDivision = (divisionId: string) => {
  if (!nation) return;
  const div = army.divisions.find((d) => d.id === divisionId);
  if (!div) return;
  const deficit = Math.max(0, (div.manpowerMax || 10000) - div.manpower);
  if (deficit <= 0) return showToast("该师编制已满员，无需补员。");
  if (demo.availableReserve <= 0) return showToast("国家战略后备兵员耗尽，无法补员！");

  const reinforceAmount = Math.min(deficit, demo.availableReserve);
  const nextDivisions = army.divisions.map((d) =>
   d.id === divisionId
    ? { ...d, manpower: d.manpower + reinforceAmount }
    : d
  );

  persist({
   ...army,
   manpowerReserve: Math.max(0, army.manpowerReserve - reinforceAmount),
   divisions: nextDivisions,
  });
  showToast(`已向【${div.name}】补充 ${reinforceAmount.toLocaleString()} 名作战兵员！`);
 };

 // 全军一键战备满员补足 (Batch Reinforce All Divisions)
 const batchReinforceAll = () => {
  if (!nation) return;
  if (demo.totalManpowerDeficit <= 0) return showToast("全陆军所有部队当前编制均处于满员状态！");
  if (demo.availableReserve <= 0) return showToast("国家战略后备兵员不足，请调整征兵法案。");

  let pool = demo.availableReserve;
  let totalReinforced = 0;

  const nextDivisions = army.divisions.map((div) => {
   const max = div.manpowerMax || 10000;
   const deficit = Math.max(0, max - div.manpower);
   if (deficit <= 0 || pool <= 0) return div;

   const fill = Math.min(deficit, pool);
   pool -= fill;
   totalReinforced += fill;
   return {
    ...div,
    manpower: div.manpower + fill,
   };
  });

  persist({
   ...army,
   manpowerReserve: Math.max(0, army.manpowerReserve - totalReinforced),
   divisions: nextDivisions,
  });
  showToast(`总司令部下达动员令：全军成功补充 ${totalReinforced.toLocaleString()} 名战备兵员！`);
 };

 // 签署并颁布征兵法案
 const enactConscriptionLaw = (law: ConscriptionLaw) => {
  if (!nation) return;
  persist(army, stock, { conscriptionLawId: law.id });
  setLawModalOpen(false);
  showToast(`最高国防委员会已签署并颁布【${law.name}】！适役动员比例调整为 ${law.rateLabel}。`);
 };

 const selectedTrainingProgress =
  selected?.status === "training"
   ? Math.min(
     100,
     Math.round(
      ((selected.trainingDaysCompleted || 0) /
       Math.max(1, selected.trainingDaysTotal || TRAINING_DAYS)) *
       100
     )
    )
   : 0;

 if (!nation)
  return (
   <div className="p-12 text-center text-slate-400 bg-[#090d12] h-full flex flex-col items-center justify-center">
    <Shield className="w-10 h-10 text-slate-600 mb-3" />
    <div className="text-base font-bold text-slate-300">未检测到有效主权国家政权</div>
    <div className="text-xs text-slate-500 mt-1">请先在世界沙盘建立或选择国家后管理陆军战备体系。</div>
   </div>
  );

 const selectedFillMeta = selected ? getDivisionFillRateMeta(selected) : null;
 const eligiblePercentage = ((demo.totalEligibleManpower / Math.max(1, demo.totalPopulation)) * 100).toFixed(1);

 return (
  <div className="min-h-0 h-full overflow-y-auto bg-[#090d12] p-3 sm:p-5 text-slate-200 select-none space-y-4 font-sans">
   {/* ─────────────────────────────────────────────────────────────
     1. 国防部 HEADER
     ───────────────────────────────────────────────────────────── */}
   <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 border-b border-slate-800/90 pb-3.5">
    {/* 左侧：指挥机构名称 */}
    <div className="flex items-center gap-3">
     <div className="w-8 h-8 rounded bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
      <Swords className="w-4 h-4" />
     </div>
     <div>
      <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2.5">
       <span>国防部</span>
      </h1>
     </div>
    </div>

    {/* 右侧：功能入口、动员政策信息条与动员令 */}
    <div className="flex flex-wrap items-center gap-2.5">
     {/* 装备体系入口 */}
     <button
      type="button"
      onClick={() => setEquipmentModalOpen(true)}
      className="flex items-center gap-1.5 px-3 py-2 bg-[#121a24] hover:bg-[#182330] border border-slate-700/80 hover:border-amber-500/40 text-slate-200 hover:text-amber-300 rounded text-xs font-semibold transition cursor-pointer"
     >
      <Boxes className="w-3.5 h-3.5 text-amber-400" />
      <span>装备体系</span>
     </button>

     {/* 动员政策 / 征募状态信息条 */}
     <button
      type="button"
      onClick={() => setLawModalOpen(true)}
      className="group flex items-center gap-3 px-3 py-1.5 bg-[#101720] hover:bg-[#15202d] border border-slate-700/70 hover:border-amber-500/50 rounded text-left transition cursor-pointer"
      title="点击调整国家兵役法案与动员令"
     >
      <div className="flex flex-col">
       <span className="text-[10px] text-slate-400 font-medium">动员政策</span>
       <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 group-hover:text-amber-300">
        <span>{demo.activeLaw.name}</span>
        <span className="text-[11px] font-normal text-slate-400">· {demo.activeLaw.rateLabel} 适役人口</span>
       </div>
      </div>
      <div className="pl-1 border-l border-slate-700/60 text-[10px] text-slate-400 group-hover:text-amber-400">
       调整法案
      </div>
     </button>

     {/* 全军动员补员按钮 (缺额时高亮出现) */}
     {demo.totalManpowerDeficit > 0 && (
      <button
       type="button"
       onClick={batchReinforceAll}
       disabled={demo.availableReserve <= 0}
       className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded text-xs font-bold transition cursor-pointer shadow-sm"
       title="一键消耗后备兵员填补全军所有部队缺口"
      >
       <HeartHandshake className="w-3.5 h-3.5" />
       <span>全军补员 (缺口 {demo.totalManpowerDeficit.toLocaleString()})</span>
      </button>
     )}

     {/* 世界纪元同步指示 */}
     <div className="hidden sm:flex items-center gap-1 text-[11px] font-mono text-slate-400 pl-1">
      <Clock3 className="h-3.5 w-3.5 text-sky-400" />
      <span>世界纪元同步</span>
     </div>
    </div>
   </header>

   {/* ─────────────────────────────────────────────────────────────
     2. 核心军事数据区域 (分为三个视觉层级区块，彻底告别单调卡片堆叠)
     ───────────────────────────────────────────────────────────── */}
   <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
    {/* 层次 1: 核心兵力概览 (权重最高，占据 6 列) */}
    <div className="lg:col-span-6 bg-[#101720] border border-slate-800/90 rounded-lg p-4 flex flex-col justify-between space-y-3">
     <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
      <div className="flex items-center gap-2">
       <Users className="w-4 h-4 text-amber-400" />
       <span className="text-xs font-bold text-slate-200 tracking-wide">战略兵力储备与动员基数</span>
      </div>
      <span className="text-[10px] font-mono text-slate-400">
       适役比率: <strong className="text-amber-400">{demo.activeLaw.rateLabel}</strong>
      </span>
     </div>

     <div className="grid grid-cols-3 gap-3">
      {/* 全国总人口 */}
      <div className="space-y-1">
       <span className="text-[11px] text-slate-400 font-medium block">总人口</span>
       <div className="text-xl sm:text-2xl font-mono font-black text-slate-100 tracking-tight">
        {demo.totalPopulation.toLocaleString()}
       </div>
       <span className="text-[10px] text-slate-500 block truncate">领土法定适龄人口</span>
      </div>

      {/* 适役人口 / 可动员总数 */}
      <div className="space-y-1 border-l border-slate-800/80 pl-3">
       <span className="text-[11px] text-amber-400/90 font-medium block truncate">适役 / 可动员总数</span>
       <div className="text-xl sm:text-2xl font-mono font-black text-amber-400 tracking-tight">
        {demo.totalEligibleManpower.toLocaleString()}
       </div>
       <span className="text-[10px] text-amber-500/70 block truncate">法案法定动员上限</span>
      </div>

      {/* 战略后备兵员 */}
      <div className="space-y-1 border-l border-slate-800/80 pl-3">
       <span className="text-[11px] text-emerald-400/90 font-medium block">战备后备兵员</span>
       <div className="text-xl sm:text-2xl font-mono font-black text-emerald-400 tracking-tight">
        {demo.availableReserve.toLocaleString()}
       </div>
       <span className="text-[10px] text-emerald-500/70 block truncate">随时可征调入伍</span>
      </div>
     </div>

     {/* 适役人口轻量数据可视化进度条 */}
     <div className="pt-2 border-t border-slate-800/60 space-y-1">
      <div className="flex items-center justify-between text-[10px] font-mono">
       <span className="text-slate-400">
        可动员动员池比例 ({demo.totalEligibleManpower.toLocaleString()} / {demo.totalPopulation.toLocaleString()})
       </span>
       <span className="text-amber-400 font-bold">{eligiblePercentage}%</span>
      </div>
      <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
       <div
        className="h-full bg-amber-500 transition-all duration-300"
        style={{ width: `${Math.min(100, Math.max(1, Number(eligiblePercentage)))}%` }}
       />
      </div>
     </div>
    </div>

    {/* 层次 2: 军队战备态势 (FORCE READINESS，占据 3.5 列) */}
    <div className="lg:col-span-3 bg-[#101720] border border-slate-800/90 rounded-lg p-4 flex flex-col justify-between space-y-3">
     <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
      <div className="flex items-center gap-1.5">
       <ShieldCheck className="w-4 h-4 text-emerald-400" />
       <span className="text-xs font-bold text-slate-200">FORCE READINESS</span>
      </div>
      <span className="text-[10px] font-mono text-slate-400">现役作战力量</span>
     </div>

     <div className="grid grid-cols-2 gap-2">
      {/* 现役部队 */}
      <div>
       <span className="text-[11px] text-slate-400 font-medium block">现役部队</span>
       <div className="text-xl font-mono font-black text-sky-400 mt-0.5">
        {demo.activeDutyManpower.toLocaleString()}
       </div>
       <span className="text-[10px] text-slate-500 block truncate">共 {demo.activeDivisionsCount} 个战备师</span>
      </div>

      {/* 编制缺口 */}
      <div>
       <span className="text-[11px] text-slate-400 font-medium block">缺口</span>
       <div className={`text-xl font-mono font-black mt-0.5 ${demo.totalManpowerDeficit > 0 ? 'text-rose-400' : 'text-slate-300'}`}>
        {demo.totalManpowerDeficit.toLocaleString()}
       </div>
       <span className="text-[10px] text-slate-500 block truncate">
        {demo.totalManpowerDeficit > 0 ? '需下达补员' : '全编制满额'}
       </span>
      </div>
     </div>

     {/* 陆军满员率 - 强烈视觉焦点 */}
     <div className="pt-2 border-t border-slate-800/60 space-y-1.5">
      <div className="flex items-center justify-between text-[11px]">
       <span className="text-slate-400 font-medium">陆军满员率</span>
       <span className={`font-mono text-base font-black ${demo.averageFillRate >= 90 ? 'text-emerald-400' : demo.averageFillRate >= 60 ? 'text-amber-400' : 'text-rose-400'}`}>
        {demo.averageFillRate}%
       </span>
      </div>
      <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden flex">
       <div
        className={`h-full transition-all duration-300 ${demo.averageFillRate >= 90 ? 'bg-emerald-500' : demo.averageFillRate >= 60 ? 'bg-amber-500' : 'bg-rose-500'}`}
        style={{ width: `${demo.averageFillRate}%` }}
       />
      </div>
     </div>
    </div>

    {/* 层次 3: 指挥体系 (COMMAND STRUCTURE，占据 2.5 列) */}
    <div className="lg:col-span-3 bg-[#101720] border border-slate-800/90 rounded-lg p-4 flex flex-col justify-between space-y-2.5">
     <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
      <div className="flex items-center gap-1.5">
       <Crosshair className="w-4 h-4 text-indigo-400" />
       <span className="text-xs font-bold text-slate-200">指挥体系</span>
      </div>
      <span className="text-[10px] font-mono text-indigo-300">战役统帅</span>
     </div>

     <div className="grid grid-cols-2 gap-2">
      <div>
       <span className="text-[11px] text-slate-400 font-medium block">陆军指挥官</span>
       <div className="text-lg font-mono font-black text-slate-200 mt-0.5">
        {(army.generals || []).length}
       </div>
      </div>
      <div>
       <span className="text-[11px] text-slate-400 font-medium block">指挥官经验</span>
       <div className="text-lg font-mono font-black text-indigo-300 mt-0.5">
        {army.armyExperience}
       </div>
      </div>
     </div>

     {/* 指挥官状态提示区 */}
     <div className="pt-2 border-t border-slate-800/60">
      {(army.generals || []).length === 0 ? (
       <div className="p-2 bg-slate-900/80 border border-slate-800 rounded flex flex-col gap-1 text-[10px]">
        <div className="flex items-center gap-1 text-slate-400 font-medium">
         <Award className="w-3 h-3 text-amber-500" />
         <span>尚未任命陆军最高指挥官</span>
        </div>
        <div className="text-slate-500">最高统帅部直接下达战术指挥</div>
       </div>
      ) : (
       <div className="p-2 bg-slate-900/80 border border-slate-800 rounded flex items-center justify-between text-[10px]">
        <span className="text-slate-300 font-medium">统帅部战术将领就位</span>
        <span className="text-emerald-400 font-mono font-bold">{(army.generals || []).length} 名</span>
       </div>
      )}
     </div>
    </div>
   </div>

   {/* ─────────────────────────────────────────────────────────────
     3. 主界面三栏战役序列与编成指挥工作区
     ───────────────────────────────────────────────────────────── */}
   <div className="grid min-h-[560px] gap-3 lg:grid-cols-[320px_1fr_340px]">
    {/* 左栏：陆军序列 (ARMY ORGANIZATION) */}
    <section className="border border-slate-800/90 bg-[#101720] p-3.5 rounded-lg flex flex-col overflow-hidden">
     {/* 列表头部 */}
     <div className="mb-3 flex items-center justify-between pb-2.5 border-b border-slate-800/80">
      <div>
       <div className="flex items-center gap-2">
        <Layers className="w-4 h-4 text-amber-400" />
        <span className="text-xs font-bold text-slate-100">陆军序列</span>
        <span className="text-[10px] font-mono text-slate-400 font-semibold">
         ({army.divisions.length})
        </span>
       </div>
       <div className="text-[9px] font-mono text-slate-500 mt-0.5">ARMY ORGANIZATION</div>
      </div>

      <button
       type="button"
       onClick={() => setRecruitOpen(true)}
       className="flex items-center gap-1 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 px-2.5 py-1.5 text-xs font-bold text-slate-950 rounded transition cursor-pointer shadow-xs"
      >
       <Plus className="h-3.5 w-3.5" />
       <span>建立陆军编制</span>
      </button>
     </div>

     {/* 陆军编制列表 / 高级 Empty State */}
     {army.divisions.length === 0 ? (
      <div className="my-auto py-10 px-4 text-center rounded-lg border border-dashed border-slate-800 bg-slate-900/30 flex flex-col items-center justify-center space-y-3 relative overflow-hidden">
       {/* 淡化军事线框网格背景 */}
       <div className="w-12 h-12 rounded-lg bg-slate-800/40 border border-slate-700/60 flex items-center justify-center text-slate-500">
        <Swords className="w-6 h-6 text-slate-500" />
       </div>

       <div className="space-y-1">
        <div className="text-xs font-bold text-slate-300">尚未建立陆军编制</div>
        <p className="text-[11px] leading-relaxed text-slate-500 max-w-[220px]">
         当前国家尚无陆军作战编制。点击下方指令，依据国防模板建立第一支常备作战师。
        </p>
       </div>

       <button
        type="button"
        onClick={() => setRecruitOpen(true)}
        className="mt-1 flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded cursor-pointer transition shadow-xs"
       >
        <Plus className="w-3.5 h-3.5" />
        <span>建立第一支部队</span>
       </button>
      </div>
     ) : (
      <div className="space-y-2 flex-1 overflow-y-auto pr-1">
       {army.divisions.map((division) => {
        const meta = statusMeta(division.status);
        const fillMeta = getDivisionFillRateMeta(division);
        const progress =
         division.status === "training"
          ? Math.round(
            ((division.trainingDaysCompleted || 0) /
             Math.max(1, division.trainingDaysTotal || TRAINING_DAYS)) *
             100
           )
          : null;

        const isSelected = selected?.id === division.id;

        return (
         <button
          type="button"
          key={division.id}
          onClick={() => setSelectedId(division.id)}
          className={`w-full text-left p-3 rounded-lg border transition cursor-pointer ${
           isSelected
            ? "border-amber-400 bg-amber-500/10 ring-1 ring-amber-400/80 shadow-xs"
            : "border-slate-800/80 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900"
          }`}
         >
          <div className="flex items-start justify-between gap-2">
           <b className="text-xs text-slate-100 font-bold truncate">{division.name}</b>
           <span className={`border px-1.5 py-0.2 text-[9px] font-mono rounded ${meta.tone}`}>
            {meta.label}
           </span>
          </div>

          <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400 font-medium">
           <span>{division.type}</span>
           <span className="font-mono text-slate-400 truncate max-w-[110px]">
            {getProvinceChineseName(division.provinceName || division.provinceId) || "国家训练基地"}
           </span>
          </div>

          {/* 进度或满员率指示 */}
          {progress !== null ? (
           <div className="mt-2 space-y-1">
            <div className="h-1 bg-slate-950 rounded-full overflow-hidden">
             <div className="h-full bg-sky-400" style={{ width: `${progress}%` }} />
            </div>
            <div className="flex justify-between font-mono text-[9px] text-sky-300">
             <span>基础训练考核</span>
             <span>{progress}%</span>
            </div>
           </div>
          ) : (
           <div className="mt-2 space-y-1">
            <div className="flex items-center justify-between text-[9px] font-mono">
             <span className="text-slate-400">
              兵员: {division.manpower?.toLocaleString()} / {(division.manpowerMax || 10000).toLocaleString()}
             </span>
             <span className={`font-bold ${fillMeta.badgeTone.split(' ')[0]}`}>
              {fillMeta.fillRate}% {fillMeta.label}
             </span>
            </div>
            <div className="h-1 bg-slate-950 rounded-full overflow-hidden">
             <div
              className={`h-full ${fillMeta.barColor}`}
              style={{ width: `${fillMeta.fillRate}%` }}
             />
            </div>
           </div>
          )}
         </button>
        );
       })}
      </div>
     )}
    </section>

    {/* 中栏：战役指挥沙盘与编成战略部署 */}
    <section className="flex flex-col justify-between border border-slate-800/90 bg-[#101720] p-5 rounded-lg relative overflow-hidden space-y-4">
     <div className="w-full space-y-2 text-center">
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs font-mono text-emerald-400">
       <ShieldCheck className="w-3.5 h-3.5" />
       <span>全域国防动员战备状态良好</span>
      </div>
      <h2 className="text-lg font-bold text-slate-100">大战略陆军编制与战备部署</h2>
      <p className="max-w-lg mx-auto text-xs leading-relaxed text-slate-400">
       新成立的陆军师在国家军训基地完成考核后，即刻下达开赴指令进驻主权省份。部队在防区内维持战备巡逻；若遭受战斗损耗，可通过最高统帅部指令实时调遣战略后备兵员进行战地补充。
      </p>
     </div>

     {/* 战备梯队数据群 */}
     <div className="w-full max-w-xl mx-auto grid grid-cols-3 gap-2.5 text-xs font-mono">
      <div className="border border-sky-500/30 bg-sky-950/30 p-3 rounded-lg text-center space-y-1">
       <span className="text-[10px] text-slate-400 block font-sans">新训考核部队</span>
       <span className="font-bold text-sky-300 text-base">{trainingDivisions.length} 个师</span>
       <span className="text-[9px] text-slate-500 block">基础军训考核中</span>
      </div>
      <div className="border border-amber-500/30 bg-amber-950/30 p-3 rounded-lg text-center space-y-1">
       <span className="text-[10px] text-slate-400 block font-sans">就绪待部署</span>
       <span className="font-bold text-amber-300 text-base">{deployableDivisions.length} 个师</span>
       <span className="text-[9px] text-slate-500 block">待进驻主权省份</span>
      </div>
      <div className="border border-emerald-500/30 bg-emerald-950/30 p-3 rounded-lg text-center space-y-1">
       <span className="text-[10px] text-slate-400 block font-sans">前线战备师</span>
       <span className="font-bold text-emerald-300 text-base">
        {army.divisions.filter((d) => d.status !== "training" && d.status !== "deploying").length} 个师
       </span>
       <span className="text-[9px] text-slate-500 block">已进驻防区执行战备</span>
      </div>
     </div>

     {/* 战备图例与准则 */}
     <div className="w-full border-t border-slate-800/80 pt-3 text-[11px] font-mono text-slate-400 flex flex-wrap justify-center gap-4">
      <span className="flex items-center gap-1.5 text-emerald-400">
       <span className="w-2 h-2 rounded-full bg-emerald-500" />
       <span>90%~100% 满员战备</span>
      </span>
      <span className="flex items-center gap-1.5 text-amber-400">
       <span className="w-2 h-2 rounded-full bg-amber-500" />
       <span>70%~89% 轻度缺员</span>
      </span>
      <span className="flex items-center gap-1.5 text-orange-400">
       <span className="w-2 h-2 rounded-full bg-orange-500" />
       <span>40%~69% 严重缺员</span>
      </span>
      <span className="flex items-center gap-1.5 text-rose-400">
       <span className="w-2 h-2 rounded-full bg-rose-500" />
       <span>&lt;40% 编制残缺</span>
      </span>
     </div>
    </section>

    {/* 右栏：部队档案与战地指挥控制台 */}
    <section className="border border-slate-800/90 bg-[#101720] p-4 rounded-lg overflow-y-auto space-y-4">
     {selected ? (
      <div className="space-y-4">
       <div>
        <div className="text-[10px] font-mono text-amber-400 font-bold">SELECTED DIVISION PROFILE</div>
        <h2 className="text-base font-bold text-slate-100 mt-0.5">{selected.name}</h2>
        <div className="flex items-center justify-between text-xs text-slate-400 font-mono mt-1">
         <span>{selected.type} · {selected.corps || '第1集团军'}</span>
         <span className="text-slate-300">{getProvinceChineseName(selected.provinceName || selected.provinceId) || '国家训练基地'}</span>
        </div>
       </div>

       {/* 训练阶段状态 */}
       {selected.status === "training" && (
        <div className="border border-sky-500/30 bg-sky-950/20 p-3 rounded-lg space-y-2">
         <div className="flex items-center justify-between text-xs text-sky-200 font-mono">
          <span className="flex items-center gap-1.5 font-bold">
           <Activity className="h-3.5 w-3.5 animate-pulse text-sky-400" />
           <span>战役兵团基础军训</span>
          </span>
          <span>{selectedTrainingProgress}%</span>
         </div>
         <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden">
          <div
           className="h-full bg-sky-400 transition-all duration-300"
           style={{ width: `${selectedTrainingProgress}%` }}
          />
         </div>
         <p className="text-[10px] leading-relaxed text-slate-400">
          该师正在进行步炮协同与野战科目训练，考核达标后自动进入待部署状态。
         </p>
        </div>
       )}

       {/* 待部署阶段操作 */}
       {selected.status === "deploying" && (
        <div className="space-y-2.5 border border-amber-500/30 bg-amber-950/20 p-3 rounded-lg">
         <div className="flex items-center gap-1 text-xs font-bold text-amber-300">
          <MapPin className="h-3.5 w-3.5" />
          <span>指定本国驻防省份</span>
         </div>
         <select
          value={deployProvinceId}
          onChange={(e) => setDeployProvinceId(e.target.value)}
          className="w-full border border-slate-700 bg-slate-950 p-2 text-xs text-slate-100 rounded focus:outline-none focus:border-amber-400"
         >
          <option value="">选择部署省份</option>
          {nation.provinces?.map((province) => (
           <option key={province.id} value={String(province.id)}>
            {getProvinceChineseName(province.name || province.id)}
           </option>
          ))}
         </select>
         <button
          type="button"
          onClick={deploySelected}
          className="flex w-full items-center justify-center gap-1 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 py-2 text-xs font-bold text-slate-950 rounded cursor-pointer transition shadow-xs"
         >
          <MapPin className="h-3.5 w-3.5" />
          <span>开赴驻地并完成部署</span>
         </button>
        </div>
       )}

       {/* 人员满员率与平滑战力折减监控面板 */}
       {selectedFillMeta && (
        <div className="border border-slate-800 bg-slate-900/80 p-3 rounded-lg space-y-2.5">
         <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
           <Users className="w-3.5 h-3.5 text-slate-400" />
           <span>人员满员度与战力系数</span>
          </span>
          <span
           className={`text-[10px] font-mono px-2 py-0.5 rounded border font-bold ${selectedFillMeta.badgeTone}`}
          >
           {selectedFillMeta.label} ({selectedFillMeta.fillRate}%)
          </span>
         </div>

         <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden">
          <div
           className={`h-full ${selectedFillMeta.barColor} transition-all duration-300`}
           style={{ width: `${selectedFillMeta.fillRate}%` }}
          />
         </div>

         {/* 战力折减与战役影响 */}
         <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono pt-1">
          <div className="bg-slate-950/80 p-2 rounded border border-slate-800">
           <span className="text-slate-500">综合战力效率</span>
           <div className="text-emerald-400 font-bold mt-0.5">
            {Math.round(selectedFillMeta.combatEfficiency * 100)}%
           </div>
          </div>
          <div className="bg-slate-950/80 p-2 rounded border border-slate-800">
           <span className="text-slate-500">战地组织度折减</span>
           <div className="text-slate-300 font-bold mt-0.5">
            {selectedFillMeta.orgMultiplier < 1
             ? `-${Math.round((1 - selectedFillMeta.orgMultiplier) * 100)}%`
             : "无折减"}
           </div>
          </div>
         </div>

         {/* 补充兵员按钮 (若缺员且已部署) */}
         {selected.status !== "training" &&
          selected.manpower < (selected.manpowerMax || 10000) && (
           <button
            type="button"
            onClick={() => reinforceDivision(selected.id)}
            disabled={demo.availableReserve <= 0}
            className="w-full mt-2 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
           >
            <HeartHandshake className="w-3.5 h-3.5" />
            <span>战地补充兵员 (需 {(selected.manpowerMax || 10000) - selected.manpower} 人)</span>
           </button>
          )}
        </div>
       )}

       {/* 关键军事参数矩阵 */}
       <div className="grid grid-cols-2 gap-2 text-xs font-mono">
        <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800/80">
         <span className="text-slate-500 text-[10px] block font-sans">兵员规模</span>
         <b className="mt-0.5 block text-slate-100">
          {selected.manpower?.toLocaleString()} / {(selected.manpowerMax || 10000).toLocaleString()}
         </b>
        </div>
        <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800/80">
         <span className="text-slate-500 text-[10px] block font-sans">装备完好率</span>
         <b className="mt-0.5 block text-amber-300">{selected.equipmentRate}%</b>
        </div>
        <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800/80">
         <span className="text-slate-500 text-[10px] block font-sans">部队组织度</span>
         <b className="mt-0.5 block text-sky-300">{selected.organization}%</b>
        </div>
        <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800/80">
         <span className="text-slate-500 text-[10px] block font-sans">后勤补给充足</span>
         <b className="mt-0.5 block text-emerald-300">{selected.supply}%</b>
        </div>
        <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800/80">
         <span className="text-slate-500 text-[10px] block font-sans">主力步兵营</span>
         <b className="mt-0.5 block text-slate-200">{selected.template.infantry} 营</b>
        </div>
        <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800/80">
         <span className="text-slate-500 text-[10px] block font-sans">身管火炮营</span>
         <b className="mt-0.5 block text-slate-200">{selected.template.artillery} 营</b>
        </div>
       </div>
      </div>
     ) : (
      <div className="text-center py-16 text-slate-500 space-y-2">
       <Shield className="w-8 h-8 mx-auto text-slate-600" />
       <p className="text-xs">请从左侧选择陆军部队或建立新编制。</p>
      </div>
     )}
    </section>
   </div>

   {/* ─────────────────────────────────────────────────────────────
     4. 建立新陆军编制弹窗 (组建训令)
     ───────────────────────────────────────────────────────────── */}
   {recruitOpen && (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-fadeIn">
     <div className="w-full max-w-md border border-slate-700 bg-[#111c25] p-5 rounded-xl shadow-2xl text-slate-100 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
       <div className="flex items-center gap-2">
        <GraduationCap className="h-5 w-5 text-amber-400" />
        <h2 className="font-bold text-base text-slate-100">建立陆军编制</h2>
       </div>
       <button
        type="button"
        onClick={() => setRecruitOpen(false)}
        className="text-slate-400 hover:text-slate-200 text-xs p-1 rounded hover:bg-slate-800 cursor-pointer"
       >
        <X className="w-4 h-4" />
       </button>
      </div>
      <p className="text-xs leading-relaxed text-slate-400">
       新成立作战师将从国家战略后备兵员库中抽调兵员，并进驻军事训练基地进行协同科目考核。
      </p>

      <div className="space-y-3">
       <div>
        <label className="block text-xs font-bold text-slate-300 mb-1">部队代号 / 自定义番号</label>
        <input
         value={name}
         onChange={(e) => setName(e.target.value)}
         placeholder={`例如：第${army.divisions.length + 1}${type}`}
         className="w-full border border-slate-700 bg-slate-900 p-2.5 text-xs text-slate-100 rounded focus:outline-none focus:border-amber-400"
        />
       </div>

       <div>
        <label className="block text-xs font-bold text-slate-300 mb-1">编制战术模板</label>
        <select
         value={type}
         onChange={(e) => setType(e.target.value as keyof typeof templates)}
         className="w-full border border-slate-700 bg-slate-900 p-2.5 text-xs text-slate-100 rounded focus:outline-none focus:border-amber-400 cursor-pointer"
        >
         {Object.keys(templates).map((template) => (
          <option key={template} value={template}>
           {template} (标准战力编制)
          </option>
         ))}
        </select>
       </div>

       <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs font-mono space-y-1.5 text-slate-300">
        <div className="flex justify-between">
         <span className="text-slate-400">基础训练周期:</span>
         <span className="text-sky-300 font-bold">{TRAINING_DAYS} 战略日</span>
        </div>
        <div className="flex justify-between">
         <span className="text-slate-400">所需兵员基数:</span>
         <span className="text-emerald-400 font-bold">{templates[type].manpower.toLocaleString()} 人</span>
        </div>
        <div className="flex justify-between">
         <span className="text-slate-400">制式步枪消耗:</span>
         <span>{templates[type].rifles.toLocaleString()} 支</span>
        </div>
        <div className="flex justify-between">
         <span className="text-slate-400">身管火炮需求:</span>
         <span>{templates[type].artilleryNeed} 门</span>
        </div>
        {templates[type].armor > 0 && (
         <div className="flex justify-between text-amber-300">
          <span className="text-slate-400">装甲坦克需求:</span>
          <span>{templates[type].armor * 80} 辆</span>
         </div>
        )}
       </div>

       <div className="flex gap-2.5 pt-2">
        <button
         type="button"
         onClick={() => setRecruitOpen(false)}
         className="flex-1 border border-slate-700 hover:bg-slate-800 py-2 text-xs font-bold text-slate-300 rounded cursor-pointer transition"
        >
         取消
        </button>
        <button
         type="button"
         onClick={recruit}
         className="flex-1 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 py-2 text-xs font-bold text-slate-950 rounded cursor-pointer transition shadow-xs"
        >
         确认下达组建训令
        </button>
       </div>
      </div>
     </div>
    </div>
   )}

   {/* ─────────────────────────────────────────────────────────────
     5. 兵役法案与国防动员令调整弹窗
     ───────────────────────────────────────────────────────────── */}
   {lawModalOpen && (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-fadeIn">
     <div className="w-full max-w-2xl border border-slate-700 bg-[#111c25] p-5 rounded-xl shadow-2xl text-slate-100 space-y-4 max-h-[90vh] flex flex-col">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
       <div className="flex items-center gap-2.5">
        <Scale className="h-5 w-5 text-amber-400" />
        <div>
         <h2 className="font-bold text-base text-slate-100">国家兵役法案与国防动员令</h2>
         <p className="text-xs text-slate-400">
          当前动员比例: {demo.activeLaw.rateLabel} · 后备兵员: {demo.availableReserve.toLocaleString()} 人
         </p>
        </div>
       </div>
       <button
        type="button"
        onClick={() => setLawModalOpen(false)}
        className="text-slate-400 hover:text-slate-200 text-xs p-1 rounded hover:bg-slate-800 cursor-pointer"
       >
        <X className="w-4 h-4" />
       </button>
      </div>

      <div className="space-y-2.5 overflow-y-auto flex-1 pr-1">
       {CONSCRIPTION_LAWS.map((law) => {
        const isActive = law.id === demo.activeLaw.id;
        const projectedEligible = Math.round(demo.totalPopulation * law.conscriptionRate);

        return (
         <div
          key={law.id}
          className={`p-3.5 border rounded-lg transition ${
           isActive
            ? "border-amber-400 bg-amber-500/10 ring-1 ring-amber-400/80"
            : "border-slate-800 bg-slate-900/60 hover:border-slate-700"
          }`}
         >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
           <div className="space-y-1">
            <div className="flex items-center gap-2">
             <span className="font-bold text-sm text-slate-100">{law.name}</span>
             <span className="text-xs font-mono font-bold px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded border border-amber-500/30">
              适役比例: {law.rateLabel}
             </span>
             {isActive && (
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30">
               当前施行
              </span>
             )}
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">{law.description}</p>
           </div>

           <div className="flex items-center gap-3 shrink-0">
            <div className="text-right font-mono text-xs">
             <div className="text-amber-300 font-bold">
              {projectedEligible.toLocaleString()} 人
             </div>
             <div className="text-[10px] text-slate-500">
              {law.factoryPenalty < 0 ? `工业产能 ${law.factoryPenalty}%` : "工业无惩罚"}
             </div>
            </div>

            {!isActive && (
             <button
              type="button"
              onClick={() => enactConscriptionLaw(law)}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 text-xs font-bold rounded cursor-pointer transition shadow-xs"
             >
              颁布法案
             </button>
            )}
           </div>
          </div>
         </div>
        );
       })}
      </div>
     </div>
    </div>
   )}

   {/* ─────────────────────────────────────────────────────────────
     6. 装备体系弹窗 (国家军械与战略装备储备总库 - 国家军备管理终端 · 浅色军事档案风格)
     ───────────────────────────────────────────────────────────── */}
   {equipmentModalOpen && (() => {
    // 装备库存数据与分类解析
    const rifleCount = Math.floor(stock.eq_rifle || 0);
    const tankCount = Math.floor((stock.eq_tank_medium || 0) + (stock.eq_tank || 0) + (stock.des_default_tank || 0));
    const truckCount = Math.floor(stock.eq_truck || 0);
    const artilleryCount = Math.floor(stock.eq_artillery || 0);
    const supportCount = Math.floor(stock.eq_support || 0);
    const fighterCount = Math.floor(stock.eq_fighter || 0);

    const totalItemsCount = rifleCount + tankCount + truckCount + artilleryCount + supportCount + fighterCount;

    const getStatus = (count: number, thresholdGood: number, thresholdOk: number) => {
     if (count >= thresholdGood) return { label: "充足", tone: "text-emerald-800 bg-emerald-50 border-emerald-200" };
     if (count >= thresholdOk) return { label: "正常", tone: "text-slate-700 bg-slate-100 border-slate-200" };
     if (count > 0) return { label: "不足", tone: "text-amber-800 bg-amber-50 border-amber-200" };
     return { label: "缺乏", tone: "text-rose-800 bg-rose-50 border-rose-200" };
    };

    const categories = [
     {
      index: "01",
      code: "INFANTRY",
      name: "步兵装备",
      items: [
       {
        name: "制式步兵步枪",
        spec: "ORD-RIF-01 / 7.92mm 标准单兵武器",
        count: rifleCount,
        unit: "支",
        status: getStatus(rifleCount, 10000, 2000),
       },
       {
        name: "战地支援装备",
        spec: "SUP-EQ-MOD3 / 通信、侦察与野战工兵器材",
        count: supportCount,
        unit: "套",
        status: getStatus(supportCount, 300, 50),
       },
      ],
     },
     {
      index: "02",
      code: "ARMOR & MOTORIZED",
      name: "装甲与车辆",
      items: [
       {
        name: "主战坦克",
        spec: "AFV-MB-T01 / 履带突击战车及装甲底盘",
        count: tankCount,
        unit: "辆",
        status: getStatus(tankCount, 200, 40),
       },
       {
        name: "军用机动车辆",
        spec: "LOG-TRK-4X4 / 全地形后勤运输机动载具",
        count: truckCount,
        unit: "辆",
        status: getStatus(truckCount, 500, 100),
       },
      ],
     },
     {
      index: "03",
      code: "ARTILLERY",
      name: "火力装备",
      items: [
       {
        name: "身管压制火炮",
        spec: "ART-FLD-105 / 师属野战身管榴弹炮及牵引装置",
        count: artilleryCount,
        unit: "门",
        status: getStatus(artilleryCount, 150, 30),
       },
      ],
     },
     {
      index: "04",
      code: "AIR",
      name: "航空装备",
      items: [
       {
        name: "航空战斗机零部件",
        spec: "AV-FTR-PARTS / 战术机体航材与发动机备份",
        count: fighterCount,
        unit: "件",
        status: getStatus(fighterCount, 50, 10),
       },
      ],
     },
    ];

    const allItems = categories.flatMap((c) => c.items);
    const normalCount = allItems.filter((i) => i.status.label === "充足" || i.status.label === "正常").length;
    const shortCount = allItems.filter((i) => i.status.label === "不足" || i.status.label === "缺乏").length;

    return (
     <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-3 sm:p-5 animate-fadeIn">
      <div className="w-full max-w-3xl bg-white text-slate-900 border border-slate-300 shadow-xl flex flex-col max-h-[92vh] overflow-hidden rounded-xs font-sans">
       
       {/* ─────────────────────────────────────────────────────────────
         1. 顶部标题区域 (简洁专业、无 Hero Banner 装饰)
         ───────────────────────────────────────────────────────────── */}
       <div className="px-6 py-4 border-b border-slate-200 flex items-start justify-between bg-slate-50/80">
        <div>
         <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
          国家军械与战略装备储备总库
         </h2>
         <p className="text-xs text-slate-500 mt-0.5">
          统帅部装备库存统计 · 支持新部队列装与前线装备补充
         </p>
        </div>
        <button
         type="button"
         onClick={() => setEquipmentModalOpen(false)}
         className="px-2 py-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xs text-sm transition cursor-pointer border border-transparent hover:border-slate-300"
         title="关闭窗口"
        >
         <X className="w-4 h-4" />
        </button>
       </div>

       {/* ─────────────────────────────────────────────────────────────
         2. 军备库存总览条 (纯横向数据栏，非卡片堆叠)
         ───────────────────────────────────────────────────────────── */}
       <div className="px-6 py-2.5 bg-slate-100/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-y-2 text-xs font-mono">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
         <div className="flex items-center gap-1.5">
          <span className="text-slate-500 font-sans">当前总库存:</span>
          <strong className="text-slate-900 font-bold text-sm tabular-nums">
           {totalItemsCount.toLocaleString()}
          </strong>
          <span className="text-slate-500 font-sans">件/套</span>
         </div>

         <span className="text-slate-300 hidden sm:inline">|</span>

         <div className="flex items-center gap-1.5">
          <span className="text-slate-500 font-sans">装备类别:</span>
          <strong className="text-slate-800 tabular-nums">{allItems.length} 类</strong>
         </div>

         <span className="text-slate-300 hidden sm:inline">|</span>

         <div className="flex items-center gap-1.5">
          <span className="text-slate-500 font-sans">正常/充足:</span>
          <span className="text-emerald-700 font-bold tabular-nums">{normalCount} 类</span>
         </div>

         <span className="text-slate-300 hidden sm:inline">|</span>

         <div className="flex items-center gap-1.5">
          <span className="text-slate-500 font-sans">不足/短缺:</span>
          <span className={`font-bold tabular-nums ${shortCount > 0 ? "text-rose-700" : "text-slate-600"}`}>
           {shortCount} 类
          </span>
         </div>
        </div>

        <div className="text-[11px] text-slate-500 flex items-center gap-2 font-sans">
         <span>数据状态：<strong className="text-slate-700 font-normal">实时结算正常</strong></span>
        </div>
       </div>

       {/* ─────────────────────────────────────────────────────────────
         3. 分类装备列表 (结构化数据表格，表头 + 细线分割)
         ───────────────────────────────────────────────────────────── */}
       <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs bg-white">
        {categories.map((cat) => (
         <section key={cat.code} className="space-y-2">
          {/* 分类标题栏 */}
          <div className="flex items-baseline justify-between border-b border-slate-300 pb-1">
           <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-bold text-slate-400">
             {cat.index} / {cat.code}
            </span>
            <h3 className="text-xs font-bold text-slate-900 tracking-wide">
             {cat.name}
            </h3>
           </div>
           <span className="text-[11px] font-mono text-slate-400">
            {cat.items.length} 项制式装备
           </span>
          </div>

          {/* 装备数据表格 */}
          <div className="w-full border-t border-slate-200">
           {/* 表头 */}
           <div className="grid grid-cols-12 py-1.5 px-2 bg-slate-50 text-[11px] font-medium text-slate-500 border-b border-slate-200">
            <div className="col-span-6 sm:col-span-5">装备名称 / 规格型号</div>
            <div className="col-span-3 sm:col-span-4 text-right pr-4">数量</div>
            <div className="col-span-1 text-center hidden sm:block">单位</div>
            <div className="col-span-3 sm:col-span-2 text-right sm:text-center">状态</div>
           </div>

           {/* 表格行 */}
           <div className="divide-y divide-slate-100">
            {cat.items.map((item) => (
             <div
              key={item.name}
              className="grid grid-cols-12 py-2 px-2 items-center hover:bg-slate-50/80 transition-colors"
             >
              {/* 装备名称与规格型号 */}
              <div className="col-span-6 sm:col-span-5 min-w-0 pr-2">
               <div className="font-semibold text-slate-900 text-xs">
                {item.name}
               </div>
               <div className="text-[10px] text-slate-400 font-mono truncate mt-0.5">
                {item.spec}
               </div>
              </div>

              {/* 数量 */}
              <div className="col-span-3 sm:col-span-4 text-right pr-4 font-mono">
               <span className="text-xs sm:text-sm font-bold text-slate-900 tabular-nums">
                {item.count.toLocaleString()}
               </span>
               <span className="text-[11px] text-slate-500 font-sans ml-1 sm:hidden">
                {item.unit}
               </span>
              </div>

              {/* 单位 */}
              <div className="col-span-1 text-center text-slate-600 text-xs hidden sm:block font-sans">
               {item.unit}
              </div>

              {/* 状态徽标 */}
              <div className="col-span-3 sm:col-span-2 text-right sm:text-center">
               <span
                className={`inline-block px-2 py-0.5 text-[10px] font-medium border rounded-xs ${item.status.tone}`}
               >
                {item.status.label}
               </span>
              </div>
             </div>
            ))}
           </div>
          </div>
         </section>
        ))}
       </div>

       {/* ─────────────────────────────────────────────────────────────
         4. 生产与补充 (系统规则说明，纯文本与细线分割，无圆角卡片)
         ───────────────────────────────────────────────────────────── */}
       <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 text-slate-600 text-[11px] space-y-1">
        <div className="font-bold text-slate-700 text-xs">
         生产与补充
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-slate-500">
         <p className="leading-relaxed">
          军工装备储备由国家军工与重工业工厂持续生产。装备完成率将影响新编部队列装速度，并根据实际生产能力动态变化。
         </p>
         <span className="text-[10px] font-mono text-slate-400 shrink-0">
          统帅部军械局管理终端
         </span>
        </div>
       </div>

      </div>
     </div>
    );
   })()}
  </div>
 );
}
