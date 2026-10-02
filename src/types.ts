export type MealType = 'Colazione' | 'Spuntino' | 'Pranzo' | 'Merenda' | 'Cena';

export const MEAL_TYPES: MealType[] = ['Colazione', 'Spuntino', 'Pranzo', 'Merenda', 'Cena'];

export const MEAL_ICONS: Record<MealType, string> = {
  Colazione: 'sunrise',
  Spuntino: 'apple',
  Pranzo: 'utensils',
  Merenda: 'cookie',
  Cena: 'moon',
};

export interface Meal {
  id: string;
  type: MealType;
  name: string;
  foods: MealFood[];
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  saturatedFat: number;
  sugar: number;
  fiber: number;
  sodium: number;
  potassium: number;
  calcium: number;
  iron: number;
  completed: boolean;
  recurring?: boolean;
  recurringDays?: string[];
}

export interface MealFood {
  id: string;
  foodId: string;
  name: string;
  grams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  saturatedFat: number;
  sugar: number;
  fiber: number;
  sodium: number;
  potassium: number;
  calcium: number;
  iron: number;
  isMain: boolean;
}

// === WORKOUT SYSTEM ===

export type WorkoutCategory = 'strength' | 'time_style' | 'time_only';

export interface StrengthSet {
  reps: number;
  weight: number;
}

export interface WorkoutLog {
  id: string;
  date: string;
  activityName: string;
  category: WorkoutCategory;
  // strength
  sets?: StrengthSet[];
  // time_style + time_only
  minutes?: number;
  // time_style only
  style?: string;
  // calculated
  calories: number;
  met: number;
}

// Legacy compat
export interface WorkoutEntry {
  id: string;
  type: string;
  met: number;
  minutes: number;
  calories: number;
  date: string;
}

export const NUTRIENT_FIELDS = [
  { key: 'calories', label: 'Calorie', unit: 'kcal' },
  { key: 'protein', label: 'Proteine', unit: 'g' },
  { key: 'carbs', label: 'Carboidrati', unit: 'g' },
  { key: 'fat', label: 'Grassi', unit: 'g' },
  { key: 'saturatedFat', label: 'Grassi Saturi', unit: 'g' },
  { key: 'sugar', label: 'Zuccheri', unit: 'g' },
  { key: 'fiber', label: 'Fibre', unit: 'g' },
  { key: 'sodium', label: 'Sodio', unit: 'mg' },
  { key: 'potassium', label: 'Potassio', unit: 'mg' },
  { key: 'calcium', label: 'Calcio', unit: 'mg' },
  { key: 'iron', label: 'Ferro', unit: 'mg' },
] as const;

export type NutrientKey = typeof NUTRIENT_FIELDS[number]['key'];

export interface DayPlan {
  day: string;
  meals: Meal[];
}

export const DAYS_OF_WEEK = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];

export interface WeekPlan {
  id: string;
  label: string;
  days: DayPlan[];
}

export type Sex = 'M' | 'F';
export type ActivityLevel = 'sedentario' | 'leggero' | 'moderato' | 'attivo' | 'intenso';

export const ACTIVITY_LEVELS: { value: ActivityLevel; label: string; multiplier: number; description: string }[] = [
  { value: 'sedentario', label: 'Sedentario', multiplier: 1.2, description: 'Nessuna attività fisica' },
  { value: 'leggero', label: 'Leggero', multiplier: 1.375, description: '1-3 allenamenti/settimana' },
  { value: 'moderato', label: 'Moderato', multiplier: 1.55, description: '3-5 allenamenti/settimana' },
  { value: 'attivo', label: 'Attivo', multiplier: 1.725, description: '6-7 allenamenti/settimana' },
  { value: 'intenso', label: 'Intenso', multiplier: 1.9, description: 'Allenamenti giornalieri intensi' },
];

export interface UserProfile {
  name: string;
  sex: Sex;
  age: number;
  weight: number;
  height: number;
  activityLevel: ActivityLevel;
  goal: 'dimagrimento' | 'mantenimento' | 'massa';
}

export interface BodyMetric {
  id: string;
  date: string;
  weight: number;
  bodyFat: number;
  leanMass: number;
  waist?: number;
  chest?: number;
  hip?: number;
  arm?: number;
  thigh?: number;
  neck?: number;
  shoulder?: number;
  abdomen?: number;
  calf?: number;
}

export type SupplementType = 'creatina' | 'caffeina' | 'preworkout' | 'bcaa' | 'proteine';

export const SUPPLEMENT_TYPES: { value: SupplementType; label: string; unit: string; defaultDose: number }[] = [
  { value: 'creatina', label: 'Creatina', unit: 'g', defaultDose: 5 },
  { value: 'caffeina', label: 'Caffeina', unit: 'mg', defaultDose: 200 },
  { value: 'preworkout', label: 'Pre-Workout', unit: 'g', defaultDose: 10 },
  { value: 'bcaa', label: 'BCAA', unit: 'g', defaultDose: 5 },
  { value: 'proteine', label: 'Proteine in polvere', unit: 'g', defaultDose: 30 },
];

export interface SupplementLog {
  id: string;
  date: string;
  type: SupplementType;
  dose: number;
  taken: boolean;
  timing: 'pre' | 'post' | 'mattina' | 'sera' | 'altro';
}

export interface MicronutrientLog {
  id: string;
  date: string;
  sodium: number;
  potassium: number;
  magnesium: number;
  calcium: number;
  iron: number;
  vitaminC: number;
  vitaminD: number;
  vitaminB12: number;
  zinc: number;
}

export const MICRONUTRIENT_TARGETS = {
  sodium: { label: 'Sodio', unit: 'mg', min: 1500, max: 2300 },
  potassium: { label: 'Potassio', unit: 'mg', min: 3500, max: 4700 },
  magnesium: { label: 'Magnesio', unit: 'mg', min: 400, max: 420 },
  calcium: { label: 'Calcio', unit: 'mg', min: 1000, max: 1300 },
  iron: { label: 'Ferro', unit: 'mg', min: 8, max: 18 },
  vitaminC: { label: 'Vitamina C', unit: 'mg', min: 90, max: 200 },
  vitaminD: { label: 'Vitamina D', unit: 'µg', min: 15, max: 100 },
  vitaminB12: { label: 'Vitamina B12', unit: 'µg', min: 2.4, max: 10 },
  zinc: { label: 'Zinco', unit: 'mg', min: 11, max: 40 },
} as const;

export type MicronutrientKey = keyof typeof MICRONUTRIENT_TARGETS;

export interface ShoppingItem {
  id: string;
  name: string;
  category: string;
  quantity: string;
  checked: boolean;
}

export interface NotificationConfig {
  enabled: boolean;
  meals: boolean;
  hydration: boolean;
  supplements: boolean;
  mealTimes: { Colazione: string; Pranzo: string; Cena: string };
  hydrationInterval: number;
  supplementTime: string;
}

export interface WaterLog {
  date: string;
  glasses: number;
}

export type Theme = 'light' | 'dark' | 'system';

export interface CustomFoodEntry {
  id: string;
  name: string;
  category: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  saturatedFat: number;
  sugar: number;
  fiber: number;
  sodium: number;
  potassium: number;
  calcium: number;
  iron: number;
}

export interface SupportTicket {
  id: string;
  subject: string;
  message: string;
  status: 'open' | 'closed';
  admin_reply?: string | null;
  created_at: string;
}

export interface LeaderboardEntry {
  user_id: string;
  display_name: string;
  total_calories: number;
  total_workouts: number;
}

export interface AppState {
  profile: UserProfile;
  weeks: WeekPlan[];
  activeWeekId: string;
  bodyMetrics: BodyMetric[];
  supplementLogs: SupplementLog[];
  micronutrientLogs: MicronutrientLog[];
  shoppingList: ShoppingItem[];
  notifications: NotificationConfig;
  waterLogs: WaterLog[];
  theme: Theme;
  pdfText: string | null;
  customFoods: CustomFoodEntry[];
  workoutLogs: WorkoutLog[];
  onboardingComplete: boolean;
  lastChangelogVersion?: string;
}
