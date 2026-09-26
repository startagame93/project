import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { calcBMR, calcTDEE, calcLeanMass, uid, todayISO } from '@/lib/data';
import { Sheet } from '@/components/Sheet';
import { Modal } from '@/components/Modal';
import { ACTIVITY_LEVELS, type BodyMetric, type UserProfile, type Sex } from '@/types';
import {
  Scale, Plus, TrendingDown, TrendingUp, Activity, Ruler, Trash2,
  Calculator, Flame, Target,
} from 'lucide-react';

export function BodyView() {
  const { state, setState } = useApp();
  const [adding, setAdding] = useState(false);
  const [showCalc, setShowCalc] = useState(false);

  const metrics = [...state.bodyMetrics].sort((a, b) => a.date.localeCompare(b.date));
  const latest = metrics[metrics.length - 1];
  const first = metrics[0];

  const weightTrend = latest && first ? latest.weight - first.weight : 0;
  const fatTrend = latest && first ? latest.bodyFat - first.bodyFat : 0;

  const bmr = Math.round(calcBMR(state.profile));
  const tdee = calcTDEE(state.profile);

  const chartData = useMemo(() => {
    if (metrics.length === 0) return null;
    const weights = metrics.map((m) => m.weight);
    const fats = metrics.map((m) => m.bodyFat);
    const minW = Math.min(...weights), maxW = Math.max(...weights);
    const minF = Math.min(...fats), maxF = Math.max(...fats);
    const rangeW = maxW - minW || 1;
    const rangeF = maxF - minF || 1;

    const width = 300, height = 140, padding = 20;
    const points = metrics.map((m, i) => {
      const x = padding + (i / Math.max(metrics.length - 1, 1)) * (width - padding * 2);
      const yW = height - padding - ((m.weight - minW) / rangeW) * (height - padding * 2);
      const yF = height - padding - ((m.bodyFat - minF) / rangeF) * (height - padding * 2);
      return { x, yW, yF, date: m.date, weight: m.weight, bodyFat: m.bodyFat };
    });

    const pathW = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.yW}`).join(' ');
    const pathF = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.yF}`).join(' ');

    return { points, pathW, pathF, width, height, minW, maxW, minF, maxF };
  }, [metrics]);

  function addMetric(metric: BodyMetric) {
    setState((prev) => ({
      ...prev,
      bodyMetrics: [...prev.bodyMetrics, metric],
      profile: { ...prev.profile, weight: metric.weight },
    }));
    setAdding(false);
  }

  function deleteMetric(id: string) {
    setState((prev) => ({ ...prev, bodyMetrics: prev.bodyMetrics.filter((m) => m.id !== id) }));
  }

  function updateProfile(updates: Partial<UserProfile>) {
    setState((prev) => ({ ...prev, profile: { ...prev.profile, ...updates } }));
  }

  return (
    <div className="space-y-4">
      {/* BMR/TDEE Calculator */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="section-title">Metabolismo</h2>
          <button onClick={() => setShowCalc(true)} className="text-sm text-primary-600 dark:text-primary-400 font-medium flex items-center gap-1">
            <Calculator className="w-4 h-4" /> Calcola
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-primary-50 dark:bg-primary-900/20">
            <Flame className="w-5 h-5 text-primary-600 mb-1" />
            <p className="text-xs text-gray-500">BMR (Metabolismo Basale)</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{bmr} <span className="text-sm font-normal">kcal</span></p>
          </div>
          <div className="p-3 rounded-xl bg-secondary-50 dark:bg-secondary-900/20">
            <Target className="w-5 h-5 text-secondary-600 mb-1" />
            <p className="text-xs text-gray-500">TDEE (Spesa Totale)</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{tdee} <span className="text-sm font-normal">kcal</span></p>
          </div>
        </div>
      </div>

      {/* Current metrics */}
      {latest && (
        <div className="card p-5">
          <h2 className="section-title mb-3">Ultima Misurazione</h2>
          <div className="grid grid-cols-2 gap-3">
            <MetricBox icon={Scale} label="Peso" value={`${latest.weight}`} unit="kg" trend={weightTrend} />
            <MetricBox icon={Activity} label="Body Fat" value={`${latest.bodyFat}`} unit="%" trend={fatTrend} invertTrend />
            <MetricBox icon={Activity} label="Massa Magra" value={`${calcLeanMass(latest.weight, latest.bodyFat)}`} unit="kg" />
            <MetricBox icon={Ruler} label="Vita" value={latest.waist ? `${latest.waist}` : '-'} unit="cm" />
          </div>
        </div>
      )}

      {/* Progress chart */}
      {chartData ? (
        <div className="card p-5">
          <h2 className="section-title mb-3">Progressi nel Tempo</h2>
          <svg viewBox={`0 0 ${chartData.width} ${chartData.height}`} className="w-full">
            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((t) => (
              <line
                key={t}
                x1={20} x2={chartData.width - 20}
                y1={20 + t * (chartData.height - 40)}
                y2={20 + t * (chartData.height - 40)}
                className="stroke-gray-200 dark:stroke-gray-800"
                strokeWidth="1"
              />
            ))}
            {/* Weight line */}
            <path d={chartData.pathW} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            {/* Body fat line */}
            <path d={chartData.pathF} fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="4 2" />
            {/* Data points */}
            {chartData.points.map((p, i) => (
              <g key={i}>
                <circle cx={p.x} cy={p.yW} r="4" fill="#10b981" />
                <circle cx={p.x} cy={p.yF} r="4" fill="#f59e0b" />
              </g>
            ))}
          </svg>
          <div className="flex items-center gap-4 mt-2 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-primary-500"></span> Peso (kg)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-accent-500" style={{ borderTop: '2px dashed #f59e0b' }}></span> Body Fat (%)
            </span>
          </div>
        </div>
      ) : (
        <div className="card p-8 text-center">
          <Scale className="w-10 h-10 text-gray-300 dark:text-gray-700 mx-auto mb-2" />
          <p className="text-gray-500 mb-4">Nessuna misurazione registrata</p>
        </div>
      )}

      {/* History */}
      {metrics.length > 0 && (
        <div className="card p-5">
          <h2 className="section-title mb-3">Storico Misurazioni</h2>
          <div className="space-y-2">
            {[...metrics].reverse().map((m) => (
              <div key={m.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {m.weight} kg · {m.bodyFat}% BF
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(m.date).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {m.waist && ` · Vita: ${m.waist}cm`}
                  </p>
                </div>
                <button onClick={() => deleteMetric(m.id)} className="p-2 text-gray-400 hover:text-error-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <button onClick={() => setAdding(true)} className="btn-primary w-full">
        <Plus className="w-4 h-4" /> Nuova Misurazione
      </button>

      {adding && <AddMetricSheet onSave={addMetric} onClose={() => setAdding(false)} defaultWeight={latest?.weight ?? state.profile.weight} />}
      {showCalc && <CalcModal profile={state.profile} onUpdate={updateProfile} onClose={() => setShowCalc(false)} />}
    </div>
  );
}

function MetricBox({ icon: Icon, label, value, unit, trend, invertTrend }: {
  icon: typeof Scale; label: string; value: string; unit: string; trend?: number; invertTrend?: boolean;
}) {
  const showTrend = trend !== undefined && trend !== 0;
  const isPositive = invertTrend ? trend! < 0 : trend! > 0;
  return (
    <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
      <div className="flex items-center justify-between mb-1">
        <Icon className="w-4 h-4 text-gray-400" />
        {showTrend && (
          <span className={`flex items-center gap-0.5 text-xs font-medium ${isPositive ? 'text-success-600' : 'text-error-600'}`}>
            {trend! > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(trend!).toFixed(1)}
          </span>
        )}
      </div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-lg font-bold text-gray-900 dark:text-white">{value} <span className="text-xs font-normal">{unit}</span></p>
    </div>
  );
}

function AddMetricSheet({ onSave, onClose, defaultWeight }: {
  onSave: (m: BodyMetric) => void; onClose: () => void; defaultWeight: number;
}) {
  const [date, setDate] = useState(todayISO());
  const [weight, setWeight] = useState(defaultWeight);
  const [bodyFat, setBodyFat] = useState(15);
  const [waist, setWaist] = useState('');
  const [chest, setChest] = useState('');
  const [hip, setHip] = useState('');
  const [arm, setArm] = useState('');
  const [thigh, setThigh] = useState('');

  function save() {
    onSave({
      id: uid(),
      date,
      weight,
      bodyFat,
      leanMass: calcLeanMass(weight, bodyFat),
      waist: waist ? +waist : undefined,
      chest: chest ? +chest : undefined,
      hip: hip ? +hip : undefined,
      arm: arm ? +arm : undefined,
      thigh: thigh ? +thigh : undefined,
    });
  }

  return (
    <Sheet open onClose={onClose} title="Nuova Misurazione" icon={Scale}>
      <div className="space-y-3">
        <div>
          <label className="label">Data</label>
          <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Peso (kg)</label>
            <input type="number" step="0.1" className="input" value={weight} onChange={(e) => setWeight(+e.target.value)} />
          </div>
          <div>
            <label className="label">Body Fat (%)</label>
            <input type="number" step="0.1" className="input" value={bodyFat} onChange={(e) => setBodyFat(+e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Vita (cm)</label>
            <input type="number" step="0.1" className="input" value={waist} onChange={(e) => setWaist(e.target.value)} />
          </div>
          <div>
            <label className="label">Torace (cm)</label>
            <input type="number" step="0.1" className="input" value={chest} onChange={(e) => setChest(e.target.value)} />
          </div>
          <div>
            <label className="label">Fianchi (cm)</label>
            <input type="number" step="0.1" className="input" value={hip} onChange={(e) => setHip(e.target.value)} />
          </div>
          <div>
            <label className="label">Braccio (cm)</label>
            <input type="number" step="0.1" className="input" value={arm} onChange={(e) => setArm(e.target.value)} />
          </div>
          <div>
            <label className="label">Coscia (cm)</label>
            <input type="number" step="0.1" className="input" value={thigh} onChange={(e) => setThigh(e.target.value)} />
          </div>
        </div>
        <button onClick={save} className="btn-primary w-full">Salva Misurazione</button>
      </div>
    </Sheet>
  );
}

function CalcModal({ profile, onUpdate, onClose }: {
  profile: UserProfile; onUpdate: (u: Partial<UserProfile>) => void; onClose: () => void;
}) {
  const [draft, setDraft] = useState(profile);

  function save() {
    onUpdate(draft);
    onClose();
  }

  const bmr = Math.round(calcBMR(draft));
  const tdee = calcTDEE(draft);

  return (
    <Modal
      open
      onClose={onClose}
      title="Calcolo BMR e TDEE"
      footer={<button onClick={save} className="btn-primary w-full">Salva Profilo</button>}
    >
      <div className="space-y-3">
        <div>
          <label className="label">Sesso</label>
          <div className="flex gap-2">
            {(['M', 'F'] as Sex[]).map((s) => (
              <button
                key={s}
                onClick={() => setDraft({ ...draft, sex: s })}
                className={`flex-1 py-2.5 rounded-xl font-medium transition-all ${
                  draft.sex === s ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                }`}
              >
                {s === 'M' ? 'Uomo' : 'Donna'}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="label">Età</label>
            <input type="number" className="input" value={draft.age} onChange={(e) => setDraft({ ...draft, age: +e.target.value })} />
          </div>
          <div>
            <label className="label">Peso (kg)</label>
            <input type="number" step="0.1" className="input" value={draft.weight} onChange={(e) => setDraft({ ...draft, weight: +e.target.value })} />
          </div>
          <div>
            <label className="label">Altezza (cm)</label>
            <input type="number" className="input" value={draft.height} onChange={(e) => setDraft({ ...draft, height: +e.target.value })} />
          </div>
        </div>
        <div>
          <label className="label">Livello di Attività</label>
          <select className="input" value={draft.activityLevel} onChange={(e) => setDraft({ ...draft, activityLevel: e.target.value as UserProfile['activityLevel'] })}>
            {ACTIVITY_LEVELS.map((a) => <option key={a.value} value={a.value}>{a.label} - {a.description}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Obiettivo</label>
          <select className="input" value={draft.goal} onChange={(e) => setDraft({ ...draft, goal: e.target.value as UserProfile['goal'] })}>
            <option value="dimagrimento">Dimagrimento (-20%)</option>
            <option value="mantenimento">Mantenimento</option>
            <option value="massa">Aumento massa (+10%)</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="p-3 rounded-xl bg-primary-50 dark:bg-primary-900/20 text-center">
            <p className="text-xs text-gray-500">BMR</p>
            <p className="text-xl font-bold text-primary-700 dark:text-primary-300">{bmr} kcal</p>
          </div>
          <div className="p-3 rounded-xl bg-secondary-50 dark:bg-secondary-900/20 text-center">
            <p className="text-xs text-gray-500">TDEE</p>
            <p className="text-xl font-bold text-secondary-700 dark:text-secondary-300">{tdee} kcal</p>
          </div>
        </div>
      </div>
    </Modal>
  );
}
