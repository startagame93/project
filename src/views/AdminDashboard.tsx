import { useState, useEffect } from 'react';
import {
  adminLoadUsers, adminToggleBan, adminLoadTickets, adminReplyTicket,
  type AdminUserRow, type SupportTicketRow,
} from '@/lib/supabase';
import { signOut } from '@/lib/supabase';
import {
  Shield, Users, MessageSquare, Ban, CheckCircle, Send, Loader2,
  LogOut, Mail, ChevronDown, ChevronUp,
} from 'lucide-react';

type AdminTab = 'users' | 'tickets';

export function AdminDashboard() {
  const [tab, setTab] = useState<AdminTab>('users');
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [tickets, setTickets] = useState<SupportTicketRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [u, t] = await Promise.all([adminLoadUsers(), adminLoadTickets()]);
      setUsers(u);
      setTickets(t);
      setLoading(false);
    })();
  }, []);

  async function toggleBan(userId: string, currentlyBanned: boolean) {
    const ok = await adminToggleBan(userId, !currentlyBanned);
    if (ok) {
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, is_banned: !currentlyBanned } : u));
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-gray-950/90 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-2xl mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary-600" />
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">Dashboard Admin</h1>
          </div>
          <button
            onClick={() => signOut()}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
            aria-label="Esci"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {/* Tabs */}
        <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
          <button
            onClick={() => setTab('users')}
            className={`flex-1 py-2.5 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-all ${
              tab === 'users' ? 'bg-white dark:bg-gray-700 text-primary-600 shadow-sm' : 'text-gray-500'
            }`}
          >
            <Users className="w-4 h-4" /> Utenti ({users.length})
          </button>
          <button
            onClick={() => setTab('tickets')}
            className={`flex-1 py-2.5 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-all ${
              tab === 'tickets' ? 'bg-white dark:bg-gray-700 text-primary-600 shadow-sm' : 'text-gray-500'
            }`}
          >
            <MessageSquare className="w-4 h-4" /> Ticket ({tickets.filter(t => t.status === 'open').length})
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
          </div>
        ) : tab === 'users' ? (
          <div className="space-y-2">
            {users.map((u) => (
              <div key={u.id} className="card p-4 flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{u.display_name || 'Senza nome'}</p>
                    {u.is_admin && <span className="text-[10px] bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 px-1.5 py-0.5 rounded-full font-bold">ADMIN</span>}
                    {u.is_banned && <span className="text-[10px] bg-error-100 text-error-700 dark:bg-error-900/30 dark:text-error-400 px-1.5 py-0.5 rounded-full font-bold">BANNATO</span>}
                  </div>
                  <p className="text-xs text-gray-500 flex items-center gap-1 truncate">
                    <Mail className="w-3 h-3 shrink-0" /> {u.email}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    Registrato: {new Date(u.created_at).toLocaleDateString('it-IT')}
                  </p>
                </div>
                {!u.is_admin && (
                  <button
                    onClick={() => toggleBan(u.id, u.is_banned)}
                    className={`shrink-0 ml-3 px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all ${
                      u.is_banned
                        ? 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400 hover:bg-success-200'
                        : 'bg-error-100 text-error-700 dark:bg-error-900/30 dark:text-error-400 hover:bg-error-200'
                    }`}
                  >
                    {u.is_banned ? <><CheckCircle className="w-3.5 h-3.5" /> Sblocca</> : <><Ban className="w-3.5 h-3.5" /> Banna</>}
                  </button>
                )}
              </div>
            ))}
            {users.length === 0 && (
              <p className="text-center text-gray-400 py-8">Nessun utente registrato</p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {tickets.map((t) => (
              <TicketCard key={t.id} ticket={t} onReply={async (reply) => {
                const ok = await adminReplyTicket(t.id, reply, 'closed');
                if (ok) {
                  setTickets((prev) => prev.map((tk) => tk.id === t.id ? { ...tk, admin_reply: reply, status: 'closed' } : tk));
                }
              }} />
            ))}
            {tickets.length === 0 && (
              <p className="text-center text-gray-400 py-8">Nessun ticket ricevuto</p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function TicketCard({ ticket, onReply }: {
  ticket: SupportTicketRow;
  onReply: (reply: string) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);

  async function handleReply() {
    if (!reply.trim()) return;
    setSending(true);
    await onReply(reply);
    setReply('');
    setSending(false);
  }

  return (
    <div className="card p-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-gray-900 dark:text-white truncate">{ticket.subject}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full shrink-0 ${
              ticket.status === 'open'
                ? 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400'
                : 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400'
            }`}>
              {ticket.status === 'open' ? 'Aperto' : 'Chiuso'}
            </span>
          </div>
          <p className="text-xs text-gray-500">{ticket.user_email}</p>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>

      {expanded && (
        <div className="mt-3 space-y-2 animate-fade-in">
          <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800">
            <p className="text-xs text-gray-600 dark:text-gray-400">{ticket.message}</p>
            <p className="text-[10px] text-gray-400 mt-1">
              {new Date(ticket.created_at).toLocaleString('it-IT')}
            </p>
          </div>

          {ticket.admin_reply && (
            <div className="p-2.5 rounded-lg bg-primary-50 dark:bg-primary-900/20">
              <p className="text-[10px] text-primary-600 dark:text-primary-400 font-medium mb-0.5">Risposta inviata:</p>
              <p className="text-xs text-gray-700 dark:text-gray-300">{ticket.admin_reply}</p>
            </div>
          )}

          {ticket.status === 'open' && (
            <div className="flex gap-2">
              <input
                type="text"
                className="input flex-1"
                placeholder="Scrivi una risposta..."
                value={reply}
                onChange={(e) => setReply(e.target.value)}
              />
              <button
                onClick={handleReply}
                disabled={sending || !reply.trim()}
                className="btn-primary px-3"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
