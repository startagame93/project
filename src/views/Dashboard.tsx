import type { ReactNode } from 'react';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { calcTargetCalories, calcMacroTargets, todayISO } from '@/lib/data';
import { ProgressRing } from '@/components/ProgressRing';
import { ProgressBar } from '@/components/ProgressBar';
import { WeeklyTrendsCard } from '@/components/WeeklyTrendsCard';
import { Droplet, Flame, Beef, Wheat, Fish, Pill, Bell, Dumbbell, ChevronRight } from 'lucide-react';
import { MICRONUTRIENT_TARGETS } from '@/types';

export function Dashboard({ onNavigate }: { onNavigate: (tab: 'diet' | 'nutrition' | 'body' | 'gym' | 'settings') => void }) {
  const { state } = useApp();
  const { displayName: authName } = useAuth();
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
  const hasDietToday = todayMeals.length > 0;
  const lowMicros = hasDietToday && todayMicro
    ? microKeys.filter((k) => todayMicro[k] < MICRONUTRIENT_TARGETS[k].min)
    : [];

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Buongiorno';
    if (h < 18) return 'Buon pomeriggio';
    return 'Buonasera';
  })();

  return (
    <div className="space-y-5">
      <header className="card relative overflow-hidden p-5">
        <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-primary-500/25 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-14 left-1/4 h-36 w-36 rounded-full bg-accent-500/20 blur-3xl" aria-hidden="true" />
        <div className="relative flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-700 dark:text-primary-300">{greeting}</p>
            <h1 className="mt-1 truncate text-2xl font-bold text-gray-900 dark:text-white">{displayName}</h1>
          </div>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-500/15 text-primary-700 ring-1 ring-inset ring-primary-500/25 dark:text-primary-300 dark:ring-primary-400/30">
            <Flame className="h-6 w-6" strokeWidth={1.75} />
          </div>
        </div>
      </header>

      <section className="card p-5" aria-labelledby="calorie-title">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 id="calorie-title" className="section-title">Calorie di oggi</h2>
          {todayBurned > 0 && (
            <span className="chip bg-accent-500/15 text-accent-700 dark:text-accent-300">
              +{todayBurned} kcal bruciate
            </span>
          )}
        </div>
        <div className="flex items-center gap-5">
          <ProgressRing
            value={consumedCalories}
            max={targetCal + todayBurned}
            size={132}
            color="#2f7fff"
            label={`${consumedCalories}`}
            sublabel={`/${targetCal + todayBurned} kcal`}
          />
          <div className="flex-1 space-y-4">
            <MacroBar icon={Beef} label="Proteine" value={consumedProtein} max={macroTargets.protein} color="bg-primary-500" unit="g" />
            <MacroBar icon={Wheat} label="Carboidrati" value={consumedCarbs} max={macroTargets.carbs} color="bg-accent-500" unit="g" />
            <MacroBar icon={Fish} label="Grassi" value={consumedFat} max={macroTargets.fat} color="bg-secondary-500" unit="g" />
          </div>
        </div>
      </section>

      <WeeklyTrendsCard />

      <section className="grid grid-cols-2 gap-4" aria-label="Riepilogo di oggi">
        <DashboardTile
          icon={Flame}
          tone="primary"
          value={`${completedMeals}/${totalMeals}`}
          label="Pasti completati"
          ariaLabel="Vai al piano alimentare"
          onClick={() => onNavigate('diet')}
        />
        <DashboardTile
          icon={Dumbbell}
          tone="accent"
          value={`${todayWorkouts.length}`}
          label="Allenamenti oggi"
          ariaLabel="Vai alla sezione palestra"
          onClick={() => onNavigate('gym')}
        />
        <DashboardTile
          icon={Droplet}
          tone="secondary"
          value={`${todayWater}/${waterTarget}`}
          label="Bicchieri d'acqua"
          ariaLabel="Vai alla sezione nutrizione"
          onClick={() => onNavigate('nutrition')}
          footer={<ProgressBar value={todayWater} max={waterTarget} color="bg-secondary-500" height={5} />}
        />
        <DashboardTile
          icon={Pill}
          tone="accent"
          value={`${takenSupps}`}
          label="Integratori presi"
          ariaLabel="Vai agli integratori"
          onClick={() => onNavigate('nutrition')}
        />
      </section>

      {lowMicros.length > 0 && (
        <section className="card border-warning-500/40 p-5">
          <div className="mb-2 flex items-center gap-2">
            <Bell className="h-5 w-5 text-warning-600 dark:text-warning-400" strokeWidth={1.75} />
            <h3 className="font-semibold text-warning-800 dark:text-warning-300">Carenze rilevate</h3>
          </div>
          <p className="text-sm text-warning-800 dark:text-warning-300">
            Assunzione bassa di: {lowMicros.map((k) => MICRONUTRIENT_TARGETS[k].label).join(', ')}
          </p>
          <button
            onClick={() => onNavigate('nutrition')}
            className="tap-press mt-3 inline-flex items-center gap-1 text-sm font-semibold text-warning-800 hover:underline dark:text-warning-300"
          >
            Registra assunzione
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </section>
      )}
    </div>
  );
}

const TONE_CLASSES = {
  primary: 'bg-primary-500/15 text-primary-700 ring-primary-500/25 dark:text-primary-300 dark:ring-primary-400/30',
  accent: 'bg-accent-500/15 text-accent-700 ring-accent-500/25 dark:text-accent-300 dark:ring-accent-400/30',
  secondary: 'bg-secondary-500/15 text-secondary-700 ring-secondary-500/25 dark:text-secondary-300 dark:ring-secondary-400/30',
} as const;

function DashboardTile({ icon: Icon, tone, value, label, ariaLabel, onClick, footer }: {
  icon: typeof Flame;
  tone: keyof typeof TONE_CLASSES;
  value: string;
  label: string;
  ariaLabel: string;
  onClick: () => void;
  footer?: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      className="card tap-press flex flex-col gap-3 p-4 text-left transition-shadow hover:shadow-lg"
    >
      <span className={`flex h-10 w-10 items-center justify-center rounded-xl ring-1 ring-inset ${TONE_CLASSES[tone]}`}>
        <Icon className="h-5 w-5" strokeWidth={1.75} />
      </span>
      <span>
        <span className="block text-2xl font-bold tracking-tight text-gray-900 dark:text-white">{value}</span>
        <span className="mt-0.5 block text-xs font-medium text-gray-500 dark:text-gray-400">{label}</span>
      </span>
      {footer}
    </button>
  );
}

function MacroBar({ icon: Icon, label, value, max, color, unit }: {
  icon: typeof Beef; label: string; value: number; max: number; color: string; unit: string;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
          <Icon className="h-4 w-4" strokeWidth={1.75} /> {label}
        </span>
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">{value}/{max}{unit}</span>
      </div>
      <ProgressBar value={value} max={max} color={color} height={6} />
    </div>
  );
}
