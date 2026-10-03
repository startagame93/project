import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Modal } from '@/components/Modal';
import { PlanImportPanel } from '@/components/PlanImportPanel';
import { todayISO, uid } from '@/lib/data';
import type { PlanExercise, WorkoutLog } from '@/types';
import { ClipboardList, FileUp, Check, Plus, Trash2 } from 'lucide-react';

const DAY_SHORT = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];
const PLAN_MET = 5;

export function WorkoutPlanCard() {
  const { state, setState } = useApp();
  const plan = state.workoutPlan;
  const [day, setDay] = useState((new Date().getDay() + 6) % 7);
  const [showImport, setShowImport] = useState(false);
  const [logged, setLogged] = useState<Set<string>>(new Set());

  const current = plan?.days.find((d) => d.day === day);

  function logExercise(ex: PlanExercise, key: string) {
    const reps = parseInt(ex.reps, 10) || 10;
    const sets = Array.from({ length: ex.sets }, () => ({ reps, weight: ex.weight ?? 0 }));
    const minutes = Math.max(5, Math.round(sets.length * 2 + reps * sets.length * 0.1));
    const entry: WorkoutLog = {
      id: uid(),
      date: todayISO(),
      activityName: ex.name,
      category: 'strength',
      sets,
      minutes,
      calories: Math.round(PLAN_MET * state.profile.weight * (minutes / 60)),
      met: PLAN_MET,
    };
    setState((prev) => ({ ...prev, workoutLogs: [...prev.workoutLogs, entry] }));
    setLogged((prev) => new Set(prev).add(key));
  }

  function removePlan() {
    if (!window.confirm('Rimuovere la scheda di allenamento importata?')) return;
    setState((prev) => ({ ...prev, workoutPlan: null }));
  }

  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 mb-3">
        <ClipboardList className="w-5 h-5 text-primary-600 dark:text-primary-400" />
        <h3 className="flex-1 text-sm font-semibold text-gray-900 dark:text-white truncate">
          {plan ? plan.title : 'La tua scheda'}
        </h3>
        <button onClick={() => setShowImport(true)} className="btn-ghost !px-2.5 !py-1.5 text-xs" aria-label="Importa scheda incollando il testo">
          <FileUp className="w-4 h-4" /> {plan ? 'Sostituisci' : 'Incolla scheda'}
        </button>
        {plan && (
          <button onClick={removePlan} className="p-1.5 rounded-lg text-gray-400 hover:text-error-600 transition-colors" aria-label="Rimuovi scheda">
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {!plan ? (
        <p className="text-sm text-gray-500">Copia e incolla il testo della tua scheda: gli esercizi verranno distribuiti automaticamente sui giorni della settimana.</p>
      ) : (
        <>
          <div className="grid grid-cols-7 gap-1 mb-3">
            {DAY_SHORT.map((label, i) => {
              const has = plan.days.some((d) => d.day === i);
              const active = i === day;
              return (
                <button
                  key={label}
                  onClick={() => setDay(i)}
                  className={`py-1.5 rounded-lg text-xs font-medium transition-all ${
                    active ? 'bg-primary-600 text-white' : has ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300' : 'text-gray-400'
                  }`}
                  aria-pressed={active}
                >
                  {label}
                </button>
              );
            })}
          </div>
          {current ? (
            <div className="space-y-1.5 animate-fade-in" key={day}>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">{current.title}</p>
              {current.exercises.map((ex, i) => {
                const key = `${day}-${i}`;
                const done = logged.has(key);
                return (
                  <div key={key} className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{ex.name}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {ex.sets} x {ex.reps}{ex.weight ? ` - ${ex.weight} kg` : ''}{ex.notes ? ` - ${ex.notes}` : ''}
                      </p>
                    </div>
                    <button
                      onClick={() => logExercise(ex, key)}
                      disabled={done}
                      className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                        done ? 'bg-success-600 text-white' : 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 hover:scale-105'
                      }`}
                      aria-label={done ? `${ex.name} registrato` : `Registra ${ex.name} oggi`}
                    >
                      {done ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">Giorno di riposo.</p>
          )}
        </>
      )}

      <Modal open={showImport} onClose={() => setShowImport(false)} title="Importa scheda (copia e incolla)" icon={FileUp}>
        <PlanImportPanel onImported={(o) => { if (o?.kind === 'workout') setShowImport(false); }} />
      </Modal>
    </div>
  );
}
