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

    await requireProjectAccess(user.id, projectId);

    const admin = getServiceClient();
    const { data: items } = await admin
      .from("knowledge_items")
      .select("*")
      .eq("project_id", projectId)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    return ok({ items: items ?? [] });
  } catch (e) {
    return err("Failed to fetch knowledge base", 500, (e as Error).message);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return err("Unauthorized", 401);

    const { tenantId } = await requireProjectAccess(user.id, projectId);

    const body = await request.json();
    const { question, answer, keywords, category } = body;

    if (!question || !answer) {
      return err("question and answer are required", 400);
    }

    const admin = getServiceClient();
    const { data: item, error } = await admin
      .from("knowledge_items")
      .insert({
        tenant_id: tenantId,
        project_id: projectId,
        question,
        answer,
        keywords: keywords ?? [],
        category: category ?? null,
      } as never)
      .select()
      .single();

    if (error) return err("Failed to create knowledge item", 500);
    return ok({ item }, 201);
  } catch (e) {
    return err("Failed to create knowledge item", 500, (e as Error).message);
  }
}
