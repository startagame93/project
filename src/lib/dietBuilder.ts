import type { Meal, MealType, WeekPlan } from '@/types';
import { MEAL_TYPES } from '@/types';
import { createEmptyMeal, createEmptyWeek, uid } from '@/lib/data';
import { matchFood, calculateNutrients, type FoodEntry } from '@/lib/foodDatabase';

export const UNKNOWN_SUFFIX = ' - sconosciuto';
export const MAX_WEEKS = 8;
/** Raw day value meaning "same meals every day of the week". */
export const EVERY_DAY = 'all';

export const isUnknownFood = (label: string) => label.endsWith(UNKNOWN_SUFFIX);
export const stripUnknown = (label: string) => (isUnknownFood(label) ? label.slice(0, -UNKNOWN_SUFFIX.length) : label);

type NutrientKey = 'calories' | 'protein' | 'carbs' | 'fat' | 'saturatedFat' | 'sugar' | 'fiber' | 'sodium' | 'potassium' | 'calcium' | 'iron';
export const NUTRIENT_KEYS: NutrientKey[] = ['calories', 'protein', 'carbs', 'fat', 'saturatedFat', 'sugar', 'fiber', 'sodium', 'potassium', 'calcium', 'iron'];
const WHOLE_KEYS = new Set<NutrientKey>(['calories', 'sodium', 'potassium', 'calcium']);

export interface DietBuildResult {
  title: string;
  weeks: WeekPlan[];
  totalMeals: number;
  matchedFoods: number;
  totalFoods: number;
}

interface FoodLine {
  label: string;
  matched: boolean;
  values: Record<NutrientKey, number>;
}

const asArray = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const asObj = (v: unknown): Record<string, unknown> => (v && typeof v === 'object' ? (v as Record<string, unknown>) : {});
const str = (v: unknown, max = 120) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const num = (v: unknown) => {
  const n = typeof v === 'string' ? Number(v.replace(',', '.')) : v;
  return typeof n === 'number' && Number.isFinite(n) && n >= 0 ? Math.round(n) : 0;
};
const zero = () => Object.fromEntries(NUTRIENT_KEYS.map((k) => [k, 0])) as Record<NutrientKey, number>;

const DAY_PREFIXES = ['lun', 'mar', 'mer', 'gio', 'ven', 'sab', 'dom'];

/** Day index 0-6, EVERY_DAY, or null when unusable. */
export function readDay(v: unknown, position: number): number | typeof EVERY_DAY | null {
  if (v === EVERY_DAY) return EVERY_DAY;
  if (typeof v === 'number' && Number.isFinite(v)) {
    if (v >= 0 && v <= 6) return Math.floor(v);
    return v === 7 ? 6 : null;
  }
  if (typeof v === 'string') {
    const t = v.trim().toLowerCase();
    if (/^\d+$/.test(t)) return readDay(Number(t), position);
    const named = DAY_PREFIXES.findIndex((d) => t.startsWith(d));
    if (named >= 0) return named;
  }
  return position >= 0 && position <= 6 ? position : null;
}

export function readMealType(v: unknown): MealType | undefined {
  const t = str(v).toLowerCase();
  if (!t) return undefined;
  const exact = MEAL_TYPES.find((m) => m.toLowerCase() === t);
  if (exact) return exact;
  if (t.includes('colaz') || t.includes('breakfast')) return 'Colazione';
  if (t.includes('dopo cena') || t.includes('dopocena') || t.includes('pomerid') || t.includes('merenda')) return 'Merenda';
  if (t.includes('pranzo') || t.includes('lunch')) return 'Pranzo';
  if (t.includes('cena') || t.includes('dinner')) return 'Cena';
  if (t.includes('spuntino') || t.includes('snack') || t.includes('meta mattina') || t.includes('metà mattina')) return 'Spuntino';
  return undefined;
}

export function foodLabel(name: string, grams: number) {
  return grams > 0 ? `${name} (${grams}g)` : name;
}

/** Looks a food up in the database; unknown foods keep their text with the "sconosciuto" marker and no values. */
export function resolveFood(name: string, grams: number, customFoods: FoodEntry[]): FoodLine {
  const match = matchFood(name, customFoods);
  if (!match) return { label: foodLabel(name, grams) + UNKNOWN_SUFFIX, matched: false, values: zero() };
  if (grams <= 0) return { label: match.name, matched: true, values: zero() };
  const calc = calculateNutrients(match, grams);
  const values = Object.fromEntries(NUTRIENT_KEYS.map((k) => [k, calc[k]])) as Record<NutrientKey, number>;
  return { label: foodLabel(match.name, grams), matched: true, values };
}

function readFood(raw: unknown, customFoods: FoodEntry[]): FoodLine | null {
  const fo = asObj(raw);
  const name = str(fo.name, 80);
  return name ? resolveFood(name, num(fo.grams), customFoods) : null;
}

function cloneMeal(m: Meal): Meal {
  return { ...m, id: uid(), foods: [...m.foods] };
}

function cloneWeek(source: WeekPlan, label: string): WeekPlan {
  const week = createEmptyWeek(label);
  week.days = week.days.map((d, i) => ({ ...d, meals: source.days[i].meals.map(cloneMeal) }));
  return week;
}

function placeMeal(week: WeekPlan, dayIndex: number, meal: Meal, filled: Set<string>) {
  const slot = `${dayIndex}-${meal.type}`;
  const day = week.days[dayIndex];
  if (filled.has(slot) || !day.meals.some((m) => m.type === meal.type)) {
    day.meals = [...day.meals, meal];
  } else {
    day.meals = day.meals.map((existing) => (existing.type === meal.type ? meal : existing));
  }
  filled.add(slot);
}

/**
 * Turns a structured plan ({title, durationWeeks, weeks:[{days:[{day, meals:[{type, name, foods:[{name, grams}]}]}]}]})
 * into calendar weeks. Input is untrusted (AI or free text), so every field is validated.
 */
export function buildDietWeeks(data: unknown, fallbackTitle: string, customFoods: FoodEntry[]): DietBuildResult | null {
  const root = asObj(data);
  const title = str(root.title, 60) || fallbackTitle;
  let totalFoods = 0;
  let matchedFoods = 0;

  const distinct = asArray(root.weeks).slice(0, MAX_WEEKS).map((w, wi) => {
    const week = createEmptyWeek(`${title} - Settimana ${wi + 1}`);
    const filled = new Set<string>();
    asArray(asObj(w).days).forEach((d, position) => {
      const target = readDay(asObj(d).day, position);
      if (target === null) return;
      for (const m of asArray(asObj(d).meals)) {
        const mo = asObj(m);
        const type = readMealType(mo.type) ?? readMealType(mo.name);
        if (!type) continue;
        const lines = asArray(mo.foods).map((f) => readFood(f, customFoods)).filter((l): l is FoodLine => !!l).slice(0, 30);
        if (lines.length === 0) continue;
        totalFoods += lines.length;
        matchedFoods += lines.filter((l) => l.matched).length;

        const meal: Meal = { ...createEmptyMeal(type), name: str(mo.name, 80) || type, foods: lines.map((l) => l.label) };
        for (const k of NUTRIENT_KEYS) {
          const sum = lines.reduce((acc, l) => acc + l.values[k], 0);
          meal[k] = WHOLE_KEYS.has(k) ? Math.round(sum) : Math.round(sum * 10) / 10;
        }
        if (target === EVERY_DAY) week.days.forEach((_, i) => placeMeal(week, i, cloneMeal(meal), filled));
        else placeMeal(week, target, meal, filled);
      }
    });
    return week;
  }).filter((w) => w.days.some((d) => d.meals.some((m) => m.foods.length > 0)));

  if (distinct.length === 0) return null;

  const duration = Math.min(MAX_WEEKS, Math.max(distinct.length, num(root.durationWeeks)));
  const weeks = Array.from({ length: duration }, (_, i) =>
    i < distinct.length ? distinct[i] : cloneWeek(distinct[i % distinct.length], `${title} - Settimana ${i + 1}`));
  const totalMeals = weeks.reduce((s, w) => s + w.days.reduce((a, d) => a + d.meals.filter((m) => m.foods.length > 0).length, 0), 0);

  return { title, weeks, totalMeals, matchedFoods, totalFoods };
}
