import type { AppState } from '@/types';
import { getDefaultState, migrateWeeks } from '@/lib/data';

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const arr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

function validWeeks(v: unknown): AppState['weeks'] | null {
  if (!Array.isArray(v) || v.length === 0) return null;
  const ok = v.every((w) => isObj(w) && typeof w.id === 'string' && Array.isArray(w.days) && w.days.length === 7
    && w.days.every((d) => isObj(d) && Array.isArray(d.meals) && d.meals.every((m) => isObj(m) && Array.isArray(m.foods))));
  return ok ? migrateWeeks(v as AppState['weeks']) : null;
}

/** Fills missing fields and replaces malformed ones; throws only if the input is not an object at all. */
export function mergeState(input: unknown): AppState {
  if (!isObj(input)) throw new Error('invalid state');
  const parsed = input as Partial<AppState>;
  const base = getDefaultState();
  const weeks = validWeeks(parsed.weeks) ?? base.weeks;
  return {
    ...base,
    ...parsed,
    profile: { ...base.profile, ...(isObj(parsed.profile) ? parsed.profile : {}) },
    weeks,
    activeWeekId: weeks.some((w) => w.id === parsed.activeWeekId) ? parsed.activeWeekId! : weeks[0].id,
    bodyMetrics: arr(parsed.bodyMetrics),
    supplementLogs: arr(parsed.supplementLogs),
    micronutrientLogs: arr(parsed.micronutrientLogs),
    shoppingList: arr(parsed.shoppingList),
    waterLogs: arr(parsed.waterLogs),
    customFoods: arr(parsed.customFoods),
    workoutLogs: arr(parsed.workoutLogs),
    notifications: { ...base.notifications, ...(isObj(parsed.notifications) ? parsed.notifications : {}) },
    onboardingComplete: parsed.onboardingComplete === true,
    lastChangelogVersion: typeof parsed.lastChangelogVersion === 'string' ? parsed.lastChangelogVersion : '',
    seenManualSections: arr<unknown>(parsed.seenManualSections).filter((s): s is string => typeof s === 'string'),
    mealHistory: isObj(parsed.mealHistory) ? (parsed.mealHistory as AppState['mealHistory']) : {},
    dayChecks: isObj(parsed.dayChecks) ? (parsed.dayChecks as AppState['dayChecks']) : {},
  };
}
