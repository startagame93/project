import { useEffect, useState } from 'react';
import { Bug, ClipboardCopy, Check, AlertCircle } from 'lucide-react';
import { adminLoadBugReports } from '@/lib/supabase';
import { copyText } from '@/lib/clipboard';
import { formatBugReportsPrompt } from '@/lib/bugReportPrompt';

type Toast = { kind: 'ok' | 'error'; text: string } | null;

export function BugReportCopySection() {
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<Toast>(null);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(t);
  }, [toast]);

  async function handleCopy() {
    setBusy(true);
    const bugs = await adminLoadBugReports();
    if (bugs === null) {
      setToast({ kind: 'error', text: 'Impossibile leggere le segnalazioni. Riprova.' });
    } else if (bugs.length === 0) {
      setToast({ kind: 'error', text: 'Nessuna segnalazione da copiare.' });
    } else {
      const ok = await copyText(formatBugReportsPrompt(bugs));
      setToast(ok
        ? { kind: 'ok', text: 'Copiato negli appunti!' }
        : { kind: 'error', text: 'Copia non riuscita: riprova.' });
    }
    setBusy(false);
  }

  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 mb-1">
        <Bug className="w-5 h-5 text-primary-600 dark:text-primary-400" />
        <h3 className="section-title">Gestione bug</h3>
      </div>
      <p className="text-xs text-gray-500 mb-4 leading-relaxed">
        Copia tutte le segnalazioni degli utenti in un testo pronto da incollare a Bolt per correggerle.
      </p>
      <button onClick={handleCopy} disabled={busy} className="btn-primary w-full flex items-center justify-center gap-2">
        <ClipboardCopy className="w-4 h-4" /> Copia Segnalazioni per Bolt
      </button>

      {toast && (
        <div
          role="status"
          className={`fixed left-1/2 -translate-x-1/2 bottom-24 z-[70] flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-lg text-sm font-medium animate-fade-in ${
            toast.kind === 'ok' ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' : 'bg-error-600 text-white'
          }`}
        >
          {toast.kind === 'ok' ? <Check className="w-4 h-4 text-success-400 dark:text-success-600" /> : <AlertCircle className="w-4 h-4" />}
          {toast.text}
        </div>
      )}
    </div>
  );
}
