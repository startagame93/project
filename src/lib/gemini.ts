import type { Meal, MealType, WeekPlan, WorkoutPlan, PlanExercise } from '@/types';
import { MEAL_TYPES } from '@/types';
import { createEmptyMeal, createEmptyWeek } from '@/lib/data';

const KEY_STORAGE = 'nutriplan-gemini-key';
const MODEL = 'gemini-2.5-flash';
const MAX_PDF_BYTES = 15 * 1024 * 1024;

export function getGeminiKey(): string {
  try {
    return localStorage.getItem(KEY_STORAGE) ?? '';
  } catch {
    return '';
  }
}

export function setGeminiKey(key: string) {
  const clean = key.trim();
  if (clean) localStorage.setItem(KEY_STORAGE, clean);
  else localStorage.removeItem(KEY_STORAGE);
}

export async function testGeminiKey(apiKey: string): Promise<boolean> {
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}`, {
      headers: { 'x-goog-api-key': apiKey.trim() },
    });
    return res.ok;
  } catch {
    return false;
  }
}

export type AiImportResult =
  | { kind: 'diet'; title: string; weeks: WeekPlan[]; totalMeals: number }
  | { kind: 'workout'; plan: WorkoutPlan; totalExercises: number };

export class AiImportError extends Error {}

const PROMPT = `Sei un assistente che legge piani alimentari e schede di allenamento in PDF (in italiano).
Determina se il documento e una DIETA o una SCHEDA DI ALLENAMENTO e rispondi SOLO con JSON valido in uno di questi formati.

Dieta:
{"kind":"diet","title":"nome dieta","weeks":[{"days":[{"day":0,"meals":[{"type":"Colazione","name":"titolo breve","foods":["80g avena","200ml latte"],"calories":350,"protein":15,"carbs":50,"fat":8}]}]}]}

Scheda:
{"kind":"workout","title":"nome scheda","days":[{"day":0,"title":"Petto e tricipiti","exercises":[{"name":"Panca piana","sets":4,"reps":"8-10","weight":60,"notes":"recupero 90s"}]}]}

Regole:
- "day": 0=Lunedi, 1=Martedi, 2=Mercoledi, 3=Giovedi, 4=Venerdi, 5=Sabato, 6=Domenica. Se la scheda usa "Giorno A/B/C" o "Giorno 1/2/3", distribuiscili su Lunedi, Mercoledi, Venerdi (poi Martedi, Giovedi, Sabato).
- Se la dieta non indica i giorni, ripeti gli stessi pasti su tutti e 7 i giorni.
- "type" del pasto deve essere uno tra: Colazione, Spuntino, Pranzo, Merenda, Cena. Spuntino = meta mattina, Merenda = pomeriggio.
- Se ci sono piu settimane, crea una voce in "weeks" per ognuna (massimo 4).
- Se calorie o macro non sono indicati, stimali in modo realistico dagli alimenti e dalle grammature.
- Non inventare pasti o esercizi assenti dal documento.`;

function toBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  return btoa(binary);
}

const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.round(v) : 0);
const str = (v: unknown, max = 120) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const dayIdx = (v: unknown) => (typeof v === 'number' && v >= 0 && v <= 6 ? Math.floor(v) : null);
const asArray = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const asObj = (v: unknown): Record<string, unknown> => (v && typeof v === 'object' ? (v as Record<string, unknown>) : {});

function buildDiet(data: Record<string, unknown>, fallbackTitle: string): AiImportResult {
  const title = str(data.title, 60) || fallbackTitle;
  let totalMeals = 0;
  const weeks = asArray(data.weeks).slice(0, 4).map((w, wi) => {
    const week = createEmptyWeek(`${title} - Settimana ${wi + 1}`);
    for (const d of asArray(asObj(w).days)) {
      const idx = dayIdx(asObj(d).day);
      if (idx === null) continue;
      for (const m of asArray(asObj(d).meals)) {
        const mo = asObj(m);
        const type = MEAL_TYPES.find((t) => t.toLowerCase() === str(mo.type).toLowerCase()) as MealType | undefined;
        if (!type) continue;
        const foods = asArray(mo.foods).map((f) => str(f)).filter(Boolean).slice(0, 30);
        if (foods.length === 0 && !mo.name) continue;
        const meal: Meal = {
          ...createEmptyMeal(type),
          name: str(mo.name, 80) || type,
          foods,
          calories: num(mo.calories),
          protein: num(mo.protein),
          carbs: num(mo.carbs),
          fat: num(mo.fat),
        };
        week.days[idx].meals = week.days[idx].meals.map((existing) => (existing.type === type ? meal : existing));
        totalMeals++;
      }
    }
    return week;
  });
  if (totalMeals === 0) throw new AiImportError('Nel PDF non sono stati trovati pasti riconoscibili.');
  return { kind: 'diet', title, weeks, totalMeals };
}

function buildWorkout(data: Record<string, unknown>, fallbackTitle: string): AiImportResult {
  let totalExercises = 0;
  const days = asArray(data.days).flatMap((d) => {
    const dobj = asObj(d);
    const idx = dayIdx(dobj.day);
    if (idx === null) return [];
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
  if (totalExercises === 0) throw new AiImportError('Nel PDF non sono stati trovati esercizi riconoscibili.');
  days.sort((a, b) => a.day - b.day);
  return { kind: 'workout', plan: { title: str(data.title, 60) || fallbackTitle, days }, totalExercises };
}

export async function analyzePlanPdf(file: File, apiKey: string): Promise<AiImportResult> {
  if (file.size > MAX_PDF_BYTES) throw new AiImportError('Il PDF e troppo grande (massimo 15 MB).');
  const data = toBase64(await file.arrayBuffer());

  let res: Response;
  try {
    res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ inline_data: { mime_type: 'application/pdf', data } }, { text: PROMPT }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.1 },
      }),
    });
  } catch {
    throw new AiImportError('Impossibile contattare il servizio IA. Controlla la connessione.');
  }

  if (res.status === 400 || res.status === 401 || res.status === 403) {
    throw new AiImportError('La chiave Gemini non e valida. Controllala in Impostazioni.');
  }
  if (res.status === 429) throw new AiImportError('Limite gratuito di Gemini raggiunto. Riprova tra qualche minuto.');
  if (!res.ok) throw new AiImportError('Il servizio IA non ha risposto correttamente. Riprova piu tardi.');

  const body = asObj(await res.json().catch(() => null));
  const text = asArray(asObj(asObj(asArray(body.candidates)[0]).content).parts)
    .map((p) => str(asObj(p).text, 200000))
    .join('');
  let parsed: Record<string, unknown>;
  try {
    parsed = asObj(JSON.parse(text.replace(/^```(?:json)?|```$/g, '').trim()));
  } catch {
    throw new AiImportError('L\'IA non e riuscita a interpretare il documento.');
  }

  const fallbackTitle = file.name.replace(/\.pdf$/i, '');
  return parsed.kind === 'workout' ? buildWorkout(parsed, fallbackTitle) : buildDiet(parsed, fallbackTitle);
}
