import React, { useState, useMemo } from 'react';
import {
 Search,
 Filter,
 Shield,
 Swords,
 Users,
 Award,
 Send,
 Eye,
 CheckCircle2,
 Building,
 Plus,
 ArrowUpDown,
 RotateCcw,
} from 'lucide-react';
import { AllianceFaction, Nation } from '../../types';
import { ALLIANCE_TYPE_CONFIG } from '../../lib/allianceConstants';
import { getTotalMilitaryFactories } from '../../lib/militaryIndustry';
import { getTotalCivilianFactories } from '../../lib/economyEngine';

interface AllianceLobbyViewProps {
 alliances: AllianceFaction[];
 allNations: Nation[];
 myNation: Nation;
 onInspectAlliance: (alliance: AllianceFaction) => void;
 onRequestJoinAlliance: (alliance: AllianceFaction) => void;
 onCreateAllianceClick: () => void;
}

export const AllianceLobbyView: React.FC<AllianceLobbyViewProps> = ({
 alliances,
 allNations,
 myNation,
 onInspectAlliance,
 onRequestJoinAlliance,
 onCreateAllianceClick,
}) => {
 const [searchTerm, setSearchTerm] = useState('');
 const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
 const [onlyOpenApp, setOnlyOpenApp] = useState(false);
 const [sortBy, setSortBy] = useState<'default' | 'members' | 'military' | 'territory'>('default');

 // Compute aggregated stats for each alliance
 const enrichedAlliances = useMemo(() => {
  return alliances.map((alliance) => {
   const memberNations = allNations.filter((n) => alliance.memberNationIds.includes(n.id));
   const leaderNation = allNations.find((n) => n.id === alliance.leaderNationId);

   const totalMilFactories = memberNations.reduce(
    (acc, n) => acc + getTotalMilitaryFactories(n),
    0
   );
   const totalCivFactories = memberNations.reduce(
    (acc, n) => acc + getTotalCivilianFactories(n),
    0
   );
   const totalProvinces = memberNations.reduce(
    (acc, n) => acc + (n.provinces || []).length,
    0
   );

   const involvedWars = new Set(
    memberNations.flatMap((n) => (n.activeWars || []).map((w) => w.withNationName || w.withNationId))
   );

   const isMyAlliance = alliance.memberNationIds.includes(myNation.id);
   const hasApplied = (alliance.pendingApplications || []).some((p) => p.nationId === myNation.id);

   // Total power score for sorting
   const powerScore = totalMilFactories * 2 + totalCivFactories + totalProvinces * 3 + memberNations.length * 5;

   return {
    ...alliance,
    leaderNation,
    memberNations,
    totalMilFactories,
    totalCivFactories,
    totalProvinces,
    powerScore,
    warCount: involvedWars.size,
    warringTargets: Array.from(involvedWars),
    isMyAlliance,
    hasApplied,
   };
  });
 }, [alliances, allNations, myNation]);

 // Filtered & sorted alliances
 const filteredAlliances = useMemo(() => {
  let result = enrichedAlliances.filter((a) => {
   if (searchTerm.trim()) {
    const term = searchTerm.toLowerCase();
    const matchName = a.name.toLowerCase().includes(term);
    const matchTag = a.tag.toLowerCase().includes(term);
    const matchLeader = a.leaderNationName.toLowerCase().includes(term);
    const matchMember = a.memberNationNames.some((m) => m.toLowerCase().includes(term));
    if (!matchName && !matchTag && !matchLeader && !matchMember) return false;
   }
   if (selectedTypeFilter !== 'all' && a.allianceType !== selectedTypeFilter) {
    return false;
   }
   if (onlyOpenApp && a.joinRequirements?.allowOpenApplication === false) {
    return false;
   }
   return true;
  });

  if (sortBy === 'members') {
   result = [...result].sort((a, b) => b.memberNationIds.length - a.memberNationIds.length);
  } else if (sortBy === 'military') {
   result = [...result].sort((a, b) => b.totalMilFactories - a.totalMilFactories);
  } else if (sortBy === 'territory') {
   result = [...result].sort((a, b) => b.totalProvinces - a.totalProvinces);
  }

  return result;
 }, [enrichedAlliances, searchTerm, selectedTypeFilter, onlyOpenApp, sortBy]);

 const hasActiveFilters = searchTerm.trim() !== '' || selectedTypeFilter !== 'all' || onlyOpenApp || sortBy !== 'default';

 const handleClearFilters = () => {
  setSearchTerm('');
  setSelectedTypeFilter('all');
  setOnlyOpenApp(false);
  setSortBy('default');
 };

 return (
  <div className="w-full text-slate-800 space-y-4">
   
   {/* ─────────────────────────────────────────────────────────────
     1. 搜索与筛选工具栏 (纯横向工具条，无外层嵌套大 Card)
     ───────────────────────────────────────────────────────────── */}
   <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-200/80">
    
    {/* 左侧：搜索框 */}
    <div className="relative flex-1 max-w-md">
     <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
     <input
      type="text"
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      placeholder="搜索联盟名称 / TAG / 盟主国 / 成员国..."
      className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-xs text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-800 transition-colors"
     />
    </div>

    {/* 右侧：筛选与排序工具项 */}
    <div className="flex items-center gap-2 flex-wrap text-xs">
     
     {/* 类型筛选 */}
     <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-xs px-2 py-1">
      <Filter className="w-3 h-3 text-slate-400" />
      <select
       value={selectedTypeFilter}
       onChange={(e) => setSelectedTypeFilter(e.target.value)}
       className="bg-transparent text-slate-700 font-medium focus:outline-none cursor-pointer text-xs"
      >
       <option value="all">全部公约类型</option>
       <option value="defensive">共同防御同盟</option>
       <option value="military">多边战略公约</option>
       <option value="economic">关税贸易同盟</option>
       <option value="federation">主权联邦同盟</option>
       <option value="entente">战略互保协定</option>
      </select>
     </div>

     {/* 仅看开放申请 */}
     <button
      type="button"
      onClick={() => setOnlyOpenApp(!onlyOpenApp)}
      className={`px-2.5 py-1 text-xs font-medium rounded-xs border transition-colors cursor-pointer flex items-center gap-1 ${
       onlyOpenApp
        ? 'bg-slate-900 text-white border-slate-900'
        : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
      }`}
     >
      <CheckCircle2 className={`w-3 h-3 ${onlyOpenApp ? 'text-white' : 'text-slate-400'}`} />
      <span>开放加入</span>
     </button>

     {/* 排序方式 */}
     <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-xs px-2 py-1">
      <ArrowUpDown className="w-3 h-3 text-slate-400" />
      <select
       value={sortBy}
       onChange={(e) => setSortBy(e.target.value as any)}
       className="bg-transparent text-slate-700 font-medium focus:outline-none cursor-pointer text-xs"
      >
       <option value="default">默认排序</option>
       <option value="members">按成员国规模</option>
       <option value="military">按军工产能</option>
       <option value="territory">按控制疆域</option>
      </select>
     </div>

     {/* 创建联盟 (克制小按钮) */}
     <button
      type="button"
      onClick={onCreateAllianceClick}
      className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xs text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-2xs shrink-0"
     >
      <Plus className="w-3.5 h-3.5" />
      <span>创建联盟</span>
     </button>
    </div>
   </div>

   {/* ─────────────────────────────────────────────────────────────
     2. 联盟目录核心区 (列表/表格排版，纯细分割线，非 Card 堆叠)
     ───────────────────────────────────────────────────────────── */}
   <div className="space-y-2">
    
    {/* 目录标题行 */}
    <div className="flex items-center justify-between text-xs font-mono text-slate-500 px-0.5">
     <div className="flex items-center gap-2">
      <span className="font-sans font-bold text-slate-900 text-sm tracking-tight">
       全球活跃联盟名册
      </span>
      <span>·</span>
      <span>共 {filteredAlliances.length} 个多边公约</span>
     </div>

     {hasActiveFilters && (
      <button
       type="button"
       onClick={handleClearFilters}
       className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer font-sans"
      >
       <RotateCcw className="w-3 h-3" />
       <span>重置筛选</span>
      </button>
     )}
    </div>

    {/* 空状态设计 */}
    {filteredAlliances.length === 0 ? (
     <div className="bg-white border border-slate-200/90 rounded-xs py-16 px-6 text-center shadow-2xs">
      {alliances.length === 0 ? (
       <div className="max-w-md mx-auto space-y-3">
        <div className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center mx-auto text-slate-400 font-mono text-xs">
         ○
        </div>
        <div className="space-y-1">
         <h3 className="text-sm font-bold text-slate-900">
          当前世界尚未建立任何国际联盟
         </h3>
         <p className="text-xs text-slate-500 leading-relaxed">
          公约与外交网络尚处于初始真空期。作为主权国家元首，您可以率先创立多边同盟，引领大陆地缘秩序。
         </p>
        </div>
        <div className="pt-2">
         <button
          type="button"
          onClick={onCreateAllianceClick}
          className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-xs cursor-pointer shadow-2xs transition-colors"
         >
          + 确立首个国际联盟
         </button>
        </div>
       </div>
      ) : (
       <div className="max-w-md mx-auto space-y-3">
        <div className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center mx-auto text-slate-400 font-mono text-xs">
         ○
        </div>
        <div className="space-y-1">
         <h3 className="text-sm font-bold text-slate-900">
          暂无符合条件的公开联盟
         </h3>
         <p className="text-xs text-slate-500">
          未检索到匹配当前关键词或筛选条件的国际公约组织。
         </p>
        </div>
        <div className="pt-1">
         <button
          type="button"
          onClick={handleClearFilters}
          className="px-3 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xs text-xs font-medium cursor-pointer transition-colors"
         >
          清除筛选条件
         </button>
        </div>
       </div>
      )}
     </div>
    ) : (
     /* 核心列表容器 (细线分割，仅悬停浅底色) */
     <div className="bg-white border border-slate-200/90 rounded-xs shadow-2xs overflow-hidden">
      
      {/* 桌面端标准外交数据表 */}
      <div className="hidden md:block overflow-x-auto">
       <table className="w-full text-left text-xs border-collapse font-sans">
        <thead>
         <tr className="bg-[#fbfbf9] text-slate-500 text-[11px] font-medium border-b border-slate-200">
          <th className="py-2.5 px-3 font-medium">联盟徽章与全称</th>
          <th className="py-2.5 px-3 font-medium">盟主国与元首</th>
          <th className="py-2.5 px-3 text-center font-medium">成员规模</th>
          <th className="py-2.5 px-3 text-right font-medium">军工 / 民工</th>
          <th className="py-2.5 px-3 text-right font-medium">疆域</th>
          <th className="py-2.5 px-3 text-center font-medium">战备态势</th>
          <th className="py-2.5 px-3 text-right font-medium">行动</th>
         </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
         {filteredAlliances.map((alliance) => {
          const typeConfig = alliance.allianceType
           ? ALLIANCE_TYPE_CONFIG[alliance.allianceType]
           : null;

          return (
           <tr
            key={alliance.id}
            className="hover:bg-slate-50/80 transition-colors group"
           >
            {/* 1. 联盟徽章与全称 */}
            <td className="py-3 px-3">
             <div className="flex items-center gap-3">
              {/* 联盟徽章：38x38px 方正徽标 */}
              <div
               className="w-9 h-9 rounded-xs border border-slate-700/60 flex flex-col items-center justify-center text-white shrink-0 shadow-2xs select-none"
               style={{ backgroundColor: alliance.bannerColor || '#1e3a8a' }}
              >
               <Shield className="w-3.5 h-3.5 text-white/90" />
               <span className="font-mono font-bold text-[9px] uppercase tracking-wider leading-none mt-0.5">
                {alliance.tag ? alliance.tag.slice(0, 4) : 'PACT'}
               </span>
              </div>

              {/* 联盟全称与章程简述 */}
              <div className="min-w-0 max-w-xs lg:max-w-sm">
               <div className="flex items-center gap-1.5 flex-wrap">
                <button
                 type="button"
                 onClick={() => onInspectAlliance(alliance)}
                 className="font-bold text-slate-900 text-xs hover:text-blue-900 cursor-pointer text-left truncate transition-colors"
                >
                 {alliance.name}
                </button>
                {typeConfig && (
                 <span className="px-1.5 py-0.2 bg-slate-100 text-slate-600 border border-slate-200 text-[10px] rounded-xs font-mono shrink-0">
                  {typeConfig.label}
                 </span>
                )}
               </div>
               <div className="text-[11px] text-slate-400 truncate mt-0.5 font-normal">
                {alliance.description || '多边集体安全条约组织，维护地缘防御均势'}
               </div>
              </div>
             </div>
            </td>

            {/* 2. 盟主国 */}
            <td className="py-3 px-3 whitespace-nowrap">
             <div className="font-semibold text-slate-800 text-xs">
              {alliance.leaderNationName}
             </div>
             <div className="text-[10px] text-slate-400 font-mono">
              元首：{alliance.leaderNation?.ownerUsername || '公约常驻统帅'}
             </div>
            </td>

            {/* 3. 成员规模 */}
            <td className="py-3 px-3 text-center whitespace-nowrap font-mono text-xs">
             <span className="text-slate-800 font-semibold">
              {alliance.memberNationIds.length}
             </span>
             <span className="text-slate-400 text-[11px] ml-0.5">国</span>
            </td>

            {/* 4. 军工 / 民工 */}
            <td className="py-3 px-3 text-right whitespace-nowrap font-mono text-xs tabular-nums text-slate-700">
             <span className="text-slate-900 font-semibold">{alliance.totalMilFactories}</span>
             <span className="text-slate-300 mx-1">/</span>
             <span className="text-slate-600">{alliance.totalCivFactories}</span>
            </td>

            {/* 5. 疆域 */}
            <td className="py-3 px-3 text-right whitespace-nowrap font-mono text-xs tabular-nums text-slate-700">
             {alliance.totalProvinces} 省
            </td>

            {/* 6. 战备态势 */}
            <td className="py-3 px-3 text-center whitespace-nowrap">
             {alliance.warCount > 0 ? (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.2 bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-semibold rounded-xs">
               <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
               <span>交战 ({alliance.warCount})</span>
              </span>
             ) : (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.2 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold rounded-xs">
               <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
               <span>和平互保</span>
              </span>
             )}
            </td>

            {/* 7. 操作行动 */}
            <td className="py-3 px-3 text-right whitespace-nowrap">
             <div className="inline-flex items-center gap-1.5">
              <button
               type="button"
               onClick={() => onInspectAlliance(alliance)}
               className="px-2 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xs text-[11px] font-medium cursor-pointer transition-colors"
              >
               公约详情
              </button>

              {alliance.isMyAlliance ? (
               <span className="px-2 py-1 bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-semibold rounded-xs">
                所属同盟
               </span>
              ) : alliance.hasApplied ? (
               <span className="px-2 py-1 bg-slate-100 text-slate-600 border border-slate-200 text-[11px] font-semibold rounded-xs">
                审核中
               </span>
              ) : (
               <button
                type="button"
                onClick={() => onRequestJoinAlliance(alliance)}
                className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-xs text-[11px] font-medium cursor-pointer transition-colors shadow-2xs"
               >
                申请加入
               </button>
              )}
             </div>
            </td>
           </tr>
          );
         })}
        </tbody>
       </table>
      </div>

      {/* 移动端简洁条目流 (无厚重 Card，仅靠细分割线与清晰排版) */}
      <div className="block md:hidden divide-y divide-slate-100">
       {filteredAlliances.map((alliance) => {
        const typeConfig = alliance.allianceType
         ? ALLIANCE_TYPE_CONFIG[alliance.allianceType]
         : null;

        return (
         <div key={`mob-${alliance.id}`} className="p-3.5 space-y-2.5 bg-white">
          {/* 头部：徽章 + 名称 + 状态 */}
          <div className="flex items-start justify-between gap-2">
           <div className="flex items-center gap-2.5 min-w-0">
            <div
             className="w-8 h-8 rounded-xs border border-slate-700/60 flex flex-col items-center justify-center text-white shrink-0 select-none shadow-2xs"
             style={{ backgroundColor: alliance.bannerColor || '#1e3a8a' }}
            >
             <span className="font-mono font-bold text-[9px] uppercase">
              {alliance.tag ? alliance.tag.slice(0, 3) : 'PACT'}
             </span>
            </div>
            <div className="min-w-0">
             <button
              type="button"
              onClick={() => onInspectAlliance(alliance)}
              className="font-bold text-slate-900 text-xs truncate block text-left"
             >
              {alliance.name}
             </button>
             <div className="text-[10px] text-slate-400 font-mono truncate">
              盟主：{alliance.leaderNationName}
             </div>
            </div>
           </div>

           {/* 态势标签 */}
           <div className="shrink-0">
            {alliance.warCount > 0 ? (
             <span className="px-1.5 py-0.2 bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-semibold rounded-xs">
              交战中
             </span>
            ) : (
             <span className="px-1.5 py-0.2 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold rounded-xs">
              和平
             </span>
            )}
           </div>
          </div>

          {/* 数据概览条 */}
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-600 bg-slate-50 px-2 py-1 rounded-xs border border-slate-200/60">
           <span>{alliance.memberNationIds.length} 成员国</span>
           <span>·</span>
           <span>军工 {alliance.totalMilFactories} / 民工 {alliance.totalCivFactories}</span>
           <span>·</span>
           <span>{alliance.totalProvinces} 省</span>
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center justify-end gap-2 pt-0.5">
           <button
            type="button"
            onClick={() => onInspectAlliance(alliance)}
            className="px-2.5 py-1 bg-white text-slate-700 border border-slate-300 rounded-xs text-[11px] font-medium cursor-pointer"
           >
            详情
           </button>

           {alliance.isMyAlliance ? (
            <span className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-xs text-[11px] font-semibold">
             所属同盟
            </span>
           ) : alliance.hasApplied ? (
            <span className="px-2.5 py-1 bg-slate-100 text-slate-600 border border-slate-200 rounded-xs text-[11px] font-semibold">
             审核中
            </span>
           ) : (
            <button
             type="button"
             onClick={() => onRequestJoinAlliance(alliance)}
             className="px-3 py-1 bg-slate-900 text-white rounded-xs text-[11px] font-medium cursor-pointer"
            >
             申请加入
            </button>
           )}
          </div>
         </div>
        );
       })}
      </div>

     </div>
    )}
   </div>

  </div>
 );
};
