import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase, getUserProfile, type UserProfileDB } from '@/lib/supabase';

interface AuthContextValue {
  user: User | null;
  profile: UserProfileDB | null;
  loading: boolean;
  isAdmin: boolean;
  isBanned: boolean;
  refreshProfile: () => Promise<void>;
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

    supabase.auth.onAuthStateChange((event, session) => {
      (async () => {
        if (session?.user && mounted) {
          setUser(session.user);
          await refreshProfile();
        } else if (mounted) {
          setUser(null);
          setProfile(null);
        }
        if (mounted) setLoading(false);
      })();
    });

    return () => { mounted = false; };
  }, [refreshProfile]);

  const isAdmin = profile?.is_admin ?? false;
  const isBanned = profile?.is_banned ?? false;

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAdmin, isBanned, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
