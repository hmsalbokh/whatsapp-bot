-- Super Admins table (global platform admins)
CREATE TABLE IF NOT EXISTS super_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE super_admins ENABLE ROW LEVEL SECURITY;

-- Only super admins can view the super_admins table
CREATE POLICY "Super admins can view super_admins"
  ON super_admins FOR SELECT
  USING (user_id = auth.uid());

-- To add your first super admin, run:
-- INSERT INTO super_admins (user_id) VALUES ('<USER_UUID>');
