import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

export async function GET() {
  try {
    const admin = getServiceClient();

    // Create subscription_plans table
    await admin.rpc("exec_sql", {
      query: `
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
      `,
    }).catch(() => {});

    // Create subscriptions table
    await admin.rpc("exec_sql", {
      query: `
        CREATE TABLE IF NOT EXISTS subscriptions (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
          plan_id uuid NOT NULL REFERENCES subscription_plans(id) ON DELETE RESTRICT,
          status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'canceled', 'expired', 'trialing')),
          current_period_start timestamptz NOT NULL DEFAULT now(),
          current_period_end timestamptz NOT NULL,
          trial_end timestamptz,
          canceled_at timestamptz,
          metadata jsonb DEFAULT '{}',
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now()
        );
      `,
    }).catch(() => {});

    // Seed plans
    const { data: existing } = await admin.from("subscription_plans").select("slug");
    if (!existing || existing.length === 0) {
      await admin.from("subscription_plans").insert([
        {
          name: "مجاني",
          slug: "free",
          description: "للتجربة الأولية",
          price_monthly: 0,
          price_yearly: 0,
          features: ["بوت ذكاء اصطناعي", "100 رسالة/شهر", "مشروع واحد"],
          limits: { projects: 1, contacts: 50, messages_per_month: 100, teams: 1 },
          sort_order: 0,
        },
        {
          name: "احترافي",
          slug: "pro",
          description: "للشركات الصغيرة",
          price_monthly: 99,
          price_yearly: 990,
          features: ["بوت ذكاء اصطناعي", "10,000 رسالة/شهر", "مشروع واحد", "قاعدة معرفة", "تحويل للدعم البشري", "تقارير"],
          limits: { projects: 1, contacts: 1000, messages_per_month: 10000, teams: 3 },
          sort_order: 1,
        },
        {
          name: "غير محدود",
          slug: "enterprise",
          description: "للشركات الكبيرة",
          price_monthly: 299,
          price_yearly: 2990,
          features: ["بوت ذكاء اصطناعي", "رسائل غير محدودة", "مشاريع غير محدودة", "قاعدة معرفة", "تحويل للدعم البشري", "تقارير متقدمة", "API مخصص", "دعم فني 24/7"],
          limits: { projects: 10, contacts: 99999, messages_per_month: 999999, teams: 20 },
          sort_order: 2,
        },
      ]);
    }

    return NextResponse.json({ status: "ok", message: "Subscription tables created and plans seeded" });
  } catch (err) {
    return NextResponse.json({ status: "error", message: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
