import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Flame, Salad, Dumbbell, Activity, BookOpen, Check, ChevronRight } from 'lucide-react';

const SLIDES = [
  {
    icon: Flame,
    title: 'Benvenuto su NutriPlan',
    text: 'La tua app completa per gestire alimentazione, allenamento e composizione corporea. Scopriamo insieme tutte le funzionala.',
    color: 'from-primary-500 to-primary-700',
    emoji: '🍎',
  },
  {
    icon: Salad,
    title: 'Piano Alimentare',
    text: 'Crea il tuo piano settimanale con colazione, pranzo, cena, spuntino e merenda. Segna i pasti come completati e monitora calorie e macro.',
    color: 'from-green-500 to-green-700',
    emoji: '🥗',
  },
  {
    icon: BookOpen,
    title: 'Database Alimenti',
    text: 'Sfoglia oltre 200 alimenti con valori nutrizionali completi. Tocca un alimento per vedere i dettagli e aggiungerlo direttamente al tuo piano.',
    color: 'from-blue-500 to-blue-700',
    emoji: '📚',
  },
  {
    icon: Dumbbell,
    title: 'Nutrizione & Integratori',
    text: 'Registra acqua, integratori e micronutrienti. Ricevi avvisi per carenze vitaminiche e mantieniti idratato ogni giorno.',
    color: 'from-accent-500 to-accent-700',
    emoji: '💊',
  },
  {
    icon: Activity,
    title: 'Palestra & Attivita',
    text: 'Oltre 100 tipi di attivita sportiva con calcolo calorie bruciate. Scegli sport, durata e data. Il TDEE si aggiorna automaticamente.',
    color: 'from-orange-500 to-orange-700',
    emoji: '🏋️',
  },
  {
    icon: Check,
    title: 'Pronto per Iniziare',
    text: 'Tutti i dati sono salvati sul tuo dispositivo. Puoi fare backup e ripristino dalle Impostazioni. Scorri tra le sezioni con lo swipe o usa la barra in basso.',
    color: 'from-secondary-500 to-secondary-700',
    emoji: '✅',
  },
];

export function Onboarding({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const slide = SLIDES[step];
  const isLast = step === SLIDES.length - 1;
  const Icon = slide.icon;

  function next() {
    if (isLast) {
      onComplete();
    } else {
      setStep((s) => s + 1);
    }
  }

  function skip() {
    onComplete();
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col" role="dialog" aria-label="Guida introduttiva di NutriPlan">
      {/* Skip button */}
      {!isLast && (
        <button
          onClick={skip}
          className="absolute top-4 right-4 z-10 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 px-3 py-1.5"
          aria-label="Salta la guida introduttiva"
        >
          Salta
        </button>
      )}

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 max-w-md mx-auto w-full">
        <div className={`w-28 h-28 rounded-3xl bg-gradient-to-br ${slide.color} flex items-center justify-center mb-8 shadow-xl`}>
          <Icon className="w-14 h-14 text-white" strokeWidth={1.5} />
        </div>

        <span className="text-6xl mb-6" aria-hidden="true">{slide.emoji}</span>

        <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-4">{slide.title}</h2>
        <p className="text-base text-gray-600 dark:text-gray-400 text-center leading-relaxed">{slide.text}</p>
      </div>

      {/* Dots */}
      <div className="flex items-center justify-center gap-2 pb-6" role="group" aria-label="Avanzamento della guida">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setStep(i)}
            className={`h-2 rounded-full transition-all ${i === step ? 'w-8 bg-primary-600' : 'w-2 bg-gray-300 dark:bg-gray-700'}`}
            aria-label={`Vai alla slide ${i + 1} di ${SLIDES.length}`}
            aria-current={i === step}
          />
        ))}
      </div>

      {/* Button */}
      <div className="px-6 pb-8 max-w-md mx-auto w-full">
        <button onClick={next} className="btn-primary w-full text-base py-3" aria-label={isLast ? 'Inizia a usare l\'app' : 'Prossima slide'}>
          {isLast ? 'Inizia' : 'Avanti'}
          {!isLast && <ChevronRight className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
}
