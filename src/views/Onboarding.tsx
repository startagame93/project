import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { updateProfileMetrics } from '@/lib/supabase';
import { ACTIVITY_LEVELS, type Sex, type ActivityLevel } from '@/types';
import {
  Flame, Salad, Dumbbell, Activity, BookOpen, Check, ChevronRight,
  Ruler, Scale, Target, User,
} from 'lucide-react';

const INFO_SLIDES = [
  {
    icon: Flame,
    title: 'Benvenuto su NutriPlan',
    text: 'La tua app completa per gestire alimentazione, allenamento e composizione corporea. Ogni dato che registri viene salvato in modo sicuro e permanente.',
    color: 'from-primary-500 to-primary-700',
  },
  {
    icon: Salad,
    title: 'Piano Alimentare',
    text: 'Crea il tuo piano settimanale con 5 pasti al giorno. Calcola automaticamente calorie e macro in base ai grammi reali di ogni alimento.',
    color: 'from-green-500 to-green-700',
  },
  {
    icon: BookOpen,
    title: 'Database Alimenti',
    text: 'Oltre 500 alimenti con valori nutrizionali completi. Carne, pesce, bevande, piatti pronti e poke bowl, tutti con calcolo dinamico dei grammi.',
    color: 'from-blue-500 to-blue-700',
  },
  {
    icon: Dumbbell,
    title: 'Allenamento Dettagliato',
    text: 'Registra esercizi di forza con serie e ripetizioni, attivita con stile (nuoto) e attivita cardio. Competi nelle classifiche con altri utenti.',
    color: 'from-orange-500 to-orange-700',
  },
  {
    icon: Activity,
    title: 'Composizione Corporea',
    text: 'Traccia circonferenze corporee, BMI e ricevi valutazioni automatiche sul tuo stato di forma con consigli personalizzati.',
    color: 'from-accent-500 to-accent-700',
  },
];

export function Onboarding({ onComplete }: { onComplete: () => void }) {
  const { state, setState } = useApp();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const isInfoPhase = step < INFO_SLIDES.length;
  const isMetricsPhase = step === INFO_SLIDES.length;
  const isLast = step === INFO_SLIDES.length + 1;

  // Metrics form state
  const [name, setName] = useState(state.profile.name || user?.email?.split('@')[0] || '');
  const [sex, setSex] = useState<Sex>(state.profile.sex);
  const [age, setAge] = useState(state.profile.age || 25);
  const [height, setHeight] = useState(state.profile.height || 175);
  const [weight, setWeight] = useState(state.profile.weight || 70);
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(state.profile.activityLevel);
  const [goal, setGoal] = useState(state.profile.goal);

  function next() {
    if (isLast) {
      saveAndComplete();
    } else {
      setStep((s) => s + 1);
    }
  }

  function skip() {
    saveAndComplete();
  }

  function skipMetrics() {
    // Skip without saving metrics - still mark onboarding complete
    setState((prev) => ({ ...prev, onboardingComplete: true }));
    onComplete();
  }

  async function saveAndComplete() {
    setState((prev) => ({
      ...prev,
      profile: { ...prev.profile, name, sex, age, weight, height, activityLevel, goal },
      onboardingComplete: true,
    }));
    await updateProfileMetrics({
      display_name: name,
      height_cm: height,
      weight_kg: weight,
      sex,
      age,
      activity_level: activityLevel,
      goal,
    });
    onComplete();
  }

  // Info slides phase
  if (isInfoPhase) {
    const slide = INFO_SLIDES[step];
    const Icon = slide.icon;
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col" role="dialog">
        {!isLast && (
          <button
            onClick={skip}
            className="absolute top-4 right-4 z-10 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 px-3 py-1.5"
            aria-label="Salta la guida"
          >
            Salta
          </button>
        )}

        <div className="flex-1 flex flex-col items-center justify-center px-6 max-w-md mx-auto w-full">
          <div className={`w-28 h-28 rounded-3xl bg-gradient-to-br ${slide.color} flex items-center justify-center mb-8 shadow-xl`}>
            <Icon className="w-14 h-14 text-white" strokeWidth={1.5} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-4">{slide.title}</h2>
          <p className="text-base text-gray-600 dark:text-gray-400 text-center leading-relaxed">{slide.text}</p>
        </div>

        <div className="flex items-center justify-center gap-2 pb-6" role="group">
          {INFO_SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={`h-2 rounded-full transition-all ${i === step ? 'w-8 bg-primary-600' : 'w-2 bg-gray-300 dark:bg-gray-700'}`}
              aria-label={`Vai alla slide ${i + 1}`}
            />
          ))}
        </div>

        <div className="px-6 pb-8 max-w-md mx-auto w-full">
          <button onClick={next} className="btn-primary w-full text-base py-3 flex items-center justify-center gap-1">
            Avanti <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  // Metrics collection phase
  if (isMetricsPhase) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col" role="dialog">
        <button
          onClick={skipMetrics}
          className="absolute top-4 right-4 z-10 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 px-3 py-1.5"
          aria-label="Salta la configurazione delle metriche"
        >
          Salta
        </button>
        <div className="flex-1 px-6 max-w-md mx-auto w-full py-8 space-y-4">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Ruler className="w-8 h-8 text-white" strokeWidth={1.5} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Le tue metriche</h2>
            <p className="text-sm text-gray-500 mt-1">Configura il tuo profilo per calcoli precisi</p>
          </div>

          <div>
            <label className="label">Nome</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                className="input pl-10"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Come ti chiami?"
              />
            </div>
          </div>

          <div>
            <label className="label">Sesso</label>
            <div className="flex gap-2">
              {([['M', 'Uomo'], ['F', 'Donna']] as [Sex, string][]).map(([s, label]) => (
                <button
                  key={s}
                  onClick={() => setSex(s)}
                  className={`flex-1 py-2.5 rounded-xl font-medium transition-all ${
                    sex === s ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Eta</label>
              <input type="number" min={10} max={100} className="input" value={age} onChange={(e) => setAge(+e.target.value)} />
            </div>
            <div>
              <label className="label">Altezza (cm)</label>
              <input type="number" min={100} max={250} className="input" value={height} onChange={(e) => setHeight(+e.target.value)} />
            </div>
            <div>
              <label className="label">Peso (kg)</label>
              <input type="number" step="0.1" min={30} max={300} className="input" value={weight} onChange={(e) => setWeight(+e.target.value)} />
            </div>
          </div>

          <div>
            <label className="label">Livello di attivita</label>
            <select
              className="input"
              value={activityLevel}
              onChange={(e) => setActivityLevel(e.target.value as ActivityLevel)}
            >
              {ACTIVITY_LEVELS.map((a) => (
                <option key={a.value} value={a.value}>{a.label} - {a.description}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Obiettivo</label>
            <div className="grid grid-cols-3 gap-2">
              {([
                ['dimagrimento', 'Dimagrimento', TrendingDownIcon],
                ['mantenimento', 'Mantenimento', EqualIcon],
                ['massa', 'Massa', TrendingUpIcon],
              ] as const).map(([val, label, Icon]) => (
                <button
                  key={val}
                  onClick={() => setGoal(val)}
                  className={`flex flex-col items-center gap-1 py-3 rounded-xl font-medium text-xs transition-all ${
                    goal === val ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 pb-8 max-w-md mx-auto w-full">
          <button onClick={next} className="btn-primary w-full text-base py-3 flex items-center justify-center gap-1">
            Completa <Check className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  return null;
}

function TrendingDownIcon(props: { className?: string }) {
  return <Activity {...props} />;
}
function EqualIcon(props: { className?: string }) {
  return <Target {...props} />;
}
function TrendingUpIcon(props: { className?: string }) {
  return <Dumbbell {...props} />;
}
