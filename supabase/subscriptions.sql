-- Subscription Plans
CREATE TABLE IF NOT EXISTS subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  price_monthly numeric(10,2) NOT NULL DEFAULT 0,
  price_yearly numeric(10,2) NOT NULL DEFAULT 0,
  features jsonb NOT NULL DEFAULT '[]',
  limits jsonb NOT NULL DEFAULT '{"projects":1,"contacts":100,"messages_per_month":1000,"teams":1}',
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES subscription_plans(id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'canceled', 'expired', 'trialing')),
  current_period_start timestamptz NOT NULL DEFAULT now(),
  current_period_end timestamptz NOT NULL,
  trial_end timestamptz,
  canceled_at timestamptz,
  stripe_subscription_id text,
  stripe_price_id text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_tenant ON subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_period ON subscriptions(current_period_end);

-- Insert default plans
INSERT INTO subscription_plans (name, slug, description, price_monthly, price_yearly, features, limits, sort_order) VALUES
('مجاني', 'free', 'للتجربة الأولية', 0, 0, 
  '["بوت ذكاء اصطناعي", "100 رسالة/شهر", "مشروع واحد", "استقبال الردود"]'::jsonb,
  '{"projects":1,"contacts":50,"messages_per_month":100,"teams":1}'::jsonb, 0),
('احترافي', 'pro', 'للشركات الصغيرة', 99, 990,
  '["بوت ذكاء اصطناعي", "10,000 رسالة/شهر", "مشروع واحد", "قاعدة معرفة", "تحويل للدعم البشري", "تقارير"]'::jsonb,
  '{"projects":1,"contacts":1000,"messages_per_month":10000,"teams":3}'::jsonb, 1),
('غير محدود', 'enterprise', 'للشركات الكبيرة', 299, 2990,
  '["بوت ذكاء اصطناعي", "رسائل غير محدودة", "مشاريع غير محدودة", "قاعدة معرفة", "تحويل للدعم البشري", "تقارير متقدمة", "API مخصص", "دعم فني 24/7"]'::jsonb,
  '{"projects":10,"contacts":99999,"messages_per_month":999999,"teams":20}'::jsonb, 2)
ON CONFLICT (slug) DO NOTHING;

-- Enable RLS
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies for subscription_plans (public read)
CREATE POLICY "Anyone can view active plans" ON subscription_plans
  FOR SELECT USING (is_active = true);

-- Policies for subscriptions
CREATE POLICY "Users can view own subscription" ON subscriptions
  FOR SELECT USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage subscriptions" ON subscriptions
  FOR ALL USING (true);
