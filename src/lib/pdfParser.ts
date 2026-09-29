import type { Meal, MealType, WeekPlan } from '@/types';
import { MEAL_TYPES } from '@/types';
import { uid, createEmptyWeek } from '@/lib/data';

let pdfjsPromise: Promise<typeof import('pdfjs-dist')> | null = null;

async function getPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = import('pdfjs-dist');
  }
  const pdfjs = await pdfjsPromise;
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
  Colazione: ['colazione', 'breakfast'],
  Spuntino: ['spuntino', 'snack', 'mattutino'],
  Pranzo: ['pranzo', 'lunch'],
  Merenda: ['merenda', 'tea', 'pomeriggio'],
  Cena: ['cena', 'dinner', 'serale'],
};

const WEEK_VARIANTS = ['settimana 1', 'settimana1', 'prima settimana', 'sett 1', 's1', 'settimana 2', 'settimana2', 'seconda settimana', 'sett 2', 's2'];

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

function matchWeekHeader(text: string): number | null {
  const lower = normalize(text);
  if (lower.includes('settimana 2') || lower.includes('settimana2') || lower.includes('seconda settimana') || lower.includes('sett 2') || lower.includes('s2')) return 1;
  if (lower.includes('settimana 1') || lower.includes('settimana1') || lower.includes('prima settimana') || lower.includes('sett 1') || lower.includes('s1')) return 0;
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
  sugar: number;
  fiber: number;
  sodium: number;
  potassium: number;
  calcium: number;
  iron: number;
}

function emptyParsedMeal(type: MealType): ParsedMeal {
  return { type, name: '', foods: [], calories: 0, protein: 0, carbs: 0, fat: 0, sugar: 0, fiber: 0, sodium: 0, potassium: 0, calcium: 0, iron: 0 };
}

interface NutrientPattern {
  key: keyof ParsedMeal;
  regex: RegExp;
}

const NUTRIENT_PATTERNS: NutrientPattern[] = [
  { key: 'calories', regex: /(\d+(?:[.,]\d+)?)\s*k?cal/i },
  { key: 'protein', regex: /(?:prot|proteine|p)\s*:?\s*(\d+(?:[.,]\d+)?)\s*g/i },
  { key: 'carbs', regex: /(?:carb|carbo|c(?:ar)?)\s*:?\s*(\d+(?:[.,]\d+)?)\s*g/i },
  { key: 'fat', regex: /(?:grassi|fat|g|lipidi)\s*:?\s*(\d+(?:[.,]\d+)?)\s*g/i },
  { key: 'sugar', regex: /(?:zuccheri|sugar|z)\s*:?\s*(\d+(?:[.,]\d+)?)\s*g/i },
  { key: 'fiber', regex: /(?:fibre|fiber|fib)\s*:?\s*(\d+(?:[.,]\d+)?)\s*g/i },
  { key: 'sodium', regex: /(?:sodio|sodium|na)\s*:?\s*(\d+(?:[.,]\d+)?)\s*(?:mg|g)/i },
  { key: 'potassium', regex: /(?:potassio|potassium|k)\s*:?\s*(\d+(?:[.,]\d+)?)\s*(?:mg|g)/i },
  { key: 'calcium', regex: /(?:calcio|calcium|ca)\s*:?\s*(\d+(?:[.,]\d+)?)\s*(?:mg|g)/i },
  { key: 'iron', regex: /(?:ferro|iron|fe)\s*:?\s*(\d+(?:[.,]\d+)?)\s*(?:mg|g)/i },
];

function isNutrientLine(line: string): boolean {
  return NUTRIENT_PATTERNS.some((p) => p.regex.test(line));
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
      currentMeal = emptyParsedMeal(mealType);
      continue;
    }

    if (!currentMeal) continue;

    let matched = false;
    for (const pattern of NUTRIENT_PATTERNS) {
      const m = line.match(pattern.regex);
      if (m) {
        (currentMeal as unknown as Record<string, unknown>)[pattern.key as string] = tryParseNumber(m[1]);
        matched = true;
        break;
      }
    }

    if (!matched) {
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

interface DayBlock {
  dayIdx: number;
  lines: string[];
}

function splitByDays(lines: string[]): DayBlock[] {
  const blocks: DayBlock[] = [];
  let current: DayBlock | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const dayIdx = matchDay(trimmed);
    if (dayIdx !== null) {
      if (current) blocks.push(current);
      current = { dayIdx, lines: [] };
    } else if (current) {
      current.lines.push(trimmed);
    }
  }
  if (current) blocks.push(current);
  return blocks;
}

function populateWeek(week: WeekPlan, dayBlocks: DayBlock[]): number {
  let totalMeals = 0;
  for (const block of dayBlocks) {
    const parsedMeals = parseMealsFromBlock(block.lines.join('\n'));
    if (parsedMeals.length === 0) continue;
    const day = week.days[block.dayIdx];
    if (!day) continue;
    const mealsByType = new Map<MealType, Meal>();
    for (const pm of parsedMeals) {
      mealsByType.set(pm.type, toMeal(pm));
    }
    day.meals = day.meals.map((existing) => {
      const replacement = mealsByType.get(existing.type);
      if (replacement) { totalMeals++; return replacement; }
      return existing;
    });
  }
  return totalMeals;
}

export interface PdfImportResult {
  dietName: string;
  weeks: WeekPlan[];
  totalMeals: number;
}

function extractDietName(text: string, fileName: string): string {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  for (const line of lines.slice(0, 5)) {
    if (matchDay(line) !== null || matchMeal(line) !== null || matchWeekHeader(line) !== null) continue;
    if (line.length >= 3 && line.length <= 60) return line;
  }
  return fileName.replace(/\.pdf$/i, '');
}

export function parsePdfToWeeks(text: string, fileName: string): PdfImportResult {
  const dietName = extractDietName(text, fileName);
  const rawLines = text.split('\n');

  let week1Lines: string[] = [];
  let week2Lines: string[] = [];
  let weekIdx = 0;

  for (const line of rawLines) {
    const wh = matchWeekHeader(line.trim());
    if (wh !== null) {
      weekIdx = wh;
      continue;
    }
    if (weekIdx === 0) week1Lines.push(line);
    else week2Lines.push(line);
  }

  const hasWeek2Content = week2Lines.some((l) => l.trim());
  const week1Blocks = splitByDays(week1Lines);
  const week2Blocks = hasWeek2Content ? splitByDays(week2Lines) : [];

  if (week1Blocks.length === 0 && week2Blocks.length === 0) {
    const allMeals = parseMealsFromBlock(rawLines.join('\n'));
    const week1 = createEmptyWeek(`${dietName} - Settimana 1`);
    let total = 0;
    if (allMeals.length > 0) {
      for (const day of week1.days) {
        day.meals = day.meals.map((existing) => {
          const pm = allMeals.find((m) => m.type === existing.type);
          if (pm) { total++; return toMeal(pm); }
          return existing;
        });
      }
    }
    return { dietName, weeks: [week1], totalMeals: total };
  }

  const week1 = createEmptyWeek(`${dietName} - Settimana 1`);
  const week2 = createEmptyWeek(`${dietName} - Settimana 2`);
  let total = populateWeek(week1, week1Blocks);

  if (hasWeek2Content && week2Blocks.length > 0) {
    total += populateWeek(week2, week2Blocks);
    return { dietName, weeks: [week1, week2], totalMeals: total };
  }

  if (week1Blocks.length > 0) {
    total += populateWeek(week2, week1Blocks);
    return { dietName, weeks: [week1, week2], totalMeals: total };
  }

  return { dietName, weeks: [week1], totalMeals: total };
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
    sugar: pm.sugar,
    fiber: pm.fiber,
    sodium: pm.sodium,
    potassium: pm.potassium,
    calcium: pm.calcium,
    iron: pm.iron,
    completed: false,
  };
}
