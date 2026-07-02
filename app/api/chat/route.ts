import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { addMessage, getMessages, isHandoffRequested } from "@/lib/memory";
import { chat, OpenRouterError } from "@/lib/openrouter";
import { toolDefinitions, executeTool } from "@/lib/tools";
import type { ConversationMessage } from "@/types";

const chatSchema = z.object({
  from: z.string().min(1),
  body: z.string().min(1),
});

interface ToolCallInfo {
  name: string;
  args: string;
  result: string;
}

async function processWithTools(
  phone: string,
  maxTurns = 5
): Promise<{ reply: string; toolCalls: ToolCallInfo[] }> {
  const toolCalls: ToolCallInfo[] = [];

  if (isHandoffRequested(phone)) {
    return {
      reply: "تم تحويل محادثتك إلى فريق الدعم البشري. سيتم الرد عليك قريبًا.",
      toolCalls,
    };
  }

  for (let turn = 0; turn < maxTurns; turn++) {
    const response = await chat(getMessages(phone), toolDefinitions);
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
        const result = executeTool(toolCall.function.name, args, phone);

        toolCalls.push({
          name: toolCall.function.name,
          args: toolCall.function.arguments,
          result: JSON.stringify(result),
        });

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
      return { reply: text, toolCalls };
    }
  }

  return {
    reply: "عذرًا، استغرق الرد وقتًا أطول من المتوقع. يرجى المحاولة مرة أخرى لاحقًا.",
    toolCalls,
  };
}

export async function POST(request: NextRequest) {
  const start = Date.now();

  try {
    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = chatSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", detail: parsed.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    const { from, body } = parsed.data;

    addMessage(from, { role: "user", content: body });
    const { reply, toolCalls } = await processWithTools(from);

    return NextResponse.json({
      reply,
      toolCalls,
      duration: Date.now() - start,
    });
  } catch (err) {
    const message =
      err instanceof OpenRouterError
        ? `OpenRouter error: ${err.message}`
        : err instanceof Error
          ? err.message
          : "Unknown error";

    return NextResponse.json(
      { error: "Internal server error", detail: message },
      { status: 500 }
    );
  }
}
