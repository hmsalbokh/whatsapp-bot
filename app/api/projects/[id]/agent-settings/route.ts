import { createClient } from "@/lib/supabase/server";
import { getServiceClient } from "@/lib/supabase";
import { requireProjectAccess } from "@/lib/api-guard";
import { ok, err } from "@/lib/api-utils";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return err("Unauthorized", 401);

    const { tenantId } = await requireProjectAccess(user.id, projectId);

    const admin = getServiceClient();

    let { data: settings } = await admin
      .from("agent_settings")
      .select("*")
      .eq("project_id", projectId)
      .single();

    if (!settings) {
      const { data: created } = await admin
        .from("agent_settings")
        .insert({
          tenant_id: tenantId,
          project_id: projectId,
        } as never)
        .select()
        .single();

      settings = created;
    }

    return ok({ settings });
  } catch (e) {
    return err("Failed to fetch agent settings", 500, (e as Error).message);
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return err("Unauthorized", 401);

    await requireProjectAccess(user.id, projectId);

    const body = await request.json();
    const allowed = [
      "model", "system_prompt", "temperature",
      "max_tokens", "max_tool_loops", "language",
    ];
    const clean: Record<string, unknown> = {};
    for (const key of allowed) {
      if (body[key] !== undefined) clean[key] = body[key];
    }

    const admin = getServiceClient();
    const { data: settings, error } = await admin
      .from("agent_settings")
      .update(clean as never)
      .eq("project_id", projectId)
      .select()
      .single();

    if (error) return err("Failed to update agent settings", 500);
    return ok({ settings });
  } catch (e) {
    return err("Failed to update agent settings", 500, (e as Error).message);
  }
}
