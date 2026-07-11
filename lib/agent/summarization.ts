import { getServiceClient } from "@/lib/supabase";
import { getOrCreateConversation } from "@/lib/db/conversations";

function getSupabase() { return getServiceClient(); }

export async function saveSummary(
  conversationId: string,
  summary: string
): Promise<void> {
  await getSupabase()
    .from("conversations")
    .update({
      summary,
      summary_generated_at: new Date().toISOString(),
    } as never)
    .eq("id", conversationId);
}

export async function getSummary(
  projectId: string,
  phone: string
): Promise<{ summary: string | null; summary_generated_at: string | null }> {
  const conv = await getOrCreateConversation(projectId, phone);
  const { data } = await getSupabase()
    .from("conversations")
    .select("summary, summary_generated_at")
    .eq("id", conv.id)
    .single();
  const row = data as unknown as { summary: string | null; summary_generated_at: string | null } | null;
  return { summary: row?.summary ?? null, summary_generated_at: row?.summary_generated_at ?? null };
}

async function getConversationSummary(conversationId: string): Promise<string | null> {
  const { data } = await getSupabase()
    .from("conversations")
    .select("summary")
    .eq("id", conversationId)
    .single();
  const row = data as unknown as { summary: string | null } | null;
  return row?.summary ?? null;
}

export async function generateAndSaveSummary(
  projectId: string,
  phone: string
): Promise<string> {
  const conv = await getOrCreateConversation(projectId, phone);

  const { data: rows } = await getSupabase()
    .from("messages")
    .select("role, content, created_at")
    .eq("conversation_id", conv.id)
    .order("created_at", { ascending: true });

  const allMessages = (rows ?? []) as unknown as {
    role: string;
    content: string;
    created_at: string;
  }[];

  if (allMessages.length === 0) return "";

  const text = allMessages
    .filter((m) => m.role !== "system" && m.role !== "tool")
    .map((m) => {
      const label = m.role === "user" ? "العميل" : "المساعد";
      return `${label}: ${m.content}`;
    })
    .join("\n");

  const { OPENROUTER_API_KEY } = process.env;

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "qwen/qwen-2.5-72b-instruct",
      messages: [
        {
          role: "system",
          content: `لخص المحادثة التالية بين عميل ومساعد خدمة عملاء باللغة العربية.
الملخص يجب أن يكون:
- موجزاً (جملة إلى جملتين)
- يذكر الموضوع الرئيسي والطلب أو المشكلة
- يذكر أي إجراء تم اتخاذه (مثل تحويل لبشر، فتح تذكرة، إلخ)
- لا يذكر تفاصيل تحية أو وداع`,
        },
        { role: "user", content: text },
      ],
      max_tokens: 300,
      temperature: 0.3,
    }),
  });

  if (!res.ok) {
    console.error("[memory] summarization API error", res.status);
    return (await getConversationSummary(conv.id)) ?? "";
  }

  const json = (await res.json()) as {
    choices: { message: { content: string } }[];
  };
  const summary = json.choices?.[0]?.message?.content?.trim() ?? "";

  if (summary) {
    await saveSummary(conv.id, summary);
  }

  return summary || (await getConversationSummary(conv.id)) || "";
}
