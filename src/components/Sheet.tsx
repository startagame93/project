import type { LucideIcon } from 'lucide-react';
import { X } from 'lucide-react';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  icon?: LucideIcon;
  iconColor?: string;
  title: string;
  children: React.ReactNode;
}

export function Sheet({ open, onClose, icon: Icon, iconColor, title, children }: SheetProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-t-3xl shadow-xl animate-slide-up max-h-[85vh] flex flex-col">
        <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-800">
          {Icon && (
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconColor || 'bg-primary-100 dark:bg-primary-900/30'}`}>
              <Icon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
          )}
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex-1">{title}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="p-4 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
}
