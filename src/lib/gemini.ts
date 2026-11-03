import type { WorkoutPlan, PlanExercise } from '@/types';
import type { FoodEntry } from '@/lib/foodDatabase';
import { buildDietWeeks, readDay, EVERY_DAY, type DietBuildResult } from '@/lib/dietBuilder';
import { supabase } from '@/lib/supabase';
import { FunctionsFetchError, FunctionsHttpError, FunctionsRelayError } from '@supabase/supabase-js';

export const MAX_PLAN_CHARS = 60000;

export type AiImportResult =
  | ({ kind: 'diet' } & DietBuildResult)
  | { kind: 'workout'; plan: WorkoutPlan; totalExercises: number };

export class AiImportError extends Error {}

const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.round(v) : 0);
const str = (v: unknown, max = 120) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const asArray = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const asObj = (v: unknown): Record<string, unknown> => (v && typeof v === 'object' ? (v as Record<string, unknown>) : {});

function extractJson(text: string): Record<string, unknown> | null {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  try {
    return asObj(JSON.parse(text.slice(start, end + 1)));
  } catch {
    return null;
  }
}

function buildWorkout(data: Record<string, unknown>, fallbackTitle: string): AiImportResult {
  let totalExercises = 0;
  const days = asArray(data.days).flatMap((d, position) => {
    const dobj = asObj(d);
    const idx = readDay(dobj.day, [0, 2, 4, 1, 3, 5, 6][position] ?? -1);
    if (idx === null || idx === EVERY_DAY) return [];
    const exercises: PlanExercise[] = asArray(dobj.exercises).flatMap((e) => {
      const eo = asObj(e);
      const name = str(eo.name, 80);
      if (!name) return [];
      return [{
        name,
        sets: Math.min(num(eo.sets) || 3, 20),
        reps: str(typeof eo.reps === 'number' ? String(eo.reps) : eo.reps, 20) || '10',
        weight: num(eo.weight) || undefined,
        notes: str(eo.notes, 120) || undefined,
      }];
    }).slice(0, 30);
    if (exercises.length === 0) return [];
    totalExercises += exercises.length;
    return [{ day: idx, title: str(dobj.title, 60) || 'Allenamento', exercises }];
  });
  if (totalExercises === 0) throw new AiImportError('Nel testo non sono stati trovati esercizi riconoscibili.');
  days.sort((a, b) => a.day - b.day);
  return { kind: 'workout', plan: { title: str(data.title, 60) || fallbackTitle, days }, totalExercises };
}

async function requestAnalysis(planText: string): Promise<{ text: string; finishReason: string | null }> {
  const { data, error } = await supabase.functions.invoke('analyze-plan', { body: { planText } });

  if (error) {
    if (error instanceof FunctionsHttpError) {
      const status = error.context.status;
      if (status === 401) throw new AiImportError('Accedi di nuovo per usare la lettura con IA.');
      if (status === 429) throw new AiImportError('Troppe richieste IA. Riprova più tardi.');
      if (status === 503) throw new AiImportError('Il servizio IA non è disponibile al momento.');
      throw new AiImportError('Il servizio IA non ha potuto analizzare questo testo.');
    }
    if (error instanceof FunctionsFetchError || error instanceof FunctionsRelayError) {
      throw new AiImportError('Impossibile contattare il servizio IA. Controlla la connessione.');
    }
    throw new AiImportError('Il servizio IA non ha potuto analizzare questo testo.');
  }

  const body = asObj(data);
  if (typeof body.text !== 'string') throw new AiImportError('Il servizio IA ha restituito una risposta non valida.');
  return { text: body.text, finishReason: typeof body.finishReason === 'string' ? body.finishReason : null };
}

export async function analyzePlanText(planText: string, customFoods: FoodEntry[] = []): Promise<AiImportResult> {
  const { text, finishReason } = await requestAnalysis(planText.slice(0, MAX_PLAN_CHARS));

  const parsed = extractJson(text);
  if (!parsed) {
    throw new AiImportError(finishReason === 'MAX_TOKENS'
      ? 'Il testo e troppo lungo per una sola analisi. Prova a incollarlo in due parti.'
      : 'L\'IA non e riuscita a interpretare il testo.');
  }

  const fallbackTitle = 'Piano importato';
  const isWorkout = parsed.kind === 'workout' || (!parsed.weeks && Array.isArray(parsed.days));
  if (isWorkout) return buildWorkout(parsed, fallbackTitle);
  const diet = buildDietWeeks(parsed, fallbackTitle, customFoods);
  if (!diet) throw new AiImportError('Nel testo non sono stati trovati pasti riconoscibili.');
  return { kind: 'diet', ...diet };
}
