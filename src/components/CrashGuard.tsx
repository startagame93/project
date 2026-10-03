import { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, RotateCcw } from 'lucide-react';
import { clearLocalAppData, claimRecoveryAttempt, hardReset } from '@/lib/localReset';

interface State {
  failed: boolean;
}

export class CrashGuard extends Component<{ children: ReactNode }, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error('app crashed', error);
    clearLocalAppData();
    // First crash in this session: assume corrupted local data and restart once automatically
    if (claimRecoveryAttempt()) window.location.reload();
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-6">
        <div className="w-full max-w-sm text-center space-y-6">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-warning-500/15 flex items-center justify-center">
            <AlertTriangle className="w-7 h-7 text-warning-400" aria-hidden="true" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-semibold">Qualcosa non e andato a buon fine</h1>
            <p className="text-sm text-gray-400 leading-relaxed">
              I dati salvati su questo dispositivo sono stati ripuliti. I dati sincronizzati sul tuo account restano al sicuro.
            </p>
          </div>
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary-600 hover:bg-primary-500 font-medium transition-colors"
            >
              <RefreshCw className="w-4 h-4" aria-hidden="true" /> Riprova
            </button>
            <button
              onClick={() => void hardReset()}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 font-medium transition-colors"
            >
              <RotateCcw className="w-4 h-4" aria-hidden="true" /> Ripristina app da zero
            </button>
            <p className="text-xs text-gray-500">"Ripristina" ti fara rientrare con email e password.</p>
          </div>
        </div>
      </div>
    );
  }
}
