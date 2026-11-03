/*
# Collect foods missing from the database across all accounts

1. New Tables
- `missing_food_reports`: one row per account and food name not found during a diet import.
  - `user_id` (uuid, defaults to the signed-in user, cascades on account deletion)
  - `normalized_name` (lowercase trimmed name, unique per user)
  - `display_name` (name as first written)
  - `times_reported` (how many times this account hit this name)
  - `created_at`, `last_reported_at`

2. Functions
- `report_missing_foods(text[])`: records a batch of names for the caller in one call (runs as the caller, so RLS applies).
- `admin_missing_food_counts()`: returns each missing name with total reports and number of accounts, for administrators only.

3. Security
- RLS enabled. Each user can select, insert, update and delete only their own rows.
- Administrators read aggregated counts only through `admin_missing_food_counts()`, which checks `is_admin` on the caller and exposes no user identifiers.
- `report_missing_foods` is callable by signed-in users only; `admin_missing_food_counts` is callable by signed-in users only and rejects non-admins.

4. Notes
- Idempotent: safe to re-run.
- No existing data is modified or removed.
*/

CREATE TABLE IF NOT EXISTS missing_food_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  normalized_name text NOT NULL CHECK (char_length(normalized_name) BETWEEN 2 AND 80),
  display_name text NOT NULL CHECK (char_length(display_name) BETWEEN 2 AND 80),
  times_reported integer NOT NULL DEFAULT 1 CHECK (times_reported > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  last_reported_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT missing_food_reports_user_name_key UNIQUE (user_id, normalized_name)
);

ALTER TABLE missing_food_reports ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON missing_food_reports TO authenticated;

DROP POLICY IF EXISTS "select_own_missing_food_reports" ON missing_food_reports;
CREATE POLICY "select_own_missing_food_reports" ON missing_food_reports FOR SELECT
TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "insert_own_missing_food_reports" ON missing_food_reports;
CREATE POLICY "insert_own_missing_food_reports" ON missing_food_reports FOR INSERT
TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "update_own_missing_food_reports" ON missing_food_reports;
CREATE POLICY "update_own_missing_food_reports" ON missing_food_reports FOR UPDATE
TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "delete_own_missing_food_reports" ON missing_food_reports;
CREATE POLICY "delete_own_missing_food_reports" ON missing_food_reports FOR DELETE
TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION report_missing_foods(p_names text[])
RETURNS integer
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  IF p_names IS NULL OR array_length(p_names, 1) IS NULL THEN
    RETURN 0;
  END IF;
  IF array_length(p_names, 1) > 200 THEN
    RAISE EXCEPTION 'Too many names';
  END IF;

  INSERT INTO missing_food_reports (normalized_name, display_name, times_reported, last_reported_at)
  SELECT normalized_name, min(display_name), count(*)::integer, now()
  FROM (
    SELECT btrim(regexp_replace(n, '\s+', ' ', 'g')) AS display_name,
           lower(btrim(regexp_replace(n, '\s+', ' ', 'g'))) AS normalized_name
    FROM unnest(p_names) AS n
  ) cleaned
  WHERE char_length(normalized_name) BETWEEN 2 AND 80
  GROUP BY normalized_name
  ON CONFLICT (user_id, normalized_name) DO UPDATE
    SET times_reported = missing_food_reports.times_reported + EXCLUDED.times_reported,
        last_reported_at = now(),
        display_name = EXCLUDED.display_name;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

REVOKE EXECUTE ON FUNCTION report_missing_foods(text[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION report_missing_foods(text[]) TO authenticated;

CREATE OR REPLACE FUNCTION admin_missing_food_counts()
RETURNS TABLE (display_name text, total_reports integer, accounts integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM user_profiles p WHERE p.id = auth.uid() AND p.is_admin = true) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY
  SELECT min(r.display_name)::text,
         sum(r.times_reported)::integer,
         count(DISTINCT r.user_id)::integer
  FROM missing_food_reports r
  GROUP BY r.normalized_name
  ORDER BY sum(r.times_reported) DESC, min(r.display_name);
END;
$$;

REVOKE EXECUTE ON FUNCTION admin_missing_food_counts() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION admin_missing_food_counts() TO authenticated;
