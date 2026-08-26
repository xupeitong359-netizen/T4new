import React, { useState, useMemo } from 'react';
import {
 Shield,
 Users,
 Swords,
 Crown,
 FileText,
 MessageSquare,
 Send,
 UserX,
 CheckCircle2,
 XCircle,
 AlertTriangle,
 Radio,
 Sparkles,
 Award,
 ChevronRight,
 LogOut,
 Trash2,
 Globe,
 Clock,
 Building2,
 Building,
 Flag,
 Handshake,
 ShieldCheck,
 Flame,
 Check,
 X,
 Inbox,
 Lock,
} from 'lucide-react';
import { AllianceFaction, Nation, AllianceAnnouncement, AlliancePendingApplication } from '../../types';
import { ALLIANCE_TYPE_CONFIG } from '../../lib/allianceConstants';
import { getTotalMilitaryFactories } from '../../lib/militaryIndustry';
import { getTotalCivilianFactories } from '../../lib/economyEngine';

interface MyAllianceDashboardProps {
 myAlliance: AllianceFaction;
 myNation: Nation;
 allNations: Nation[];
 onUpdateAlliance: (updated: AllianceFaction) => void;
 onLeaveAlliance: () => void;
 onDissolveAlliance: () => void;
 onShowToast: (msg: string) => void;
}

export const MyAllianceDashboard: React.FC<MyAllianceDashboardProps> = ({
 myAlliance,
 myNation,
 allNations,
 onUpdateAlliance,
 onLeaveAlliance,
 onDissolveAlliance,
 onShowToast,
}) => {
 const [activeSection, setActiveSection] = useState<'overview' | 'petitions' | 'chat'>('overview');
 const [chatInput, setChatInput] = useState('');
 const [newAnnouncementTitle, setNewAnnouncementTitle] = useState('');
 const [newAnnouncementContent, setNewAnnouncementContent] = useState('');
 const [isPublishingAnn, setIsPublishingAnn] = useState(false);

 const isLeader = myAlliance.leaderNationId === myNation.id;
 const memberNations = useMemo(
  () => allNations.filter((n) => myAlliance.memberNationIds.includes(n.id)),
  [allNations, myAlliance.memberNationIds]
 );

 // Aggregate Industrial & Territory metrics
 const totalMilFactories = useMemo(
  () => memberNations.reduce((acc, n) => acc + getTotalMilitaryFactories(n), 0),
  [memberNations]
 );
 const totalCivFactories = useMemo(
  () => memberNations.reduce((acc, n) => acc + getTotalCivilianFactories(n), 0),
  [memberNations]
 );
 const totalProvinces = useMemo(
  () => memberNations.reduce((acc, n) => acc + (n.provinces || []).length, 0),
  [memberNations]
 );
 const avgStability = useMemo(() => {
  if (memberNations.length === 0) return 80;
  const sum = memberNations.reduce((acc, n) => acc + (n.stabilityIndex || n.stability || 80), 0);
  return Math.round(sum / memberNations.length);
 }, [memberNations]);

 // Aggregate active wars involving any alliance member
 const memberWars = useMemo(() => {
  const warMap = new Map<string, { enemyName: string; enemyId: string; since: string }>();
  memberNations.forEach((n) => {
   (n.activeWars || []).forEach((w) => {
    if (!warMap.has(w.withNationId)) {
     warMap.set(w.withNationId, {
      enemyName: w.withNationName,
      enemyId: w.withNationId,
      since: w.since,
     });
    }
   });
  });
  return Array.from(warMap.values());
 }, [memberNations]);

 const isAtWar = memberWars.length > 0;

 // External diplomatic relations aggregation
 const nonAggressionTreaties = useMemo(() => {
  const list: { nationName: string; since: string }[] = [];
  memberNations.forEach((n) => {
   (n.activeTreaties || []).forEach((t) => {
    if (
     !myAlliance.memberNationIds.includes(t.withNationId) &&
     !list.some((item) => item.nationName === t.withNationName)
    ) {
     list.push({ nationName: t.withNationName, since: t.since });
    }
   });
  });
  return list;
 }, [memberNations, myAlliance.memberNationIds]);

 const pendingApps = myAlliance.pendingApplications || [];

 const typeConfig = myAlliance.allianceType
  ? ALLIANCE_TYPE_CONFIG[myAlliance.allianceType]
  : ALLIANCE_TYPE_CONFIG.defensive;

 // Timeline events generation
 const timelineEvents = useMemo(() => {
  const events: { id: string; date: string; title: string; desc: string; type: 'creation' | 'member' | 'decree' | 'war' | 'chat' }[] = [];

  // Creation event
  const createDate = myAlliance.createdAt ? new Date(myAlliance.createdAt) : new Date();
  events.push({
   id: 'evt_created',
   date: `${createDate.getFullYear()}.${String(createDate.getMonth() + 1).padStart(2, '0')}.${String(createDate.getDate()).padStart(2, '0')}`,
   title: '多边公约正式确立签署',
   desc: `盟主国【${myAlliance.leaderNationName}】昭告建立【${myAlliance.name}】，确立首批缔约章程。`,
   type: 'creation',
  });

  // Announcements
  (myAlliance.announcements || []).forEach((ann) => {
   const d = new Date(ann.createdAt);
   events.push({
    id: 'evt_ann_' + ann.id,
    date: `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`,
    title: `战略公报：${ann.title}`,
    desc: `${ann.authorNationName} 签署通电：“${ann.content.slice(0, 48)}${ann.content.length > 48 ? '...' : ''}”`,
    type: 'decree',
   });
  });

  // Wars
  memberWars.forEach((w) => {
   events.push({
    id: 'evt_war_' + w.enemyId,
    date: '当前持续',
    title: `触发战备警戒：对【${w.enemyName}】军事行动`,
    desc: `盟国处于与【${w.enemyName}】交战状态，集体防卫与战备协调机制生效。`,
    type: 'war',
   });
  });

  // Key chat messages from High Council
  (myAlliance.chatMessages || []).slice(-3).forEach((msg) => {
   events.push({
    id: 'evt_chat_' + msg.id,
    date: msg.time || '今日',
    title: `议事厅照会：${msg.senderNationName}`,
    desc: msg.content,
    type: 'chat',
   });
  });

  return events.slice(0, 7);
 }, [myAlliance, memberWars]);

 // Handle Approve Application
 const handleApprove = (nationId: string) => {
  const targetApp = pendingApps.find((p) => p.nationId === nationId);
  if (!targetApp) return;

  const updated: AllianceFaction = {
   ...myAlliance,
   memberNationIds: [...myAlliance.memberNationIds, targetApp.nationId],
   memberNationNames: [...myAlliance.memberNationNames, targetApp.nationName],
   pendingApplications: pendingApps.filter((p) => p.nationId !== nationId),
   chatMessages: [
    ...myAlliance.chatMessages,
    {
     id: 'chat_' + Date.now(),
     senderNationName: '公约常驻理事会',
     content: `欢迎新成员国【${targetApp.nationName}】正式签署公约并列入成员名册。`,
     time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
   ],
  };

  onUpdateAlliance(updated);
  onShowToast(`已核准【${targetApp.nationName}】的入盟照会，该国已正式列入成员名册。`);
 };

 // Handle Reject Application
 const handleReject = (nationId: string) => {
  const updated: AllianceFaction = {
   ...myAlliance,
   pendingApplications: pendingApps.filter((p) => p.nationId !== nationId),
  };
  onUpdateAlliance(updated);
  onShowToast(`已驳回该国的入盟外交照会。`);
 };

 // Handle Kick Member
 const handleKick = (nationId: string, nationName: string) => {
  if (nationId === myAlliance.leaderNationId) return;
  if (!confirm(`确定行使盟主特权将【${nationName}】移出本同盟阵营吗？`)) return;

  const updated: AllianceFaction = {
   ...myAlliance,
   memberNationIds: myAlliance.memberNationIds.filter((id) => id !== nationId),
   memberNationNames: myAlliance.memberNationNames.filter((name) => name !== nationName),
   chatMessages: [
    ...myAlliance.chatMessages,
    {
     id: 'chat_' + Date.now(),
     senderNationName: '公约常驻理事会',
     content: `盟主国已行使公约特权，将【${nationName}】移出阵营名册。`,
     time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
   ],
  };

  onUpdateAlliance(updated);
  onShowToast(`已将【${nationName}】从同盟阵营中移出。`);
 };

 // Handle Send Chat
 const handleSendChat = () => {
  if (!chatInput.trim()) return;

  const updated: AllianceFaction = {
   ...myAlliance,
   chatMessages: [
    ...myAlliance.chatMessages,
    {
     id: 'chat_' + Date.now(),
     senderNationName: myNation.name,
     content: chatInput.trim(),
     time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
   ],
  };

  onUpdateAlliance(updated);
  setChatInput('');
 };

 // Handle Publish Announcement
 const handlePublishAnnouncement = (e: React.FormEvent) => {
  e.preventDefault();
  if (!newAnnouncementTitle.trim() || !newAnnouncementContent.trim()) return;

  const updated: AllianceFaction = {
   ...myAlliance,
   announcements: [
    {
     id: 'ann_' + Date.now(),
     title: newAnnouncementTitle.trim(),
     content: newAnnouncementContent.trim(),
     authorNationName: myNation.name,
     createdAt: new Date().toISOString(),
     priority: 'normal',
    },
    ...(myAlliance.announcements || []),
   ],
  };

  onUpdateAlliance(updated);
  setNewAnnouncementTitle('');
  setNewAnnouncementContent('');
  setIsPublishingAnn(false);
  onShowToast(`战略公报已正式昭告全体成员国。`);
 };

 const createdYear = myAlliance.createdAt ? new Date(myAlliance.createdAt).getFullYear() : 1936;
 const allianceCode = `ALL-${(myAlliance.tag || myAlliance.id.slice(0, 4)).toUpperCase()}`;

 return (
  <div className="w-full bg-[#fbfbf9] text-slate-800 font-sans select-none space-y-5 rounded-xs border border-slate-200/90 p-4 sm:p-6 shadow-2xs">
   
   {/* ─────────────────────────────────────────────────────────────
     1. 顶部：联盟身份与状态区域 (Top Identity Header)
     ───────────────────────────────────────────────────────────── */}
   <section className="bg-white border border-slate-200/90 p-4 sm:p-5 rounded-xs shadow-2xs">
    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
     
     {/* 左侧：联盟徽章 + 正式名称 + 格言与档案编号 */}
     <div className="flex items-start gap-4">
      {/* 联盟官方徽章 */}
      <div
       className="w-20 h-20 sm:w-24 sm:h-24 rounded-xs border-2 border-slate-700/80 flex flex-col items-center justify-center text-white shadow-xs shrink-0 relative overflow-hidden"
       style={{ backgroundColor: myAlliance.bannerColor || '#1e3a8a' }}
      >
       <div className="absolute inset-0 bg-black/15 pointer-events-none" />
       <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-white/90 mb-1 z-10" />
       <span className="font-mono font-bold text-xs sm:text-sm tracking-wider uppercase z-10">
        {myAlliance.tag || 'PACT'}
       </span>
      </div>

      {/* 名称、格言与档案元数据 */}
      <div className="space-y-1.5 min-w-0">
       <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
         {myAlliance.name}
        </h1>
        <span className="px-2 py-0.5 text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-300/80 rounded-xs">
         {typeConfig.label}
        </span>
        {isLeader && (
         <span className="px-2 py-0.5 text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200 rounded-xs flex items-center gap-1">
          <Crown className="w-3 h-3" />
          <span>本国为盟主国</span>
         </span>
        )}
       </div>

       {/* 联盟格言 / 简介 */}
       <p className="text-xs sm:text-sm text-slate-600 italic leading-relaxed">
        “{myAlliance.description || '和平共处，防务互保，协同繁荣'}”
       </p>

       {/* 档案信息 */}
       <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 font-mono pt-1">
        <span>成立于 {createdYear} 年</span>
        <span className="text-slate-300">|</span>
        <span>档案编号：{allianceCode}</span>
        <span className="text-slate-300">|</span>
        <span>盟主：{myAlliance.leaderNationName}</span>
        {myAlliance.headquartersCity && (
         <>
          <span className="text-slate-300">|</span>
          <span>理事会驻地：{myAlliance.headquartersCity}</span>
         </>
        )}
       </div>
      </div>
     </div>

     {/* 右侧：紧凑状态指标 + 战略操作控制栏 */}
     <div className="flex flex-col items-start lg:items-end justify-between gap-3 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
      
      {/* 状态与统计摘要 (非卡片紧凑排列) */}
      <div className="space-y-1 text-left lg:text-right">
       <div className="flex items-center lg:justify-end gap-2">
        <span className="text-xs text-slate-500 font-medium">当前状态:</span>
        {isAtWar ? (
         <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold rounded-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
          <span>交战状态 (与 {memberWars.length} 国军事冲突)</span>
         </span>
        ) : (
         <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
          <span>和平稳定</span>
         </span>
        )}
       </div>

       <div className="text-xs text-slate-600 font-mono flex items-center lg:justify-end gap-2">
        <span><strong>{myAlliance.memberNationIds.length}</strong> 个成员国</span>
        <span className="text-slate-300">·</span>
        <span><strong>{nonAggressionTreaties.length}</strong> 个协定国</span>
        <span className="text-slate-300">·</span>
        <span><strong>{memberWars.length}</strong> 场战事</span>
       </div>
      </div>

      {/* 操作按钮区 */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
       <button
        type="button"
        onClick={() => setActiveSection('overview')}
        className={`px-3 py-1.5 text-xs font-medium border rounded-xs transition-colors cursor-pointer ${
         activeSection === 'overview'
          ? 'bg-slate-800 text-white border-slate-800'
          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
        }`}
       >
        联盟主页
       </button>

       <button
        type="button"
        onClick={() => setActiveSection('petitions')}
        className={`px-3 py-1.5 text-xs font-medium border rounded-xs transition-colors cursor-pointer relative ${
         activeSection === 'petitions'
          ? 'bg-slate-800 text-white border-slate-800'
          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
        }`}
       >
        <span>入盟审核</span>
        {pendingApps.length > 0 && (
         <span className="ml-1.5 px-1.5 py-0.2 bg-rose-600 text-white text-[10px] font-bold rounded-full">
          {pendingApps.length}
         </span>
        )}
       </button>

       <button
        type="button"
        onClick={() => setActiveSection('chat')}
        className={`px-3 py-1.5 text-xs font-medium border rounded-xs transition-colors cursor-pointer flex items-center gap-1 ${
         activeSection === 'chat'
          ? 'bg-slate-800 text-white border-slate-800'
          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
        }`}
       >
        <MessageSquare className="w-3.5 h-3.5" />
        <span>阵营议事厅</span>
       </button>

       {isLeader ? (
        <button
         type="button"
         onClick={onDissolveAlliance}
         className="px-3 py-1.5 text-xs text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xs font-medium cursor-pointer transition-colors flex items-center gap-1"
         title="解散同盟"
        >
         <Trash2 className="w-3.5 h-3.5" />
         <span>解散</span>
        </button>
       ) : (
        <button
         type="button"
         onClick={onLeaveAlliance}
         className="px-3 py-1.5 text-xs text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xs font-medium cursor-pointer transition-colors flex items-center gap-1"
         title="退出同盟"
        >
         <LogOut className="w-3.5 h-3.5" />
         <span>退出</span>
        </button>
       )}
      </div>
     </div>

    </div>
   </section>

   {/* ─────────────────────────────────────────────────────────────
     2. 联盟综合实力 (横向数据条，细线展示，非卡片)
     ───────────────────────────────────────────────────────────── */}
   <section className="bg-white border border-slate-200/90 p-4 rounded-xs shadow-2xs space-y-2.5">
    <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
     <div className="flex items-center gap-2">
      <span className="text-xs font-bold text-slate-900 tracking-wide">
       联盟综合实力与战备指标
      </span>
     </div>
     <span className="text-[11px] text-slate-500 font-mono">
      基于全体 {memberNations.length} 个缔约成员国实时工业与防御统合
     </span>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono pt-1">
     
     {/* 军事实力 */}
     <div className="space-y-1">
      <div className="flex items-center justify-between text-slate-600">
       <span className="font-sans">联合军工能力</span>
       <strong className="text-slate-900 tabular-nums">{totalMilFactories} 座军工厂</strong>
      </div>
      <div className="w-full h-1 bg-slate-100 rounded-none overflow-hidden">
       <div
        className="h-full bg-slate-700"
        style={{ width: `${Math.min(100, Math.max(15, totalMilFactories * 3))}%` }}
       />
      </div>
     </div>

     {/* 经济与民用工业 */}
     <div className="space-y-1">
      <div className="flex items-center justify-between text-slate-600">
       <span className="font-sans">民用工业基底</span>
       <strong className="text-slate-900 tabular-nums">{totalCivFactories} 座民工厂</strong>
      </div>
      <div className="w-full h-1 bg-slate-100 rounded-none overflow-hidden">
       <div
        className="h-full bg-slate-700"
        style={{ width: `${Math.min(100, Math.max(15, totalCivFactories * 2.5))}%` }}
       />
      </div>
     </div>

     {/* 控制领土 */}
     <div className="space-y-1">
      <div className="flex items-center justify-between text-slate-600">
       <span className="font-sans">同盟疆域总数</span>
       <strong className="text-slate-900 tabular-nums">{totalProvinces} 个省份</strong>
      </div>
      <div className="w-full h-1 bg-slate-100 rounded-none overflow-hidden">
       <div
        className="h-full bg-slate-700"
        style={{ width: `${Math.min(100, Math.max(15, totalProvinces * 4))}%` }}
       />
      </div>
     </div>

     {/* 阵营凝聚度 */}
     <div className="space-y-1">
      <div className="flex items-center justify-between text-slate-600">
       <span className="font-sans">同盟平均稳定度</span>
       <strong className="text-emerald-700 tabular-nums">{avgStability}%</strong>
      </div>
      <div className="w-full h-1 bg-slate-100 rounded-none overflow-hidden">
       <div
        className="h-full bg-emerald-600"
        style={{ width: `${avgStability}%` }}
       />
      </div>
     </div>

    </div>

    {/* 共同防御说明条 */}
    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-sans">
     <div className="flex items-center gap-1.5">
      <ShieldCheck className="w-3.5 h-3.5 text-blue-800 shrink-0" />
      <span>
       <strong>共同防卫条款：</strong>
       {myAlliance.mutualDefense !== false
        ? '已激活 · 任何针对成员国的进攻行为将自动触发全体公约国集体防御'
        : '未确立全面互保协定'}
      </span>
     </div>
     <span className="font-mono text-slate-400 hidden sm:inline">最高军事参谋统合机制</span>
    </div>
   </section>

   {/* ─────────────────────────────────────────────────────────────
     3. 主体分栏内容 (Dual-Column Layout)
     ───────────────────────────────────────────────────────────── */}
   {activeSection === 'overview' && (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
     
     {/* 左侧栏 (5 列)：联盟动态与外交关系 */}
     <div className="lg:col-span-5 space-y-5">
      
      {/* 联盟动态 (时间线形式，细线与文字) */}
      <div className="bg-white border border-slate-200/90 p-4 rounded-xs shadow-2xs space-y-3">
       <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
        <div className="flex items-center gap-2">
         <Clock className="w-4 h-4 text-slate-600" />
         <h3 className="text-xs font-bold text-slate-900 tracking-wide">
          联盟动态与编年档案
         </h3>
        </div>
        <span className="text-[11px] font-mono text-slate-400">近阶段大事记</span>
       </div>

       <div className="space-y-3 text-xs pt-1">
        {timelineEvents.map((evt) => (
         <div key={evt.id} className="relative pl-4 border-l border-slate-200 space-y-0.5">
          <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-slate-400 border-2 border-white" />
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
           <span>{evt.date}</span>
           {evt.type === 'war' && (
            <span className="text-rose-600 font-bold">战备动员</span>
           )}
           {evt.type === 'decree' && (
            <span className="text-blue-800 font-medium">战略公报</span>
           )}
          </div>
          <div className="font-semibold text-slate-800 text-xs">{evt.title}</div>
          <div className="text-[11px] text-slate-500 leading-relaxed">{evt.desc}</div>
         </div>
        ))}
       </div>
      </div>

      {/* 外交关系概览 */}
      <div className="bg-white border border-slate-200/90 p-4 rounded-xs shadow-2xs space-y-3">
       <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
        <div className="flex items-center gap-2">
         <Handshake className="w-4 h-4 text-slate-600" />
         <h3 className="text-xs font-bold text-slate-900 tracking-wide">
          多边外交关系概览
         </h3>
        </div>
        <span className="text-[11px] font-mono text-slate-400">国家外交关系</span>
       </div>

       <div className="space-y-2 text-xs divide-y divide-slate-100">
        {/* 盟国体系 */}
        <div className="pt-1.5 space-y-1">
         <span className="text-slate-500 text-[11px]">公约缔约国 ({memberNations.length})：</span>
         <div className="text-slate-800 font-medium leading-relaxed">
          {memberNations.map((n) => n.name).join(' · ')}
         </div>
        </div>

        {/* 互不侵犯协议国 */}
        <div className="pt-2 space-y-1">
         <span className="text-slate-500 text-[11px]">互不侵犯协定：</span>
         <div className="text-slate-700 leading-relaxed">
          {nonAggressionTreaties.length > 0
           ? nonAggressionTreaties.map((t) => t.nationName).join(' · ')
           : '暂无对外部阵营互不侵犯协定'}
         </div>
        </div>

        {/* 敌对与交战 */}
        <div className="pt-2 space-y-1">
         <span className="text-slate-500 text-[11px]">交战与敌对：</span>
         <div className="text-slate-700 leading-relaxed">
          {memberWars.length > 0 ? (
           <span className="text-rose-700 font-semibold">
            {memberWars.map((w) => w.enemyName).join(' · ')}
           </span>
          ) : (
           '无外部交战敌对势力'
          )}
         </div>
        </div>
       </div>
      </div>

     </div>

     {/* 右侧栏 (7 列)：联盟成员名册 + 联盟战略公报 */}
     <div className="lg:col-span-7 space-y-5">
      
      {/* 联盟成员名册 (官方数据表格，表头 + 细线分割) */}
      <div className="bg-white border border-slate-200/90 p-4 rounded-xs shadow-2xs space-y-3">
       <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
        <div className="flex items-center gap-2">
         <Users className="w-4 h-4 text-slate-600" />
         <h3 className="text-xs font-bold text-slate-900 tracking-wide">
          联盟成员名册 ({memberNations.length})
         </h3>
        </div>
        <span className="text-[11px] font-mono text-slate-400">
         最高防务理事会成员名单
        </span>
       </div>

       <div className="w-full border-t border-slate-200 overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
         <thead>
          <tr className="bg-slate-50 text-slate-500 text-[11px] font-medium border-b border-slate-200">
           <th className="py-2 px-2 font-medium">国家与元首</th>
           <th className="py-2 px-2 font-medium">地位</th>
           <th className="py-2 px-2 text-right font-medium">军工 / 民工</th>
           <th className="py-2 px-2 text-right font-medium">疆域</th>
           <th className="py-2 px-2 text-center font-medium">状态</th>
           {isLeader && <th className="py-2 px-2 text-right font-medium">操作</th>}
          </tr>
         </thead>
         <tbody className="divide-y divide-slate-100 font-sans">
          {memberNations.map((nation) => {
           const isMemberLeader = nation.id === myAlliance.leaderNationId;
           const milCount = getTotalMilitaryFactories(nation);
           const civCount = getTotalCivilianFactories(nation);
           const provCount = (nation.provinces || []).length;
           const nationIsAtWar = (nation.activeWars || []).length > 0;

           return (
            <tr key={nation.id} className="hover:bg-slate-50/80 transition-colors">
             {/* 国家与元首 */}
             <td className="py-2.5 px-2">
              <div className="flex items-center gap-2.5">
               <div
                className="w-3.5 h-3.5 rounded-none border border-slate-400 shrink-0"
                style={{ backgroundColor: nation.flagColor || '#1e3a8a' }}
               />
               <div className="min-w-0">
                <div className="font-semibold text-slate-900 text-xs truncate">
                 {nation.name}
                </div>
                <div className="text-[10px] text-slate-400 font-mono truncate">
                 元首：{nation.ownerUsername}
                </div>
               </div>
              </div>
             </td>

             {/* 地位 */}
             <td className="py-2.5 px-2">
              {isMemberLeader ? (
               <span className="inline-flex items-center gap-1 px-1.5 py-0.2 bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-semibold rounded-xs">
                <Crown className="w-2.5 h-2.5" />
                <span>盟主国</span>
               </span>
              ) : (
               <span className="px-1.5 py-0.2 bg-slate-100 text-slate-600 border border-slate-200 text-[10px] rounded-xs">
                缔约国
               </span>
              )}
             </td>

             {/* 军工/民工 */}
             <td className="py-2.5 px-2 text-right font-mono text-xs tabular-nums text-slate-700">
              <span>{milCount}</span>
              <span className="text-slate-400 mx-1">/</span>
              <span>{civCount}</span>
             </td>

             {/* 疆域 */}
             <td className="py-2.5 px-2 text-right font-mono text-xs tabular-nums text-slate-700">
              {provCount} 省
             </td>

             {/* 状态 */}
             <td className="py-2.5 px-2 text-center">
              {nationIsAtWar ? (
               <span className="inline-block px-1.5 py-0.2 text-[10px] font-medium bg-rose-50 text-rose-700 border border-rose-200 rounded-xs">
                参战
               </span>
              ) : (
               <span className="inline-block px-1.5 py-0.2 text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xs">
                正常
               </span>
              )}
             </td>

             {/* 盟主管理操作 */}
             {isLeader && (
              <td className="py-2.5 px-2 text-right">
               {!isMemberLeader && (
                <button
                 type="button"
                 onClick={() => handleKick(nation.id, nation.name)}
                 className="px-2 py-0.5 text-[10px] text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-xs font-medium cursor-pointer transition-colors"
                >
                 除名
                </button>
               )}
              </td>
             )}
            </tr>
           );
          })}
         </tbody>
        </table>
       </div>
      </div>

      {/* 联盟战略公告与政令 */}
      <div className="bg-white border border-slate-200/90 p-4 rounded-xs shadow-2xs space-y-3">
       <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
        <div className="flex items-center gap-2">
         <Radio className="w-4 h-4 text-slate-600" />
         <h3 className="text-xs font-bold text-slate-900 tracking-wide">
          联盟战略公报与最高通电
         </h3>
        </div>
        {isLeader && !isPublishingAnn && (
         <button
          type="button"
          onClick={() => setIsPublishingAnn(true)}
          className="text-xs text-blue-900 hover:text-blue-700 font-semibold cursor-pointer"
         >
          + 发布战略公报
         </button>
        )}
       </div>

       {/* 拟定发布公报表单 */}
       {isPublishingAnn && (
        <form
         onSubmit={handlePublishAnnouncement}
         className="p-3.5 bg-slate-50 border border-slate-200 rounded-xs space-y-2.5 text-xs"
        >
         <div className="font-semibold text-slate-800 text-xs">拟定公约战略通电</div>
         <div>
          <label className="block text-slate-600 mb-1 text-[11px]">公报标题</label>
          <input
           type="text"
           value={newAnnouncementTitle}
           onChange={(e) => setNewAnnouncementTitle(e.target.value)}
           placeholder="例：关于全同盟进入战备协同动员的战略政令"
           className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xs text-xs text-slate-900 focus:outline-none focus:border-blue-900"
           required
          />
         </div>
         <div>
          <label className="block text-slate-600 mb-1 text-[11px]">公报内容</label>
          <textarea
           rows={3}
           value={newAnnouncementContent}
           onChange={(e) => setNewAnnouncementContent(e.target.value)}
           placeholder="阐述战略部署、共同行动纲领与成员国协调要求..."
           className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xs text-xs text-slate-900 focus:outline-none focus:border-blue-900"
           required
          />
         </div>
         <div className="flex items-center justify-end gap-2 pt-1">
          <button
           type="button"
           onClick={() => setIsPublishingAnn(false)}
           className="px-3 py-1 bg-white text-slate-600 border border-slate-300 hover:bg-slate-100 rounded-xs text-xs cursor-pointer"
          >
           取消
          </button>
          <button
           type="submit"
           className="px-4 py-1 bg-blue-900 hover:bg-blue-800 text-white font-medium rounded-xs text-xs cursor-pointer shadow-xs"
          >
           正式发布
          </button>
         </div>
        </form>
       )}

       {/* 公报列表 */}
       <div className="space-y-3 pt-1">
        {(myAlliance.announcements || []).length === 0 ? (
         <div className="text-xs text-slate-400 py-6 text-center">
          暂无战略公报通电记录
         </div>
        ) : (
         (myAlliance.announcements || []).map((ann, idx) => (
          <div
           key={ann.id}
           className={`p-3 rounded-xs border space-y-1.5 ${
            idx === 0
             ? 'bg-slate-50/70 border-slate-300/80'
             : 'bg-white border-slate-200'
           }`}
          >
           <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
             {idx === 0 && (
              <span className="px-1.5 py-0.2 bg-blue-900 text-white text-[10px] font-bold rounded-xs">
               最新
              </span>
             )}
             <span className="font-semibold text-slate-900 text-xs">
              {ann.title}
             </span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
             {new Date(ann.createdAt).toLocaleDateString()}
            </span>
           </div>
           <p className="text-slate-700 text-xs leading-relaxed">
            {ann.content}
           </p>
           <div className="text-[10px] text-slate-500 font-mono pt-0.5">
            签署发布：<strong>{ann.authorNationName}</strong>
           </div>
          </div>
         ))
        )}
       </div>
      </div>

     </div>

    </div>
   )}

   {/* ─────────────────────────────────────────────────────────────
     4. 独立审核区：入盟照会审批 (Petitions Review Tab)
     ───────────────────────────────────────────────────────────── */}
   {activeSection === 'petitions' && (
    <section className="bg-white border border-slate-200/90 p-5 rounded-xs shadow-2xs space-y-4">
     <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
      <div>
       <h3 className="text-sm font-bold text-slate-900">
        入盟申请照会审核 ({pendingApps.length})
       </h3>
       <p className="text-xs text-slate-500 mt-0.5">
        根据公约章程，新成员国加入须由盟主国最高委员会审议核准
       </p>
      </div>
      <button
       type="button"
       onClick={() => setActiveSection('overview')}
       className="text-xs text-blue-900 font-medium hover:underline"
      >
       返回主页概览 →
      </button>
     </div>

     {pendingApps.length === 0 ? (
      <div className="py-12 text-center text-xs text-slate-400 space-y-1">
       <Inbox className="w-8 h-8 mx-auto text-slate-300 mb-2" />
       <div>当前暂无待审核的入盟外交照会</div>
      </div>
     ) : (
      <div className="space-y-3">
       {pendingApps.map((app) => (
        <div
         key={app.nationId}
         className="p-4 bg-slate-50 border border-slate-200 rounded-xs flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
        >
         <div className="space-y-1.5 flex-1 min-w-0">
          <div className="flex items-center gap-2">
           <span className="font-bold text-slate-900 text-sm">
            {app.nationName}
           </span>
           <span className="text-[11px] font-mono text-slate-400">
            递交于 {new Date(app.appliedAt).toLocaleString()}
           </span>
           {app.totalFactories !== undefined && (
            <span className="text-[10px] font-mono px-1.5 py-0.2 bg-slate-200 text-slate-700 rounded-xs">
             工业实力: {app.totalFactories} 工厂
            </span>
           )}
          </div>
          <p className="text-xs text-slate-700 leading-relaxed bg-white p-2.5 rounded-xs border border-slate-200">
           “{app.reason || '谨向公约常驻理事会申请加入同盟，恪守共同防卫章程。'}”
          </p>
         </div>

         {isLeader ? (
          <div className="flex items-center gap-2 shrink-0">
           <button
            type="button"
            onClick={() => handleReject(app.nationId)}
            className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xs text-xs font-medium cursor-pointer"
           >
            驳回照会
           </button>
           <button
            type="button"
            onClick={() => handleApprove(app.nationId)}
            className="px-4 py-1.5 bg-blue-900 hover:bg-blue-800 text-white font-medium rounded-xs text-xs cursor-pointer shadow-xs"
           >
            核准入盟
           </button>
          </div>
         ) : (
          <span className="text-xs text-slate-400 font-mono">
           等待盟主国裁决
          </span>
         )}
        </div>
       ))}
      </div>
     )}
    </section>
   )}

   {/* ─────────────────────────────────────────────────────────────
     5. 独立信道区：阵营加密议事厅 (Encrypted Communications Tab)
     ───────────────────────────────────────────────────────────── */}
   {activeSection === 'chat' && (
    <section className="bg-white border border-slate-200/90 p-5 rounded-xs shadow-2xs space-y-4">
     <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
      <div>
       <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
        <Lock className="w-4 h-4 text-blue-900" />
        <span>同盟最高理事会加密议事厅</span>
       </h3>
       <p className="text-xs text-slate-500 mt-0.5">
        用于多边战备指令传达、军事行动协同与外交通告
       </p>
      </div>
      <button
       type="button"
       onClick={() => setActiveSection('overview')}
       className="text-xs text-blue-900 font-medium hover:underline"
      >
       返回主页概览 →
      </button>
     </div>

     <div className="p-3 bg-slate-50 border border-slate-200 rounded-xs h-72 overflow-y-auto space-y-2 text-xs">
      {(myAlliance.chatMessages || []).length === 0 ? (
       <div className="text-xs text-slate-400 text-center py-16">
        暂无战备议事记录
       </div>
      ) : (
       (myAlliance.chatMessages || []).map((msg) => (
        <div key={msg.id} className="flex items-start gap-2 py-1 border-b border-slate-100 last:border-0">
         <strong className="text-blue-900 font-semibold shrink-0">
          [{msg.senderNationName}]:
         </strong>
         <span className="text-slate-800 flex-1 leading-relaxed">{msg.content}</span>
         <span className="text-[10px] text-slate-400 shrink-0 font-mono">{msg.time}</span>
        </div>
       ))
      )}
     </div>

     <div className="flex items-center gap-2">
      <input
       type="text"
       value={chatInput}
       onChange={(e) => setChatInput(e.target.value)}
       onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
       placeholder="向公约理事会传达指令或协同照会..."
       className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-xs text-xs text-slate-900 focus:outline-none focus:border-blue-900"
      />
      <button
       type="button"
       onClick={handleSendChat}
       className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white font-medium rounded-xs text-xs cursor-pointer shadow-xs"
      >
       发送
      </button>
     </div>
    </section>
   )}

   {/* ─────────────────────────────────────────────────────────────
     6. 底部：公约效力与参谋附注 (Footnote & Rules)
     ───────────────────────────────────────────────────────────── */}
   <footer className="pt-2 border-t border-slate-200 text-slate-500 text-[11px] flex flex-col sm:flex-row sm:items-center justify-between gap-1 font-mono">
    <span>多边防务战略公约体系 · 统帅部最高外交参谋署存档</span>
    <span>保密等级：公约成员国绝密 · 实时数据结算正常</span>
   </footer>

  </div>
 );
};
