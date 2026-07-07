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

export async function checkMessageLimit(projectId: string): Promise<{ allowed: boolean; message?: string }> {
  const { getServiceClient } = await import("@/lib/supabase");
  const admin = getServiceClient();

  const { data: project } = await admin
    .from("project_profiles")
    .select("tenant_id")
    .eq("id", projectId)
    .single() as unknown as { data: { tenant_id: string } | null };

  if (!project) return { allowed: true };

  const sub = await getTenantSubscription(project.tenant_id);
  if (!sub.active || !sub.plan) return { allowed: false, message: "No active subscription" };

  const { data: periodSub } = await admin
    .from("subscriptions")
    .select("current_period_start")
    .eq("tenant_id", project.tenant_id)
    .in("status", ["active", "trialing"])
    .maybeSingle() as unknown as { data: { current_period_start: string } | null };

  if (!periodSub) return { allowed: true };

  const { count } = await admin
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", project.tenant_id)
    .gte("created_at", periodSub.current_period_start);

  if (count != null && count >= sub.plan.limits.messages_per_month) {
    return { allowed: false, message: `Monthly message limit reached (${sub.plan.limits.messages_per_month})` };
  }

  return { allowed: true };
}

export async function checkUserProjectLimit(userId: string): Promise<{ allowed: boolean; message?: string }> {
  const admin = getServiceClient();

  const { data: memberships } = await admin
    .from("tenant_users")
    .select("tenant_id")
    .eq("user_id", userId) as unknown as { data: { tenant_id: string }[] | null };

  if (!memberships || memberships.length === 0) {
    return { allowed: true };
  }

  const tenantIds = memberships.map((m) => m.tenant_id);

  const { data: subscriptions } = await admin
    .from("subscriptions")
    .select("subscription_plans!inner(limits)")
    .in("tenant_id", tenantIds)
    .in("status", ["active", "trialing"]) as unknown as { data: { subscription_plans: { limits: { projects: number } } }[] | null };

  const { count: totalProjects } = await admin
    .from("project_profiles")
    .select("id", { count: "exact", head: true })
    .in("tenant_id", tenantIds);

  let totalProjectLimit = 0;
  if (subscriptions) {
    for (const sub of subscriptions) {
      totalProjectLimit += sub.subscription_plans.limits.projects;
    }
  }

  // If no active subscription, allow (will get free plan on creation)
  if (totalProjectLimit === 0) {
    return { allowed: true };
  }

  if (totalProjects != null && totalProjects >= totalProjectLimit) {
    return { allowed: false, message: `Project limit reached (${totalProjectLimit})` };
  }

  return { allowed: true };
}
