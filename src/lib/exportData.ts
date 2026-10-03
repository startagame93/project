import type { AppState } from '@/types';

function cell(v: unknown): string {
  let s = String(v ?? '');
  // block spreadsheet formula injection
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function buildCsv(state: AppState): string {
  const rows: unknown[][] = [['Data', 'Tipo', 'Descrizione', 'Valore', 'Unita']];
  state.workoutLogs.forEach((w) => rows.push([w.date, 'Allenamento', w.activityName, w.calories, 'kcal']));
  state.waterLogs.forEach((w) => rows.push([w.date, 'Acqua', 'Bicchieri', w.glasses, 'bicchieri']));
  state.bodyMetrics.forEach((b) => rows.push([b.date, 'Peso', 'Misurazione', b.weight, 'kg']));
  state.supplementLogs.forEach((s) => rows.push([s.date, 'Integratore', s.type, s.dose, s.taken ? 'preso' : 'non preso']));
  Object.entries(state.mealHistory ?? {}).forEach(([date, meals]) =>
    meals.forEach((m) => rows.push([date, `Pasto (${m.type})`, m.name, m.calories, 'kcal'])));
  state.weeks.forEach((week) => week.days.forEach((day) => day.meals.forEach((m) =>
    rows.push([`${week.label} - ${day.day}`, `Piano (${m.type})`, m.name, m.calories, 'kcal']))));
  const [header, ...body] = rows;
  body.sort((a, b) => String(a[0]).localeCompare(String(b[0])));
  return '\uFEFF' + [header, ...body].map((r) => r.map(cell).join(';')).join('\n');
}

export function downloadFile(content: string, fileName: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}
