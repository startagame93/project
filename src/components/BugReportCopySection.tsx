import { useEffect, useState } from 'react';
import { ClipboardCopy, Check, AlertCircle, Loader2 } from 'lucide-react';
import { adminLoadBugReports } from '@/lib/supabase';
import { formatBugReportsPrompt } from '@/lib/bugReportPrompt';
import { copyText } from '@/lib/clipboard';

type Toast = { kind: 'ok' | 'error'; text: string } | null;

export function BugReportCopySection() {
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<Toast>(null);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(t);
  }, [toast]);

  async function copyReports() {
    setBusy(true);
    const bugs = await adminLoadBugReports();
    if (bugs === null) {
      setBusy(false);
      setToast({ kind: 'error', text: 'Impossibile leggere le segnalazioni. Riprova.' });
      return;
    }
    if (bugs.length === 0) {
      setBusy(false);
      setToast({ kind: 'error', text: 'Nessuna segnalazione da copiare.' });
      return;
    }
    const ok = await copyText(formatBugReportsPrompt(bugs));
    setBusy(false);
    setToast(ok
      ? { kind: 'ok', text: `${bugs.length} segnalazioni copiate negli appunti` }
      : { kind: 'error', text: 'Copia non riuscita: riprova.' });
  }

  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 mb-1">
        <ClipboardCopy className="w-5 h-5 text-primary-600 dark:text-primary-400" />
        <h3 className="section-title">Gestione bug</h3>
      </div>
      <p className="text-xs text-gray-500 mb-3 leading-relaxed">
        Copia tutte le segnalazioni degli utenti in un prompt pronto per Bolt, senza nomi né date.
      </p>
      <button onClick={copyReports} disabled={busy} className="btn-primary w-full text-sm">
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ClipboardCopy className="w-4 h-4" />} Copia Segnalazioni per Bolt
      </button>
      {toast && (
        <div role="status" className={`mt-3 flex items-center gap-2 p-2.5 rounded-xl border text-sm ${
          toast.kind === 'ok'
            ? 'bg-success-50 border-success-200 text-success-700 dark:bg-success-900/20 dark:border-success-800 dark:text-success-300'
            : 'bg-error-50 border-error-200 text-error-700 dark:bg-error-900/20 dark:border-error-800 dark:text-error-300'
        }`}>
          {toast.kind === 'ok' ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{toast.text}</span>
        </div>
      )}
    </div>
  );
}
