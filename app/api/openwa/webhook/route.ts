import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { addMessage, getMessages, isHandoffRequested } from "@/lib/memory";
import { chat, OpenRouterError } from "@/lib/openrouter";
import { sendMessage, OpenWAError } from "@/lib/openwa";
import { toolDefinitions, executeTool } from "@/lib/tools";
import type { ConversationMessage } from "@/types";

const webhookSchema = z.object({
  from: z.string().min(1, "sender phone is required"),
  body: z.string().min(1, "message body is required"),
  messageId: z.string().optional(),
  timestamp: z.number().optional(),
});

interface ErrorResponse {
  error: string;
  detail?: string;
}

function errorResponse(
  status: number,
  message: string,
  detail?: string
): NextResponse<ErrorResponse> {
  return NextResponse.json(
    { error: message, detail },
    { status }
  );
}

async function processWithTools(
  phone: string,
  maxTurns = 5
): Promise<string> {
  const messages = getMessages(phone);

  if (isHandoffRequested(phone)) {
    return "تم تحويل محادثتك إلى فريق الدعم البشري. سيتم الرد عليك قريبًا.";
  }

  for (let turn = 0; turn < maxTurns; turn++) {
    const response = await chat(messages, toolDefinitions);
    const choice = response.choices[0];

    if (!choice) {
      throw new Error("No response from OpenRouter");
    }

    const { message } = choice;

    if (message.tool_calls && message.tool_calls.length > 0) {
      addMessage(phone, {
        role: "assistant",
        content: message.content ?? "",
        tool_calls: message.tool_calls.map((tc) => ({
          ...tc,
          function: tc.function,
        })),
      } as unknown as ConversationMessage);

      for (const toolCall of message.tool_calls) {
        const args = JSON.parse(toolCall.function.arguments);
        const result = executeTool(
          toolCall.function.name,
          args,
          phone
        );

        addMessage(phone, {
          role: "tool",
          content: JSON.stringify(result),
          tool_call_id: toolCall.id,
          name: toolCall.function.name,
        } as ConversationMessage);
      }
    } else {
      const text = message.content ?? "";
      addMessage(phone, {
        role: "assistant",
        content: text,
      });
      return text;
    }
  }

  return "عذرًا، استغرق الرد وقتًا أطول من المتوقع. يرجى المحاولة مرة أخرى لاحقًا.";
}

export async function POST(
  request: NextRequest
): Promise<NextResponse> {
  const start = Date.now();
  const logCtx = { method: "POST", path: "/api/openwa/webhook" };

  try {
    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return errorResponse(400, "Invalid JSON body");
    }

    const parsed = webhookSchema.safeParse(rawBody);
    if (!parsed.success) {
      console.warn("[webhook] validation failed", {
        ...logCtx,
        errors: parsed.error.flatten(),
      });
      return errorResponse(
        422,
        "Validation failed",
JSON.stringify(parsed.error.flatten().fieldErrors)
      );
    }

    const { from, body } = parsed.data;
    console.info("[webhook] incoming", {
      ...logCtx,
      from,
      bodyLength: body.length,
    });

    addMessage(from, { role: "user", content: body });
    const reply = await processWithTools(from);

    try {
      await sendMessage(from, reply);
      console.info("[webhook] reply sent", {
        ...logCtx,
        from,
        duration: Date.now() - start,
      });
    } catch (sendErr) {
      console.error("[webhook] send failed", {
        ...logCtx,
        from,
        error: sendErr instanceof Error ? sendErr.message : String(sendErr),
      });
      return errorResponse(502, "Failed to send reply via OpenWA");
    }

    return NextResponse.json({
      status: "ok",
      replySent: true,
      duration: Date.now() - start,
    });
  } catch (err) {
    const message =
      err instanceof OpenRouterError
        ? `OpenRouter error: ${err.message}`
        : err instanceof Error
        ? err.message
        : "Unknown error";

    console.error("[webhook] error", {
      ...logCtx,
      error: message,
      duration: Date.now() - start,
    });

    return errorResponse(500, "Internal server error", message);
  }
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    service: "WhatsApp Bot Webhook",
    status: "active",
    endpoints: {
      webhook: "POST /api/openwa/webhook",
      health: "GET /api/openwa/webhook",
    },
  });
}
