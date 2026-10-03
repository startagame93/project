/*
# Secure admin checks, presence tracking and public bug board

1. Modified Tables
  - `user_profiles`
    - new `onboarding_completed` (boolean, default false): the welcome tour was finished on any device
    - new `last_seen_at` (timestamptz): last activity, used for the online/offline indicator
  - `support_tickets`
    - new `author_name` (text): public display name of the author, filled by the database

2. New Functions
  - `is_app_admin()` SECURITY DEFINER: checks the caller's admin flag without re-entering
    the user_profiles policies (fixes the self-referencing policy that returned empty lists)
  - `admin_set_ban(p_user uuid, p_banned boolean)`: only admins may ban/unban; admins cannot be banned
  - `support_ticket_defaults()` trigger: forces user_id, user_email, author_name, status and admin_reply on insert

3. Security
  - Users can no longer write `is_admin`, `is_banned`, `email` or `id` on their own profile
    (column-level UPDATE grants only for editable profile fields); client INSERT/DELETE on profiles removed
    (profiles are created by the signup trigger)
  - All admin policies now use `is_app_admin()`
  - Support tickets: readable by every signed-in user (public board), but the `user_email` column
    is no longer readable by clients; only admins may update (reply/close) or delete tickets
  - Founder account is guaranteed to be admin

4. Notes
  1. No data is removed.
  2. Existing tickets get author_name backfilled from profiles.
*/

ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS last_seen_at timestamptz;
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS author_name text NOT NULL DEFAULT '';

CREATE OR REPLACE FUNCTION is_app_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = true);
$$;
REVOKE EXECUTE ON FUNCTION is_app_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION is_app_admin() TO authenticated;

UPDATE user_profiles SET is_admin = true WHERE lower(email) = 'grberali.cg@gmail.com';

-- user_profiles policies
DROP POLICY IF EXISTS "select_own_profile" ON user_profiles;
CREATE POLICY "select_own_profile" ON user_profiles FOR SELECT
  TO authenticated USING (auth.uid() = id OR is_app_admin());

DROP POLICY IF EXISTS "insert_own_profile" ON user_profiles;
DROP POLICY IF EXISTS "delete_own_profile" ON user_profiles;
DROP POLICY IF EXISTS "admin_update_profiles" ON user_profiles;

DROP POLICY IF EXISTS "update_own_profile" ON user_profiles;
CREATE POLICY "update_own_profile" ON user_profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

REVOKE INSERT, UPDATE, DELETE ON user_profiles FROM anon, authenticated;
GRANT UPDATE (display_name, avatar_url, height_cm, weight_kg, goal, sex, age, activity_level, onboarding_completed, last_seen_at)
  ON user_profiles TO authenticated;

CREATE OR REPLACE FUNCTION admin_set_ban(p_user uuid, p_banned boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = true) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  UPDATE user_profiles SET is_banned = p_banned WHERE id = p_user AND is_admin = false;
END;
$$;
REVOKE EXECUTE ON FUNCTION admin_set_ban(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION admin_set_ban(uuid, boolean) TO authenticated;

-- app_data admin read
DROP POLICY IF EXISTS "select_own_app_data" ON app_data;
CREATE POLICY "select_own_app_data" ON app_data FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR is_app_admin());

-- support_tickets
CREATE OR REPLACE FUNCTION support_ticket_defaults()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
  v_name text;
BEGIN
  SELECT email, display_name INTO v_email, v_name FROM user_profiles WHERE id = auth.uid();
  NEW.user_id := auth.uid();
  NEW.user_email := COALESCE(v_email, '');
  NEW.author_name := COALESCE(NULLIF(v_name, ''), split_part(COALESCE(v_email, 'Utente'), '@', 1));
  NEW.status := 'open';
  NEW.admin_reply := NULL;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS support_ticket_defaults_trg ON support_tickets;
CREATE TRIGGER support_ticket_defaults_trg
  BEFORE INSERT ON support_tickets
  FOR EACH ROW EXECUTE FUNCTION support_ticket_defaults();

UPDATE support_tickets t
SET author_name = COALESCE(NULLIF(p.display_name, ''), split_part(t.user_email, '@', 1))
FROM user_profiles p
WHERE p.id = t.user_id AND t.author_name = '';

ALTER TABLE support_tickets ALTER COLUMN user_email SET DEFAULT '';

DROP POLICY IF EXISTS "select_own_tickets" ON support_tickets;
DROP POLICY IF EXISTS "select_all_tickets" ON support_tickets;
CREATE POLICY "select_all_tickets" ON support_tickets FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_tickets" ON support_tickets;
CREATE POLICY "insert_own_tickets" ON support_tickets FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_tickets" ON support_tickets;
CREATE POLICY "admin_update_tickets" ON support_tickets FOR UPDATE
  TO authenticated USING (is_app_admin()) WITH CHECK (is_app_admin());

DROP POLICY IF EXISTS "delete_own_tickets" ON support_tickets;
DROP POLICY IF EXISTS "admin_delete_tickets" ON support_tickets;
CREATE POLICY "admin_delete_tickets" ON support_tickets FOR DELETE
  TO authenticated USING (is_app_admin());

REVOKE SELECT, INSERT, UPDATE ON support_tickets FROM anon, authenticated;
GRANT SELECT (id, user_id, subject, message, status, admin_reply, created_at, author_name) ON support_tickets TO authenticated;
GRANT INSERT (subject, message) ON support_tickets TO authenticated;
GRANT UPDATE (admin_reply, status) ON support_tickets TO authenticated;
