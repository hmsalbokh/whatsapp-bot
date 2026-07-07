import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { createClient } from "@/lib/supabase/server";
import { isSuperAdmin } from "@/lib/admin-guard";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const s = await createClient();
    const { data: { user } } = await s.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const isAdmin = await isSuperAdmin(user.id);
    if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const admin = getServiceClient();

    const { data: request_ } = await admin
      .from("registration_requests")
      .select("*")
      .eq("id", id)
      .single() as unknown as { data: {
        id: string; full_name: string; email: string; phone: string | null;
        company_name: string; plan_slug: string; status: string;
      } | null };

    if (!request_) {
      return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
    }

    if (request_.status !== "pending") {
      return NextResponse.json(
        { error: `الطلب حالته: ${request_.status} ولا يمكن الموافقة عليه` },
        { status: 400 }
      );
    }

    const tempPassword = crypto.randomUUID().slice(0, 16).replace(/-/g, "");

    const { data: authUser, error: createError } = await admin.auth.admin.createUser({
      email: request_.email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { full_name: request_.full_name, phone: request_.phone },
    });

    if (createError || !authUser?.user) {
      return NextResponse.json(
        { error: `فشل إنشاء المستخدم: ${createError?.message ?? "unknown"}` },
        { status: 500 }
      );
    }

    let slug = request_.company_name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40);

    let existingSlug = true;
    let attempts = 0;
    while (existingSlug && attempts < 10) {
      const checkSlug = attempts === 0 ? slug : `${slug}-${attempts}`;
      const { data: existing } = await admin
        .from("tenants")
        .select("id")
        .eq("slug", checkSlug)
        .maybeSingle() as unknown as { data: { id: string } | null };
      if (!existing) {
        slug = checkSlug;
        existingSlug = false;
      }
      attempts++;
    }

    const { data: tenant, error: tenantError } = await admin
      .from("tenants")
      .insert({ name: request_.company_name, slug } as never)
      .select()
      .single();

    if (tenantError || !tenant) {
      await admin.auth.admin.deleteUser(authUser.user.id);
      return NextResponse.json(
        { error: `فشل إنشاء الشركة: ${tenantError?.message ?? "unknown"}` },
        { status: 500 }
      );
    }

    const createdTenant = tenant as unknown as { id: string };

    await admin.from("tenant_users").insert({
      tenant_id: createdTenant.id,
      user_id: authUser.user.id,
      role: "admin",
    } as never);

    const { data: project, error: projectError } = await admin
      .from("project_profiles")
      .insert({
        tenant_id: createdTenant.id,
        name: `${request_.company_name} - المشروع الرئيسي`,
        company_description: null,
      } as never)
      .select()
      .single() as unknown as { data: { id: string } | null; error: { message: string } | null };

    if (projectError || !project) {
      await admin.auth.admin.deleteUser(authUser.user.id);
      await admin.from("tenants").delete().eq("id", createdTenant.id);
      return NextResponse.json(
        { error: `فشل إنشاء المشروع: ${projectError?.message ?? "unknown"}` },
        { status: 500 }
      );
    }

    try {
      await admin.from("agent_settings").insert({
        tenant_id: createdTenant.id,
        project_id: project.id,
      } as never);
    } catch { /* skip */ }

    try {
      const { data: freePlan } = await admin
        .from("subscription_plans")
        .select("id")
        .eq("slug", request_.plan_slug)
        .maybeSingle() as unknown as { data: { id: string } | null };

      if (freePlan) {
        const now = new Date();
        const end = new Date(now);
        end.setFullYear(end.getFullYear() + 1);
        await admin.from("subscriptions").insert({
          tenant_id: createdTenant.id,
          plan_id: freePlan.id,
          status: "active",
          current_period_start: now.toISOString(),
          current_period_end: end.toISOString(),
          metadata: { created_by: "admin_approval", registered_email: request_.email },
        } as never);
      }
    } catch { /* skip */ }

    await admin
      .from("registration_requests")
      .update({
        status: "approved",
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        notes: `تم إنشاء المستخدم. كلمة المرور المؤقتة: ${tempPassword}`,
      } as never)
      .eq("id", id);

    return NextResponse.json({
      success: true,
      message: "تمت الموافقة على الطلب وإنشاء الحساب",
      tempPassword,
      userEmail: request_.email,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
