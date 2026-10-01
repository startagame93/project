import { useState, useEffect, useRef, useCallback } from 'react';
import { AppProvider, useApp } from '@/context/AppContext';
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
import { Moon, Sun, ShoppingCart } from 'lucide-react';

const TAB_ORDER: (TabKey | 'shopping')[] = ['home', 'diet', 'nutrition', 'food', 'gym', 'body', 'settings', 'shopping'];

const TAB_TITLES: Record<TabKey | 'shopping', string> = {
  home: 'NutriPlan',
  diet: 'Piano Alimentare',
  nutrition: 'Nutrizione',
  body: 'Composizione Corporea',
  food: 'Database Alimenti',
  gym: 'Palestra & Attivita',
  settings: 'Impostazioni',
  shopping: 'Lista della Spesa',
};

function AppContent() {
  const [tab, setTab] = useState<TabKey | 'shopping'>('home');
  const { theme, toggleTheme, state, setState } = useApp();
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const switchTab = useCallback((direction: number) => {
    setTab((current) => {
      const idx = TAB_ORDER.indexOf(current);
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

  if (!state.onboardingComplete) {
    return (
      <Onboarding onComplete={() => setState((prev) => ({ ...prev, onboardingComplete: true }))} />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-gray-950/90 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800 safe-top" role="banner">
        <div className="max-w-md mx-auto flex items-center justify-between px-4 py-3">
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">{TAB_TITLES[tab]}</h1>
          <div className="flex items-center gap-1">
            {tab !== 'shopping' && (
              <button
                onClick={() => setTab('shopping')}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors relative"
                aria-label={`Lista della spesa, ${state.shoppingList.filter((i) => !i.checked).length} articoli da comprare`}
              >
                <ShoppingCart className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                {state.shoppingList.filter((i) => !i.checked).length > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-primary-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center" aria-hidden="true">
                    {state.shoppingList.filter((i) => !i.checked).length}
                  </span>
                )}
              </button>
            )}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label={theme === 'dark' ? 'Passa al tema chiaro' : 'Passa al tema scuro'}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5 text-gray-600 dark:text-gray-400" /> : <Moon className="w-5 h-5 text-gray-600 dark:text-gray-400" />}
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-md mx-auto px-4 py-4 animate-fade-in" key={tab} role="main">
        {tab === 'home' && <Dashboard onNavigate={(t) => setTab(t)} />}
        {tab === 'diet' && <DietView />}
        {tab === 'nutrition' && <NutritionView />}
        {tab === 'food' && <FoodDatabaseView />}
        {tab === 'gym' && <GymView />}
        {tab === 'body' && <BodyView />}
        {tab === 'shopping' && <ShoppingView />}
        {tab === 'settings' && <SettingsView onNavigate={(t) => setTab(t)} />}
      </main>

      {/* Bottom nav (hide on shopping sub-page to show back) */}
      {tab === 'shopping' ? (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg border-t border-gray-200 dark:border-gray-800 safe-bottom">
          <div className="max-w-md mx-auto px-4 py-3">
            <button onClick={() => setTab('home')} className="btn-secondary w-full" aria-label="Torna alla Home">
              Torna alla Home
            </button>
          </div>
        </div>
      ) : (
        <BottomNav active={tab as TabKey} onChange={(t) => setTab(t)} />
      )}
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
