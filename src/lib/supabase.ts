import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
  },
});

const TABLE = 'app_state';
const ROW_ID = 'singleton';

export async function loadRemoteState(): Promise<Record<string, unknown> | null> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('data')
    .eq('id', ROW_ID)
    .maybeSingle();

  if (error) {
    console.warn('Supabase load error:', error.message);
    return null;
  }

  return (data?.data as Record<string, unknown>) ?? null;
}

export async function saveRemoteState(state: Record<string, unknown>): Promise<boolean> {
  const { error } = await supabase
    .from(TABLE)
    .upsert({ id: ROW_ID, data: state, updated_at: new Date().toISOString() });

  if (error) {
    console.warn('Supabase save error:', error.message);
    return false;
  }

  return true;
}
