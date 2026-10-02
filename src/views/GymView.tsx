import { useState, useMemo, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { calcBMR, calcTDEE, calcTargetCalories, todayISO, uid } from '@/lib/data';
import { ACTIVITY_LEVELS, type ActivityLevel, type WorkoutLog, type WorkoutCategory, type StrengthSet } from '@/types';
import { loadLeaderboard, type LeaderboardRow } from '@/lib/supabase';
import {
  Activity, Flame, Zap, Plus, Minus, Dumbbell, Trash2, Calendar,
  TrendingUp, ChevronDown, ChevronUp, Search, Trophy, Medal, Timer,
} from 'lucide-react';

const WORKOUT_CATEGORIES: { label: string; emoji: string }[] = [
  { label: 'Cardio', emoji: '🏃' },
  { label: 'Forza', emoji: '🏋️' },
  { label: 'Sport', emoji: '⚽' },
  { label: 'Acqua', emoji: '🏊' },
  { label: 'Combattimento', emoji: '🥊' },
  { label: 'Mind & Body', emoji: '🧘' },
  { label: 'Outdoor', emoji: '🏔️' },
  { label: 'Danza', emoji: '💃' },
  { label: 'Ciclismo', emoji: '🚴' },
  { label: 'Atletica', emoji: '🤸' },
];

// category -> workoutCategory mapping
const CATEGORY_TYPE: Record<string, WorkoutCategory> = {
  'Forza': 'strength',
  'Combattimento': 'strength',
  'Acqua': 'time_style',
};

const SWIM_STYLES = ['Stile Libero', 'Dorso', 'Rana', 'Delfino', 'Farfalla', 'Misti'];
const DANCE_STYLES = ['Standard', 'Latino', 'Contemporaneo', 'Hip Hop', 'Classico'];

interface WorkoutDef {
  name: string;
  category: string;
  met: number;
  emoji: string;
  styles?: string[];
}

const WORKOUT_DATABASE: WorkoutDef[] = [
  // Cardio - time_only
  { name: 'Camminata veloce', category: 'Cardio', met: 4.3, emoji: '🚶' },
  { name: 'Corsa (8 km/h)', category: 'Cardio', met: 8.0, emoji: '🏃' },
  { name: 'Corsa (10 km/h)', category: 'Cardio', met: 9.8, emoji: '🏃' },
  { name: 'Corsa (12 km/h)', category: 'Cardio', met: 11.5, emoji: '🏃' },
  { name: 'Corsa in salita', category: 'Cardio', met: 12.0, emoji: '⛰️' },
  { name: 'Tapis roulant', category: 'Cardio', met: 7.0, emoji: '🏃' },
  { name: 'Ellittica', category: 'Cardio', met: 6.5, emoji: '🏃' },
  { name: 'Step machine', category: 'Cardio', met: 7.0, emoji: '🪜' },
  { name: 'Saltelli alla corda', category: 'Cardio', met: 11.0, emoji: '🪢' },
  { name: 'Burpees', category: 'Cardio', met: 10.0, emoji: '🔥' },
  { name: 'HIIT', category: 'Cardio', met: 10.0, emoji: '⚡' },
  { name: 'CrossFit', category: 'Cardio', met: 10.5, emoji: '🔥' },
  { name: 'Circuit training', category: 'Cardio', met: 8.0, emoji: '🔄' },

  // Forza - strength (sets/reps)
  { name: 'Squat', category: 'Forza', met: 5.0, emoji: '🏋️' },
  { name: 'Stacchi', category: 'Forza', met: 6.0, emoji: '🏋️' },
  { name: 'Panca Piana', category: 'Forza', met: 5.0, emoji: '🏋️' },
  { name: 'Military Press', category: 'Forza', met: 5.0, emoji: '🏋️' },
  { name: 'Rematore', category: 'Forza', met: 5.5, emoji: '🏋️' },
  { name: 'Trazioni (Sbarra)', category: 'Forza', met: 7.0, emoji: '💪' },
  { name: 'Flessioni', category: 'Forza', met: 7.0, emoji: '🤸' },
  { name: 'Addominali', category: 'Forza', met: 4.0, emoji: '🤸' },
  { name: 'Curl Bicipiti', category: 'Forza', met: 4.0, emoji: '💪' },
  { name: 'Pushdown Tricipiti', category: 'Forza', met: 4.0, emoji: '💪' },
  { name: 'Leg Press', category: 'Forza', met: 5.0, emoji: '🏋️' },
  { name: 'Affondi', category: 'Forza', met: 5.5, emoji: '🤸' },
  { name: 'Hip Thrust', category: 'Forza', met: 5.0, emoji: '🏋️' },
  { name: 'Lateral Raises', category: 'Forza', met: 4.0, emoji: '💪' },
  { name: 'Lat Machine', category: 'Forza', met: 5.0, emoji: '🏋️' },
  { name: 'Chest Press', category: 'Forza', met: 5.0, emoji: '🏋️' },
  { name: 'Dip', category: 'Forza', met: 7.0, emoji: '🤸' },
  { name: 'Hyperextension', category: 'Forza', met: 4.0, emoji: '🤸' },
  { name: 'Plank', category: 'Forza', met: 3.5, emoji: '🤸' },
  { name: 'Russian Twist', category: 'Forza', met: 4.5, emoji: '🤸' },
  { name: 'Calf Raises', category: 'Forza', met: 3.5, emoji: '🤸' },
  { name: 'Kettlebell Swing', category: 'Forza', met: 9.0, emoji: '🪨' },
  { name: 'Deadlift Rumeno', category: 'Forza', met: 6.0, emoji: '🏋️' },
  { name: 'Squat Bulgaro', category: 'Forza', met: 6.0, emoji: '🤸' },
  { name: 'Pull-up', category: 'Forza', met: 7.0, emoji: '💪' },
  { name: 'Chin-up', category: 'Forza', met: 7.0, emoji: '💪' },
  { name: 'Overhead Squat', category: 'Forza', met: 6.0, emoji: '🏋️' },
  { name: 'Front Squat', category: 'Forza', met: 6.0, emoji: '🏋️' },
  { name: 'Bench Dip', category: 'Forza', met: 4.5, emoji: '🤸' },
  { name: 'Crunch', category: 'Forza', met: 4.0, emoji: '🤸' },
  { name: 'Leg Extension', category: 'Forza', met: 4.0, emoji: '🏋️' },
  { name: 'Leg Curl', category: 'Forza', met: 4.0, emoji: '🏋️' },
  { name: 'Preacher Curl', category: 'Forza', met: 4.0, emoji: '💪' },
  { name: 'Skull Crusher', category: 'Forza', met: 4.0, emoji: '💪' },
  { name: 'Face Pull', category: 'Forza', met: 4.0, emoji: '💪' },
  { name: 'Hammer Curl', category: 'Forza', met: 4.0, emoji: '💪' },
  { name: 'Arnold Press', category: 'Forza', met: 5.0, emoji: '💪' },
  { name: 'Pec Deck', category: 'Forza', met: 4.0, emoji: '🏋️' },
  { name: 'Ab Wheel', category: 'Forza', met: 5.0, emoji: '🤸' },

  // Sport - time_only
  { name: 'Calcio', category: 'Sport', met: 7.0, emoji: '⚽' },
  { name: 'Calcetto', category: 'Sport', met: 6.0, emoji: '⚽' },
  { name: 'Basket', category: 'Sport', met: 6.5, emoji: '🏀' },
  { name: 'Volley', category: 'Sport', met: 6.0, emoji: '🏐' },
  { name: 'Tennis (singolare)', category: 'Sport', met: 8.0, emoji: '🎾' },
  { name: 'Tennis (doppio)', category: 'Sport', met: 6.0, emoji: '🎾' },
  { name: 'Padel', category: 'Sport', met: 6.5, emoji: '🎾' },
  { name: 'Rugby', category: 'Sport', met: 10.0, emoji: '🏉' },
  { name: 'Football americano', category: 'Sport', met: 8.0, emoji: '🏈' },
  { name: 'Hockey su prato', category: 'Sport', met: 7.0, emoji: '🏒' },
  { name: 'Baseball', category: 'Sport', met: 5.0, emoji: '⚾' },
  { name: 'Golf', category: 'Sport', met: 4.3, emoji: '⛳' },
  { name: 'Pallamano', category: 'Sport', met: 8.0, emoji: '🤾' },
  { name: 'Ping pong', category: 'Sport', met: 4.0, emoji: '🏓' },
  { name: 'Badminton', category: 'Sport', met: 5.5, emoji: '🏸' },
  { name: 'Squash', category: 'Sport', met: 9.0, emoji: '🎾' },

  // Acqua - time_style
  { name: 'Nuoto', category: 'Acqua', met: 8.0, emoji: '🏊', styles: SWIM_STYLES },
  { name: 'Aquagym', category: 'Acqua', met: 5.0, emoji: '💧' },
  { name: 'Surf', category: 'Acqua', met: 6.0, emoji: '🏄' },
  { name: 'Windsurf', category: 'Acqua', met: 6.0, emoji: '🏄' },
  { name: 'Kitesurf', category: 'Acqua', met: 7.0, emoji: '🪁' },
  { name: 'SUP (paddleboard)', category: 'Acqua', met: 6.0, emoji: '🚣' },
  { name: 'Canottaggio', category: 'Acqua', met: 8.5, emoji: '🚣' },
  { name: 'Kayak', category: 'Acqua', met: 7.0, emoji: '🛶' },
  { name: 'Rafting', category: 'Acqua', met: 7.0, emoji: '🌊' },
  { name: 'Subacquea', category: 'Acqua', met: 7.0, emoji: '🤿' },
  { name: 'Pallanuoto', category: 'Acqua', met: 10.0, emoji: '💧' },
  { name: 'Tuffi', category: 'Acqua', met: 5.0, emoji: '🤿' },
  { name: 'Acqua jogging', category: 'Acqua', met: 8.0, emoji: '💧' },

  // Combattimento - strength
  { name: 'Boxe', category: 'Combattimento', met: 9.0, emoji: '🥊' },
  { name: 'MMA', category: 'Combattimento', met: 10.0, emoji: '🥋' },
  { name: 'Judo', category: 'Combattimento', met: 9.0, emoji: '🥋' },
  { name: 'Karate', category: 'Combattimento', met: 8.0, emoji: '🥋' },
  { name: 'Taekwondo', category: 'Combattimento', met: 8.0, emoji: '🦶' },
  { name: 'BJJ / Grappling', category: 'Combattimento', met: 9.0, emoji: '🥋' },
  { name: 'Lotta', category: 'Combattimento', met: 8.0, emoji: '🤼' },
  { name: 'Kickboxing', category: 'Combattimento', met: 9.5, emoji: '🦵' },
  { name: 'Muay Thai', category: 'Combattimento', met: 10.0, emoji: '🥊' },
  { name: 'Krav Maga', category: 'Combattimento', met: 9.0, emoji: '🥋' },

  // Mind & Body - time_only
  { name: 'Yoga (Hatha)', category: 'Mind & Body', met: 3.0, emoji: '🧘' },
  { name: 'Yoga (Vinyasa)', category: 'Mind & Body', met: 4.0, emoji: '🧘' },
  { name: 'Yoga (Bikram)', category: 'Mind & Body', met: 5.0, emoji: '🧘' },
  { name: 'Pilates', category: 'Mind & Body', met: 3.5, emoji: '🧘' },
  { name: 'Tai Chi', category: 'Mind & Body', met: 3.0, emoji: '🧘' },
  { name: 'Stretching', category: 'Mind & Body', met: 2.5, emoji: '🤸' },
  { name: 'Ginnastica posturale', category: 'Mind & Body', met: 3.5, emoji: '🧘' },

  // Outdoor - time_only
  { name: 'Escursionismo (pianura)', category: 'Outdoor', met: 5.0, emoji: '🥾' },
  { name: 'Trekking (montagna)', category: 'Outdoor', met: 7.0, emoji: '🏔️' },
  { name: 'Arrampicata', category: 'Outdoor', met: 8.0, emoji: '🧗' },
  { name: 'Alpinismo', category: 'Outdoor', met: 9.0, emoji: '🏔️' },
  { name: 'Equitazione', category: 'Outdoor', met: 5.5, emoji: '🐎' },
  { name: 'Sci (discesa)', category: 'Outdoor', met: 6.0, emoji: '⛷️' },
  { name: 'Snowboard', category: 'Outdoor', met: 6.0, emoji: '🏂' },
  { name: 'Sci di fondo', category: 'Outdoor', met: 8.0, emoji: '🎿' },
  { name: 'Pattinaggio su ghiaccio', category: 'Outdoor', met: 6.0, emoji: '⛸️' },

  // Danza - time_style
  { name: 'Danza', category: 'Danza', met: 4.5, emoji: '💃', styles: DANCE_STYLES },
  { name: 'Zumba', category: 'Danza', met: 7.0, emoji: '💃' },
  { name: 'Balletto', category: 'Danza', met: 6.0, emoji: '🩰' },
  { name: 'Salsa', category: 'Danza', met: 5.5, emoji: '💃' },
  { name: 'Tango', category: 'Danza', met: 5.0, emoji: '💃' },

  // Ciclismo - time_only
  { name: 'Ciclismo (16 km/h)', category: 'Ciclismo', met: 6.0, emoji: '🚴' },
  { name: 'Ciclismo (20 km/h)', category: 'Ciclismo', met: 8.0, emoji: '🚴' },
  { name: 'Ciclismo (25 km/h)', category: 'Ciclismo', met: 10.0, emoji: '🚴' },
  { name: 'Ciclismo in salita', category: 'Ciclismo', met: 12.0, emoji: '⛰️' },
  { name: 'Cyclette (moderata)', category: 'Ciclismo', met: 5.5, emoji: '🚴' },
  { name: 'Cyclette (intensa)', category: 'Ciclismo', met: 8.5, emoji: '🚴' },
  { name: 'Spin bike', category: 'Ciclismo', met: 9.0, emoji: '🚴' },
  { name: 'Mountain bike', category: 'Ciclismo', met: 8.5, emoji: '🚵' },

  // Atletica - time_only
  { name: 'Salto in lungo', category: 'Atletica', met: 6.0, emoji: '🤸' },
  { name: 'Salto in alto', category: 'Atletica', met: 6.0, emoji: '🤸' },
  { name: 'Lancio del peso', category: 'Atletica', met: 6.0, emoji: '🤾' },
  { name: 'Maratona (training)', category: 'Atletica', met: 10.0, emoji: '🏃' },
  { name: 'Pattinaggio a rotelle', category: 'Atletica', met: 7.0, emoji: '🛼' },
  { name: 'Ginnastica artistica', category: 'Atletica', met: 6.0, emoji: '🤸' },
  { name: 'Parkour', category: 'Atletica', met: 9.0, emoji: '🤸' },
];

function calcWorkoutCalories(met: number, weightKg: number, minutes: number): number {
  return Math.round(met * weightKg * (minutes / 60));
}

function getWorkoutCategory(workout: WorkoutDef): WorkoutCategory {
  return CATEGORY_TYPE[workout.category] ?? 'time_only';
}

export function GymView() {
  const { state, setState } = useApp();
  const { profile } = useAuth();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutDef | null>(null);
  const [minutes, setMinutes] = useState(30);
  const [selectedStyle, setSelectedStyle] = useState('');
  const [sets, setSets] = useState<StrengthSet[]>([{ reps: 10, weight: 0 }]);
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [showFilters, setShowFilters] = useState(false);
  const [subView, setSubView] = useState<'log' | 'leaderboard'>('log');
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
  const [lbLoading, setLbLoading] = useState(false);

  const bmr = Math.round(calcBMR(state.profile));
  const tdee = calcTDEE(state.profile);
  const targetCal = calcTargetCalories(state.profile);

  const todayWorkouts = state.workoutLogs.filter((w) => w.date === todayISO());
  const todayBurned = todayWorkouts.reduce((s, w) => s + w.calories, 0);
  const totalBurned = state.workoutLogs.reduce((s, w) => s + w.calories, 0);

  const filtered = useMemo(() => {
    let result = WORKOUT_DATABASE;
    if (selectedCategory !== 'all') result = result.filter((w) => w.category === selectedCategory);
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter((w) => w.name.toLowerCase().includes(q) || w.category.toLowerCase().includes(q));
    }
    return result.sort((a, b) => a.name.localeCompare(b.name));
  }, [search, selectedCategory]);

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
          {/* TDEE Summary */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-3">
              <Flame className="w-5 h-5 text-orange-500" />
              <h2 className="section-title">Dispendio Calorico</h2>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800">
                <p className="text-xs text-gray-500">BMR</p>
                <p className="text-base font-bold text-gray-900 dark:text-white">{bmr}</p>
                <p className="text-[10px] text-gray-400">kcal</p>
              </div>
              <div className="p-2.5 rounded-xl bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800">
                <p className="text-xs text-primary-600 dark:text-primary-400">TDEE</p>
                <p className="text-base font-bold text-primary-600 dark:text-primary-400">{tdee + todayBurned}</p>
                <p className="text-[10px] text-primary-400">kcal/giorno</p>
              </div>
              <div className="p-2.5 rounded-xl bg-accent-50 dark:bg-accent-900/20 border border-accent-200 dark:border-accent-800">
                <p className="text-xs text-accent-600 dark:text-accent-400">Oggi</p>
                <p className="text-base font-bold text-accent-600 dark:text-accent-400">+{todayBurned}</p>
                <p className="text-[10px] text-accent-400">kcal bruciate</p>
              </div>
            </div>
            <div className="mt-3">
              <label className="label">Livello di attivita</label>
              <select
                className="input"
                value={state.profile.activityLevel}
                onChange={(e) => setState((prev) => ({ ...prev, profile: { ...prev.profile, activityLevel: e.target.value as ActivityLevel } }))}
              >
                {ACTIVITY_LEVELS.map((a) => (
                  <option key={a.value} value={a.value}>{a.label} - {a.description}</option>
                ))}
              </select>
            </div>
          </div>

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

          {/* Workout search + filters */}
          <div className="card p-4">
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                className="input pl-10"
                placeholder="Cerca attivita o sport..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <button
              onClick={() => setShowFilters((s) => !s)}
              className="w-full flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-300 py-2"
            >
              <span>Filtra per categoria</span>
              {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showFilters && (
              <div className="flex flex-wrap gap-2 mt-2 mb-2 animate-fade-in">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`chip ${selectedCategory === 'all' ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}
                >
                  Tutte
                </button>
                {WORKOUT_CATEGORIES.map((cat) => (
                  <button
                    key={cat.label}
                    onClick={() => setSelectedCategory(cat.label)}
                    className={`chip ${selectedCategory === cat.label ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}
                  >
                    {cat.emoji} {cat.label}
                  </button>
                ))}
              </div>
            )}

            <p className="text-sm text-gray-500 mt-2">{filtered.length} attivita trovate</p>

            <div className="space-y-1.5 mt-2 max-h-80 overflow-y-auto">
              {filtered.map((w) => {
                const wCat = getWorkoutCategory(w);
                const catLabel = wCat === 'strength' ? 'Serie/Rep' : wCat === 'time_style' ? 'Tempo/Stile' : 'Tempo';
                return (
                  <button
                    key={w.name}
                    onClick={() => { setSelectedWorkout(w); setSelectedStyle(w.styles?.[0] ?? ''); }}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all text-left ${
                      selectedWorkout?.name === w.name
                        ? 'bg-primary-100 dark:bg-primary-900/30 border border-primary-300 dark:border-primary-700'
                        : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <span className="text-2xl shrink-0">{w.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{w.name}</p>
                      <p className="text-xs text-gray-500">{w.category} - {catLabel}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

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
