import type { AppState, WeekPlan, UserProfile, DayPlan, Meal } from '@/types';
import { DAYS_OF_WEEK, MEAL_TYPES } from '@/types';

export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function calcBMR(profile: UserProfile): number {
  const { weight, height, age, sex } = profile;
  if (sex === 'M') {
    return 10 * weight + 6.25 * height - 5 * age + 5;
  }
  return 10 * weight + 6.25 * height - 5 * age - 161;
}

export function calcTDEE(profile: UserProfile): number {
  const bmr = calcBMR(profile);
  const multiplier =
    profile.activityLevel === 'sedentario' ? 1.2
    : profile.activityLevel === 'leggero' ? 1.375
    : profile.activityLevel === 'moderato' ? 1.55
    : profile.activityLevel === 'attivo' ? 1.725
    : 1.9;
  return Math.round(bmr * multiplier);
}

export function calcTargetCalories(profile: UserProfile): number {
  const tdee = calcTDEE(profile);
  if (profile.goal === 'dimagrimento') return Math.round(tdee * 0.8);
  if (profile.goal === 'massa') return Math.round(tdee * 1.1);
  return tdee;
}

export function calcMacroTargets(profile: UserProfile): { protein: number; carbs: number; fat: number } {
  const cal = calcTargetCalories(profile);
  let pRatio = 0.3, cRatio = 0.4, fRatio = 0.3;
  if (profile.goal === 'massa') { pRatio = 0.3; cRatio = 0.5; fRatio = 0.2; }
  if (profile.goal === 'dimagrimento') { pRatio = 0.35; cRatio = 0.3; fRatio = 0.35; }
  return {
    protein: Math.round((cal * pRatio) / 4),
    carbs: Math.round((cal * cRatio) / 4),
    fat: Math.round((cal * fRatio) / 9),
  };
}

export function calcLeanMass(weight: number, bodyFat: number): number {
  return Math.round((weight * (1 - bodyFat / 100)) * 10) / 10;
}

export function createEmptyMeal(type: Meal['type']): Meal {
  return {
    id: uid(),
    type,
    name: '',
    foods: [],
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    completed: false,
  };
}

function createEmptyDay(day: string): DayPlan {
  return {
    day,
    meals: MEAL_TYPES.map((t) => createEmptyMeal(t)),
  };
}

export function createEmptyWeek(label: string): WeekPlan {
  return {
    id: uid(),
    label,
    days: DAYS_OF_WEEK.map((d) => createEmptyDay(d)),
  };
}

const DEFAULT_PROFILE: UserProfile = {
  name: '',
  sex: 'M',
  age: 30,
  weight: 75,
  height: 175,
  activityLevel: 'moderato',
  goal: 'mantenimento',
};

export function getDefaultState(): AppState {
  const week1 = createEmptyWeek('Settimana 1');
  return {
    profile: DEFAULT_PROFILE,
    weeks: [week1],
    activeWeekId: week1.id,
    bodyMetrics: [],
    supplementLogs: [],
    micronutrientLogs: [],
    shoppingList: [],
    notifications: {
      enabled: false,
      meals: true,
      hydration: true,
      supplements: true,
      mealTimes: { Colazione: '08:00', Pranzo: '13:00', Cena: '20:00' },
      hydrationInterval: 2,
      supplementTime: '09:00',
    },
    waterLogs: [],
    theme: 'system',
    pdfText: null,
  };
}
