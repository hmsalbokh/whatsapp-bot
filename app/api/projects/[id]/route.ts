import { createClient } from "@/lib/supabase/server";
import { getServiceClient } from "@/lib/supabase";
import { requireProjectAccess } from "@/lib/api-guard";
import { ok, err } from "@/lib/api-utils";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return err("Unauthorized", 401);

    await requireProjectAccess(user.id, id);

    const admin = getServiceClient();
    const { data: project } = await admin
      .from("project_profiles")
      .select("*, tenants(name, slug)")
      .eq("id", id)
      .single();

    if (!project) return err("Project not found", 404);
    return ok({ project });
  } catch (e) {
    return err("Failed to fetch project", 500, (e as Error).message);
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return err("Unauthorized", 401);

    const { tenantId } = await requireProjectAccess(user.id, id);

    const body = await request.json();
    // Whitelist allowed fields
    const allowed = [
      "name", "industry", "timezone", "language",
      "welcome_message", "company_description",
      "contact_email", "contact_phone",
    ];
    const clean: Record<string, unknown> = {};
    for (const key of allowed) {
      if (body[key] !== undefined) clean[key] = body[key];
    }

    const admin = getServiceClient();
    const { data: project, error } = await admin
      .from("project_profiles")
      .update(clean as never)
      .eq("id", id)
      .select()
      .single();

    if (error) return err("Failed to update project", 500);
    return ok({ project });
  } catch (e) {
    return err("Failed to update project", 500, (e as Error).message);
  }
}
