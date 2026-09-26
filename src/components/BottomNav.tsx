import { Home, Salad, Dumbbell, Scale, Settings } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type TabKey = 'home' | 'diet' | 'nutrition' | 'body' | 'settings';

interface TabDef {
  key: TabKey;
  label: string;
  icon: LucideIcon;
}

export const TABS: TabDef[] = [
  { key: 'home', label: 'Home', icon: Home },
  { key: 'diet', label: 'Dieta', icon: Salad },
  { key: 'nutrition', label: 'Nutri', icon: Dumbbell },
  { key: 'body', label: 'Corpo', icon: Scale },
  { key: 'settings', label: 'Impost.', icon: Settings },
];

interface BottomNavProps {
  active: TabKey;
  onChange: (tab: TabKey) => void;
}

export function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg border-t border-gray-200 dark:border-gray-800 safe-bottom">
      <div className="max-w-md mx-auto flex items-center justify-around px-2 py-1.5">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = active === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => onChange(tab.key)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-gray-400 dark:text-gray-600'
              }`}
            >
              <div className={`p-1 rounded-lg transition-all duration-200 ${isActive ? 'bg-primary-100 dark:bg-primary-900/30 scale-110' : 'scale-100'}`}>
                <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={`text-[10px] font-medium ${isActive ? 'opacity-100' : 'opacity-70'}`}>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
