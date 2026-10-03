import { useEffect, useState } from 'react';
import { ClipboardCopy, Check, AlertCircle, Trash2, SearchX } from 'lucide-react';
import { readMissingFoods, formatMissingFoods, clearMissingFoods } from '@/lib/missingFoods';

type Toast = { kind: 'ok' | 'error'; text: string } | null;

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Older WebViews without the async clipboard: fall back to a hidden textarea
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand('copy');
    area.remove();
    return ok;
  }
}

export function MissingFoodsSection() {
  const [foods, setFoods] = useState(readMissingFoods);
  const [toast, setToast] = useState<Toast>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(t);
  }, [toast]);

  async function exportList() {
    const current = readMissingFoods();
    setFoods(current);
    if (current.length === 0) {
      setToast({ kind: 'error', text: 'Nessun alimento sconosciuto da esportare.' });
      return;
    }
    const ok = await copyText(formatMissingFoods(current));
    setToast(ok
      ? { kind: 'ok', text: `${current.length} alimenti copiati negli appunti` }
      : { kind: 'error', text: 'Copia non riuscita: riprova.' });
  }

  function clearList() {
    clearMissingFoods();
    setFoods([]);
    setConfirmClear(false);
    setToast({ kind: 'ok', text: 'Elenco svuotato' });
  }

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-1">
        <SearchX className="w-5 h-5 text-primary-600 dark:text-primary-400" />
        <h3 className="section-title">Alimenti sconosciuti</h3>
      </div>
      <p className="text-xs text-gray-500 mb-4 leading-relaxed">
        Gli alimenti non trovati nel database durante le importazioni vengono annotati qui.
        {foods.length > 0 ? ` Al momento ne sono registrati ${foods.length}.` : ' Per ora non ne è stato registrato nessuno.'}
      </p>
      <div className="flex gap-2">
        <button onClick={exportList} disabled={foods.length === 0} className="btn-secondary flex-1 text-sm">
          <ClipboardCopy className="w-4 h-4" /> Esporta ingredienti sconosciuti
        </button>
        {foods.length > 0 && (
          confirmClear ? (
            <button onClick={clearList} className="btn-secondary !px-3 text-sm !text-error-600 !border-error-300">
              Conferma
            </button>
          ) : (
            <button onClick={() => setConfirmClear(true)} className="btn-secondary !px-3 hover:!text-error-600 transition-colors" aria-label="Svuota elenco alimenti sconosciuti">
              <Trash2 className="w-4 h-4" />
            </button>
          )
        )}
      </div>

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
