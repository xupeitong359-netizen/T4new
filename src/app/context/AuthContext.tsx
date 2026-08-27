import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { User, Nation } from '../types';
import { api, tokenStorage } from '../services/api';

interface AuthContextType {
 user: User | null;
 myNation: Nation | null;
 token: string | null;
 isLoading: boolean;
 isAuthenticated: boolean;
 isAdmin: boolean;
 unreadNotifsCount: number;
 login: (username: string, password: string) => Promise<void>;
 register: (
  username: string,
  password: string,
  douyinName: string,
  isLingyuBaby?: boolean,
  adminPassword?: string,
  avatarData?: { avatarColor?: string; avatarUrl?: string; avatarEmoji?: string }
 ) => Promise<void>;
 quickGuestLogin: (customName?: string) => Promise<void>;
 logout: () => void;
 refreshUserData: () => Promise<void>;
 setMyNation: React.Dispatch<React.SetStateAction<Nation | null>>;
 toggleAdminRole: () => Promise<void>;
 updateUnreadCount: (count: number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const SESSION_USER_KEY = 'nation_lobby_session_user';

function readStoredSessionUser(): User | null {
 try {
  const raw = localStorage.getItem(SESSION_USER_KEY);
  return raw ? (JSON.parse(raw) as User) : null;
 } catch {
  localStorage.removeItem(SESSION_USER_KEY);
  return null;
 }
}

function storeSessionUser(user: User) {
 localStorage.setItem(SESSION_USER_KEY, JSON.stringify(user));
}

function clearStoredSession() {
 tokenStorage.remove();
 localStorage.removeItem(SESSION_USER_KEY);
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
 const [user, setUser] = useState<User | null>(() => readStoredSessionUser());
 const [myNation, setMyNation] = useState<Nation | null>(null);
 const [token, setToken] = useState<string | null>(tokenStorage.get());
 const [isLoading, setIsLoading] = useState<boolean>(true);
 const [unreadNotifsCount, setUnreadNotifsCount] = useState<number>(0);

 const refreshUserData = useCallback(async () => {
  const currentToken = tokenStorage.get();
  if (!currentToken) {
   setUser(null);
   setMyNation(null);
   setIsLoading(false);
   return;
  }

  try {
   const data = await api.auth.me();
   setUser((prev) => {
    if (
     prev &&
     prev.id === data.user.id &&
     prev.username === data.user.username &&
     prev.role === data.user.role &&
     prev.isLingyuBaby === data.user.isLingyuBaby &&
     prev.douyinName === data.user.douyinName
    ) {
     return prev;
    }
    return data.user;
   });
   storeSessionUser(data.user);
   setMyNation((prev) => {
    if (!data.myNation) return null;
    if (prev && prev.id === data.myNation.id && prev.updatedAt === data.myNation.updatedAt) {
     return prev;
    }
    return data.myNation;
   });

   // fetch unread notifications
   const notifData = await api.notifications.list().catch(() => ({ notifications: [], unreadCount: 0 }));
   setUnreadNotifsCount((prev) => (prev === notifData.unreadCount ? prev : notifData.unreadCount));
  } catch (err) {
   const message = err instanceof Error ? err.message : '';
   const isInvalidSession = message.includes('登录状态已过期或无效');
   console.warn(isInvalidSession ? 'Session expired or invalid token:' : 'Session refresh failed; keeping local session:', err);

   // Only clear credentials after the API positively confirms that this
   // token is invalid. Network or remote-state failures are recoverable and
   // must not log the user out during a browser refresh.
   if (isInvalidSession) {
    clearStoredSession();
    setToken(null);
    setUser(null);
    setMyNation(null);
   }
  } finally {
   setIsLoading(false);
  }
 }, []);

 useEffect(() => {
  refreshUserData();
 }, [refreshUserData]);

 // Periodic poll for unread notifications if logged in. Only poll while the
 // tab is visible: background tabs that fire a request and then get frozen
 // leave the connection to be torn down, which the edge function logs as a
 // broken pipe. A single in-flight guard prevents overlapping requests too.
 const userId = user?.id;
 useEffect(() => {
  if (!userId) return;

  let inFlight = false;
  const poll = async () => {
   if (inFlight || document.hidden) return;
   inFlight = true;
   try {
    const notifData = await api.notifications.list();
    setUnreadNotifsCount((prev) => (prev === notifData.unreadCount ? prev : notifData.unreadCount));
   } catch {
    // silent
   } finally {
    inFlight = false;
   }
  };

  const interval = setInterval(poll, 15000);
  const onVisible = () => { if (!document.hidden) poll(); };
  document.addEventListener('visibilitychange', onVisible);
  return () => {
   clearInterval(interval);
   document.removeEventListener('visibilitychange', onVisible);
  };
 }, [userId]);

 const login = useCallback(async (username: string, password: string) => {
  const res = await api.auth.login({ username, password });
  tokenStorage.set(res.token);
  setToken(res.token);
  setUser(res.user);
  storeSessionUser(res.user);
  setMyNation(res.myNation || null);

  const notifData = await api.notifications.list().catch(() => ({ notifications: [], unreadCount: 0 }));
  setUnreadNotifsCount(notifData.unreadCount);
 }, []);

 const register = useCallback(
  async (
   username: string,
   password: string,
   douyinName: string,
   isLingyuBaby?: boolean,
   adminPassword?: string,
   avatarData?: { avatarColor?: string; avatarUrl?: string; avatarEmoji?: string }
  ) => {
   const res = await api.auth.register({
    username,
    password,
    douyinName,
    isLingyuBaby,
    adminPassword,
    avatarColor: avatarData?.avatarColor,
    avatarUrl: avatarData?.avatarUrl,
    avatarEmoji: avatarData?.avatarEmoji,
   });
   tokenStorage.set(res.token);
   setToken(res.token);
   setUser(res.user);
   storeSessionUser(res.user);
   setMyNation(res.myNation || null);
  },
  []
 );

 const quickGuestLogin = useCallback(async (customName?: string) => {
  const res = await api.auth.quickGuestLogin(customName);
  tokenStorage.set(res.token);
  setToken(res.token);
  setUser(res.user);
  storeSessionUser(res.user);
  setMyNation(res.myNation || null);
 }, []);

 const logout = useCallback(() => {
  clearStoredSession();
  setToken(null);
  setUser(null);
  setMyNation(null);
  setUnreadNotifsCount(0);
 }, []);

 const toggleAdminRole = useCallback(async () => {
  if (!user) return;
  const res = await api.auth.toggleAdminRole();
  setUser(res.user);
  storeSessionUser(res.user);
 }, [user]);

 const updateUnreadCount = useCallback((count: number) => {
  setUnreadNotifsCount((prev) => (prev === count ? prev : count));
 }, []);

 const value = useMemo<AuthContextType>(
  () => ({
   user,
   myNation,
   token,
   isLoading,
   isAuthenticated: !!user,
   isAdmin: user?.role === 'admin',
   unreadNotifsCount,
   login,
   register,
   quickGuestLogin,
   logout,
   refreshUserData,
   setMyNation,
   toggleAdminRole,
   updateUnreadCount,
  }),
  [
   user,
   myNation,
   token,
   isLoading,
   unreadNotifsCount,
   login,
   register,
   quickGuestLogin,
   logout,
   refreshUserData,
   toggleAdminRole,
   updateUnreadCount,
  ]
 );

 return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
 const context = useContext(AuthContext);
 if (!context) {
  throw new Error('useAuth must be used within an AuthProvider');
 }
 return context;
};
