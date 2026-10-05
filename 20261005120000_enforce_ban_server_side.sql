/*
# Enforce bans at the database level

1. New Functions
  - `is_banned_user()` SECURITY DEFINER: true when the caller's profile has is_banned = true

2. Security
  - app_data: banned users can no longer read, insert, update or delete their own data
    (admins keep full read access through is_app_admin())
  - support_tickets: banned users can no longer open new tickets
  - user_profiles is intentionally untouched so a banned user can still load their own
    profile and see the "banned" screen in the app

3. Notes
  1. No data is removed.
  2. Run this after the previous migrations (it relies on is_app_admin()).
*/

CREATE OR REPLACE FUNCTION is_banned_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((SELECT is_banned FROM user_profiles WHERE id = auth.uid()), false);
$$;
REVOKE EXECUTE ON FUNCTION is_banned_user() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION is_banned_user() TO authenticated;

DROP POLICY IF EXISTS "select_own_app_data" ON app_data;
CREATE POLICY "select_own_app_data" ON app_data FOR SELECT
  TO authenticated USING ((auth.uid() = user_id AND NOT is_banned_user()) OR is_app_admin());

DROP POLICY IF EXISTS "insert_own_app_data" ON app_data;
CREATE POLICY "insert_own_app_data" ON app_data FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id AND NOT is_banned_user());

DROP POLICY IF EXISTS "update_own_app_data" ON app_data;
CREATE POLICY "update_own_app_data" ON app_data FOR UPDATE
  TO authenticated USING (auth.uid() = user_id AND NOT is_banned_user())
  WITH CHECK (auth.uid() = user_id AND NOT is_banned_user());

DROP POLICY IF EXISTS "delete_own_app_data" ON app_data;
CREATE POLICY "delete_own_app_data" ON app_data FOR DELETE
  TO authenticated USING (auth.uid() = user_id AND NOT is_banned_user());

DROP POLICY IF EXISTS "insert_own_tickets" ON support_tickets;
CREATE POLICY "insert_own_tickets" ON support_tickets FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id AND NOT is_banned_user());
