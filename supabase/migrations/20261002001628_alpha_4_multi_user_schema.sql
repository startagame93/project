/*
# NutriPlan Alpha 4.0 — Multi-user schema with admin support

## Overview
Migrates from single-tenant JSON blob to a proper multi-user relational schema.
Each user has isolated data via RLS policies scoped to auth.uid().
Includes admin role detection, support tickets, and user management.

## New Tables

1. `user_profiles`
   - `id` (uuid, PK, FK to auth.users, CASCADE)
   - `email` (text, unique)
   - `display_name` (text)
   - `is_admin` (boolean, default false) — only set true for the founder account
   - `is_banned` (boolean, default false)
   - `height_cm` (numeric) — collected during onboarding
   - `weight_kg` (numeric)
   - `goal` (text: dimagrimento/mantenimento/massa)
   - `sex` (text: M/F)
   - `age` (integer)
   - `activity_level` (text)
   - `created_at` (timestamptz)

2. `app_data`
   - `id` (uuid, PK)
   - `user_id` (uuid, FK to auth.users, CASCADE, DEFAULT auth.uid())
   - `data` (jsonb) — the full AppState JSON for this user
   - `updated_at` (timestamptz)

3. `support_tickets`
   - `id` (uuid, PK)
   - `user_id` (uuid, FK to auth.users, CASCADE, DEFAULT auth.uid())
   - `user_email` (text)
   - `subject` (text)
   - `message` (text)
   - `status` (text: open/closed, default open)
   - `admin_reply` (text, nullable)
   - `created_at` (timestamptz)

## Security — RLS on all tables
- `user_profiles`: users see/edit only their own row; admins see all
- `app_data`: users CRUD only their own row; admins see all
- `support_tickets`: users see only their own tickets; admins see all + can reply/close
- 4 policies per table (SELECT/INSERT/UPDATE/DELETE)

## Admin detection
A trigger `set_admin_on_signup` checks the email and sets is_admin=true for the founder email.
*/
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  display_name text DEFAULT '',
  is_admin boolean NOT NULL DEFAULT false,
  is_banned boolean NOT NULL DEFAULT false,
  height_cm numeric DEFAULT 175,
  weight_kg numeric DEFAULT 75,
  goal text DEFAULT 'mantenimento',
  sex text DEFAULT 'M',
  age integer DEFAULT 30,
  activity_level text DEFAULT 'moderato',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON user_profiles;
CREATE POLICY "select_own_profile" ON user_profiles FOR SELECT
  TO authenticated USING (auth.uid() = id OR EXISTS (
    SELECT 1 FROM user_profiles p WHERE p.id = auth.uid() AND p.is_admin = true
  ));

DROP POLICY IF EXISTS "insert_own_profile" ON user_profiles;
CREATE POLICY "insert_own_profile" ON user_profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON user_profiles;
CREATE POLICY "update_own_profile" ON user_profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "delete_own_profile" ON user_profiles;
CREATE POLICY "delete_own_profile" ON user_profiles FOR DELETE
  TO authenticated USING (auth.uid() = id);

CREATE TABLE IF NOT EXISTS app_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  data jsonb NOT NULL,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE app_data ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_app_data" ON app_data;
CREATE POLICY "select_own_app_data" ON app_data FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM user_profiles p WHERE p.id = auth.uid() AND p.is_admin = true
  ));

DROP POLICY IF EXISTS "insert_own_app_data" ON app_data;
CREATE POLICY "insert_own_app_data" ON app_data FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_app_data" ON app_data;
CREATE POLICY "update_own_app_data" ON app_data FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_app_data" ON app_data;
CREATE POLICY "delete_own_app_data" ON app_data FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email text NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  admin_reply text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_tickets" ON support_tickets;
CREATE POLICY "select_own_tickets" ON support_tickets FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM user_profiles p WHERE p.id = auth.uid() AND p.is_admin = true
  ));

DROP POLICY IF EXISTS "insert_own_tickets" ON support_tickets;
CREATE POLICY "insert_own_tickets" ON support_tickets FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_tickets" ON support_tickets;
CREATE POLICY "update_own_tickets" ON support_tickets FOR UPDATE
  TO authenticated USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM user_profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  ) WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM user_profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

DROP POLICY IF EXISTS "delete_own_tickets" ON support_tickets;
CREATE POLICY "delete_own_tickets" ON support_tickets FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Trigger: auto-create user_profile on signup, set is_admin for founder email
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO user_profiles (id, email, display_name, is_admin)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    NEW.email = 'grberali.cg@gmail.com'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
