import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

export interface DBUser {
  id: string;
  username: string;
  passwordHash: string;
  douyinName: string;
  role: 'user' | 'admin';
  avatarColor: string;
  isLingyuBaby?: boolean;
  createdAt: string;
}

export interface DBNation {
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
  currencySymbol?: string;
  taxRate?: number;
  flagColor: string;
  emblemIcon: string;
  createdAt: string;
  updatedAt: string;
  mapCoordinates?: [number, number];
  provinces?: any[];
  militaryIndustry?: any;
  radarTech?: string;
  constructionQueue?: any[];
  economy?: any;
  activeDecreeIds?: string[];
  ministers?: Record<string, string>;
  stabilityIndex?: number;
  popularApproval?: number;
  allianceId?: string;
  embassies?: string[];
  activeSanctionsEnforced?: any[];
  unlockedMedalIds?: string[];
  nationalAnthem?: string;
  nationalMotto?: string;
  chronicles?: any[];
  researchedTechIds?: string[];
  activeResearchProjects?: any[];
  unlockedResearchSlots?: number;
  // Surrender & Capitulation fields
  surrenderProgress?: number;
  surrenderThreshold?: number;
  warSupport?: number;
  militaryStrength?: number;
  coreTerritoryRatio?: number;
  occupiedTerritoryRatio?: number;
  capitalOccupied?: boolean;
  recentDefeats?: number;
  economicStability?: number;
  surrenderResistance?: number;
  isCapitulated?: boolean;
  capitulatedAt?: string;
  capitulatedToNationId?: string;
  capitulatedToNationName?: string;
  occupiedProvinces?: string[];
  lastPeaceExpansionAt?: string;
  peaceExpansionCount?: number;
}


export interface DBDiplomaticRequest {
  id: string;
  senderNationId: string;
  senderNationName: string;
  senderOwnerId: string;
  senderOwnerName: string;
  receiverNationId: string;
  receiverNationName: string;
  receiverOwnerId: string;
  receiverOwnerName: string;
  type: 'peace' | 'mutual_defense' | 'armistice' | 'military_access' | 'war';
  status: 'pending' | 'accepted' | 'rejected' | 'active' | 'terminated';
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DBNotification {
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

export interface DatabaseSchema {
  users: DBUser[];
  nations: DBNation[];
  diplomaticRequests: DBDiplomaticRequest[];
  notifications: DBNotification[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function getInitialData(): DatabaseSchema {
  return {
    users: [],
    nations: [],
    diplomaticRequests: [],
    notifications: [],
  };
}

class Database {
  private data: DatabaseSchema;

  constructor() {
    ensureDataDir();
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        if (!this.data.users || !this.data.nations) {
          this.data = getInitialData();
          this.save();
        }
      } catch (err) {
        console.error('Error reading database, resetting to initial seed:', err);
        this.data = getInitialData();
        this.save();
      }
    } else {
      this.data = getInitialData();
      this.save();
    }
  }

  public save() {
    try {
      ensureDataDir();
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write database file:', err);
    }
  }

  // User methods
  public getUsers(): DBUser[] {
    return this.data.users;
  }

  public findUserById(id: string): DBUser | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  public findUserByUsername(username: string): DBUser | undefined {
    return this.data.users.find((u) => u.username.toLowerCase() === username.toLowerCase());
  }

  public createUser(user: DBUser): DBUser {
    this.data.users.push(user);
    this.save();
    return user;
  }

  public updateUser(id: string, updates: Partial<DBUser>): DBUser | undefined {
    const idx = this.data.users.findIndex((u) => u.id === id);
    if (idx === -1) return undefined;
    this.data.users[idx] = { ...this.data.users[idx], ...updates };
    this.save();
    return this.data.users[idx];
  }

  // Nation methods
  public getNations(): DBNation[] {
    return this.data.nations;
  }

  public findNationById(id: string): DBNation | undefined {
    return this.data.nations.find((n) => n.id === id);
  }

  public findNationByOwnerId(ownerId: string): DBNation | undefined {
    return this.data.nations.find((n) => n.ownerId === ownerId);
  }

  public createNation(nation: DBNation): DBNation {
    this.data.nations.push(nation);
    this.save();
    return nation;
  }

  public updateNation(id: string, updates: Partial<DBNation>): DBNation | undefined {
    const idx = this.data.nations.findIndex((n) => n.id === id);
    if (idx === -1) return undefined;
    this.data.nations[idx] = { ...this.data.nations[idx], ...updates, updatedAt: new Date().toISOString() };
    this.save();
    return this.data.nations[idx];
  }

  public deleteNation(id: string): boolean {
    const idx = this.data.nations.findIndex((n) => n.id === id);
    if (idx === -1) return false;
    const nation = this.data.nations[idx];

    // Cascade: remove/terminate diplomatic requests involving this nation
    this.data.diplomaticRequests = this.data.diplomaticRequests.map((req) => {
      if (req.senderNationId === id || req.receiverNationId === id) {
        return {
          ...req,
          status: 'terminated' as const,
          updatedAt: new Date().toISOString(),
        };
      }
      return req;
    });

    // Notify other nations about nation dissolution
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

  // Diplomacy methods
  public getDiplomaticRequests(): DBDiplomaticRequest[] {
    return this.data.diplomaticRequests;
  }

  public findDiplomaticRequestById(id: string): DBDiplomaticRequest | undefined {
    return this.data.diplomaticRequests.find((r) => r.id === id);
  }

  public createDiplomaticRequest(req: DBDiplomaticRequest): DBDiplomaticRequest {
    this.data.diplomaticRequests.push(req);
    this.save();
    return req;
  }

  public updateDiplomaticRequest(
    id: string,
    updates: Partial<DBDiplomaticRequest>
  ): DBDiplomaticRequest | undefined {
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

  // Notification methods
  public getNotifications(userId: string): DBNotification[] {
    return this.data.notifications
      .filter((n) => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public createNotification(notif: DBNotification): DBNotification {
    this.data.notifications.push(notif);
    this.save();
    return notif;
  }

  public markNotificationAsRead(id: string, userId: string): boolean {
    const notif = this.data.notifications.find((n) => n.id === id && n.userId === userId);
    if (!notif) return false;
    notif.isRead = true;
    this.save();
    return true;
  }

  public markAllNotificationsAsRead(userId: string): number {
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

  public deleteNotification(id: string, userId: string): boolean {
    const idx = this.data.notifications.findIndex((n) => n.id === id && n.userId === userId);
    if (idx === -1) return false;
    this.data.notifications.splice(idx, 1);
    this.save();
    return true;
  }
}

export const db = new Database();
