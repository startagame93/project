import { useState } from 'react';
import { Modal } from '@/components/Modal';
import { deleteAccount, signOut } from '@/lib/supabase';
import { Trash2, Loader2 } from 'lucide-react';

const CONFIRM_WORD = 'ELIMINA';

export function DeleteAccountSection() {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function close() {
    if (busy) return;
    setOpen(false);
    setTyped('');
    setError(null);
  }

  async function confirmDelete() {
    setBusy(true);
    setError(null);
    const ok = await deleteAccount();
    if (!ok) {
      setBusy(false);
      setError('Impossibile eliminare l\'account. Controlla la connessione e riprova.');
      return;
    }
    await signOut();
    window.location.reload();
  }

  const canDelete = typed.trim().toUpperCase() === CONFIRM_WORD && !busy;

  return (
    <div className="card p-5">
      <h3 className="section-title mb-1">Elimina account</h3>
      <p className="text-sm text-gray-500 mb-3">
        Cancella definitivamente il tuo account e tutti i dati salvati nel cloud (profilo, dieta, allenamenti, segnalazioni). L'operazione non si può annullare.
      </p>
      <button onClick={() => setOpen(true)} className="btn-secondary w-full flex items-center justify-center gap-2 text-error-600 dark:text-error-400 border-error-200 dark:border-error-800">
        <Trash2 className="w-4 h-4" /> Elimina il mio account
      </button>

      <Modal
        open={open}
        onClose={close}
        title="Eliminare l'account?"
        footer={
          <button onClick={confirmDelete} disabled={!canDelete} className="btn-danger w-full disabled:opacity-50 disabled:cursor-not-allowed">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} Elimina definitivamente
          </button>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Tutti i tuoi dati nel cloud verranno cancellati e non potranno essere recuperati. Per continuare, scrivi <strong>{CONFIRM_WORD}</strong> nel campo qui sotto.
          </p>
          <input
            className="input"
            value={typed}
            placeholder={CONFIRM_WORD}
            aria-label={`Scrivi ${CONFIRM_WORD} per confermare`}
            disabled={busy}
            onChange={(e) => setTyped(e.target.value)}
          />
          {error && (
            <div className="p-2.5 rounded-xl bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800">
              <span className="text-sm text-error-700 dark:text-error-300">{error}</span>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
