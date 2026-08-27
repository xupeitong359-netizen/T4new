import { TikTokIcon } from './components/TikTokIcon';
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
 Crown,
 Search,
 Filter,
 SlidersHorizontal,
 RotateCcw,
 Globe,
 Compass,
 Swords,
 HeartHandshake,
 ShieldCheck,
 Plus,
 Sparkles,
 RefreshCw,
 Landmark,
 Scale,
 Languages,
 Coins,
 MapPin,
 BookOpen,
 Edit3,
 Trash2,
 User,
 ShieldAlert,
 AlertTriangle,
 Info,
} from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Nation, DiplomacyType, ConstructionQueueItem } from './types';
import { api } from './services/api';
import {
 STRATEGIC_BUILDINGS,
 StrategicBuildingType,
 calculateBuildingUpgradeCost,
 getMaxLevelForBuilding,
 getInfrastructureBonus,
 getTotalBuildingsInProvince,
 MAX_BUILDINGS_PER_PROVINCE,
} from './lib/constructionRules';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { MobileTabBar } from './components/MobileTabBar';
import { NationCard } from './components/NationCard';
import { NationModal } from './components/NationModal';
import { NationFilterDrawer } from './components/NationFilterDrawer';
import { NationSearchModal } from './components/NationSearchModal';
import { CreateNationModal } from './components/CreateNationModal';
import { EditNationModal } from './components/EditNationModal';
import { DiplomacyModal } from './components/DiplomacyModal';
import { WorldMap } from './components/WorldMap';
import { AdminPanel } from './components/AdminPanel';
import { AuthModal } from './components/AuthModal';
import { ConstructionModal } from './components/ConstructionModal';
import { ConfirmDialog } from './components/ConfirmDialog';
import { MilitaryIndustryDashboard } from './components/MilitaryIndustryDashboard';
import { MilitaryCostRuleTable } from './components/MilitaryCostRuleTable';
import { DisputeAndWarModal } from './components/DisputeAndWarModal';
import { DecreeAndCabinetModal } from './components/DecreeAndCabinetModal';
import { AllianceAndEmbassyModal } from './components/AllianceAndEmbassyModal';
import { ChronicleAndMedalsModal } from './components/ChronicleAndMedalsModal';
import { ResearchPage } from './components/ResearchPage';
import { ArmyPage } from './components/ArmyPage';
import { NationalEconomyDashboard } from './components/NationalEconomyDashboard';
import { BugFeedbackModal } from './components/BugFeedbackModal';
import { renderEmblemIcon, MilitaryFactoryPlantIcon, CivilianFactoryPlantIcon } from './lib/icons';
import { hydrateStrategicStorage } from './services/strategicGameplayService';
import { useEconomyTicker } from './lib/useEconomyTicker';
import { settleMilitaryProduction, getTotalMilitaryFactories } from './lib/militaryIndustry';
import { getTotalCivilianFactories } from './lib/economyEngine';
import { CommandSidebar } from './components/CommandSidebar';
import { DemographicsView } from './components/DemographicsView';
import { PoliticsAndGovernanceView } from './components/PoliticsAndGovernanceView';
import { StrategicResourcesView } from './components/StrategicResourcesView';
import { InternationalEmbargoView } from './components/InternationalEmbargoView';
import { WarCommandCenter } from './components/WarCommandCenter';
import { NationalFocusTreePage } from './components/NationalFocusTreePage';

export type TabView =
 | 'lobby'
 | 'my_nation'
 | 'national_focus'
 | 'world_map'
 | 'admin'
 | 'research'
 | 'alliances'
 | 'army'
 | 'wars'
 | 'demographics'
 | 'politics'
 | 'resources'
 | 'embargo'
 | 'governance';

const MAX_CIV_FACTORIES_PER_QUEUE = 15;

function allocateConstructionFactories(queue: ConstructionQueueItem[], totalCivFactories: number) {
 let remaining = Math.max(0, totalCivFactories);
 // Completed projects are terminal records: their province upgrade has already been applied,
 // so they must not occupy a queue card or consume an allocation slot.
 return queue.filter((item) => item.status !== 'completed').map((item) => {
  const assigned = Math.min(MAX_CIV_FACTORIES_PER_QUEUE, remaining);
  remaining -= assigned;
  return {
   ...item,
   assignedFactories: assigned,
   allocatedCivFactories: assigned,
   status: assigned > 0 ? 'in_progress' as const : 'paused' as const,
  };
 });
}

function getNationCivilianFactories(nation: Nation | null | undefined): number {
 return getTotalCivilianFactories(nation);
}

function getNationMilitaryFactories(nation: Nation | null | undefined): number {
 return getTotalMilitaryFactories(nation);
}

function LiveCurrencyBalance({ nation }: { nation: Nation }) {
 const stats = useEconomyTicker(nation, true);
 const value = stats.currentTreasury.toLocaleString('zh-CN', {
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
 });

 return (
  <span className="font-mono text-[11px] font-bold tabular-nums text-emerald-700 group-hover:text-emerald-800">
   {stats.currencySymbol}{value}
  </span>
 );
}

function MainApp() {
 const { user, myNation, isAuthenticated, isAdmin, setMyNation, unreadNotifsCount, quickGuestLogin } = useAuth();

 // Navigation Tab
 const [activeTab, setActiveTab] = useState<TabView>('lobby');
 const [myNationSubTab, setMyNationSubTab] = useState<'overview' | 'focus' | 'economy' | 'military'>('overview');
 const [targetNationToFocus, setTargetNationToFocus] = useState<Nation | null>(null);

 // Nations Data
 const [nations, setNations] = useState<Nation[]>([]);
 const [isLoadingNations, setIsLoadingNations] = useState(true);

 // Search & Filter
 const [searchTerm, setSearchTerm] = useState('');
 const [selectedRegime, setSelectedRegime] = useState('all');
 const [selectedIdeology, setSelectedIdeology] = useState('all');
 const [searchModalOpen, setSearchModalOpen] = useState(false);
 const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

 // Modals state
 const [authModalOpen, setAuthModalOpen] = useState(false);
 const [bugFeedbackOpen, setBugFeedbackOpen] = useState(false);
 const [authDefaultMode, setAuthDefaultMode] = useState<'login' | 'register'>('login');
 const [createNationModalOpen, setCreateNationModalOpen] = useState(false);
 const [isMapSelectionMode, setIsMapSelectionMode] = useState(false);
 const [editNationModalOpen, setEditNationModalOpen] = useState(false);
 const [nationToEdit, setNationToEdit] = useState<Nation | null>(null);

 const [detailModalOpen, setDetailModalOpen] = useState(false);
 const [selectedNationForDetail, setSelectedNationForDetail] = useState<Nation | null>(null);

 const [diplomacyModalOpen, setDiplomacyModalOpen] = useState(false);
 const [targetNationForDiplomacy, setTargetNationForDiplomacy] = useState<Nation | null>(null);
 const [initialDipType, setInitialDipType] = useState<DiplomacyType>('peace');
 const [constructionModalOpen, setConstructionModalOpen] = useState(false);
 const [constructionPlacementBuilding, setConstructionPlacementBuilding] = useState<StrategicBuildingType | null>(null);

 // Strategic 4 Modules State
 const [disputeModalOpen, setDisputeModalOpen] = useState(false);
 const [disputeTargetNation, setDisputeTargetNation] = useState<Nation | null>(null);
 const [disputeTargetProvince, setDisputeTargetProvince] = useState<string | undefined>(undefined);
 const [decreeModalOpen, setDecreeModalOpen] = useState(false);
 const [chronicleModalOpen, setChronicleModalOpen] = useState(false);

 const handleOpenDispute = (target?: Nation, provinceName?: string) => {
  setDisputeTargetNation(target || null);
  setDisputeTargetProvince(provinceName || undefined);
  setDisputeModalOpen(true);
 };

 const handleOpenAlliancePage = () => {
  setActiveTab('alliances');
 };

 // Global Notification / Toast alert
 const [toastMessage, setToastMessage] = useState<string | null>(null);

 // Dangerous Confirmation Dialog
 const [confirmDialog, setConfirmDialog] = useState<{
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  isDangerous?: boolean;
  onConfirm: () => void;
 }>({
  isOpen: false,
  title: '',
  message: '',
  confirmText: '确定',
  isDangerous: false,
  onConfirm: () => {},
 });

 const handleClearTargetNationFocus = useCallback(() => {
  setTargetNationToFocus(null);
 }, []);

 const handleMapModeChange = useCallback((isSelecting: boolean) => {
  setIsMapSelectionMode(isSelecting);
 }, []);

 const showToast = (msg: string) => {
  setToastMessage(msg);
  setTimeout(() => setToastMessage(null), 4000);
 };

 const myNationRef = useRef<Nation | null>(myNation);
 useEffect(() => {
  myNationRef.current = myNation;
 }, [myNation]);

 // Nation modules share one persistence path, so strategic state is retained remotely.
 const persistNationUpdate = useCallback((updated: Nation) => {
  setMyNation(updated);
  setNations((previous) => previous.map((nation) => (nation.id === updated.id ? updated : nation)));
  void api.nations.update(updated.id, updated).then((result) => {
   setMyNation(result.nation);
   setNations((previous) => previous.map((nation) => (nation.id === result.nation.id ? result.nation : nation)));
  }).catch((error) => console.warn('Nation persistence failed:', error));
 }, [setMyNation]);

 const userId = user?.id;
 const userRef = useRef(user);
 userRef.current = user;

 const fetchNations = useCallback(async (options?: { localOnly?: boolean; showLoading?: boolean }) => {
  const showLoading = options?.showLoading !== false;
  try {
   if (showLoading) setIsLoadingNations(true);
   const res = await api.nations.list({
    search: searchTerm || undefined,
    regime: selectedRegime !== 'all' ? selectedRegime : undefined,
    ideology: selectedIdeology !== 'all' ? selectedIdeology : undefined,
   }, { localOnly: options?.localOnly });
   const nationList = Array.isArray(res?.nations) ? res.nations : [];
   setNations(nationList);

   // Also update myNation in context if it changed
   const currentUser = userRef.current;
   if (currentUser) {
    const foundMine = nationList.find((n) => n.ownerId === currentUser.id);
    setMyNation((prev) => {
     if (!foundMine) return null;
     if (prev && prev.id === foundMine.id && prev.updatedAt === foundMine.updatedAt) {
      return prev;
     }
     return foundMine;
    });
   }
  } catch (err) {
   console.error('Failed to load nations:', err);
  } finally {
   if (showLoading) setIsLoadingNations(false);
  }
 }, [searchTerm, selectedRegime, selectedIdeology, setMyNation]);

 useEffect(() => {
  const handleNationUpdated = (e: any) => {
   const updatedNation = e.detail?.nation;
   if (updatedNation) {
    setNations((prev) => prev.map((n) => (n.id === updatedNation.id ? updatedNation : n)));
    setMyNation((prev) => {
     const currentUserId = userRef.current?.id;
     if (prev?.id === updatedNation.id || (currentUserId && currentUserId === updatedNation.ownerId)) {
      return updatedNation;
     }
     return prev;
    });
   }
  };
  window.addEventListener('nation-updated', handleNationUpdated);
  return () => window.removeEventListener('nation-updated', handleNationUpdated);
 }, [setMyNation]);

 useEffect(() => {
  // Render the local archive first. A remote refresh then replaces it when
  // available, without trapping the lobby behind a full-screen loader.
  void fetchNations({ localOnly: true }).finally(() => {
   void fetchNations({ showLoading: false });
  });

  // Strategic data is supplementary and must never block the lobby.
  void hydrateStrategicStorage().catch((error) => {
   console.warn('Strategic archive sync deferred:', error);
  });
 }, [fetchNations]);

 // Handler: Open Diplomacy modal
 const handleOpenDiplomacy = (nation: Nation, defaultType: DiplomacyType = 'peace') => {
  if (!isAuthenticated) {
   setAuthDefaultMode('login');
   setAuthModalOpen(true);
   return;
  }
  if (!myNation) {
   showToast(' 您尚未宣告建国，请先创建属于您的国家再进行外交派遣！');
   setActiveTab('my_nation');
   return;
  }
  setTargetNationForDiplomacy(nation);
  setInitialDipType(defaultType);
  setDiplomacyModalOpen(true);
 };

 // Handler: View Nation detail
 const handleViewNation = (nation: Nation) => {
  setSelectedNationForDetail(nation);
  setDetailModalOpen(true);
 };

 // Handler: View Territory
 const handleViewTerritory = (nation: Nation) => {
  setTargetNationToFocus(nation);
  setActiveTab('world_map');
 };

 // Handler: Edit Nation
 const handleEditNation = (nation: Nation) => {
  if (!isAuthenticated) {
   setAuthModalOpen(true);
   return;
  }
  setNationToEdit(nation);
  setEditNationModalOpen(true);
 };

 // Handler: Delete Nation with Danger Confirmation
 const handleDeleteNation = (nation: Nation) => {
  if (!isAuthenticated) {
   setAuthModalOpen(true);
   return;
  }

  setConfirmDialog({
   isOpen: true,
   title: `确认解散国家【${nation.name}】？`,
   message: `解散国家为重大毁灭性决策！执行后，该国家将从世界地缘大厅彻底除名，所有签署的条约与交战状态将立即失效注销。`,
   confirmText: '确认销毁并解散',
   isDangerous: true,
   onConfirm: async () => {
    try {
     const res = await api.nations.delete(nation.id);
     showToast(res.message);
     setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
     if (myNation?.id === nation.id) {
      setMyNation(null);
     }
     fetchNations();
    } catch (err: any) {
     alert(err.message || '解散国家失败');
    }
   },
  });
 };

 // Handler: Terminate Treaty with Confirmation
 const handleTerminateTreaty = (treatyId: string, withNationName: string) => {
  setConfirmDialog({
   isOpen: true,
   title: `废除与【${withNationName}】的外交条约`,
   message: `确定要单方面废除该项条约吗？对方国家将收到条约废除通报。`,
   confirmText: '确认废除',
   isDangerous: true,
   onConfirm: async () => {
    try {
     const res = await api.diplomacy.terminate(treatyId);
     showToast(res.message);
     setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
     fetchNations();
    } catch (err: any) {
     alert(err.message || '废除条约失败');
    }
   },
  });
 };

 // Handler: Add Building to Province Construction Queue from World Map click
 const handleBuildInProvince = async (
  provinceId: string | number,
  provinceName: string,
  buildingType: StrategicBuildingType
 ) => {
  if (!myNation) {
   showToast(' 您尚未宣告建国，无法建造省份战略工程！');
   return;
  }

  const provIndex = (myNation.provinces || []).findIndex(
   (p) => String(p.id) === String(provinceId) || String(p.name) === String(provinceName)
  );

  if (provIndex === -1) {
   showToast(` 省份【${provinceName}】不属于您的帝国主权领土！`);
   return;
  }

  const prov = myNation.provinces![provIndex];
  const detailed = prov.detailedBuildings || {
   infrastructure: 1,
   civilian_factory: typeof prov.civilianFactories === 'number' ? prov.civilianFactories : 1,
   military_factory: typeof prov.militaryFactories === 'number' ? prov.militaryFactories : 1,
  };

  const totalBuildings = getTotalBuildingsInProvince(detailed);
  if (totalBuildings >= MAX_BUILDINGS_PER_PROVINCE) {
   showToast(` 省份【${prov.name}】建筑总数已达 30 座上限，无法继续增建！`);
   return;
  }

  const currentLevel = (detailed as any)[buildingType] || 0;
  const maxLevel = getMaxLevelForBuilding(buildingType, myNation.radarTech || 'decimeter');
  if (typeof maxLevel === 'number' && currentLevel >= maxLevel) {
   showToast(
    ` 省份【${prov.name}】的【${STRATEGIC_BUILDINGS[buildingType].name}】已达到最高等级上限 (Lv.${maxLevel})！`
   );
   return;
  }

  const targetLevel = currentLevel + 1;
  const upgradeCost = calculateBuildingUpgradeCost(buildingType, currentLevel);
  const buildingInfo = STRATEGIC_BUILDINGS[buildingType];

  const newItem: ConstructionQueueItem = {
   id: 'cq-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
   buildingType,
   provinceId: prov.id,
   provinceName: prov.name,
   targetLevel,
   cost: upgradeCost,
   totalCost: upgradeCost,
   progress: 0,
   investedCapacity: 0,
   allocatedCivFactories: 0,
   assignedFactories: 0,
   speedBonus: getInfrastructureBonus(detailed.infrastructure || 1),
   createdAt: new Date().toISOString(),
   status: 'in_progress',
  };

  const updatedQueue = allocateConstructionFactories(
   [...(myNation.constructionQueue || []), newItem],
   getNationCivilianFactories(myNation)
  );

  try {
   const res = await api.nations.update(myNation.id, {
    constructionQueue: updatedQueue,
   });
   setMyNation(res.nation);
   setNations((prev) => prev.map((n) => (n.id === res.nation.id ? res.nation : n)));
   showToast(
    ` 已将【${prov.name} - ${buildingInfo.name} (Lv.${targetLevel})】加入建造队列！`
   );
  } catch (err: any) {
   showToast(` 下达建造指令失败: ${err.message || '网络错误'}`);
  }
 };

 // Handler: Cancel construction queue item
 const handleCancelConstruction = async (queueId: string) => {
  if (!myNation) return;
  const updatedQueue = (myNation.constructionQueue || []).filter((q) => q.id !== queueId);
  try {
   const res = await api.nations.update(myNation.id, {
    constructionQueue: updatedQueue,
   });
   setMyNation(res.nation);
   setNations((prev) => prev.map((n) => (n.id === res.nation.id ? res.nation : n)));
   showToast(' 已取消该项工程并释放分配的民用工厂产能');
  } catch (err: any) {
   showToast(` 取消工程失败: ${err.message || '网络错误'}`);
  }
 };

 // Handler: Reorder construction queue priority
 const handleReorderConstructionQueue = async (fromIndex: number, toIndex: number) => {
  if (!myNation) return;
  const queue = [...(myNation.constructionQueue || [])];
  if (fromIndex < 0 || fromIndex >= queue.length || toIndex < 0 || toIndex >= queue.length) return;
  const [moved] = queue.splice(fromIndex, 1);
  queue.splice(toIndex, 0, moved);
  const redistributedQueue = allocateConstructionFactories(queue, getNationCivilianFactories(myNation));
  try {
   const res = await api.nations.update(myNation.id, {
    constructionQueue: redistributedQueue,
   });
   setMyNation(res.nation);
   setNations((prev) => prev.map((n) => (n.id === res.nation.id ? res.nation : n)));
  } catch (err: any) {
   showToast(` 调整优先级失败: ${err.message || '网络错误'}`);
  }
 };

 // Advance queued projects once per minute. Work is based on the factories
 // actually allocated by priority, never the per-line maximum of 15.
 useEffect(() => {
  const advance = () => {
   const currentNation = myNationRef.current;
   if (!currentNation) return;
   const now = Date.now();
   const totalCiv = getNationCivilianFactories(currentNation);
   const originalQueue = currentNation.constructionQueue || [];
   const allocated = allocateConstructionFactories(originalQueue, totalCiv);
   let changed = allocated.length !== originalQueue.length || allocated.some((item, index) => {
    const previous = originalQueue[index];
    return item.assignedFactories !== previous?.assignedFactories ||
     item.allocatedCivFactories !== previous?.allocatedCivFactories ||
     item.status !== previous?.status;
   });
   let provinces = currentNation.provinces || [];

   const queue = allocated.map((item) => {
    if (item.status !== 'in_progress' || !item.assignedFactories) return item;
    const previousAt = Date.parse(item.lastCalculatedAt || item.createdAt);
    const elapsed = Math.max(0, now - (Number.isFinite(previousAt) ? previousAt : now));
    if (elapsed < 10_000) return item;
    const gained = (item.assignedFactories * 2000 * (1 + (item.speedBonus || 0)) * elapsed) / 86_400_000;
    const totalCost = item.totalCost || item.cost || 1;
    const progress = Math.min(totalCost, (item.progress || item.investedCapacity || 0) + gained);
    const completed = progress >= totalCost;
    changed = true;

    if (completed) {
     provinces = provinces.map((province) => {
      if (String(province.id) !== String(item.provinceId)) return province;
      const nextDetailed = { ...(province.detailedBuildings || {}), [item.buildingType]: item.targetLevel };
      const nextCiv = item.buildingType === 'civilian_factory' ? item.targetLevel : (nextDetailed.civilian_factory ?? province.civilianFactories ?? 1);
      const nextMil = item.buildingType === 'military_factory' ? item.targetLevel : (nextDetailed.military_factory ?? province.militaryFactories ?? 1);
      return {
       ...province,
       detailedBuildings: nextDetailed,
       civilianFactories: nextCiv,
       militaryFactories: nextMil,
      };
     });
    }
    return {
     ...item,
     progress,
     investedCapacity: progress,
     status: completed ? 'completed' as const : 'in_progress' as const,
     assignedFactories: completed ? 0 : item.assignedFactories,
     allocatedCivFactories: completed ? 0 : item.allocatedCivFactories,
     lastCalculatedAt: new Date(now).toISOString(),
    };
   });

   // 实时结算军工厂生产产出，避免军工厂装备不增加
   let nextMilitaryIndustry = currentNation.militaryIndustry;
   const { updatedStockpiles, lastUpdated, hasProduced } = settleMilitaryProduction(currentNation, now);
   if (hasProduced) {
    changed = true;
    nextMilitaryIndustry = {
     ...(currentNation.militaryIndustry || { productionLines: [], customDesigns: [], stockpiles: {} }),
     stockpiles: updatedStockpiles,
     lastUpdated,
    };
   }

   if (changed) {
    persistNationUpdate({
     ...currentNation,
     provinces,
     constructionQueue: allocateConstructionFactories(queue, totalCiv),
     militaryIndustry: nextMilitaryIndustry,
    });
   }
  };

  const timer = window.setInterval(() => {
   advance();
   api.processCombatTicks();
  }, 60_000);
  return () => window.clearInterval(timer);
 }, [persistNationUpdate]);

 // Listen for peaceful expansion events from WorldMap
 useEffect(() => {
  const handleExpand = async (e: any) => {
   if (!myNation) return;
   const prov = e.detail.province;
   const updatedProvinces = [...(myNation.provinces || []), prov];
   try {
    const res = await api.nations.update(myNation.id, { provinces: updatedProvinces });
    setMyNation(res.nation);
    setNations((prev) => prev.map((n) => (n.id === res.nation.id ? res.nation : n)));
    showToast(` 成功扩张至【${prov.name}】！`);
   } catch (err: any) {
    showToast(` 扩张失败: ${err.message}`);
   }
  };
  window.addEventListener('map-peaceful-expand', handleExpand);
  return () => window.removeEventListener('map-peaceful-expand', handleExpand);
 }, [myNation]);

 // Global Tactical Hotkeys Listener (F1 Map, F2 Economy, F3 Research, F4 Construction, Space Pause/Run)
 const [isSimulationPaused, setIsSimulationPaused] = useState(false);

 useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
   // Ignore if active element is an editable field
   const activeTag = document.activeElement?.tagName.toLowerCase();
   const isEditable =
    activeTag === 'input' ||
    activeTag === 'textarea' ||
    (document.activeElement as HTMLElement)?.isContentEditable;

   if (isEditable) return;

   if (e.key === 'F1') {
    e.preventDefault();
    setActiveTab('world_map');
    showToast(' 战术快捷键 [F1]：已切换至宏观世界地图');
   } else if (e.key === 'F2') {
    e.preventDefault();
    setActiveTab('my_nation');
    setMyNationSubTab('economy');
    showToast(' 战术快捷键 [F2]：已切换至宏观经济内政');
   } else if (e.key === 'F3') {
    e.preventDefault();
    setActiveTab('research');
    showToast(' 战术快捷键 [F3]：已切换至科研科技树');
   } else if (e.key === 'F4') {
    e.preventDefault();
    setConstructionModalOpen((prev) => !prev);
    showToast(' 战术快捷键 [F4]：已唤出军工建造工程部');
   } else if (e.code === 'Space' && !e.repeat) {
    // Space to toggle simulation pause / tick
    e.preventDefault();
    setIsSimulationPaused((prev) => {
     const next = !prev;
     showToast(next ? '⏸ 战局推演：已暂停实时时间流逝' : '▶ 战局推演：恢复全域战略时间推演');
     return next;
    });
   }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
 }, []);

 // Compute stats
 const totalNations = nations.length;
 const activeWarsCount = nations.reduce((acc, n) => acc + (n.activeWars?.length || 0), 0) / 2;
 const activeTreatiesCount = nations.reduce((acc, n) => acc + (n.activeTreaties?.length || 0), 0) / 2;
 // A war is stored by both participants. Collapse those mirrored records into one war-room entry.
 const currentWars = useMemo(() => {
  const seen = new Set<string>();
  return nations.flatMap((nation) => (nation.activeWars || []).flatMap((war) => {
   const pairKey = [nation.id, war.withNationId].sort().join(':');
   if (seen.has(pairKey)) return [];
   seen.add(pairKey);
   return [{ ...war, nation, opponent: nations.find((item) => item.id === war.withNationId) || null }];
  }));
 }, [nations]);

 return (
  <div className="min-h-screen bg-slate-50 text-slate-900 flex font-sans selection:bg-indigo-100 selection:text-indigo-900">
   {/* Command Navigation Sidebar for Desktop */}
   <CommandSidebar
    activeTab={activeTab}
    setActiveTab={setActiveTab}
    activeWarsCount={activeWarsCount}
    unreadNotifsCount={unreadNotifsCount}
   />

   <div className={`flex-1 flex flex-col min-w-0 relative ${activeTab === 'world_map' || activeTab === 'research' || activeTab === 'national_focus' ? 'h-screen overflow-hidden pb-0' : 'pb-20 md:pb-0 h-screen overflow-y-auto'}`}>
    {/* Navigation Header for Non-Map, Non-Research, Non-Focus Tabs */}
    <AnimatePresence>
     {activeTab !== 'world_map' && activeTab !== 'research' && activeTab !== 'national_focus' && (
      <motion.div
       key="top-navbar-wrapper"
       initial={{ y: -80, opacity: 0 }}
       animate={{ y: 0, opacity: 1 }}
       exit={{
        y: -90,
        opacity: 0,
        transition: {
         duration: 0.22,
         ease: [0.32, 0, 0.67, 0],
        },
       }}
       transition={{
        duration: 0.3,
        ease: [0.16, 1, 0.3, 1],
       }}
       className="sticky top-0 z-40 w-full"
      >
       <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAuth={(mode) => {
         setAuthDefaultMode(mode || 'login');
         setAuthModalOpen(true);
        }}
        onOpenBugFeedback={() => setBugFeedbackOpen(true)}
        onOpenCreateNation={() => {
         if (!isAuthenticated) {
          setAuthModalOpen(true);
         } else {
          setCreateNationModalOpen(true);
         }
        }}
        onOpenConstruction={() => setConstructionModalOpen(true)}
        onRefreshNations={fetchNations}
       />
      </motion.div>
     )}
    </AnimatePresence>

    {/* Global Toast */}
    {toastMessage && (
     <div className="fixed top-4 right-4 z-50 px-3.5 py-2 bg-slate-900/95 text-slate-100 border border-slate-700/80 shadow-2xl backdrop-blur-md rounded-xl text-xs font-mono flex items-center gap-2 max-w-md animate-fadeIn">
      <Info className="w-4 h-4 text-amber-400 flex-shrink-0" />
      <span className="leading-snug">{toastMessage}</span>
     </div>
    )}

   {/* Main Container */}
   <main className={`flex-1 w-full flex flex-col ${activeTab === 'world_map' || activeTab === 'research' || activeTab === 'national_focus' ? 'p-0 h-full overflow-hidden relative' : 'py-2 sm:py-4'}`}>
    {/* VIEW 1: LOBBY (国家页面) */}
    {activeTab === 'lobby' && (
     <div className="flex-1 flex flex-col animate-fadeIn">
      {/* Top Header Row with Title and Independent Search/Filter Buttons on the Same Line */}
      <div className="px-2 sm:px-4 mb-3 sm:mb-4 flex items-center justify-between gap-3">
       <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200/60 text-indigo-700 flex items-center justify-center flex-shrink-0">
         <Crown className="w-4 h-4" />
        </div>
        <div className="min-w-0">
         <div className="flex items-baseline gap-2.5">
          <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight whitespace-nowrap">国家</h1>
          <span className="text-xs text-slate-500 font-medium whitespace-nowrap">
           {totalNations} 个国家
          </span>
         </div>
        </div>
       </div>

       {/* Right Action Icons: Reset, Search (⌕), Filter (☷ / Sliders) */}
       <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
        {(searchTerm.trim() || selectedRegime !== 'all' || selectedIdeology !== 'all') && (
         <button
          type="button"
          onClick={() => {
           setSearchTerm('');
           setSelectedRegime('all');
           setSelectedIdeology('all');
          }}
          className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-700 px-2 py-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          title="重置全部筛选与搜索"
         >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden md:inline">重置</span>
         </button>
        )}

        {/* 1. Independent Search Button (⌕ / Search icon) */}
        <button
         id="lobby-search-trigger"
         type="button"
         onClick={() => setSearchModalOpen(true)}
         className={`relative w-8 h-8 rounded-lg border transition-all flex items-center justify-center cursor-pointer ${
          searchTerm.trim()
           ? 'bg-indigo-50 border-indigo-200 text-indigo-600 shadow-2xs'
           : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600 shadow-xs hover:text-slate-900'
         }`}
         title={searchTerm.trim() ? `当前搜索: "${searchTerm}"` : '搜索国家'}
         aria-label="搜索国家"
        >
         <Search className="w-4 h-4" />
         {searchTerm.trim() && (
          <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
           <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600 ring-2 ring-white" />
          </span>
         )}
        </button>

        {/* 2. Independent Filter Button (☷ / Sliders icon) */}
        <button
         id="lobby-filter-drawer-trigger"
         type="button"
         onClick={() => setFilterDrawerOpen(true)}
         className={`relative w-8 h-8 rounded-lg border transition-all flex items-center justify-center cursor-pointer ${
          selectedRegime !== 'all' || selectedIdeology !== 'all'
           ? 'bg-indigo-50 border-indigo-200 text-indigo-600 shadow-2xs'
           : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600 shadow-xs hover:text-slate-900'
         }`}
         title="政体与意识形态筛选"
         aria-label="政体与意识形态筛选"
        >
         <SlidersHorizontal className="w-4 h-4" />
         {(selectedRegime !== 'all' || selectedIdeology !== 'all') && (
          <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
           <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600 ring-2 ring-white" />
          </span>
         )}
        </button>
       </div>
      </div>

      {/* Nations Grid */}
      {isLoadingNations && nations.length === 0 ? (
       <div className="p-16 text-center">
        <span className="w-8 h-8 border-3 border-indigo-100 border-t-indigo-600 rounded-full animate-spin inline-block mb-3" />
        <p className="text-sm text-slate-500">正在召集万国国牒档案...</p>
       </div>
      ) : nations.length === 0 ? (
       <div className="p-16 text-center bg-white border border-slate-200 rounded-3xl shadow-sm">
        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
         <Crown className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">未检索到符合条件的宣告国家</h3>
        <p className="text-sm text-slate-500 mt-1 mb-6">您可以清除搜索词或亲自宣告创立第一个崭新帝国！</p>
        <div className="flex flex-wrap items-center justify-center gap-3">
         <button
          type="button"
          onClick={() => {
           if (!isAuthenticated) setAuthModalOpen(true);
           else setCreateNationModalOpen(true);
          }}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm transition inline-flex items-center gap-1.5 cursor-pointer"
         >
          <Plus className="w-4 h-4" /> 宣告建国
         </button>
        </div>
       </div>
      ) : (
       <div className="bg-white border-y sm:border border-slate-200 sm:rounded-3xl shadow-sm overflow-hidden flex-1 sm:mx-4 mb-4">
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
         {nations.map((nation) => (
          <div key={nation.id} className="border-b border-r border-slate-100 h-full">
           <NationCard
            nation={nation}
            onViewDetails={handleViewNation}
            onViewTerritory={handleViewTerritory}
            onOpenDiplomacy={handleOpenDiplomacy}
            onEdit={handleEditNation}
            onDelete={handleDeleteNation}
           />
          </div>
         ))}
        </div>
       </div>
      )}
     </div>
    )}

    {/* VIEW 2: MY NATION (我的国家) */}
    {activeTab === 'my_nation' && (
     <div className="w-full max-w-2xl mx-auto space-y-4 animate-fadeIn">
      {!isAuthenticated ? (
       <div className="p-12 text-center bg-white border border-slate-200 rounded-3xl shadow-sm space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-slate-50 text-slate-400 border border-slate-100 flex items-center justify-center mx-auto">
         <User className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">请先登录领主账号</h2>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
         登录后即可建立您的专属主权国家，或管理已宣告帝国的疆域、条约、军工与战况。
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
         <button
          type="button"
          onClick={() => setAuthModalOpen(true)}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm transition cursor-pointer"
         >
          立即登录 / 注册
         </button>
         <button
          type="button"
          onClick={async () => {
           try {
            await quickGuestLogin();
           } catch (e: any) {
            setToastMessage(e.message || '快捷试玩登录失败');
            setTimeout(() => setToastMessage(null), 3000);
           }
          }}
          className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold shadow-sm transition cursor-pointer flex items-center gap-1.5"
         >
          <Sparkles className="w-4 h-4 text-amber-100" />
          一键快捷试玩登录
         </button>
        </div>
       </div>
      ) : !myNation ? (
       /* User logged in but HAS NOT created a nation yet */
       <div className="p-8 sm:p-12 bg-white border border-slate-200 rounded-3xl text-center space-y-6 shadow-sm">
        <div className="w-20 h-20 rounded-3xl bg-indigo-50 text-indigo-500 flex items-center justify-center mx-auto mb-4">
         <Crown className="w-10 h-10" />
        </div>
        <div>
         <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
          尊贵的领主【{user.douyinName || user.username}】，您尚未宣告国家
         </h2>
         <p className="text-sm text-slate-500 max-w-lg mx-auto mt-3 leading-relaxed">
          在世界地缘大厅中确立您的国名、首都、疆域范围、政体与国徽，开启与其他诸国的和平建交与争霸之路！
         </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto text-left">
         <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
          <span className="font-bold text-slate-800 flex items-center gap-1.5 mb-1.5">
           <span className="w-2 h-2 rounded-full bg-amber-500" /> 确立疆域与首都
          </span>
          <p className="text-slate-500 text-xs leading-relaxed">自定义首都、领土范围、官方货币与语言。</p>
         </div>
         <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
          <span className="font-bold text-slate-800 flex items-center gap-1.5 mb-1.5">
           <span className="w-2 h-2 rounded-full bg-indigo-500" /> 签署外交条约
          </span>
          <p className="text-slate-500 text-xs leading-relaxed">与周边诸国缔结互保同盟、和平条约或通行权。</p>
         </div>
         <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
          <span className="font-bold text-slate-800 flex items-center gap-1.5 mb-1.5">
           <span className="w-2 h-2 rounded-full bg-rose-500" /> 宣战与停战
          </span>
          <p className="text-slate-500 text-xs leading-relaxed">针对敌对势力下达宣战令，或谈判停战。</p>
         </div>
        </div>

        <button
         id="my-nation-create-cta"
         type="button"
         onClick={() => setCreateNationModalOpen(true)}
         className="mt-6 px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-sm shadow-sm transition inline-flex items-center gap-2 cursor-pointer"
        >
         <Crown className="w-4 h-4 text-indigo-200" />
         开启立国大典 · 立即宣告建国
        </button>
       </div>
      ) : (
       /* User HAS a nation */
       <div className="space-y-4 sm:space-y-5 pb-24 sm:pb-8">
        {/* Hero Card - Full-bleed Flag with Vignette & Overlaid Typography */}
        <div 
         className="rounded-2xl sm:rounded-3xl shadow-sm relative overflow-hidden text-white aspect-[3/2] sm:aspect-[16/9] max-h-[320px] sm:max-h-[380px] w-full flex flex-col justify-between p-4 sm:p-6"
         style={{ backgroundColor: myNation.flagColor || '#4f46e5' }}
        >
         {/* Full-bleed Background Flag (Real Image or Emblem Watermark) */}
         {myNation.emblemIcon && (myNation.emblemIcon.startsWith('data:image') || myNation.emblemIcon.startsWith('http')) ? (
          <img
           src={myNation.emblemIcon}
           alt={myNation.name}
           className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none"
          />
         ) : (
          <div className="absolute -right-2 -bottom-4 opacity-30 pointer-events-none select-none">
           {renderEmblemIcon(myNation.emblemIcon, { className: 'w-44 h-44 sm:w-56 sm:h-56 text-white' })}
          </div>
         )}

         {/* Dark Vignette / Gradient Overlay for high-contrast crisp text while keeping flag clear */}
         <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/20 pointer-events-none" />
         <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/20 to-transparent pointer-events-none" />

         {/* Top Bar Actions on the Flag */}
         <div className="relative z-10 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
           <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-black/40 backdrop-blur-md text-white border border-white/25 tracking-wide flex items-center gap-1 shadow-xs">
            <Crown className="w-3.5 h-3.5 text-amber-300" /> 最高领主
           </span>
          </div>

          <div className="flex items-center gap-1.5">
           <button
            type="button"
            onClick={() => handleEditNation(myNation)}
            className="px-2.5 py-1.5 bg-black/50 hover:bg-black/70 text-white backdrop-blur-md border border-white/25 rounded-lg text-xs font-semibold transition flex items-center gap-1 cursor-pointer shadow-xs"
            title="编辑国家资料"
           >
            <Edit3 className="w-3.5 h-3.5 text-slate-200" /> <span className="hidden sm:inline">编辑</span>
           </button>
           <button
            type="button"
            onClick={() => handleDeleteNation(myNation)}
            className="px-2.5 py-1.5 bg-rose-950/70 hover:bg-rose-900/90 text-rose-100 backdrop-blur-md border border-rose-400/40 rounded-lg text-xs font-semibold transition flex items-center gap-1 cursor-pointer shadow-xs"
            title="解散国家"
           >
            <Trash2 className="w-3.5 h-3.5 text-rose-300" /> <span className="hidden sm:inline">解散</span>
           </button>
          </div>
         </div>

         {/* Bottom Overlaid Typography with Dark Vignette */}
         <div className="relative z-10 pt-3">
          <div className="min-w-0">
           <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight drop-shadow-lg truncate">
            {myNation.name}
           </h2>
           <div className="text-[11px] text-white/90 mt-1 flex items-center gap-2 flex-wrap drop-shadow-md font-medium">
            <span className="flex items-center gap-1">
             <MapPin className="w-3 h-3 text-amber-300 flex-shrink-0" />
             首都：<strong className="text-white font-semibold">{myNation.capital}</strong>
            </span>
            <span className="text-white/50">·</span>
            <span className="flex items-center gap-1 text-white font-mono">
             <TikTokIcon className="w-3.5 h-3.5 text-rose-300 flex-shrink-0" /> 抖音：{user.douyinName}
            </span>
           </div>
          </div>
         </div>
        </div>

        {/* Subtab Switcher for My Nation (国家执政) */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 gap-2">
          <div className="flex items-center gap-1 sm:gap-1.5 p-1 bg-slate-100 rounded-2xl overflow-x-auto no-scrollbar max-w-full">
          <button
           type="button"
           onClick={() => setMyNationSubTab('overview')}
           className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
            myNationSubTab === 'overview'
             ? 'bg-white text-indigo-700 shadow-sm'
             : 'text-slate-600 hover:text-slate-900'
           }`}
          >
           <Landmark className="w-3.5 h-3.5 flex-shrink-0" />
           政务与外交
          </button>
          <button
           type="button"
           onClick={() => setMyNationSubTab('focus')}
           className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
            myNationSubTab === 'focus'
             ? 'bg-white text-amber-900 shadow-sm'
             : 'text-slate-600 hover:text-slate-900'
           }`}
          >
           <Compass className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
           国家战略国策树
          </button>
          <button
           type="button"
           onClick={() => setMyNationSubTab('economy')}
           className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
            myNationSubTab === 'economy'
             ? 'bg-white text-amber-800 shadow-sm'
             : 'text-slate-600 hover:text-slate-900'
           }`}
          >
           <CivilianFactoryPlantIcon size={16} className="text-amber-500 flex-shrink-0" />
           国家经济与国库
           {(() => {
            const totalCiv = getTotalCivilianFactories(myNation);
            return totalCiv > 0 ? (
             <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-amber-100 text-amber-800 font-extrabold flex-shrink-0">
              {totalCiv}民工
             </span>
            ) : null;
           })()}
          </button>
          <button
           type="button"
           onClick={() => setMyNationSubTab('military')}
           className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
            myNationSubTab === 'military'
             ? 'bg-white text-indigo-700 shadow-sm'
             : 'text-slate-600 hover:text-slate-900'
           }`}
          >
           <MilitaryFactoryPlantIcon size={16} className="text-indigo-500 flex-shrink-0" />
           军事工业与排产
           {(() => {
            const totalMil = getTotalMilitaryFactories(myNation);
            return totalMil > 0 ? (
             <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-indigo-100 text-indigo-800 font-extrabold flex-shrink-0">
              {totalMil}军工
             </span>
            ) : null;
           })()}
          </button>
         </div>
        </div>

        {myNationSubTab === 'focus' ? (
         <NationalFocusTreePage
          nation={myNation}
          onUpdateNation={(updated) => {
           if (myNation) {
            const merged = { ...myNation, ...updated };
            setMyNation(merged);
            setNations((prev) => prev.map((n) => (n.id === merged.id ? merged : n)));
           }
          }}
          onNavigateTab={setActiveTab}
         />
        ) : myNationSubTab === 'economy' ? (
         <NationalEconomyDashboard
          nation={myNation}
          isOwner={true}
          onUpdateNation={(updated) => {
           setMyNation(updated);
           setNations((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
          }}
          onOpenConstruction={() => setConstructionModalOpen(true)}
          showToast={showToast}
         />
        ) : myNationSubTab === 'military' ? (
         <MilitaryIndustryDashboard
          nation={myNation}
          isOwner={true}
          onUpdateNation={(updated) => {
           setMyNation(updated);
           setNations((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
          }}
          showToast={showToast}
         />
        ) : (
         <>
          {/* 4 Core Attribute Cards - 2 Columns Compact Grid */}
          <div className="grid grid-cols-2 gap-2 sm:gap-2.5 max-w-lg mx-auto w-full">
           <div className="p-2.5 sm:p-3 bg-white border border-slate-200 shadow-2xs rounded-xl flex items-center justify-between">
            <div>
             <span className="text-[10px] text-slate-400 block font-medium leading-none mb-0.5">政体建制</span>
             <span className="text-xs sm:text-sm font-bold text-slate-900">{myNation.regime}</span>
            </div>
            <Scale className="w-3.5 h-3.5 text-amber-500/80 flex-shrink-0" />
           </div>
           <div className="p-2.5 sm:p-3 bg-white border border-slate-200 shadow-2xs rounded-xl flex items-center justify-between">
            <div>
             <span className="text-[10px] text-slate-400 block font-medium leading-none mb-0.5">官方语言</span>
             <span className="text-xs sm:text-sm font-bold text-slate-900">{myNation.language}</span>
            </div>
            <Languages className="w-3.5 h-3.5 text-indigo-500/80 flex-shrink-0" />
           </div>
           <div className="p-2.5 sm:p-3 bg-white border border-slate-200 shadow-2xs rounded-xl flex items-center justify-between">
            <div>
             <span className="text-[10px] text-slate-400 block font-medium leading-none mb-0.5">国家意识形态</span>
             <span className="text-xs sm:text-sm font-bold text-slate-900">{myNation.ideology}</span>
            </div>
            <Sparkles className="w-3.5 h-3.5 text-emerald-500/80 flex-shrink-0" />
           </div>
           <div
            onClick={() => setMyNationSubTab('economy')}
            className="p-2.5 sm:p-3 bg-white border border-slate-200 hover:border-amber-400 shadow-2xs rounded-xl flex items-center justify-between cursor-pointer transition group"
            title="点击进入国家经济与国库中枢"
           >
            <div>
             <span className="text-[10px] text-slate-400 block font-medium group-hover:text-amber-700 leading-none mb-0.5">流通主权货币</span>
             <div className="flex items-center gap-1 flex-wrap">
              <span className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-amber-800">{myNation.currency || '玲玉币'}</span>
              <span className="text-[9px] font-mono px-1 py-0.1 rounded bg-amber-50 text-amber-800 border border-amber-200/60 font-bold">
               {myNation.currencySymbol || '¥'}
              </span>
             </div>
             <div className="mt-0.5 flex items-center gap-1 text-[9px] text-slate-400">
              <span>实时国库</span>
              <LiveCurrencyBalance nation={myNation} />
             </div>
            </div>
            <Coins className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 group-hover:scale-110 transition" />
           </div>
          </div>

          {/* 4 Core Strategic Operations Command Cards */}
          <div className="space-y-2 pt-1">
           <div className="text-xs font-extrabold text-slate-800 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
             <Crown className="w-3.5 h-3.5 text-indigo-600" />
             <span>国家战略治国枢纽 · 执政公署</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono">领主核心系统</span>
           </div>

           <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* 1. 地缘争端与沙盘推演 */}
            <div
             onClick={() => handleOpenDispute()}
             className="p-3.5 bg-gradient-to-br from-rose-50/70 to-orange-50/50 border border-rose-200/80 hover:border-rose-300 rounded-2xl shadow-2xs transition-all cursor-pointer group hover:shadow-xs"
            >
             <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
               <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-xs">
                <Swords className="w-4 h-4" />
               </div>
               <div>
                <h4 className="text-xs font-bold text-slate-900 group-hover:text-rose-700 transition">
                 地缘争端与沙盘推演
                </h4>
                <p className="text-[10px] text-slate-500">
                 {(myNation.activeWars?.length || 0) > 0 ? (
                  <span className="text-rose-600 font-bold">{myNation.activeWars?.length} 场前线战事交火中</span>
                 ) : (
                  '和平戒备 · 发起争端/战力推演'
                 )}
                </p>
               </div>
              </div>
              <span className="px-2 py-0.5 rounded-lg bg-rose-100 text-rose-800 text-[10px] font-extrabold font-mono">
               推演
              </span>
             </div>
            </div>

            {/* 2. 国策法令与内阁智库 */}
            <div
             onClick={() => setDecreeModalOpen(true)}
             className="p-3.5 bg-gradient-to-br from-indigo-50/70 to-sky-50/50 border border-indigo-200/80 hover:border-indigo-300 rounded-2xl shadow-2xs transition-all cursor-pointer group hover:shadow-xs"
            >
             <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
               <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                <Landmark className="w-4 h-4" />
               </div>
               <div>
                <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-700 transition">
                 国策法令与内阁智库
                </h4>
                <p className="text-[10px] text-slate-500">
                 施行中法令: {myNation.activeDecreeIds?.length || 1} 项 · 内阁 4 部已就任
                </p>
               </div>
              </div>
              <span className="px-2 py-0.5 rounded-lg bg-indigo-100 text-indigo-800 text-[10px] font-extrabold font-mono">
               法令树
              </span>
             </div>
            </div>

            {/* 3. 国际阵营与多边外交 */}
            <div
             onClick={handleOpenAlliancePage}
             className="p-3.5 bg-gradient-to-br from-sky-50/70 to-emerald-50/50 border border-sky-200/80 hover:border-sky-300 rounded-2xl shadow-2xs transition-all cursor-pointer group hover:shadow-xs"
            >
             <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
               <div className="w-8 h-8 rounded-xl bg-sky-600 text-white flex items-center justify-center shadow-xs">
                <Globe className="w-4 h-4" />
               </div>
               <div>
                <h4 className="text-xs font-bold text-slate-900 group-hover:text-sky-700 transition">
                 国际同盟与使馆租借
                </h4>
                <p className="text-[10px] text-slate-500">
                 {myNation.allianceId ? '已加入跨国条约同盟' : '多国阵营 · 租借法案与常驻使馆'}
                </p>
               </div>
              </div>
              <span className="px-2 py-0.5 rounded-lg bg-sky-100 text-sky-800 text-[10px] font-extrabold font-mono">
               同盟
              </span>
             </div>
            </div>

            {/* 4. 勋章荣誉与大事记编年史 */}
            <div
             onClick={() => setChronicleModalOpen(true)}
             className="p-3.5 bg-gradient-to-br from-amber-50/70 to-yellow-50/50 border border-amber-200/80 hover:border-amber-300 rounded-2xl shadow-2xs transition-all cursor-pointer group hover:shadow-xs"
            >
             <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
               <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-xs">
                <BookOpen className="w-4 h-4" />
               </div>
               <div>
                <h4 className="text-xs font-bold text-slate-900 group-hover:text-amber-700 transition">
                 功勋勋章与大事记典籍
                </h4>
                <p className="text-[10px] text-slate-500">
                 国家百科档案 · 国歌定制 · 全国紧急公报
                </p>
               </div>
              </div>
              <span className="px-2 py-0.5 rounded-lg bg-amber-100 text-amber-800 text-[10px] font-extrabold font-mono">
               荣誉厅
              </span>
             </div>
            </div>
           </div>
          </div>

          {/* Territory Full-width Card */}
          <div className="p-4 sm:p-4.5 bg-white border border-slate-200 shadow-2xs rounded-xl sm:rounded-2xl space-y-1.5">
           <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
            <MapPin className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
            <span>国家疆域范围</span>
           </div>
           <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{myNation.territory}</p>
          </div>

          {/* Lore Description Full-width Card */}
          <div className="p-4 sm:p-4.5 bg-white border border-slate-200 shadow-2xs rounded-xl sm:rounded-2xl space-y-1.5">
           <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
            <BookOpen className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
            <span>国家立国誓约与简介</span>
           </div>
           <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
            {myNation.description}
           </p>
          </div>

          {/* Active Wars Section */}
          <div className="p-5 bg-white border border-slate-200 shadow-sm rounded-2xl space-y-3">
           <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-rose-600 flex items-center gap-2">
             <Swords className="w-4 h-4" />
             当前进行中的战争 ({myNation.activeWars?.length || 0})
            </span>
           </div>

           {(myNation.activeWars || []).length === 0 ? (
            <p className="text-sm text-slate-500">我国目前与所有邻国保持和平，无任何交战记录。</p>
           ) : (
            <div className="space-y-2">
             {(myNation.activeWars || []).map((w, idx) => (
              <div
               key={'my-war-' + idx}
               className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-center justify-between text-sm"
              >
               <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-500 flex items-center justify-center">
                 <Swords className="w-4 h-4" />
                </div>
                <div>
                 <span className="font-bold text-slate-900">敌对国家：【{w.withNationName}】</span>
                 <span className="text-xs text-slate-500 block mt-0.5">
                  {w.initiatedByMe ? '我国主动下达宣战通牒' : '对方对我方宣战'} · 开战时间：{new Date(w.since).toLocaleDateString()}
                 </span>
                </div>
               </div>

               <button
                type="button"
                onClick={() => {
                 const targetN = nations.find((n) => n.id === w.withNationId);
                 if (targetN) handleOpenDiplomacy(targetN, 'armistice');
                }}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold text-xs shadow-sm transition cursor-pointer"
               >
                提议停战
               </button>
              </div>
             ))}
            </div>
           )}
          </div>

          {/* Active Treaties Section */}
          <div className="p-5 bg-white border border-slate-200 shadow-sm rounded-2xl space-y-3">
           <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-indigo-600 flex items-center gap-2">
             <HeartHandshake className="w-4 h-4" />
             我国已签署生效的外交条约 ({myNation.activeTreaties?.length || 0})
            </span>
           </div>

           {(myNation.activeTreaties || []).length === 0 ? (
            <p className="text-sm text-slate-500">我国暂未与其他国家签署任何公开条约。</p>
           ) : (
            <div className="space-y-2">
             {(myNation.activeTreaties || []).map((t) => {
              const typeNames: Record<string, string> = {
               peace: '和平条约',
               mutual_defense: '互保防御同盟',
               military_access: '军事通行权',
              };

              return (
               <div
                key={t.id}
                className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between text-sm"
               >
                <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center">
                  {t.type === 'peace' && <HeartHandshake className="w-4 h-4 text-emerald-500" />}
                  {t.type === 'mutual_defense' && <ShieldCheck className="w-4 h-4 text-indigo-500" />}
                  {t.type === 'military_access' && <Compass className="w-4 h-4 text-sky-500" />}
                 </div>
                 <div>
                  <span className="font-bold text-slate-900">【{t.withNationName}】</span>
                  <span className="text-slate-500 text-xs ml-2">
                   （条约类型：{typeNames[t.type] || t.type}）
                  </span>
                 </div>
                </div>

                <button
                 type="button"
                 onClick={() => handleTerminateTreaty(t.id, t.withNationName)}
                 className="px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-600 border border-slate-200 hover:border-rose-200 rounded-lg text-xs font-semibold shadow-sm transition cursor-pointer"
                >
                 单方面废约
                </button>
               </div>
              );
             })}
            </div>
           )}
          </div>
         </>
        )}
       </div>
      )}
     </div>
    )}

    {/* VIEW 3: WORLD MAP (世界地图) */}
    {activeTab === 'world_map' && (
     <motion.div
      key="world-map-fullscreen"
      initial={{ opacity: 0, scale: 0.985 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.985 }}
      transition={{
       duration: 0.42,
       ease: [0.16, 1, 0.3, 1], // Non-linear quintic out smooth curve
      }}
      className="flex-1 w-full h-full flex flex-col overflow-hidden"
     >
      <WorldMap
       nations={nations}
       onSelectNation={handleViewNation}
       onOpenDiplomacy={handleOpenDiplomacy}
       targetNationToFocus={targetNationToFocus}
       clearTargetNationFocus={handleClearTargetNationFocus}
       onOpenConstruction={() => setConstructionModalOpen(true)}
       constructionPlacementBuilding={constructionPlacementBuilding}
       onCancelConstructionPlacement={() => setConstructionPlacementBuilding(null)}
       onChangeConstructionBuilding={(b) => setConstructionPlacementBuilding(b)}
       myNation={myNation}
       onBuildInProvince={handleBuildInProvince}
       onOpenDispute={handleOpenDispute}
       onOpenArmyCommand={() => setActiveTab('army')}
      />
     </motion.div>
    )}

    {/* VIEW: WAR THEATER OPERATIONS (国家统帅部·战争指挥作战厅) */}
    {activeTab === 'wars' && (
     <div className="flex-1 animate-fadeIn px-3 sm:px-5 lg:px-7 py-4 sm:py-6">
      <WarCommandCenter
       nation={myNation}
       allNations={nations}
       onOpenDisputeModal={handleOpenDispute}
       onNavigateToMap={() => setActiveTab('world_map')}
       onOpenDiplomacy={handleOpenDiplomacy}
      />
     </div>
    )}

    {/* VIEW: DEMOGRAPHICS (人口社会动态系统) */}
    {activeTab === 'demographics' && (
     <div className="flex-1 animate-fadeIn px-3 sm:px-5 lg:px-7 py-4 sm:py-6">
      <DemographicsView nation={myNation} onNavigateTab={setActiveTab} />
     </div>
    )}

    {/* VIEW: POLITICS & GOVERNANCE (政治体制与国家治理公署) */}
    {(activeTab === 'politics' || activeTab === 'governance') && (
     <div className="flex-1 animate-fadeIn px-3 sm:px-5 lg:px-7 py-4 sm:py-6">
      <PoliticsAndGovernanceView
       nation={myNation}
       onOpenDecreeModal={() => setDecreeModalOpen(true)}
       onNavigateTab={setActiveTab}
      />
     </div>
    )}

    {/* VIEW: STRATEGIC RESOURCES (战略资源储备产销中枢) */}
    {activeTab === 'resources' && (
     <div className="flex-1 animate-fadeIn px-3 sm:px-5 lg:px-7 py-4 sm:py-6">
      <StrategicResourcesView
       nation={myNation}
       onNavigateToMap={() => setActiveTab('world_map')}
      />
     </div>
    )}

    {/* VIEW: INTERNATIONAL EMBARGO & SANCTIONS (贸易禁运与制裁) */}
    {activeTab === 'embargo' && (
     <div className="flex-1 animate-fadeIn px-3 sm:px-5 lg:px-7 py-4 sm:py-6">
      <InternationalEmbargoView
       nation={myNation}
       allNations={nations}
       onPersistNation={persistNationUpdate}
       onNavigateToMap={() => setActiveTab('world_map')}
      />
     </div>
    )}

    {/* VIEW 4: ARMY COMMAND (陆军指挥) */}
    {activeTab === 'army' && (
     <ArmyPage nation={myNation} onUpdateNation={persistNationUpdate} showToast={showToast} />
    )}

    {/* VIEW: NATIONAL FOCUS (国家战略国策树) */}
    {activeTab === 'national_focus' && (
     <div className="flex-1 w-full h-full flex flex-col overflow-hidden animate-fadeIn">
      <NationalFocusTreePage
       nation={myNation}
       onUpdateNation={persistNationUpdate}
       onNavigateTab={setActiveTab}
      />
     </div>
    )}

    {/* VIEW 5: RESEARCH (国家科研与科技树) */}
    {activeTab === 'research' && (
     <div className="flex-1 w-full h-full flex flex-col overflow-hidden animate-fadeIn">
      <ResearchPage
       nation={myNation}
       onUpdateNation={persistNationUpdate}
       showToast={showToast}
       onNavigateToMap={() => setActiveTab('world_map')}
      />
     </div>
    )}

    {activeTab === 'alliances' && (
     <div className="animate-fadeIn px-3 sm:px-5 lg:px-7 py-4 sm:py-6">
      <AllianceAndEmbassyModal
       isOpen
       variant="page"
       onClose={() => setActiveTab('lobby')}
       myNation={myNation}
       allNations={nations}
       onUpdateNation={persistNationUpdate}
       onShowToast={showToast}
      />
     </div>
    )}

    {/* VIEW 5: ADMIN (管理员模式) */}
    {activeTab === 'admin' && isAdmin && (
     <div className="animate-fadeIn">
      <AdminPanel
       nations={nations}
       onEditNation={handleEditNation}
       onDeleteNation={handleDeleteNation}
       onRefreshData={fetchNations}
      />
     </div>
    )}
   </main>

   {/* Mobile Bottom Tab Bar - hidden when in focused map selection mode */}
   {!isMapSelectionMode && (
    <MobileTabBar
     activeTab={activeTab}
     setActiveTab={setActiveTab}
     onOpenCreateNation={() => {
      if (!isAuthenticated) setAuthModalOpen(true);
      else setCreateNationModalOpen(true);
     }}
     onOpenAlliance={handleOpenAlliancePage}
    />
   )}
   </div>

   {/* Modals */}
   <BugFeedbackModal isOpen={bugFeedbackOpen} onClose={() => setBugFeedbackOpen(false)} />

   <AuthModal
    isOpen={authModalOpen}
    defaultMode={authDefaultMode}
    onClose={() => setAuthModalOpen(false)}
   />

   <CreateNationModal
    isOpen={createNationModalOpen}
    onClose={() => {
     setCreateNationModalOpen(false);
     setIsMapSelectionMode(false);
    }}
    onMapModeChange={handleMapModeChange}
    onEnterMapMode={() => setActiveTab('world_map')}
    onSuccess={() => {
     setIsMapSelectionMode(false);
     showToast(' 恭喜！您的帝国已正式宣告成立并录入世界大厅！');
     fetchNations();
     setActiveTab('my_nation');
    }}
   />

   <EditNationModal
    isOpen={editNationModalOpen}
    nation={nationToEdit}
    onClose={() => {
     setEditNationModalOpen(false);
     setNationToEdit(null);
    }}
    onSuccess={(updated) => {
     showToast(`国家【${updated.name}】信息已成功更新！`);
     fetchNations();
    }}
   />

   <NationModal
    isOpen={detailModalOpen}
    nation={selectedNationForDetail}
    onClose={() => {
     setDetailModalOpen(false);
     setSelectedNationForDetail(null);
    }}
    onOpenDiplomacy={(n, type) => handleOpenDiplomacy(n, type)}
    onEdit={(n) => handleEditNation(n)}
    onDelete={(n) => handleDeleteNation(n)}
    onTerminateTreaty={handleTerminateTreaty}
    onOpenDispute={(n) => handleOpenDispute(n)}
    onOpenAlliance={handleOpenAlliancePage}
    onUpdateNation={(updated) => {
     setSelectedNationForDetail(updated);
     if (myNation?.id === updated.id) {
      setMyNation(updated);
     }
     setNations((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
    }}
    showToast={showToast}
   />

   {/* Strategic Gameplay 4 Modals */}
   <DisputeAndWarModal
    isOpen={disputeModalOpen}
    onClose={() => {
     setDisputeModalOpen(false);
     setDisputeTargetNation(null);
     setDisputeTargetProvince(undefined);
    }}
    myNation={myNation}
    allNations={nations}
    onUpdateNation={persistNationUpdate}
    onShowToast={showToast}
    initialTargetNation={disputeTargetNation}
    initialProvinceName={disputeTargetProvince}
   />

   <DecreeAndCabinetModal
    isOpen={decreeModalOpen}
    onClose={() => setDecreeModalOpen(false)}
    myNation={myNation}
    allNations={nations}
    onUpdateNation={persistNationUpdate}
    onShowToast={showToast}
   />

   <ChronicleAndMedalsModal
    isOpen={chronicleModalOpen}
    onClose={() => setChronicleModalOpen(false)}
    myNation={myNation}
    onUpdateNation={(updated) => {
     setMyNation(updated);
     setNations((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
    }}
    onShowToast={showToast}
   />

   <DiplomacyModal
    isOpen={diplomacyModalOpen}
    targetNation={targetNationForDiplomacy}
    initialType={initialDipType}
    onClose={() => {
     setDiplomacyModalOpen(false);
     setTargetNationForDiplomacy(null);
    }}
    onSuccess={(msg) => {
     showToast(msg);
     fetchNations();
    }}
   />

   <ConstructionModal
    isOpen={constructionModalOpen}
    nation={myNation}
    onClose={() => setConstructionModalOpen(false)}
    onStartMapPlacement={(b) => {
     setConstructionPlacementBuilding(b);
     setConstructionModalOpen(false);
     setActiveTab('world_map');
    }}
    onBuildInProvince={handleBuildInProvince}
    onCancelQueueItem={handleCancelConstruction}
    onReorderQueueItem={handleReorderConstructionQueue}
    onUpdateNation={(updated) => {
     setMyNation(updated);
     setNations((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
    }}
    showToast={showToast}
   />

   <ConfirmDialog
    isOpen={confirmDialog.isOpen}
    title={confirmDialog.title}
    message={confirmDialog.message}
    confirmText={confirmDialog.confirmText}
    isDangerous={confirmDialog.isDangerous}
    onConfirm={confirmDialog.onConfirm}
    onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
   />

   {/* Nation Search Modal (Fast Keyword Search) */}
   <NationSearchModal
    isOpen={searchModalOpen}
    onClose={() => setSearchModalOpen(false)}
    searchTerm={searchTerm}
    onSearchChange={setSearchTerm}
    totalResultsCount={nations.length}
   />

   {/* Nation Filter Bottom Drawer (Regime & Ideology) */}
   <NationFilterDrawer
    isOpen={filterDrawerOpen}
    onClose={() => setFilterDrawerOpen(false)}
    selectedRegime={selectedRegime}
    onRegimeChange={setSelectedRegime}
    selectedIdeology={selectedIdeology}
    onIdeologyChange={setSelectedIdeology}
    totalResultsCount={nations.length}
    onReset={() => {
     setSelectedRegime('all');
     setSelectedIdeology('all');
    }}
   />
  </div>
 );
}

export default function App() {
 return (
  <AuthProvider>
   <MainApp />
  </AuthProvider>
 );
}
