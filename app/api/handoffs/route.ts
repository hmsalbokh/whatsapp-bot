import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getServiceClient } from "@/lib/supabase";
import { requireProjectAccess } from "@/lib/api-guard";
import { ok, err } from "@/lib/api-utils";
import { logAudit } from "@/lib/audit";

const supabase = getServiceClient();

export async function GET(request: NextRequest) {
  try {
    const s = await createClient();
    const { data: { user } } = await s.auth.getUser();
    if (!user) return err("Unauthorized", 401);

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const status = searchParams.get("status") ?? "pending";

    if (projectId) {
      await requireProjectAccess(user.id, projectId);
    }

    let query = supabase
      .from("handoff_requests")
      .select("*, conversations!inner(project_id, contact_id)")
      .eq("status", status)
      .order("created_at", { ascending: false });

    if (projectId) {
      query = query.eq("conversations.project_id", projectId);
    } else {
      // Scope to user's tenants
      const { data: memberships } = await supabase
        .from("tenant_users")
        .select("tenant_id")
        .eq("user_id", user.id);
      const tenantIds = (memberships ?? []).map((m: unknown) => (m as { tenant_id: string }).tenant_id);
      query = query.in("tenant_id", tenantIds);
    }

    const { data } = await query;
    return ok({ handoffs: data ?? [] });
  } catch (e) {
    return err("Failed to fetch handoffs", 500, (e as Error).message);
  }
}

export async function POST(request: NextRequest) {
  try {
    const s = await createClient();
    const { data: { user } } = await s.auth.getUser();
    if (!user) return err("Unauthorized", 401);

    const body = await request.json();
    const { conversationId, requestedBy, reason, projectId } = body;

    if (!conversationId || !reason) {
      return err("conversationId and reason are required", 400);
    }

    if (projectId) {
      await requireProjectAccess(user.id, projectId);
    }

    const { data: conv } = await supabase
      .from("conversations")
      .select("id, tenant_id, project_id")
      .eq("id", conversationId)
      .single();

    if (!conv) return err("Conversation not found", 404);

    const c = conv as unknown as { tenant_id: string; project_id: string };

    // Verify caller belongs to this conversation's tenant
    await requireProjectAccess(user.id, c.project_id);

    const { data: req, error } = await supabase
      .from("handoff_requests")
      .insert({
        tenant_id: c.tenant_id,
        conversation_id: conversationId,
        requested_by: requestedBy ?? "contact",
        reason,
        status: "pending",
      } as never)
      .select()
      .single();

    if (error) return err("Failed to create handoff request", 500);

    await supabase
      .from("conversations")
      .update({ human_handoff: true, status: "handoff" } as never)
      .eq("id", conversationId);

    logAudit({
      tenantId: c.tenant_id,
      userId: user.id,
      action: "handoff_created",
      entityType: "handoff_request",
      entityId: (req as unknown as { id: string }).id,
    }).catch(() => {});

    return ok({ handoff: req }, 201);
  } catch (e) {
    return err("Failed to create handoff request", 500, (e as Error).message);
  }
}
