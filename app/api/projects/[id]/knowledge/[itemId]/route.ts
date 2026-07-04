import { createClient } from "@/lib/supabase/server";
import { getServiceClient } from "@/lib/supabase";
import { requireProjectAccess } from "@/lib/api-guard";
import { ok, err } from "@/lib/api-utils";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id: projectId, itemId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return err("Unauthorized", 401);

    await requireProjectAccess(user.id, projectId);

    const body = await request.json();
    const allowed = ["question", "answer", "keywords", "category"];
    const clean: Record<string, unknown> = {};
    for (const key of allowed) {
      if (body[key] !== undefined) clean[key] = body[key];
    }

    const admin = getServiceClient();
    const { data: item, error } = await admin
      .from("knowledge_items")
      .update(clean as never)
      .eq("id", itemId)
      .eq("project_id", projectId)
      .select()
      .single();

    if (error) return err("Failed to update knowledge item", 500);
    return ok({ item });
  } catch (e) {
    return err("Failed to update knowledge item", 500, (e as Error).message);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id: projectId, itemId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return err("Unauthorized", 401);

    await requireProjectAccess(user.id, projectId);

    const admin = getServiceClient();
    const { error } = await admin
      .from("knowledge_items")
      .update({ is_active: false } as never)
      .eq("id", itemId)
      .eq("project_id", projectId);

    if (error) return err("Failed to delete knowledge item", 500);
    return ok({ ok: true });
  } catch (e) {
    return err("Failed to delete knowledge item", 500, (e as Error).message);
  }
}
