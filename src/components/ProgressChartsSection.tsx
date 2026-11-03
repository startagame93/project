import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { todayISO } from '@/lib/data';
import {
  BODY_COMPOSITION_CHARTS, BODY_MEASURE_CHARTS, MICRONUTRIENT_CHARTS, RANGE_OPTIONS,
  buildBodySeries, buildMicroSeries,
  type BodyChartKey, type RangeKey,
} from '@/lib/progressSeries';
import { LineChart } from '@/components/LineChart';
import type { MicronutrientKey } from '@/types';

type Group = 'composizione' | 'misure' | 'micro';

interface ChartOption {
  key: string;
  label: string;
  unit: string;
  min?: number;
  max?: number;
}

const GROUP_OPTIONS: { value: Group; label: string }[] = [
  { value: 'composizione', label: 'Peso' },
  { value: 'misure', label: 'Misure' },
  { value: 'micro', label: 'Micronutrienti' },
];

const GROUP_COLOR: Record<Group, string> = {
  composizione: '#10b981',
  misure: '#0ea5e9',
  micro: '#f59e0b',
};

function optionsFor(group: Group): ChartOption[] {
  if (group === 'composizione') return BODY_COMPOSITION_CHARTS;
  if (group === 'misure') return BODY_MEASURE_CHARTS;
  return MICRONUTRIENT_CHARTS;
}

export function ProgressChartsSection() {
  const { state } = useApp();
  const [group, setGroup] = useState<Group>('composizione');
  const [key, setKey] = useState<string>(BODY_COMPOSITION_CHARTS[0].key);
  const [range, setRange] = useState<RangeKey>('3m');

  const today = todayISO();
  const options = optionsFor(group);
  const def = options.find((o) => o.key === key) ?? options[0];

  const points = group === 'micro'
    ? buildMicroSeries(state.micronutrientLogs, def.key as MicronutrientKey, range, today)
    : buildBodySeries(state.bodyMetrics, def.key as BodyChartKey, range, today);

  const hasNoData = group === 'micro' ? state.micronutrientLogs.length === 0 : state.bodyMetrics.length === 0;
  const delta = points.length >= 2 ? points[points.length - 1].value - points[0].value : null;
  const band = def.min !== undefined && def.max !== undefined ? { min: def.min, max: def.max } : undefined;

  function changeGroup(next: Group) {
    setGroup(next);
    setKey(optionsFor(next)[0].key);
  }

  return (
    <div className="card p-5 space-y-4">
      <div>
        <h2 className="section-title">Progressi nel tempo</h2>
        <p className="text-xs text-gray-500 mt-0.5">Come cambiano peso, misure e micronutrienti.</p>
      </div>

      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl" role="tablist" aria-label="Gruppo di grafici">
        {GROUP_OPTIONS.map((g) => (
          <button
            key={g.value}
            role="tab"
            aria-selected={group === g.value}
            onClick={() => changeGroup(g.value)}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
              group === g.value ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            {g.label}
          </button>
        ))}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1" role="radiogroup" aria-label="Dato da visualizzare">
        {options.map((o) => (
          <button
            key={o.key}
            role="radio"
            aria-checked={key === o.key}
            onClick={() => setKey(o.key)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              key === o.key ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>

      <div className="flex gap-1.5" role="radiogroup" aria-label="Periodo">
        {RANGE_OPTIONS.map((r) => (
          <button
            key={r.value}
            role="radio"
            aria-checked={range === r.value}
            onClick={() => setRange(r.value)}
            className={`flex-1 rounded-lg py-1.5 text-xs font-medium border transition-colors ${
              range === r.value
                ? 'border-primary-500 text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-900/20'
                : 'border-gray-200 dark:border-gray-700 text-gray-500'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {hasNoData ? (
        <div className="py-6 text-center">
          <p className="text-sm text-gray-500">
            {group === 'micro'
              ? 'Registra i micronutrienti nella sezione Nutrizione per vedere il loro andamento.'
              : 'Aggiungi una misurazione per iniziare a vedere i grafici.'}
          </p>
        </div>
      ) : (
        <>
          <LineChart points={points} unit={def.unit} color={GROUP_COLOR[group]} band={band} />
          {band && (
            <p className="text-[11px] text-gray-400 text-center">
              Fascia consigliata: {band.min}-{band.max} {def.unit} (area colorata)
            </p>
          )}
          {delta !== null && (
            <p className="text-xs text-gray-500 text-center">
              Variazione nel periodo: <span className="font-semibold text-gray-900 dark:text-white">{delta > 0 ? '+' : ''}{Math.round(delta * 10) / 10} {def.unit}</span>
            </p>
          )}
        </>
      )}
    </div>
  );
}
