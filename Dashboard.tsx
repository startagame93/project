import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { calcTargetCalories, calcMacroTargets, todayISO } from '@/lib/data';
import { ProgressRing } from '@/components/ProgressRing';
import { ProgressBar } from '@/components/ProgressBar';
import { Droplet, Flame, Beef, Wheat, Fish, Pill, Bell, Dumbbell } from 'lucide-react';
import { MICRONUTRIENT_TARGETS, MEAL_TYPES } from '@/types';

export function Dashboard({ onNavigate }: { onNavigate: (tab: 'diet' | 'nutrition' | 'body' | 'gym' | 'settings') => void }) {
  const { state } = useApp();
  const { profile, displayName: authName } = useAuth();
  const displayName = authName || state.profile.name || 'Atleta';
  const today = todayISO();
  const activeWeek = state.weeks.find((w) => w.id === state.activeWeekId) ?? state.weeks[0];
  const dayIdx = (new Date().getDay() + 6) % 7;
  const todayPlan = activeWeek?.days[dayIdx];

  const todayMeals = todayPlan?.meals ?? [];
  const completedMeals = todayMeals.filter((m) => m.completed).length;
  const totalMeals = todayMeals.length;

  const consumedCalories = todayMeals.filter((m) => m.completed).reduce((s, m) => s + m.calories, 0);
  const targetCal = calcTargetCalories(state.profile);
  const macroTargets = calcMacroTargets(state.profile);

  const consumedProtein = todayMeals.filter((m) => m.completed).reduce((s, m) => s + m.protein, 0);
  const consumedCarbs = todayMeals.filter((m) => m.completed).reduce((s, m) => s + m.carbs, 0);
  const consumedFat = todayMeals.filter((m) => m.completed).reduce((s, m) => s + m.fat, 0);

  const todayWater = state.waterLogs.find((w) => w.date === today)?.glasses ?? 0;
  const waterTarget = 8;

  const todaySupps = state.supplementLogs.filter((s) => s.date === today);
  const takenSupps = todaySupps.filter((s) => s.taken).length;

  const todayWorkouts = state.workoutLogs.filter((w) => w.date === today);
  const todayBurned = todayWorkouts.reduce((s, w) => s + w.calories, 0);

  const todayMicro = state.micronutrientLogs.find((m) => m.date === today);
  const microKeys = Object.keys(MICRONUTRIENT_TARGETS) as (keyof typeof MICRONUTRIENT_TARGETS)[];
  // Show deficiencies only once something has actually been logged today
  const hasIntakeToday = consumedCalories > 0 || microKeys.some((k) => (todayMicro?.[k] ?? 0) > 0);
  const lowMicros = !hasIntakeToday ? [] : microKeys.filter((k) => {
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
    <div className="space-y-4">
      {/* Greeting */}
      <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-3xl p-5 text-white shadow-lg shadow-primary-600/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-primary-100 text-sm">{greeting}</p>
            <h1 className="text-2xl font-bold">{displayName}</h1>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
            <Flame className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Calorie ring */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title">Calorie di Oggi</h2>
          {todayBurned > 0 && (
            <span className="chip bg-accent-100 text-accent-700 dark:bg-accent-900/30 dark:text-accent-300">
              +{todayBurned} kcal bruciate
            </span>
          )}
        </div>
        <div className="flex items-center gap-5">
          <ProgressRing
            value={consumedCalories}
            max={targetCal + todayBurned}
            size={130}
            color="#10b981"
            label={`${consumedCalories}`}
            sublabel={`/${targetCal + todayBurned} kcal`}
          />
          <div className="flex-1 space-y-3">
            <MacroBar icon={Beef} label="Proteine" value={consumedProtein} max={macroTargets.protein} color="bg-blue-500" unit="g" />
            <MacroBar icon={Wheat} label="Carbo" value={consumedCarbs} max={macroTargets.carbs} color="bg-accent-500" unit="g" />
            <MacroBar icon={Fish} label="Grassi" value={consumedFat} max={macroTargets.fat} color="bg-secondary-500" unit="g" />
          </div>
        </div>
      </div>

      {/* Quick navigation grid */}
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => onNavigate('diet')} className="card p-4 text-left active:scale-95 transition-transform" aria-label="Vai al piano alimentare">
          <Flame className="w-7 h-7 text-primary-600 mb-2" />
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{completedMeals}/{totalMeals}</p>
          <p className="text-xs text-gray-500">pasti completati</p>
        </button>
        <button onClick={() => onNavigate('gym')} className="card p-4 text-left active:scale-95 transition-transform" aria-label="Vai alla sezione palestra">
          <Dumbbell className="w-7 h-7 text-accent-600 mb-2" />
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{todayWorkouts.length}</p>
          <p className="text-xs text-gray-500">allenamenti oggi</p>
        </button>
        <button onClick={() => onNavigate('nutrition')} className="card p-4 text-left active:scale-95 transition-transform" aria-label="Vai alla sezione nutrizione">
          <Droplet className="w-7 h-7 text-blue-500 mb-2" />
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{todayWater}</p>
          <p className="text-xs text-gray-500">bicchieri / {waterTarget}</p>
          <ProgressBar value={todayWater} max={waterTarget} color="bg-blue-500" height={6} />
        </button>
        <button onClick={() => onNavigate('nutrition')} className="card p-4 text-left active:scale-95 transition-transform" aria-label="Vai agli integratori">
          <Pill className="w-7 h-7 text-accent-500 mb-2" />
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{takenSupps}</p>
          <p className="text-xs text-gray-500">integratori presi</p>
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
