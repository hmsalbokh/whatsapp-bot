import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getServiceClient } from "@/lib/supabase";
import { requireProjectAccess } from "@/lib/api-guard";
import { ok, err, parseJson } from "@/lib/api-utils";
import { logAudit } from "@/lib/audit";

const supabase = getServiceClient();

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = (await params).id;
    const s = await createClient();
    const { data: { user } } = await s.auth.getUser();
    if (!user) return err("Unauthorized", 401);

    const body = parseJson(await request.text());
    const newStatus = body && typeof body === "object" && "status" in body
      ? (body as Record<string, unknown>).status
      : null;

    if (!newStatus || !["accepted", "rejected", "closed"].includes(newStatus as string)) {
      return err("status must be one of: accepted, rejected, closed", 400);
    }

    const { data: handoffReq } = await supabase
      .from("handoff_requests")
      .select("id, conversation_id, tenant_id")
      .eq("id", id)
      .single();

    if (!handoffReq) return err("Handoff request not found", 404);

    const h = handoffReq as unknown as {
      id: string;
      conversation_id: string;
      tenant_id: string;
    };

    // Verify caller belongs to this handoff's tenant
    const { data: membership } = await supabase
      .from("tenant_users")
      .select("id")
      .eq("tenant_id", h.tenant_id)
      .eq("user_id", user.id)
      .single();

    if (!membership) return err("Access denied", 403);

    const updateData: Record<string, unknown> = { status: newStatus };
    if (newStatus === "accepted" || newStatus === "closed") {
      updateData.resolved_at = new Date().toISOString();
    }

    await supabase
      .from("handoff_requests")
      .update(updateData as never)
      .eq("id", id);

    if (newStatus === "accepted") {
      await supabase
        .from("conversations")
        .update({ assigned_agent: user.email ?? "agent", status: "handoff" } as never)
        .eq("id", h.conversation_id);
    } else if (newStatus === "closed" || newStatus === "rejected") {
      await supabase
        .from("conversations")
        .update({ human_handoff: false, status: "active" } as never)
        .eq("id", h.conversation_id);
    }

    logAudit({
      tenantId: h.tenant_id,
      userId: user.id,
      action: `handoff_${newStatus}`,
      entityType: "handoff_request",
      entityId: id,
    }).catch(() => {});

    return ok({ status: "ok" });
  } catch (e) {
    return err("Failed to update handoff request", 500, (e as Error).message);
  }
}
