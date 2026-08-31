import {
 AuthResponse,
 User,
 Nation,
 ProvinceData,
 DiplomaticRequest,
 AppNotification,
 DiplomacyType,
} from '../types';
import { claimDailyRegistrationSlot, remoteState } from './remoteState';
import { DEMO_SHOWCASE_USERS, DEMO_SHOWCASE_NATIONS } from './mockShowcaseData';
import { isProvinceAdjacentToNation, findGeoFeature, isTodayUsed, checkProvincesContiguity } from '../lib/mapAdjacency';

/**
 * In-browser API layer.
 *
 * The original project shipped an Express/Node backend (server/*) with a JSON
 * file database. That backend cannot run inside this preview environment, so
 * the exact same behaviour has been ported to the client and persisted in
 * localStorage. All route logic, validation and diplomacy rules mirror the
 * original server code 1:1. Passwords are compared in plaintext here (the
 * original used bcrypt) since we have no server to hash against.
 */

const TOKEN_KEY = 'nation_lobby_jwt_token';
const DB_KEY = 'nation_lobby_client_db_v1';
const LEGACY_DEMO_USER_IDS = new Set(['usr_demo_1', 'usr_demo_2', 'usr_demo_3']);
const LEGACY_DEMO_NATION_IDS = new Set(['nat_lingyu', 'nat_roma', 'nat_nord']);
const ADMIN_DISPLAY_NAME = 'Lingyu';
const ADMIN_ACCESS_PASSWORD = 'lingyuQvQ';

export const tokenStorage = {
 get: () => localStorage.getItem(TOKEN_KEY),
 set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
 remove: () => localStorage.removeItem(TOKEN_KEY),
};

// ---------------------------------------------------------------------------
// Types (client-side DB shape)
// ---------------------------------------------------------------------------

interface DBUser {
 id: string;
 username: string;
 password: string; // plaintext (client mock only)
 douyinName: string;
 role: 'user' | 'admin';
 avatarColor: string;
 avatarUrl?: string;
 avatarEmoji?: string;
 isLingyuBaby?: boolean;
 createdAt: string;
}

interface DBNation {
 id: string;
 ownerId: string;
 ownerUsername: string;
 ownerDouyinName: string;
 name: string;
 capital: string;
 territory: string;
 description: string;
 regime: string;
 ideology: string;
 language: string;
 currency: string;
 currencyRate?: number;
 flagColor: string;
 emblemIcon: string;
 createdAt: string;
 updatedAt: string;
 mapCoordinates?: [number, number];
 provinces?: any[];
 militaryIndustry?: any;
 army?: any;
 radarTech?: string;
 constructionQueue?: any[];
 researchedTechIds?: string[];
 activeResearchProjects?: any[];
 unlockedResearchSlots?: number;
 currencySymbol?: string;
 taxRate?: number;
 economy?: any;
 activeDecreeIds?: string[];
 ministers?: Record<string, string>;
 stabilityIndex?: number;
 popularApproval?: number;
 allianceId?: string;
 embassies?: string[];
 activeWars?: any[];
 activeTreaties?: any[];
 occupiedProvinces?: string[];
 activeSanctionsEnforced?: any[];
 unlockedMedalIds?: string[];
 nationalAnthem?: string;
 nationalMotto?: string;
 chronicles?: any[];
 lastPeaceExpansionAt?: string;
 peaceExpansionCount?: number;
 partyNames?: { communist: string; fascist: string; democratic: string; neutral: string };
 rulingPartyId?: 'communist' | 'fascist' | 'democratic' | 'neutral';
 partySupport?: { communist: number; fascist: number; democratic: number; neutral: number };
 civilWarStatus?: 'peace' | 'tension' | 'civil_war';
 electionsHeldCount?: number;
 coupsAttemptedCount?: number;
 lastElectionAt?: string;
 lastCoupAt?: string;
}

interface DBDiplomaticRequest {
 id: string;
 senderNationId: string;
 senderNationName: string;
 senderOwnerId: string;
 senderOwnerName: string;
 receiverNationId: string;
 receiverNationName: string;
 receiverOwnerId: string;
 receiverOwnerName: string;
 type: 'peace' | 'mutual_defense' | 'armistice' | 'military_access' | 'embassy' | 'war';
 status: 'pending' | 'accepted' | 'rejected' | 'active' | 'terminated';
 note?: string;
 createdAt: string;
 updatedAt: string;
}

interface DBNotification {
 id: string;
 userId: string;
 type: 'dip_request' | 'dip_result' | 'war_alert' | 'system';
 title: string;
 content: string;
 relatedNationId?: string;
 relatedNationName?: string;
 relatedRequestId?: string;
 isRead: boolean;
 createdAt: string;
}

interface DatabaseSchema {
 lastCombatTickAt?: number;
 users: DBUser[];
 nations: DBNation[];
 diplomaticRequests: DBDiplomaticRequest[];
 notifications: DBNotification[];
}

// ---------------------------------------------------------------------------
// Seed data (mirrors server/db.ts getInitialData)
// ---------------------------------------------------------------------------

function getInitialData(): DatabaseSchema {
 return {
  users: [],
  nations: [],
  diplomaticRequests: [],
  notifications: [],
 };
}

/**
 * Removes any legacy seeded demo users/nations (and their related diplomatic
 * requests & notifications) that may still linger in previously-persisted
 * remote/local databases.
 */
function stripLegacyDemoData(db: DatabaseSchema): DatabaseSchema {
 const users = (db.users || []).filter((u) => !LEGACY_DEMO_USER_IDS.has(u.id));
 const nations = (db.nations || []).filter(
  (n) => !LEGACY_DEMO_NATION_IDS.has(n.id) && !LEGACY_DEMO_USER_IDS.has(n.ownerId)
 );
 const diplomaticRequests = (db.diplomaticRequests || []).filter(
  (r) =>
   !LEGACY_DEMO_NATION_IDS.has(r.senderNationId) &&
   !LEGACY_DEMO_NATION_IDS.has(r.receiverNationId) &&
   !LEGACY_DEMO_USER_IDS.has(r.senderOwnerId) &&
   !LEGACY_DEMO_USER_IDS.has(r.receiverOwnerId)
 );
 const notifications = (db.notifications || []).filter(
  (n) => !LEGACY_DEMO_USER_IDS.has(n.userId) && !(n.relatedNationId && LEGACY_DEMO_NATION_IDS.has(n.relatedNationId))
 );
 return { users, nations, diplomaticRequests, notifications };
}

function isDatabase(value: unknown): value is DatabaseSchema {
 if (!value || typeof value !== 'object') return false;
 const candidate = value as Partial<DatabaseSchema>;
 return Array.isArray(candidate.users) && Array.isArray(candidate.nations);
}

function newest<RecordType extends { id: string }>(
 local: RecordType[],
 remote: RecordType[],
 timestamp: (value: RecordType) => string | undefined
): RecordType[] {
 const merged = new Map<string, RecordType>();
 for (const record of [...remote, ...local]) {
  const current = merged.get(record.id);
  if (!current || Date.parse(timestamp(record) || '') >= Date.parse(timestamp(current) || '')) {
   merged.set(record.id, record);
  }
 }
 return [...merged.values()];
}

/**
 * A database is one shared remote document. Never replace it with the data in
 * a single browser: that used to make whichever client saved last hide every
 * country it had not loaded yet. Merge records by id and keep the newer record
 * for editable entities, while retaining all independently-created records.
 */
function mergeDatabases(local: DatabaseSchema, remote: DatabaseSchema): DatabaseSchema {
 return stripLegacyDemoData({
  users: newest(local.users || [], remote.users || [], (user) => user.createdAt),
  nations: newest(local.nations || [], remote.nations || [], (nation) => nation.updatedAt || nation.createdAt),
  diplomaticRequests: newest(
   local.diplomaticRequests || [],
   remote.diplomaticRequests || [],
   (request) => request.updatedAt || request.createdAt
  ),
  notifications: newest(local.notifications || [], remote.notifications || [], (notification) => notification.createdAt),
 });
}


class ClientDatabase {
 private data: DatabaseSchema;
 private remoteHydrated = false;
 private hydrationPromise: Promise<void> | null = null;
 // Whether the most recent remote hydration attempt actually reached the
 // shared store. A `false` value means we are running on the local cache only
 // and therefore cannot positively confirm that a token is invalid.
 remoteSyncOk = false;

 constructor() {
  const raw = localStorage.getItem(DB_KEY);
  if (raw) {
   try {
    const parsed = JSON.parse(raw);
    this.data = isDatabase(parsed) ? stripLegacyDemoData(parsed) : getInitialData();
   } catch {
    this.data = getInitialData();
   }
  } else {
   this.data = getInitialData();
  }
  localStorage.setItem(DB_KEY, JSON.stringify(this.data));
 }

 save() {
  try {
   localStorage.setItem(DB_KEY, JSON.stringify(this.data));
   if (this.remoteHydrated) {
    void this.persistRemote().catch((error) => console.warn('Remote database persistence failed.', error));
   }
  } catch (err) {
   console.error('Failed to persist client database:', err);
  }
 }

 private async persistRemote() {
  const localSnapshot = this.data;

  // A single read-merge-write round-trip. `updateSection` already re-reads the
  // latest remote document inside a serialized write queue, so the union is
  // computed against current remote data without the extra confirm-read and
  // retry loop that previously quadrupled the request volume per save (a
  // major source of aborted connections / broken-pipe errors in the logs).
  const merged = await remoteState.updateSection<DatabaseSchema>('database', (remoteDatabase) => {
   const remote = isDatabase(remoteDatabase) ? remoteDatabase : getInitialData();
   return mergeDatabases(localSnapshot, remote);
  });

  if (isDatabase(merged)) {
   this.data = mergeDatabases(this.data, merged);
   localStorage.setItem(DB_KEY, JSON.stringify(this.data));
  }
 }

 hydrateRemote(force = false) {
  // Reuse an in-flight hydration even when a fresh read is requested. Every
  // API call forces a refresh, so without this the initial page load fires
  // several redundant, overlapping GETs that abort each other and surface as
  // "connection closed before message completed" in the edge function logs.
  if (this.hydrationPromise) return this.hydrationPromise;
  const hydrate = async () => {
   try {
    const remoteDatabase = await remoteState.readSection<DatabaseSchema>('database', { fresh: force });
    if (isDatabase(remoteDatabase)) {
     this.data = mergeDatabases(this.data, remoteDatabase);
     localStorage.setItem(DB_KEY, JSON.stringify(this.data));
    } else if (!this.remoteHydrated && this.data.users.length + this.data.nations.length > 0) {
     // Only seed an absent remote store with meaningful existing local
     // data. A brand-new empty tab must never erase the shared world.
     await this.persistRemote();
    }
    this.remoteHydrated = true;
    this.remoteSyncOk = true;
   } catch (error) {
    // The shared store was unreachable. Keep the local cache and remember
    // that we could not confirm remote state for this request.
    this.remoteSyncOk = false;
    throw error;
   }
  };

  this.hydrationPromise = hydrate().finally(() => {
   if (this.hydrationPromise) this.hydrationPromise = null;
  });
  return this.hydrationPromise;
 }

 // Users
 getUsers() {
  return this.data.users;
 }
 findUserById(id: string) {
  return this.data.users.find((u) => u.id === id);
 }
 findUserByUsername(username: string) {
  const q = username.toLowerCase().trim();
  return this.data.users.find(
   (u) => u.username.toLowerCase() === q || (u.douyinName && u.douyinName.toLowerCase() === q)
  );
 }
 findUserByDouyinName(douyinName: string) {
  const q = douyinName.toLowerCase().trim();
  return this.data.users.find(
   (u) => (u.douyinName && u.douyinName.toLowerCase() === q) || u.username.toLowerCase() === q
  );
 }
 createUser(user: DBUser) {
  this.data.users.push(user);
  this.save();
  return user;
 }
 updateUser(id: string, updates: Partial<DBUser>) {
  const idx = this.data.users.findIndex((u) => u.id === id);
  if (idx === -1) return undefined;
  this.data.users[idx] = { ...this.data.users[idx], ...updates };
  this.save();
  return this.data.users[idx];
 }

 // Nations
 getNations() {
  return this.data.nations;
 }
 findNationById(id: string) {
  return this.data.nations.find((n) => n.id === id);
 }
 findNationByOwnerId(ownerId: string) {
  return this.data.nations.find((n) => n.ownerId === ownerId);
 }
 createNation(nation: DBNation) {
  this.data.nations.push(nation);
  this.save();
  return nation;
 }
 updateNation(id: string, updates: Partial<DBNation>) {
  const idx = this.data.nations.findIndex((n) => n.id === id);
  if (idx === -1) return undefined;
  this.data.nations[idx] = {
   ...this.data.nations[idx],
   ...updates,
   updatedAt: new Date().toISOString(),
  };
  this.save();
  return this.data.nations[idx];
 }
 deleteNation(id: string) {
  const idx = this.data.nations.findIndex((n) => n.id === id);
  if (idx === -1) return false;
  const nation = this.data.nations[idx];

  this.data.diplomaticRequests = this.data.diplomaticRequests.map((req) => {
   if (req.senderNationId === id || req.receiverNationId === id) {
    return { ...req, status: 'terminated' as const, updatedAt: new Date().toISOString() };
   }
   return req;
  });

  const activeReqs = this.data.diplomaticRequests.filter(
   (r) => (r.senderNationId === id || r.receiverNationId === id) && r.status === 'accepted'
  );
  activeReqs.forEach((r) => {
   const otherOwnerId = r.senderNationId === id ? r.receiverOwnerId : r.senderOwnerId;
   this.createNotification({
    id: 'notif_' + Math.random().toString(36).substring(2, 9),
    userId: otherOwnerId,
    type: 'system',
    title: '条约终止通知',
    content: `由于【${nation.name}】已宣告解散，双方签署的相关外交条约已自动失效。`,
    isRead: false,
    createdAt: new Date().toISOString(),
   });
  });

  this.data.nations.splice(idx, 1);
  this.save();
  return true;
 }

 // Diplomacy
 getDiplomaticRequests() {
  return this.data.diplomaticRequests;
 }
 findDiplomaticRequestById(id: string) {
  return this.data.diplomaticRequests.find((r) => r.id === id);
 }
 createDiplomaticRequest(req: DBDiplomaticRequest) {
  this.data.diplomaticRequests.push(req);
  this.save();
  return req;
 }
 updateDiplomaticRequest(id: string, updates: Partial<DBDiplomaticRequest>) {
  const idx = this.data.diplomaticRequests.findIndex((r) => r.id === id);
  if (idx === -1) return undefined;
  this.data.diplomaticRequests[idx] = {
   ...this.data.diplomaticRequests[idx],
   ...updates,
   updatedAt: new Date().toISOString(),
  };
  this.save();
  return this.data.diplomaticRequests[idx];
 }

 // Notifications
 getNotifications(userId: string) {
  return this.data.notifications
   .filter((n) => n.userId === userId)
   .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
 }
 createNotification(notif: DBNotification) {
  this.data.notifications.push(notif);
  this.save();
  return notif;
 }
 markNotificationAsRead(id: string, userId: string) {
  const notif = this.data.notifications.find((n) => n.id === id && n.userId === userId);
  if (!notif) return false;
  notif.isRead = true;
  this.save();
  return true;
 }
 markAllNotificationsAsRead(userId: string) {
  let count = 0;
  this.data.notifications.forEach((n) => {
   if (n.userId === userId && !n.isRead) {
    n.isRead = true;
    count++;
   }
  });
  if (count > 0) this.save();
  return count;
 }
 deleteNotification(id: string, userId: string) {
  const idx = this.data.notifications.findIndex((n) => n.id === id && n.userId === userId);
  if (idx === -1) return false;
  this.data.notifications.splice(idx, 1);
  this.save();
  return true;
 }

 // Showcase Demo Data Methods (Temporary for Testing)
 loadShowcaseDemoData() {
  const existingUserIds = new Set(this.data.users.map((u) => u.id));
  for (const u of DEMO_SHOWCASE_USERS) {
   if (!existingUserIds.has(u.id)) {
    this.data.users.push({
     id: u.id,
     username: u.username,
     password: 'demo1234',
     douyinName: u.douyinName,
     role: u.role,
     avatarColor: u.avatarColor || '#6366f1',
     isLingyuBaby: !!u.isLingyuBaby,
     createdAt: u.createdAt,
    });
   }
  }
  const existingNationIds = new Set(this.data.nations.map((n) => n.id));
  for (const n of DEMO_SHOWCASE_NATIONS) {
   if (!existingNationIds.has(n.id)) {
    this.data.nations.push(n as unknown as DBNation);
   }
  }
  this.save();
  return { usersCount: DEMO_SHOWCASE_USERS.length, nationsCount: DEMO_SHOWCASE_NATIONS.length };
 }

 clearShowcaseDemoData() {
  const demoUserIds = new Set(DEMO_SHOWCASE_USERS.map((u) => u.id));
  const demoNationIds = new Set(DEMO_SHOWCASE_NATIONS.map((n) => n.id));
  this.data.users = this.data.users.filter((u) => !demoUserIds.has(u.id));
  this.data.nations = this.data.nations.filter((n) => !demoNationIds.has(n.id));
  this.data.diplomaticRequests = this.data.diplomaticRequests.filter(
   (r) => !demoNationIds.has(r.senderNationId) && !demoNationIds.has(r.receiverNationId)
  );
  this.save();
  return true;
 }
}

const db = new ClientDatabase();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

class ApiError extends Error {}

const AVATAR_COLORS = [
 '#6366f1', '#ec4899', '#10b981', '#f59e0b',
 '#3b82f6', '#8b5cf6', '#ef4444', '#14b8a6',
];

const DIPLOMACY_TYPE_NAMES: Record<string, string> = {
 peace: '和平条约',
 mutual_defense: '共同防御与互保条约',
 armistice: '停战协定',
 military_access: '军事通行权',
 embassy: '常驻使馆申请',
 war: '宣战令',
};

function publicUser(u: DBUser): User {
 return {
  id: u.id,
  username: u.role === 'admin' ? ADMIN_DISPLAY_NAME : u.username,
  douyinName: u.douyinName,
  role: u.role,
  avatarColor: u.avatarColor,
  avatarUrl: u.avatarUrl,
  avatarEmoji: u.avatarEmoji,
  isLingyuBaby: u.isLingyuBaby,
  createdAt: u.createdAt,
 } as User;
}

function enrichNation(nation: DBNation): Nation {
 const requests = db.getDiplomaticRequests();

 const activeWars = requests
  .filter(
   (r) =>
    r.type === 'war' &&
    r.status === 'active' &&
    (r.senderNationId === nation.id || r.receiverNationId === nation.id)
  )
  .map((r) => {
   const isSender = r.senderNationId === nation.id;
   return {
    withNationId: isSender ? r.receiverNationId : r.senderNationId,
    withNationName: isSender ? r.receiverNationName : r.senderNationName,
    initiatedByMe: isSender,
    since: r.createdAt,
   };
  });

 const activeTreaties = requests
  .filter(
   (r) =>
    r.status === 'accepted' &&
    r.type !== 'war' &&
    (r.senderNationId === nation.id || r.receiverNationId === nation.id)
  )
  .map((r) => {
   const isSender = r.senderNationId === nation.id;
   return {
    id: r.id,
    withNationId: isSender ? r.receiverNationId : r.senderNationId,
    withNationName: isSender ? r.receiverNationName : r.senderNationName,
    type: r.type,
    since: r.updatedAt,
   };
  });

 return { ...nation, activeWars, activeTreaties } as unknown as Nation;
}

/** Normalize a province identifier for cross-nation comparison. */
function provinceKeys(prov: any): string[] {
 const keys: string[] = [];
 if (prov?.id !== undefined && prov?.id !== null && String(prov.id).trim() !== '') {
  keys.push('id:' + String(prov.id).trim());
 }
 if (prov?.name && String(prov.name).trim() !== '') {
  keys.push('name:' + String(prov.name).trim().toLowerCase());
 }
 return keys;
}

/**
 * First-come-first-served enforcement: given a set of candidate provinces,
 * return the first one that is already owned by a DIFFERENT nation, together
 * with the occupying nation. Returns null when there is no conflict.
 */
function findProvinceConflict(
 candidateProvinces: any[],
 excludeNationId?: string
): { province: any; occupiedBy: DBNation } | null {
 if (!Array.isArray(candidateProvinces) || candidateProvinces.length === 0) return null;

 // Build an index of every province key already claimed by other nations.
 const claimed = new Map<string, DBNation>();
 for (const nation of db.getNations()) {
  if (excludeNationId && nation.id === excludeNationId) continue;
  for (const prov of nation.provinces || []) {
   for (const key of provinceKeys(prov)) {
    if (!claimed.has(key)) claimed.set(key, nation);
   }
  }
 }

 for (const prov of candidateProvinces) {
  for (const key of provinceKeys(prov)) {
   const occupiedBy = claimed.get(key);
   if (occupiedBy) return { province: prov, occupiedBy };
  }
 }
 return null;
}

/** Resolve the currently authenticated user from the stored token. */
function currentUser(): DBUser {
 const token = tokenStorage.get();
 const user = token ? db.findUserById(token) : undefined;
 if (!user) throw new ApiError('登录状态已过期或无效，请重新登录');
 return user;
}

/** Simulate network latency + async so callers keep their Promise contract. */
async function resolve<T>(fn: () => T, options?: { hydrate?: boolean }): Promise<T> {
 // Most routes refresh the shared store before reading or mutating it. The
 // lobby's initial cache pass is the exception: it renders immediately from
 // localStorage, then requests the remote archive in the background.
 if (options?.hydrate !== false) {
  try {
   await db.hydrateRemote(true);
  } catch (error) {
   console.warn('Unable to refresh shared database; using the local cache for this request.', error);
  }
 }
 await new Promise((done) => setTimeout(done, 120));
 return fn();
}

// ---------------------------------------------------------------------------
// API (mirrors server routes)
// ---------------------------------------------------------------------------

export const api = {
 auth: {
  register: (payload: {
   username?: string;
   password?: string;
   douyinName?: string;
   avatarColor?: string;
   avatarUrl?: string;
   avatarEmoji?: string;
   isLingyuBaby?: boolean;
   adminPassword?: string;
  }) =>
   (async () => {
    const douyin = (payload.douyinName || payload.username || '').trim();
    if (!douyin || douyin.length < 2) throw new ApiError('抖音用户名至少需要2个字符');
    if (!payload.password || payload.password.length < 4) throw new ApiError('密码至少需要4位字符');
    try {
     await claimDailyRegistrationSlot();
    } catch (e: any) {
     console.warn('Registration slot check deferred/skipped:', e);
    }
    return resolve<AuthResponse>(() => {
    const { password, isLingyuBaby, adminPassword, avatarColor, avatarUrl, avatarEmoji } = payload;
    if (!douyin || douyin.length < 2) throw new ApiError('抖音用户名至少需要2个字符');
    if (!password || password.length < 4) throw new ApiError('密码至少需要4位字符');

    if (db.findUserByDouyinName(douyin)) {
     throw new ApiError('该抖音用户名已被注册，请直接登录');
    }

    const newUser = db.createUser({
     id: 'usr_' + Math.random().toString(36).substring(2, 11),
     username: douyin,
     password,
     douyinName: douyin,
     role: adminPassword === ADMIN_ACCESS_PASSWORD ? 'admin' : 'user',
     avatarColor: avatarColor || AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
     avatarUrl: avatarUrl || undefined,
     avatarEmoji: avatarEmoji || undefined,
     isLingyuBaby: Boolean(isLingyuBaby),
     createdAt: new Date().toISOString(),
    });

    const myNation = db.findNationByOwnerId(newUser.id);
    return {
     message: '注册成功并已自动登录',
     token: newUser.id,
     user: publicUser(newUser),
     myNation: myNation ? enrichNation(myNation) : null,
    } as AuthResponse;
    });
   })(),

  login: (payload: { username?: string; douyinName?: string; password?: string }) =>
   resolve<AuthResponse>(() => {
    const loginIdentifier = (payload.douyinName || payload.username || '').trim();
    const password = payload.password;
    if (!loginIdentifier || !password) throw new ApiError('请输入抖音用户名和密码');

    const user = db.findUserByDouyinName(loginIdentifier);
    if (!user || user.password !== password) {
      throw new ApiError('抖音用户名或密码不正确');
    }

    const myNation = db.findNationByOwnerId(user.id);
    return {
     message: '登录成功',
     token: user.id,
     user: publicUser(user),
     myNation: myNation ? enrichNation(myNation) : null,
    } as AuthResponse;
   }),

  quickGuestLogin: (customName?: string) =>
   resolve<AuthResponse>(() => {
    const guestSuffix = Math.floor(1000 + Math.random() * 9000);
    const username = customName || `领主·战略试玩员${guestSuffix}`;
    const existing = db.findUserByUsername(username);
    let user = existing;
    if (!user) {
     user = db.createUser({
      id: 'usr_guest_' + Math.random().toString(36).substring(2, 9),
      username,
      password: 'guestPassword123',
      douyinName: `${username}_抖音`,
      role: 'user',
      avatarColor: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
      isLingyuBaby: true,
      createdAt: new Date().toISOString(),
     });
    }
    const myNation = db.findNationByOwnerId(user.id);
    return {
     message: '试玩体验领主已登录',
     token: user.id,
     user: publicUser(user),
     myNation: myNation ? enrichNation(myNation) : null,
    } as AuthResponse;
   }),

  me: () =>
   resolve<{ user: User; myNation: Nation | null }>(() => {
    const token = tokenStorage.get();
    const user = token ? db.findUserById(token) : undefined;
    if (!user) {
     // Only declare the session invalid when we actually reached the
     // shared store and confirmed the account is gone. If the remote sync
     // failed (offline, aborted request), this is a recoverable error and
     // must NOT trigger a logout during a browser refresh.
     if (!db.remoteSyncOk) {
      throw new ApiError('暂时无法连接到远程存档服务，请稍后重试');
     }
     throw new ApiError('登录状态已过期或无效，请重新登录');
    }
    const myNation = db.findNationByOwnerId(user.id);
    return { user: publicUser(user), myNation: myNation ? enrichNation(myNation) : null };
   }),

  updateProfile: (payload: { douyinName?: string; newPassword?: string }) =>
   resolve<{ message: string; user: User; myNation: Nation | null }>(() => {
    const user = currentUser();
    const updates: Partial<DBUser> = {};
    if (payload.douyinName) {
     updates.douyinName = payload.douyinName.trim();
     const myNation = db.findNationByOwnerId(user.id);
     if (myNation) db.updateNation(myNation.id, { ownerDouyinName: payload.douyinName.trim() });
    }
    if (payload.newPassword && payload.newPassword.length >= 4) {
     updates.password = payload.newPassword;
    }
    const updatedUser = db.updateUser(user.id, updates);
    if (!updatedUser) throw new ApiError('用户未找到');
    const myNation = db.findNationByOwnerId(updatedUser.id);
    return {
     message: '资料更新成功',
     user: publicUser(updatedUser),
     myNation: myNation ? enrichNation(myNation) : null,
    };
   }),

  toggleAdminRole: () =>
   resolve<{ message: string; role: 'user' | 'admin'; user: User }>(() => {
    const user = currentUser();
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    const updatedUser = db.updateUser(user.id, { role: newRole })!;
    return {
     message: newRole === 'admin' ? '已切换至管理员模式' : '已切换为普通用户模式',
     role: newRole,
     user: publicUser(updatedUser),
    };
   }),

  verifyAdminPassword: (adminPassword: string) =>
   resolve<{ message: string; user: User }>(() => {
    if (adminPassword !== ADMIN_ACCESS_PASSWORD) {
     throw new ApiError('管理员密码不正确');
    }
    let user: DBUser | undefined;
    const token = tokenStorage.get();
    if (token) {
     user = db.findUserById(token);
    }
    if (user) {
     const updatedUser = db.updateUser(user.id, { role: 'admin' })!;
     return {
      message: '管理员最高权限已成功激活！',
      user: publicUser(updatedUser),
     };
    } else {
     let adminUser = db.findUserByDouyinName('大玲玉之光_Official');
     if (!adminUser) {
      adminUser = db.createUser({
       id: 'usr_admin_master',
       username: '大玲玉之光_Official',
       password: 'adminPassword123',
       douyinName: '大玲玉之光_Official',
       role: 'admin',
       avatarColor: '#4f46e5',
       isLingyuBaby: true,
       createdAt: new Date().toISOString(),
      });
     } else {
      adminUser = db.updateUser(adminUser.id, { role: 'admin' })!;
     }
     tokenStorage.set(adminUser.id);
     return {
      message: '已成功以最高管理员身份登录！',
      user: publicUser(adminUser),
     };
    }
   }),
 },

 nations: {
  list: (
   params?: { search?: string; regime?: string; ideology?: string },
   options?: { localOnly?: boolean }
  ) =>
   resolve<{ nations: Nation[]; total: number }>(() => {
    let nations = db.getNations();
    const { search, regime, ideology } = params || {};

    if (search) {
     const q = search.toLowerCase().trim();
     nations = nations.filter(
      (n) =>
       n.name.toLowerCase().includes(q) ||
       n.capital.toLowerCase().includes(q) ||
       n.territory.toLowerCase().includes(q) ||
       n.ownerUsername.toLowerCase().includes(q) ||
       n.ownerDouyinName.toLowerCase().includes(q)
     );
    }
    if (regime && regime !== 'all') nations = nations.filter((n) => n.regime === regime);
    if (ideology && ideology !== 'all') nations = nations.filter((n) => n.ideology === ideology);

    const enriched = nations.map(enrichNation);
    return { nations: enriched, total: enriched.length };
   }, { hydrate: !options?.localOnly }),

  getById: (id: string) =>
   resolve<{ nation: Nation }>(() => {
    const nation = db.findNationById(id);
    if (!nation) throw new ApiError('未找到指定国家');
    return { nation: enrichNation(nation) };
   }),

  create: (payload: Partial<Nation>) =>
   resolve<{ message: string; nation: Nation }>(() => {
    const user = currentUser();
    const existing = db.findNationByOwnerId(user.id);
    if (existing) {
     throw new ApiError(
      `您已宣告过国家【${existing.name}】，根据地缘法典，每个领主仅限宣告并统治一个国家！`
     );
    }

    const p = payload as any;
    if (!p.name || String(p.name).trim().length === 0) throw new ApiError('请填写国家名称');
    if (!p.capital || String(p.capital).trim().length === 0) throw new ApiError('请填写首都名称');
    if (
     (!p.territory || String(p.territory).trim().length === 0) &&
     (!p.provinces || p.provinces.length === 0)
    ) {
     throw new ApiError('请选择或填写国家疆域描述');
    }
    const maxAllowedProvinces = user.isLingyuBaby ? 11 : 10;
    if (Array.isArray(p.provinces) && p.provinces.length > maxAllowedProvinces) {
     throw new ApiError(`最多只能选择 ${maxAllowedProvinces} 个省份作为建国初始领土`);
    }

    // First-come-first-served: reject provinces already claimed by another nation.
    if (Array.isArray(p.provinces)) {
     const conflict = findProvinceConflict(p.provinces);
     if (conflict) {
      throw new ApiError(
       `省份【${conflict.province?.name || '未知'}】已被【${conflict.occupiedBy.name}】占领，根据先来后到原则，请选择其他未被占领的疆域！`
      );
     }

     // 核心判定：建国所选省份必须全部相邻且连通一体
     if (p.provinces.length > 1) {
      const contiguity = checkProvincesContiguity(p.provinces);
      if (!contiguity.isContiguous) {
       throw new ApiError(
        contiguity.message || '建国时所选省份必须相邻且连成一体！'
       );
      }
     }
    }

    const coords: [number, number] =
     Array.isArray(p.mapCoordinates) && p.mapCoordinates.length === 2
      ? [Number(p.mapCoordinates[0]), Number(p.mapCoordinates[1])]
      : [Math.random() * 240 - 120, Math.random() * 100 - 40];

    const computedTerritory = p.territory
     ? String(p.territory).trim()
     : (p.provinces || []).map((pr: any) => pr.name).join('、');

    const MAJOR_IDEOLOGY_KEYS: ('communist' | 'fascist' | 'democratic' | 'neutral')[] = [
     'communist',
     'fascist',
     'democratic',
     'neutral',
     ];
    // 用户指定或默认执政党
    const rulingPartyKey: ('communist' | 'fascist' | 'democratic' | 'neutral') =
     p.rulingPartyId && MAJOR_IDEOLOGY_KEYS.includes(p.rulingPartyId)
      ? p.rulingPartyId
      : 'neutral';

    const partyNames = {
     communist: p.partyNames?.communist?.trim() || '人民劳动共产党',
     fascist: p.partyNames?.fascist?.trim() || '国家复兴法西斯党',
     democratic: p.partyNames?.democratic?.trim() || '自由民主进步同盟',
     neutral: p.partyNames?.neutral?.trim() || '国家中立同盟阵线',
    };

    // 执政党的初始支持率为 45%~70%
    const rulingSupport = Math.floor(Math.random() * (70 - 45 + 1)) + 45;
    const remaining = 100 - rulingSupport;

    // 剩余支持率由其它三大政党随机分配 (总和严格为 100%)
    const otherKeys = MAJOR_IDEOLOGY_KEYS.filter((k) => k !== rulingPartyKey);
    const cut1 = Math.floor(Math.random() * (remaining + 1));
    const cut2 = Math.floor(Math.random() * (remaining + 1));
    const [lowCut, highCut] = cut1 < cut2 ? [cut1, cut2] : [cut2, cut1];

    const partySupportMap: Record<string, number> = {
     [rulingPartyKey]: rulingSupport,
     [otherKeys[0]]: lowCut,
     [otherKeys[1]]: highCut - lowCut,
     [otherKeys[2]]: remaining - highCut,
    };

    const partySupport: { communist: number; fascist: number; democratic: number; neutral: number } = {
     communist: partySupportMap.communist ?? 0,
     fascist: partySupportMap.fascist ?? 0,
     democratic: partySupportMap.democratic ?? 0,
     neutral: partySupportMap.neutral ?? 0,
    };

    const ideologyNameMap: Record<string, string> = {
     communist: '共产主义',
     fascist: '法西斯主义',
     democratic: '自由民主主义',
     neutral: '中立主义',
    };

    const partyNameZhMap: Record<string, string> = {
     communist: partyNames.communist,
     fascist: partyNames.fascist,
     democratic: partyNames.democratic,
     neutral: partyNames.neutral,
    };

    const chosenIdeologyName = ideologyNameMap[rulingPartyKey] || '中立主义';
    const chosenRulingPartyTitle = partyNameZhMap[rulingPartyKey];

    const foundingProvinces = (Array.isArray(p.provinces) ? p.provinces : []).map((prov: any) => ({
     ...prov,
     isCore: true,
     acquiredMethod: 'founding',
     occupationStatus: 'peace',
    }));

    const newNation: DBNation = {
     id: 'nat_' + Math.random().toString(36).substring(2, 11),
     ownerId: user.id,
     ownerUsername: user.username,
     ownerDouyinName: user.douyinName,
     name: String(p.name).trim(),
     capital: String(p.capital).trim(),
     territory: computedTerritory,
     provinces: foundingProvinces,
     description: p.description ? String(p.description).trim() : '暂无详细国家简介。',
     regime: p.regime || '君主立宪制',
     ideology: chosenIdeologyName as any,
     language: p.language ? String(p.language).trim() : '汉语',
     currency: p.currency ? String(p.currency).trim() : '玲玉币',
     currencyRate: typeof p.currencyRate === 'number' && p.currencyRate > 0 ? p.currencyRate : 1,
     flagColor: p.flagColor || '#6366f1',
     emblemIcon: p.emblemIcon || 'Crown',
     createdAt: new Date().toISOString(),
     updatedAt: new Date().toISOString(),
     mapCoordinates: coords,
     partyNames,
     rulingPartyId: rulingPartyKey,
     partySupport,
     civilWarStatus: 'peace',
     electionsHeldCount: 0,
     coupsAttemptedCount: 0,
    };

    db.createNation(newNation);
    db.createNotification({
     id: 'notif_' + Math.random().toString(36).substring(2, 9),
     userId: user.id,
     type: 'system',
     title: '建国大典顺利完成',
     content: `恭喜领主【${user.username}】！您宣告的【${newNation.name}】正式建国！执政党确立为【${chosenRulingPartyTitle}】（${chosenIdeologyName}），初始民意支持率为 ${rulingSupport}%，其余在野党席位已由民意随机配额。`,
     relatedNationId: newNation.id,
     relatedNationName: newNation.name,
     isRead: false,
     createdAt: new Date().toISOString(),
    });

    return { message: `国家【${newNation.name}】宣告成功！执政党随机确立为【${chosenRulingPartyTitle}】（支持率 100%）`, nation: enrichNation(newNation) };
   }),

  update: (id: string, payload: Partial<Nation>) =>
   resolve<{ message: string; nation: Nation }>(() => {
    const user = currentUser();
    const nation = db.findNationById(id);
    if (!nation) throw new ApiError('未找到指定国家');
    if (nation.ownerId !== user.id && user.role !== 'admin') {
     throw new ApiError('您无权编辑其他领主的国家');
    }

    const p = payload as any;
    const updates: Partial<DBNation> = {};
    if (p.name) updates.name = String(p.name).trim();
    if (p.capital) updates.capital = String(p.capital).trim();
    if (p.territory) updates.territory = String(p.territory).trim();
    if (Array.isArray(p.provinces)) {
     // First-come-first-served: reject provinces already owned by another nation.
     const conflict = findProvinceConflict(p.provinces, id);
     if (conflict) {
      throw new ApiError(
       `省份【${conflict.province?.name || '未知'}】已被【${conflict.occupiedBy.name}】占领，无法并入本国疆域！`
      );
     }
     updates.provinces = p.provinces;
    }
    if (p.militaryIndustry !== undefined) updates.militaryIndustry = p.militaryIndustry;
    if (p.army !== undefined) updates.army = p.army;
    if (p.radarTech !== undefined) updates.radarTech = p.radarTech;
    if (p.constructionQueue !== undefined) updates.constructionQueue = p.constructionQueue;
    if (Array.isArray(p.researchedTechIds)) updates.researchedTechIds = p.researchedTechIds;
    if (Array.isArray(p.activeResearchProjects)) updates.activeResearchProjects = p.activeResearchProjects;
    if (typeof p.unlockedResearchSlots === 'number') updates.unlockedResearchSlots = p.unlockedResearchSlots;
    if (p.economy !== undefined) updates.economy = p.economy;
    if (Array.isArray(p.activeDecreeIds)) updates.activeDecreeIds = p.activeDecreeIds;
    if (p.ministers && typeof p.ministers === 'object') updates.ministers = p.ministers;
    if (typeof p.stabilityIndex === 'number') updates.stabilityIndex = p.stabilityIndex;
    if (typeof p.popularApproval === 'number') updates.popularApproval = p.popularApproval;
    if (typeof p.allianceId === 'string') updates.allianceId = p.allianceId;
    if (Array.isArray(p.embassies)) updates.embassies = p.embassies;
    if (Array.isArray(p.activeWars)) updates.activeWars = p.activeWars;
    if (Array.isArray(p.activeTreaties)) updates.activeTreaties = p.activeTreaties;
    if (Array.isArray(p.occupiedProvinces)) updates.occupiedProvinces = p.occupiedProvinces;
    if (Array.isArray(p.activeSanctionsEnforced)) updates.activeSanctionsEnforced = p.activeSanctionsEnforced;
    if (Array.isArray(p.unlockedMedalIds)) updates.unlockedMedalIds = p.unlockedMedalIds;
    if (typeof p.nationalAnthem === 'string') updates.nationalAnthem = p.nationalAnthem;
    if (typeof p.nationalMotto === 'string') updates.nationalMotto = p.nationalMotto;
    if (Array.isArray(p.chronicles)) updates.chronicles = p.chronicles;
    if (typeof p.currencySymbol === 'string') updates.currencySymbol = p.currencySymbol;
    if (typeof p.taxRate === 'number') updates.taxRate = p.taxRate;
    if (p.description !== undefined) updates.description = String(p.description).trim();
    if (p.regime) updates.regime = p.regime;
    if (p.ideology) updates.ideology = p.ideology;
    if (p.language) updates.language = String(p.language).trim();
    if (p.currency) updates.currency = String(p.currency).trim();
    if (typeof p.currencyRate === 'number' && p.currencyRate > 0) updates.currencyRate = p.currencyRate;
    if (p.flagColor) updates.flagColor = p.flagColor;
    if (p.emblemIcon) updates.emblemIcon = p.emblemIcon;
    if (p.partyNames && typeof p.partyNames === 'object') updates.partyNames = p.partyNames;
    if (p.rulingPartyId) updates.rulingPartyId = p.rulingPartyId;
    if (p.partySupport && typeof p.partySupport === 'object') updates.partySupport = p.partySupport;
    if (p.civilWarStatus) updates.civilWarStatus = p.civilWarStatus;
    if (typeof p.electionsHeldCount === 'number') updates.electionsHeldCount = p.electionsHeldCount;
    if (typeof p.coupsAttemptedCount === 'number') updates.coupsAttemptedCount = p.coupsAttemptedCount;
    if (p.lastElectionAt) updates.lastElectionAt = p.lastElectionAt;
    if (p.lastCoupAt) updates.lastCoupAt = p.lastCoupAt;
    if (Array.isArray(p.mapCoordinates) && p.mapCoordinates.length === 2) {
     updates.mapCoordinates = [Number(p.mapCoordinates[0]), Number(p.mapCoordinates[1])];
    }

    const updated = db.updateNation(id, updates)!;
    return { message: '国家信息修改成功', nation: enrichNation(updated) };
   }),

  holdElection: (id: string) =>
   resolve<{ message: string; nation: Nation; winnerParty: string; victoryMargin: number }>(() => {
    const user = currentUser();
    const nation = db.findNationById(id);
    if (!nation) throw new ApiError('未找到指定国家');
    if (nation.ownerId !== user.id && user.role !== 'admin') throw new ApiError('无权操作该国家');

    const partyNames = nation.partyNames || {
     communist: '人民劳动共产党',
     fascist: '国家复兴法西斯党',
     democratic: '自由民主进步同盟',
     neutral: '国家中立同盟阵线',
    };
    const currentSupport = {
     communist: nation.partySupport?.communist ?? 0,
     fascist: nation.partySupport?.fascist ?? 0,
     democratic: nation.partySupport?.democratic ?? 0,
     neutral: nation.partySupport?.neutral ?? 100,
    };

    // Calculate election outcome
    const keys: ('communist' | 'fascist' | 'democratic' | 'neutral')[] = ['communist', 'fascist', 'democratic', 'neutral'];
    // Popular vote calculation with slight public opinion sway (+/- 5%)
    let maxSupport = -1;
    let winner: 'communist' | 'fascist' | 'democratic' | 'neutral' = nation.rulingPartyId || 'neutral';

    keys.forEach((k) => {
     if (currentSupport[k] > maxSupport) {
      maxSupport = currentSupport[k];
      winner = k;
     }
    });

    const ideologyMap: Record<string, string> = {
     communist: '共产主义',
     fascist: '法西斯主义',
     democratic: '自由民主主义',
     neutral: '中立主义',
    };

    const winnerPartyTitle = partyNames[winner];
    const previousRuling = nation.rulingPartyId;
    const isTransferOfPower = previousRuling !== winner;

    const updates: Partial<DBNation> = {
     rulingPartyId: winner,
     ideology: ideologyMap[winner],
     electionsHeldCount: (nation.electionsHeldCount || 0) + 1,
     lastElectionAt: new Date().toISOString(),
     stabilityIndex: Math.min(100, Math.max(20, (nation.stabilityIndex ?? 80) + (isTransferOfPower ? 5 : 2))),
    };

    const updated = db.updateNation(id, updates)!;

    db.createNotification({
     id: 'notif_' + Math.random().toString(36).substring(2, 9),
     userId: user.id,
     type: 'system',
     title: '全国大选结果揭晓',
     content: `国家【${nation.name}】已完成全国普选大选！【${winnerPartyTitle}】获得选民最高授权执掌大权！当前政权过渡平稳，稳定度提升。`,
     relatedNationId: nation.id,
     relatedNationName: nation.name,
     isRead: false,
     createdAt: new Date().toISOString(),
    });

    return {
     message: isTransferOfPower
      ? `大选结束！【${winnerPartyTitle}】击败前执政党成功当选，国家和平完成政权交接！`
      : `大选结束！执政党【${winnerPartyTitle}】成功连任，获得继续执政授权！`,
     nation: enrichNation(updated),
     winnerParty: winnerPartyTitle,
     victoryMargin: maxSupport,
    };
   }),

  stageCoup: (id: string, targetPartyId: 'communist' | 'fascist' | 'democratic' | 'neutral') =>
   resolve<{ success: boolean; message: string; nation: Nation }>(() => {
    const user = currentUser();
    const nation = db.findNationById(id);
    if (!nation) throw new ApiError('未找到指定国家');
    if (nation.ownerId !== user.id && user.role !== 'admin') throw new ApiError('无权操作该国家');

    if (nation.rulingPartyId === targetPartyId) {
     throw new ApiError('目标政党已是当前执政党，无需发动政变！');
    }

    const partyNames = nation.partyNames || {
     communist: '人民劳动共产党',
     fascist: '国家复兴法西斯党',
     democratic: '自由民主进步同盟',
     neutral: '国家中立同盟阵线',
    };
    const currentSupport = {
     communist: nation.partySupport?.communist ?? 0,
     fascist: nation.partySupport?.fascist ?? 0,
     democratic: nation.partySupport?.democratic ?? 0,
     neutral: nation.partySupport?.neutral ?? 100,
    };

    const targetPartySupport = currentSupport[targetPartyId];
    // Base coup success probability: 45% + targetPartySupport * 0.5 - (current stability * 0.2)
    const stability = nation.stabilityIndex ?? 80;
    const successThreshold = Math.min(90, Math.max(15, 45 + targetPartySupport * 0.5 - (stability - 50) * 0.4));
    const roll = Math.random() * 100;
    const isSuccess = roll <= successThreshold || targetPartySupport >= 50;

    const ideologyMap: Record<string, string> = {
     communist: '共产主义',
     fascist: '法西斯主义',
     democratic: '自由民主主义',
     neutral: '中立主义',
    };

    const targetPartyName = partyNames[targetPartyId];

    if (isSuccess) {
     // Successful Coup
     const newSupport = { ...currentSupport };
     newSupport[targetPartyId] = Math.min(100, targetPartySupport + 35);
     const diff = newSupport[targetPartyId] - targetPartySupport;
     // Subtract from others
     const otherKeys = (['communist', 'fascist', 'democratic', 'neutral'] as const).filter((k) => k !== targetPartyId);
     const subPerKey = Math.floor(diff / otherKeys.length);
     otherKeys.forEach((k) => {
      newSupport[k] = Math.max(0, newSupport[k] - subPerKey);
     });
     // Ensure sum is 100
     const total = newSupport.communist + newSupport.fascist + newSupport.democratic + newSupport.neutral;
     if (total !== 100) newSupport[targetPartyId] += (100 - total);

     const updates: Partial<DBNation> = {
      rulingPartyId: targetPartyId,
      ideology: ideologyMap[targetPartyId],
      partySupport: newSupport,
      stabilityIndex: Math.max(15, (nation.stabilityIndex ?? 80) - 20),
      coupsAttemptedCount: (nation.coupsAttemptedCount || 0) + 1,
      lastCoupAt: new Date().toISOString(),
      civilWarStatus: 'peace',
     };

     const updated = db.updateNation(id, updates)!;
     db.createNotification({
      id: 'notif_' + Math.random().toString(36).substring(2, 9),
      userId: user.id,
      type: 'system',
      title: '🚨 突击政变宣告成功',
      content: `【${targetPartyName}】已在首都发动军事政变并占领统帅部！原政权已被推翻，【${targetPartyName}】正式接管国家最高权力！`,
      relatedNationId: nation.id,
      relatedNationName: nation.name,
      isRead: false,
      createdAt: new Date().toISOString(),
     });

     return {
      success: true,
      message: `【政变成功】${targetPartyName} 迅速控制广播台与卫戍军，已接管国家最高执政权！`,
      nation: enrichNation(updated),
     };
    } else {
     // Coup Failed -> civil war tension triggers
     const updates: Partial<DBNation> = {
      stabilityIndex: Math.max(10, (nation.stabilityIndex ?? 80) - 35),
      coupsAttemptedCount: (nation.coupsAttemptedCount || 0) + 1,
      lastCoupAt: new Date().toISOString(),
      civilWarStatus: 'tension',
     };
     const updated = db.updateNation(id, updates)!;
     db.createNotification({
      id: 'notif_' + Math.random().toString(36).substring(2, 9),
      userId: user.id,
      type: 'war_alert',
      title: '⚠️ 政变未遂与局势动荡',
      content: `【${targetPartyName}】发动的未遂政变已被卫戍部队挫败！国内局势陷入极度紧张，请注意防范内战爆发！`,
      relatedNationId: nation.id,
      relatedNationName: nation.name,
      isRead: false,
      createdAt: new Date().toISOString(),
     });

     return {
      success: false,
      message: `【政变挫败】${targetPartyName} 的政变企图被政府卫队镇压，全国进入紧急战备状态，稳定度骤降！`,
      nation: enrichNation(updated),
     };
    }
   }),

  partyCampaign: (id: string, targetPartyId: 'communist' | 'fascist' | 'democratic' | 'neutral') =>
   resolve<{ message: string; nation: Nation; newSupport: number }>(() => {
    const user = currentUser();
    const nation = db.findNationById(id);
    if (!nation) throw new ApiError('未找到指定国家');
    if (nation.ownerId !== user.id && user.role !== 'admin') throw new ApiError('无权操作该国家');

    const partyNames = nation.partyNames || {
     communist: '人民劳动共产党',
     fascist: '国家复兴法西斯党',
     democratic: '自由民主进步同盟',
     neutral: '国家中立同盟阵线',
    };
    const currentSupport = {
     communist: nation.partySupport?.communist ?? 0,
     fascist: nation.partySupport?.fascist ?? 0,
     democratic: nation.partySupport?.democratic ?? 0,
     neutral: nation.partySupport?.neutral ?? 100,
    };

    const delta = 10;
    const newSupport = { ...currentSupport };
    const oldVal = newSupport[targetPartyId];
    newSupport[targetPartyId] = Math.min(100, oldVal + delta);
    const actualAdded = newSupport[targetPartyId] - oldVal;

    const otherKeys = (['communist', 'fascist', 'democratic', 'neutral'] as const).filter((k) => k !== targetPartyId);
    let remainingToSubtract = actualAdded;
    
    // Proportional deduction from other parties
    otherKeys.forEach((k) => {
     if (remainingToSubtract <= 0) return;
     const canSubtract = Math.min(newSupport[k], Math.ceil(actualAdded / otherKeys.length));
     newSupport[k] = Math.max(0, newSupport[k] - canSubtract);
     remainingToSubtract -= canSubtract;
    });

    // Normalize to exact 100
    const sum = newSupport.communist + newSupport.fascist + newSupport.democratic + newSupport.neutral;
    if (sum !== 100) {
     newSupport[targetPartyId] += (100 - sum);
    }

    const updated = db.updateNation(id, { partySupport: newSupport })!;
    const targetTitle = partyNames[targetPartyId];

    return {
     message: `宣传造势成功！【${targetTitle}】的支持率上升至 ${newSupport[targetPartyId]}%！`,
     nation: enrichNation(updated),
     newSupport: newSupport[targetPartyId],
    };
   }),

  peaceExpansion: (payload: { provinceId: string | number; provinceName?: string }) =>
   resolve<{ success: boolean; message: string; province: ProvinceData; nation: Nation }>(() => {
    const user = currentUser();
    const nation = db.findNationByOwnerId(user.id);
    if (!nation) throw new ApiError('您尚未创建或统治任何国家，无法执行和平扩张');

    // 1. Check daily expansion limit (测试模式放宽至每日 50 次)
    if (isTodayUsed(nation.lastPeaceExpansionAt, nation.peaceExpansionCount)) {
     throw new ApiError('今日和平扩张测试上限（50次）已达，请于明日再试');
    }

    const { provinceId, provinceName } = payload;
    if (provinceId === undefined && !provinceName) {
     throw new ApiError('无法识别目标省份');
    }

    // 2. Validate province exists in GeoJSON map
    const featureMeta = findGeoFeature(provinceId, provinceName);
    if (!featureMeta) {
     throw new ApiError('无法在世界地图中定位该省份');
    }

    const resolvedStateId = featureMeta.stateId;
    const resolvedName = featureMeta.chineseName || featureMeta.name || provinceName || `省份 #${resolvedStateId}`;

    // 3. Check if already owned by player's nation
    const myProvinces = nation.provinces || [];
    const alreadyMine = myProvinces.some(
     (p: any) =>
      String(p.id) === String(resolvedStateId) ||
      (p.name && p.name.trim().toLowerCase() === featureMeta.name.trim().toLowerCase()) ||
      (p.name && p.name.trim().toLowerCase() === resolvedName.trim().toLowerCase())
    );
    if (alreadyMine) {
     throw new ApiError('该省份已经属于你的国家，无需重复扩张');
    }

    // 4. Check if owned by another player's nation
    const allNations = db.getNations();
    for (const otherNation of allNations) {
     if (otherNation.id === nation.id) continue;
     const otherOwns = (otherNation.provinces || []).some(
      (p: any) =>
       String(p.id) === String(resolvedStateId) ||
       (p.name && p.name.trim().toLowerCase() === featureMeta.name.trim().toLowerCase()) ||
       (p.name && p.name.trim().toLowerCase() === resolvedName.trim().toLowerCase())
     );
     if (otherOwns) {
      throw new ApiError(`无法通过和平扩张获得其他国家【${otherNation.name}】的领土`);
     }
    }

    // 5. Adjacency check: Must be adjacent to at least one owned province
    if (myProvinces.length > 0) {
     const isAdjacent = isProvinceAdjacentToNation(resolvedStateId, myProvinces);
     if (!isAdjacent) {
      throw new ApiError('和平扩张必须从现有领土向外扩展，该省份与本国现有领土不接壤');
     }
    }

    // 6. Construct new province (isCore: false, non-core territory)
    const newProv: ProvinceData = {
     id: resolvedStateId,
     name: resolvedName,
     civilianFactories: 1,
     militaryFactories: 0,
     isCore: false,
     acquiredAt: new Date().toISOString(),
     acquiredMethod: 'peace_expansion',
     detailedBuildings: {
      civilian_factory: 1,
      military_factory: 0,
      infrastructure: 1,
     },
     occupationStatus: 'peace',
    };

    const updatedProvinces = [...myProvinces, newProv];
    const nowIso = new Date().toISOString();
    const updated = db.updateNation(nation.id, {
     provinces: updatedProvinces,
     lastPeaceExpansionAt: nowIso,
     peaceExpansionCount: (nation.peaceExpansionCount || 0) + 1,
    })!;

    db.createNotification({
     id: 'notif_' + Math.random().toString(36).substring(2, 9),
     userId: user.id,
     type: 'system',
     title: '和平扩张顺利完成',
     content: `本国通过和平条约与勘界协议，正式收纳【${resolvedName}】（非核心领土）！`,
     relatedNationId: nation.id,
     relatedNationName: nation.name,
     isRead: false,
     createdAt: nowIso,
    });

    db.save();

    return {
     success: true,
     message: `和平扩张成功！你获得了「${resolvedName}」（非核心领土）`,
     province: newProv,
     nation: enrichNation(updated),
    };
   }, { hydrate: false }),

  updateEconomy: (
   id: string,
   payload: { taxRate?: number; currencyName?: string; currencySymbol?: string }
  ) =>
   resolve<{ message: string; nation: Nation }>(() => {
    const user = currentUser();
    const nation = db.findNationById(id);
    if (!nation) throw new ApiError('未找到指定国家');
    if (nation.ownerId !== user.id && user.role !== 'admin') {
     throw new ApiError('您无权调整其他国家的经济与财政政策');
    }

    const taxRate = payload.taxRate === undefined ? (nation.economy?.taxRate ?? 20) : Number(payload.taxRate);
    if (!Number.isFinite(taxRate) || taxRate < 5 || taxRate > 50) {
     throw new ApiError('税率必须设定在 5% ~ 50% 的合法财政宏观调控区间内');
    }
    const now = Date.now();
    const provinces = nation.provinces || [];
    const totalCivFactories = provinces.reduce((sum: number, province: any) => {
     const civ = province.detailedBuildings?.civilian_factory ?? province.civilianFactories ?? 0;
     return sum + Math.max(0, Math.min(30, Number(civ) || 0));
    }, 0);
    const previous = nation.economy || {};
    const previousAt = previous.lastCalculatedAt ? Date.parse(previous.lastCalculatedAt) : now - 86400000 * 3;
    const elapsed = Math.max(0, now - previousAt);
    const baseDailyGDP = totalCivFactories * 1_000_000;
    const baseDailyRevenue = baseDailyGDP * ((previous.taxRate || 20) / 100);
    const currencyName = (payload.currencyName || previous.currencyName || nation.currency || '玲玉币').trim().slice(0, 16);
    const currencySymbol = (payload.currencySymbol || previous.currencySymbol || nation.currencySymbol || '¥').trim().slice(0, 6);
    const economy = {
     taxRate: Math.round(taxRate * 10) / 10,
     currencyName,
     currencySymbol,
     lastCalculatedAt: new Date(now).toISOString(),
     baseGDP: (Number(previous.baseGDP) || baseDailyGDP * 10) + (baseDailyGDP / 86400000) * elapsed,
     baseTreasury: (Number(previous.baseTreasury) || baseDailyRevenue * 10) + (baseDailyRevenue / 86400000) * elapsed,
    };
    const updated = db.updateNation(id, { economy, currency: currencyName, currencySymbol, taxRate: economy.taxRate })!;
    return { message: `国家【${nation.name}】经济与财税法案已成功颁布实施！`, nation: enrichNation(updated) };
   }),

  updateMilitaryIndustry: (id: string, militaryIndustry: any) =>
   resolve<{ message: string; nation: Nation }>(() => {
    const user = currentUser();
    const nation = db.findNationById(id);
    if (!nation) throw new ApiError('未找到指定国家');
    if (nation.ownerId !== user.id && user.role !== 'admin') {
     throw new ApiError('您无权配置其他国家的军工产能');
    }
    if (!militaryIndustry) throw new ApiError('请提供军工配置数据');
    const updated = db.updateNation(id, { militaryIndustry })!;
    return { message: '军事产能与军械生产线配置保存成功！', nation: enrichNation(updated) };
   }),

  delete: (id: string) =>
   resolve<{ message: string }>(() => {
    const user = currentUser();
    const nation = db.findNationById(id);
    if (!nation) throw new ApiError('未找到指定国家');
    if (nation.ownerId !== user.id && user.role !== 'admin') {
     throw new ApiError('您无权解散其他领主的国家');
    }
    const nationName = nation.name;
    if (!db.deleteNation(id)) throw new ApiError('解散国家操作失败');
    return {
     message: `国家【${nationName}】已被成功解散，所有相关条约与战争状态已注销。`,
    };
   }),
 },

 diplomacy: {
  send: (payload: { targetNationId: string; type: DiplomacyType; note?: string }) =>
   resolve<{ message: string; request: DiplomaticRequest }>(() => {
    const user = currentUser();
    const { targetNationId, type, note } = payload;

    const myNation = db.findNationByOwnerId(user.id);
    if (!myNation) throw new ApiError('您尚未宣告属于自己的国家，无法发起任何外交或军事行动！');
    if (!targetNationId || targetNationId === myNation.id) {
     throw new ApiError('不能向自己的国家发起外交申请或宣战');
    }
    const targetNation = db.findNationById(targetNationId);
    if (!targetNation) throw new ApiError('目标国家不存在或已解散');
    if (!['peace', 'mutual_defense', 'armistice', 'military_access', 'embassy', 'war'].includes(type)) {
     throw new ApiError('无效的外交申请类型');
    }

    if (type === 'war') {
     const existingWar = db.getDiplomaticRequests().find(
      (r) =>
       r.type === 'war' &&
       r.status === 'active' &&
       ((r.senderNationId === myNation.id && r.receiverNationId === targetNation.id) ||
        (r.senderNationId === targetNation.id && r.receiverNationId === myNation.id))
     );
     if (existingWar) {
      throw new ApiError(`【${myNation.name}】与【${targetNation.name}】当前已处于战争状态！`);
     }

     db.getDiplomaticRequests()
      .filter(
       (r) =>
        r.status === 'accepted' &&
        ((r.senderNationId === myNation.id && r.receiverNationId === targetNation.id) ||
         (r.senderNationId === targetNation.id && r.receiverNationId === myNation.id))
      )
      .forEach((t) => db.updateDiplomaticRequest(t.id, { status: 'terminated' }));

     const warReq: DBDiplomaticRequest = {
      id: 'war_' + Math.random().toString(36).substring(2, 11),
      senderNationId: myNation.id,
      senderNationName: myNation.name,
      senderOwnerId: user.id,
      senderOwnerName: user.username,
      receiverNationId: targetNation.id,
      receiverNationName: targetNation.name,
      receiverOwnerId: targetNation.ownerId,
      receiverOwnerName: targetNation.ownerUsername,
      type: 'war',
      status: 'active',
      note: note ? note.trim() : `【${myNation.name}】正式对【${targetNation.name}】下达宣战通牒！`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
     };
     db.createDiplomaticRequest(warReq);

     db.createNotification({
      id: 'notif_' + Math.random().toString(36).substring(2, 9),
      userId: targetNation.ownerId,
      type: 'war_alert',
      title: ' 紧急战报：敌国宣战通牒！',
      content: `【${myNation.name}】（领主：${user.username}）已正式向您的国家【${targetNation.name}】宣战！地缘关系已转入全面战争状态！${note ? ` 宣战理由：${note}` : ''}`,
      relatedNationId: myNation.id,
      relatedNationName: myNation.name,
      relatedRequestId: warReq.id,
      isRead: false,
      createdAt: new Date().toISOString(),
     });
     db.createNotification({
      id: 'notif_' + Math.random().toString(36).substring(2, 9),
      userId: user.id,
      type: 'war_alert',
      title: '战报确认：国家已进入战争状态',
      content: `您已成功对【${targetNation.name}】宣战，全军已进入一级战备状态！`,
      relatedNationId: targetNation.id,
      relatedNationName: targetNation.name,
      relatedRequestId: warReq.id,
      isRead: false,
      createdAt: new Date().toISOString(),
     });

     return { message: `已向【${targetNation.name}】正式宣战！`, request: warReq as unknown as DiplomaticRequest };
    }

    if (type === 'armistice') {
     const existingWar = db.getDiplomaticRequests().find(
      (r) =>
       r.type === 'war' &&
       r.status === 'active' &&
       ((r.senderNationId === myNation.id && r.receiverNationId === targetNation.id) ||
        (r.senderNationId === targetNation.id && r.receiverNationId === myNation.id))
     );
     if (!existingWar) throw new ApiError('两国目前并未处于战争状态，无需发起停战协定！');
    }

    const duplicatePending = db.getDiplomaticRequests().find(
     (r) =>
      r.senderNationId === myNation.id &&
      r.receiverNationId === targetNation.id &&
      r.type === type &&
      r.status === 'pending'
    );
    if (duplicatePending) {
     throw new ApiError(
      `您此前已向【${targetNation.name}】发送过一份尚未处理的【${DIPLOMACY_TYPE_NAMES[type]}】申请，请耐心等待对方领主回复。`
     );
    }

    if (['peace', 'mutual_defense', 'military_access', 'embassy'].includes(type)) {
     const existingTreaty = db.getDiplomaticRequests().find(
      (r) =>
       r.type === type &&
       r.status === 'accepted' &&
       ((r.senderNationId === myNation.id && r.receiverNationId === targetNation.id) ||
        (r.senderNationId === targetNation.id && r.receiverNationId === myNation.id))
     );
     if (existingTreaty) {
      throw new ApiError(`两国之间当前已存在生效中的【${DIPLOMACY_TYPE_NAMES[type]}】，无需重复签署`);
     }
    }

    const newReq: DBDiplomaticRequest = {
     id: 'dip_' + Math.random().toString(36).substring(2, 11),
     senderNationId: myNation.id,
     senderNationName: myNation.name,
     senderOwnerId: user.id,
     senderOwnerName: user.username,
     receiverNationId: targetNation.id,
     receiverNationName: targetNation.name,
     receiverOwnerId: targetNation.ownerId,
     receiverOwnerName: targetNation.ownerUsername,
     type,
     status: 'pending',
     note: note ? note.trim() : undefined,
     createdAt: new Date().toISOString(),
     updatedAt: new Date().toISOString(),
    };
    db.createDiplomaticRequest(newReq);

    db.createNotification({
     id: 'notif_' + Math.random().toString(36).substring(2, 9),
     userId: targetNation.ownerId,
     type: 'dip_request',
     title: ` 收到来自【${myNation.name}】的外交申请`,
     content: `【${myNation.name}】（领主：${user.username}）向您的国家发起了【${DIPLOMACY_TYPE_NAMES[type]}】签署申请。${note ? ` 附言：${note}` : ''}`,
     relatedNationId: myNation.id,
     relatedNationName: myNation.name,
     relatedRequestId: newReq.id,
     isRead: false,
     createdAt: new Date().toISOString(),
    });

    return {
     message: `【${DIPLOMACY_TYPE_NAMES[type]}】申请已送达【${targetNation.name}】国府，请等待对方回应。`,
     request: newReq as unknown as DiplomaticRequest,
    };
   }),

  respond: (payload: { requestId: string; action: 'accept' | 'reject' }) =>
   resolve<{ message: string; request: DiplomaticRequest }>(() => {
    const user = currentUser();
    const { requestId, action } = payload;
    if (!requestId || !['accept', 'reject'].includes(action)) throw new ApiError('无效的外交回应参数');

    const request = db.findDiplomaticRequestById(requestId);
    if (!request) throw new ApiError('未找到指定的外交申请记录');
    if (request.status !== 'pending') {
     throw new ApiError(`该申请此前已被处理（状态：${request.status}），无法重复操作`);
    }
    if (request.receiverOwnerId !== user.id && user.role !== 'admin') {
     throw new ApiError('您不是该外交申请的受邀领主，无权处理此申请');
    }

    const isAccept = action === 'accept';
    const newStatus = isAccept ? 'accepted' : 'rejected';

    if (isAccept && request.type === 'armistice') {
     db.getDiplomaticRequests()
      .filter(
       (r) =>
        r.type === 'war' &&
        r.status === 'active' &&
        ((r.senderNationId === request.senderNationId && r.receiverNationId === request.receiverNationId) ||
         (r.senderNationId === request.receiverNationId && r.receiverNationId === request.senderNationId))
      )
      .forEach((w) => db.updateDiplomaticRequest(w.id, { status: 'terminated' }));
    }

    // A resident embassy is not created by the applicant alone. It becomes
    // effective only after the host nation accepts this diplomatic request.
    if (isAccept && request.type === 'embassy') {
     const senderNation = db.findNationById(request.senderNationId);
     if (senderNation) {
      const embassies = senderNation.embassies || [];
      if (!embassies.includes(request.receiverNationId)) {
       db.updateNation(senderNation.id, { embassies: [...embassies, request.receiverNationId] });
      }
     }
    }

    const updated = db.updateDiplomaticRequest(requestId, { status: newStatus })!;
    const typeName = DIPLOMACY_TYPE_NAMES[request.type] || request.type;

    db.createNotification({
     id: 'notif_' + Math.random().toString(36).substring(2, 9),
     userId: request.senderOwnerId,
     type: 'dip_result',
     title: isAccept ? ` 外交签署成功：${typeName}` : ` 外交申请已被谢绝：${typeName}`,
     content: isAccept
      ? `【${request.receiverNationName}】（领主：${user.username}）已正式批准并签署了与贵国的【${typeName}】！条约已正式生效。`
      : `【${request.receiverNationName}】（领主：${user.username}）已谢绝贵国提出的【${typeName}】申请。`,
     relatedNationId: request.receiverNationId,
     relatedNationName: request.receiverNationName,
     relatedRequestId: request.id,
     isRead: false,
     createdAt: new Date().toISOString(),
    });
    db.createNotification({
     id: 'notif_' + Math.random().toString(36).substring(2, 9),
     userId: user.id,
     type: 'dip_result',
     title: isAccept ? `外交条约生效：${typeName}` : `已拒绝外交申请：${typeName}`,
     content: isAccept
      ? `您已代表【${request.receiverNationName}】正式签署与【${request.senderNationName}】的【${typeName}】。`
      : `您已拒绝来自【${request.senderNationName}】的【${typeName}】申请。`,
     relatedNationId: request.senderNationId,
     relatedNationName: request.senderNationName,
     relatedRequestId: request.id,
     isRead: false,
     createdAt: new Date().toISOString(),
    });

    return {
     message: isAccept ? `已同意并缔结【${typeName}】！` : `已谢绝【${typeName}】申请。`,
     request: updated as unknown as DiplomaticRequest,
    };
   }),

  terminate: (requestId: string) =>
   resolve<{ message: string }>(() => {
    const user = currentUser();
    const request = db.findDiplomaticRequestById(requestId);
    if (!request) throw new ApiError('未找到指定条约记录');
    if (request.status !== 'accepted') throw new ApiError('只能废除当前处于生效中的条约');

    const myNation = db.findNationByOwnerId(user.id);
    if (!myNation && user.role !== 'admin') throw new ApiError('您无权操作该条约');

    const isParty =
     request.senderOwnerId === user.id ||
     request.receiverOwnerId === user.id ||
     user.role === 'admin';
    if (!isParty) throw new ApiError('您无权单方面废除此条约');

    const otherOwnerId =
     request.senderOwnerId === user.id ? request.receiverOwnerId : request.senderOwnerId;
    const otherNationName =
     request.senderOwnerId === user.id ? request.receiverNationName : request.senderNationName;
    const typeName = DIPLOMACY_TYPE_NAMES[request.type] || request.type;

    db.updateDiplomaticRequest(requestId, { status: 'terminated' });
    db.createNotification({
     id: 'notif_' + Math.random().toString(36).substring(2, 9),
     userId: otherOwnerId,
     type: 'dip_result',
     title: `条约废除通告：${typeName}`,
     content: `【${myNation?.name || '管理员'}】已单方面废除与贵国签署的【${typeName}】。`,
     relatedNationId: myNation?.id,
     relatedNationName: myNation?.name,
     isRead: false,
     createdAt: new Date().toISOString(),
    });

    return { message: `已成功废除与【${otherNationName}】的【${typeName}】。` };
   }),

  myRequests: () =>
   resolve<{
    incoming: DiplomaticRequest[];
    outgoing: DiplomaticRequest[];
    activeTreaties: DiplomaticRequest[];
    activeWars: DiplomaticRequest[];
   }>(() => {
    const user = currentUser();
    const myNation = db.findNationByOwnerId(user.id);
    if (!myNation) return { incoming: [], outgoing: [], activeTreaties: [], activeWars: [] };

    const allReqs = db.getDiplomaticRequests();
    return {
     incoming: allReqs.filter(
      (r) => r.receiverNationId === myNation.id && r.status === 'pending'
     ) as unknown as DiplomaticRequest[],
     outgoing: allReqs.filter(
      (r) => r.senderNationId === myNation.id && r.status === 'pending'
     ) as unknown as DiplomaticRequest[],
     activeTreaties: allReqs.filter(
      (r) =>
       r.status === 'accepted' &&
       r.type !== 'war' &&
       (r.senderNationId === myNation.id || r.receiverNationId === myNation.id)
     ) as unknown as DiplomaticRequest[],
     activeWars: allReqs.filter(
      (r) =>
       r.type === 'war' &&
       r.status === 'active' &&
       (r.senderNationId === myNation.id || r.receiverNationId === myNation.id)
     ) as unknown as DiplomaticRequest[],
    };
   }),
 },

 notifications: {
  list: () =>
   resolve<{ notifications: AppNotification[]; unreadCount: number }>(() => {
    const user = currentUser();
    const notifs = db.getNotifications(user.id);
    return {
     notifications: notifs as unknown as AppNotification[],
     unreadCount: notifs.filter((n) => !n.isRead).length,
    };
   }),

  markAsRead: (id: string) =>
   resolve<{ success: boolean }>(() => {
    const user = currentUser();
    return { success: db.markNotificationAsRead(id, user.id) };
   }),

  markAllAsRead: () =>
   resolve<{ message: string; count: number }>(() => {
    const user = currentUser();
    const count = db.markAllNotificationsAsRead(user.id);
    return { message: `已将 ${count} 条通知标记为已读`, count };
   }),

  delete: (id: string) =>
   resolve<{ success: boolean }>(() => {
    const user = currentUser();
    return { success: db.deleteNotification(id, user.id) };
   }),
 },

 admin: {
  stats: () =>
   resolve<{
    userCount: number;
    nationCount: number;
    activeWarCount: number;
    activeTreatyCount: number;
    pendingRequestsCount: number;
    users: {
     id: string;
     username: string;
     douyinName: string;
     role: string;
     createdAt: string;
     nation: string | null;
    }[];
   }>(() => {
    const user = currentUser();
    if (user.role !== 'admin') throw new ApiError('无权限执行此管理操作，需要管理员权限');
    const users = db.getUsers();
    const nations = db.getNations();
    const requests = db.getDiplomaticRequests();
    return {
     userCount: users.length,
     nationCount: nations.length,
     activeWarCount: requests.filter((r) => r.type === 'war' && r.status === 'active').length,
     activeTreatyCount: requests.filter((r) => r.type !== 'war' && r.status === 'accepted').length,
     pendingRequestsCount: requests.filter((r) => r.status === 'pending').length,
     users: users.map((u) => ({
      id: u.id,
      username: u.role === 'admin' ? ADMIN_DISPLAY_NAME : u.username,
      douyinName: u.douyinName,
      role: u.role,
      createdAt: u.createdAt,
      nation: nations.find((n) => n.ownerId === u.id)?.name || null,
     })),
    };
   }),
 },

 // 临时测试数据注入与清除接口
 
 processCombatTicks: () =>
  resolve<{ success: boolean; message: string }>(() => {
   const nations = db.getNations();
   let updated = false;
   const now = Date.now();
   if ((db as any).data.lastCombatTickAt && now - (db as any).data.lastCombatTickAt < 10000) {
    return { success: true, message: 'Tick skipped' };
   }
   (db as any).data.lastCombatTickAt = now;
   updated = true;
  

   // Map province to divisions
   const divsByProv = new Map<string, { nationId: string, div: any }[]>();
   nations.forEach(n => {
    n.army?.divisions?.forEach(div => {
     const pid = String(div.provinceId);
     if (!divsByProv.has(pid)) divsByProv.set(pid, []);
     divsByProv.get(pid)!.push({ nationId: n.id, div });
    });
   });

   nations.forEach(nation => {
    if (!nation.provinces) return;
    
    let nationUpdated = false;
    
    nation.provinces.forEach(prov => {
     const pid = String(prov.id);
     const divs = divsByProv.get(pid) || [];
     
     const isAtWarWith = (id: string) => nation.activeWars?.some(w => w.withNationId === id);
     const enemies = divs.filter(d => isAtWarWith(d.nationId));
     const friendlies = divs.filter(d => d.nationId === nation.id);

     if (enemies.length > 0 || (prov.occupationValue || 0) > 0) {
      let attStr = enemies.reduce((acc, d) => acc + (d.div.manpower * (d.div.equipmentRate || 1) * ((d.div.organization || 100)/100)), 0);
      let defStr = friendlies.reduce((acc, d) => acc + (d.div.manpower * (d.div.equipmentRate || 1) * ((d.div.organization || 100)/100)), 0);
      
      prov.attackerStrength = Math.round(attStr);
      prov.defenderStrength = Math.round(defStr);

      if (attStr > 0) {
       prov.occupationStatus = 'combat';
       
       const totalStr = attStr + defStr + 1;
       const attKills = Math.max(10, attStr * 0.05); // Attacker base kills
       const defKills = Math.max(10, defStr * 0.08); // Defender base kills (defender advantage)
       
       // Apply casualties
       enemies.forEach(e => {
        const loss = Math.min(e.div.manpower, defKills * (e.div.manpower / attStr));
        e.div.manpower -= Math.round(loss);
       });
       friendlies.forEach(f => {
        const loss = Math.min(f.div.manpower, attKills * (f.div.manpower / defStr));
        f.div.manpower -= Math.round(loss);
       });
       nationUpdated = true;

       // Occupation growth
       const attackRatio = attStr / totalStr;
       let occSpeed = 0;
       if (attackRatio > 0.6) occSpeed = 5 * (attackRatio + 0.5);
       else if (attackRatio > 0.4) occSpeed = 2;
       else if (attackRatio < 0.3) occSpeed = -3;
       
       prov.occupationValue = Math.min(100, Math.max(0, (prov.occupationValue || 0) + occSpeed));
       
       if (prov.occupationValue >= 100) {
        // Complete occupation
        prov.occupationStatus = 'occupied';
        prov.attackerId = enemies[0].nationId;
        
        // Transfer province logic
        const attackerNation = db.findNationById(prov.attackerId);
        if (attackerNation) {
         prov.occupationValue = 100;
         // Remove from defender
         nation.provinces = nation.provinces.filter(p => String(p.id) !== pid);
         // Add to attacker
         if (!attackerNation.provinces) attackerNation.provinces = [];
         attackerNation.provinces.push({ ...prov });
         db.updateNation(attackerNation.id, { provinces: attackerNation.provinces });
        }
       }
      } else {
       // Recover occupation
       prov.occupationValue = Math.max(0, (prov.occupationValue || 0) - 5);
       if (prov.occupationValue === 0) {
        prov.occupationStatus = 'peace';
        prov.attackerStrength = 0;
        prov.defenderStrength = 0;
        prov.attackerId = undefined;
       }
       nationUpdated = true;
      }
     }
    });
    
    if (nationUpdated) {
     db.updateNation(nation.id, { provinces: nation.provinces, army: nation.army });
     updated = true;
    }
   });
   
   if (updated) db.save();
   return { success: true, message: 'Combat logic executed' };
  }),

 demo: {
  loadShowcase: () =>
   resolve<{ success: boolean; message: string }>(() => {
    const res = db.loadShowcaseDemoData();
    return { success: true, message: `已载入 ${res.nationsCount} 个示范国家与领主测试档案！` };
   }),
  clearShowcase: () =>
   resolve<{ success: boolean; message: string }>(() => {
    db.clearShowcaseDemoData();
    return { success: true, message: '已彻底清除所有示范展示数据！' };
   }),
 },
};
