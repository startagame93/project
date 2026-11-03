import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from 'react';
import type { AppState, Theme } from '@/types';
import { getDefaultState } from '@/lib/data';
import { loadRemoteState, saveRemoteState, type RemoteSaveResult, type RemoteSnapshot } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { applyPalette, getPalette } from '@/lib/palettes';
import { withTimeout } from '@/lib/localReset';
import { mergeState } from '@/lib/stateNormalize';
import { deepEqual, mergeThreeWay } from '@/lib/stateMerge';
import { loadOfflineRecord, saveOfflineRecord, discardSyncedRecord, type OfflineRecord } from '@/lib/offlineStore';

export type SyncStatus = 'synced' | 'syncing' | 'pending' | 'error';

const SYNC_TIMEOUT_MS = 15000;
const SYNC_DEBOUNCE_MS = 1200;
const SYNC_INTERVAL_MS = 30000;
const MAX_ATTEMPTS = 3;
const UNAVAILABLE = Symbol('unavailable');

type Attempt = 'done' | 'retry' | 'unavailable' | 'error';

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
  const userId = user?.id ?? null;
  const [state, setStateInner] = useState<AppState>(() => getDefaultState());
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() => resolveTheme(state.theme));
  const [loading, setLoading] = useState(true);
  const [online, setOnline] = useState(() => navigator.onLine);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('synced');

  const stateRef = useRef(state);
  const baseRef = useRef<AppState | null>(null);
  const dirtyRef = useRef(false);
  const versionRef = useRef(0);
  const ownerRef = useRef<string | null>(null);
  const runningRef = useRef(false);
  const rerunRef = useRef(false);
  const timerRef = useRef<number | undefined>(undefined);

  const applyState = useCallback((next: AppState) => {
    stateRef.current = next;
    setStateInner(next);
  }, []);

  const persist = useCallback(() => {
    const owner = ownerRef.current;
    if (!owner) return;
    const record: OfflineRecord = { owner, local: stateRef.current, base: baseRef.current, dirty: dirtyRef.current };
    saveOfflineRecord(record).catch((err) => console.error('offline save failed', err));
  }, []);

  const attemptSync = useCallback(async (): Promise<Attempt> => {
    const fetched = await withTimeout<RemoteSnapshot | null | typeof UNAVAILABLE>(loadRemoteState(), UNAVAILABLE, SYNC_TIMEOUT_MS);
    if (fetched === UNAVAILABLE) return 'unavailable';
    const remote = fetched ? mergeState(fetched.data) : null;

    if (!dirtyRef.current) {
      if (remote) {
        baseRef.current = remote;
        if (!deepEqual(remote, stateRef.current)) applyState(remote);
        persist();
      }
      return 'done';
    }

    const local = stateRef.current;
    const startVersion = versionRef.current;
    const merged = remote ? mergeState(mergeThreeWay<AppState>(baseRef.current ?? undefined, local, remote)) : local;
    const saved = await withTimeout<RemoteSaveResult>(
      saveRemoteState(merged, fetched ? fetched.updatedAt : null),
      { ok: false, conflict: false },
      SYNC_TIMEOUT_MS,
    );
    if (!saved.ok) return saved.conflict ? 'retry' : 'unavailable';

    baseRef.current = merged;
    const unchanged = versionRef.current === startVersion;
    if (unchanged) {
      dirtyRef.current = false;
      applyState(merged);
    }
    persist();
    return unchanged ? 'done' : 'retry';
  }, [applyState, persist]);

  const syncRounds = useCallback(async (): Promise<Attempt> => {
    for (let round = 0; round < MAX_ATTEMPTS; round++) {
      const outcome = await attemptSync();
      if (outcome !== 'retry') return outcome;
    }
    return 'retry';
  }, [attemptSync]);

  const reconcile = useCallback(async () => {
    if (!ownerRef.current) return;
    if (runningRef.current) {
      rerunRef.current = true;
      return;
    }
    if (!navigator.onLine) {
      setSyncStatus(dirtyRef.current ? 'pending' : 'synced');
      return;
    }
    runningRef.current = true;
    if (dirtyRef.current) setSyncStatus('syncing');
    let outcome: Attempt = 'error';
    try {
      do {
        rerunRef.current = false;
        outcome = await syncRounds();
      } while (rerunRef.current);
    } catch (err) {
      console.error('sync failed', err);
    }
    runningRef.current = false;
    setSyncStatus(outcome === 'error' ? 'error' : dirtyRef.current ? 'pending' : 'synced');
  }, [syncRounds]);

  const scheduleSync = useCallback(() => {
    setSyncStatus(navigator.onLine ? 'syncing' : 'pending');
    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => { void reconcile(); }, SYNC_DEBOUNCE_MS);
  }, [reconcile]);

  const setState = useCallback((updater: (prev: AppState) => AppState) => {
    const next = updater(stateRef.current);
    if (next === stateRef.current) return;
    versionRef.current++;
    dirtyRef.current = true;
    applyState(next);
    persist();
    scheduleSync();
  }, [applyState, persist, scheduleSync]);

  const retrySync = useCallback(() => { void reconcile(); }, [reconcile]);

  useEffect(() => {
    if (!userId) {
      ownerRef.current = null;
      baseRef.current = null;
      dirtyRef.current = false;
      applyState(getDefaultState());
      setSyncStatus('synced');
      setLoading(false);
      return;
    }
    let cancelled = false;
    ownerRef.current = null;
    setLoading(true);
    (async () => {
      let record: OfflineRecord | null = null;
      try {
        record = await loadOfflineRecord(userId);
      } catch (err) {
        console.error('offline cache unreadable', err);
      }
      if (cancelled) return;
      ownerRef.current = userId;
      baseRef.current = record?.base ?? null;
      dirtyRef.current = record?.dirty ?? false;
      applyState(record?.local ?? getDefaultState());
      setSyncStatus(dirtyRef.current ? 'pending' : 'synced');
      setLoading(false);
      void reconcile();
    })();
    return () => {
      cancelled = true;
      window.clearTimeout(timerRef.current);
      if (ownerRef.current === userId && !dirtyRef.current) {
        discardSyncedRecord(userId).catch((err) => console.error('offline cleanup failed', err));
      }
    };
  }, [userId, applyState, reconcile]);

  useEffect(() => {
    const goOnline = () => {
      setOnline(true);
      void reconcile();
    };
    const goOffline = () => {
      setOnline(false);
      if (dirtyRef.current) setSyncStatus('pending');
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible') void reconcile();
    };
    const interval = window.setInterval(() => {
      if (dirtyRef.current) void reconcile();
    }, SYNC_INTERVAL_MS);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [reconcile]);

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
