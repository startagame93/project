import { useState } from 'react';
import { Loader2, ClipboardPaste, Wand2, X, Sparkles, CheckCircle2, Eraser } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { usePlanImport, MIN_PLAN_CHARS, type PlanImportOutcome } from '@/hooks/usePlanImport';
import { MAX_PLAN_CHARS } from '@/lib/gemini';
import { PASTE_IMPORT_GUIDE } from '@/lib/manual';
import { GuideToggle } from '@/components/GuideContent';

const PLACEHOLDER = `Esempio:
Settimana 1
Lunedi
Colazione: latte parzialmente scremato 200 ml, fiocchi d'avena 40 g
Pranzo: riso basmati 80 g, petto di pollo 150 g, zucchine 200 g, olio evo 1 cucchiaio
Cena: salmone 150 g, patate 200 g, insalata`;

export function PlanImportPanel({ onImported }: { onImported?: (outcome: PlanImportOutcome) => void }) {
  const { state, setState } = useApp();
  const { importText, loading, error, setError, hasAiKey } = usePlanImport();
  const [text, setText] = useState('');
  const [pasteFailed, setPasteFailed] = useState(false);
  const ready = text.trim().length >= MIN_PLAN_CHARS;

  async function pasteFromClipboard() {
    setPasteFailed(false);
    try {
      const clip = await navigator.clipboard.readText();
      if (clip) setText((prev) => (prev ? `${prev}\n${clip}` : clip).slice(0, MAX_PLAN_CHARS));
      else setPasteFailed(true);
    } catch {
      setPasteFailed(true);
    }
  }

  async function analyze() {
    const outcome = await importText(text);
    if (outcome) {
      setText('');
      onImported?.(outcome);
    }
  }

  return (
    <div className="space-y-4">
      <div className={`flex items-start gap-3 p-3 rounded-xl ${hasAiKey ? 'bg-primary-50 dark:bg-primary-900/20' : 'bg-gray-50 dark:bg-gray-800'}`}>
        <Sparkles className={`w-5 h-5 shrink-0 mt-0.5 ${hasAiKey ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'}`} aria-hidden="true" />
        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
          {hasAiKey
            ? 'Copia il testo della dieta o della scheda da PDF, Word o note e incollalo qui. L\'IA lo legge e lo posiziona nei giorni e nei pasti giusti.'
            : 'Copia il testo della dieta da PDF, Word o note e incollalo qui. Per testi disordinati e schede di allenamento aggiungi la chiave Gemini gratuita in Impostazioni.'}
        </p>
      </div>

      <GuideToggle section={PASTE_IMPORT_GUIDE} label="Come funziona? Guida passo passo" />

      <div className="relative">
        <label htmlFor="plan-text" className="label">Testo del piano</label>
        <textarea
          id="plan-text"
          value={text}
          onChange={(e) => { setText(e.target.value.slice(0, MAX_PLAN_CHARS)); if (error) setError(null); }}
          placeholder={PLACEHOLDER}
          rows={10}
          disabled={loading}
          className="input min-h-[200px] resize-y font-mono text-[13px] leading-relaxed"
        />
        <div className="flex items-center justify-between mt-2 gap-2">
          <span className="text-xs text-gray-500">{text.length.toLocaleString('it-IT')} / {MAX_PLAN_CHARS.toLocaleString('it-IT')} caratteri</span>
          <div className="flex gap-2">
            {text && !loading && (
              <button onClick={() => setText('')} className="chip bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:text-error-600 transition-colors">
                <Eraser className="w-3.5 h-3.5" aria-hidden="true" /> Svuota
              </button>
            )}
            <button
              onClick={pasteFromClipboard}
              disabled={loading}
              className="chip bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-colors"
            >
              <ClipboardPaste className="w-3.5 h-3.5" aria-hidden="true" /> Incolla
            </button>
          </div>
        </div>
        {pasteFailed && (
          <p className="text-xs text-gray-500 mt-1">Non riesco a leggere gli appunti: tieni premuto nel riquadro e scegli "Incolla".</p>
        )}
      </div>

      <button onClick={analyze} disabled={!ready || loading} className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed">
        {loading ? (
          <><Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> {hasAiKey ? 'L\'IA sta analizzando...' : 'Analisi in corso...'}</>
        ) : (
          <><Wand2 className="w-4 h-4" aria-hidden="true" /> Analizza e importa</>
        )}
      </button>

      <p className="text-xs text-gray-500 leading-relaxed">
        Gli alimenti che non trovo nel database vengono segnati come <span className="font-medium text-warning-600 dark:text-warning-400">sconosciuto</span>: potrai correggerli o eliminarli toccando la matita sul pasto.
      </p>

      {error && (
        <div className="p-3 rounded-xl bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800" role="alert">
          <span className="text-sm text-error-700 dark:text-error-300">{error}</span>
        </div>
      )}
      {state.pdfText && !loading && (
        <div className="p-3 rounded-xl bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800 flex items-start gap-2" role="status">
          <CheckCircle2 className="w-5 h-5 text-success-600 shrink-0" aria-hidden="true" />
          <span className="text-sm text-success-700 dark:text-success-300">{state.pdfText}</span>
          <button
            onClick={() => setState((prev) => ({ ...prev, pdfText: null }))}
            className="ml-auto p-1 text-gray-400 hover:text-error-600"
            aria-label="Nascondi messaggio"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
