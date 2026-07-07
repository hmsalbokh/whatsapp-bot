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

    const { data: memberships } = await admin
      .from("tenant_users")
      .select("user_id, role, tenant_id, created_at, tenants!inner(name, slug)");

    if (!memberships) {
      return NextResponse.json({ users: [] });
    }

    const data = memberships as unknown as {
      user_id: string;
      role: string;
      tenant_id: string;
      created_at: string;
      tenants: { name: string; slug: string };
    }[];

    const userMap = new Map<string, {
      userId: string;
      tenants: { id: string; name: string; slug: string; role: string }[];
      firstSeen: string;
      projectCount: number;
    }>();

    for (const m of data) {
      if (!userMap.has(m.user_id)) {
        userMap.set(m.user_id, {
          userId: m.user_id,
          tenants: [],
          firstSeen: m.created_at,
          projectCount: 0,
        });
      }
      const entry = userMap.get(m.user_id)!;
      entry.tenants.push({
        id: m.tenant_id,
        name: m.tenants.name,
        slug: m.tenants.slug,
        role: m.role,
      });
      if (m.created_at < entry.firstSeen) entry.firstSeen = m.created_at;
    }

    const { data: projectCounts } = await admin
      .from("project_profiles")
      .select("tenant_id");

    if (projectCounts) {
      const tenantProjectCount = new Map<string, number>();
      for (const p of projectCounts as unknown as { tenant_id: string }[]) {
        tenantProjectCount.set(p.tenant_id, (tenantProjectCount.get(p.tenant_id) ?? 0) + 1);
      }

      for (const [, entry] of userMap) {
        for (const t of entry.tenants) {
          entry.projectCount += tenantProjectCount.get(t.id) ?? 0;
        }
      }
    }

    const users = Array.from(userMap.values()).sort(
      (a, b) => new Date(b.firstSeen).getTime() - new Date(a.firstSeen).getTime()
    );

    return NextResponse.json({ users });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
