import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase, getUserProfile, isFounderEmail, touchPresence, type UserProfileDB } from '@/lib/supabase';
import { STORAGE_KEY, STARTUP_TIMEOUT_MS, withTimeout } from '@/lib/localReset';

interface AuthContextValue {
  user: User | null;
  profile: UserProfileDB | null;
  loading: boolean;
  isAdmin: boolean;
  isBanned: boolean;
  isFounder: boolean;
  refreshProfile: () => Promise<void>;
  displayName: string;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfileDB | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    const p = await getUserProfile();
    setProfile(p);
  }, []);

  useEffect(() => {
    let mounted = true;
    // Never leave the login check spinning: unlock after STARTUP_TIMEOUT_MS even if auth hangs
    const safety = window.setTimeout(() => { if (mounted) setLoading(false); }, STARTUP_TIMEOUT_MS);

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        if (session?.user && mounted) {
          setUser(session.user);
          const p = await withTimeout(getUserProfile(), null);
          if (mounted && p) setProfile(p);
        } else if (mounted) {
          setUser(null);
          setProfile(null);
          try {
            localStorage.removeItem(STORAGE_KEY);
          } catch {
            // ignore
          }
        }
        if (mounted) setLoading(false);
      })();
    });

    return () => { mounted = false; clearTimeout(safety); data.subscription.unsubscribe(); };
  }, []);

  const userId = user?.id;
  useEffect(() => {
    if (!userId) return;
    touchPresence(userId);
    const beat = window.setInterval(() => {
      if (document.visibilityState === 'visible') touchPresence(userId);
    }, 60_000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') touchPresence(userId);
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(beat);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [userId]);

  const isAdmin = profile?.is_admin ?? false;
  const isBanned = profile?.is_banned ?? false;
  const isFounder = user ? isFounderEmail(user.email ?? '') : false;
  const metaName = String(user?.user_metadata?.name ?? '').trim();
  const emailPrefix = (user?.email ?? '').split('@')[0];
  const storedName = (profile?.display_name ?? '').trim();
  const displayName = storedName && storedName !== emailPrefix ? storedName : metaName;

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAdmin, isBanned, isFounder, refreshProfile, displayName }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
