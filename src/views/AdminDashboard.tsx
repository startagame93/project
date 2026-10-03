import { useState, useEffect, useCallback } from 'react';
import {
  adminLoadUsers, adminToggleBan, loadTickets, adminReplyTicket, adminDeleteTicket,
  ONLINE_WINDOW_MS,
  type AdminUserRow, type SupportTicketRow,
} from '@/lib/supabase';
import {
  Users, MessageSquare, Ban, CheckCircle, Send, Loader2, Mail, ChevronDown, ChevronUp,
  Crown, Trash2, RefreshCw, AlertTriangle, Search,
} from 'lucide-react';

type AdminTab = 'users' | 'tickets';

function isOnline(lastSeen: string | null): boolean {
  return !!lastSeen && Date.now() - new Date(lastSeen).getTime() < ONLINE_WINDOW_MS;
}

function lastSeenLabel(lastSeen: string | null): string {
  if (!lastSeen) return 'Mai visto';
  if (isOnline(lastSeen)) return 'Online ora';
  const mins = Math.floor((Date.now() - new Date(lastSeen).getTime()) / 60000);
  if (mins < 60) return `Visto ${mins} min fa`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Visto ${hours} h fa`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `Visto ${days} g fa`;
  return `Visto il ${new Date(lastSeen).toLocaleDateString('it-IT')}`;
}

export function AdminDashboard() {
  const [tab, setTab] = useState<AdminTab>('users');
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [tickets, setTickets] = useState<SupportTicketRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const [u, t] = await Promise.all([adminLoadUsers(), loadTickets()]);
    if (u === null) {
      setError('Impossibile caricare gli utenti. Riprova tra poco.');
    } else {
      setUsers(u);
    }
    setTickets(t);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function toggleBan(u: AdminUserRow) {
    if (!u.is_banned && !confirm(`Bannare ${u.display_name || u.email}? Non potra piu accedere all'app.`)) return;
    setBusyId(u.id);
    const ok = await adminToggleBan(u.id, !u.is_banned);
    if (ok) {
      setUsers((prev) => prev.map((x) => x.id === u.id ? { ...x, is_banned: !u.is_banned } : x));
    } else {
      setError('Operazione non riuscita. Riprova.');
    }
    setBusyId(null);
  }

  const emailById = new Map(users.map((u) => [u.id, u.email]));
  const onlineCount = users.filter((u) => isOnline(u.last_seen_at)).length;
  const q = query.trim().toLowerCase();
  const filteredUsers = q
    ? users.filter((u) => u.email.toLowerCase().includes(q) || (u.display_name || '').toLowerCase().includes(q))
    : users;

  return (
    <div className="space-y-4">
      <div className="card p-4 flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shrink-0">
          <Crown className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900 dark:text-white">Pannello Fondatore</p>
          <p className="text-xs text-gray-500">
            {users.length} iscritti · <span className="text-success-600 dark:text-success-400">{onlineCount} online</span>
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
          aria-label="Aggiorna"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
        {([
          ['users', Users, `Utenti (${users.length})`],
          ['tickets', MessageSquare, `Ticket (${tickets.filter((t) => t.status === 'open').length})`],
        ] as const).map(([key, Icon, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 py-2.5 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-all ${
              tab === key ? 'bg-white dark:bg-gray-700 text-primary-600 shadow-sm' : 'text-gray-500'
            }`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-error-50 dark:bg-error-900/20 text-error-600 dark:text-error-400 text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      ) : tab === 'users' ? (
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              className="input pl-9"
              placeholder="Cerca per nome o email..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="card divide-y divide-gray-100 dark:divide-gray-800 overflow-hidden">
            {filteredUsers.map((u) => {
              const online = isOnline(u.last_seen_at);
              return (
                <div key={u.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <div className="relative shrink-0">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold">
                      {u.avatar_url
                        ? <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                        : (u.display_name || u.email || '?').charAt(0).toUpperCase()}
                    </div>
                    <span
                      className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-gray-900 ${
                        online ? 'bg-success-500' : 'bg-gray-400'
                      }`}
                      aria-label={online ? 'Online' : 'Offline'}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{u.display_name || 'Senza nome'}</p>
                      {u.is_admin && <span className="text-[10px] bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 px-1.5 py-0.5 rounded-full font-bold">ADMIN</span>}
                      {u.is_banned && <span className="text-[10px] bg-error-100 text-error-700 dark:bg-error-900/30 dark:text-error-400 px-1.5 py-0.5 rounded-full font-bold">BANNATO</span>}
                    </div>
                    <p className="text-xs text-gray-500 flex items-center gap-1 truncate">
                      <Mail className="w-3 h-3 shrink-0" /> {u.email}
                    </p>
                    <p className={`text-[11px] mt-0.5 ${online ? 'text-success-600 dark:text-success-400 font-medium' : 'text-gray-400'}`}>
                      {lastSeenLabel(u.last_seen_at)}
                    </p>
                  </div>
                  {!u.is_admin && (
                    <button
                      onClick={() => toggleBan(u)}
                      disabled={busyId === u.id}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all shrink-0 ${
                        u.is_banned
                          ? 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400 hover:bg-success-200'
                          : 'bg-error-100 text-error-700 dark:bg-error-900/30 dark:text-error-400 hover:bg-error-200'
                      }`}
                    >
                      {busyId === u.id
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : u.is_banned ? <><CheckCircle className="w-3.5 h-3.5" /> Sblocca</> : <><Ban className="w-3.5 h-3.5" /> Banna</>}
                    </button>
                  )}
                </div>
              );
            })}
            {filteredUsers.length === 0 && (
              <p className="text-center text-gray-400 py-8 text-sm">Nessun utente trovato</p>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {tickets.map((t) => (
            <TicketCard
              key={t.id}
              ticket={t}
              email={emailById.get(t.user_id)}
              onReply={async (reply) => {
                const ok = await adminReplyTicket(t.id, reply, 'closed');
                if (ok) setTickets((prev) => prev.map((x) => x.id === t.id ? { ...x, admin_reply: reply, status: 'closed' } : x));
                else setError('Risposta non inviata. Riprova.');
              }}
              onDelete={async () => {
                if (!confirm('Eliminare definitivamente questa segnalazione?')) return;
                const ok = await adminDeleteTicket(t.id);
                if (ok) setTickets((prev) => prev.filter((x) => x.id !== t.id));
                else setError('Eliminazione non riuscita. Riprova.');
              }}
            />
          ))}
          {tickets.length === 0 && (
            <p className="text-center text-gray-400 py-8 text-sm">Nessun ticket ricevuto</p>
          )}
        </div>
      )}
    </div>
  );
}

function TicketCard({ ticket, email, onReply, onDelete }: {
  ticket: SupportTicketRow;
  email?: string;
  onReply: (reply: string) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);

  async function handleReply() {
    if (!reply.trim()) return;
    setSending(true);
    await onReply(reply.trim());
    setReply('');
    setSending(false);
  }

  return (
    <div className="card p-4">
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center justify-between text-left gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-gray-900 dark:text-white truncate">{ticket.subject}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full shrink-0 ${
              ticket.status === 'open'
                ? 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400'
                : 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400'
            }`}>
              {ticket.status === 'open' ? 'Aperto' : 'Risolto'}
            </span>
          </div>
          <p className="text-xs text-gray-500 truncate">{ticket.author_name}{email ? ` · ${email}` : ''}</p>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>

      {expanded && (
        <div className="mt-3 space-y-2 animate-fade-in">
          <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800">
            <p className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{ticket.message}</p>
            <p className="text-[10px] text-gray-400 mt-1">{new Date(ticket.created_at).toLocaleString('it-IT')}</p>
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
                placeholder="Rispondi e segna come risolto..."
                value={reply}
                onChange={(e) => setReply(e.target.value)}
              />
              <button onClick={handleReply} disabled={sending || !reply.trim()} className="btn-primary px-3" aria-label="Invia risposta">
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          )}

          <button
            onClick={onDelete}
            className="w-full py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-900/20 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" /> Elimina dalla bacheca
          </button>
        </div>
      )}
    </div>
  );
}
