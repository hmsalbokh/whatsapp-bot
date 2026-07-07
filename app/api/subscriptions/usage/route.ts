import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const s = await createClient();
    const { data: { user } } = await s.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const admin = getServiceClient();

    const { data: memberships } = await admin
      .from("tenant_users")
      .select("tenant_id")
      .eq("user_id", user.id) as unknown as { data: { tenant_id: string }[] | null };

    if (!memberships || memberships.length === 0) {
      return NextResponse.json({ usage: null });
    }

    const tenantId = memberships[0].tenant_id;

    const { data: sub } = await admin
      .from("subscriptions")
      .select("*, subscription_plans!inner(*)")
      .eq("tenant_id", tenantId)
      .in("status", ["active", "trialing"])
      .maybeSingle() as unknown as { data: Record<string, unknown> | null };

    if (!sub) {
      return NextResponse.json({ usage: { projects: 0, messages: 0, contacts: 0 }, limits: null });
    }

    const subData = sub as unknown as {
      current_period_start: string;
      subscription_plans: {
        limits: { projects: number; contacts: number; messages_per_month: number; teams: number };
      };
    };

    const startDate = subData.current_period_start;

    const { count: messageCount } = await admin
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .gte("created_at", startDate);

    const { count: projectCount } = await admin
      .from("project_profiles")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId);

    const { count: contactCount } = await admin
      .from("conversations")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .neq("status", "closed");

    const limits = subData.subscription_plans.limits;

    return NextResponse.json({
      usage: {
        projects: projectCount ?? 0,
        messages: messageCount ?? 0,
        contacts: contactCount ?? 0,
      },
      limits,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
