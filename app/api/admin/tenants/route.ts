import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { createClient } from "@/lib/supabase/server";
import { isSuperAdmin } from "@/lib/admin-guard";

export async function GET() {
  try {
    const s = await createClient();
    const { data: { user } } = await s.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const isAdmin = await isSuperAdmin(user.id);
    if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const admin = getServiceClient();

    const { data: tenants } = await admin
      .from("tenants")
      .select("id, name, slug, created_at")
      .order("created_at", { ascending: false });

    if (!tenants) return NextResponse.json({ tenants: [] });

    const tenantList = tenants as unknown as {
      id: string; name: string; slug: string; created_at: string;
    }[];

    const tenantIds = tenantList.map((t) => t.id);

    const { data: projectData } = await admin
      .from("project_profiles")
      .select("id, tenant_id, name, created_at")
      .in("tenant_id", tenantIds)
      .order("created_at", { ascending: false });

    const { data: userData } = await admin
      .from("tenant_users")
      .select("tenant_id, user_id, role")
      .in("tenant_id", tenantIds);

    const { data: subData } = await admin
      .from("subscriptions")
      .select("tenant_id, status, subscription_plans!inner(name, slug)")
      .in("tenant_id", tenantIds);

    const projectsByTenant = new Map<string, { id: string; name: string; created_at: string }[]>();
    if (projectData) {
      for (const p of projectData as unknown as { id: string; tenant_id: string; name: string; created_at: string }[]) {
        if (!projectsByTenant.has(p.tenant_id)) projectsByTenant.set(p.tenant_id, []);
        projectsByTenant.get(p.tenant_id)!.push({ id: p.id, name: p.name, created_at: p.created_at });
      }
    }

    const usersByTenant = new Map<string, { userId: string; role: string }[]>();
    if (userData) {
      for (const u of userData as unknown as { tenant_id: string; user_id: string; role: string }[]) {
        if (!usersByTenant.has(u.tenant_id)) usersByTenant.set(u.tenant_id, []);
        usersByTenant.get(u.tenant_id)!.push({ userId: u.user_id, role: u.role });
      }
    }

    const subByTenant = new Map<string, { status: string; planName: string; planSlug: string }>();
    if (subData) {
      for (const s of subData as unknown as { tenant_id: string; status: string; subscription_plans: { name: string; slug: string } }[]) {
        subByTenant.set(s.tenant_id, {
          status: s.status,
          planName: s.subscription_plans.name,
          planSlug: s.subscription_plans.slug,
        });
      }
    }

    const result = tenantList.map((t) => ({
      ...t,
      projects: projectsByTenant.get(t.id) ?? [],
      userCount: usersByTenant.get(t.id)?.length ?? 0,
      subscription: subByTenant.get(t.id) ?? null,
    }));

    return NextResponse.json({ tenants: result });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
