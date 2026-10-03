import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from 'react';
import type { AppState, Theme } from '@/types';
import { getDefaultState, migrateWeeks } from '@/lib/data';
import { loadRemoteState, saveRemoteState } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { applyPalette, getPalette } from '@/lib/palettes';
import { STORAGE_KEY, PENDING_KEY, OWNER_KEY, STARTUP_TIMEOUT_MS, withTimeout, clearLocalAppData } from '@/lib/localReset';

function getLocalOwner(): string | null {
  try { return localStorage.getItem(OWNER_KEY); } catch { return null; }
}

function setLocalOwner(id: string) {
  try { localStorage.setItem(OWNER_KEY, id); } catch { /* ignore */ }
}

function hasPendingSync(): boolean {
  try { return localStorage.getItem(PENDING_KEY) === '1'; } catch { return false; }
}

function setPendingSync(pending: boolean) {
  try {
    if (pending) localStorage.setItem(PENDING_KEY, '1');
    else localStorage.removeItem(PENDING_KEY);
  } catch {
    // ignore
  }
}

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const arr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

function validWeeks(v: unknown): AppState['weeks'] | null {
  if (!Array.isArray(v) || v.length === 0) return null;
  const ok = v.every((w) => isObj(w) && typeof w.id === 'string' && Array.isArray(w.days) && w.days.length === 7
    && w.days.every((d) => isObj(d) && Array.isArray(d.meals) && d.meals.every((m) => isObj(m) && Array.isArray(m.foods))));
  return ok ? migrateWeeks(v as AppState['weeks']) : null;
}

/** Fills missing fields and replaces malformed ones; throws only if the input is not an object at all. */
export function mergeState(input: unknown): AppState {
  if (!isObj(input)) throw new Error('invalid state');
  const parsed = input as Partial<AppState>;
  const base = getDefaultState();
  const weeks = validWeeks(parsed.weeks) ?? base.weeks;
  return {
    ...base,
    ...parsed,
    profile: { ...base.profile, ...(isObj(parsed.profile) ? parsed.profile : {}) },
    weeks,
    activeWeekId: weeks.some((w) => w.id === parsed.activeWeekId) ? parsed.activeWeekId! : weeks[0].id,
    bodyMetrics: arr(parsed.bodyMetrics),
    supplementLogs: arr(parsed.supplementLogs),
    micronutrientLogs: arr(parsed.micronutrientLogs),
    shoppingList: arr(parsed.shoppingList),
    waterLogs: arr(parsed.waterLogs),
    customFoods: arr(parsed.customFoods),
    workoutLogs: arr(parsed.workoutLogs),
    notifications: { ...base.notifications, ...(isObj(parsed.notifications) ? parsed.notifications : {}) },
    onboardingComplete: parsed.onboardingComplete === true,
    lastChangelogVersion: typeof parsed.lastChangelogVersion === 'string' ? parsed.lastChangelogVersion : '',
    mealHistory: isObj(parsed.mealHistory) ? (parsed.mealHistory as AppState['mealHistory']) : {},
    dayChecks: isObj(parsed.dayChecks) ? (parsed.dayChecks as AppState['dayChecks']) : {},
  };
}

function loadLocalState(): AppState {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return mergeState(JSON.parse(raw));
  } catch {
    // Corrupted or unreadable cache: wipe it so the next start is clean
    if (raw !== null) clearLocalAppData();
  }
  return getDefaultState();
}

function saveLocalState(state: AppState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

export type SyncStatus = 'synced' | 'syncing' | 'pending' | 'error';

const SYNC_TIMEOUT_MS = 15000;

interface AppContextValue {
  state: AppState;
  setState: (updater: (prev: AppState) => AppState) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
  setPalette: (id: string) => void;
  online: boolean;
  syncStatus: SyncStatus;
  retrySync: () => void;
  loading: boolean;
}

const AppContext = createContext<AppContextValue | null>(null);

function resolveTheme(theme: Theme): 'light' | 'dark' {
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return theme;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [state, setStateInner] = useState<AppState>(loadLocalState);
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() => resolveTheme(state.theme));
  const [loading, setLoading] = useState(true);
  const skipRemoteSave = useRef(false);
  const [online, setOnline] = useState(() => navigator.onLine);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(() => (hasPendingSync() ? 'pending' : 'synced'));
  const syncTimer = useRef<number | undefined>(undefined);
  const syncSeq = useRef(0);

  const flush = useCallback(async (snapshot: AppState) => {
    const seq = ++syncSeq.current;
    if (!navigator.onLine) {
      setSyncStatus('pending');
      return;
    }
    setSyncStatus('syncing');
    const ok = await withTimeout(saveRemoteState(snapshot as unknown as Record<string, unknown>), false, SYNC_TIMEOUT_MS);
    // A newer change started its own sync: let that one decide the final status
    if (seq !== syncSeq.current) return;
    setPendingSync(!ok);
    setSyncStatus(ok ? 'synced' : 'error');
  }, []);

  const scheduleSync = useCallback((snapshot: AppState) => {
    setPendingSync(true);
    syncSeq.current++;
    setSyncStatus(navigator.onLine ? 'syncing' : 'pending');
    window.clearTimeout(syncTimer.current);
    syncTimer.current = window.setTimeout(() => { void flush(snapshot); }, 1200);
  }, [flush]);

  const retrySync = useCallback(() => {
    if (user) void flush(loadLocalState());
  }, [user, flush]);

  // Load from Supabase when user logs in; reset state on user change
  useEffect(() => {
    if (!user) {
      // User logged out or switched: reset to clean default state
      setStateInner(getDefaultState());
      setPendingSync(false);
      setSyncStatus('synced');
      setLoading(false);
      return;
    }
    let mounted = true;
    const owner = getLocalOwner();
    // A missing owner means data cached before owner tracking existed (logout always clears the cache)
    const ownsLocal = owner === null || owner === user.id;
    if (!ownsLocal) {
      // Cached data belongs to another account on this device: never show or upload it
      setStateInner(getDefaultState());
      setPendingSync(false);
      setSyncStatus('synced');
    }
    setLocalOwner(user.id);
    // Hard cap: the UI unlocks after STARTUP_TIMEOUT_MS no matter what the network does
    const safety = window.setTimeout(() => { if (mounted) setLoading(false); }, STARTUP_TIMEOUT_MS);
    (async () => {
      const unavailable = Symbol('unavailable');
      const remote = await withTimeout<Record<string, unknown> | null | typeof unavailable>(loadRemoteState(), unavailable);
      if (!mounted) return;
      try {
        if (remote === unavailable) {
          // Offline, slow or failing network: keep the local copy, never overwrite it
        } else if (ownsLocal && hasPendingSync()) {
          void flush(loadLocalState());
        } else if (remote) {
          skipRemoteSave.current = true;
          setStateInner(mergeState(remote));
        } else if (ownsLocal && localStorage.getItem(STORAGE_KEY)) {
          // No cloud copy yet but this device has the user's data: upload it
          void flush(loadLocalState());
        } else {
          setStateInner(getDefaultState());
        }
      } catch (err) {
        console.error('startup state rejected', err);
      } finally {
        setLoading(false);
      }
    })();
    return () => { mounted = false; clearTimeout(safety); };
  }, [user]);

  const setState = useCallback((updater: (prev: AppState) => AppState) => {
    setStateInner((prev) => {
      const next = updater(prev);
      saveLocalState(next);
      if (user && !skipRemoteSave.current) scheduleSync(next);
      return next;
    });
  }, [user, scheduleSync]);

  useEffect(() => {
    const goOnline = () => {
      setOnline(true);
      if (user && hasPendingSync()) void flush(loadLocalState());
    };
    const goOffline = () => {
      setOnline(false);
      setSyncStatus((s) => (s === 'synced' ? s : 'pending'));
    };
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    const retry = window.setInterval(() => {
      if (user && navigator.onLine && hasPendingSync()) void flush(loadLocalState());
    }, 30000);
    return () => {
      window.clearInterval(retry);
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, [user, flush]);

  useEffect(() => {
    if (skipRemoteSave.current) {
      skipRemoteSave.current = false;
    }
  }, [state]);

  useEffect(() => {
    saveLocalState(state);
  }, [state]);

  useEffect(() => {
    applyPalette(getPalette(state.palette));
  }, [state.palette]);

  useEffect(() => {
    const resolved = getPalette(state.palette).amoled ? 'dark' : resolveTheme(state.theme);
    setResolvedTheme(resolved);
    document.documentElement.classList.toggle('dark', resolved === 'dark');
  }, [state.theme, state.palette]);

  useEffect(() => {
    if (state.theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      const resolved = resolveTheme('system');
      setResolvedTheme(resolved);
      document.documentElement.classList.toggle('dark', resolved === 'dark');
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [state.theme]);

  const setTheme = useCallback((t: Theme) => {
    setState((prev) => ({ ...prev, theme: t }));
  }, [setState]);

  const setPalette = useCallback((id: string) => {
    setState((prev) => ({ ...prev, palette: id }));
  }, [setState]);

  const toggleTheme = useCallback(() => {
    setState((prev) => ({
      ...prev,
      theme: resolvedTheme === 'dark' ? 'light' : 'dark',
    }));
  }, [resolvedTheme, setState]);

  return (
    <AppContext.Provider value={{ state, setState, theme: resolvedTheme, toggleTheme, setTheme, setPalette, online, syncStatus, retrySync, loading }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
