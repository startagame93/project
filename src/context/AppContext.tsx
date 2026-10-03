import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from 'react';
import type { AppState, Theme } from '@/types';
import { getDefaultState, migrateWeeks } from '@/lib/data';
import { loadRemoteState, saveRemoteState } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

const STORAGE_KEY = 'nutriplan-state-v1';

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

  // Load from Supabase when user logs in; reset state on user change
  useEffect(() => {
    if (!user) {
      // User logged out or switched: reset to clean default state
      setStateInner(getDefaultState());
      setLoading(false);
      return;
    }
    let mounted = true;
    (async () => {
      const remote = await loadRemoteState();
      if (remote && mounted) {
        skipRemoteSave.current = true;
        setStateInner(mergeState(remote as Partial<AppState>));
      } else if (mounted) {
        // New user with no remote data: start fresh
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
      if (user && !skipRemoteSave.current) {
        saveRemoteState(next as unknown as Record<string, unknown>);
      }
      return next;
    });
  }, [user]);

  useEffect(() => {
    if (skipRemoteSave.current) {
      skipRemoteSave.current = false;
    }
  }, [state]);

  useEffect(() => {
    saveLocalState(state);
  }, [state]);

  useEffect(() => {
    const resolved = resolveTheme(state.theme);
    setResolvedTheme(resolved);
    document.documentElement.classList.toggle('dark', resolved === 'dark');
  }, [state.theme]);

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

  const toggleTheme = useCallback(() => {
    setState((prev) => ({
      ...prev,
      theme: resolvedTheme === 'dark' ? 'light' : 'dark',
    }));
  }, [resolvedTheme, setState]);

  return (
    <AppContext.Provider value={{ state, setState, theme: resolvedTheme, toggleTheme, setTheme, loading }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
