/*
# Restrict profile pictures to inline image data

1. Modified Tables
  - `user_profiles`: new CHECK constraint `user_profiles_avatar_url_inline` on `avatar_url`

2. Security
  - The app only ever stores an inline image (data:image/...) chosen from the device,
    but the column accepted any text. A user could store an attacker-controlled remote
    URL, which the operator's browser would then fetch when opening the users list,
    leaking the operator's IP address and user agent.
  - The constraint allows NULL and inline image data only.

3. Notes
  1. No data is removed: all existing avatar values already satisfy the constraint.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_profiles_avatar_url_inline'
      AND conrelid = 'public.user_profiles'::regclass
  ) THEN
    ALTER TABLE public.user_profiles
      ADD CONSTRAINT user_profiles_avatar_url_inline
      CHECK (avatar_url IS NULL OR avatar_url LIKE 'data:image/%');
  END IF;
END $$;
