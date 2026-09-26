interface ProgressBarProps {
  value: number;
  max: number;
  color?: string;
  height?: number;
  showOverflow?: boolean;
}

export function ProgressBar({ value, max, color = 'bg-primary-500', height = 8, showOverflow = false }: ProgressBarProps) {
  const pct = Math.min((value / max) * 100, showOverflow ? 100 : 100);
  const overflow = value > max;

  return (
    <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden" style={{ height }}>
      <div
        className={`h-full rounded-full transition-all duration-500 ease-out ${overflow && showOverflow ? 'bg-error-500' : color}`}
        style={{ width: `${Math.max(pct, 0)}%` }}
      />
    </div>
  );
}
