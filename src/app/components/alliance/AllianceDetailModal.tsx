import React from 'react';
import {
 X,
 Shield,
 Swords,
 Users,
 Building,
 Coins,
 Crown,
 FileText,
 AlertTriangle,
 Check,
 Send,
 MessageSquare,
 Lock,
 Globe,
 Radio,
 Share2,
} from 'lucide-react';
import { AllianceFaction, Nation } from '../../types';
import { ALLIANCE_TYPE_CONFIG } from '../../lib/allianceConstants';
import { getTotalMilitaryFactories } from '../../lib/militaryIndustry';
import { getTotalCivilianFactories } from '../../lib/economyEngine';

interface AllianceDetailModalProps {
 isOpen: boolean;
 onClose: () => void;
 alliance: AllianceFaction | null;
 allNations: Nation[];
 myNation: Nation;
 onRequestJoin: (alliance: AllianceFaction) => void;
 onOpenMyAllianceCommand: () => void;
}

export const AllianceDetailModal: React.FC<AllianceDetailModalProps> = ({
 isOpen,
 onClose,
 alliance,
 allNations,
 myNation,
 onRequestJoin,
 onOpenMyAllianceCommand,
}) => {
 if (!isOpen || !alliance) return null;

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

 const activeWars = Array.from(
  new Set(
   memberNations.flatMap((n) =>
    (n.activeWars || []).map((w) => ({
     targetName: w.withNationName || w.withNationId,
     declarer: n.name,
    }))
   )
  )
 );

 const isMyAlliance = alliance.memberNationIds.includes(myNation.id);
 const isLeader = alliance.leaderNationId === myNation.id;
 const hasApplied = (alliance.pendingApplications || []).some((p) => p.nationId === myNation.id);

 const typeConfig = alliance.allianceType ? ALLIANCE_TYPE_CONFIG[alliance.allianceType] : ALLIANCE_TYPE_CONFIG.defensive;

 return (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
   <div className="w-full max-w-4xl bg-white border border-slate-200/90 rounded-xl shadow-2xl flex flex-col max-h-[92vh] text-slate-800 overflow-hidden">
    {/* Header */}
    <div className="px-5 sm:px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between">
     <div className="flex items-center gap-3">
      <div
       className="w-10 h-10 rounded-lg border border-black/10 flex items-center justify-center font-bold text-sm text-white shadow-2xs shrink-0"
       style={{ backgroundColor: alliance.bannerColor || '#2563eb' }}
      >
       {alliance.tag}
      </div>
      <div>
       <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-blue-600 tracking-wide">
         战略公约审议档案
        </span>
        {typeConfig && (
         <span className="px-2 py-0.2 text-[10px] font-medium rounded-md bg-slate-100 text-slate-700 border border-slate-200">
          {typeConfig.label}
         </span>
        )}
       </div>
       <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
        {alliance.name}
       </h2>
      </div>
     </div>
     <button
      type="button"
      onClick={onClose}
      className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition cursor-pointer"
     >
      <X className="w-4 h-4" />
     </button>
    </div>

    {/* Scrollable Content */}
    <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
     {/* Top 4-Block Tactical Metrics */}
     <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-lg space-y-1">
       <span className="text-[11px] text-slate-500 font-medium block">盟主国家</span>
       <div className="text-sm font-bold text-slate-900 truncate">{alliance.leaderNationName}</div>
       <div className="text-[11px] text-slate-400 truncate">元首: {leaderNation?.ownerUsername || '最高领主'}</div>
      </div>

      <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-lg space-y-1">
       <span className="text-[11px] text-slate-500 font-medium block">缔约成员 / 疆域</span>
       <div className="text-sm font-bold text-blue-600">{alliance.memberNationIds.length} 个主权国</div>
       <div className="text-[11px] text-slate-400">控制 {totalProvinces} 个省份领土</div>
      </div>

      <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-lg space-y-1">
       <span className="text-[11px] text-slate-500 font-medium block">联合军工实力</span>
       <div className="text-sm font-bold text-amber-700">{totalMilFactories} 座军工厂</div>
       <div className="text-[11px] text-slate-400">民工储备: {totalCivFactories} 座</div>
      </div>

      <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-lg space-y-1">
       <span className="text-[11px] text-slate-500 font-medium block">战备交战态势</span>
       <div className={`text-sm font-bold ${activeWars.length > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
        {activeWars.length > 0 ? `涉及 ${activeWars.length} 场战争` : '全域和平互保'}
       </div>
       <div className="text-[11px] text-slate-400">
        {activeWars.length > 0 ? '集体防务条约生效中' : '无外部军事威胁'}
       </div>
      </div>
     </div>

     {/* Alliance Purpose & Doctrine */}
     <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-lg space-y-1.5">
      <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
       <FileText className="w-3.5 h-3.5 text-blue-600" />
       <span>同盟宗旨与最高公约公报</span>
      </div>
      <p className="text-xs text-slate-600 leading-relaxed">
       {alliance.description || '大陆多边主权条约公约集团，致力于维护地缘均势与集体安全。'}
      </p>
     </div>

     {/* Treaty Rules & Accession Conditions */}
     <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {/* Rules Matrix */}
      <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-lg space-y-2.5">
       <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
        <Shield className="w-3.5 h-3.5 text-blue-600" />
        <span>公约机制与同盟法案</span>
       </div>
       <div className="space-y-1.5 text-xs text-slate-700">
        <div className="flex items-center justify-between p-2 bg-white border border-slate-200/80 rounded-md">
         <span>自动触发集体共同防御</span>
         <strong className={alliance.rules?.autoMutualDefense !== false ? 'text-emerald-700' : 'text-slate-500'}>
          {alliance.rules?.autoMutualDefense !== false ? '强制触发' : '非强制'}
         </strong>
        </div>
        <div className="flex items-center justify-between p-2 bg-white border border-slate-200/80 rounded-md">
         <span>成员独立对外宣战权</span>
         <strong className={alliance.rules?.allowIndependentWar !== false ? 'text-amber-700' : 'text-rose-600'}>
          {alliance.rules?.allowIndependentWar !== false ? '允许独立宣战' : '需同盟授权'}
         </strong>
        </div>
        <div className="flex items-center justify-between p-2 bg-white border border-slate-200/80 rounded-md">
         <span>自愿脱离公约权利</span>
         <strong className={alliance.rules?.allowSecession !== false ? 'text-emerald-700' : 'text-slate-500'}>
          {alliance.rules?.allowSecession !== false ? '允许自由退出' : '受公约锁定义务'}
         </strong>
        </div>
        <div className="flex items-center justify-between p-2 bg-white border border-slate-200/80 rounded-md">
         <span>盟主特权裁决与除名</span>
         <strong className="text-blue-600">
          {alliance.rules?.leaderCanKick !== false ? '盟主拥有最高否决权' : '需多数成员表决'}
         </strong>
        </div>
       </div>
      </div>

      {/* Accession Requirements */}
      <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-lg space-y-2.5">
       <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
        <Crown className="w-3.5 h-3.5 text-amber-600" />
        <span>入盟公约准入门槛</span>
       </div>
       <div className="space-y-1.5 text-xs text-slate-700">
        <div className="flex items-center justify-between p-2 bg-white border border-slate-200/80 rounded-md">
         <span>公开外交申请</span>
         <strong className={alliance.joinRequirements?.allowOpenApplication !== false ? 'text-emerald-700' : 'text-rose-600'}>
          {alliance.joinRequirements?.allowOpenApplication !== false ? '开放全域照会' : '仅限定向邀约'}
         </strong>
        </div>
        <div className="flex items-center justify-between p-2 bg-white border border-slate-200/80 rounded-md">
         <span>最低国内稳定度要求</span>
         <strong className="text-slate-800">
          ≥ {alliance.joinRequirements?.minStability || 40}%
         </strong>
        </div>
        <div className="flex items-center justify-between p-2 bg-white border border-slate-200/80 rounded-md">
         <span>最低军工储备规模</span>
         <strong className="text-slate-800">
          ≥ {alliance.joinRequirements?.minFactories || 1} 座工厂
         </strong>
        </div>
        <div className="flex items-center justify-between p-2 bg-white border border-slate-200/80 rounded-md">
         <span>意识形态契合度</span>
         <strong className="text-blue-600">
          {alliance.joinRequirements?.ideologyRequirement || '包容各政体主权国'}
         </strong>
        </div>
       </div>
      </div>
     </div>

     {/* Member Nations Hierarchy Roster */}
     <div className="space-y-2.5">
      <div className="text-xs font-semibold text-slate-800 flex items-center justify-between">
       <div className="flex items-center gap-1.5">
        <Users className="w-3.5 h-3.5 text-blue-600" />
        <span>缔约成员国名册 ({memberNations.length})</span>
       </div>
       <span className="text-[11px] text-slate-400 font-normal">梯次排列：盟主国 / 创始缔约国 / 成员国</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
       {memberNations.map((nation) => {
        const isMemberLeader = nation.id === alliance.leaderNationId;
        const milCount = getTotalMilitaryFactories(nation);
        const civCount = getTotalCivilianFactories(nation);

        return (
         <div
          key={nation.id}
          className={`p-3 rounded-lg border ${
           isMemberLeader
            ? 'bg-blue-50/50 border-blue-200 shadow-2xs'
            : 'bg-slate-50 border-slate-200/80'
          } space-y-2`}
         >
          <div className="flex items-center justify-between gap-2">
           <div className="flex items-center gap-2 min-w-0">
            <div
             className="w-5 h-5 rounded-sm border border-black/10 shrink-0"
             style={{ backgroundColor: nation.flagColor || '#2563eb' }}
            />
            <span className="font-bold text-xs text-slate-900 truncate">
             {nation.name}
            </span>
           </div>
           {isMemberLeader ? (
            <span className="px-1.5 py-0.2 bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-semibold rounded-md">
             盟主国
            </span>
           ) : (
            <span className="px-1.5 py-0.2 bg-slate-100 text-slate-600 text-[10px] rounded-md">
             缔约国
            </span>
           )}
          </div>

          <div className="text-[11px] text-slate-500 flex items-center justify-between">
           <span>元首: {nation.ownerUsername}</span>
           <span>政体: {nation.regime}</span>
          </div>

          <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-200/60">
           <span>军工: <strong className="text-amber-700">{milCount}</strong> 座</span>
           <span>省份: <strong className="text-blue-600">{(nation.provinces || []).length}</strong> 块</span>
           <span>稳定: <strong className="text-emerald-700">{nation.stability || 80}%</strong></span>
          </div>
         </div>
        );
       })}
      </div>
     </div>
    </div>

    {/* Action Footer */}
    <div className="px-5 sm:px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
     <div className="text-xs text-slate-400 hidden sm:block">
      公约代码：<strong className="text-slate-600 font-mono">{alliance.id}</strong>
     </div>

     <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
      <button
       type="button"
       onClick={onClose}
       className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium cursor-pointer transition-colors"
      >
       关闭
      </button>

      {isMyAlliance ? (
       <button
        type="button"
        onClick={() => {
         onClose();
         onOpenMyAllianceCommand();
        }}
        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors shadow-xs flex items-center gap-1.5"
       >
        <Shield className="w-3.5 h-3.5" />
        <span>进入阵营控制台</span>
       </button>
      ) : hasApplied ? (
       <span className="px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold">
        入盟照会审批中
       </span>
      ) : (
       <button
        type="button"
        onClick={() => {
         onClose();
         onRequestJoin(alliance);
        }}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors shadow-xs flex items-center gap-1.5"
       >
        <Send className="w-3.5 h-3.5" />
        <span>递交入盟外交照会</span>
       </button>
      )}
     </div>
    </div>
   </div>
  </div>
 );
};
