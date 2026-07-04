import { getServiceClient } from "@/lib/supabase";
import { emitN8nEvent, buildN8nEvent, isN8nConfigured } from "@/lib/sidecar/n8n";
import type { ConversationMessage } from "@/types";

const supabase = getServiceClient();

const DEFAULT_SYSTEM_PROMPT =
  process.env.SYSTEM_PROMPT ||
  `أنت مساعد خدمة عملاء ذكي ومحترف لشركة تجارة إلكترونية رائدة في المملكة العربية السعودية.

تعليمات مهمة:
- رد بلغة عربية فصيحة ومهذبة دائمًا
- كن مفيدًا ودقيقًا في ردودك
- إذا احتاج العميل إلى معلومات عن طلب، استخدم أداة get_order_status
- إذا سأل عن أسئلة شائعة، استخدم search_faq
- إذا كانت المشكلة معقدة أو يحتاج العميل لتحدث مع موظف بشري، استخدم handoff_to_human
- إذا احتاج العميل لتسجيل شكوى أو مشكلة، استخدم create_support_ticket
- لا تقدم معلومات خاطئة. إذا لم تعرف الإجابة، اعتذر بلطف واعرض تحويله للدعم البشري
- استخدم التحيات العربية المناسبة (السلام عليكم، صباح الخير، مساء الخير)
- كن صبورًا وأعد الشرح إذا لزم الأمر`;

async function getProjectTenant(
  projectId: string
): Promise<{ tenant_id: string }> {
  const { data } = await supabase
    .from("project_profiles")
    .select("tenant_id")
    .eq("id", projectId)
    .single();

  if (!data) throw new Error(`Project not found: ${projectId}`);
  return data as unknown as { tenant_id: string };
}

async function upsertContact(
  projectId: string,
  tenantId: string,
  phone: string
): Promise<string> {
  const { data: existing } = await supabase
    .from("contacts")
    .select("id")
    .eq("project_id", projectId)
    .eq("phone", phone)
    .single();

  if (existing) return (existing as unknown as { id: string }).id;

  const { data: created, error } = await supabase
    .from("contacts")
    .insert({
      tenant_id: tenantId,
      project_id: projectId,
      phone,
    } as never)
    .select("id")
    .single();

  if (error || !created) {
    throw new Error(`Failed to create contact: ${error?.message}`);
  }

  return (created as unknown as { id: string }).id;
}

export async function getOrCreateConversation(
  projectId: string,
  phone: string
): Promise<{ id: string; contact_id: string; human_handoff: boolean }> {
  const { tenant_id } = await getProjectTenant(projectId);
  const contactId = await upsertContact(projectId, tenant_id, phone);

  const { data: existing } = await supabase
    .from("conversations")
    .select("id, contact_id, human_handoff")
    .eq("project_id", projectId)
    .eq("contact_id", contactId)
    .single();

  if (existing) return existing as unknown as { id: string; contact_id: string; human_handoff: boolean };

  const { data: created, error } = await supabase
    .from("conversations")
    .insert({
      tenant_id,
      project_id: projectId,
      contact_id: contactId,
    } as never)
    .select("id, contact_id, human_handoff")
    .single();

  if (error || !created) {
    throw new Error(`Failed to create conversation: ${error?.message}`);
  }

  return created as unknown as { id: string; contact_id: string; human_handoff: boolean };
}

export async function addMessage(
  projectId: string,
  phone: string,
  message: ConversationMessage,
  externalMessageId?: string
): Promise<void> {
  const conv = await getOrCreateConversation(projectId, phone);
  const { tenant_id } = await getProjectTenant(projectId);

  const now = new Date().toISOString();
  const direction = message.role === "user" ? "inbound" : "outbound";

  const { error } = await supabase
    .from("messages")
    .insert({
      tenant_id,
      conversation_id: conv.id,
      contact_id: conv.contact_id,
      external_message_id: externalMessageId ?? null,
      role: message.role,
      direction,
      content: message.content,
      message_type: message.tool_calls ? "tool_calls" : "text",
      raw_payload: message.tool_calls
        ? { tool_calls: message.tool_calls }
        : null,
    } as never);

  if (error) {
    throw new Error(`Failed to insert message: ${error.message}`);
  }

  if (isN8nConfigured()) {
    emitN8nEvent(
      buildN8nEvent("new_message", {
        projectId,
        phone,
        conversationId: conv.id,
        payload: { role: message.role, direction },
      })
    ).catch(() => {});
  }

  const updateFields: Record<string, string> = {
    last_message_at: now,
  };
  if (direction === "inbound") {
    updateFields.last_inbound_at = now;
  } else {
    updateFields.last_outbound_at = now;
  }

  await supabase
    .from("conversations")
    .update(updateFields as never)
    .eq("id", conv.id);
}

export async function getMessages(
  projectId: string,
  phone: string
): Promise<ConversationMessage[]> {
  const conv = await getOrCreateConversation(projectId, phone);

  const { data: rows } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conv.id)
    .order("created_at", { ascending: true })
    .limit(50);

  const systemMessage: ConversationMessage = {
    role: "system",
    content: DEFAULT_SYSTEM_PROMPT,
  };

  const dbRows = (rows ?? []) as unknown as {
    role: string;
    content: string;
    raw_payload: unknown;
  }[];

  const conversationMessages: ConversationMessage[] = dbRows.map((row) => {
    const msg: ConversationMessage = {
      role: row.role as ConversationMessage["role"],
      content: row.content,
    };
    if (
      row.role === "assistant" &&
      row.raw_payload &&
      typeof row.raw_payload === "object" &&
      "tool_calls" in (row.raw_payload as Record<string, unknown>)
    ) {
      msg.tool_calls = (
        row.raw_payload as { tool_calls: ConversationMessage["tool_calls"] }
      ).tool_calls;
    }
    return msg;
  });

  return [systemMessage, ...conversationMessages];
}

export async function setHandoffRequested(
  projectId: string,
  phone: string,
  reason: string
): Promise<string> {
  const conv = await getOrCreateConversation(projectId, phone);

  const { tenant_id } = await getProjectTenant(projectId);

  await supabase
    .from("conversations")
    .update({
      human_handoff: true,
      assigned_agent: reason,
      status: "handoff",
    } as never)
    .eq("id", conv.id);

  const { data: req, error } = await supabase
    .from("handoff_requests")
    .insert({
      tenant_id,
      conversation_id: conv.id,
      requested_by: "ai",
      reason,
      status: "pending",
    } as never)
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

  return reqId;
}

export async function isHandoffRequested(
  projectId: string,
  phone: string
): Promise<boolean> {
  try {
    const conv = await getOrCreateConversation(projectId, phone);
    return conv.human_handoff;
  } catch {
    return false;
  }
}

export async function clearMemory(
  projectId: string,
  phone: string
): Promise<void> {
  const { tenant_id } = await getProjectTenant(projectId);
  const contactId = await upsertContact(projectId, tenant_id, phone);

  const { data: conv } = await supabase
    .from("conversations")
    .select("id")
    .eq("project_id", projectId)
    .eq("contact_id", contactId)
    .single();

  if (conv) {
    await supabase
      .from("messages")
      .delete()
      .eq("conversation_id", (conv as unknown as { id: string }).id);
    await supabase
      .from("conversations")
      .delete()
      .eq("id", (conv as unknown as { id: string }).id);
  }
}

// ---- Webhook persistence ----

export async function logWebhookEvent(params: {
  source: string;
  eventType?: string;
  status?: string;
  rawPayload: unknown;
  error?: string;
  projectId?: string;
  sessionId?: string;
}): Promise<string> {
  const { data, error } = await supabase
    .from("webhook_events")
    .insert({
      source: params.source,
      event_type: params.eventType ?? null,
      status: params.status ?? "received",
      raw_payload: params.rawPayload,
      error: params.error ?? null,
      project_id: params.projectId ?? null,
      session_id: params.sessionId ?? null,
    } as never)
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
  await supabase
    .from("webhook_events")
    .update({ status: "processed", processed_at: new Date().toISOString() } as never)
    .eq("id", eventId);
}

export async function markWebhookFailed(
  eventId: string,
  error: string
): Promise<void> {
  if (!eventId) return;
  await supabase
    .from("webhook_events")
    .update({ status: "failed", error } as never)
    .eq("id", eventId);
}

export async function isDuplicateMessage(
  projectId: string,
  externalMessageId: string
): Promise<boolean> {
  if (!externalMessageId) return false;

  const { data } = await supabase
    .from("messages")
    .select("id")
    .eq("external_message_id", externalMessageId)
    .single();

  return !!data;
}
