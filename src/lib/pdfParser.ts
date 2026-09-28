import type { Meal, MealType, WeekPlan, DayPlan } from '@/types';
import { DAYS_OF_WEEK, MEAL_TYPES } from '@/types';
import { uid, createEmptyWeek } from '@/lib/data';

// Lazy-load pdfjs to keep the main bundle small
let pdfjsPromise: Promise<typeof import('pdfjs-dist')> | null = null;

async function getPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = import('pdfjs-dist');
  }
  const pdfjs = await pdfjsPromise;
  // Use the bundled worker via Vite's URL handling
  const workerUrl = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url);
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl.href;
  return pdfjs;
}

export async function extractPdfText(file: File): Promise<string> {
  const pdfjs = await getPdfjs();
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items
      .map((item) => ('str' in item ? (item as { str: string }).str : ''))
      .filter(Boolean);
    fullText += strings.join(' ') + '\n';
  }
  return fullText;
}

const DAY_VARIANTS: Record<number, string[]> = {
  0: ['lunedi', 'lunedì', 'lun'],
  1: ['martedi', 'martedì', 'mar'],
  2: ['mercoledi', 'mercoledì', 'mer'],
  3: ['giovedi', 'giovedì', 'gio'],
  4: ['venerdi', 'venerdì', 'ven'],
  5: ['sabato', 'sab'],
  6: ['domenica', 'dom'],
};

const MEAL_VARIANTS: Record<MealType, string[]> = {
  Colazione: ['colazione', 'breakfast', 'col'],
  Spuntino: ['spuntino', 'snack', 'mattutino'],
  Pranzo: ['pranzo', 'lunch', 'colazione2'],
  Merenda: ['merenda', 'tea', 'pomeriggio'],
  Cena: ['cena', 'dinner', 'serale'],
};

function normalize(s: string): string {
  return s.toLowerCase().trim();
}

function matchDay(text: string): number | null {
  const lower = normalize(text);
  for (let i = 0; i < 7; i++) {
    if (DAY_VARIANTS[i].some((v) => lower === v || lower.startsWith(v))) return i;
  }
  return null;
}

function matchMeal(text: string): MealType | null {
  const lower = normalize(text);
  for (const mt of MEAL_TYPES) {
    if (MEAL_VARIANTS[mt].some((v) => lower === v || lower.startsWith(v))) return mt;
  }
  return null;
}

function tryParseNumber(s: string): number {
  const n = parseFloat(s.replace(',', '.'));
  return isNaN(n) ? 0 : n;
}

interface ParsedMeal {
  type: MealType;
  name: string;
  foods: string[];
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

function parseMealsFromBlock(block: string): ParsedMeal[] {
  const meals: ParsedMeal[] = [];
  const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);

  let currentMeal: ParsedMeal | null = null;
  let currentFoods: string[] = [];

  for (const line of lines) {
    const mealType = matchMeal(line);
    if (mealType) {
      if (currentMeal) {
        currentMeal.foods = [...currentFoods];
        meals.push(currentMeal);
      }
      currentFoods = [];
      currentMeal = {
        type: mealType,
        name: '',
        foods: [],
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
      };
      continue;
    }

    if (!currentMeal) {
      const mt = matchMeal(line);
      if (mt) {
        currentMeal = { type: mt, name: '', foods: [], calories: 0, protein: 0, carbs: 0, fat: 0 };
      }
      continue;
    }

    const kcalMatch = line.match(/(\d+)\s*k?cal/i);
    const protMatch = line.match(/(?:prot|proteine|p)\s*:?\s*(\d+)\s*g/i);
    const carbMatch = line.match(/(?:carb|carbo|c)\s*:?\s*(\d+)\s*g/i);
    const fatMatch = line.match(/(?:fat|grassi|g)\s*:?\s*(\d+)\s*g/i);

    if (kcalMatch) currentMeal.calories = tryParseNumber(kcalMatch[1]);
    if (protMatch) currentMeal.protein = tryParseNumber(protMatch[1]);
    if (carbMatch) currentMeal.carbs = tryParseNumber(carbMatch[1]);
    if (fatMatch) currentMeal.fat = tryParseNumber(fatMatch[1]);

    if (!kcalMatch && !protMatch && !carbMatch && !fatMatch) {
      if (!currentMeal.name) {
        currentMeal.name = line;
      } else {
        currentFoods.push(line);
      }
    }
  }

  if (currentMeal) {
    currentMeal.foods = [...currentFoods];
    meals.push(currentMeal);
  }

  return meals;
}

export function parsePdfToWeek(text: string, weekLabel: string): WeekPlan {
  const rawLines = text.split('\n');
  const dayBlocks: { dayIdx: number; lines: string[] }[] = [];
  let currentDay: { dayIdx: number; lines: string[] } | null = null;

  for (const line of rawLines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const dayIdx = matchDay(trimmed);
    if (dayIdx !== null) {
      if (currentDay) dayBlocks.push(currentDay);
      currentDay = { dayIdx, lines: [] };
    } else if (currentDay) {
      currentDay.lines.push(trimmed);
    }
  }
  if (currentDay) dayBlocks.push(currentDay);

  const week = createEmptyWeek(weekLabel);

  if (dayBlocks.length === 0) {
    const allMeals = parseMealsFromBlock(rawLines.join('\n'));
    if (allMeals.length > 0) {
      for (const day of week.days) {
        day.meals = allMeals.map((pm) => toMeal(pm));
      }
    }
    return week;
  }

  for (const block of dayBlocks) {
    const blockText = block.lines.join('\n');
    const parsedMeals = parseMealsFromBlock(blockText);
    if (parsedMeals.length === 0) continue;
    const day = week.days[block.dayIdx];
    if (!day) continue;
    const mealsByType = new Map<MealType, Meal>();
    for (const pm of parsedMeals) {
      mealsByType.set(pm.type, toMeal(pm));
    }
    day.meals = day.meals.map((existing) => mealsByType.get(existing.type) ?? existing);
  }

  return week;
}

function toMeal(pm: ParsedMeal): Meal {
  return {
    id: uid(),
    type: pm.type,
    name: pm.name || pm.type,
    foods: pm.foods,
    calories: pm.calories,
    protein: pm.protein,
    carbs: pm.carbs,
    fat: pm.fat,
    completed: false,
  };
}
