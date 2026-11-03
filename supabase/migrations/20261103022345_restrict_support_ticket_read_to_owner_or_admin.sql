/*
# Restrict support ticket reads to the owner or an admin

1. Modified Tables
- `support_tickets`: the read policy changed.

2. Security
- Before: every signed-in user could read every ticket, including messages and reporter email.
- After: a user reads only their own tickets; admins (is_app_admin) read all tickets.
- Insert, update and delete policies are unchanged.

3. Notes
- The user ticket board keeps showing the user's own reports and their status.
- The admin Ticket tab keeps showing all reports.
*/

DROP POLICY IF EXISTS "select_all_tickets" ON support_tickets;
DROP POLICY IF EXISTS "select_own_or_admin_tickets" ON support_tickets;

CREATE POLICY "select_own_or_admin_tickets" ON support_tickets FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR is_app_admin());
