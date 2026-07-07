import { NextRequest, NextResponse } from "next/server";
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
      return NextResponse.json({ subscription: null });
    }

    const tenantIds = memberships.map((m) => m.tenant_id);
    const { data } = await admin
      .from("subscriptions")
      .select("*, subscription_plans(*)")
      .in("tenant_id", tenantIds)
      .in("status", ["active", "trialing", "past_due"])
      .order("current_period_end", { ascending: false })
      .limit(1)
      .maybeSingle() as unknown as { data: Record<string, unknown> | null };

    return NextResponse.json({ subscription: data ?? null });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const s = await createClient();
    const { data: { user } } = await s.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { planId, tenantId } = await request.json();
    if (!planId || !tenantId) {
      return NextResponse.json({ error: "planId and tenantId required" }, { status: 400 });
    }

    const admin = getServiceClient();

    // Verify user owns this tenant
    const { data: membership } = await admin
      .from("tenant_users")
      .select("id")
      .eq("user_id", user.id)
      .eq("tenant_id", tenantId)
      .single();

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get plan
    const { data: plan } = await admin
      .from("subscription_plans")
      .select("*")
      .eq("id", planId)
      .single() as unknown as { data: { id: string; price_monthly: number } | null };

    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    // End existing subscriptions
    await admin
      .from("subscriptions")
      .update({ status: "canceled", canceled_at: new Date().toISOString() } as never)
      .eq("tenant_id", tenantId)
      .in("status", ["active", "trialing", "past_due"]);

    // Create new subscription
    const now = new Date();
    const endDate = new Date(now);
    endDate.setMonth(endDate.getMonth() + 1);

    const { error } = await admin
      .from("subscriptions")
      .insert({
        tenant_id: tenantId,
        plan_id: planId,
        status: plan.price_monthly > 0 ? "trialing" : "active",
        current_period_start: now.toISOString(),
        current_period_end: endDate.toISOString(),
        trial_end: plan.price_monthly > 0 ? new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString() : null,
        metadata: { created_by: user.id },
      } as never);

    if (error) throw error;
    return NextResponse.json({ subscription: { plan_id: planId, tenant_id: tenantId } }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
