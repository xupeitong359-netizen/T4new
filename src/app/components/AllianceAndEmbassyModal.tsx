import React, { useEffect, useState } from 'react';
import {
 Globe,
 Users,
 Shield,
 Send,
 Building,
 Ban,
 Package,
 Plus,
 X,
 Sparkles,
 AlertTriangle,
} from 'lucide-react';
import { Nation, AllianceFaction, LendLeaseOffer } from '../types';
import { strategicStorage } from '../services/strategicGameplayService';
import { getTotalMilitaryFactories } from '../lib/militaryIndustry';
import { getTotalCivilianFactories } from '../lib/economyEngine';
import { AllianceHeader } from './alliance/AllianceHeader';
import { AllianceLobbyView } from './alliance/AllianceLobbyView';
import { AllianceDetailModal } from './alliance/AllianceDetailModal';
import { CreateAllianceWizard } from './alliance/CreateAllianceWizard';
import { AlliancePetitionModal } from './alliance/AlliancePetitionModal';
import { MyAllianceDashboard } from './alliance/MyAllianceDashboard';
import { ExternalDiplomacyTab } from './alliance/ExternalDiplomacyTab';

interface AllianceAndEmbassyModalProps {
 isOpen: boolean;
 onClose: () => void;
 myNation: Nation | null;
 allNations: Nation[];
 onUpdateNation: (updated: Nation) => void;
 onShowToast: (msg: string) => void;
 variant?: 'modal' | 'page';
}

export const AllianceAndEmbassyModal: React.FC<AllianceAndEmbassyModalProps> = ({
 isOpen,
 onClose,
 myNation,
 allNations,
 onUpdateNation,
 onShowToast,
 variant = 'modal',
}) => {
 const [activeTab, setActiveTab] = useState<'lobby' | 'my_alliance' | 'create' | 'petitions' | 'external_diplo'>('lobby');
 const [alliances, setAlliances] = useState<AllianceFaction[]>(strategicStorage.getAlliances());
 const [isFullScreen, setIsFullScreen] = useState<boolean>(false);

 // Inspect Modal State
 const [inspectingAlliance, setInspectingAlliance] = useState<AllianceFaction | null>(null);

 // Petition Modal State
 const [petitionTargetAlliance, setPetitionTargetAlliance] = useState<AllianceFaction | null>(null);

 useEffect(() => {
  if (isOpen) {
   setAlliances(strategicStorage.getAlliances());
  }
 }, [isOpen]);

 // 自动全屏：切换至创建向导时尝试调用原生全屏
 useEffect(() => {
  if (activeTab === 'create') {
   try {
    if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
     document.documentElement.requestFullscreen().catch(() => {});
    }
   } catch (e) {
    // ignore
   }
  }
 }, [activeTab]);

 // 退出全屏处理
 const handleExitFullScreen = () => {
  setIsFullScreen(false);
  try {
   if (document.fullscreenElement && document.exitFullscreen) {
    document.exitFullscreen().catch(() => {});
   }
  } catch (e) {
   // ignore
  }
 };

 const handleToggleFullScreen = () => {
  if (isFullScreen || document.fullscreenElement) {
   handleExitFullScreen();
  } else {
   setIsFullScreen(true);
   try {
    if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
     document.documentElement.requestFullscreen().catch(() => {});
    }
   } catch (e) {
    // ignore
   }
  }
 };

 const isPage = variant === 'page';

 if (!isOpen) return null;

 if (!myNation) {
  if (!isPage) return null;
  return (
   <div className="w-full max-w-3xl mx-auto rounded-xs border border-[#141f32] bg-[#060a14] p-8 sm:p-12 text-center text-slate-100 font-mono shadow-2xl">
    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xs bg-cyan-950 border border-cyan-500/40 text-cyan-400">
     <Globe className="h-6 w-6" />
    </div>
    <h2 className="text-base font-black text-white uppercase tracking-wider">
     国家未确立 · 无法接入国际多边公约网络
    </h2>
    <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-slate-400">
     跨国同盟缔约、租借法案支援与常驻使馆派遣需以主权国家元首身份进行。请先建立国家。
    </p>
    <button
     type="button"
     onClick={onClose}
     className="mt-6 rounded-xs bg-cyan-600 px-5 py-2 text-xs font-black text-slate-950 transition hover:bg-cyan-500 cursor-pointer"
    >
     返回大厅
    </button>
   </div>
  );
 }

 const myAlliance = alliances.find((a) => a.memberNationIds.includes(myNation.id));

 // Handler: Create Alliance Success
 const handleCreateAllianceSuccess = (newAlliance: AllianceFaction) => {
  const updated = [newAlliance, ...alliances];
  setAlliances(updated);
  strategicStorage.saveAlliances(updated);

  const updatedNation: Nation = {
   ...myNation,
   allianceId: newAlliance.id,
  };
  onUpdateNation(updatedNation);

  setActiveTab('my_alliance');
  handleExitFullScreen();
  onShowToast(` 成功创立并昭告多边战略公约【${newAlliance.name}】！`);
 };

 // Handler: Submit Accession Petition
 const handleSubmitPetition = (allianceId: string, memo: string) => {
  const target = alliances.find((a) => a.id === allianceId);
  if (!target) return;

  if ((target.pendingApplications || []).some((p) => p.nationId === myNation.id)) {
   return onShowToast('您已递交入盟照会，请等待盟主委员会审批。');
  }

  const myMilFactories = getTotalMilitaryFactories(myNation);
  const myCivFactories = getTotalCivilianFactories(myNation);

  const updated = alliances.map((a) => {
   if (a.id !== allianceId) return a;
   return {
    ...a,
    pendingApplications: [
     ...(a.pendingApplications || []),
     {
      nationId: myNation.id,
      nationName: myNation.name,
      appliedAt: new Date().toISOString(),
      reason: memo,
      totalFactories: myMilFactories + myCivFactories,
      stability: myNation.stability || 80,
      ownerUsername: myNation.ownerUsername,
      status: 'pending' as const,
     },
    ],
   };
  });

  setAlliances(updated);
  strategicStorage.saveAlliances(updated);
  onShowToast(` 已向【${target.name}】正式递交入盟照会！`);
 };

 // Handler: Withdraw Petition
 const handleWithdrawPetition = (allianceId: string) => {
  const updated = alliances.map((a) => {
   if (a.id !== allianceId) return a;
   return {
    ...a,
    pendingApplications: (a.pendingApplications || []).filter((p) => p.nationId !== myNation.id),
   };
  });
  setAlliances(updated);
  strategicStorage.saveAlliances(updated);
  onShowToast('已撤回入盟外交照会。');
 };

 // Handler: Update My Alliance
 const handleUpdateAlliance = (updatedAlliance: AllianceFaction) => {
  const updated = alliances.map((a) => (a.id === updatedAlliance.id ? updatedAlliance : a));
  setAlliances(updated);
  strategicStorage.saveAlliances(updated);
 };

 // Handler: Leave Alliance
 const handleLeaveAlliance = () => {
  if (!myAlliance) return;
  if (!confirm(`确认签署脱离公约声明，退出【${myAlliance.name}】吗？`)) return;

  const updated = alliances.map((a) => {
   if (a.id !== myAlliance.id) return a;
   return {
    ...a,
    memberNationIds: a.memberNationIds.filter((id) => id !== myNation.id),
    memberNationNames: a.memberNationNames.filter((name) => name !== myNation.name),
    chatMessages: [
     ...a.chatMessages,
     {
      id: 'chat_' + Date.now(),
      senderNationName: '公约最高委员会',
      content: `【${myNation.name}】已签署退出公约备忘录，和平脱离阵营。`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
     },
    ],
   };
  });

  setAlliances(updated);
  strategicStorage.saveAlliances(updated);

  const updatedNation: Nation = {
   ...myNation,
   allianceId: undefined,
  };
  onUpdateNation(updatedNation);

  setActiveTab('lobby');
  onShowToast(`已正式退出【${myAlliance.name}】。`);
 };

 // Handler: Dissolve Alliance
 const handleDissolveAlliance = () => {
  if (!myAlliance || myAlliance.leaderNationId !== myNation.id) return;
  if (!confirm(`【最高警告】解散同盟将永久注销【${myAlliance.name}】公约并移出所有成员国，确认解散吗？`)) return;

  const updated = alliances.filter((a) => a.id !== myAlliance.id);
  setAlliances(updated);
  strategicStorage.saveAlliances(updated);

  const updatedNation: Nation = {
   ...myNation,
   allianceId: undefined,
  };
  onUpdateNation(updatedNation);

  setActiveTab('lobby');
  onShowToast(`同盟【${myAlliance.name}】已正式宣告解散。`);
 };

 // Outgoing petitions by this nation
 const myOutgoingPetitions = alliances
  .map((a) => {
   const pet = (a.pendingApplications || []).find((p) => p.nationId === myNation.id);
   if (!pet) return null;
   return { alliance: a, petition: pet };
  })
  .filter(Boolean) as { alliance: AllianceFaction; petition: any }[];

 // 当处于 'create' 标签页时，独占完整视口全屏，不渲染同盟大厅顶部导航栏，且使用全屏白色调
 if (activeTab === 'create') {
  return (
   <div className="fixed inset-0 z-[9999] w-screen h-screen bg-[#f8fafc] overflow-y-auto animate-fadeIn select-none">
    <CreateAllianceWizard
     myNation={myNation}
     onCreateSuccess={handleCreateAllianceSuccess}
     onCancel={() => {
      handleExitFullScreen();
      setActiveTab('lobby');
     }}
     isFullScreen={true}
     onToggleFullScreen={handleToggleFullScreen}
    />
   </div>
  );
 }

 return (
  <div
   className={
    isPage
     ? 'w-full max-w-7xl mx-auto animate-fadeIn'
     : 'fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn'
   }
  >
   <div
    className={
     isPage
      ? 'w-full bg-[#fbfbf9] border border-slate-200/90 rounded-xs shadow-xs overflow-hidden flex flex-col min-h-[calc(100vh-8.5rem)] text-slate-800'
      : 'w-full max-w-5xl bg-[#fbfbf9] border border-slate-200/90 rounded-xs shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-slate-800'
    }
   >
    {/* Universal Tactical Header */}
    <AllianceHeader
     activeTab={activeTab}
     onSelectTab={(tab) => setActiveTab(tab)}
     myNation={myNation}
     myAlliance={myAlliance}
     alliances={alliances}
     allNations={allNations}
     onClose={onClose}
     isPage={isPage}
    />

    {/* View Switcher Container */}
    <div className="p-4 sm:p-5 overflow-y-auto flex-1 bg-[#fbfbf9] flex flex-col">
     {activeTab === 'lobby' && (
      <AllianceLobbyView
       alliances={alliances}
       allNations={allNations}
       myNation={myNation}
       onInspectAlliance={(a) => setInspectingAlliance(a)}
       onRequestJoinAlliance={(a) => setPetitionTargetAlliance(a)}
       onCreateAllianceClick={() => setActiveTab('create')}
      />
     )}

     {activeTab === 'my_alliance' && myAlliance && (
      <MyAllianceDashboard
       myAlliance={myAlliance}
       myNation={myNation}
       allNations={allNations}
       onUpdateAlliance={handleUpdateAlliance}
       onLeaveAlliance={handleLeaveAlliance}
       onDissolveAlliance={handleDissolveAlliance}
       onShowToast={onShowToast}
      />
     )}

     {activeTab === 'petitions' && (
      <div className="space-y-4 max-w-3xl mx-auto w-full text-slate-800">
       <div className="text-xs font-bold text-slate-900 flex items-center justify-between pb-2 border-b border-slate-200">
        <span className="text-sm">本国发出的入盟外交照会 ({myOutgoingPetitions.length})</span>
        <span className="text-xs text-slate-500 font-normal">待盟主委员会审批后正式生效</span>
       </div>

       {myOutgoingPetitions.length === 0 ? (
        <div className="p-12 text-center text-xs text-slate-500 bg-white border border-slate-200/90 rounded-xs space-y-3 shadow-2xs">
         <div className="text-xs font-medium text-slate-700">暂无进行中的入盟外交照会</div>
         <button
          type="button"
          onClick={() => setActiveTab('lobby')}
          className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xs text-xs cursor-pointer inline-flex items-center gap-1.5 transition-colors shadow-2xs"
         >
          前往联盟目录审阅公约
         </button>
        </div>
       ) : (
        myOutgoingPetitions.map(({ alliance, petition }) => (
         <div
          key={alliance.id}
          className="p-4 bg-white border border-slate-200/90 rounded-xs space-y-2.5 text-xs shadow-2xs"
         >
          <div className="flex items-center justify-between">
           <div className="flex items-center gap-2.5">
            <div
             className="w-7 h-7 rounded-xs border border-slate-700/60 flex items-center justify-center font-bold text-xs text-white shadow-2xs shrink-0 select-none"
             style={{ backgroundColor: alliance.bannerColor || '#1e3a8a' }}
            >
             <span className="font-mono text-[10px]">{alliance.tag}</span>
            </div>
            <div>
             <div className="font-bold text-slate-900 text-xs">{alliance.name}</div>
             <div className="text-[11px] text-slate-500 font-mono">盟主国：{alliance.leaderNationName}</div>
            </div>
           </div>
           <span className="px-2 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 rounded-xs text-[10px] font-medium">
            等待盟主国审批
           </span>
          </div>

          <p className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xs text-slate-700 text-xs leading-relaxed">
           “{petition.reason || '谨向公约委员会申请加入同盟，共谋和平防务发展。'}”
          </p>

          <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 text-[11px] text-slate-500 font-mono">
           <span>递交时间：{new Date(petition.appliedAt).toLocaleString()}</span>
           <button
            type="button"
            onClick={() => handleWithdrawPetition(alliance.id)}
            className="px-2.5 py-1 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 rounded-xs text-xs font-medium cursor-pointer transition-colors"
           >
            撤回申请
           </button>
          </div>
         </div>
        ))
       )}
      </div>
     )}

     {activeTab === 'external_diplo' && (
      <ExternalDiplomacyTab
       myNation={myNation}
       allNations={allNations}
       onUpdateNation={onUpdateNation}
       onShowToast={onShowToast}
      />
     )}
    </div>
   </div>

   {/* Alliance Detail Dossier Modal */}
   <AllianceDetailModal
    isOpen={!!inspectingAlliance}
    onClose={() => setInspectingAlliance(null)}
    alliance={inspectingAlliance}
    allNations={allNations}
    myNation={myNation}
    onRequestJoin={(a) => {
     setInspectingAlliance(null);
     setPetitionTargetAlliance(a);
    }}
    onOpenMyAllianceCommand={() => {
     setInspectingAlliance(null);
     setActiveTab('my_alliance');
    }}
   />

   {/* Diplomatic Petition Accession Modal */}
   <AlliancePetitionModal
    isOpen={!!petitionTargetAlliance}
    onClose={() => setPetitionTargetAlliance(null)}
    targetAlliance={petitionTargetAlliance}
    myNation={myNation}
    onSubmitPetition={handleSubmitPetition}
   />
  </div>
 );
};
