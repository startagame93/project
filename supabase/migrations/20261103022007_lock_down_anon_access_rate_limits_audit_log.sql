/*
# Lock down anonymous access, add rate limiting and security audit log

1. Summary
- Removes all access for the anonymous role from the personal data tables.
- Restricts internal database functions so only the roles that need them can call them.
- Adds two private server-side tables: a rate limit counter and a security audit log readable only by administrators.

2. Security changes
- `app_state`: all anonymous and signed-in policies removed and all grants revoked. The app does not read this table; the data is kept untouched.
- `app_data`, `user_profiles`, `support_tickets`: all grants to the anonymous role revoked. Signed-in access is unchanged and still governed by the existing ownership policies.
- `handle_new_user` and `support_ticket_defaults` (trigger functions): no longer callable through the API.
- `is_app_admin` and `admin_set_ban`: callable only by signed-in users.
- `rate_limit_hits`: new table, no grants to anonymous or signed-in users. Used only through `consume_rate_limit`.
- `security_audit_log`: new table. Administrators can read it; only server-side code can write to it.

3. Notes
- No data is deleted or modified.
- Server-side code uses the service role, which bypasses row level security by design.
*/

ALTER TABLE public.app_state ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS anon_delete_app_state ON public.app_state;
DROP POLICY IF EXISTS anon_insert_app_state ON public.app_state;
DROP POLICY IF EXISTS anon_select_app_state ON public.app_state;
DROP POLICY IF EXISTS anon_update_app_state ON public.app_state;
REVOKE ALL ON public.app_state FROM anon, authenticated;

REVOKE ALL ON public.app_data FROM anon;
REVOKE ALL ON public.user_profiles FROM anon;
REVOKE ALL ON public.support_tickets FROM anon;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.support_ticket_defaults() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_app_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_app_admin() TO authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_set_ban(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_ban(uuid, boolean) TO authenticated;

CREATE TABLE IF NOT EXISTS public.rate_limit_hits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bucket text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS rate_limit_hits_user_bucket_idx
  ON public.rate_limit_hits (user_id, bucket, created_at);

ALTER TABLE public.rate_limit_hits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.rate_limit_hits FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, DELETE ON public.rate_limit_hits TO service_role;

CREATE OR REPLACE FUNCTION public.consume_rate_limit(
  p_user uuid,
  p_bucket text,
  p_max integer,
  p_window_seconds integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext(p_user::text || ':' || p_bucket));

  DELETE FROM public.rate_limit_hits
  WHERE user_id = p_user
    AND bucket = p_bucket
    AND created_at < now() - make_interval(secs => p_window_seconds);

  SELECT count(*) INTO v_count
  FROM public.rate_limit_hits
  WHERE user_id = p_user AND bucket = p_bucket;

  IF v_count >= p_max THEN
    RETURN false;
  END IF;

  INSERT INTO public.rate_limit_hits (user_id, bucket) VALUES (p_user, p_bucket);
  RETURN true;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.consume_rate_limit(uuid, text, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_rate_limit(uuid, text, integer, integer) TO service_role;

CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  event text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb
);

ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.security_audit_log FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.security_audit_log TO authenticated;
GRANT SELECT, INSERT ON public.security_audit_log TO service_role;

DROP POLICY IF EXISTS admin_select_security_audit_log ON public.security_audit_log;
CREATE POLICY admin_select_security_audit_log ON public.security_audit_log
  FOR SELECT
  TO authenticated
  USING (public.is_app_admin());
