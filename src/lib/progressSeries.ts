import { MICRONUTRIENT_TARGETS, type BodyMetric, type MicronutrientKey, type MicronutrientLog } from '@/types';
import { localISO } from '@/lib/data';

export interface SeriesPoint {
  date: string;
  value: number;
}

export type BodyChartKey =
  | 'weight' | 'bodyFat' | 'leanMass'
  | 'waist' | 'chest' | 'abdomen' | 'hip' | 'arm' | 'thigh' | 'neck' | 'shoulder' | 'calf';

export interface BodyChartDef {
  key: BodyChartKey;
  label: string;
  unit: string;
}

export const BODY_COMPOSITION_CHARTS: BodyChartDef[] = [
  { key: 'weight', label: 'Peso', unit: 'kg' },
  { key: 'bodyFat', label: 'Massa grassa', unit: '%' },
  { key: 'leanMass', label: 'Massa magra', unit: 'kg' },
];

export const BODY_MEASURE_CHARTS: BodyChartDef[] = [
  { key: 'waist', label: 'Vita', unit: 'cm' },
  { key: 'abdomen', label: 'Pancia', unit: 'cm' },
  { key: 'chest', label: 'Petto', unit: 'cm' },
  { key: 'shoulder', label: 'Spalle', unit: 'cm' },
  { key: 'neck', label: 'Collo', unit: 'cm' },
  { key: 'arm', label: 'Braccio', unit: 'cm' },
  { key: 'hip', label: 'Fianchi', unit: 'cm' },
  { key: 'thigh', label: 'Coscia', unit: 'cm' },
  { key: 'calf', label: 'Polpaccio', unit: 'cm' },
];

export const MICRONUTRIENT_CHARTS = (Object.keys(MICRONUTRIENT_TARGETS) as MicronutrientKey[]).map((key) => ({
  key,
  label: MICRONUTRIENT_TARGETS[key].label,
  unit: MICRONUTRIENT_TARGETS[key].unit,
  min: MICRONUTRIENT_TARGETS[key].min,
  max: MICRONUTRIENT_TARGETS[key].max,
}));

export type RangeKey = '1m' | '3m' | '1y' | 'all';

export const RANGE_OPTIONS: { value: RangeKey; label: string; days: number | null }[] = [
  { value: '1m', label: '1 mese', days: 30 },
  { value: '3m', label: '3 mesi', days: 90 },
  { value: '1y', label: '1 anno', days: 365 },
  { value: 'all', label: 'Tutto', days: null },
];

function cutoffFor(range: RangeKey, today: string): string | null {
  const days = RANGE_OPTIONS.find((r) => r.value === range)?.days ?? null;
  if (days === null) return null;
  const d = new Date(`${today}T00:00:00`);
  d.setDate(d.getDate() - days);
  return localISO(d);
}

function inRange(date: string, range: RangeKey, today: string): boolean {
  const cutoff = cutoffFor(range, today);
  return cutoff === null || date >= cutoff;
}

export function buildBodySeries(metrics: BodyMetric[], key: BodyChartKey, range: RangeKey, today: string): SeriesPoint[] {
  return metrics
    .filter((m) => inRange(m.date, range, today))
    .map((m) => ({ date: m.date, value: m[key] }))
    .filter((p): p is SeriesPoint => typeof p.value === 'number' && p.value > 0)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function buildMicroSeries(logs: MicronutrientLog[], key: MicronutrientKey, range: RangeKey, today: string): SeriesPoint[] {
  return logs
    .filter((l) => inRange(l.date, range, today))
    .map((l) => ({ date: l.date, value: l[key] }))
    .filter((p): p is SeriesPoint => typeof p.value === 'number' && p.value > 0)
    .sort((a, b) => a.date.localeCompare(b.date));
}
