import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { createTicket, loadTickets, adminDeleteTicket, type SupportTicketRow } from '@/lib/supabase';
import { Modal } from '@/components/Modal';
import { MessageCircle, Send, Clock, CheckCircle2, AlertCircle, Loader2, Trash2, User } from 'lucide-react';

export function SupportModal({ onClose }: { onClose: () => void }) {
  const { isAdmin } = useAuth();
  const [error, setError] = useState('');
  const [tickets, setTickets] = useState<SupportTicketRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    (async () => {
      const t = await loadTickets();
      setTickets(t);
      setLoading(false);
    })();
  }, []);

  async function refresh() {
    const t = await loadTickets();
    setTickets(t);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    setSending(true);
    setError('');
    const ok = await createTicket(subject.trim(), message.trim());
    if (!ok) setError('Invio non riuscito. Riprova tra poco.');
    if (ok) {
      setShowForm(false);
      setSuccess(true);
      setSubject('');
      setMessage('');
      await refresh();
      setTimeout(() => { setSuccess(false); }, 2500);
    }
    setSending(false);
  }

  async function handleDelete(ticketId: string) {
    if (!confirm('Eliminare questa segnalazione dalla bacheca?')) return;
    const ok = await adminDeleteTicket(ticketId);
    if (ok) {
      setTickets((prev) => prev.filter((t) => t.id !== ticketId));
    } else {
      setError('Eliminazione non riuscita. Riprova.');
    }
  }

  return (
    <Modal open onClose={onClose} title="Bacheca Segnalazioni" icon={MessageCircle}>
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

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-error-50 dark:bg-error-900/20 text-error-600 dark:text-error-400 text-sm">
              <AlertCircle className="w-4 h-4" /> {error}
            </div>
          )}

          <p className="text-xs text-gray-500">
            Qui puoi vedere tutte le segnalazioni inviate dagli utenti. Se trovi un bug gia segnalato, non serve inserirlo di nuovo.
          </p>

          {tickets.length > 0 && (
            <div className="space-y-2 max-h-60 overflow-y-auto no-scrollbar">
              {tickets.map((t) => (
                <div key={t.id} className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800 relative">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{t.subject}</span>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                        t.status === 'open'
                          ? 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400'
                          : 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400'
                      }`}>
                        {t.status === 'open' ? 'Aperto' : 'Risolto'}
                      </span>
                      {isAdmin && (
                        <button
                          onClick={() => handleDelete(t.id)}
                          className="p-1 rounded-lg hover:bg-error-100 dark:hover:bg-error-900/30 text-gray-400 hover:text-error-500 transition-colors"
                          aria-label="Elimina segnalazione"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mb-1">{t.message}</p>
                  <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-1">
                    <User className="w-3 h-3" />
                    <span>{t.author_name || 'Utente'}</span>
                    <span className="mx-1">·</span>
                    <Clock className="w-3 h-3" />
                    <span>{new Date(t.created_at).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                  {t.admin_reply && (
                    <div className="mt-2 p-2 rounded-lg bg-primary-50 dark:bg-primary-900/20">
                      <p className="text-[10px] text-primary-600 dark:text-primary-400 font-medium mb-0.5">Risposta supporto:</p>
                      <p className="text-xs text-gray-700 dark:text-gray-300">{t.admin_reply}</p>
                    </div>
                  )}
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
