import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { extractPdfText, parsePdfToWeeks } from '@/lib/pdfParser';
import { analyzePlanPdf, getGeminiKey, AiImportError } from '@/lib/gemini';
import type { WeekPlan } from '@/types';

export type PdfImportOutcome = { kind: 'diet'; firstWeekIndex: number } | { kind: 'workout' } | null;

export function usePdfImport() {
  const { state, setState } = useApp();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addWeeks(weeks: WeekPlan[], message: string): PdfImportOutcome {
    const firstWeekIndex = state.weeks.length;
    setState((prev) => ({ ...prev, weeks: [...prev.weeks, ...weeks], activeWeekId: weeks[0].id, pdfText: message }));
    return { kind: 'diet', firstWeekIndex };
  }

  async function importPdf(file: File): Promise<PdfImportOutcome> {
    setLoading(true);
    setError(null);
    try {
      const key = getGeminiKey();
      if (key) {
        const result = await analyzePlanPdf(file, key);
        if (result.kind === 'workout') {
          setState((prev) => ({
            ...prev,
            workoutPlan: result.plan,
            pdfText: `Scheda "${result.plan.title}" importata: ${result.totalExercises} esercizi in ${result.plan.days.length} giorni (vedi Palestra)`,
          }));
          return { kind: 'workout' };
        }
        return addWeeks(result.weeks, `Dieta "${result.title}" importata con IA: ${result.totalMeals} pasti in ${result.weeks.length} settimana/e`);
      }

      const text = await extractPdfText(file);
      if (!text.trim()) {
        setError('Il PDF sembra una scansione. Aggiungi una chiave Gemini in Impostazioni per leggerlo con l\'IA.');
        return null;
      }
      const result = parsePdfToWeeks(text, file.name);
      if (result.totalMeals === 0) {
        setError('Non sono riuscito a riconoscere i pasti. Aggiungi una chiave Gemini in Impostazioni per una lettura intelligente.');
        return null;
      }
      return addWeeks(result.weeks, `Dieta "${result.dietName}" importata: ${result.totalMeals} pasti in ${result.weeks.length} settimana/e`);
    } catch (err) {
      setError(err instanceof AiImportError ? err.message : 'Errore durante la lettura del PDF. Riprova con un altro file.');
      return null;
    } finally {
      setLoading(false);
    }
  }

  return { importPdf, loading, error, setError, hasAiKey: !!getGeminiKey() };
}
