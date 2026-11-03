import { useState } from 'react';
import type { SeriesPoint } from '@/lib/progressSeries';

interface LineChartProps {
  points: SeriesPoint[];
  unit: string;
  color: string;
  band?: { min: number; max: number };
}

const W = 320;
const H = 180;
const PAD_L = 40;
const PAD_R = 12;
const PAD_T = 12;
const PAD_B = 24;

function formatValue(v: number): string {
  return Math.abs(v) >= 100 ? String(Math.round(v)) : String(Math.round(v * 10) / 10);
}

function shortDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
}

function longDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function LineChart({ points, unit, color, band }: LineChartProps) {
  const [selected, setSelected] = useState<number | null>(null);

  if (points.length === 0) {
    return <p className="text-sm text-gray-500 py-8 text-center">Nessun dato in questo periodo</p>;
  }

  const values = points.map((p) => p.value);
  const rawMin = Math.min(...values, band?.min ?? Infinity);
  const rawMax = Math.max(...values, band?.max ?? -Infinity);
  const spread = rawMax - rawMin || Math.max(Math.abs(rawMax) * 0.1, 1);
  const yMin = rawMin - spread * 0.1;
  const yMax = rawMax + spread * 0.1;

  const times = points.map((p) => Date.parse(`${p.date}T00:00:00`));
  const tMin = Math.min(...times);
  const tMax = Math.max(...times);
  const plotW = W - PAD_L - PAD_R;
  const plotH = H - PAD_T - PAD_B;

  const x = (t: number) => (tMax === tMin ? PAD_L + plotW / 2 : PAD_L + ((t - tMin) / (tMax - tMin)) * plotW);
  const y = (v: number) => PAD_T + (1 - (v - yMin) / (yMax - yMin)) * plotH;

  const coords = points.map((p, i) => ({ x: x(times[i]), y: y(p.value) }));
  const path = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ');
  const gridValues = [yMax, (yMax + yMin) / 2, yMin];
  const active = selected !== null && selected < points.length ? selected : points.length - 1;
  const activePoint = points[active];

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`Grafico con ${points.length} valori`}>
        {band && (
          <rect
            x={PAD_L}
            y={y(band.max)}
            width={plotW}
            height={Math.max(y(band.min) - y(band.max), 0)}
            fill={color}
            opacity={0.12}
          />
        )}
        {gridValues.map((g, i) => (
          <g key={i}>
            <line x1={PAD_L} x2={W - PAD_R} y1={y(g)} y2={y(g)} className="stroke-gray-200 dark:stroke-gray-800" strokeWidth="1" />
            <text x={PAD_L - 6} y={y(g) + 3} textAnchor="end" className="fill-gray-400" fontSize="9">{formatValue(g)}</text>
          </g>
        ))}
        <text x={PAD_L} y={H - 6} textAnchor="start" className="fill-gray-400" fontSize="9">{shortDate(points[0].date)}</text>
        {points.length > 1 && (
          <text x={W - PAD_R} y={H - 6} textAnchor="end" className="fill-gray-400" fontSize="9">{shortDate(points[points.length - 1].date)}</text>
        )}
        <path d={path} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {coords.map((c, i) => (
          <circle
            key={points[i].date + i}
            cx={c.x}
            cy={c.y}
            r={i === active ? 5 : 3.5}
            fill={color}
            className="cursor-pointer"
            onClick={() => setSelected(i)}
          >
            <title>{`${longDate(points[i].date)}: ${formatValue(points[i].value)} ${unit}`}</title>
          </circle>
        ))}
      </svg>
      <div className="mt-2 flex items-center justify-between rounded-xl bg-gray-50 dark:bg-gray-800 px-3 py-2">
        <span className="text-xs text-gray-500">{longDate(activePoint.date)}</span>
        <span className="text-sm font-bold text-gray-900 dark:text-white">
          {formatValue(activePoint.value)} <span className="text-xs font-normal text-gray-500">{unit}</span>
        </span>
      </div>
    </div>
  );
}
