import { useState, useRef } from 'react';
import { useApp, mergeState, type SyncStatus } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { signOut, updateProfileMetrics } from '@/lib/supabase';
import { PALETTES, paletteSwatch } from '@/lib/palettes';
import { buildCsv, downloadFile } from '@/lib/exportData';
import { Modal } from '@/components/Modal';
import { AiKeySection } from '@/components/AiKeySection';
import { MissingFoodsSection } from '@/components/MissingFoodsSection';
import type { Theme, NotificationConfig, AppState } from '@/types';
import {
  User, Bell, Moon, Sun, Monitor, ShoppingBag, Trash2, Save,
  Droplet, Utensils, Pill, Info, Download, Upload, HardDrive, LogOut,
  Camera, Flame, Check, FileSpreadsheet, Cloud, CloudOff, CheckCircle2, AlertCircle, Loader2, RefreshCw,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export function SettingsView({ onNavigate }: { onNavigate: (tab: 'shopping') => void }) {
  const { state, setState, theme, setTheme, setPalette } = useApp();
  const { profile, refreshProfile, displayName: authName } = useAuth();
  const [showProfile, setShowProfile] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const displayName = authName || state.profile.name || 'Atleta';
  const avatarUrl = profile?.avatar_url;

  function handleLogout() {
    if (!confirm('Sei sicuro di voler uscire? I tuoi dati rimangono salvati sul tuo account.')) return;
    signOut();
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const dataUrl = reader.result as string;
        // Truncate to reasonable size for DB storage (base64)
        const truncated = dataUrl.length > 500000 ? dataUrl.substring(0, 500000) : dataUrl;
        await updateProfileMetrics({ avatar_url: truncated });
        await refreshProfile();
        setUploadingAvatar(false);
      };
      reader.readAsDataURL(file);
    } catch {
      setUploadingAvatar(false);
    }
    e.target.value = '';
  }

  function clearAllData() {
    if (!confirm('Sei sicuro di voler cancellare tutti i dati? Questa azione non è reversibile.')) return;
    localStorage.removeItem('nutriplan-state-v1');
    location.reload();
  }

  function updateNotifications(updates: Partial<NotificationConfig>) {
    setState((prev) => ({ ...prev, notifications: { ...prev.notifications, ...updates } }));
  }

  return (
    <div className="space-y-4">
      {/* Profile */}
      <div className="card p-5">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white overflow-hidden">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <User className="w-8 h-8" />
              )}
            </div>
            <label className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary-600 text-white flex items-center justify-center cursor-pointer shadow-md hover:bg-primary-700 transition-colors">
              {uploadingAvatar ? (
                <span className="text-[10px] animate-pulse">...</span>
              ) : (
                <Camera className="w-3.5 h-3.5" />
              )}
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} aria-label="Carica foto profilo" />
            </label>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{displayName}</h2>
            <p className="text-sm text-gray-500">
              {state.profile.sex === 'M' ? 'Uomo' : 'Donna'} · {state.profile.age} anni · {state.profile.weight} kg
            </p>
          </div>
          <button onClick={() => setShowProfile(true)} className="btn-secondary text-xs">
            Modifica
          </button>
        </div>
      </div>

      {/* Theme */}
      <div className="card p-5">
        <h3 className="section-title mb-3">Aspetto</h3>
        <div className="flex gap-2">
          <ThemeBtn active={state.theme === 'light'} onClick={() => setTheme('light')} icon={Sun} label="Chiaro" />
          <ThemeBtn active={state.theme === 'dark'} onClick={() => setTheme('dark')} icon={Moon} label="Scuro" />
          <ThemeBtn active={state.theme === 'system'} onClick={() => setTheme('system')} icon={Monitor} label="Sistema" />
        </div>
        <p className="text-xs font-medium text-gray-500 mt-4 mb-2">Palette colori</p>
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x" role="radiogroup" aria-label="Palette colori">
          {PALETTES.map((p) => {
            const active = (state.palette ?? 'smeraldo') === p.id;
            const sw = paletteSwatch(p);
            return (
              <button
                key={p.id}
                role="radio"
                aria-checked={active}
                onClick={() => setPalette(p.id)}
                className="snap-start shrink-0 flex flex-col items-center gap-1.5 group"
              >
                <span
                  className={`relative w-14 h-14 rounded-2xl shadow-sm overflow-hidden transition-all group-hover:scale-105 ${active ? 'ring-2 ring-offset-2 ring-gray-900 dark:ring-white dark:ring-offset-gray-900' : ''}`}
                  style={{ background: sw.bg }}
                >
                  <span className="absolute left-1.5 right-1.5 top-1.5 h-5 rounded-md" style={{ background: sw.ui }} />
                  <span className="absolute left-1.5 bottom-1.5 w-6 h-3 rounded-full" style={{ background: sw.primary }} />
                  <span className="absolute right-1.5 bottom-1.5 w-3 h-3 rounded-full" style={{ background: sw.accent }} />
                  {active && <Check className="absolute left-1/2 top-2 -translate-x-1/2 w-4 h-4 text-white drop-shadow" />}
                </span>
                <span className={`text-[11px] ${active ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-500'}`}>{p.name}</span>
              </button>
            );
          })}
        </div>
        {PALETTES.find((p) => p.id === state.palette)?.amoled && (
          <p className="text-xs text-gray-400 mt-1">Questa palette usa sempre lo sfondo nero puro.</p>
        )}
      </div>

      {/* Notifications */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="section-title">Notifiche</h3>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={state.notifications.enabled}
              onChange={(e) => updateNotifications({ enabled: e.target.checked })}
            />
            <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 rounded-full peer peer-checked:bg-primary-600 transition-colors">
              <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform mt-0.5 ${state.notifications.enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </div>
          </label>
        </div>
        {state.notifications.enabled ? (
          <div className="space-y-2">
            <NotifRow icon={Utensils} label="Promemoria pasti" active={state.notifications.meals} onToggle={() => updateNotifications({ meals: !state.notifications.meals })} />
            <NotifRow icon={Droplet} label="Promemoria idratazione" active={state.notifications.hydration} onToggle={() => updateNotifications({ hydration: !state.notifications.hydration })} />
            <NotifRow icon={Pill} label="Promemoria integratori" active={state.notifications.supplements} onToggle={() => updateNotifications({ supplements: !state.notifications.supplements })} />
            <button onClick={() => setShowNotif(true)} className="btn-secondary w-full text-xs mt-2">
              Configura orari
            </button>
          </div>
        ) : (
          <p className="text-sm text-gray-400">Attiva le notifiche per ricevere promemoria personalizzati</p>
        )}
      </div>

      {/* Quick links */}
      <div className="card p-2">
        <button onClick={() => onNavigate('shopping')} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
          <ShoppingBag className="w-5 h-5 text-gray-400" />
          <span className="flex-1 text-left font-medium text-gray-900 dark:text-white">Lista della Spesa</span>
          <span className="text-sm text-gray-400">→</span>
        </button>
      </div>

      {/* Backup & Restore */}
      <AiKeySection />

      <BackupRestoreSection state={state} setState={setState} />

      <MissingFoodsSection />

      {/* About */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-2">
          <Info className="w-5 h-5 text-primary-600" />
          <h3 className="section-title">Informazioni</h3>
        </div>
        <p className="text-sm text-gray-500">
          NutriPlan v1.0 - PWA per la gestione completa di dieta, nutrizione, integratori e composizione corporea.
          I dati sono salvati sul dispositivo e sincronizzati nel cloud con il tuo account. Funziona offline: le modifiche si sincronizzano al ritorno della connessione.
        </p>
      </div>

      {/* Logout */}
      <button onClick={handleLogout} className="btn-secondary w-full flex items-center justify-center gap-2 text-error-600 dark:text-error-400 border-error-200 dark:border-error-800">
        <LogOut className="w-4 h-4" /> Esci dall'account
      </button>

      {/* Danger zone */}
      <button onClick={clearAllData} className="btn-danger w-full">
        <Trash2 className="w-4 h-4" /> Cancella dati locali
      </button>

      {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}
      {showNotif && <NotifModal onClose={() => setShowNotif(false)} />}
    </div>
  );

  function ThemeBtn({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: LucideIcon; label: string }) {
    return (
      <button
        onClick={onClick}
        className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 transition-all ${
          active
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
            : 'border-gray-200 dark:border-gray-800 text-gray-400'
        }`}
      >
        <Icon className="w-5 h-5" />
        <span className="text-xs font-medium">{label}</span>
      </button>
    );
  }

  function NotifRow({ icon: Icon, label, active, onToggle }: { icon: LucideIcon; label: string; active: boolean; onToggle: () => void }) {
    return (
      <div className="flex items-center gap-3 py-2">
        <Icon className="w-4 h-4 text-gray-400" />
        <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">{label}</span>
        <label className="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" className="sr-only peer" checked={active} onChange={onToggle} />
          <div className="w-9 h-5 bg-gray-200 dark:bg-gray-700 rounded-full peer peer-checked:bg-primary-600 transition-colors">
            <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform mt-0.5 ${active ? 'translate-x-4' : 'translate-x-0.5'}`} />
          </div>
        </label>
      </div>
    );
  }
}

function ProfileModal({ onClose }: { onClose: () => void }) {
  const { state, setState } = useApp();
  const { refreshProfile, displayName } = useAuth();
  const [name, setName] = useState(displayName || state.profile.name);

  async function save() {
    const clean = name.trim();
    setState((prev) => ({ ...prev, profile: { ...prev.profile, name: clean } }));
    if (clean && await updateProfileMetrics({ display_name: clean })) await refreshProfile();
    onClose();
  }

  return (
    <Modal open onClose={onClose} title="Modifica Profilo" footer={<button onClick={save} className="btn-primary w-full"><Save className="w-4 h-4" /> Salva</button>}>
      <div className="space-y-3">
        <div>
          <label className="label">Nome</label>
          <input className="input" value={name} placeholder="Il tuo nome" onChange={(e) => setName(e.target.value)} />
        </div>
        <p className="text-sm text-gray-400">
          Per modificare i parametri fisici (peso, altezza, età, livello di attività), vai alla sezione Corpo e usa il calcolatore BMR/TDEE.
        </p>
      </div>
    </Modal>
  );
}

function BackupRestoreSection({ state, setState }: { state: AppState; setState: (updater: (prev: AppState) => AppState) => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { online, syncStatus, retrySync } = useApp();

  function exportCsv() {
    try {
      downloadFile(buildCsv(state), `nutriplan-dati-${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv;charset=utf-8');
      setMessage('File CSV esportato: puoi aprirlo con Excel o Fogli Google.');
      setError(null);
    } catch {
      setError('Errore durante l\'esportazione del CSV.');
    }
  }

  function exportBackup() {
    try {
      const data = JSON.stringify(state, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nutriplan-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setMessage('Backup esportato con successo!');
      setError(null);
    } catch {
      setError('Errore durante l\'esportazione del backup.');
    }
  }

  function importBackup(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string);
        if (!parsed.profile || !parsed.weeks) {
          setError('File non valido: mancano i dati principali.');
          return;
        }
        setState(() => mergeState(parsed));
        e.target.value = '';
        setMessage('Backup ripristinato con successo!');
        setError(null);
      } catch {
        setError('Errore: file di backup non valido o danneggiato.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-3">
        <HardDrive className="w-5 h-5 text-primary-600" />
        <h3 className="section-title">Backup & Ripristino</h3>
      </div>
      <p className="text-sm text-gray-500 mb-3">
        Esporta tutti i tuoi dati (dieta, acqua, integratori, allenamenti, misurazioni) in un file da salvare. Puoi ripristinarli in qualsiasi momento.
      </p>
      <SyncBadge online={online} status={syncStatus} onRetry={retrySync} />
      <div className="flex gap-2">
        <button onClick={exportCsv} className="btn-secondary flex-1 text-sm" aria-label="Esporta i dati in formato CSV">
          <FileSpreadsheet className="w-4 h-4" /> CSV
        </button>
        <button onClick={exportBackup} className="btn-secondary flex-1 text-sm" aria-label="Esporta un file di backup dei tuoi dati">
          <Download className="w-4 h-4" /> JSON
        </button>
        <button onClick={() => fileInputRef.current?.click()} className="btn-secondary flex-1 text-sm" aria-label="Ripristina i dati da un file di backup">
          <Upload className="w-4 h-4" /> Ripristina
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={importBackup}
          aria-label="Seleziona file di backup da ripristinare"
        />
      </div>
      {message && (
        <div className="mt-3 p-2.5 rounded-xl bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800">
          <span className="text-sm text-success-700 dark:text-success-300">{message}</span>
        </div>
      )}
      {error && (
        <div className="mt-3 p-2.5 rounded-xl bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800">
          <span className="text-sm text-error-700 dark:text-error-300">{error}</span>
        </div>
      )}
    </div>
  );
}

function SyncBadge({ online, status, onRetry }: { online: boolean; status: SyncStatus; onRetry: () => void }) {
  const view = !online
    ? { tone: 'bg-warning-50 text-warning-800 border-warning-200 dark:bg-warning-900/20 dark:text-warning-300 dark:border-warning-800', Icon: CloudOff, title: 'Offline', text: 'I dati sono salvati sul telefono e verranno sincronizzati al ritorno della rete.', retry: false }
    : status === 'syncing'
      ? { tone: 'bg-accent-50 text-accent-800 border-accent-200 dark:bg-accent-900/20 dark:text-accent-300 dark:border-accent-800', Icon: Loader2, title: 'Sincronizzazione in corso...', text: '', retry: false }
      : status === 'error'
        ? { tone: 'bg-error-50 text-error-700 border-error-200 dark:bg-error-900/20 dark:text-error-300 dark:border-error-800', Icon: AlertCircle, title: 'Sincronizzazione non riuscita', text: 'Il cloud non ha risposto. I dati sono al sicuro sul telefono; nuovo tentativo automatico tra poco.', retry: true }
        : status === 'pending'
          ? { tone: 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700', Icon: Cloud, title: 'Modifiche da sincronizzare', text: 'Alcune modifiche non sono ancora nel cloud.', retry: true }
          : { tone: 'bg-success-50 text-success-800 border-success-200 dark:bg-success-900/20 dark:text-success-300 dark:border-success-800', Icon: CheckCircle2, title: 'Sincronizzato', text: 'Tutti i dati sono salvati nel cloud.', retry: false };
  const { Icon } = view;

  return (
    <div role="status" className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 mb-3 transition-colors duration-300 ${view.tone}`}>
      <Icon className={`w-5 h-5 shrink-0 ${status === 'syncing' && online ? 'animate-spin' : ''}`} aria-hidden="true" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold leading-tight">{view.title}</p>
        {view.text && <p className="text-xs leading-snug mt-0.5 opacity-90">{view.text}</p>}
      </div>
      {view.retry && (
        <button onClick={onRetry} className="shrink-0 inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold bg-white/70 dark:bg-black/20 hover:bg-white dark:hover:bg-black/30 transition-colors">
          <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" /> Riprova
        </button>
      )}
    </div>
  );
}

function NotifModal({ onClose }: { onClose: () => void }) {
  const { state, setState } = useApp();
  const n = state.notifications;

  function update(updates: Partial<NotificationConfig>) {
    setState((prev) => ({ ...prev, notifications: { ...prev.notifications, ...updates } }));
  }

  return (
    <Modal open onClose={onClose} title="Configurazione Notifiche" footer={<button onClick={onClose} className="btn-primary w-full">Fatto</button>}>
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="label">Colazione</label>
            <input type="time" className="input" value={n.mealTimes.Colazione} onChange={(e) => update({ mealTimes: { ...n.mealTimes, Colazione: e.target.value } })} />
          </div>
          <div>
            <label className="label">Pranzo</label>
            <input type="time" className="input" value={n.mealTimes.Pranzo} onChange={(e) => update({ mealTimes: { ...n.mealTimes, Pranzo: e.target.value } })} />
          </div>
          <div>
            <label className="label">Cena</label>
            <input type="time" className="input" value={n.mealTimes.Cena} onChange={(e) => update({ mealTimes: { ...n.mealTimes, Cena: e.target.value } })} />
          </div>
        </div>
        <div>
          <label className="label">Promemoria idratazione (ogni N ore)</label>
          <input type="number" min="1" max="12" className="input" value={n.hydrationInterval} onChange={(e) => update({ hydrationInterval: +e.target.value })} />
        </div>
        <div>
          <label className="label">Promemoria integratori</label>
          <input type="time" className="input" value={n.supplementTime} onChange={(e) => update({ supplementTime: e.target.value })} />
        </div>
      </div>
    </Modal>
  );
}
