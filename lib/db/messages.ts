import { getServiceClient } from "@/lib/supabase";
import { emitN8nEvent, buildN8nEvent, isN8nConfigured } from "@/lib/sidecar/n8n";
import { getOrCreateConversation } from "./conversations";
import { getProjectTenant } from "./projects";
import { generateAndSaveSummary } from "@/lib/agent/summarization";
import type { ConversationMessage } from "@/types";

function getSupabase() { return getServiceClient(); }

const SUMMARY_INTERVAL = 20;

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

  const { error } = await getSupabase()
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
    } as any);

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

  await getSupabase()
    .from("conversations")
    .update(updateFields as never)
    .eq("id", conv.id);

  if (direction === "outbound") {
    try {
      const { data: sumRow } = await getSupabase()
        .from("conversations")
        .select("summary_generated_at")
        .eq("id", conv.id)
        .single();
      const s = sumRow as unknown as { summary_generated_at: string | null } | null;
      const shouldSummarize = !s?.summary_generated_at
        || (Date.now() - new Date(s.summary_generated_at).getTime()) > 60000;

      if (shouldSummarize) {
        const { count } = await getSupabase()
          .from("messages")
          .select("id", { count: "exact", head: true })
          .eq("conversation_id", conv.id);

        if (count && count % SUMMARY_INTERVAL === 0) {
          generateAndSaveSummary(projectId, phone).catch((err) =>
            console.error("[memory] background summarization failed", err)
          );
        }
      }
    } catch (err) {
      console.error("[memory] summary check failed, skipping:", err);
    }
  }
}

export async function getMessages(
  projectId: string,
  phone: string
): Promise<ConversationMessage[]> {
  const conv = await getOrCreateConversation(projectId, phone);

  const { data: rows } = await getSupabase()
    .from("messages")
    .select("*")
    .eq("conversation_id", conv.id)
    .order("created_at", { ascending: true })
    .limit(50);

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

  const result: ConversationMessage[] = [];

  try {
    const { data: sumRow } = await getSupabase()
      .from("conversations")
      .select("summary, summary_generated_at")
      .eq("id", conv.id)
      .single();
    const s = sumRow as unknown as { summary: string | null; summary_generated_at: string | null } | null;
    if (s?.summary && s.summary_generated_at) {
      const daysSinceSummary = (Date.now() - new Date(s.summary_generated_at).getTime()) / 86400000;
      if (daysSinceSummary <= 1) {
        result.push({
          role: "system",
          content: `[ملخص المحادثة السابقة: ${s.summary}]`,
        });
      }
    }
  } catch {
    // summary columns may not exist yet — skip
  }

  result.push(...conversationMessages);
  return result;
}

export async function isDuplicateMessage(
  projectId: string,
  externalMessageId: string
): Promise<boolean> {
  if (!externalMessageId) return false;

  const { data } = await getSupabase()
    .from("messages")
    .select("id")
    .eq("external_message_id", externalMessageId)
    .single();

  return !!data;
}
