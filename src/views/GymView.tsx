import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { todayISO, uid } from '@/lib/data';
import { getWorkoutCategory, type WorkoutDef } from '@/lib/exerciseLibrary';
import { ExercisePicker } from '@/components/ExercisePicker';
import { WorkoutPlanCard } from '@/components/WorkoutPlanCard';
import type { WorkoutLog, StrengthSet } from '@/types';
import { loadLeaderboard, type LeaderboardRow } from '@/lib/supabase';
import {
  Flame, Zap, Plus, Minus, Dumbbell, Trash2, Calendar,
  TrendingUp, Trophy, Medal,
} from 'lucide-react';

function calcWorkoutCalories(met: number, weightKg: number, minutes: number): number {
  return Math.round(met * weightKg * (minutes / 60));
}

export function GymView() {
  const { state, setState } = useApp();
  const { profile } = useAuth();
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutDef | null>(null);
  const [minutes, setMinutes] = useState(30);
  const [selectedStyle, setSelectedStyle] = useState('');
  const [sets, setSets] = useState<StrengthSet[]>([{ reps: 10, weight: 0 }]);
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [subView, setSubView] = useState<'log' | 'leaderboard'>('log');
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
  const [lbLoading, setLbLoading] = useState(false);

  const todayWorkouts = state.workoutLogs.filter((w) => w.date === todayISO());
  const todayBurned = todayWorkouts.reduce((s, w) => s + w.calories, 0);
  const totalBurned = state.workoutLogs.reduce((s, w) => s + w.calories, 0);

  useEffect(() => {
    if (subView === 'leaderboard' && leaderboard.length === 0 && !lbLoading) {
      setLbLoading(true);
      loadLeaderboard().then((data) => {
        setLeaderboard(data);
        setLbLoading(false);
      });
    }
  }, [subView]);

  function logWorkout() {
    if (!selectedWorkout) return;
    const wCat = getWorkoutCategory(selectedWorkout);

    let entry: WorkoutLog;
    if (wCat === 'strength') {
      const totalReps = sets.reduce((s, set) => s + set.reps, 0);
      const estMinutes = Math.max(5, Math.round(sets.length * 2 + totalReps * 0.1));
      entry = {
        id: uid(),
        date: selectedDate,
        activityName: selectedWorkout.name,
        category: 'strength',
        sets: sets.filter((s) => s.reps > 0),
        minutes: estMinutes,
        calories: calcWorkoutCalories(selectedWorkout.met, state.profile.weight, estMinutes),
        met: selectedWorkout.met,
      };
    } else if (wCat === 'time_style') {
      const styleLabel = selectedStyle || (selectedWorkout.styles?.[0] ?? '');
      entry = {
        id: uid(),
        date: selectedDate,
        activityName: `${selectedWorkout.name}${styleLabel ? ' - ' + styleLabel : ''}`,
        category: 'time_style',
        minutes,
        style: styleLabel,
        calories: calcWorkoutCalories(selectedWorkout.met, state.profile.weight, minutes),
        met: selectedWorkout.met,
      };
    } else {
      entry = {
        id: uid(),
        date: selectedDate,
        activityName: selectedWorkout.name,
        category: 'time_only',
        minutes,
        calories: calcWorkoutCalories(selectedWorkout.met, state.profile.weight, minutes),
        met: selectedWorkout.met,
      };
    }

    setState((prev) => ({ ...prev, workoutLogs: [...prev.workoutLogs, entry] }));
    setSelectedWorkout(null);
    setMinutes(30);
    setSelectedStyle('');
    setSets([{ reps: 10, weight: 0 }]);
  }

  function deleteWorkout(id: string) {
    setState((prev) => ({ ...prev, workoutLogs: prev.workoutLogs.filter((w) => w.id !== id) }));
  }

  function updateSet(index: number, field: 'reps' | 'weight', value: number) {
    setSets((prev) => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
  }

  function addSet() {
    setSets((prev) => [...prev, { reps: 10, weight: prev[prev.length - 1]?.weight ?? 0 }]);
  }

  function removeSet(index: number) {
    setSets((prev) => prev.filter((_, i) => i !== index));
  }

  const selectedCat = selectedWorkout ? getWorkoutCategory(selectedWorkout) : 'time_only';

  return (
    <div className="space-y-4">
      {/* Sub-view toggle */}
      <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
        <button
          onClick={() => setSubView('log')}
          className={`flex-1 py-2 rounded-lg font-medium text-sm flex items-center justify-center gap-1.5 transition-all ${
            subView === 'log' ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-gray-500'
          }`}
        >
          <Dumbbell className="w-4 h-4" /> Allenamenti
        </button>
        <button
          onClick={() => setSubView('leaderboard')}
          className={`flex-1 py-2 rounded-lg font-medium text-sm flex items-center justify-center gap-1.5 transition-all ${
            subView === 'leaderboard' ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-gray-500'
          }`}
        >
          <Trophy className="w-4 h-4" /> Classifiche
        </button>
      </div>

      {subView === 'leaderboard' ? (
        <LeaderboardView entries={leaderboard} loading={lbLoading} currentName={profile?.display_name || state.profile.name} />
      ) : (
        <>
          <div className="card p-4 flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center shrink-0">
              <Flame className="w-5 h-5 text-accent-600 dark:text-accent-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-500">Bruciate oggi con l'attivita</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">+{todayBurned} kcal</p>
            </div>
            <p className="text-[11px] text-gray-400 text-right max-w-[110px] leading-snug">Il fabbisogno giornaliero e nella sezione Corpo</p>
          </div>

          <WorkoutPlanCard />

          {/* Today's workouts */}
          {todayWorkouts.length > 0 && (
            <div className="card p-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-accent-600" /> Allenamenti di oggi
              </h3>
              <div className="space-y-2">
                {todayWorkouts.map((w) => (
                  <div key={w.id} className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{w.activityName}</p>
                      <p className="text-xs text-gray-500">
                        {w.category === 'strength' && w.sets
                          ? `${w.sets.length} serie: ${w.sets.map(s => `${s.reps}x${s.weight}kg`).join(', ')}`
                          : `${w.minutes} min${w.style ? ' - ' + w.style : ''} - ${w.calories} kcal`}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteWorkout(w.id)}
                      className="p-2 rounded-lg text-gray-400 hover:text-error-600 transition-colors shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <ExercisePicker
            selected={selectedWorkout}
            onSelect={(w) => { setSelectedWorkout(w); setSelectedStyle(w.styles?.[0] ?? ''); }}
          />

          {/* Workout logger */}
          {selectedWorkout && (
            <div className="card p-4 border-2 border-accent-300 dark:border-accent-700">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">{selectedWorkout.emoji}</span>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{selectedWorkout.name}</h3>
                  <p className="text-xs text-gray-500">
                    {selectedWorkout.category} - {selectedCat === 'strength' ? 'Serie e Ripetizioni' : selectedCat === 'time_style' ? 'Durata e Stile' : 'Solo Durata'}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {/* Strength: sets/reps */}
                {selectedCat === 'strength' && (
                  <div>
                    <label className="label">Serie e Ripetizioni</label>
                    <div className="space-y-2">
                      {sets.map((set, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 w-12">Serie {i + 1}</span>
                          <input
                            type="number"
                            className="input flex-1"
                            placeholder="Rep"
                            value={set.reps || ''}
                            onChange={(e) => updateSet(i, 'reps', +e.target.value)}
                            min={0}
                          />
                          <span className="text-xs text-gray-400">x</span>
                          <input
                            type="number"
                            step="0.5"
                            className="input flex-1"
                            placeholder="kg"
                            value={set.weight || ''}
                            onChange={(e) => updateSet(i, 'weight', +e.target.value)}
                            min={0}
                          />
                          {sets.length > 1 && (
                            <button onClick={() => removeSet(i)} className="p-1.5 text-gray-400 hover:text-error-600">
                              <Minus className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                      <button onClick={addSet} className="btn-secondary w-full flex items-center justify-center gap-1 text-sm">
                        <Plus className="w-4 h-4" /> Aggiungi Serie
                      </button>
                    </div>
                  </div>
                )}

                {/* Time + Style */}
                {selectedCat === 'time_style' && selectedWorkout.styles && (
                  <div>
                    <label className="label">Stile</label>
                    <select
                      className="input"
                      value={selectedStyle}
                      onChange={(e) => setSelectedStyle(e.target.value)}
                    >
                      {selectedWorkout.styles.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Time input (for time_only and time_style) */}
                {selectedCat !== 'strength' && (
                  <div>
                    <label className="label">Durata (minuti)</label>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setMinutes((m) => Math.max(5, m - 5))}
                        className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="text-2xl font-bold text-gray-900 dark:text-white flex-1 text-center">{minutes}</span>
                      <button
                        onClick={() => setMinutes((m) => Math.min(300, m + 5))}
                        className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                <div>
                  <label className="label">Data</label>
                  <input
                    type="date"
                    className="input"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-accent-50 to-primary-50 dark:from-accent-900/20 dark:to-primary-900/20">
                  <div>
                    <p className="text-xs text-gray-500">Calorie stimate</p>
                    <p className="text-2xl font-bold text-accent-600 dark:text-accent-400">
                      {selectedCat === 'strength'
                        ? calcWorkoutCalories(selectedWorkout.met, state.profile.weight, Math.max(5, Math.round(sets.length * 2 + sets.reduce((s, set) => s + set.reps, 0) * 0.1)))
                        : calcWorkoutCalories(selectedWorkout.met, state.profile.weight, minutes)} kcal
                    </p>
                  </div>
                  <Zap className="w-8 h-8 text-accent-400" />
                </div>

                <div className="flex gap-2">
                  <button onClick={logWorkout} className="btn-primary flex-1">
                    <Plus className="w-4 h-4" /> Registra
                  </button>
                  <button onClick={() => setSelectedWorkout(null)} className="btn-secondary">Annulla</button>
                </div>
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="card p-4">
              <TrendingUp className="w-6 h-6 text-primary-600 mb-1" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{state.workoutLogs.length}</p>
              <p className="text-xs text-gray-500">allenamenti totali</p>
            </div>
            <div className="card p-4">
              <Flame className="w-6 h-6 text-orange-500 mb-1" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalBurned}</p>
              <p className="text-xs text-gray-500">kcal bruciate in totale</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function LeaderboardView({ entries, loading, currentName }: {
  entries: LeaderboardRow[];
  loading: boolean;
  currentName: string;
}) {
  if (loading) {
    return (
      <div className="card p-8 text-center">
        <Trophy className="w-10 h-10 text-gray-300 dark:text-gray-700 mx-auto mb-2 animate-pulse" />
        <p className="text-gray-500">Caricamento classifiche...</p>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="card p-8 text-center">
        <Trophy className="w-10 h-10 text-gray-300 dark:text-gray-700 mx-auto mb-2" />
        <p className="text-gray-500">Nessun dato disponibile. Registra i tuoi allenamenti per apparire in classifica!</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="w-5 h-5 text-warning-500" />
          <h2 className="section-title">Classifica Globale</h2>
        </div>
        <p className="text-xs text-gray-500 mb-3">Basata sulle calorie totali bruciate</p>

        <div className="space-y-2">
          {entries.slice(0, 20).map((entry, i) => {
            const isMe = entry.display_name === currentName;
            return (
              <div
                key={i}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                  isMe
                    ? 'bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800'
                    : 'bg-gray-50 dark:bg-gray-800'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                  i === 0 ? 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400' :
                  i === 1 ? 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300' :
                  i === 2 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                  'bg-gray-100 text-gray-500 dark:bg-gray-700'
                }`}>
                  {i < 3 ? <Medal className="w-4 h-4" /> : i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${isMe ? 'text-primary-600 dark:text-primary-400' : 'text-gray-900 dark:text-white'}`}>
                    {entry.display_name} {isMe && '(Tu)'}
                  </p>
                  <p className="text-xs text-gray-500">{entry.total_workouts} allenamenti</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-accent-600 dark:text-accent-400">{entry.total_calories}</p>
                  <p className="text-[10px] text-gray-400">kcal</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
