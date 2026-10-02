import { useState } from 'react';
import { signIn, signUp } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Flame, Mail, Lock, User, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';

export function AuthScreen() {
  const { refreshProfile } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (mode === 'signup') {
      if (!displayName.trim()) {
        setError('Inserisci il tuo nome');
        setLoading(false);
        return;
      }
      if (password.length < 6) {
        setError('La password deve avere almeno 6 caratteri');
        setLoading(false);
        return;
      }
      const { error: err } = await signUp(email, password, displayName);
      if (err) {
        setError(err.message);
        setLoading(false);
        return;
      }
      // After signup, session is created automatically
      await refreshProfile();
    } else {
      const { error: err } = await signIn(email, password);
      if (err) {
        setError('Credenziali non valide. Controlla email e password.');
        setLoading(false);
        return;
      }
      await refreshProfile();
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center px-6 max-w-md mx-auto">
      <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center mb-6 shadow-xl">
        <Flame className="w-12 h-12 text-white" strokeWidth={1.5} />
      </div>

      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">NutriPlan</h1>
      <p className="text-sm text-gray-500 mb-8">Il tuo compagno per nutrizione e fitness</p>

      <div className="w-full bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-800">
        <div className="flex gap-2 mb-6 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
          <button
            onClick={() => { setMode('login'); setError(''); }}
            className={`flex-1 py-2.5 rounded-lg font-medium text-sm transition-all ${
              mode === 'login' ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-gray-500'
            }`}
          >
            Accedi
          </button>
          <button
            onClick={() => { setMode('signup'); setError(''); }}
            className={`flex-1 py-2.5 rounded-lg font-medium text-sm transition-all ${
              mode === 'signup' ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-gray-500'
            }`}
          >
            Registrati
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="label">Nome</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  className="input pl-10"
                  placeholder="Il tuo nome"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="label">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                className="input pl-10"
                placeholder="email@esempio.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="label">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                className="input pl-10 pr-10"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-error-50 dark:bg-error-900/20 text-error-600 dark:text-error-400 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : mode === 'login' ? (
              'Accedi'
            ) : (
              'Crea Account'
            )}
          </button>
        </form>
      </div>

      <p className="text-xs text-gray-400 mt-6 text-center">
        I tuoi dati sono protetti e isolati dal resto degli utenti.
      </p>
    </div>
  );
}
