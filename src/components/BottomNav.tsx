import { Home, Salad, Dumbbell, Scale, Settings, BookOpen, Activity } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type TabKey = 'home' | 'diet' | 'nutrition' | 'food' | 'gym' | 'body' | 'settings';

interface TabDef {
  key: TabKey;
  label: string;
  icon: LucideIcon;
}

export const TABS: TabDef[] = [
  { key: 'home', label: 'Home', icon: Home },
  { key: 'diet', label: 'Dieta', icon: Salad },
  { key: 'nutrition', label: 'Nutri', icon: Dumbbell },
  { key: 'food', label: 'Alimenti', icon: BookOpen },
  { key: 'gym', label: 'Palestra', icon: Activity },
  { key: 'body', label: 'Corpo', icon: Scale },
  { key: 'settings', label: 'Impost.', icon: Settings },
];

interface BottomNavProps {
  active: TabKey;
  onChange: (tab: TabKey) => void;
}

export function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl border-t border-white/80 dark:border-white/[0.07] safe-bottom" role="navigation" aria-label="Barra di navigazione principale">
      <div className="max-w-md mx-auto flex items-center justify-around px-1 py-1.5 overflow-x-auto no-scrollbar">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = active === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => onChange(tab.key)}
              className="tap-press flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl shrink-0"
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
              role="tab"
              aria-selected={isActive}
            >
              <div className={`p-1 rounded-lg transition-all duration-300 ${isActive ? 'bg-primary-100 dark:bg-primary-900/40 scale-110 shadow-[0_0_16px_-2px_rgb(var(--c-primary-400)/0.6)]' : 'scale-100'}`}>
                <Icon className={`w-5 h-5 transition-colors duration-200 ${isActive ? 'text-primary-700 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400'}`} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={`text-[9px] font-medium transition-colors duration-200 ${isActive ? 'text-primary-700 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400'}`}>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
