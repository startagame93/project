-- Make support_tickets visible to all authenticated users (public board)
DROP POLICY IF EXISTS select_own_tickets ON support_tickets;

CREATE POLICY select_all_tickets ON support_tickets
  FOR SELECT TO authenticated
  USING (true);
