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
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg border-t border-gray-200 dark:border-gray-800 safe-bottom" role="navigation" aria-label="Barra di navigazione principale">
      <div className="max-w-md mx-auto flex items-center justify-around px-1 py-1.5 overflow-x-auto no-scrollbar">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = active === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => onChange(tab.key)}
              className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all duration-200 shrink-0"
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
              role="tab"
              aria-selected={isActive}
            >
              <div className={`p-1 rounded-lg transition-all duration-200 ${isActive ? 'bg-primary-100 dark:bg-primary-900/30 scale-110' : 'scale-100'}`}>
                <Icon className={`w-5 h-5 ${isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 dark:text-gray-600'}`} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={`text-[9px] font-medium ${isActive ? 'text-primary-600 dark:text-primary-400 opacity-100' : 'text-gray-400 dark:text-gray-600 opacity-70'}`}>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
