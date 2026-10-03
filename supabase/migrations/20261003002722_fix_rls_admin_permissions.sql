-- Allow admin to update any user's is_banned and is_admin fields
DROP POLICY IF EXISTS update_own_profile ON user_profiles;

CREATE POLICY update_own_profile ON user_profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY admin_update_profiles ON user_profiles
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_profiles p
    WHERE p.id = auth.uid() AND p.is_admin = true
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM user_profiles p
    WHERE p.id = auth.uid() AND p.is_admin = true
  ));

-- Allow admin to delete support tickets (for bacheca cleanup)
DROP POLICY IF EXISTS admin_delete_tickets ON support_tickets;

CREATE POLICY admin_delete_tickets ON support_tickets
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_profiles p
    WHERE p.id = auth.uid() AND p.is_admin = true
  ));
