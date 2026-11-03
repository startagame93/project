/*
# Bound profile picture size on the server

1. Modified Tables
  - `user_profiles`: new CHECK constraint `user_profiles_avatar_url_max_len` on `avatar_url`

2. Security
  - The app truncates inline profile pictures to 500000 characters in the browser only.
    A signed-in user calling the Data API directly could store an arbitrarily large
    value in their own row, inflating storage and the admin user list.
  - The constraint enforces the same bound server side, with headroom above the
    largest existing value (276139 characters).

3. Notes
  1. No data is removed: all existing avatar values already satisfy the constraint.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_profiles_avatar_url_max_len'
      AND conrelid = 'public.user_profiles'::regclass
  ) THEN
    ALTER TABLE public.user_profiles
      ADD CONSTRAINT user_profiles_avatar_url_max_len
      CHECK (avatar_url IS NULL OR char_length(avatar_url) <= 600000);
  END IF;
END $$;
