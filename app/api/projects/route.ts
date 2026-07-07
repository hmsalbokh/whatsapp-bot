import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getServiceClient } from "@/lib/supabase";
import { checkUserProjectLimit } from "@/lib/subscription-guard";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = getServiceClient();

  const { data: memberships } = await admin
    .from("tenant_users")
    .select("tenant_id")
    .eq("user_id", user.id);

  if (!memberships || memberships.length === 0) {
    return NextResponse.json({ projects: [] });
  }

  const tenantIds = (memberships as unknown as { tenant_id: string }[]).map(
    (m) => m.tenant_id
  );

  const { data: projects } = await admin
    .from("project_profiles")
    .select("*, tenants!inner(name, slug)")
    .in("tenant_id", tenantIds)
    .order("created_at", { ascending: false });

  return NextResponse.json({ projects: projects ?? [] });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { tenantName, projectName, industry, companyDescription } = body;

  if (!tenantName || !projectName) {
    return NextResponse.json(
      { error: "tenantName and projectName are required" },
      { status: 400 }
    );
  }

  const admin = getServiceClient();

  // Check subscription project limit
  const limitCheck = await checkUserProjectLimit(user.id);
  if (!limitCheck.allowed) {
    return NextResponse.json(
      { error: limitCheck.message || "Subscription limit reached" },
      { status: 403 }
    );
  }

  const slug = tenantName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const { data: tenant, error: tenantError } = await admin
    .from("tenants")
    .insert({ name: tenantName, slug } as never)
    .select()
    .single();

  if (tenantError) {
    return NextResponse.json(
      { error: `Failed to create tenant: ${tenantError.message}` },
      { status: 500 }
    );
  }

  const createdTenant = tenant as unknown as { id: string };

  await admin.from("tenant_users").insert({
    tenant_id: createdTenant.id,
    user_id: user.id,
    role: "admin",
  } as never);

  const { data: project, error: projectError } = await admin
    .from("project_profiles")
    .insert({
      tenant_id: createdTenant.id,
      name: projectName,
      industry: industry ?? null,
      company_description: companyDescription ?? null,
    } as never)
    .select()
    .single();

  if (projectError) {
    return NextResponse.json(
      { error: `Failed to create project: ${projectError.message}` },
      { status: 500 }
    );
  }

  // Auto-create agent settings (best effort)
  try {
    await admin.from("agent_settings").insert({
      tenant_id: createdTenant.id,
      project_id: (project as unknown as { id: string }).id,
    } as never);
  } catch { /* skip */ }

  // Auto-create free subscription if none exists
  try {
    const { data: existingSub } = await admin
      .from("subscriptions")
      .select("id")
      .eq("tenant_id", createdTenant.id)
      .maybeSingle();

    if (!existingSub) {
      const { data: freePlan } = await admin
        .from("subscription_plans")
        .select("id")
        .eq("slug", "free")
        .maybeSingle();

      if (freePlan) {
        const now = new Date();
        const end = new Date(now);
        end.setFullYear(end.getFullYear() + 10);
        await admin.from("subscriptions").insert({
          tenant_id: createdTenant.id,
          plan_id: (freePlan as unknown as { id: string }).id,
          status: "active",
          current_period_start: now.toISOString(),
          current_period_end: end.toISOString(),
          metadata: { created_by: "system" },
        } as never);
      }
    }
  } catch { /* skip if tables dont exist yet */ }

  return NextResponse.json({ project, tenant }, { status: 201 });
}
