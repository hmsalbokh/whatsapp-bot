import type {
  ConversationMessage,
  OpenRouterResponse,
  ToolDefinition,
} from "@/types";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY ?? "";
const MODEL =
  process.env.OPENROUTER_MODEL ?? "meta-llama/llama-3.3-70b-versatile";

export class OpenRouterError extends Error {
  constructor(
    message: string,
    public status?: number
  ) {
    super(message);
    this.name = "OpenRouterError";
  }
}

export async function chat(
  messages: ConversationMessage[],
  tools?: ToolDefinition[]
): Promise<OpenRouterResponse> {
  if (!OPENROUTER_API_KEY) {
    throw new OpenRouterError(
      "OPENROUTER_API_KEY is not configured"
    );
  }

  const body: Record<string, unknown> = {
    model: MODEL,
    messages: messages.map((m) => {
      const msg: Record<string, string> = {
        role: m.role,
        content: m.content,
      };
      if (m.role === "tool" && m.tool_call_id) {
        msg.tool_call_id = m.tool_call_id;
      }
      if (m.name) {
        msg.name = m.name;
      }
      return msg;
    }),
  };

  if (tools && tools.length > 0) {
    body.tools = tools;
    body.tool_choice = "auto";
  }

  const res = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://whatsapp-bot.vercel.app",
        "X-Title": "WhatsApp Customer Service Bot",
      },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const text = await res.text().catch(() => "unknown error");
    throw new OpenRouterError(
      `OpenRouter API error (${res.status}): ${text}`,
      res.status
    );
  }

  return res.json() as Promise<OpenRouterResponse>;
}
