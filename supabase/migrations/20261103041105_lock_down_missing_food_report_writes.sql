/*
# Lock down direct writes to missing_food_reports

1. Modified Functions
  - `report_missing_foods(text[])` becomes SECURITY DEFINER and checks that the caller
    is signed in, so it can still record reports after the client loses write access.
    It now writes the owner explicitly from auth.uid().

2. Security
  - Revoke all privileges on `missing_food_reports` from `anon` (it had full CRUD grants
    but no policies, so nothing legitimate used them).
  - Revoke INSERT, UPDATE and DELETE from `authenticated`: previously any signed-in user
    could create fake rows or set `times_reported` / `display_name` to arbitrary values
    through the data API, poisoning the operator's "missing foods" list.
  - `authenticated` keeps SELECT, still restricted to their own rows by the existing policy.

3. Notes
  1. No data is removed.
  2. The in-app reporting flow keeps working: it goes through report_missing_foods.
*/

CREATE OR REPLACE FUNCTION public.report_missing_foods(p_names text[])
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_count integer;
  v_user uuid := auth.uid();
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF p_names IS NULL OR array_length(p_names, 1) IS NULL THEN
    RETURN 0;
  END IF;
  IF array_length(p_names, 1) > 200 THEN
    RAISE EXCEPTION 'Too many names';
  END IF;

  INSERT INTO missing_food_reports (user_id, normalized_name, display_name, times_reported, last_reported_at)
  SELECT v_user, normalized_name, min(display_name), count(*)::integer, now()
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
$function$;

REVOKE EXECUTE ON FUNCTION public.report_missing_foods(text[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.report_missing_foods(text[]) TO authenticated;

REVOKE ALL ON TABLE public.missing_food_reports FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON TABLE public.missing_food_reports FROM authenticated;
GRANT SELECT ON TABLE public.missing_food_reports TO authenticated;
