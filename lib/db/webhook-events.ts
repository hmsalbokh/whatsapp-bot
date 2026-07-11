import { getServiceClient } from "@/lib/supabase";

function getSupabase() { return getServiceClient(); }

export async function logWebhookEvent(params: {
  source: string;
  eventType?: string;
  status?: string;
  rawPayload: unknown;
  error?: string;
  projectId?: string;
  sessionId?: string;
}): Promise<string> {
  const { data, error } = await getSupabase()
    .from("webhook_events")
    .insert({
      source: params.source,
      event_type: params.eventType ?? null,
      status: params.status ?? "received",
      raw_payload: params.rawPayload,
      error: params.error ?? null,
      project_id: params.projectId ?? null,
      session_id: params.sessionId ?? null,
    } as any)
    .select("id")
    .single();

  if (error) {
    console.error("[webhook] failed to persist event", error.message);
    return "";
  }

  return (data as unknown as { id: string }).id;
}

export async function markWebhookProcessed(eventId: string): Promise<void> {
  if (!eventId) return;
  await getSupabase()
    .from("webhook_events")
    .update({ status: "processed", processed_at: new Date().toISOString() } as never)
    .eq("id", eventId);
}

export async function markWebhookFailed(
  eventId: string,
  error: string
): Promise<void> {
  if (!eventId) return;
  await getSupabase()
    .from("webhook_events")
    .update({ status: "failed", error } as never)
    .eq("id", eventId);
}
