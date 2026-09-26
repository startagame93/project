import { useApp } from '@/context/AppContext';
import { calcBMR, calcTDEE, calcTargetCalories, calcMacroTargets, todayISO } from '@/lib/data';
import { ProgressRing } from '@/components/ProgressRing';
import { ProgressBar } from '@/components/ProgressBar';
import { Droplet, Flame, Beef, Wheat, Fish, Dumbbell, Pill, TrendingUp, Bell } from 'lucide-react';
import { SUPPLEMENT_TYPES, MICRONUTRIENT_TARGETS, MEAL_TYPES } from '@/types';

export function Dashboard({ onNavigate }: { onNavigate: (tab: 'diet' | 'nutrition' | 'body' | 'settings') => void }) {
  const { state } = useApp();
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

  const todayMicro = state.micronutrientLogs.find((m) => m.date === today);

  const bmr = Math.round(calcBMR(state.profile));
  const tdee = calcTDEE(state.profile);

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
