import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { AppState, Theme } from '@/types';
import { getDefaultState, migrateWeeks } from '@/lib/data';

const STORAGE_KEY = 'nutriplan-state-v1';

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const def = getDefaultState();
      return { ...def, ...parsed, weeks: migrateWeeks(parsed.weeks ?? def.weeks), customFoods: parsed.customFoods ?? [], notifications: { ...def.notifications, ...parsed.notifications }, workoutLogs: parsed.workoutLogs ?? [], onboardingComplete: parsed.onboardingComplete ?? false };
    }
  } catch {
    // ignore
  }
  return getDefaultState();
}

function saveState(state: AppState) {
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
}

const AppContext = createContext<AppContextValue | null>(null);

function resolveTheme(theme: Theme): 'light' | 'dark' {
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return theme;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setStateInner] = useState<AppState>(loadState);
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() => resolveTheme(state.theme));

  const setState = useCallback((updater: (prev: AppState) => AppState) => {
    setStateInner((prev) => {
      const next = updater(prev);
      saveState(next);
      return next;
    });
  }, []);

  useEffect(() => {
    saveState(state);
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
    <AppContext.Provider value={{ state, setState, theme: resolvedTheme, toggleTheme, setTheme }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
