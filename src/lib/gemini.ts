import type { WorkoutPlan, PlanExercise } from '@/types';
import type { FoodEntry } from '@/lib/foodDatabase';
import { buildDietWeeks, readDay, EVERY_DAY, type DietBuildResult } from '@/lib/dietBuilder';

const KEY_STORAGE = 'nutriplan-gemini-key';
const MODEL = 'gemini-2.5-flash';
export const MAX_PLAN_CHARS = 60000;

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
  | ({ kind: 'diet' } & DietBuildResult)
  | { kind: 'workout'; plan: WorkoutPlan; totalExercises: number };

export class AiImportError extends Error {
  constructor(message: string, readonly reason: 'key' | 'other' = 'other') {
    super(message);
  }
}

const PROMPT = `Sei un assistente che legge piani alimentari e schede di allenamento scritti in italiano.
Il testo e stato incollato dall'utente (da PDF, Word, note o scritto a mano): puo essere disordinato, con righe spezzate, senza a capo o tutto attaccato in un unico blocco continuo.
NON affidarti agli a capo o alle righe vuote: individua la struttura SOLO tramite le parole chiave:
- marcatori di settimana ("Settimana 1", "Sett. 2", "Week 3", "Prima/Seconda settimana") aprono una nuova settimana;
- nomi dei giorni (Lunedi...Domenica, anche abbreviati Lun/Mar/..., oppure "Giorno 1") aprono un nuovo giorno nella settimana corrente;
- nomi dei pasti (Colazione, Spuntino, Pranzo, Merenda, Cena, Dopocena) aprono un nuovo pasto nel giorno corrente;
- tutto cio che segue un nome di pasto, fino alla parola chiave successiva, sono gli alimenti di quel pasto.
Leggi TUTTO il testo fino alla fine.
La struttura di output e SEMPRE rigorosamente Settimana -> Giorno -> Pasto -> Alimenti. Determina se e una DIETA o una SCHEDA DI ALLENAMENTO e rispondi SOLO con JSON valido in uno di questi formati.

Dieta:
{"kind":"diet","title":"nome dieta","durationWeeks":4,"weeks":[{"days":[{"day":0,"meals":[{"type":"Colazione","name":"titolo breve","foods":[{"name":"fiocchi di avena","grams":80},{"name":"latte parzialmente scremato","grams":200}]}]}]}]}

Scheda:
{"kind":"workout","title":"nome scheda","days":[{"day":0,"title":"Petto e tricipiti","exercises":[{"name":"Panca piana","sets":4,"reps":"8-10","weight":60,"notes":"recupero 90s"}]}]}

Regole dieta:
- "durationWeeks": per quante settimane va seguito il piano in totale (es. "per 4 settimane", "ciclo di 2 settimane", "mese" = 4). Se non indicato, usa il numero di settimane distinte presenti.
- "weeks": una voce SEPARATA per ogni settimana presente nel testo (massimo 8), nell'ordine del testo. Se il testo contiene "Settimana 2" (o successive), i suoi giorni vanno SOLO nella seconda voce di "weeks": non unire mai settimane diverse nella prima. Se il testo descrive una sola settimana da ripetere, scrivine una sola e indica la durata in "durationWeeks".
- "day": 0=Lunedi, 1=Martedi, 2=Mercoledi, 3=Giovedi, 4=Venerdi, 5=Sabato, 6=Domenica. Se la dieta non indica i giorni usa "day":"all" (stessi pasti ogni giorno). Se indica "Giorno 1, 2, 3...", Giorno 1 = Lunedi.
- "type" deve essere uno tra: Colazione, Spuntino, Pranzo, Merenda, Cena. Spuntino = meta mattina, Merenda = pomeriggio, spuntino serale/dopocena = Merenda.
- Ogni alimento e un oggetto separato: "name" e il nome generico e semplice dell'alimento in italiano, al singolare, senza marche ne quantita (es. "petto di pollo", "riso basmati", "olio extravergine di oliva", "mela").
- "grams": grammi (o ml) della porzione; converti cucchiai/cucchiaini/fette/pezzi in grammi realistici (cucchiaio olio = 10, cucchiaino = 5, fetta pane = 30, uovo = 60). Se non c'e quantita usa 0.
- Se un piatto composto ha ingredienti indicati, elenca ogni ingrediente come alimento separato; altrimenti usa il piatto come singolo alimento.
- Se ci sono alternative ("oppure"), usa solo la prima.
- Riporta OGNI alimento nel pasto corretto anche se non lo riconosci o il nome ti sembra strano: non saltarlo e non spostarlo. Se la quantita manca o non e leggibile usa 0.

Regole scheda:
- "day" come sopra. Se la scheda usa "Giorno A/B/C" o "Giorno 1/2/3", distribuiscili su Lunedi, Mercoledi, Venerdi (poi Martedi, Giovedi, Sabato).

Non inventare pasti, alimenti o esercizi assenti dal testo.

TESTO:
`;

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

export async function analyzePlanText(planText: string, apiKey: string, customFoods: FoodEntry[] = []): Promise<AiImportResult> {
  let res: Response;
  try {
    res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: PROMPT + planText.slice(0, MAX_PLAN_CHARS) }] }],
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
    throw new AiImportError('Il servizio IA non ha potuto analizzare questo testo.');
  }

  const candidate = asObj(asArray(body.candidates)[0]);
  const text = asArray(asObj(candidate.content).parts)
    .map((p) => str(asObj(p).text, 500000))
    .join('');
  const parsed = extractJson(text);
  if (!parsed) {
    throw new AiImportError(candidate.finishReason === 'MAX_TOKENS'
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
