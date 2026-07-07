import { getServiceClient } from "@/lib/supabase";

export interface SubscriptionInfo {
  active: boolean;
  plan: {
    slug: string;
    name: string;
    limits: {
      projects: number;
      contacts: number;
      messages_per_month: number;
      teams: number;
    };
  } | null;
}

export async function getTenantSubscription(tenantId: string): Promise<SubscriptionInfo> {
  const admin = getServiceClient();

  const { data } = await admin
    .from("subscriptions")
    .select("status, subscription_plans!inner(*)")
    .eq("tenant_id", tenantId)
    .in("status", ["active", "trialing"])
    .maybeSingle();

  if (!data) {
    return { active: false, plan: null };
  }

  const sub = data as unknown as {
    status: string;
    subscription_plans: {
      slug: string;
      name: string;
      limits: { projects: number; contacts: number; messages_per_month: number; teams: number };
    };
  };

  return {
    active: sub.status === "active" || sub.status === "trialing",
    plan: {
      slug: sub.subscription_plans.slug,
      name: sub.subscription_plans.name,
      limits: sub.subscription_plans.limits,
    },
  };
}

export async function checkProjectLimit(tenantId: string): Promise<{ allowed: boolean; message?: string }> {
  const admin = getServiceClient();
  const sub = await getTenantSubscription(tenantId);

  if (!sub.active || !sub.plan) {
    return { allowed: false, message: "No active subscription" };
  }

  const { count } = await admin
    .from("project_profiles")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId);

  if (count != null && count >= sub.plan.limits.projects) {
    return { allowed: false, message: `Project limit reached (${sub.plan.limits.projects})` };
  }

  return { allowed: true };
}
