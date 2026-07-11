import { getServiceClient } from "@/lib/supabase";
import { emitN8nEvent, buildN8nEvent, isN8nConfigured } from "@/lib/sidecar/n8n";
import { getOrCreateConversation } from "./conversations";
import { getProjectTenant } from "./projects";
import { generateAndSaveSummary } from "@/lib/agent/summarization";

function getSupabase() { return getServiceClient(); }

export async function setHandoffRequested(
  projectId: string,
  phone: string,
  reason: string
): Promise<string> {
  const conv = await getOrCreateConversation(projectId, phone);

  const { tenant_id } = await getProjectTenant(projectId);

  await getSupabase()
    .from("conversations")
    .update({
      human_handoff: true,
      assigned_agent: reason,
      status: "handoff",
    } as never)
    .eq("id", conv.id);

  const { data: req, error } = await getSupabase()
    .from("handoff_requests")
    .insert({
      tenant_id,
      conversation_id: conv.id,
      requested_by: "ai",
      reason,
      status: "pending",
    } as any)
    .select("id")
    .single();

  if (error || !req) {
    console.error("[memory] failed to create handoff request", error?.message);
    return "";
  }

  const reqId = (req as unknown as { id: string }).id;

  if (isN8nConfigured()) {
    emitN8nEvent(
      buildN8nEvent("handoff_requested", {
        projectId,
        phone,
        conversationId: conv.id,
        tenantId: tenant_id,
        payload: { reason, handoffRequestId: reqId },
      })
    ).catch(() => {});
  }

  generateAndSaveSummary(projectId, phone).catch((err) =>
    console.error("[memory] handoff summarization failed", err)
  );

  return reqId;
}
