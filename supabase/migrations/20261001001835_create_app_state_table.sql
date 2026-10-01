/*
# Create app_state table for persistent NutriPlan data

1. New Tables
- `app_state`
  - `id` (text, primary key) — single-row key, always 'singleton'
  - `data` (jsonb, not null) — full AppState JSON blob (profile, weeks, bodyMetrics, supplementLogs, micronutrientLogs, shoppingList, notifications, waterLogs, theme, pdfText, customFoods, workoutLogs, onboardingComplete)
  - `updated_at` (timestamptz, default now()) — last sync timestamp

2. Security
- Enable RLS on `app_state`.
- Single-tenant no-auth app: allow anon + authenticated full CRUD (USING (true) / WITH CHECK (true)) because the data is intentionally shared/public with no login screen.
- 4 separate policies: select, insert, update, delete.

3. Notes
- The entire AppState is stored as a single JSONB row to keep the sync model simple (load on startup, save on change).
- This preserves all existing localStorage data structure while moving it to server-side persistent storage.
*/

CREATE TABLE IF NOT EXISTS app_state (
  id text PRIMARY KEY DEFAULT 'singleton',
  data jsonb NOT NULL,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE app_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_app_state" ON app_state;
CREATE POLICY "anon_select_app_state" ON app_state FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_app_state" ON app_state;
CREATE POLICY "anon_insert_app_state" ON app_state FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_app_state" ON app_state;
CREATE POLICY "anon_update_app_state" ON app_state FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_app_state" ON app_state;
CREATE POLICY "anon_delete_app_state" ON app_state FOR DELETE
  TO anon, authenticated USING (true);
