import { useState } from 'react';
import { ChevronDown, Lightbulb } from 'lucide-react';
import type { ManualSection } from '@/lib/manual';

export function GuideContent({ section }: { section: ManualSection }) {
  return (
    <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
      <p>{section.content}</p>
      {section.steps && (
        <ol className="space-y-2">
          {section.steps.map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="w-6 h-6 shrink-0 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 text-xs font-semibold flex items-center justify-center">
                {i + 1}
              </span>
              <span className="pt-0.5">{step}</span>
            </li>
          ))}
        </ol>
      )}
      {section.tips && (
        <div className="p-3 rounded-xl bg-accent-50 dark:bg-accent-900/20 border border-accent-100 dark:border-accent-900/40">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-accent-700 dark:text-accent-300 mb-1.5">
            <Lightbulb className="w-3.5 h-3.5" aria-hidden="true" /> Consigli
          </p>
          <ul className="space-y-1.5 text-xs">
            {section.tips.map((tip, i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-1.5 w-1 h-1 rounded-full bg-accent-500 shrink-0" aria-hidden="true" />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function GuideToggle({ section, label }: { section: ManualSection; label: string }) {
  const [open, setOpen] = useState(false);
  const Icon = section.icon;
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-sm font-medium text-primary-700 dark:text-primary-300 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors"
        aria-expanded={open}
      >
        <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
        <span className="flex-1">{label}</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
      {open && (
        <div className="px-3 pb-3 animate-fade-in">
          <GuideContent section={section} />
        </div>
      )}
    </div>
  );
}
