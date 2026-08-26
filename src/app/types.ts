export type UserRole = 'user' | 'admin';

export interface User {
 id: string;
 username: string;
 douyinName: string;
 role: UserRole;
 avatarColor?: string;
 isLingyuBaby?: boolean;
 createdAt: string;
}

import { ProvinceDetailedBuildings, StrategicBuildingType, RadarTechTier } from './lib/constructionRules';

export type RegimeType =
 | '君主立宪制'
 | '联邦共和制'
 | '宪政联邦共和制'
 | '民主议会制'
 | '封建帝国'
 | '军政府/军国主义'
 | '神权政体'
 | '苏维埃代表制'
 | '自由城邦自治'
 | '其他特殊政体';

export type IdeologyType =
 | '中立和平主义'
 | '自由民主主义'
 | '扩张威权主义'
 | '社群社会主义'
 | '民族传统主义'
 | '重商资本主义'
 | '科技理性主义'
 | '激进军国主义';

export interface ProvinceData {
 id: string | number;
 name: string;
 civilianFactories: number;
 militaryFactories: number;
 detailedBuildings?: Partial<ProvinceDetailedBuildings>;
 manpower?: number;
 population?: number;
 // Territory Core State
 isCore?: boolean;
 acquiredAt?: string;
 acquiredMethod?: 'initial' | 'peace_expansion' | 'conquest';
 // Dynamic Combat & Occupation
 occupationStatus?: 'peace' | 'combat' | 'occupied';
 occupationValue?: number; // 0 ~ 100
 attackerStrength?: number;
 defenderStrength?: number;
 attackerId?: string;
 attackerName?: string;
}

export interface ConstructionQueueItem {
 id: string;
 provinceId: string | number;
 provinceName: string;
 buildingType: StrategicBuildingType;
 targetLevel: number;
 cost: number;
 progress: number;
 allocatedCivFactories: number;
 speedBonus: number; // e.g. 0.1 for 10%
 createdAt: string;
 totalCost?: number;
 investedCapacity?: number;
 assignedFactories?: number;
 status?: 'in_progress' | 'completed' | 'paused';
 lastCalculatedAt?: string;
}

export interface NationBuilding {
 id: string;
 type: string;
 name: string;
 level: number;
 maxLevel: number;
 description: string;
 effect: string;
 cost: number;
 icon: string;
 updatedAt: string;
}

export interface MilitaryModuleOption {
 id: string;
 name: string;
 addedCost: number;
 category: 'chassis' | 'weapon' | 'armor' | 'engine' | 'avionics' | 'special';
 description?: string;
}

export interface CustomEquipmentDesign {
 id: string;
 name: string;
 type: 'tank' | 'aircraft' | 'tank_destroyer' | 'sp_artillery' | 'rifle' | 'artillery' | 'support_eq' | 'truck' | 'armored_car' | 'mechanized';
 typeName: string;
 baseCost: number;
 selectedModules: MilitaryModuleOption[];
 totalCost: number;
 description: string;
 createdAt: string;
}

export interface MilitaryProductionLine {
 id: string;
 equipmentId: string;
 equipmentName: string;
 category: 'infantry' | 'artillery' | 'support' | 'motorized' | 'armor' | 'mechanized' | 'designer' | 'aviation';
 unitCost: number; // IC per unit (e.g. 0.1 for rifle, 2.5 for artillery)
 unitCostDisplay: string; // e.g. "0.1 产能 (10把/点)" or "2.5 产能/门"
 assignedFactories: number;
 dailyCapacity: number; // assignedFactories * 500
 dailyOutput: number; // dailyCapacity / unitCost
 customDesignId?: string;
}

export interface MilitaryIndustryState {
 productionLines: MilitaryProductionLine[];
 customDesigns: CustomEquipmentDesign[];
 stockpiles: Record<string, number>; // equipmentId -> count
 lastUpdated?: string;
}

export type ArmyDivisionStatus = 'training' | 'deploying' | 'ready' | 'moving' | 'fighting' | 'garrison' | 'undersupplied';
export interface ArmyDivision {
 id: string;
 name: string;
 type: string;
 corps: string;
 provinceId: string | number;
 provinceName: string;
 status: ArmyDivisionStatus;
 manpower: number;
 manpowerMax: number;
 equipmentRate: number;
 organization: number;
 supply: number;
 experience: number;
 template: { infantry: number; artillery: number; support: number; armor: number };
 createdAt: string;
 trainingStartedAt?: string;
 trainingLastCalculatedAt?: string;
 trainingDaysCompleted?: number;
 trainingDaysTotal?: number;
}
export interface ArmyState {
 manpowerReserve: number;
 armyExperience: number;
 divisions: ArmyDivision[];
 generals: { id: string; name: string; rank: string; attackBonus: number; defenseBonus: number }[];
}

export interface Nation {
 id: string;
 ownerId: string;
 ownerUsername: string;
 ownerDouyinName: string;
 name: string;
 capital: string;
 territory: string;
 description: string;
 regime: RegimeType;
 ideology: IdeologyType;
 language: string;
 currency: string;
 currencyRate?: number; // 对基准货币【玲玉币】的汇率 (例如 1 自定义币 = X 玲玉币，默认 1)
 flagColor: string;
 emblemIcon: string;
 createdAt: string;
 updatedAt: string;
 mapCoordinates?: [number, number]; // [lng, lat]
 provinces?: ProvinceData[];
 buildings?: NationBuilding[];
 militaryIndustry?: MilitaryIndustryState;
 army?: ArmyState;
 radarTech?: RadarTechTier;
 constructionQueue?: ConstructionQueueItem[];
 activeWars?: {
  withNationId: string;
  withNationName: string;
  initiatedByMe: boolean;
  since: string;
  disputeProvinceName?: string;
  warGoal?: string;
 }[];
 activeTreaties?: {
  id: string;
  withNationId: string;
  withNationName: string;
  type: DiplomacyType;
  since: string;
 }[];
 // 2. 国家政府与内政法令
 activeDecreeIds?: string[];
 conscriptionLawId?: string; // 征兵法案 id (如 early_mobilization, extensive_conscription)
 totalPopulation?: number; // 国家总人口
 ministers?: Record<'defense' | 'finance' | 'foreign' | 'industry', string>; // role -> ministerId
 taxRate?: number; // 0~100%
 stabilityIndex?: number; // 0~100
 popularApproval?: number; // 0~100
 
 // 3. 联盟、使馆与租借
 allianceId?: string;
 embassies?: string[]; // list of targetNationIds where an embassy is established
 
 // 4. 制裁与禁运
 activeSanctionsEnforced?: {
  targetNationId: string;
  type: 'arms' | 'energy' | 'total';
  reason: string;
  since: string;
 }[];
 
 // 5. 勋章与编年史
 unlockedMedalIds?: string[];
 nationalAnthem?: string;
 nationalMotto?: string;
 chronicles?: NationalChronicleItem[];

 // 6. 国家科研与科技树
 researchedTechIds?: string[];
 activeResearchProjects?: ActiveResearchProject[];
 unlockedResearchSlots?: number; // 默认 3，可解锁至 4、5

 // 7. 国家经济与财政系统
 currencySymbol?: string;
 economy?: NationalEconomyState;

 // 8. 国家战争与投降倾向机制 (Surrender / Capitulation System)
 surrenderProgress?: number; // 0 ~ 100 投降倾向动态值
 surrenderThreshold?: number; // 投降阈值 (默认 100)
 warSupport?: number; // 战争支持度 (0 ~ 100)
 militaryStrength?: number; // 当前军事力量占战前基准百分比 (0 ~ 100)
 coreTerritoryRatio?: number; // 核心领土保持率 (0 ~ 1)
 occupiedTerritoryRatio?: number; // 被敌方控制领土比例 (0 ~ 1)
 capitalOccupied?: boolean; // 首都是否被敌国占领
 recentDefeats?: number; // 连续战败累积压力 (0 ~ 30)

 // 9. 和平扩张限制记录
 lastPeaceExpansionAt?: string;
 peaceExpansionCount?: number;
 economicStability?: number; // 经济稳定性 (0 ~ 100)
 surrenderResistance?: number; // 国家抵抗修正系数 (如 +0.20 代表 +20% 韧性，-0.15 代表动荡)
 isCapitulated?: boolean; // 是否处于已投降状态
 capitulatedAt?: string; // 投降生效时间
 capitulatedToNationId?: string; // 投降战胜国 ID
 capitulatedToNationName?: string; // 投降战胜国名称
 occupiedProvinces?: string[]; // 被敌国控制的本国省份列表
}

export type SurrenderTierKey =
 | 'resolute'   // 0~19 意志坚定
 | 'stable'    // 20~39 稳定
 | 'tense'     // 40~59 紧张
 | 'dangerous'   // 60~74 危险
 | 'critical'   // 75~89 危急
 | 'collapsing'  // 90~99 濒临崩溃
 | 'capitulated'; // 100+ 已投降

export interface SurrenderTierInfo {
 tier: SurrenderTierKey;
 label: string;
 description: string;
 badgeBg: string;
 badgeText: string;
 progressBarColor: string;
 colorHex: string;
}

export interface SurrenderFactorItem {
 id: string;
 label: string;
 value: number; // 正数为增加投降倾向，负数为降低
 description: string;
 category: 'territory' | 'capital' | 'military' | 'warsupport' | 'defeats' | 'economy' | 'allies' | 'duration' | 'resistance';
}

export interface SurrenderCalculationResult {
 nationId: string;
 nationName: string;
 rawPressure: number; // 未乘抵抗前的总投降压力
 effectiveProgress: number; // 乘国家抵抗修正后的最终有效投降倾向 (0~100)
 threshold: number;
 isCapitulated: boolean;
 tier: SurrenderTierInfo;
 resistanceModifier: number; // 抵抗修正百分比 (如 +20% 或 -15%)
 topFactors: SurrenderFactorItem[]; // 前 3~5 个最关键驱动因素
 allFactors: SurrenderFactorItem[]; // 完整计算明细
 details: {
  territoryOccupiedPercent: number;
  capitalOccupied: boolean;
  coreTerritoryLostPercent: number;
  militaryStrengthRatio: number;
  warSupport: number;
  recentDefeatsPressure: number;
  economicCollapsePressure: number;
  allianceAidModifier: number;
  warDurationDays: number;
  warDurationPressure: number;
 };
}

export interface CapitulationResolution {
 id: string;
 capitulatedNationId: string;
 capitulatedNationName: string;
 victorNationId: string;
 victorNationName: string;
 warId?: string;
 timestamp: string;
 terms: {
  cededProvinces: string[];
  reparationsTotal: number;
  demilitarizedZones: string[];
  regimeChange?: string;
  enforcePeaceYears: number;
 };
 summary: string;
}

export interface NationalEconomyState {
 taxRate: number; // 5% ~ 50%
 economicEfficiency?: number; // 1.0 = 100%
 currencyName: string; // 自定义本国货币名称 (如 "华夏元")
 currencySymbol: string; // 自定义本国货币符号 (如 "¥", "$", "ℳ", "₢")
 lastCalculatedAt: string; // 上次服务端结算时间戳
 baseGDP: number; // 上次结算基准 GDP
 baseTreasury: number; // 上次结算基准国库储备
}

export type TechBranchType =
 | 'infantry'
 | 'support'
 | 'artillery'
 | 'armor'
 | 'industry'
 | 'air'
 | 'naval'
 | 'electronics';

export interface ActiveResearchProject {
 id: string;
 slotIndex: number;
 techId: string;
 techName: string;
 branch: TechBranchType | string;
 daysTotal: number;
 daysCompleted: number;
 progressPercent: number; // 0 ~ 100
 speedModifier: number; // e.g. 1.15 (+15%)
 startedAt: string;
 estimatedCompletionAt?: string;
 lastCalculatedAt?: string;
}

export interface ResearchTechItem {
 id: string;
 name: string;
 branch: TechBranchType;
 tier: 1 | 2 | 3 | 4 | 5;
 col: number; // 0 ~ 5 (Left to Right)
 row: number; // 0 ~ 5 (Vertical Lane)
 icon: string;
 artKey?: string;
 prerequisiteIds?: string[];
 baseDays: number;
 summary: string;
 effects: string[];
 stats?: Record<string, string>;
 historicalQuote?: string;
 year?: number;
}

// 1. 地缘与战争交互系统
export interface ProvinceDispute {
 id: string;
 provinceId: string | number;
 provinceName: string;
 claimantNationId: string;
 claimantNationName: string;
 targetNationId: string;
 targetNationName: string;
 reason: string;
 createdAt: string;
 status: 'pending' | 'ultimatum' | 'war' | 'settled';
 deadline?: string;
}

export interface BattleSimulationReport {
 id: string;
 timestamp: string;
 attackerNationId: string;
 attackerNationName: string;
 defenderNationId: string;
 defenderNationName: string;
 provinceName: string;
 winner: 'attacker' | 'defender' | 'draw';
 title: string;
 attackerCombatPower: number;
 defenderCombatPower: number;
 attackerLosses: { infantry: number; armor: number; aircraft: number };
 defenderLosses: { infantry: number; armor: number; aircraft: number };
 logs: string[];
 territoryCeded?: boolean;
}

export interface ArmisticeProposal {
 id: string;
 fromNationId: string;
 fromNationName: string;
 toNationId: string;
 toNationName: string;
 cededProvinceName?: string;
 reparationsCapacity?: number;
 createDemilitarizedZone?: boolean;
 status: 'pending' | 'accepted' | 'rejected';
 createdAt: string;
}

// 2. 国家政府与内政法令系统
export interface PolicyDecree {
 id: string;
 name: string;
 category: 'economy' | 'military' | 'society' | 'diplomacy';
 description: string;
 iconName: string;
 effects: {
  stabilityBonus?: number;
  popularApprovalBonus?: number;
  civCapacityMultiplier?: number;
  milCapacityMultiplier?: number;
  researchSpeedBonus?: number;
  diploBonus?: number;
 };
 upkeepCostCiv: number;
}

export interface CabinetMinister {
 id: string;
 role: 'defense' | 'finance' | 'foreign' | 'industry';
 roleTitle: string;
 name: string;
 trait: string;
 description: string;
 avatarIcon: string;
 buffs: {
  stability?: number;
  milProductionBuff?: number;
  civProductionBuff?: number;
  diploBuff?: number;
 };
}

// 3. 多国联盟与外交
export type AllianceType = 'defensive' | 'military' | 'economic' | 'federation' | 'entente';

export interface AllianceRules {
 autoMutualDefense: boolean; // 是否自动触发共同防御
 allowIndependentWar: boolean; // 是否允许成员独立宣战
 allowSecession: boolean; // 是否允许自愿退出同盟
 leaderCanKick: boolean; // 是否允许盟主单方面踢出成员
 requireVoteForNewMembers: boolean; // 是否需要投票接纳新成员
 requireVoteForRuleChange: boolean; // 是否需要投票修改公约规则
}

export interface AllianceJoinRequirements {
 minPowerScore?: number; // 最低国力指数
 minFactories?: number; // 最低军工厂/总工厂数
 minStability?: number; // 最低国内稳定度
 ideologyRequirement?: string; // 意识形态要求 (如 '任意' | '军国主义' | '民主共和' 等)
 customCondition?: string; // 自定义外交附加条款
 allowOpenApplication?: boolean; // 是否开放全大陆外交申请
}

export interface AllianceAnnouncement {
 id: string;
 title: string;
 content: string;
 authorNationName: string;
 createdAt: string;
 priority: 'normal' | 'urgent';
}

export interface AlliancePendingApplication {
 nationId: string;
 nationName: string;
 appliedAt: string;
 reason?: string; // 外交申请理由
 powerScore?: number;
 militaryStrength?: number;
 totalFactories?: number;
 stability?: number;
 ownerUsername?: string;
 status?: 'pending' | 'rejected' | 'accepted';
}

export interface AllianceFaction {
 id: string;
 name: string;
 tag: string;
 leaderNationId: string;
 leaderNationName: string;
 memberNationIds: string[];
 memberNationNames: string[];
 description: string;
 mutualDefense: boolean;
 bannerColor: string;
 createdAt: string;
 allianceType?: AllianceType;
 rules?: AllianceRules;
 joinRequirements?: AllianceJoinRequirements;
 headquartersCity?: string;
 emblemIcon?: string;
 memberRoles?: Record<string, 'leader' | 'core' | 'member'>;
 announcements?: AllianceAnnouncement[];
 pendingApplications?: AlliancePendingApplication[];
 chatMessages: {
  id: string;
  senderNationName: string;
  content: string;
  time: string;
 }[];
}

export interface LendLeaseOffer {
 id: string;
 senderNationId: string;
 senderNationName: string;
 receiverNationId: string;
 receiverNationName: string;
 itemType: 'equipment' | 'financial_aid';
 itemName: string;
 amount: number;
 note: string;
 createdAt: string;
 status: 'pending' | 'accepted' | 'rejected';
}

// 4. 勋章、编年史与广播
export interface NationalChronicleItem {
 id: string;
 date: string;
 title: string;
 category: 'founding' | 'war' | 'treaty' | 'wonder' | 'decree' | 'alliance';
 description: string;
}

export interface NationalMedal {
 id: string;
 name: string;
 icon: string;
 category: 'military' | 'diplomacy' | 'construction' | 'legend';
 description: string;
 condition: string;
 rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface EmergencyBroadcast {
 id: string;
 senderNationId: string;
 senderNationName: string;
 senderOwnerName: string;
 title: string;
 content: string;
 category: 'war' | 'diplomacy' | 'wonder' | 'summit';
 createdAt: string;
}

export type DiplomacyType =
 | 'peace'      // 和平条约
 | 'mutual_defense' // 互保条约
 | 'armistice'    // 停战协定
 | 'military_access' // 军事通行权
 | 'embassy'     // 常驻使馆申请
 | 'war';      // 宣战

export type DiplomacyStatus =
 | 'pending'  // 待处理
 | 'accepted' // 已同意
 | 'rejected' // 已拒绝
 | 'active'  // 生效中 (如战争)
 | 'terminated'; // 已废除/已失效

export interface DiplomaticRequest {
 id: string;
 senderNationId: string;
 senderNationName: string;
 senderOwnerId: string;
 senderOwnerName: string;
 receiverNationId: string;
 receiverNationName: string;
 receiverOwnerId: string;
 receiverOwnerName: string;
 type: DiplomacyType;
 status: DiplomacyStatus;
 note?: string;
 createdAt: string;
 updatedAt: string;
}

export type NotificationType =
 | 'dip_request' // 收到外交申请
 | 'dip_result' // 外交申请结果 (同意/拒绝)
 | 'war_alert'  // 宣战通知 / 停战通知
 | 'system';   // 系统通知

export interface AppNotification {
 id: string;
 userId: string;
 type: NotificationType;
 title: string;
 content: string;
 relatedNationId?: string;
 relatedNationName?: string;
 relatedRequestId?: string;
 isRead: boolean;
 createdAt: string;
}

export interface AuthResponse {
 token: string;
 user: User;
 myNation?: Nation | null;
}
