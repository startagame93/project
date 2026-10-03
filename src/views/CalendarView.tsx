import { useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { localISO } from '@/lib/data';
import {
  ChevronLeft, ChevronRight, Check, Dumbbell, Droplet, Salad, CalendarClock, Flame,
} from 'lucide-react';

const WEEKDAYS = ['L', 'M', 'M', 'G', 'V', 'S', 'D'];
const MONTHS = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];

function weekdayIdx(d: Date) {
  return (d.getDay() + 6) % 7;
}

export function CalendarView() {
  const { state, setState } = useApp();
  const today = localISO(new Date());
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selected, setSelected] = useState(today);

  const activeWeek = state.weeks.find((w) => w.id === state.activeWeekId) ?? state.weeks[0];
  const history = state.mealHistory ?? {};
  const checks = state.dayChecks ?? {};

  const workoutsByDate = useMemo(() => {
    const map: Record<string, typeof state.workoutLogs> = {};
    for (const w of state.workoutLogs ?? []) (map[w.date] ??= []).push(w);
    return map;
  }, [state.workoutLogs]);

  const waterByDate = useMemo(() => {
    const map: Record<string, number> = {};
    for (const w of state.waterLogs ?? []) map[w.date] = w.glasses;
    return map;
  }, [state.waterLogs]);

  const cells = useMemo(() => {
    const first = weekdayIdx(cursor);
    const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    const out: (string | null)[] = Array(first).fill(null);
    for (let i = 1; i <= daysInMonth; i++) out.push(localISO(new Date(cursor.getFullYear(), cursor.getMonth(), i)));
    while (out.length % 7) out.push(null);
    return out;
  }, [cursor]);

  function plannedFor(iso: string) {
    const [y, m, d] = iso.split('-').map(Number);
    const day = activeWeek?.days[weekdayIdx(new Date(y, m - 1, d))];
    return (day?.meals ?? []).filter((meal) => meal.foods.length > 0 || meal.calories > 0);
  }

  function plannedWorkoutFor(iso: string) {
    const [y, m, d] = iso.split('-').map(Number);
    return state.workoutPlan?.days.find((pd) => pd.day === weekdayIdx(new Date(y, m - 1, d))) ?? null;
  }

  function shiftMonth(delta: number) {
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + delta, 1));
  }

  function goToday() {
    const d = new Date();
    setCursor(new Date(d.getFullYear(), d.getMonth(), 1));
    setSelected(today);
  }

  function toggleCheck(iso: string) {
    setState((prev) => {
      const next = { ...(prev.dayChecks ?? {}) };
      if (next[iso]) delete next[iso];
      else next[iso] = true;
      return { ...prev, dayChecks: next };
    });
  }

  const sel = {
    eaten: history[selected] ?? [],
    workouts: workoutsByDate[selected] ?? [],
    water: waterByDate[selected] ?? 0,
    planned: selected >= today ? plannedFor(selected) : [],
    plannedWorkout: selected >= today ? plannedWorkoutFor(selected) : null,
    done: !!checks[selected],
  };
  const eatenKcal = sel.eaten.reduce((s, m) => s + m.calories, 0);
  const burnedKcal = sel.workouts.reduce((s, w) => s + w.calories, 0);
  const isFuture = selected > today;
  const [sy, sm, sd] = selected.split('-').map(Number);
  const selLabel = new Date(sy, sm - 1, sd).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="space-y-4 pb-16">
      <div className="card p-4">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => shiftMonth(-1)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" aria-label="Mese precedente">
            <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
          <button onClick={goToday} className="text-center group" aria-label="Torna a oggi">
            <p className="text-base font-bold text-gray-900 dark:text-white">{MONTHS[cursor.getMonth()]} {cursor.getFullYear()}</p>
            <p className="text-[11px] text-primary-600 dark:text-primary-400 group-hover:underline">Vai a oggi</p>
          </button>
          <button onClick={() => shiftMonth(1)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" aria-label="Mese successivo">
            <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-1">
          {WEEKDAYS.map((d, i) => (
            <div key={i} className="text-center text-[11px] font-semibold text-gray-400 py-1">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((iso, i) => {
            if (!iso) return <div key={i} />;
            const isToday = iso === today;
            const isSel = iso === selected;
            const hasMeals = (history[iso]?.length ?? 0) > 0;
            const hasWorkout = (workoutsByDate[iso]?.length ?? 0) > 0;
            const hasWater = (waterByDate[iso] ?? 0) > 0;
            const done = !!checks[iso];
            return (
              <button
                key={iso}
                onClick={() => setSelected(iso)}
                className={`relative aspect-square rounded-xl flex flex-col items-center justify-center text-sm transition-all duration-200 ${
                  isSel
                    ? 'bg-primary-600 text-white shadow-md scale-105'
                    : done
                      ? 'bg-success-100 dark:bg-success-900/30 text-success-800 dark:text-success-300'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200'
                } ${isToday && !isSel ? 'ring-2 ring-primary-500' : ''}`}
                aria-label={`${iso}${done ? ', completato' : ''}`}
                aria-pressed={isSel}
              >
                <span className={`font-medium ${iso > today && !isSel ? 'opacity-60' : ''}`}>{Number(iso.slice(8))}</span>
                <span className="flex gap-0.5 h-1.5 mt-0.5">
                  {hasMeals && <span className={`w-1.5 h-1.5 rounded-full ${isSel ? 'bg-white' : 'bg-primary-500'}`} />}
                  {hasWorkout && <span className={`w-1.5 h-1.5 rounded-full ${isSel ? 'bg-white' : 'bg-accent-500'}`} />}
                  {hasWater && <span className={`w-1.5 h-1.5 rounded-full ${isSel ? 'bg-white' : 'bg-blue-500'}`} />}
                </span>
                {done && !isSel && <Check className="absolute top-0.5 right-0.5 w-3 h-3 text-success-600" />}
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-center gap-4 mt-4 text-[11px] text-gray-500">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary-500" />Pasti</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-accent-500" />Allenamento</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" />Acqua</span>
        </div>
      </div>

      <div className="card p-4 animate-fade-in" key={selected}>
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-400">{selected === today ? 'Oggi' : isFuture ? 'In programma' : 'Storico'}</p>
            <h2 className="text-base font-bold text-gray-900 dark:text-white capitalize">{selLabel}</h2>
          </div>
          {!isFuture && (
            <button
              onClick={() => toggleCheck(selected)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                sel.done ? 'bg-success-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
              aria-pressed={sel.done}
            >
              <Check className="w-4 h-4" />
              {sel.done ? 'Completato' : 'Segna completato'}
            </button>
          )}
        </div>

        {!isFuture && (
          <div className="grid grid-cols-3 gap-2 mb-4">
            <Stat icon={Salad} label="Mangiate" value={`${Math.round(eatenKcal)} kcal`} />
            <Stat icon={Flame} label="Bruciate" value={`${Math.round(burnedKcal)} kcal`} />
            <Stat icon={Droplet} label="Acqua" value={`${sel.water} bicch.`} />
          </div>
        )}

        {sel.eaten.length > 0 && (
          <Section icon={Salad} title="Pasti consumati">
            {sel.eaten.map((m) => (
              <Row key={m.id} left={`${m.type} - ${m.name}`} right={`${Math.round(m.calories)} kcal`} />
            ))}
          </Section>
        )}

        {sel.workouts.length > 0 && (
          <Section icon={Dumbbell} title="Allenamenti">
            {sel.workouts.map((w) => (
              <Row key={w.id} left={`${w.activityName}${w.sets ? ` (${w.sets})` : w.minutes ? ` (${w.minutes} min)` : ''}`} right={`${Math.round(w.calories)} kcal`} />
            ))}
          </Section>
        )}

        {sel.planned.length > 0 && (
          <Section icon={CalendarClock} title="Pianificato">
            {sel.planned.map((m) => (
              <Row key={m.id} left={`${m.type} - ${m.name || m.foods.slice(0, 2).join(', ')}`} right={`${Math.round(m.calories)} kcal`} muted={m.completed && selected === today} />
            ))}
          </Section>
        )}

        {sel.plannedWorkout && (
          <Section icon={Dumbbell} title={`Scheda: ${sel.plannedWorkout.title}`}>
            {sel.plannedWorkout.exercises.map((ex, i) => (
              <Row key={i} left={ex.name} right={`${ex.sets} x ${ex.reps}`} />
            ))}
          </Section>
        )}

        {sel.eaten.length === 0 && sel.workouts.length === 0 && sel.planned.length === 0 && !sel.plannedWorkout && (
          <p className="text-sm text-gray-500 text-center py-6">
            {isFuture ? 'Niente in programma per questo giorno.' : 'Nessuna attivita registrata in questo giorno.'}
          </p>
        )}
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Salad; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-2.5 text-center">
      <Icon className="w-4 h-4 mx-auto text-primary-600 dark:text-primary-400 mb-1" />
      <p className="text-sm font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="text-[10px] text-gray-500">{label}</p>
    </div>
  );
}

function Section({ icon: Icon, title, children }: { icon: typeof Salad; title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4 last:mb-0">
      <p className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
        <Icon className="w-3.5 h-3.5" />{title}
      </p>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function Row({ left, right, muted }: { left: string; right: string; muted?: boolean }) {
  return (
    <div className={`flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 text-sm ${muted ? 'opacity-50 line-through' : ''}`}>
      <span className="text-gray-800 dark:text-gray-200 truncate">{left}</span>
      <span className="text-gray-500 shrink-0">{right}</span>
    </div>
  );
}
