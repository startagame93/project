import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { calcBMR, calcTDEE, calcTargetCalories, todayISO, uid } from '@/lib/data';
import { ACTIVITY_LEVELS, DAYS_OF_WEEK } from '@/types';
import type { ActivityLevel, WorkoutEntry } from '@/types';
import {
  Activity, Flame, Zap, Plus, Minus, Dumbbell, Trash2, Calendar,
  TrendingUp, ChevronDown, ChevronUp, Search,
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
  { label: 'Cicling', emoji: '🚴' },
  { label: 'Atletica', emoji: '🤸' },
];

const WORKOUT_DATABASE: { name: string; category: string; met: number; emoji: string }[] = [
  // Cardio
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

  // Forza
  { name: 'Pesi (moderato)', category: 'Forza', met: 5.0, emoji: '🏋️' },
  { name: 'Pesi (vigoroso)', category: 'Forza', met: 6.0, emoji: '🏋️' },
  { name: 'Powerlifting', category: 'Forza', met: 6.5, emoji: '🏋️' },
  { name: 'Bodybuilding', category: 'Forza', met: 6.0, emoji: '💪' },
  { name: 'Calistenia', category: 'Forza', met: 7.0, emoji: '🤸' },
  { name: 'Kettlebell', category: 'Forza', met: 9.0, emoji: '🪨' },
  { name: 'Strongman', category: 'Forza', met: 8.0, emoji: '🏋️' },
  { name: 'Macchine isotoniche', category: 'Forza', met: 5.5, emoji: '🏋️' },
  { name: 'Cross training', category: 'Forza', met: 9.0, emoji: '🏋️' },

  // Sport
  { name: 'Calcio', category: 'Sport', met: 7.0, emoji: '⚽' },
  { name: 'Calcetto', category: 'Sport', met: 6.0, emoji: '⚽' },
  { name: 'Basket', category: 'Sport', met: 6.5, emoji: '🏀' },
  { name: 'Volley', category: 'Sport', met: 6.0, emoji: '🏐' },
  { name: 'Tennis (singolare)', category: 'Sport', met: 8.0, emoji: '🎾' },
  { name: 'Tennis (doppio)', category: 'Sport', met: 6.0, emoji: '🎾' },
  { name: 'Padel', category: 'Sport', met: 6.5, emoji: '🎾' },
  { name: 'Calcio da tavolo', category: 'Sport', met: 4.0, emoji: '🦵' },
  { name: 'Rugby', category: 'Sport', met: 10.0, emoji: '🏉' },
  { name: 'Football americano', category: 'Sport', met: 8.0, emoji: '🏈' },
  { name: 'Hockey su prato', category: 'Sport', met: 7.0, emoji: '🏒' },
  { name: 'Crickt', category: 'Sport', met: 4.8, emoji: '🏏' },
  { name: 'Baseball', category: 'Sport', met: 5.0, emoji: '⚾' },
  { name: 'Frisbee', category: 'Sport', met: 6.0, emoji: '🥏' },
  { name: 'Golf', category: 'Sport', met: 4.3, emoji: '⛳' },
  { name: 'Pallamano', category: 'Sport', met: 8.0, emoji: '🤾' },
  { name: 'Ping pong', category: 'Sport', met: 4.0, emoji: '🏓' },
  { name: 'Badminton', category: 'Sport', met: 5.5, emoji: '🏸' },
  { name: 'Squash', category: 'Sport', met: 9.0, emoji: '🎾' },

  // Acqua
  { name: 'Nuoto (stile libero)', category: 'Acqua', met: 8.0, emoji: '🏊' },
  { name: 'Nuoto (rana)', category: 'Acqua', met: 6.0, emoji: '🐸' },
  { name: 'Nuoto (dorso)', category: 'Acqua', met: 6.5, emoji: '🏊' },
  { name: 'Nuoto (delfino)', category: 'Acqua', met: 10.0, emoji: '🐬' },
  { name: 'Nuoto agonistico', category: 'Acqua', met: 10.0, emoji: '🏊' },
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

  // Combattimento
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

  // Mind & Body
  { name: 'Yoga (Hatha)', category: 'Mind & Body', met: 3.0, emoji: '🧘' },
  { name: 'Yoga (Vinyasa)', category: 'Mind & Body', met: 4.0, emoji: '🧘' },
  { name: 'Yoga (Bikram)', category: 'Mind & Body', met: 5.0, emoji: '🧘' },
  { name: 'Pilates', category: 'Mind & Body', met: 3.5, emoji: '🧘' },
  { name: 'Tai Chi', category: 'Mind & Body', met: 3.0, emoji: '🧘' },
  { name: 'Stretching', category: 'Mind & Body', met: 2.5, emoji: '🤸' },
  { name: 'Meditazione attiva', category: 'Mind & Body', met: 2.0, emoji: '🧠' },
  { name: 'Ginnastica posturale', category: 'Mind & Body', met: 3.5, emoji: '🧘' },

  // Outdoor
  { name: 'Escursionismo (pianura)', category: 'Outdoor', met: 5.0, emoji: '🥾' },
  { name: 'Trekking (montagna)', category: 'Outdoor', met: 7.0, emoji: '🏔️' },
  { name: 'Arrampicata', category: 'Outdoor', met: 8.0, emoji: '🧗' },
  { name: 'Arrampicata (indoor)', category: 'Outdoor', met: 7.0, emoji: '🧗' },
  { name: 'Alpinismo', category: 'Outdoor', met: 9.0, emoji: '🏔️' },
  { name: 'Campeggio attivo', category: 'Outdoor', met: 3.5, emoji: '🏕️' },
  { name: 'Orientamento', category: 'Outdoor', met: 6.0, emoji: '🧭' },
  { name: 'Caccia', category: 'Outdoor', met: 5.0, emoji: '🏹' },
  { name: 'Pesca sportiva', category: 'Outdoor', met: 3.5, emoji: '🎣' },
  { name: 'Equitazione', category: 'Outdoor', met: 5.5, emoji: '🐎' },
  { name: 'Sci (discesa)', category: 'Outdoor', met: 6.0, emoji: '⛷️' },
  { name: 'Snowboard', category: 'Outdoor', met: 6.0, emoji: '🏂' },
  { name: 'Sci di fondo', category: 'Outdoor', met: 8.0, emoji: '🎿' },
  { name: 'Pattinaggio su ghiaccio', category: 'Outdoor', met: 6.0, emoji: '⛸️' },

  // Danza
  { name: 'Danza (generale)', category: 'Danza', met: 4.5, emoji: '💃' },
  { name: 'Zumba', category: 'Danza', met: 7.0, emoji: '💃' },
  { name: 'Balletto', category: 'Danza', met: 6.0, emoji: '🩰' },
  { name: 'Hip hop', category: 'Danza', met: 6.5, emoji: '🕺' },
  { name: 'Contemporaneo', category: 'Danza', met: 5.0, emoji: '💃' },
  { name: 'Salsa', category: 'Danza', met: 5.5, emoji: '💃' },
  { name: 'Tango', category: 'Danza', met: 5.0, emoji: '💃' },
  { name: 'Balli di gruppo', category: 'Danza', met: 5.0, emoji: '🕺' },

  // Ciclismo
  { name: 'Ciclismo (16 km/h)', category: 'Cicling', met: 6.0, emoji: '🚴' },
  { name: 'Ciclismo (20 km/h)', category: 'Cicling', met: 8.0, emoji: '🚴' },
  { name: 'Ciclismo (25 km/h)', category: 'Cicling', met: 10.0, emoji: '🚴' },
  { name: 'Ciclismo in salita', category: 'Cicling', met: 12.0, emoji: '⛰️' },
  { name: 'Cyclette (moderata)', category: 'Cicling', met: 5.5, emoji: '🚴' },
  { name: 'Cyclette (intensa)', category: 'Cicling', met: 8.5, emoji: '🚴' },
  { name: 'Spin bike', category: 'Cicling', met: 9.0, emoji: '🚴' },
  { name: 'Mountain bike', category: 'Cicling', met: 8.5, emoji: '🚵' },
  { name: 'BMX', category: 'Cicling', met: 7.5, emoji: '🚴' },

  // Atletica
  { name: 'Salto in lungo', category: 'Atletica', met: 6.0, emoji: '🤸' },
  { name: 'Salto in alto', category: 'Atletica', met: 6.0, emoji: '🤸' },
  { name: 'Lancio del peso', category: 'Atletica', met: 6.0, emoji: '🤾' },
  { name: 'Asticella', category: 'Atletica', met: 7.0, emoji: '🤸' },
  { name: ' ostacoli', category: 'Atletica', met: 9.0, emoji: '🏃' },
  { name: 'Maratona (training)', category: 'Atletica', met: 10.0, emoji: '🏃' },
  { name: 'Pattinaggio a rotelle', category: 'Atletica', met: 7.0, emoji: '🛼' },
  { name: 'Ginnastica artistica', category: 'Atletica', met: 6.0, emoji: '🤸' },
  { name: 'Ginnastica ritmica', category: 'Atletica', met: 6.5, emoji: '🤸' },
  { name: 'Parkour', category: 'Atletica', met: 9.0, emoji: '🤸' },
];

function calcWorkoutCalories(met: number, weightKg: number, minutes: number): number {
  return Math.round(met * weightKg * (minutes / 60));
}

export function GymView() {
  const { state, setState } = useApp();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedWorkout, setSelectedWorkout] = useState<typeof WORKOUT_DATABASE[0] | null>(null);
  const [minutes, setMinutes] = useState(30);
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [showFilters, setShowFilters] = useState(false);

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

  function logWorkout() {
    if (!selectedWorkout) return;
    const entry: WorkoutEntry = {
      id: uid(),
      type: selectedWorkout.name,
      met: selectedWorkout.met,
      minutes,
      calories: calcWorkoutCalories(selectedWorkout.met, state.profile.weight, minutes),
      date: selectedDate,
    };
    setState((prev) => ({ ...prev, workoutLogs: [...prev.workoutLogs, entry] }));
    setSelectedWorkout(null);
    setMinutes(30);
  }

  function deleteWorkout(id: string) {
    setState((prev) => ({ ...prev, workoutLogs: prev.workoutLogs.filter((w) => w.id !== id) }));
  }

  return (
    <div className="space-y-4">
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
            aria-label="Seleziona livello di attivita"
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
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{w.type}</p>
                  <p className="text-xs text-gray-500">{w.minutes} min - {w.calories} kcal</p>
                </div>
                <button
                  onClick={() => deleteWorkout(w.id)}
                  className="p-2 rounded-lg text-gray-400 hover:text-error-600 transition-colors"
                  aria-label={`Elimina allenamento ${w.type}`}
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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" aria-hidden="true" />
          <input
            type="text"
            className="input pl-10"
            placeholder="Cerca attivita o sport..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Cerca un'attivita sportiva"
          />
        </div>

        <button
          onClick={() => setShowFilters((s) => !s)}
          className="w-full flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-300 py-2"
          aria-expanded={showFilters}
          aria-label="Mostra o nascondi filtri per categoria"
        >
          <span>Filtra per categoria {selectedCategory !== 'all' && <span className="chip bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 ml-1">{selectedCategory}</span>}</span>
          {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showFilters && (
          <div className="flex flex-wrap gap-2 mt-2 mb-2 animate-fade-in" role="group" aria-label="Categorie di attivita">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`chip ${selectedCategory === 'all' ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}
              aria-pressed={selectedCategory === 'all'}
            >
              Tutte
            </button>
            {WORKOUT_CATEGORIES.map((cat) => (
              <button
                key={cat.label}
                onClick={() => setSelectedCategory(cat.label)}
                className={`chip ${selectedCategory === cat.label ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}
                aria-pressed={selectedCategory === cat.label}
              >
                {cat.emoji} {cat.label}
              </button>
            ))}
          </div>
        )}

        <p className="text-sm text-gray-500 mt-2" aria-live="polite">{filtered.length} attivita trovate</p>

        {/* Workout list */}
        <div className="space-y-1.5 mt-2 max-h-80 overflow-y-auto">
          {filtered.map((w) => (
            <button
              key={w.name}
              onClick={() => setSelectedWorkout(w)}
              className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all text-left ${
                selectedWorkout?.name === w.name
                  ? 'bg-primary-100 dark:bg-primary-900/30 border border-primary-300 dark:border-primary-700'
                  : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              aria-label={`${w.name}, ${w.category}, MET ${w.met}. Tocca per calcolare le calorie.`}
            >
              <span className="text-2xl shrink-0" aria-hidden="true">{w.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{w.name}</p>
                <p className="text-xs text-gray-500">{w.category} - MET {w.met}</p>
              </div>
              <span className="text-xs font-bold text-accent-600 dark:text-accent-400 shrink-0">
                {calcWorkoutCalories(w.met, state.profile.weight, minutes)} kcal
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Workout logger */}
      {selectedWorkout && (
        <div className="card p-4 border-2 border-accent-300 dark:border-accent-700">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl" aria-hidden="true">{selectedWorkout.emoji}</span>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">{selectedWorkout.name}</h3>
              <p className="text-xs text-gray-500">{selectedWorkout.category} - MET {selectedWorkout.met}</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="label">Durata (minuti)</label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setMinutes((m) => Math.max(5, m - 5))}
                  className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center"
                  aria-label="Riduci durata di 5 minuti"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-2xl font-bold text-gray-900 dark:text-white flex-1 text-center" aria-live="polite">{minutes}</span>
                <button
                  onClick={() => setMinutes((m) => Math.min(300, m + 5))}
                  className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center"
                  aria-label="Aumenta durata di 5 minuti"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div>
              <label className="label">Data</label>
              <input
                type="date"
                className="input"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                aria-label="Seleziona la data dell'allenamento"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-accent-50 to-primary-50 dark:from-accent-900/20 dark:to-primary-900/20">
              <div>
                <p className="text-xs text-gray-500">Calorie stimate</p>
                <p className="text-2xl font-bold text-accent-600 dark:text-accent-400">
                  {calcWorkoutCalories(selectedWorkout.met, state.profile.weight, minutes)} kcal
                </p>
              </div>
              <Zap className="w-8 h-8 text-accent-400" />
            </div>

            <div className="flex gap-2">
              <button onClick={logWorkout} className="btn-primary flex-1">
                <Plus className="w-4 h-4" /> Registra Allenamento
              </button>
              <button onClick={() => setSelectedWorkout(null)} className="btn-secondary">
                Annulla
              </button>
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
    </div>
  );
}
