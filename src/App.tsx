import { useState, useEffect, useRef, useCallback } from 'react';
import { AppProvider, useApp } from '@/context/AppContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { BottomNav, type TabKey } from '@/components/BottomNav';
import { Dashboard } from '@/views/Dashboard';
import { DietView } from '@/views/DietView';
import { NutritionView } from '@/views/NutritionView';
import { BodyView } from '@/views/BodyView';
import { ShoppingView } from '@/views/ShoppingView';
import { SettingsView } from '@/views/SettingsView';
import { FoodDatabaseView } from '@/views/FoodDatabaseView';
import { GymView } from '@/views/GymView';
import { Onboarding } from '@/views/Onboarding';
import { AuthScreen } from '@/views/AuthScreen';
import { AdminDashboard } from '@/views/AdminDashboard';
import { InfoScreen, ChangelogModal } from '@/views/InfoScreen';
import { SupportModal } from '@/views/SupportModal';
import { Moon, Sun, ShoppingCart, MessageCircle, Flame, User as UserIcon } from 'lucide-react';
import { signOut } from '@/lib/supabase';

const APP_VERSION = 'alpha-4.0';
const TAB_ORDER: (TabKey | 'shopping')[] = ['home', 'diet', 'nutrition', 'food', 'gym', 'body', 'settings', 'shopping'];

const TAB_TITLES: Record<TabKey | 'shopping' | 'admin', string> = {
  home: 'NutriPlan',
  diet: 'Piano Alimentare',
  nutrition: 'Nutrizione',
  body: 'Composizione Corporea',
  food: 'Database Alimenti',
  gym: 'Palestra & Attivita',
  settings: 'Impostazioni',
  shopping: 'Lista della Spesa',
  admin: 'Dashboard Sviluppatore',
};

function SplashScreen({ name, avatarUrl }: { name: string; avatarUrl?: string | null }) {
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center" role="status" aria-live="polite">
      <div className="w-28 h-28 rounded-3xl border-2 border-primary-500 overflow-hidden flex items-center justify-center mb-6 shadow-lg">
        {avatarUrl ? (
          <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
            <Flame className="w-14 h-14 text-white" strokeWidth={1.5} />
          </div>
        )}
      </div>
      <h1 className="text-2xl font-bold text-white mb-1">NutriPlan</h1>
      <p className="text-sm text-primary-400 animate-pulse">Benvenuto {name}</p>
      <div className="mt-6 w-32 h-1 bg-gray-800 rounded-full overflow-hidden">
        <div className="h-full bg-primary-500 animate-[loading_1.2s_ease-in-out] rounded-full" style={{ width: '100%' }} />
      </div>
    </div>
  );
}

function AppContent() {
  const [tab, setTab] = useState<TabKey | 'shopping' | 'admin'>('home');
  const { theme, toggleTheme, state, setState } = useApp();
  const { user, isAdmin, isBanned, isFounder, profile } = useAuth();
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const [showInfo, setShowInfo] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const [showChangelog, setShowChangelog] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  const switchTab = useCallback((direction: number) => {
    setTab((current) => {
      const idx = TAB_ORDER.indexOf(current as TabKey | 'shopping');
      let nextIdx = idx + direction;
      if (nextIdx < 0) nextIdx = TAB_ORDER.length - 1;
      if (nextIdx >= TAB_ORDER.length) nextIdx = 0;
      if (TAB_ORDER[nextIdx] === 'shopping') {
        if (direction > 0) nextIdx = 0;
        else nextIdx = TAB_ORDER.length - 2;
      }
      return TAB_ORDER[nextIdx];
    });
  }, []);

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function onTouchEnd(e: React.TouchEvent) {
    touchEndX.current = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 80) {
      switchTab(diff > 0 ? 1 : -1);
    }
  }

  useEffect(() => {
    if (state.lastChangelogVersion !== APP_VERSION) {
      setShowChangelog(true);
      setState((prev) => ({ ...prev, lastChangelogVersion: APP_VERSION }));
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 1800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!state.notifications.enabled) return;
    if (!('Notification' in window)) return;
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
    const intervals: number[] = [];
    if (state.notifications.hydration) {
      const interval = window.setInterval(() => {
        if (Notification.permission === 'granted') {
          new Notification('NutriPlan - Idratazione', {
            body: 'Ricorda di bere un bicchiere d\'acqua!',
            icon: '/icon-192.png',
          });
        }
      }, state.notifications.hydrationInterval * 60 * 60 * 1000);
      intervals.push(interval);
    }
    return () => intervals.forEach(clearInterval);
  }, [state.notifications.enabled, state.notifications.hydration, state.notifications.hydrationInterval]);

  const displayName = profile?.display_name || state.profile.name || 'Atleta';

  if (showSplash) {
    return <SplashScreen name={displayName} avatarUrl={profile?.avatar_url} />;
  }

  if (isBanned) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-6 max-w-md mx-auto text-center">
        <h1 className="text-xl font-bold text-error-600 mb-2">Account sospeso</h1>
        <p className="text-sm text-gray-500 mb-6">Il tuo account e stato bloccato dall'amministratore. Contatta il supporto per maggiori informazioni.</p>
        <button onClick={() => signOut()} className="btn-secondary">Esci</button>
      </div>
    );
  }

  if (!state.onboardingComplete) {
    return (
      <Onboarding onComplete={() => { setState((prev) => ({ ...prev, onboardingComplete: true })); setTab('home'); }} />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-gray-950/90 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800 safe-top" role="banner">
        <div className="max-w-md mx-auto flex items-center justify-between px-4 py-3">
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">{TAB_TITLES[tab]}</h1>
          <div className="flex items-center gap-1">
            {tab !== 'shopping' && (
              <button
                onClick={() => setTab('shopping')}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors relative"
                aria-label={`Lista della spesa, ${state.shoppingList.filter((i) => !i.checked).length} articoli`}
              >
                <ShoppingCart className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                {state.shoppingList.filter((i) => !i.checked).length > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-primary-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {state.shoppingList.filter((i) => !i.checked).length}
                  </span>
                )}
              </button>
            )}
            <button
              onClick={() => setShowInfo(true)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Informazioni e manuale d'uso"
            >
              <div className="w-5 h-5 rounded-full border-2 border-gray-600 dark:border-gray-400 flex items-center justify-center">
                <span className="text-[10px] font-bold text-gray-600 dark:text-gray-400">i</span>
              </div>
            </button>
            <button
              onClick={() => setShowSupport(true)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Supporto e segnalazioni"
            >
              <MessageCircle className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label={theme === 'dark' ? 'Passa al tema chiaro' : 'Passa al tema scuro'}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5 text-gray-600 dark:text-gray-400" /> : <Moon className="w-5 h-5 text-gray-600 dark:text-gray-400" />}
            </button>
            {isFounder && (
              <button
                onClick={() => setTab('admin')}
                className="ml-1 px-2.5 py-1.5 rounded-lg bg-primary-600 text-white text-[10px] font-bold hover:bg-primary-700 transition-colors"
                aria-label="Pannello Sviluppatore"
              >
                Sviluppatore
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-4 animate-fade-in" key={tab} role="main">
        {tab === 'home' && <Dashboard onNavigate={(t) => setTab(t)} />}
        {tab === 'diet' && <DietView />}
        {tab === 'nutrition' && <NutritionView />}
        {tab === 'food' && <FoodDatabaseView />}
        {tab === 'gym' && <GymView />}
        {tab === 'body' && <BodyView />}
        {tab === 'shopping' && <ShoppingView />}
        {tab === 'settings' && <SettingsView onNavigate={(t) => setTab(t)} />}
        {tab === 'admin' && (isFounder || isAdmin) && <AdminDashboard />}
      </main>

      {tab === 'shopping' ? (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg border-t border-gray-200 dark:border-gray-800 safe-bottom">
          <div className="max-w-md mx-auto px-4 py-3">
            <button onClick={() => setTab('home')} className="btn-secondary w-full" aria-label="Torna alla Home">
              Torna alla Home
            </button>
          </div>
        </div>
      ) : tab === 'admin' ? (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg border-t border-gray-200 dark:border-gray-800 safe-bottom">
          <div className="max-w-md mx-auto px-4 py-3">
            <button onClick={() => setTab('home')} className="btn-secondary w-full">
              Torna all'App
            </button>
          </div>
        </div>
      ) : (
        <BottomNav active={tab as TabKey} onChange={(t) => setTab(t)} />
      )}

      {showInfo && <InfoScreen onClose={() => setShowInfo(false)} />}
      {showSupport && <SupportModal onClose={() => setShowSupport(false)} />}
      {showChangelog && <ChangelogModal onClose={() => setShowChangelog(false)} />}
    </div>
  );
}

function AppInner() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center animate-pulse">
          <Flame className="w-6 h-6 text-white" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}

export default App;
