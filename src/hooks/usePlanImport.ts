import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { parseDietText } from '@/lib/dietText';
import { buildDietWeeks, type DietBuildResult } from '@/lib/dietBuilder';
import { analyzePlanText, getGeminiKey, AiImportError } from '@/lib/gemini';

export type PlanImportOutcome = { kind: 'diet'; firstWeekIndex: number } | { kind: 'workout' } | null;

export const MIN_PLAN_CHARS = 20;

function dietMessage(diet: DietBuildResult, viaAi: boolean) {
  const unknown = diet.totalFoods - diet.matchedFoods;
  return `Dieta "${diet.title}" importata${viaAi ? ' con IA' : ''}: ${diet.totalMeals} pasti in ${diet.weeks.length} settimana/e. `
    + `${diet.matchedFoods} alimenti su ${diet.totalFoods} trovati nel database`
    + (unknown > 0 ? `, ${unknown} segnati come "sconosciuto" da correggere` : '');
}

export function usePlanImport() {
  const { state, setState } = useApp();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addDiet(diet: DietBuildResult, viaAi: boolean): PlanImportOutcome {
    const firstWeekIndex = state.weeks.length;
    setState((prev) => ({ ...prev, weeks: [...prev.weeks, ...diet.weeks], activeWeekId: diet.weeks[0].id, pdfText: dietMessage(diet, viaAi) }));
    return { kind: 'diet', firstWeekIndex };
  }

  async function importText(text: string): Promise<PlanImportOutcome> {
    const clean = text.trim();
    if (clean.length < MIN_PLAN_CHARS) {
      setError('Incolla il testo completo del piano prima di avviare l\'analisi.');
      return null;
    }
    setLoading(true);
    setError(null);
    try {
      const key = getGeminiKey();
      let aiMessage: string | undefined;
      if (key) {
        try {
          const result = await analyzePlanText(clean, key, state.customFoods);
          if (result.kind === 'workout') {
            setState((prev) => ({
              ...prev,
              workoutPlan: result.plan,
              pdfText: `Scheda "${result.plan.title}" importata: ${result.totalExercises} esercizi in ${result.plan.days.length} giorni (vedi Palestra)`,
            }));
            return { kind: 'workout' };
          }
          return addDiet(result, true);
        } catch (err) {
          if (err instanceof AiImportError && err.reason === 'key') throw err;
          aiMessage = err instanceof AiImportError ? err.message : 'Analisi IA non riuscita.';
        }
      }

      const diet = buildDietWeeks(parseDietText(clean), 'Dieta incollata', state.customFoods);
      if (!diet) {
        setError(aiMessage ?? 'Non ho trovato pasti nel testo. Assicurati che ci siano i nomi dei pasti (Colazione, Pranzo, Cena...) seguiti dagli alimenti.');
        return null;
      }
      return addDiet(diet, false);
    } catch (err) {
      setError(err instanceof AiImportError ? err.message : 'Errore durante l\'analisi del testo. Riprova.');
      return null;
    } finally {
      setLoading(false);
    }
  }

  return { importText, loading, error, setError, hasAiKey: !!getGeminiKey() };
}
