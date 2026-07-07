import type {
  ConversationMessage,
  OpenRouterResponse,
  ToolDefinition,
} from "@/types";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY ?? "";

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
  tools?: ToolDefinition[],
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }
): Promise<OpenRouterResponse> {
  if (!OPENROUTER_API_KEY) {
    throw new OpenRouterError("OPENROUTER_API_KEY is not configured");
  }

  const model =
    options?.model ??
    process.env.OPENROUTER_MODEL ??
    "qwen/qwen-2.5-72b-instruct";

  const body: Record<string, unknown> = {
    model,
    messages: messages.map((m) => {
      const msg: Record<string, unknown> = {
        role: m.role,
        content: m.content,
      };
      if (m.role === "tool") {
        msg.tool_call_id = m.tool_call_id || "call_unknown";
        msg.name = m.name || "unknown_tool";
      } else if (m.name) {
        msg.name = m.name;
      }
      if (m.tool_calls) {
        msg.tool_calls = m.tool_calls;
      }
      return msg;
    }),
  };

  if (options?.temperature !== undefined) {
    body.temperature = options.temperature;
  }
  if (options?.maxTokens !== undefined) {
    body.max_tokens = options.maxTokens;
  }

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
