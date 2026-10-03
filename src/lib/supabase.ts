import { createClient, type Session, type User } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export interface UserProfileDB {
  id: string;
  email: string;
  display_name: string;
  is_admin: boolean;
  is_banned: boolean;
  height_cm: number;
  weight_kg: number;
  goal: string;
  sex: string;
  age: number;
  activity_level: string;
  avatar_url?: string | null;
}

// === AUTH ===

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { data, error };
}

export async function signUp(email: string, password: string, displayName: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name: displayName } },
  });
  return { data, error };
}

export async function signOut() {
  await supabase.auth.signOut();
  try {
    localStorage.removeItem('nutriplan-state-v1');
  } catch {
    // ignore
  }
}

export async function getCurrentSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function getCurrentUser(): Promise<User | null> {
  const { data } = await supabase.auth.getUser();
  return data.user;
}

export async function getUserProfile(): Promise<UserProfileDB | null> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return null;
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.user.id)
    .maybeSingle();
  if (error) return null;
  return data as UserProfileDB | null;
}

export async function updateProfileMetrics(metrics: {
  height_cm?: number;
  weight_kg?: number;
  goal?: string;
  sex?: string;
  age?: number;
  activity_level?: string;
  display_name?: string;
  avatar_url?: string | null;
}): Promise<boolean> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return false;
  const { error } = await supabase
    .from('user_profiles')
    .update(metrics)
    .eq('id', user.user.id);
  return !error;
}

const FOUNDER_EMAIL = 'grberali.cg@gmail.com';

export function isFounderEmail(email: string): boolean {
  return email.toLowerCase() === FOUNDER_EMAIL;
}

// === APP DATA (per-user JSON blob) ===

export async function loadRemoteState(): Promise<Record<string, unknown> | null> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return null;
  const { data, error } = await supabase
    .from('app_data')
    .select('data')
    .eq('user_id', user.user.id)
    .maybeSingle();
  if (error) return null;
  return (data?.data as Record<string, unknown>) ?? null;
}

export async function saveRemoteState(state: Record<string, unknown>): Promise<boolean> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return false;
  const { error } = await supabase
    .from('app_data')
    .upsert({
      user_id: user.user.id,
      data: state,
      updated_at: new Date().toISOString(),
    });
  return !error;
}

// === SUPPORT TICKETS ===

export async function createTicket(subject: string, message: string, userEmail: string): Promise<boolean> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return false;
  const { error } = await supabase.from('support_tickets').insert({
    user_id: user.user.id,
    user_email: userEmail,
    subject,
    message,
  });
  return !error;
}

export async function loadUserTickets(): Promise<SupportTicketRow[]> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return [];
  const { data, error } = await supabase
    .from('support_tickets')
    .select('*')
    .eq('user_id', user.user.id)
    .order('created_at', { ascending: false });
  if (error) return [];
  return (data ?? []) as SupportTicketRow[];
}

// === ADMIN FUNCTIONS ===

export interface SupportTicketRow {
  id: string;
  user_id: string;
  user_email: string;
  subject: string;
  message: string;
  status: string;
  admin_reply: string | null;
  created_at: string;
}

export interface AdminUserRow {
  id: string;
  email: string;
  display_name: string;
  is_admin: boolean;
  is_banned: boolean;
  created_at: string;
}

export async function adminLoadUsers(): Promise<AdminUserRow[]> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return [];
  return (data ?? []) as AdminUserRow[];
}

export async function adminToggleBan(userId: string, banned: boolean): Promise<boolean> {
  const { error } = await supabase
    .from('user_profiles')
    .update({ is_banned: banned })
    .eq('id', userId);
  return !error;
}

export async function adminLoadTickets(): Promise<SupportTicketRow[]> {
  const { data, error } = await supabase
    .from('support_tickets')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return [];
  return (data ?? []) as SupportTicketRow[];
}

export async function adminReplyTicket(ticketId: string, reply: string, status: string): Promise<boolean> {
  const { error } = await supabase
    .from('support_tickets')
    .update({ admin_reply: reply, status })
    .eq('id', ticketId);
  return !error;
}

// === LEADERBOARD ===

export interface LeaderboardRow {
  display_name: string;
  total_workouts: number;
  total_calories: number;
}

export async function loadLeaderboard(): Promise<LeaderboardRow[]> {
  const { data, error } = await supabase
    .from('app_data')
    .select('data')
    .limit(100);
  if (error || !data) return [];

  const entries: LeaderboardRow[] = [];
  for (const row of data) {
    const d = row.data as Record<string, unknown>;
    const logs = (d.workoutLogs as Array<{ calories: number }>) ?? [];
    const profile = (d.profile as { name: string }) ?? { name: 'Anonimo' };
    const totalCal = logs.reduce((s: number, w) => s + (w.calories || 0), 0);
    if (logs.length > 0) {
      entries.push({
        display_name: profile.name || 'Anonimo',
        total_workouts: logs.length,
        total_calories: totalCal,
      });
    }
  }
  entries.sort((a, b) => b.total_calories - a.total_calories);
  return entries.slice(0, 50);
}
