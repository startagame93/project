import type { Meal, MealType, WeekPlan, WorkoutPlan, PlanExercise } from '@/types';
import { MEAL_TYPES } from '@/types';
import { createEmptyMeal, createEmptyWeek, uid } from '@/lib/data';
import { matchFood, calculateNutrients, type FoodEntry } from '@/lib/foodDatabase';

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
  | { kind: 'diet'; title: string; weeks: WeekPlan[]; totalMeals: number; matchedFoods: number; totalFoods: number }
  | { kind: 'workout'; plan: WorkoutPlan; totalExercises: number };

export class AiImportError extends Error {
  constructor(message: string, readonly reason: 'key' | 'other' = 'other') {
    super(message);
  }
}

const PROMPT = `Sei un assistente che legge piani alimentari e schede di allenamento in PDF (in italiano).
Leggi TUTTO il documento, dalla prima all'ultima pagina. Determina se e una DIETA o una SCHEDA DI ALLENAMENTO e rispondi SOLO con JSON valido in uno di questi formati.

Dieta:
{"kind":"diet","title":"nome dieta","durationWeeks":4,"weeks":[{"days":[{"day":0,"meals":[{"type":"Colazione","name":"titolo breve","foods":[{"name":"fiocchi di avena","grams":80,"kcal":300,"protein":11,"carbs":50,"fat":6},{"name":"latte parzialmente scremato","grams":200,"kcal":92,"protein":7,"carbs":10,"fat":3}]}]}]}]}

Scheda:
{"kind":"workout","title":"nome scheda","days":[{"day":0,"title":"Petto e tricipiti","exercises":[{"name":"Panca piana","sets":4,"reps":"8-10","weight":60,"notes":"recupero 90s"}]}]}

Regole dieta:
- "durationWeeks": per quante settimane va seguito il piano in totale (es. "per 4 settimane", "ciclo di 2 settimane", "mese" = 4). Se non indicato, usa il numero di settimane distinte presenti.
- "weeks": una voce per ogni settimana DIVERSA presente nel documento (massimo 8), nell'ordine del documento. Se tutte le settimane sono uguali, scrivine una sola e indica la durata in "durationWeeks".
- "day": 0=Lunedi, 1=Martedi, 2=Mercoledi, 3=Giovedi, 4=Venerdi, 5=Sabato, 6=Domenica. Se la dieta non indica i giorni, ripeti gli stessi pasti su tutti e 7 i giorni. Se indica "Giorno 1, 2, 3...", Giorno 1 = Lunedi.
- "type" deve essere uno tra: Colazione, Spuntino, Pranzo, Merenda, Cena. Spuntino = meta mattina, Merenda = pomeriggio, spuntino serale/dopocena = Merenda.
- Ogni alimento e un oggetto separato: "name" e il nome generico e semplice dell'alimento in italiano, al singolare, senza marche, quantita o modi di cottura superflui (es. "petto di pollo", "riso basmati", "olio extravergine di oliva", "mela").
- "grams": grammi (o ml) della porzione; converti cucchiai/cucchiaini/fette/pezzi in grammi realistici (cucchiaio olio = 10, cucchiaino = 5, fetta pane = 30, uovo = 60).
- Se un piatto composto ha ingredienti indicati, elenca ogni ingrediente come alimento separato; altrimenti usa il piatto come singolo alimento.
- "kcal", "protein", "carbs", "fat": valori della porzione indicata (non per 100g), stimati in modo realistico.
- Se ci sono alternative ("oppure"), usa solo la prima.

Regole scheda:
- "day" come sopra. Se la scheda usa "Giorno A/B/C" o "Giorno 1/2/3", distribuiscili su Lunedi, Mercoledi, Venerdi (poi Martedi, Giovedi, Sabato).

Non inventare pasti o esercizi assenti dal documento.`;

function toBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  return btoa(binary);
}

const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.round(v) : 0);
const str = (v: unknown, max = 120) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const DAY_NAMES = ['lun', 'mar', 'mer', 'gio', 'ven', 'sab', 'dom'];
function dayIdx(v: unknown, position: number): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) {
    if (v >= 0 && v <= 6) return Math.floor(v);
    if (v === 7) return 6;
    return null;
  }
  if (typeof v === 'string') {
    const t = v.trim().toLowerCase();
    if (/^\d+$/.test(t)) return dayIdx(Number(t), position);
    const named = DAY_NAMES.findIndex((d) => t.startsWith(d));
    if (named >= 0) return named;
  }
  return position >= 0 && position <= 6 ? position : null;
}

function mealType(v: unknown): MealType | undefined {
  const t = str(v).toLowerCase();
  if (!t) return undefined;
  const exact = MEAL_TYPES.find((m) => m.toLowerCase() === t);
  if (exact) return exact;
  if (t.includes('colaz') || t.includes('breakfast')) return 'Colazione';
  if (t.includes('pranzo') || t.includes('lunch')) return 'Pranzo';
  if (t.includes('cena') || t.includes('dinner')) return 'Cena';
  if (t.includes('merenda') || t.includes('pomerid')) return 'Merenda';
  if (t.includes('spuntino') || t.includes('snack') || t.includes('meta mattina')) return 'Spuntino';
  return undefined;
}

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
const asArray = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const asObj = (v: unknown): Record<string, unknown> => (v && typeof v === 'object' ? (v as Record<string, unknown>) : {});

const MAX_WEEKS = 8;
const round1 = (v: number) => Math.round(v * 10) / 10;

interface FoodLine {
  label: string;
  matched: boolean;
  values: Pick<Meal, NutrientKey>;
}

type NutrientKey = 'calories' | 'protein' | 'carbs' | 'fat' | 'saturatedFat' | 'sugar' | 'fiber' | 'sodium' | 'potassium' | 'calcium' | 'iron';
const NUTRIENT_KEYS: NutrientKey[] = ['calories', 'protein', 'carbs', 'fat', 'saturatedFat', 'sugar', 'fiber', 'sodium', 'potassium', 'calcium', 'iron'];

function readFood(raw: unknown, customFoods: FoodEntry[]): FoodLine | null {
  if (typeof raw === 'string') {
    const text = str(raw);
    if (!text) return null;
    const grams = Number(/(\d+(?:[.,]\d+)?)\s*(?:g|gr|ml)\b/i.exec(text)?.[1]?.replace(',', '.') ?? 0);
    return readFood({ name: text.replace(/\d+(?:[.,]\d+)?\s*(?:g|gr|ml)\b/i, '').trim(), grams }, customFoods);
  }
  const fo = asObj(raw);
  const name = str(fo.name, 80);
  if (!name) return null;
  const grams = num(fo.grams);
  const match = matchFood(name, customFoods);
  if (match && grams > 0) {
    const calc = calculateNutrients(match, grams);
    const values = Object.fromEntries(NUTRIENT_KEYS.map((k) => [k, calc[k]])) as FoodLine['values'];
    return { label: `${match.name} (${grams}g)`, matched: true, values };
  }
  const values = Object.fromEntries(NUTRIENT_KEYS.map((k) => [k, 0])) as FoodLine['values'];
  values.calories = num(fo.kcal ?? fo.calories);
  values.protein = num(fo.protein);
  values.carbs = num(fo.carbs);
  values.fat = num(fo.fat);
  return { label: grams > 0 ? `${name} (${grams}g)` : name, matched: false, values };
}

function cloneWeek(source: WeekPlan, label: string): WeekPlan {
  const week = createEmptyWeek(label);
  week.days = week.days.map((d, i) => ({ ...d, meals: source.days[i].meals.map((m) => ({ ...m, id: uid(), foods: [...m.foods] })) }));
  return week;
}

function buildDiet(data: Record<string, unknown>, fallbackTitle: string, customFoods: FoodEntry[]): AiImportResult {
  const title = str(data.title, 60) || fallbackTitle;
  let totalMeals = 0;
  let totalFoods = 0;
  let matchedFoods = 0;

  const distinct = asArray(data.weeks).slice(0, MAX_WEEKS).map((w, wi) => {
    const week = createEmptyWeek(`${title} - Settimana ${wi + 1}`);
    const filled = new Set<string>();
    asArray(asObj(w).days).forEach((d, position) => {
      const idx = dayIdx(asObj(d).day, position);
      if (idx === null) return;
      for (const m of asArray(asObj(d).meals)) {
        const mo = asObj(m);
        const type = mealType(mo.type) ?? mealType(mo.name);
        if (!type) continue;
        const lines = asArray(mo.foods).map((f) => readFood(f, customFoods)).filter((l): l is FoodLine => !!l).slice(0, 30);
        if (lines.length === 0) continue;
        totalFoods += lines.length;
        matchedFoods += lines.filter((l) => l.matched).length;

        const meal: Meal = { ...createEmptyMeal(type), name: str(mo.name, 80) || type, foods: lines.map((l) => l.label) };
        for (const k of NUTRIENT_KEYS) {
          const sum = lines.reduce((acc, l) => acc + l.values[k], 0);
          meal[k] = k === 'calories' || k === 'sodium' || k === 'potassium' || k === 'calcium' ? Math.round(sum) : round1(sum);
        }

        const slot = `${idx}-${type}`;
        const day = week.days[idx];
        day.meals = filled.has(slot)
          ? [...day.meals, meal]
          : day.meals.map((existing) => (existing.type === type ? meal : existing));
        if (!day.meals.includes(meal)) day.meals.push(meal);
        filled.add(slot);
        totalMeals++;
      }
    });
    return week;
  }).filter((w) => w.days.some((d) => d.meals.some((m) => m.foods.length > 0)));

  if (totalMeals === 0 || distinct.length === 0) throw new AiImportError('Nel PDF non sono stati trovati pasti riconoscibili.');

  const duration = Math.min(MAX_WEEKS, Math.max(distinct.length, num(data.durationWeeks)));
  const weeks = Array.from({ length: duration }, (_, i) =>
    i < distinct.length ? distinct[i] : cloneWeek(distinct[i % distinct.length], `${title} - Settimana ${i + 1}`));
  const mealsPerCycle = totalMeals;
  totalMeals = weeks.reduce((s, w, i) => s + (i < distinct.length ? 0 : w.days.reduce((a, d) => a + d.meals.filter((m) => m.foods.length > 0).length, 0)), mealsPerCycle);

  return { kind: 'diet', title, weeks, totalMeals, matchedFoods, totalFoods };
}

function buildWorkout(data: Record<string, unknown>, fallbackTitle: string): AiImportResult {
  let totalExercises = 0;
  const days = asArray(data.days).flatMap((d, position) => {
    const dobj = asObj(d);
    const idx = dayIdx(dobj.day, [0, 2, 4, 1, 3, 5, 6][position] ?? -1);
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

export async function analyzePlanPdf(file: File, apiKey: string, customFoods: FoodEntry[] = []): Promise<AiImportResult> {
  if (file.size > MAX_PDF_BYTES) throw new AiImportError('Il PDF e troppo grande (massimo 15 MB).');
  const data = toBase64(await file.arrayBuffer());

  let res: Response;
  try {
    res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ inline_data: { mime_type: 'application/pdf', data } }, { text: PROMPT }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.1,
          maxOutputTokens: 65536,
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
    });
  } catch {
    throw new AiImportError('Impossibile contattare il servizio IA. Controlla la connessione.');
  }

  const body = asObj(await res.json().catch(() => null));
  if (!res.ok) {
    const reason = JSON.stringify(body.error ?? '');
    if (res.status === 401 || res.status === 403 || reason.includes('API_KEY_INVALID') || reason.includes('API key not valid')) {
      throw new AiImportError('La chiave Gemini non e valida. Controllala in Impostazioni.', 'key');
    }
    if (res.status === 429) throw new AiImportError('Limite gratuito di Gemini raggiunto. Riprova tra qualche minuto.');
    throw new AiImportError('Il servizio IA non ha potuto leggere questo PDF.');
  }

  const candidate = asObj(asArray(body.candidates)[0]);
  const text = asArray(asObj(candidate.content).parts)
    .map((p) => str(asObj(p).text, 500000))
    .join('');
  const parsed = extractJson(text);
  if (!parsed) {
    throw new AiImportError(candidate.finishReason === 'MAX_TOKENS'
      ? 'Il documento e troppo lungo per una sola lettura. Prova a dividere il PDF.'
      : 'L\'IA non e riuscita a interpretare il documento.');
  }

  const fallbackTitle = file.name.replace(/\.pdf$/i, '');
  const isWorkout = parsed.kind === 'workout' || (!parsed.weeks && Array.isArray(parsed.days));
  return isWorkout ? buildWorkout(parsed, fallbackTitle) : buildDiet(parsed, fallbackTitle, customFoods);
}
