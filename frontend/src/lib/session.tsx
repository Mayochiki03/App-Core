/**
 * lib/session.tsx — ข้อมูลผู้ใช้ที่ล็อกอิน + ข้อมูลระบบ (ชื่อ/ธีม)
 *   const { user, login, logout } = useSession();
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, onSessionExpired, type ApiResult } from '../api/client';

export type Role = 'ADMIN' | 'STAFF';
export type User = { id: number; username: string; full_name: string; role: Role };
type AppInfo = { name: string; theme: string };

type Session = {
  ready: boolean;
  app: AppInfo;
  user: User | null;
  login: (username: string, password: string) => Promise<ApiResult<User>>;
  logout: () => Promise<void>;
};

const SessionContext = createContext<Session | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [app, setApp] = useState<AppInfo>({ name: 'ระบบภายใน', theme: 'herb' });
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    void (async () => {
      const info = await api.get<AppInfo>('/app');
      if (info.data) setApp(info.data);
      const me = await api.get<User>('/auth/me');
      setUser(me.ok ? me.data : null);
      setReady(true);
    })();
  }, []);

  // ธีมและชื่อแท็บ ตั้งจากค่าใน .env (APP_THEME / APP_NAME)
  useEffect(() => {
    document.documentElement.dataset.theme = app.theme;
    document.title = app.name;
  }, [app]);

  useEffect(() => onSessionExpired(() => setUser(null)), []);

  const login = useCallback(async (username: string, password: string) => {
    const res = await api.post<User>('/auth/login', { username, password });
    if (res.ok) setUser(res.data);
    return res;
  }, []);

  const logout = useCallback(async () => {
    await api.post('/auth/logout');
    setUser(null);
  }, []);

  const value = useMemo(() => ({ ready, app, user, login, logout }), [ready, app, user, login, logout]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): Session {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession ต้องใช้ภายใน <SessionProvider>');
  return ctx;
}
