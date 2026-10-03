import { useState } from 'react';
import { Modal } from '@/components/Modal';
import { Info, Flame, ChevronDown, ChevronUp } from 'lucide-react';
import { MANUAL_SECTIONS, NEW_SECTIONS, APP_VERSION, APP_VERSION_LABEL } from '@/lib/manual';

function NewBadge() {
  return (
    <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-md bg-error-500 text-white">New</span>
  );
}

export function InfoScreen({ onClose }: { onClose: () => void }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <Modal open onClose={onClose} title="Manuale d'uso" icon={Info}>
      <p className="text-xs text-gray-500 mb-3">Versione {APP_VERSION_LABEL}</p>
      <div className="space-y-2">
        {MANUAL_SECTIONS.map((section) => {
          const Icon = section.icon;
          const isOpen = expanded === section.title;
          return (
            <div key={section.title} className="rounded-xl bg-gray-50 dark:bg-gray-800 overflow-hidden">
              <button
                onClick={() => setExpanded(isOpen ? null : section.title)}
                className="w-full flex items-center gap-3 p-3 text-left"
                aria-expanded={isOpen}
              >
                <div className="w-9 h-9 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
                <span className="flex-1 text-sm font-medium text-gray-900 dark:text-white">{section.title}</span>
                {section.since === APP_VERSION && <NewBadge />}
                {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </button>
              {isOpen && (
                <p className="px-3 pb-3 text-sm text-gray-600 dark:text-gray-400 leading-relaxed animate-fade-in">
                  {section.content}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </Modal>
  );
}

export function ChangelogModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal open onClose={onClose} title={`Novita - ${APP_VERSION_LABEL}`} icon={Flame}>
      <div className="space-y-2">
        {NEW_SECTIONS.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.title} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
              <Icon className="w-5 h-5 text-primary-600 dark:text-primary-400 shrink-0 mt-0.5" />
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{item.title}</span>
                  <NewBadge />
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{item.content}</p>
              </div>
            </div>
          );
        })}
      </div>
      <button onClick={onClose} className="btn-primary w-full mt-4">Inizia a esplorare</button>
    </Modal>
  );
}
