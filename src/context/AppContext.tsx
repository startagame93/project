import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from 'react';
import type { AppState, Theme } from '@/types';
import { getDefaultState, migrateWeeks } from '@/lib/data';
import { loadRemoteState, saveRemoteState } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { applyPalette, getPalette } from '@/lib/palettes';

const STORAGE_KEY = 'nutriplan-state-v1';
const PENDING_KEY = 'nutriplan-pending-sync';

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

function mergeState(parsed: Partial<AppState>): AppState {
  const def = getDefaultState();
  return {
    ...def,
    ...parsed,
    weeks: migrateWeeks(parsed.weeks ?? def.weeks),
    customFoods: parsed.customFoods ?? [],
    notifications: { ...def.notifications, ...parsed.notifications },
    workoutLogs: parsed.workoutLogs ?? [],
    onboardingComplete: parsed.onboardingComplete ?? false,
    lastChangelogVersion: parsed.lastChangelogVersion ?? '',
    mealHistory: parsed.mealHistory ?? {},
    dayChecks: parsed.dayChecks ?? {},
  };
}

function loadLocalState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return mergeState(JSON.parse(raw));
    }
  } catch {
    // ignore
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

interface AppContextValue {
  state: AppState;
  setState: (updater: (prev: AppState) => AppState) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
  setPalette: (id: string) => void;
  online: boolean;
  pendingSync: boolean;
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
  const [pendingSync, setPending] = useState(hasPendingSync);
  const syncTimer = useRef<number | undefined>(undefined);

  const flush = useCallback(async (snapshot: AppState) => {
    let ok = false;
    try {
      ok = navigator.onLine && await saveRemoteState(snapshot as unknown as Record<string, unknown>);
    } catch (err) {
      console.error('sync failed', err);
    }
    setPendingSync(!ok);
    setPending(!ok);
  }, []);

  const scheduleSync = useCallback((snapshot: AppState) => {
    setPendingSync(true);
    setPending(true);
    window.clearTimeout(syncTimer.current);
    syncTimer.current = window.setTimeout(() => { void flush(snapshot); }, 1200);
  }, [flush]);

  // Load from Supabase when user logs in; reset state on user change
  useEffect(() => {
    if (!user) {
      // User logged out or switched: reset to clean default state
      setStateInner(getDefaultState());
      setPendingSync(false);
      setPending(false);
      setLoading(false);
      return;
    }
    let mounted = true;
    (async () => {
      const timedOut = Symbol('timeout');
      const remote = await Promise.race([
        loadRemoteState().catch(() => null),
        new Promise<typeof timedOut>((resolve) => setTimeout(() => resolve(timedOut), 6000)),
      ]);
      if (!mounted) return;
      if (remote === timedOut) {
        // Offline or slow network: keep the locally cached state so the app still opens
      } else if (hasPendingSync()) {
        // Unsynced offline changes win over the older server copy
        void flush(loadLocalState());
      } else if (remote) {
        skipRemoteSave.current = true;
        setStateInner(mergeState(remote as Partial<AppState>));
      } else {
        setStateInner(getDefaultState());
      }
      setLoading(false);
    })();
    return () => { mounted = false; };
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
    const goOffline = () => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
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
    <AppContext.Provider value={{ state, setState, theme: resolvedTheme, toggleTheme, setTheme, setPalette, online, pendingSync, loading }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
