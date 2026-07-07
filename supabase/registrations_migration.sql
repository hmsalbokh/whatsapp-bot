-- Registration requests table (pending admin approval)
CREATE TABLE IF NOT EXISTS registration_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  company_name TEXT NOT NULL,
  plan_slug TEXT NOT NULL DEFAULT 'free',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE registration_requests ENABLE ROW LEVEL SECURITY;

-- Only super admins can view/update registration_requests
CREATE POLICY "Super admins can manage registration_requests"
  ON registration_requests FOR ALL
  USING (
    auth.uid() IN (SELECT user_id FROM super_admins)
  );

-- Anyone can insert (public registration form)
CREATE POLICY "Anyone can submit registration"
  ON registration_requests FOR INSERT
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_registration_requests_status ON registration_requests(status);
CREATE INDEX IF NOT EXISTS idx_registration_requests_email ON registration_requests(email);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS set_registration_requests_updated_at ON registration_requests;
CREATE TRIGGER set_registration_requests_updated_at
  BEFORE UPDATE ON registration_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
