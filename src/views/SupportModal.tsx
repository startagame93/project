import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { createTicket, loadUserTickets, type SupportTicketRow } from '@/lib/supabase';
import { Modal } from '@/components/Modal';
import { MessageCircle, Send, Clock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export function SupportModal({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<SupportTicketRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    (async () => {
      const t = await loadUserTickets();
      setTickets(t);
      setLoading(false);
    })();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    setSending(true);
    const ok = await createTicket(subject, message, user?.email ?? '');
    if (ok) {
      setSuccess(true);
      setSubject('');
      setMessage('');
      const t = await loadUserTickets();
      setTickets(t);
      setTimeout(() => { setSuccess(false); setShowForm(false); }, 1500);
    }
    setSending(false);
  }

  return (
    <Modal open onClose={onClose} title="Supporto" icon={MessageCircle}>
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
        </div>
      ) : (
        <div className="space-y-3">
          {success && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-success-50 dark:bg-success-900/20 text-success-600 dark:text-success-400 text-sm animate-fade-in">
              <CheckCircle2 className="w-4 h-4" />
              Segnalazione inviata con successo!
            </div>
          )}

          {tickets.length > 0 && (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {tickets.map((t) => (
                <div key={t.id} className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{t.subject}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                      t.status === 'open'
                        ? 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400'
                        : 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400'
                    }`}>
                      {t.status === 'open' ? 'Aperto' : 'Chiuso'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-1">{t.message}</p>
                  {t.admin_reply && (
                    <div className="mt-2 p-2 rounded-lg bg-primary-50 dark:bg-primary-900/20">
                      <p className="text-[10px] text-primary-600 dark:text-primary-400 font-medium mb-0.5">Risposta supporto:</p>
                      <p className="text-xs text-gray-700 dark:text-gray-300">{t.admin_reply}</p>
                    </div>
                  )}
                  <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(t.created_at).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              ))}
            </div>
          )}

          {showForm ? (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="label">Oggetto</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Bug, richiesta, domanda..."
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="label">Messaggio</label>
                <textarea
                  className="input min-h-[80px] resize-none"
                  placeholder="Descrivi il problema o la richiesta..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={sending} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4" /> Invia</>}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Annulla</button>
              </div>
            </form>
          ) : (
            <button onClick={() => setShowForm(true)} className="btn-primary w-full flex items-center justify-center gap-2">
              <AlertCircle className="w-4 h-4" /> Nuova segnalazione
            </button>
          )}
        </div>
      )}
    </Modal>
  );
}
