import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { calcBMR, calcTDEE, calcLeanMass, calcBMI, getBodyStatus, getBodyAdvice, uid, todayISO, type BodyStatus } from '@/lib/data';
import { Sheet } from '@/components/Sheet';
import { Modal } from '@/components/Modal';
import { ACTIVITY_LEVELS, type BodyMetric, type UserProfile, type Sex } from '@/types';
import {
  Scale, Plus, TrendingDown, TrendingUp, Activity, Ruler, Trash2,
  Calculator, Flame, Target, AlertTriangle, CheckCircle, Info,
} from 'lucide-react';

const STATUS_CONFIG: Record<BodyStatus, { label: string; color: string; bg: string; icon: typeof Info }> = {
  sottopeso: { label: 'Sottopeso', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20', icon: AlertTriangle },
  normopeso: { label: 'Normopeso', color: 'text-success-600 dark:text-success-400', bg: 'bg-success-50 dark:bg-success-900/20', icon: CheckCircle },
  sovrappeso: { label: 'Sovrappeso', color: 'text-warning-600 dark:text-warning-400', bg: 'bg-warning-50 dark:bg-warning-900/20', icon: AlertTriangle },
  obeso: { label: 'Obeso', color: 'text-error-600 dark:text-error-400', bg: 'bg-error-50 dark:bg-error-900/20', icon: AlertTriangle },
};

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

  const bmi = calcBMI(state.profile.weight, state.profile.height);
  const bodyStatus = getBodyStatus(bmi);
  const statusCfg = STATUS_CONFIG[bodyStatus];
  const advice = getBodyAdvice(bodyStatus, state.profile.goal);
  const StatusIcon = statusCfg.icon;

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
      {/* BMI + Body Status */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-5 h-5 text-primary-600" />
          <h2 className="section-title">Valutazione Corporea</h2>
        </div>
        <div className={`p-4 rounded-xl ${statusCfg.bg} mb-3`}>
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-xs text-gray-500">BMI (Indice di Massa Corporea)</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{bmi}</p>
            </div>
            <div className="flex flex-col items-end">
              <StatusIcon className={`w-8 h-8 ${statusCfg.color} mb-1`} />
              <span className={`text-sm font-bold ${statusCfg.color}`}>{statusCfg.label}</span>
            </div>
          </div>
          {/* BMI scale bar */}
          <div className="flex h-2 rounded-full overflow-hidden mt-2">
            <div className="flex-[18.5] bg-blue-400"></div>
            <div className="flex-[6.5] bg-success-400"></div>
            <div className="flex-[5] bg-warning-400"></div>
            <div className="flex-[5] bg-error-400"></div>
          </div>
          <div className="flex justify-between text-[9px] text-gray-400 mt-1">
            <span>18.5</span>
            <span>25</span>
            <span>30</span>
          </div>
        </div>
        <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-primary-500 shrink-0 mt-0.5" />
            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{advice}</p>
          </div>
        </div>
      </div>

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
            <MetricBox icon={Ruler} label="Petto" value={latest.chest ? `${latest.chest}` : '-'} unit="cm" />
            <MetricBox icon={Ruler} label="Fianchi" value={latest.hip ? `${latest.hip}` : '-'} unit="cm" />
            <MetricBox icon={Ruler} label="Braccio" value={latest.arm ? `${latest.arm}` : '-'} unit="cm" />
            <MetricBox icon={Ruler} label="Coscia" value={latest.thigh ? `${latest.thigh}` : '-'} unit="cm" />
          </div>
        </div>
      )}

      {/* Progress chart */}
      {chartData ? (
        <div className="card p-5">
          <h2 className="section-title mb-3">Progressi nel Tempo</h2>
          <svg viewBox={`0 0 ${chartData.width} ${chartData.height}`} className="w-full">
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
            <path d={chartData.pathW} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d={chartData.pathF} fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="4 2" />
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
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {[...metrics].reverse().map((m) => (
              <div key={m.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white text-sm">
                    {m.weight} kg · {m.bodyFat}% BF · BMI {calcBMI(m.weight, state.profile.height)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(m.date).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {m.waist && ` · Vita: ${m.waist}cm`}
                    {m.chest && ` · Petto: ${m.chest}cm`}
                    {m.hip && ` · Fianchi: ${m.hip}cm`}
                  </p>
                </div>
                <button onClick={() => deleteMetric(m.id)} className="p-2 text-gray-400 hover:text-error-600 shrink-0">
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
  const [abdomen, setAbdomen] = useState('');
  const [hip, setHip] = useState('');
  const [arm, setArm] = useState('');
  const [thigh, setThigh] = useState('');
  const [neck, setNeck] = useState('');
  const [shoulder, setShoulder] = useState('');
  const [calf, setCalf] = useState('');

  function save() {
    onSave({
      id: uid(),
      date,
      weight,
      bodyFat,
      leanMass: calcLeanMass(weight, bodyFat),
      waist: waist ? +waist : undefined,
      chest: chest ? +chest : undefined,
      abdomen: abdomen ? +abdomen : undefined,
      hip: hip ? +hip : undefined,
      arm: arm ? +arm : undefined,
      thigh: thigh ? +thigh : undefined,
      neck: neck ? +neck : undefined,
      shoulder: shoulder ? +shoulder : undefined,
      calf: calf ? +calf : undefined,
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

        <div className="pt-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Circonferenze (cm)</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Collo</label>
            <input type="number" step="0.1" className="input" value={neck} onChange={(e) => setNeck(e.target.value)} placeholder="opzionale" />
          </div>
          <div>
            <label className="label">Spalle</label>
            <input type="number" step="0.1" className="input" value={shoulder} onChange={(e) => setShoulder(e.target.value)} placeholder="opzionale" />
          </div>
          <div>
            <label className="label">Petto</label>
            <input type="number" step="0.1" className="input" value={chest} onChange={(e) => setChest(e.target.value)} placeholder="opzionale" />
          </div>
          <div>
            <label className="label">Vita</label>
            <input type="number" step="0.1" className="input" value={waist} onChange={(e) => setWaist(e.target.value)} placeholder="opzionale" />
          </div>
          <div>
            <label className="label">Pancia</label>
            <input type="number" step="0.1" className="input" value={abdomen} onChange={(e) => setAbdomen(e.target.value)} placeholder="opzionale" />
          </div>
          <div>
            <label className="label">Fianchi</label>
            <input type="number" step="0.1" className="input" value={hip} onChange={(e) => setHip(e.target.value)} placeholder="opzionale" />
          </div>
          <div>
            <label className="label">Braccio</label>
            <input type="number" step="0.1" className="input" value={arm} onChange={(e) => setArm(e.target.value)} placeholder="opzionale" />
          </div>
          <div>
            <label className="label">Coscia</label>
            <input type="number" step="0.1" className="input" value={thigh} onChange={(e) => setThigh(e.target.value)} placeholder="opzionale" />
          </div>
          <div>
            <label className="label">Polpaccio</label>
            <input type="number" step="0.1" className="input" value={calf} onChange={(e) => setCalf(e.target.value)} placeholder="opzionale" />
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
  const bmi = calcBMI(draft.weight, draft.height);
  const status = getBodyStatus(bmi);

  return (
    <Modal
      open
      onClose={onClose}
      title="Calcolo BMR, TDEE e BMI"
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
            <label className="label">Eta</label>
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
          <label className="label">Livello di Attivita</label>
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
        <div className="grid grid-cols-3 gap-2 pt-2">
          <div className="p-3 rounded-xl bg-primary-50 dark:bg-primary-900/20 text-center">
            <p className="text-xs text-gray-500">BMR</p>
            <p className="text-lg font-bold text-primary-700 dark:text-primary-300">{bmr}</p>
            <p className="text-[10px] text-gray-400">kcal</p>
          </div>
          <div className="p-3 rounded-xl bg-secondary-50 dark:bg-secondary-900/20 text-center">
            <p className="text-xs text-gray-500">TDEE</p>
            <p className="text-lg font-bold text-secondary-700 dark:text-secondary-300">{tdee}</p>
            <p className="text-[10px] text-gray-400">kcal</p>
          </div>
          <div className="p-3 rounded-xl bg-accent-50 dark:bg-accent-900/20 text-center">
            <p className="text-xs text-gray-500">BMI</p>
            <p className="text-lg font-bold text-accent-700 dark:text-accent-300">{bmi}</p>
            <p className="text-[10px] text-gray-400">{STATUS_CONFIG[status].label}</p>
          </div>
        </div>
      </div>
    </Modal>
  );
}
