import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { calcBMR, calcTDEE, calcTargetCalories, calcMacroTargets, todayISO } from '@/lib/data';
import { ProgressRing } from '@/components/ProgressRing';
import { ProgressBar } from '@/components/ProgressBar';
import { Droplet, Flame, Beef, Wheat, Fish, Dumbbell, Pill, TrendingUp, Bell, Activity, Zap, Minus, Plus, ChevronDown } from 'lucide-react';
import { SUPPLEMENT_TYPES, MICRONUTRIENT_TARGETS, MEAL_TYPES, ACTIVITY_LEVELS } from '@/types';
import type { ActivityLevel } from '@/types';

const WORKOUT_TYPES: { label: string; met: number; icon: string }[] = [
  { label: 'Camminata', met: 3.5, icon: '🚶' },
  { label: 'Corsa', met: 8.0, icon: '🏃' },
  { label: 'Ciclismo', met: 7.0, icon: '🚴' },
  { label: 'Nuoto', met: 8.0, icon: '🏊' },
  { label: 'Pesi', met: 5.0, icon: '🏋️' },
  { label: 'HIIT', met: 10.0, icon: '⚡' },
  { label: 'Yoga / Pilates', met: 3.0, icon: '🧘' },
  { label: 'Calcio', met: 7.0, icon: '⚽' },
  { label: 'Basket', met: 6.5, icon: '🏀' },
  { label: 'Tennis', met: 6.0, icon: '🎾' },
  { label: 'Canottaggio', met: 8.5, icon: '🚣' },
  { label: 'Danza', met: 4.5, icon: '💃' },
];

function calcWorkoutCalories(met: number, weightKg: number, minutes: number): number {
  return Math.round(met * weightKg * (minutes / 60));
}

export function Dashboard({ onNavigate }: { onNavigate: (tab: 'diet' | 'nutrition' | 'body' | 'settings') => void }) {
  const { state, setState } = useApp();
  const today = todayISO();
  const activeWeek = state.weeks.find((w) => w.id === state.activeWeekId) ?? state.weeks[0];
  const dayIdx = (new Date().getDay() + 6) % 7;
  const todayPlan = activeWeek?.days[dayIdx];

  const todayMeals = todayPlan?.meals ?? [];
  const completedMeals = todayMeals.filter((m) => m.completed).length;
  const totalMeals = todayMeals.length;

  const consumedCalories = todayMeals.filter((m) => m.completed).reduce((s, m) => s + m.calories, 0);
  const consumedProtein = todayMeals.filter((m) => m.completed).reduce((s, m) => s + m.protein, 0);
  const consumedCarbs = todayMeals.filter((m) => m.completed).reduce((s, m) => s + m.carbs, 0);
  const consumedFat = todayMeals.filter((m) => m.completed).reduce((s, m) => s + m.fat, 0);
  const consumedSaturatedFat = todayMeals.filter((m) => m.completed).reduce((s, m) => s + m.saturatedFat, 0);
  const consumedSugar = todayMeals.filter((m) => m.completed).reduce((s, m) => s + m.sugar, 0);
  const consumedFiber = todayMeals.filter((m) => m.completed).reduce((s, m) => s + m.fiber, 0);
  const consumedSodium = todayMeals.filter((m) => m.completed).reduce((s, m) => s + m.sodium, 0);
  const consumedPotassium = todayMeals.filter((m) => m.completed).reduce((s, m) => s + m.potassium, 0);
  const consumedCalcium = todayMeals.filter((m) => m.completed).reduce((s, m) => s + m.calcium, 0);
  const consumedIron = todayMeals.filter((m) => m.completed).reduce((s, m) => s + m.iron, 0);

  const todayWater = state.waterLogs.find((w) => w.date === today)?.glasses ?? 0;
  const waterTarget = 8;

  const todaySupps = state.supplementLogs.filter((s) => s.date === today);
  const takenSupps = todaySupps.filter((s) => s.taken).length;

  const todayMicro = state.micronutrientLogs.find((m) => m.date === today);

  const bmr = Math.round(calcBMR(state.profile));
  const tdee = calcTDEE(state.profile);
  const targetCal = calcTargetCalories(state.profile);
  const macroTargets = calcMacroTargets(state.profile);
  const activityLabel = ACTIVITY_LEVELS.find((a) => a.value === state.profile.activityLevel)?.label ?? 'Moderato';

  const microKeys = Object.keys(MICRONUTRIENT_TARGETS) as (keyof typeof MICRONUTRIENT_TARGETS)[];
  const lowMicros = microKeys.filter((k) => {
    const val = todayMicro?.[k] ?? 0;
    return val < MICRONUTRIENT_TARGETS[k].min;
  });

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Buongiorno';
    if (h < 18) return 'Buon pomeriggio';
    return 'Buonasera';
  })();

  return (
    <div className="space-y-5">
      {/* Greeting */}
      <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-3xl p-5 text-white shadow-lg shadow-primary-600/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-primary-100 text-sm">{greeting}</p>
            <h1 className="text-2xl font-bold">{state.profile.name || 'Atleta'}</h1>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
            <Flame className="w-6 h-6" />
          </div>
        </div>
        <div className="mt-4 flex gap-3">
          <div className="flex-1 bg-white/15 rounded-2xl p-3 backdrop-blur-sm">
            <p className="text-primary-100 text-xs">BMR</p>
            <p className="text-lg font-bold">{bmr} kcal</p>
          </div>
          <div className="flex-1 bg-white/15 rounded-2xl p-3 backdrop-blur-sm">
            <p className="text-primary-100 text-xs">TDEE</p>
            <p className="text-lg font-bold">{tdee} kcal</p>
          </div>
        </div>
      </div>

      {/* TDEE & Workout Calculator */}
      <TdeeCalculator bmr={bmr} tdee={tdee} targetCal={targetCal} weight={state.profile.weight} activityLabel={activityLabel} activityLevel={state.profile.activityLevel} setState={setState} />

      {/* Calorie ring */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title">Calorie di Oggi</h2>
          <span className="chip bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
            {activeWeek?.label}
          </span>
        </div>
        <div className="flex items-center gap-5">
          <ProgressRing
            value={consumedCalories}
            max={targetCal}
            size={130}
            color="#10b981"
            label={`${consumedCalories}`}
            sublabel={`/${targetCal} kcal`}
          />
          <div className="flex-1 space-y-3">
            <MacroBar icon={Beef} label="Proteine" value={consumedProtein} max={macroTargets.protein} color="bg-blue-500" unit="g" />
            <MacroBar icon={Wheat} label="Carbo" value={consumedCarbs} max={macroTargets.carbs} color="bg-accent-500" unit="g" />
            <MacroBar icon={Fish} label="Grassi" value={consumedFat} max={macroTargets.fat} color="bg-secondary-500" unit="g" />
          </div>
        </div>
      </div>

      {/* Extended nutrients summary */}
      {(consumedSaturatedFat > 0 || consumedSugar > 0 || consumedFiber > 0 || consumedSodium > 0 || consumedPotassium > 0 || consumedCalcium > 0 || consumedIron > 0) && (
        <div className="card p-5">
          <h2 className="section-title mb-3">Dettaglio Nutrienti di Oggi</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <NutrientStat label="Grassi Saturi" value={consumedSaturatedFat} unit="g" color="text-rose-600" />
            <NutrientStat label="Zuccheri" value={consumedSugar} unit="g" color="text-pink-500" />
            <NutrientStat label="Fibre" value={consumedFiber} unit="g" color="text-green-600" />
            <NutrientStat label="Sodio" value={consumedSodium} unit="mg" color="text-orange-500" />
            <NutrientStat label="Potassio" value={consumedPotassium} unit="mg" color="text-teal-500" />
            <NutrientStat label="Calcio" value={consumedCalcium} unit="mg" color="text-amber-600" />
            <NutrientStat label="Ferro" value={consumedIron} unit="mg" color="text-red-500" />
          </div>
        </div>
      )}

      {/* Meals summary */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="section-title">Pasti di Oggi</h2>
          <button onClick={() => onNavigate('diet')} className="text-sm text-primary-600 dark:text-primary-400 font-medium">
            Vedi dieta →
          </button>
        </div>
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1">
            <ProgressBar value={completedMeals} max={totalMeals} color="bg-primary-500" height={10} />
          </div>
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{completedMeals}/{totalMeals}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {MEAL_TYPES.map((mt) => {
            const meal = todayMeals.find((m) => m.type === mt);
            const done = meal?.completed;
            return (
              <span
                key={mt}
                className={`chip ${done ? 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-300' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500'}`}
              >
                {mt}
              </span>
            );
          })}
        </div>
      </div>

      {/* Water + Supplements quick */}
      <div className="grid grid-cols-2 gap-4">
        <button onClick={() => onNavigate('nutrition')} className="card p-4 text-left active:scale-95 transition-transform">
          <Droplet className="w-7 h-7 text-blue-500 mb-2" />
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{todayWater}</p>
          <p className="text-xs text-gray-500">bicchieri / {waterTarget}</p>
          <ProgressBar value={todayWater} max={waterTarget} color="bg-blue-500" height={6} />
        </button>
        <button onClick={() => onNavigate('nutrition')} className="card p-4 text-left active:scale-95 transition-transform">
          <Pill className="w-7 h-7 text-accent-500 mb-2" />
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{takenSupps}</p>
          <p className="text-xs text-gray-500">integratori presi</p>
          <ProgressBar value={takenSupps} max={todaySupps.length || 1} color="bg-accent-500" height={6} />
        </button>
      </div>

      {/* Micronutrient alerts */}
      {lowMicros.length > 0 && (
        <div className="card p-4 border-warning-200 dark:border-warning-800 bg-warning-50 dark:bg-warning-900/20">
          <div className="flex items-center gap-2 mb-2">
            <Bell className="w-5 h-5 text-warning-600" />
            <h3 className="font-semibold text-warning-800 dark:text-warning-300">Carenze rilevate</h3>
          </div>
          <p className="text-sm text-warning-700 dark:text-warning-400">
            Assunzione bassa di: {lowMicros.map((k) => MICRONUTRIENT_TARGETS[k].label).join(', ')}
          </p>
          <button onClick={() => onNavigate('nutrition')} className="mt-2 text-sm font-medium text-warning-700 dark:text-warning-300">
            Registra assunzione →
          </button>
        </div>
      )}

      {/* Quick stats */}
      <div className="card p-5">
        <h2 className="section-title mb-3">Statistiche</h2>
        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={Dumbbell} label="Integratori" value={`${SUPPLEMENT_TYPES.length} tipi`} color="text-accent-600" onClick={() => onNavigate('nutrition')} />
          <StatCard icon={TrendingUp} label="Misurazioni" value={`${state.bodyMetrics.length}`} color="text-secondary-600" onClick={() => onNavigate('body')} />
        </div>
      </div>
    </div>
  );
}

function TdeeCalculator({ bmr, tdee, targetCal, weight, activityLabel, activityLevel, setState }: {
  bmr: number;
  tdee: number;
  targetCal: number;
  weight: number;
  activityLabel: string;
  activityLevel: ActivityLevel;
  setState: (updater: (prev: import('@/types').AppState) => import('@/types').AppState) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState(0);
  const [minutes, setMinutes] = useState(30);
  const [burned, setBurned] = useState(0);

  const workout = WORKOUT_TYPES[selectedWorkout];
  const sessionCalories = calcWorkoutCalories(workout.met, weight, minutes);
  const netTdee = tdee + burned;
  const netTarget = targetCal + burned;

  function logWorkout() {
    setBurned((b) => b + sessionCalories);
  }

  function resetWorkout() {
    setBurned(0);
  }

  return (
    <div className="card p-5">
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center justify-between text-left"
        aria-expanded={expanded}
        aria-label="Calcolatore dispendio calorico e allenamento. Tocca per espandere."
      >
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center shrink-0">
            <Activity className="w-5 h-5 text-accent-600 dark:text-accent-400" />
          </div>
          <div>
            <h2 className="section-title">Dispendio Calorico (TDEE)</h2>
            <p className="text-xs text-gray-500">BMR, attivita e calorie da allenamento</p>
          </div>
        </div>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {!expanded && (
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div className="p-2 rounded-xl bg-gray-50 dark:bg-gray-800">
            <p className="text-xs text-gray-500">BMR</p>
            <p className="text-base font-bold text-gray-900 dark:text-white">{bmr}</p>
          </div>
          <div className="p-2 rounded-xl bg-gray-50 dark:bg-gray-800">
            <p className="text-xs text-gray-500">TDEE</p>
            <p className="text-base font-bold text-primary-600 dark:text-primary-400">{tdee}</p>
          </div>
          <div className="p-2 rounded-xl bg-gray-50 dark:bg-gray-800">
            <p className="text-xs text-gray-500">Obiettivo</p>
            <p className="text-base font-bold text-accent-600 dark:text-accent-400">{targetCal}</p>
          </div>
        </div>
      )}

      {expanded && (
        <div className="mt-4 space-y-4 animate-fade-in" role="region" aria-label="Dettagli dispendio calorico">
          {/* Activity level selector */}
          <div>
            <label className="label">Livello di Attivita</label>
            <select
              className="input"
              value={activityLevel}
              onChange={(e) => setState((prev) => ({ ...prev, profile: { ...prev.profile, activityLevel: e.target.value as ActivityLevel } }))}
              aria-label="Seleziona il tuo livello di attivita settimanale"
            >
              {ACTIVITY_LEVELS.map((a) => (
                <option key={a.value} value={a.value}>{a.label} - {a.description}</option>
              ))}
            </select>
          </div>

          {/* TDEE breakdown */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800">
              <span className="flex items-center gap-2 text-gray-600 dark:text-gray-400"><Flame className="w-4 h-4 text-orange-500" /> Metabolismo basale (BMR)</span>
              <span className="font-semibold text-gray-900 dark:text-white">{bmr} kcal</span>
            </div>
            <div className="flex items-center justify-between text-sm p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800">
              <span className="flex items-center gap-2 text-gray-600 dark:text-gray-400"><Activity className="w-4 h-4 text-accent-500" /> Attivita ({activityLabel})</span>
              <span className="font-semibold text-gray-900 dark:text-white">+{tdee - bmr} kcal</span>
            </div>
            {burned > 0 && (
              <div className="flex items-center justify-between text-sm p-2.5 rounded-xl bg-accent-50 dark:bg-accent-900/20 border border-accent-200 dark:border-accent-800">
                <span className="flex items-center gap-2 text-accent-700 dark:text-accent-300"><Zap className="w-4 h-4" /> Allenamento registrato</span>
                <span className="font-semibold text-accent-700 dark:text-accent-300">+{burned} kcal</span>
              </div>
            )}
            <div className="flex items-center justify-between text-sm p-3 rounded-xl bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800">
              <span className="font-semibold text-primary-700 dark:text-primary-300">TDEE Totale</span>
              <span className="text-lg font-bold text-primary-700 dark:text-primary-300">{netTdee} kcal</span>
            </div>
            <div className="flex items-center justify-between text-sm p-3 rounded-xl bg-accent-50 dark:bg-accent-900/20 border border-accent-200 dark:border-accent-800">
              <span className="font-semibold text-accent-700 dark:text-accent-300">Obiettivo Calorico Aggiornato</span>
              <span className="text-lg font-bold text-accent-700 dark:text-accent-300">{netTarget} kcal</span>
            </div>
          </div>

          {/* Workout calculator */}
          <div className="pt-3 border-t border-gray-100 dark:border-gray-800">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Calcola Calorie da Allenamento</h3>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {WORKOUT_TYPES.map((w, i) => (
                <button
                  key={w.label}
                  onClick={() => setSelectedWorkout(i)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl text-xs font-medium transition-all ${
                    selectedWorkout === i
                      ? 'bg-primary-600 text-white scale-105'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                  }`}
                  aria-label={`${w.label}, MET ${w.met}`}
                  aria-pressed={selectedWorkout === i}
                >
                  <span className="text-lg" aria-hidden="true">{w.icon}</span>
                  {w.label}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-gray-600 dark:text-gray-400">Durata (minuti)</label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setMinutes((m) => Math.max(5, m - 5))}
                  className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                  aria-label="Riduci durata di 5 minuti"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-lg font-bold text-gray-900 dark:text-white w-12 text-center" aria-live="polite">{minutes}</span>
                <button
                  onClick={() => setMinutes((m) => Math.min(180, m + 5))}
                  className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                  aria-label="Aumenta durata di 5 minuti"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-accent-50 to-primary-50 dark:from-accent-900/20 dark:to-primary-900/20 mb-3">
              <div>
                <p className="text-xs text-gray-500">Stima sessione</p>
                <p className="text-xl font-bold text-accent-600 dark:text-accent-400">{sessionCalories} kcal</p>
              </div>
              <span className="text-2xl" aria-hidden="true">{workout.icon}</span>
            </div>

            <div className="flex gap-2">
              <button onClick={logWorkout} className="btn-primary flex-1 text-sm">
                <Plus className="w-4 h-4" /> Aggiungi al TDEE
              </button>
              {burned > 0 && (
                <button onClick={resetWorkout} className="btn-secondary flex-1 text-sm">
                  Azzera
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MacroBar({ icon: Icon, label, value, max, color, unit }: {
  icon: typeof Beef; label: string; value: number; max: number; color: string; unit: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
          <Icon className="w-4 h-4" /> {label}
        </span>
        <span className="text-xs font-medium text-gray-500">{value}/{max}{unit}</span>
      </div>
      <ProgressBar value={value} max={max} color={color} height={6} />
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, onClick }: {
  icon: typeof Beef; label: string; value: string; color: string; onClick: () => void;
}) {
  return (
    <button onClick={onClick} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
      <Icon className={`w-5 h-5 ${color}`} />
      <div className="text-left">
        <p className="text-sm font-semibold text-gray-900 dark:text-white">{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    </button>
  );
}

function NutrientStat({ label, value, unit, color }: { label: string; value: number; unit: string; color: string }) {
  return (
    <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
      <p className={`text-lg font-bold ${color}`}>{value}{unit}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}
