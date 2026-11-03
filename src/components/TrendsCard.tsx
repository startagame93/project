import { useState } from 'react';
import { Flame, Scale, Sprout, type LucideIcon } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { todayISO } from '@/lib/data';
import { LineChart } from '@/components/LineChart';
import {
  RANGE_OPTIONS, buildBodySeries, buildMicroSeries, inRange,
  type RangeKey, type SeriesPoint,
} from '@/lib/progressSeries';
import { MICRONUTRIENT_TARGETS, type AppState, type MicronutrientKey } from '@/types';

type Metric = 'weight' | 'calories' | 'micro';

const METRICS: { value: Metric; label: string; icon: LucideIcon; color: string }[] = [
  { value: 'weight', label: 'Peso', icon: Scale, color: '#2f7fff' },
  { value: 'calories', label: 'Calorie', icon: Flame, color: '#ff6b4a' },
  { value: 'micro', label: 'Micronutrienti', icon: Sprout, color: '#22c55e' },
];

const MICRO_KEYS = Object.keys(MICRONUTRIENT_TARGETS) as MicronutrientKey[];

function seriesFor(state: AppState, metric: Metric, micro: MicronutrientKey, range: RangeKey, today: string): SeriesPoint[] {
  if (metric === 'weight') return buildBodySeries(state.bodyMetrics, 'weight', range, today);
  if (metric === 'micro') return buildMicroSeries(state.micronutrientLogs, micro, range, today);
  return Object.entries(state.mealHistory ?? {})
    .filter(([date, meals]) => meals.length > 0 && inRange(date, range, today))
    .map(([date, meals]) => ({ date, value: meals.reduce((sum, m) => sum + m.calories, 0) }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function formatNumber(value: number): string {
  return value.toLocaleString('it-IT', { maximumFractionDigits: 1 });
}

export function TrendsCard() {
  const { state } = useApp();
  const [metric, setMetric] = useState<Metric>('weight');
  const [micro, setMicro] = useState<MicronutrientKey>('potassium');
  const [range, setRange] = useState<RangeKey>('3m');

  const today = todayISO();
  const active = METRICS.find((m) => m.value === metric) ?? METRICS[0];
  const target = MICRONUTRIENT_TARGETS[micro];
  const points = seriesFor(state, metric, micro, range, today);

  const unit = metric === 'weight' ? 'kg' : metric === 'calories' ? 'kcal' : target.unit;
  const band = metric === 'micro' ? { min: target.min, max: target.max } : undefined;
  const average = points.length
    ? points.reduce((sum, p) => sum + p.value, 0) / points.length
    : null;
  const change = points.length >= 2 ? points[points.length - 1].value - points[0].value : null;

  return (
    <section className="card space-y-4 p-5" aria-labelledby="trends-title">
      <div>
        <h2 id="trends-title" className="section-title">Andamento nel tempo</h2>
        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Tocca un punto del grafico per leggere il valore</p>
      </div>

      <div className="flex gap-1 rounded-xl bg-gray-100 p-1 dark:bg-white/5" role="tablist" aria-label="Dato da visualizzare">
        {METRICS.map((m) => {
          const Icon = m.icon;
          const selected = metric === m.value;
          return (
            <button
              key={m.value}
              role="tab"
              aria-selected={selected}
              onClick={() => setMetric(m.value)}
              className={`tap-press flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all ${
                selected
                  ? 'bg-white text-gray-900 shadow-sm dark:bg-white/15 dark:text-white'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <Icon className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
              {m.label}
            </button>
          );
        })}
      </div>

      {metric === 'micro' && (
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="radiogroup" aria-label="Micronutriente">
          {MICRO_KEYS.map((key) => (
            <button
              key={key}
              role="radio"
              aria-checked={micro === key}
              onClick={() => setMicro(key)}
              className={`tap-press shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                micro === key
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-300'
              }`}
            >
              {MICRONUTRIENT_TARGETS[key].label}
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-1.5" role="radiogroup" aria-label="Periodo">
        {RANGE_OPTIONS.map((r) => (
          <button
            key={r.value}
            role="radio"
            aria-checked={range === r.value}
            onClick={() => setRange(r.value)}
            className={`tap-press flex-1 rounded-lg border py-1.5 text-xs font-medium transition-colors ${
              range === r.value
                ? 'border-primary-500 bg-primary-500/10 text-primary-700 dark:text-primary-300'
                : 'border-gray-200 text-gray-500 dark:border-white/10 dark:text-gray-400'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      <div key={`${metric}-${micro}-${range}`} className="animate-fade-in">
        <LineChart points={points} unit={unit} color={active.color} band={band} />
      </div>

      {band && points.length > 0 && (
        <p className="text-center text-[11px] text-gray-500 dark:text-gray-400">
          Fascia consigliata: {formatNumber(band.min)}-{formatNumber(band.max)} {unit}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-gray-100/70 p-3 dark:bg-white/5">
          <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Media</p>
          <p className="mt-1 text-lg font-bold text-gray-900 dark:text-white">
            {average === null ? '-' : `${formatNumber(average)} ${unit}`}
          </p>
        </div>
        <div className="rounded-xl bg-gray-100/70 p-3 dark:bg-white/5">
          <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Variazione</p>
          <p className="mt-1 text-lg font-bold text-gray-900 dark:text-white">
            {change === null ? '-' : `${change > 0 ? '+' : ''}${formatNumber(change)} ${unit}`}
          </p>
        </div>
      </div>
    </section>
  );
}
