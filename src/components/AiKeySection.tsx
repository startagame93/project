import { useState } from 'react';
import { Sparkles, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle, Trash2 } from 'lucide-react';
import { getGeminiKey, setGeminiKey, testGeminiKey } from '@/lib/gemini';
import { GEMINI_KEY_GUIDE } from '@/lib/manual';
import { GuideToggle } from '@/components/GuideContent';

type Status = { kind: 'ok' | 'error'; text: string } | null;

export function AiKeySection() {
  const [saved, setSaved] = useState(getGeminiKey());
  const [draft, setDraft] = useState('');
  const [visible, setVisible] = useState(false);
  const [checking, setChecking] = useState(false);
  const [status, setStatus] = useState<Status>(null);

  async function save() {
    const key = draft.trim();
    if (!key) return;
    setChecking(true);
    setStatus(null);
    const valid = await testGeminiKey(key);
    setChecking(false);
    if (!valid) {
      setStatus({ kind: 'error', text: 'Chiave non valida o connessione assente. Controlla di averla copiata per intero.' });
      return;
    }
    setGeminiKey(key);
    setSaved(key);
    setDraft('');
    setStatus({ kind: 'ok', text: 'Chiave verificata e salvata su questo dispositivo.' });
  }

  function remove() {
    setGeminiKey('');
    setSaved('');
    setStatus(null);
  }

  const masked = saved ? `${saved.slice(0, 4)}${'•'.repeat(12)}${saved.slice(-4)}` : '';

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="w-5 h-5 text-primary-600 dark:text-primary-400" />
        <h3 className="section-title">Lettura testi con IA</h3>
      </div>
      <p className="text-xs text-gray-500 mb-3 leading-relaxed">
        Con una chiave Google Gemini gratuita l'app legge il testo incollato di diete e schede di allenamento, anche disordinato, e lo inserisce nei giorni e nei pasti giusti. La chiave resta solo su questo dispositivo.
      </p>
      <div className="mb-4">
        <GuideToggle section={GEMINI_KEY_GUIDE} label="Come ottengo la chiave? Tutorial passo passo" />
      </div>

      {saved ? (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800">
          <CheckCircle2 className="w-5 h-5 text-success-600 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-success-800 dark:text-success-300">IA attiva</p>
            <p className="text-xs text-success-700 dark:text-success-400 font-mono truncate">{masked}</p>
          </div>
          <button onClick={remove} className="p-2 rounded-lg text-gray-400 hover:text-error-600 transition-colors" aria-label="Rimuovi chiave">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <label className="label" htmlFor="gemini-key">Chiave API Gemini</label>
          <div className="relative">
            <input
              id="gemini-key"
              type={visible ? 'text' : 'password'}
              className="input pr-11 font-mono"
              placeholder="AIza..."
              autoComplete="off"
              spellCheck={false}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && save()}
            />
            <button
              type="button"
              onClick={() => setVisible((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              aria-label={visible ? 'Nascondi chiave' : 'Mostra chiave'}
            >
              {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <button onClick={save} disabled={!draft.trim() || checking} className="btn-primary w-full">
            {checking ? <><Loader2 className="w-4 h-4 animate-spin" /> Verifica in corso...</> : 'Verifica e salva'}
          </button>
        </div>
      )}

      {status && (
        <p className={`flex items-start gap-1.5 text-xs mt-3 ${status.kind === 'ok' ? 'text-success-700 dark:text-success-400' : 'text-error-600 dark:text-error-400'}`} role="status">
          {status.kind === 'error' && <AlertCircle className="w-4 h-4 shrink-0" />}
          {status.text}
        </p>
      )}
    </div>
  );
}
