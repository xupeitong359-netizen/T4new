import React, { useState } from 'react';
import {
 Hammer,
 X,
 Zap,
 TrendingUp,
 Flame,
 Plane,
 Radio,
 Anchor,
 Database,
 TrainTrack,
 PackageCheck,
 ShieldAlert,
 ChevronRight,
 ChevronUp,
 ChevronDown,
 ArrowRightLeft,
 Lock,
 Search,
 CheckCircle2,
 AlertCircle,
 Clock,
 Trash2,
 MapPin,
 Building2,
 SlidersHorizontal,
} from 'lucide-react';
import {
 CivilianFactoryPlantIcon,
 MilitaryFactoryPlantIcon,
 TacticalOilWellIcon,
} from '../lib/tacticalIcons';
import { Nation, ProvinceData, ConstructionQueueItem } from '../types';
import { getProvinceChineseName } from '../lib/provinceTranslations';
import { getTotalCivilianFactories } from '../lib/economyEngine';
import { getTotalMilitaryFactories } from '../lib/militaryIndustry';
import {
 STRATEGIC_BUILDINGS,
 StrategicBuildingType,
 RADAR_TECH_TIERS,
 RadarTechTier,
 MAX_BUILDINGS_PER_PROVINCE,
 DAILY_CAPACITY_PER_CIV_FACTORY,
 calculateBuildingUpgradeCost,
 getMaxLevelForBuilding,
 getInfrastructureBonus,
 getTotalBuildingsInProvince,
 DEFAULT_PROVINCE_BUILDINGS,
} from '../lib/constructionRules';

interface ConstructionModalProps {
 isOpen: boolean;
 onClose: () => void;
 nation: Nation | null;
 onUpdateNation: (updated: Nation) => void;
 showToast: (msg: string) => void;
 onStartMapPlacement: (buildingType: StrategicBuildingType) => void;
 onBuildInProvince?: (
  provinceId: string | number,
  provinceName: string,
  buildingType: StrategicBuildingType
 ) => void;
 onCancelQueueItem?: (queueId: string) => void;
 onReorderQueueItem?: (fromIndex: number, toIndex: number) => void;
}

export const ConstructionModal: React.FC<ConstructionModalProps> = ({
 isOpen,
 onClose,
 nation,
 onUpdateNation,
 showToast,
 onStartMapPlacement,
 onBuildInProvince,
 onCancelQueueItem,
 onReorderQueueItem,
}) => {
 const [activeTab, setActiveTab] = useState<'blueprint' | 'queue'>('blueprint');
 const [selectedCategory, setSelectedCategory] = useState<
  'all' | 'industry' | 'defense' | 'state' | 'logistics'
 >('all');
 const [searchQuery, setSearchQuery] = useState('');
 const [activeRadarTech, setActiveRadarTech] = useState<RadarTechTier>(
  nation?.radarTech || 'decimeter'
 );
 // 当前展开直选行省的建筑类型
 const [assigningBuildingType, setAssigningBuildingType] = useState<StrategicBuildingType | null>(
  null
 );
 // 直建行省内搜索过滤
 const [provinceSearch, setProvinceSearch] = useState('');

 if (!isOpen) return null;

 if (!nation) {
  return (
   <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
    <div className="w-full max-w-md bg-slate-900 rounded-2xl p-6 text-center space-y-4 shadow-2xl border border-slate-800 text-slate-100">
     <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
      <Lock className="w-6 h-6" />
     </div>
     <h3 className="text-base font-bold text-white">尚未建立主权国家</h3>
     <p className="text-xs text-slate-400 leading-relaxed">
      国家战略工程与省份建设仅对已宣告国家的主权领主开放。请先在大厅宣告建国！
     </p>
     <button
      onClick={onClose}
      className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
     >
      我知道了
     </button>
    </div>
   </div>
  );
 }

 const provinces: ProvinceData[] = nation.provinces || [];
 const constructionQueue: ConstructionQueueItem[] = nation.constructionQueue || [];

 // 计算全国民用与军用工业保有量
 const totalCivFactories = getTotalCivilianFactories(nation);
 const totalMilFactories = getTotalMilitaryFactories(nation);

 // 处于建造队列中的民工总需求 (每条建造线最多 15 厂)
 const civInUse = constructionQueue.reduce(
  (sum, item) => sum + (item.status === 'completed' ? 0 : (item.assignedFactories ?? item.allocatedCivFactories ?? 0)),
  0
 );
 const civFree = Math.max(0, totalCivFactories - civInUse);
 const totalDailyCapacity = totalCivFactories * DAILY_CAPACITY_PER_CIV_FACTORY;

 const handleRadarTechChange = (tech: RadarTechTier) => {
  setActiveRadarTech(tech);
  const updated = {
   ...nation,
   radarTech: tech,
   updatedAt: new Date().toISOString(),
  };
  onUpdateNation(updated);
  showToast(
   ` 雷达规格已切换至：【${RADAR_TECH_TIERS[tech].name}】（各省探测上限 ${RADAR_TECH_TIERS[tech].maxLevel} 级）`
  );
 };

 const handleSelectBuildingForMap = (buildingType: StrategicBuildingType) => {
  // 静默关闭弹窗并切换至地图放置模式（不弹多余提示）
  onClose();
  onStartMapPlacement(buildingType);
 };

 const handleDirectBuild = (
  provinceId: string | number,
  provinceName: string,
  buildingType: StrategicBuildingType
 ) => {
  if (onBuildInProvince) {
   onBuildInProvince(provinceId, provinceName, buildingType);
  }
 };

 // 建筑列表过滤
 const buildingList = Object.values(STRATEGIC_BUILDINGS).filter((b) => {
  const matchCategory = selectedCategory === 'all' || b.category === selectedCategory;
  const matchQuery =
   !searchQuery.trim() ||
   b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
   b.effect.toLowerCase().includes(searchQuery.toLowerCase()) ||
   b.categoryName.toLowerCase().includes(searchQuery.toLowerCase());
  return matchCategory && matchQuery;
 });

 return (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-sm animate-fadeIn overflow-hidden">
   <div className="w-full max-w-5xl bg-slate-900 text-slate-100 rounded-2xl shadow-2xl border border-slate-700/80 overflow-hidden flex flex-col h-[90vh] max-h-[860px]">
    {/* 1. 顶栏：战役工业司令部标题与关闭按钮 */}
    <div className="bg-slate-950 px-4 py-3 sm:px-6 sm:py-3.5 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
     <div className="flex items-center gap-3 min-w-0">
      <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center border border-amber-500/30 shrink-0">
       <Hammer className="w-4.5 h-4.5" />
      </div>
      <div className="min-w-0">
       <div className="flex items-center gap-2 flex-wrap">
        <h2 className="text-sm sm:text-base font-bold tracking-tight text-white whitespace-nowrap">
         国家工程与省份建设
        </h2>
        <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono border border-amber-500/30 shrink-0">
         工业体系
        </span>
       </div>
       <p className="text-[11px] text-slate-400 truncate mt-0.5">
        【{nation.name}】· 共辖 {provinces.length} 省 · 单省建筑上限 {MAX_BUILDINGS_PER_PROVINCE} 座
       </p>
      </div>
     </div>

     <button
      type="button"
      onClick={onClose}
      className="w-8 h-8 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer shrink-0 border border-slate-700"
      title="关闭窗口"
     >
      <X className="w-4 h-4" />
     </button>
    </div>

    {/* 2. 全国工业能力指标看板条 */}
    <div className="bg-slate-950/60 px-4 py-2 sm:px-6 border-b border-slate-800/80 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar text-xs shrink-0">
     <div className="flex items-center gap-4 sm:gap-6 shrink-0">
      <div className="flex items-center gap-1.5 whitespace-nowrap">
       <CivilianFactoryPlantIcon size={14} className="text-emerald-400" />
       <span className="text-slate-400">民用工厂:</span>
       <span className="font-mono font-bold text-emerald-300">{totalCivFactories} 厂</span>
       <span className="text-[10px] text-slate-500 font-mono">(空闲 {civFree})</span>
      </div>

      <div className="w-[1px] h-3.5 bg-slate-800 hidden xs:block" />

      <div className="flex items-center gap-1.5 whitespace-nowrap">
       <MilitaryFactoryPlantIcon size={14} className="text-rose-400" />
       <span className="text-slate-400">军用工厂:</span>
       <span className="font-mono font-bold text-rose-300">{totalMilFactories} 厂</span>
      </div>

      <div className="w-[1px] h-3.5 bg-slate-800 hidden xs:block" />

      <div className="flex items-center gap-1.5 whitespace-nowrap">
       <Zap className="w-3.5 h-3.5 text-amber-400" />
       <span className="text-slate-400">每日产能:</span>
       <span className="font-mono font-bold text-amber-300">
        {totalDailyCapacity.toLocaleString()}/日
       </span>
      </div>
     </div>

     <div className="text-[11px] text-slate-500 font-mono hidden md:block whitespace-nowrap">
      施工线上限: 15厂/线
     </div>
    </div>

    {/* 3. 导航选项卡栏 (自适应横排，绝不折行变形) */}
    <div className="px-4 py-2 sm:px-6 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
     {/* 主 Tab 按钮组 */}
     <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
      <button
       type="button"
       onClick={() => {
        setActiveTab('blueprint');
        setAssigningBuildingType(null);
       }}
       className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
        activeTab === 'blueprint'
         ? 'bg-indigo-600 text-white shadow-xs'
         : 'text-slate-400 hover:text-slate-200'
       }`}
      >
       <Building2 className="w-3.5 h-3.5 shrink-0" />
       <span>战略工程蓝图</span>
      </button>

      <button
       type="button"
       onClick={() => setActiveTab('queue')}
       className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
        activeTab === 'queue'
         ? 'bg-indigo-600 text-white shadow-xs'
         : 'text-slate-400 hover:text-slate-200'
       }`}
      >
       <Clock className="w-3.5 h-3.5 shrink-0" />
       <span>全国施工队列</span>
       {constructionQueue.length > 0 && (
        <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-mono shrink-0">
         {constructionQueue.length}
        </span>
       )}
      </button>
     </div>

     {/* 雷达科技波段规格选择器 */}
     <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1 text-xs shrink-0">
      <Radio className="w-3.5 h-3.5 text-purple-400 shrink-0" />
      <span className="text-slate-400 whitespace-nowrap hidden sm:inline">雷达科技:</span>
      <select
       value={activeRadarTech}
       onChange={(e) => handleRadarTechChange(e.target.value as RadarTechTier)}
       className="bg-transparent text-purple-300 font-bold outline-none cursor-pointer text-xs whitespace-nowrap"
      >
       <option value="decimeter" className="bg-slate-900 text-slate-100">
        分米波雷达 (上限2级)
       </option>
       <option value="centimeter" className="bg-slate-900 text-slate-100">
        厘米波雷达 (上限4级)
       </option>
       <option value="phased_array" className="bg-slate-900 text-slate-100">
        相控阵雷达 (上限5级)
       </option>
       <option value="monopulse" className="bg-slate-900 text-slate-100">
        单脉冲雷达 (上限6级)
       </option>
      </select>
     </div>
    </div>

    {/* 4. TAB 1: 战略建筑蓝图与直派行省 */}
    {activeTab === 'blueprint' && (
     <div className="flex-1 overflow-y-auto flex flex-col min-h-0">
      {/* 搜索与分类过滤器 */}
      <div className="px-4 py-2 sm:px-6 bg-slate-950/40 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0">
       {/* 分类过滤按键 */}
       <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        {[
         { id: 'all', label: '全部' },
         { id: 'industry', label: '国家重工' },
         { id: 'defense', label: '防空与要塞' },
         { id: 'state', label: '省份基建' },
         { id: 'logistics', label: '后勤与铁路' },
        ].map((tab) => (
         <button
          key={tab.id}
          type="button"
          onClick={() => setSelectedCategory(tab.id as any)}
          className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition cursor-pointer ${
           selectedCategory === tab.id
            ? 'bg-slate-800 text-white border border-slate-700 shadow-xs'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
         >
          {tab.label}
         </button>
        ))}
       </div>

       {/* 搜索输入 */}
       <div className="relative w-full sm:w-52 shrink-0">
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
        <input
         type="text"
         placeholder="搜索工程..."
         value={searchQuery}
         onChange={(e) => setSearchQuery(e.target.value)}
         className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1 text-xs text-slate-200 placeholder:text-slate-500 focus:border-indigo-500 outline-none"
        />
       </div>
      </div>

      {/* 展开的直选行省派工面板 (若选中了特定建筑) */}
      {assigningBuildingType && (
       <div className="bg-slate-950 border-b border-slate-800 p-3 sm:px-6 animate-fadeIn shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-800/80">
         <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="text-slate-400">直选施工：</span>
          <strong className="text-amber-300 font-bold">
           {STRATEGIC_BUILDINGS[assigningBuildingType].name}
          </strong>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800 text-slate-300">
           造价: {STRATEGIC_BUILDINGS[assigningBuildingType].costFormulaDescription}
          </span>
         </div>

         <div className="flex items-center gap-2">
          <input
           type="text"
           placeholder="筛选主权省份..."
           value={provinceSearch}
           onChange={(e) => setProvinceSearch(e.target.value)}
           className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 outline-none w-36"
          />
          <button
           type="button"
           onClick={() => setAssigningBuildingType(null)}
           className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 cursor-pointer"
          >
           收起
          </button>
         </div>
        </div>

        {/* 省份网格 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mt-2.5 max-h-48 overflow-y-auto pr-1">
         {provinces.length === 0 ? (
          <div className="col-span-full py-4 text-center text-xs text-slate-500">
           当前尚未拥有主权领土省份，请先在地图或大厅宣告省份归属。
          </div>
         ) : (
          provinces
           .filter((p) => {
            const cnName = getProvinceChineseName(p.name || p.id);
            return provinceSearch.trim()
             ? cnName.toLowerCase().includes(provinceSearch.toLowerCase()) ||
              p.name.toLowerCase().includes(provinceSearch.toLowerCase()) ||
              String(p.id).includes(provinceSearch)
             : true;
           })
           .map((prov) => {
            const detailed = prov.detailedBuildings || {
             ...DEFAULT_PROVINCE_BUILDINGS,
             civilian_factory: typeof prov.civilianFactories === 'number' ? prov.civilianFactories : 1,
             military_factory: typeof prov.militaryFactories === 'number' ? prov.militaryFactories : 1,
            };

            const currentLvl = (detailed as any)[assigningBuildingType] || 0;
            const maxLvl = getMaxLevelForBuilding(assigningBuildingType, activeRadarTech);
            const isMax = typeof maxLvl === 'number' && currentLvl >= maxLvl;
            const totalBuildings = getTotalBuildingsInProvince(detailed);
            const isFull = totalBuildings >= MAX_BUILDINGS_PER_PROVINCE;
            const infraBonus = getInfrastructureBonus(detailed.infrastructure || 1);

            return (
             <div
              key={prov.id}
              className="bg-slate-900/90 border border-slate-800 rounded-xl p-2 flex items-center justify-between gap-2 hover:border-slate-700 transition"
             >
              <div className="min-w-0">
               <div className="flex items-center gap-1.5">
                <span className="font-bold text-xs text-white truncate">
                 {getProvinceChineseName(prov.name || prov.id)}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                 #{prov.id}
                </span>
               </div>
               <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                <span>
                 等级: <strong className="font-mono text-slate-200">Lv.{currentLvl}/{maxLvl}</strong>
                </span>
                <span>
                 建筑: <strong className="font-mono text-slate-200">{totalBuildings}/30</strong>
                </span>
               </div>
               {infraBonus > 0 && (
                <div className="text-[9px] text-sky-400 font-mono">
                 提速 +{Math.round(infraBonus * 100)}%
                </div>
               )}
              </div>

              <button
               type="button"
               disabled={isMax || isFull}
               onClick={() =>
                handleDirectBuild(prov.id, prov.name, assigningBuildingType)
               }
               className={`px-2.5 py-1 rounded-lg text-xs font-bold transition shrink-0 cursor-pointer whitespace-nowrap ${
                isMax || isFull
                 ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                 : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs'
               }`}
              >
               {isMax ? '已满级' : isFull ? '满额' : `建造`}
              </button>
             </div>
            );
           })
         )}
        </div>
       </div>
      )}

      {/* 建筑蓝图网格 */}
      <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
       {buildingList.map((building) => {
        const maxLvl =
         building.type === 'radar_station'
          ? RADAR_TECH_TIERS[activeRadarTech].maxLevel
          : building.maxLevel;

        const isAssigningThis = assigningBuildingType === building.type;

        return (
         <div
          key={building.type}
          className={`bg-slate-900/80 border rounded-xl p-3.5 shadow-xs transition-all duration-150 flex flex-col justify-between group relative overflow-hidden ${
           isAssigningThis
            ? 'border-indigo-500 ring-1 ring-indigo-500/50 bg-slate-900'
            : 'border-slate-800 hover:border-slate-700'
          }`}
         >
          {/* 类别顶栏微细色条 */}
          <div
           className="absolute top-0 left-0 right-0 h-0.5"
           style={{ backgroundColor: building.color }}
          />

          <div>
           {/* 图标 + 名称 + 徽标 */}
           <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2.5 min-w-0">
             <div
              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border"
              style={{
               backgroundColor: `${building.color}15`,
               borderColor: `${building.color}40`,
               color: building.color,
              }}
             >
              {building.type === 'infrastructure' && <TrendingUp className="w-4.5 h-4.5" />}
              {building.type === 'anti_air' && <Flame className="w-4.5 h-4.5" />}
              {building.type === 'air_base' && <Plane className="w-4.5 h-4.5" />}
              {building.type === 'radar_station' && <Radio className="w-4.5 h-4.5" />}
              {building.type === 'civilian_factory' && <CivilianFactoryPlantIcon size={18} />}
              {building.type === 'civ_to_mil' && <ArrowRightLeft className="w-4.5 h-4.5 text-amber-400" />}
              {building.type === 'military_factory' && <MilitaryFactoryPlantIcon size={18} />}
              {building.type === 'mil_to_civ' && <ArrowRightLeft className="w-4.5 h-4.5 text-emerald-400" />}
              {building.type === 'naval_dockyard' && <Anchor className="w-4.5 h-4.5" />}
              {building.type === 'synthetic_refinery' && <TacticalOilWellIcon size={18} />}
              {building.type === 'fuel_silo' && <Database className="w-4.5 h-4.5" />}
              {building.type === 'railway' && <TrainTrack className="w-4.5 h-4.5" />}
              {building.type === 'supply_hub' && <PackageCheck className="w-4.5 h-4.5" />}
              {building.type === 'fortress' && <ShieldAlert className="w-4.5 h-4.5" />}
             </div>

             <div className="min-w-0">
              <h4 className="font-bold text-xs sm:text-sm text-white truncate">
               {building.name}
              </h4>
              <span className="text-[11px] text-slate-400 block truncate">
               {building.categoryName} · 上限 {maxLvl} 级
              </span>
             </div>
            </div>

            <span
             className="text-[10px] px-1.5 py-0.2 rounded font-bold tracking-tight shrink-0 font-mono whitespace-nowrap"
             style={{
              backgroundColor: `${building.color}20`,
              color: building.color,
              border: `1px solid ${building.color}35`,
             }}
            >
             {building.badge}
            </span>
           </div>

           {/* 造价信息 */}
           <div className="bg-slate-950/80 border border-slate-800/80 rounded-lg px-2 py-1 mb-2 flex items-center justify-between text-xs">
            <span className="text-[11px] text-slate-400">造价标准:</span>
            <span className="font-mono font-bold text-slate-200 text-[11px]">
             {building.costFormulaDescription}
            </span>
           </div>

           {/* 效果描述 */}
           <p className="text-[11px] text-slate-300 leading-relaxed bg-slate-950/40 p-2 rounded-lg border border-slate-800/60 mb-2.5">
            <strong className="text-slate-100">效益：</strong>
            {building.effect}
           </p>
          </div>

          {/* 双操作按钮组：地图选点 vs 直派行省 */}
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/60">
           <button
            type="button"
            onClick={() => handleSelectBuildingForMap(building.type)}
            className="w-full py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 whitespace-nowrap"
           >
            <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
            <span>地图选点</span>
           </button>

           <button
            type="button"
            onClick={() =>
             setAssigningBuildingType(isAssigningThis ? null : building.type)
            }
            className="w-full py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs whitespace-nowrap"
           >
            <span>{isAssigningThis ? '收起省份' : '直派行省'}</span>
            <ChevronRight
             className={`w-3.5 h-3.5 transition-transform shrink-0 ${
              isAssigningThis ? 'rotate-90' : ''
             }`}
            />
           </button>
          </div>
         </div>
        );
       })}
      </div>
     </div>
    )}

    {/* 5. TAB 2: 全国工程建造队列管理 */}
    {activeTab === 'queue' && (
     <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 min-h-0">
      {/* 流水线负荷状态简报 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
       <div className="flex items-center gap-2">
        <Hammer className="w-4 h-4 text-amber-400 shrink-0" />
        <span className="text-slate-300 font-bold">
         建造流水线负荷（按顺序自上而下优先分配民工）：
        </span>
       </div>
       <div className="flex items-center gap-3 text-xs font-mono">
        <span className="text-slate-400">
         当前排期: <strong className="text-white">{constructionQueue.length}</strong> 条
        </span>
        <span className="text-slate-400">
         已分配民工: <strong className="text-emerald-400">{civInUse}</strong> / {totalCivFactories} 厂
        </span>
       </div>
      </div>

      {constructionQueue.length === 0 ? (
       <div className="p-12 text-center bg-slate-950/40 rounded-2xl border border-slate-800 space-y-3">
        <div className="w-12 h-12 rounded-xl bg-slate-800 text-slate-500 flex items-center justify-center mx-auto">
         <Clock className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-bold text-slate-300">当前没有正在施工的战略工程</h4>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
         请切换至【战略工程蓝图】选择建筑并在省份或地图上投产，民用工厂将自动为您开工建造！
        </p>
        <button
         type="button"
         onClick={() => setActiveTab('blueprint')}
         className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition cursor-pointer"
        >
         去挑选战略建筑
        </button>
       </div>
      ) : (
       <div className="space-y-2">
        {constructionQueue.map((item, idx) => {
         const building = STRATEGIC_BUILDINGS[item.buildingType] || {
          name: item.buildingType,
          color: '#6366f1',
         };

         const progressPercent = Math.min(
          100,
          ((item.progress || item.investedCapacity || 0) /
           (item.totalCost || item.cost || 1)) *
           100
         );

         return (
          <div
           key={item.id}
           className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-700 transition"
          >
           <div className="flex items-center gap-3 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-xs font-mono font-bold text-slate-400 shrink-0">
             #{idx + 1}
            </div>

            <div className="min-w-0">
             <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-xs sm:text-sm text-white truncate">
               {getProvinceChineseName(item.provinceName || item.provinceId)} · {building.name} (Lv.{item.targetLevel})
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono shrink-0">
               造价 {item.totalCost || item.cost}
              </span>
             </div>

             <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
              <span>
               分配民工: <strong className="text-emerald-400 font-mono">{item.assignedFactories ?? item.allocatedCivFactories ?? 0} 厂</strong>
              </span>
              <span>
               基建提速: <strong className="text-sky-400 font-mono">+{Math.round((item.speedBonus || 0) * 100)}%</strong>
              </span>
             </div>
            </div>
           </div>

           {/* 进度条与操作 */}
           <div className="flex items-center gap-3 shrink-0 self-end sm:self-center w-full sm:w-auto">
            <div className="flex-1 sm:w-40 space-y-1">
             <div className="flex items-center justify-between text-[10px] font-mono">
              <span className="text-slate-400">施工进度</span>
              <span className="text-amber-400 font-bold">{progressPercent.toFixed(1)}%</span>
             </div>
             <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
               className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full transition-all duration-300"
               style={{ width: `${progressPercent}%` }}
              />
             </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
             {onReorderQueueItem && (
              <>
               <button
                type="button"
                disabled={idx === 0}
                onClick={() => onReorderQueueItem(idx, idx - 1)}
                className="p-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                title="提升优先级"
               >
                <ChevronUp className="w-3.5 h-3.5" />
               </button>
               <button
                type="button"
                disabled={idx === constructionQueue.length - 1}
                onClick={() => onReorderQueueItem(idx, idx + 1)}
                className="p-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                title="降低优先级"
               >
                <ChevronDown className="w-3.5 h-3.5" />
               </button>
              </>
             )}

             {onCancelQueueItem && (
              <button
               type="button"
               onClick={() => onCancelQueueItem(item.id)}
               className="p-1 rounded-lg bg-rose-950/40 border border-rose-800/40 text-rose-400 hover:bg-rose-900/60 hover:text-white transition cursor-pointer ml-0.5"
               title="取消此项工程"
              >
               <Trash2 className="w-3.5 h-3.5" />
              </button>
             )}
            </div>
           </div>
          </div>
         );
        })}
       </div>
      )}
     </div>
    )}
   </div>
  </div>
 );
};
