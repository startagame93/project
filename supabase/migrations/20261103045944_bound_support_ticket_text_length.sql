/*
# Bound support ticket text on the server

1. Modified Tables
  - `support_tickets`: new CHECK constraints `support_tickets_subject_len` and
    `support_tickets_message_len`

2. Security
  - Subject and message were plain text with no bound. Any signed-in account could
    post multi-megabyte tickets through the Data API, which the operator's board then
    loads in full.
  - The constraints require a non-empty subject up to 200 characters and a non-empty
    message up to 5000 characters.

3. Notes
  1. No data is removed: the longest existing subject is 18 and message 86 characters.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'support_tickets_subject_len'
      AND conrelid = 'public.support_tickets'::regclass
  ) THEN
    ALTER TABLE public.support_tickets
      ADD CONSTRAINT support_tickets_subject_len
      CHECK (char_length(btrim(subject)) BETWEEN 1 AND 200);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'support_tickets_message_len'
      AND conrelid = 'public.support_tickets'::regclass
  ) THEN
    ALTER TABLE public.support_tickets
      ADD CONSTRAINT support_tickets_message_len
      CHECK (char_length(btrim(message)) BETWEEN 1 AND 5000);
  END IF;
END $$;
