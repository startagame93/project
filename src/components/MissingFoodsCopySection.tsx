import { useEffect, useState } from 'react';
import { ClipboardCopy, Check, AlertCircle, Loader2 } from 'lucide-react';
import { adminLoadMissingFoods, type MissingFoodCount } from '@/lib/supabase';
import { copyText } from '@/lib/clipboard';

type Toast = { kind: 'ok' | 'error'; text: string } | null;

function formatMissingFoods(rows: MissingFoodCount[]): string {
  const lines = rows.map((r) => `- ${r.displayName} (segnalato ${r.totalReports} volte da ${r.accounts} account)`);
  return [
    `Alimenti non trovati nel database NutriPlan (${rows.length}).`,
    'Aggiungili al database alimentare con valori nutrizionali affidabili.',
    '',
    ...lines,
  ].join('\n');
}

export function MissingFoodsCopySection() {
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<Toast>(null);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(t);
  }, [toast]);

  async function copyMissingFoods() {
    setBusy(true);
    const rows = await adminLoadMissingFoods();
    if (rows === null) {
      setBusy(false);
      setToast({ kind: 'error', text: 'Impossibile leggere gli alimenti non trovati. Riprova.' });
      return;
    }
    if (rows.length === 0) {
      setBusy(false);
      setToast({ kind: 'error', text: 'Nessun alimento non trovato da copiare.' });
      return;
    }
    const ok = await copyText(formatMissingFoods(rows));
    setBusy(false);
    setToast(ok
      ? { kind: 'ok', text: `${rows.length} alimenti copiati negli appunti` }
      : { kind: 'error', text: 'Copia non riuscita: riprova.' });
  }

  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 mb-1">
        <ClipboardCopy className="w-5 h-5 text-primary-600 dark:text-primary-400" />
        <h3 className="section-title">Alimenti non trovati</h3>
      </div>
      <p className="text-xs text-gray-500 mb-3 leading-relaxed">
        Copia l'elenco degli alimenti che gli utenti di tutti gli account non hanno trovato nel database, con quante volte sono stati segnalati.
      </p>
      <button onClick={copyMissingFoods} disabled={busy} className="btn-primary w-full text-sm">
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ClipboardCopy className="w-4 h-4" />} Copia Alimenti Non Trovati
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
