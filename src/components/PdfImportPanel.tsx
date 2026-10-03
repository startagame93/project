import { Upload, Loader2, FileText, X, Sparkles } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { usePdfImport, type PdfImportOutcome } from '@/hooks/usePdfImport';

export function PdfImportPanel({ onImported }: { onImported?: (outcome: PdfImportOutcome) => void }) {
  const { state, setState } = useApp();
  const { importPdf, loading, error, hasAiKey } = usePdfImport();

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const outcome = await importPdf(file);
    if (outcome) onImported?.(outcome);
  }

  return (
    <div className="space-y-4">
      <div className={`flex items-start gap-3 p-3 rounded-xl ${hasAiKey ? 'bg-primary-50 dark:bg-primary-900/20' : 'bg-gray-50 dark:bg-gray-800'}`}>
        <Sparkles className={`w-5 h-5 shrink-0 mt-0.5 ${hasAiKey ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'}`} />
        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
          {hasAiKey
            ? 'Lettura intelligente attiva: carica una dieta o una scheda di allenamento, anche scansionata. L\'IA posiziona tutto nei giorni e nelle sezioni giuste.'
            : 'Lettura base: funziona con diete in PDF testuale. Per leggere anche schede di allenamento e PDF scansionati, aggiungi la chiave Gemini gratuita in Impostazioni.'}
        </p>
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-4 text-primary-600 dark:text-primary-400" role="status">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="ml-2 text-sm font-medium">{hasAiKey ? 'L\'IA sta analizzando il PDF...' : 'Lettura del PDF in corso...'}</span>
        </div>
      ) : (
        <label className="btn-primary w-full cursor-pointer">
          <Upload className="w-4 h-4" /> Carica PDF
          <input type="file" accept="application/pdf,.pdf" className="hidden" onChange={onFile} />
        </label>
      )}
      {error && (
        <div className="p-3 rounded-xl bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800" role="alert">
          <span className="text-sm text-error-700 dark:text-error-300">{error}</span>
        </div>
      )}
      {state.pdfText && !loading && (
        <div className="p-3 rounded-xl bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800 flex items-center gap-2">
          <FileText className="w-5 h-5 text-success-600 shrink-0" />
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
