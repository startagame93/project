import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { todayISO, uid } from '@/lib/data';
import { calcTargetCalories, calcMacroTargets } from '@/lib/data';
import { ProgressRing } from '@/components/ProgressRing';
import { ProgressBar } from '@/components/ProgressBar';
import { Sheet } from '@/components/Sheet';
import {
  Droplet, Flame, Beef, Wheat, Fish, Plus, Check, Pill, FlaskConical,
  Activity, Zap, Dumbbell, Coffee, Citrus, X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  SUPPLEMENT_TYPES, MICRONUTRIENT_TARGETS, type SupplementType, type SupplementLog,
  type MicronutrientKey, type MicronutrientLog,
} from '@/types';

type SubTab = 'macro' | 'supp' | 'micro';

const SUPP_ICONS: Record<SupplementType, LucideIcon> = {
  creatina: FlaskConical,
  caffeina: Coffee,
  preworkout: Zap,
  bcaa: Activity,
  proteine: Dumbbell,
};

export function NutritionView() {
  const { state, setState } = useApp();
  const [subTab, setSubTab] = useState<SubTab>('macro');
  const today = todayISO();

  return (
    <div className="space-y-4">
      {/* Sub-tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
        <SubTabBtn active={subTab === 'macro'} onClick={() => setSubTab('macro')} label="Macro" icon={Flame} />
        <SubTabBtn active={subTab === 'supp'} onClick={() => setSubTab('supp')} label="Integratori" icon={Pill} />
        <SubTabBtn active={subTab === 'micro'} onClick={() => setSubTab('micro')} label="Micro" icon={FlaskConical} />
      </div>

      {subTab === 'macro' && <MacroTab today={today} />}
      {subTab === 'supp' && <SupplementsTab today={today} />}
      {subTab === 'micro' && <MicronutrientsTab today={today} />}
    </div>
  );

  function SubTabBtn({ active, onClick, label, icon: Icon }: { active: boolean; onClick: () => void; label: string; icon: LucideIcon }) {
    return (
      <button
        onClick={onClick}
        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${
          active ? 'bg-white dark:bg-gray-900 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-gray-500'
        }`}
      >
        <Icon className="w-4 h-4" /> {label}
      </button>
    );
  }
}

function MacroTab({ today }: { today: string }) {
  const { state, setState } = useApp();
  const activeWeek = state.weeks.find((w) => w.id === state.activeWeekId) ?? state.weeks[0];
  const dayIdx = (new Date().getDay() + 6) % 7;
  const todayMeals = activeWeek?.days[dayIdx]?.meals ?? [];

  const consumed = {
    cal: todayMeals.filter((m) => m.completed).reduce((s, m) => s + m.calories, 0),
    protein: todayMeals.filter((m) => m.completed).reduce((s, m) => s + m.protein, 0),
    carbs: todayMeals.filter((m) => m.completed).reduce((s, m) => s + m.carbs, 0),
    fat: todayMeals.filter((m) => m.completed).reduce((s, m) => s + m.fat, 0),
    saturatedFat: todayMeals.filter((m) => m.completed).reduce((s, m) => s + m.saturatedFat, 0),
    sugar: todayMeals.filter((m) => m.completed).reduce((s, m) => s + m.sugar, 0),
    fiber: todayMeals.filter((m) => m.completed).reduce((s, m) => s + m.fiber, 0),
    sodium: todayMeals.filter((m) => m.completed).reduce((s, m) => s + m.sodium, 0),
    potassium: todayMeals.filter((m) => m.completed).reduce((s, m) => s + m.potassium, 0),
    calcium: todayMeals.filter((m) => m.completed).reduce((s, m) => s + m.calcium, 0),
    iron: todayMeals.filter((m) => m.completed).reduce((s, m) => s + m.iron, 0),
  };

  const targetCal = calcTargetCalories(state.profile);
  const macroTargets = calcMacroTargets(state.profile);

  const todayWater = state.waterLogs.find((w) => w.date === today)?.glasses ?? 0;

  function setWater(glasses: number) {
    setState((prev) => {
      const logs = [...prev.waterLogs];
      const idx = logs.findIndex((w) => w.date === today);
      if (idx >= 0) logs[idx] = { ...logs[idx], glasses };
      else logs.push({ date: today, glasses });
      return { ...prev, waterLogs: logs };
    });
  }

  const remaining = targetCal - consumed.cal;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Calorie summary */}
      <div className="card p-5 flex items-center gap-5">
        <ProgressRing value={consumed.cal} max={targetCal} size={130} color="#10b981" label={`${consumed.cal}`} sublabel={`/${targetCal}`} />
        <div className="flex-1 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Consumate</span>
            <span className="font-semibold text-gray-900 dark:text-white">{consumed.cal} kcal</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Obiettivo</span>
            <span className="font-semibold text-gray-900 dark:text-white">{targetCal} kcal</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Rimanenti</span>
            <span className={`font-semibold ${remaining >= 0 ? 'text-primary-600' : 'text-error-600'}`}>
              {remaining} kcal
            </span>
          </div>
        </div>
      </div>

      {/* Macro breakdown */}
      <div className="card p-5 space-y-4">
        <h2 className="section-title">Macronutrienti</h2>
        <MacroRow icon={Beef} label="Proteine" value={consumed.protein} max={macroTargets.protein} color="bg-blue-500" unit="g" />
        <MacroRow icon={Wheat} label="Carboidrati" value={consumed.carbs} max={macroTargets.carbs} color="bg-accent-500" unit="g" />
        <MacroRow icon={Fish} label="Grassi" value={consumed.fat} max={macroTargets.fat} color="bg-secondary-500" unit="g" />
      </div>

      {/* Extended nutrients */}
      {(consumed.saturatedFat > 0 || consumed.sugar > 0 || consumed.fiber > 0 || consumed.sodium > 0 || consumed.potassium > 0 || consumed.calcium > 0 || consumed.iron > 0) && (
        <div className="card p-5 space-y-4">
          <h2 className="section-title">Altri Nutrienti (da pasti consumati)</h2>
          <div className="grid grid-cols-2 gap-3">
            <ExtNutrientCard label="Grassi Saturi" value={consumed.saturatedFat} unit="g" color="text-rose-600" />
            <ExtNutrientCard label="Zuccheri" value={consumed.sugar} unit="g" color="text-pink-500" />
            <ExtNutrientCard label="Fibre" value={consumed.fiber} unit="g" color="text-green-600" />
            <ExtNutrientCard label="Sodio" value={consumed.sodium} unit="mg" color="text-orange-500" />
            <ExtNutrientCard label="Potassio" value={consumed.potassium} unit="mg" color="text-teal-500" />
            <ExtNutrientCard label="Calcio" value={consumed.calcium} unit="mg" color="text-amber-600" />
            <ExtNutrientCard label="Ferro" value={consumed.iron} unit="mg" color="text-red-500" />
          </div>
        </div>
      )}

      {/* Water tracking */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Droplet className="w-5 h-5 text-blue-500" />
            <h2 className="section-title">Idratazione</h2>
          </div>
          <span className="text-sm font-medium text-gray-500">{todayWater} / 8 bicchieri</span>
        </div>
        <div className="grid grid-cols-8 gap-1.5">
          {Array.from({ length: 8 }).map((_, i) => (
            <button
              key={i}
              onClick={() => setWater(i < todayWater ? i : i + 1)}
              className={`aspect-square rounded-lg flex items-center justify-center transition-all ${
                i < todayWater
                  ? 'bg-blue-500 text-white scale-100'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-300 dark:text-gray-700'
              }`}
            >
              <Droplet className="w-4 h-4" fill={i < todayWater ? 'currentColor' : 'none'} />
            </button>
          ))}
        </div>
        <div className="flex gap-2 mt-3">
          <button onClick={() => setWater(Math.max(0, todayWater - 1))} className="btn-secondary flex-1 text-xs">
            <X className="w-3.5 h-3.5" /> Rimuovi
          </button>
          <button onClick={() => setWater(Math.min(8, todayWater + 1))} className="btn-primary flex-1 text-xs">
            <Plus className="w-3.5 h-3.5" /> Aggiungi
          </button>
        </div>
      </div>
    </div>
  );
}

function MacroRow({ icon: Icon, label, value, max, color, unit }: {
  icon: LucideIcon; label: string; value: number; max: number; color: string; unit: string;
}) {
  const pct = Math.round((value / max) * 100);
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          <Icon className="w-4 h-4 text-gray-400" /> {label}
        </span>
        <span className="text-sm text-gray-500">{value} / {max}{unit} ({pct}%)</span>
      </div>
      <ProgressBar value={value} max={max} color={color} height={8} showOverflow />
    </div>
  );
}

function ExtNutrientCard({ label, value, unit, color }: { label: string; value: number; unit: string; color: string }) {
  return (
    <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
      <p className={`text-lg font-bold ${color}`}>{value}{unit}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}

function SupplementsTab({ today }: { today: string }) {
  const { state, setState } = useApp();
  const [adding, setAdding] = useState(false);

  const todayLogs = state.supplementLogs.filter((s) => s.date === today);

  function toggleTaken(id: string) {
    setState((prev) => ({
      ...prev,
      supplementLogs: prev.supplementLogs.map((s) => s.id === id ? { ...s, taken: !s.taken } : s),
    }));
  }

  function addSupplement(type: SupplementType, dose: number) {
    const log: SupplementLog = {
      id: uid(),
      date: today,
      type,
      dose,
      taken: false,
      timing: 'altro',
    };
    setState((prev) => ({ ...prev, supplementLogs: [...prev.supplementLogs, log] }));
    setAdding(false);
  }

  function deleteSupplement(id: string) {
    setState((prev) => ({ ...prev, supplementLogs: prev.supplementLogs.filter((s) => s.id !== id) }));
  }

  const takenCount = todayLogs.filter((s) => s.taken).length;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="card p-4 flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">Integratori di oggi</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{takenCount} / {todayLogs.length}</p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center">
          <Pill className="w-6 h-6 text-accent-600 dark:text-accent-400" />
        </div>
      </div>

      {/* Creatina info */}
      <div className="card p-4 border-l-4 border-l-accent-500">
        <div className="flex items-center gap-2 mb-1">
          <FlaskConical className="w-5 h-5 text-accent-600" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Creatina - Fase di Acccumulo</h3>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Durante la fase di accumulo (5-7 giorni): 20g/giorno divisi in 4 dosi. Poi mantenimento: 3-5g/giorno.
          L'accumulo muscolare avviene grazie all'idratazione cellulare.
        </p>
      </div>

      {/* Today's supplements */}
      <div className="space-y-2">
        {todayLogs.length === 0 && (
          <div className="card p-8 text-center">
            <Pill className="w-10 h-10 text-gray-300 dark:text-gray-700 mx-auto mb-2" />
            <p className="text-gray-500">Nessun integratore registrato oggi</p>
          </div>
        )}
        {todayLogs.map((log) => {
          const def = SUPPLEMENT_TYPES.find((s) => s.value === log.type)!;
          const Icon = SUPP_ICONS[log.type];
          return (
            <div key={log.id} className={`card p-4 flex items-center gap-3 ${log.taken ? 'opacity-60' : ''}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                log.taken ? 'bg-success-100 dark:bg-success-900/30' : 'bg-accent-100 dark:bg-accent-900/30'
              }`}>
                <Icon className={`w-5 h-5 ${log.taken ? 'text-success-600' : 'text-accent-600 dark:text-accent-400'}`} />
              </div>
              <div className="flex-1">
                <p className={`font-semibold text-gray-900 dark:text-white ${log.taken ? 'line-through' : ''}`}>{def.label}</p>
                <p className="text-sm text-gray-500">{log.dose}{def.unit} · {log.timing}</p>
              </div>
              <button onClick={() => toggleTaken(log.id)} className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                log.taken ? 'bg-success-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
              }`}>
                <Check className="w-4 h-4" strokeWidth={3} />
              </button>
              <button onClick={() => deleteSupplement(log.id)} className="w-9 h-9 rounded-lg flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-400 hover:text-error-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>

      <button onClick={() => setAdding(true)} className="btn-primary w-full">
        <Plus className="w-4 h-4" /> Aggiungi Integratore
      </button>

      {adding && (
        <Sheet open onClose={() => setAdding(false)} title="Aggiungi Integratore">
          <div className="space-y-2">
            {SUPPLEMENT_TYPES.map((s) => {
              const Icon = SUPP_ICONS[s.value];
              return (
                <button
                  key={s.value}
                  onClick={() => addSupplement(s.value, s.defaultDose)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors text-left"
                >
                  <Icon className="w-5 h-5 text-accent-600" />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">{s.label}</p>
                    <p className="text-xs text-gray-500">Dose default: {s.defaultDose}{s.unit}</p>
                  </div>
                  <Plus className="w-4 h-4 text-gray-400" />
                </button>
              );
            })}
          </div>
        </Sheet>
      )}
    </div>
  );
}

function MicronutrientsTab({ today }: { today: string }) {
  const { state, setState } = useApp();
  const [editing, setEditing] = useState(false);

  const todayLog = state.micronutrientLogs.find((m) => m.date === today) ?? {
    id: uid(), date: today, sodium: 0, potassium: 0, magnesium: 0, calcium: 0,
    iron: 0, vitaminC: 0, vitaminD: 0, vitaminB12: 0, zinc: 0,
  };

  function updateMicro(key: MicronutrientKey, value: number) {
    setState((prev) => {
      const logs = [...prev.micronutrientLogs];
      const idx = logs.findIndex((m) => m.date === today);
      const updated = { ...(idx >= 0 ? logs[idx] : todayLog), [key]: value, date: today };
      if (idx >= 0) logs[idx] = updated;
      else logs.push(updated as MicronutrientLog);
      return { ...prev, micronutrientLogs: logs };
    });
  }

  const microKeys = Object.keys(MICRONUTRIENT_TARGETS) as MicronutrientKey[];

  function getStatus(key: MicronutrientKey): 'low' | 'ok' | 'high' {
    const val = todayLog[key] as number;
    const target = MICRONUTRIENT_TARGETS[key];
    if (val < target.min) return 'low';
    if (val > target.max) return 'high';
    return 'ok';
  }

  const statusColors = {
    low: { bar: 'bg-warning-500', chip: 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-300', label: 'Carenza' },
    ok: { bar: 'bg-success-500', chip: 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-300', label: 'Ottimale' },
    high: { bar: 'bg-error-500', chip: 'bg-error-100 text-error-700 dark:bg-error-900/30 dark:text-error-300', label: 'Eccesso' },
  };

  const lowCount = microKeys.filter((k) => getStatus(k) === 'low').length;
  const highCount = microKeys.filter((k) => getStatus(k) === 'high').length;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card p-3 text-center">
          <p className="text-2xl font-bold text-success-600">{microKeys.length - lowCount - highCount}</p>
          <p className="text-xs text-gray-500">Ottimali</p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-2xl font-bold text-warning-600">{lowCount}</p>
          <p className="text-xs text-gray-500">Carenze</p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-2xl font-bold text-error-600">{highCount}</p>
          <p className="text-xs text-gray-500">Eccessi</p>
        </div>
      </div>

      {/* Micronutrient list */}
      <div className="space-y-2">
        {microKeys.map((key) => {
          const target = MICRONUTRIENT_TARGETS[key];
          const val = todayLog[key] as number;
          const status = getStatus(key);
          const colors = statusColors[status];
          const pct = Math.min((val / target.max) * 100, 100);
          return (
            <div key={key} className="card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-900 dark:text-white">{target.label}</span>
                <span className={`chip ${colors.chip}`}>{colors.label}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <ProgressBar value={val} max={target.max} color={colors.bar} height={8} showOverflow />
                </div>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400 shrink-0 w-20 text-right">
                  {val} / {target.min}-{target.max} {target.unit}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <button onClick={() => setEditing(true)} className="btn-primary w-full">
        <Plus className="w-4 h-4" /> Registra Assunzione
      </button>

      {editing && (
        <Sheet open onClose={() => setEditing(false)} title="Registra Micronutrienti" icon={FlaskConical}>
          <div className="space-y-3">
            {microKeys.map((key) => {
              const target = MICRONUTRIENT_TARGETS[key];
              const val = todayLog[key] as number;
              return (
                <div key={key}>
                  <label className="label">{target.label} ({target.unit})</label>
                  <input
                    type="number"
                    className="input"
                    value={val || ''}
                    placeholder={`Range: ${target.min}-${target.max}`}
                    onChange={(e) => updateMicro(key, +e.target.value)}
                  />
                </div>
              );
            })}
            <button onClick={() => setEditing(false)} className="btn-primary w-full">
              <Check className="w-4 h-4" /> Salva
            </button>
          </div>
        </Sheet>
      )}
    </div>
  );
}
