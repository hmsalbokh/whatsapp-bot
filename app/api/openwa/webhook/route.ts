import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  addMessage,
  logWebhookEvent,
  markWebhookProcessed,
  markWebhookFailed,
  isDuplicateMessage,
  isHandoffRequested,
} from "@/lib/memory";
import { processWithTools } from "@/lib/agent-runtime";
import { sendMessage } from "@/lib/openwa";
import { OpenRouterError } from "@/lib/openrouter";
import { checkMessageLimit } from "@/lib/subscription-guard";
import type { ConversationMessage } from "@/types";

const webhookSchema = z.object({
  from: z.string().min(1),
  body: z.string().min(1),
  messageId: z.string().optional(),
  timestamp: z.number().optional(),
  projectId: z.string().optional(),
  event: z.string().optional(),
  sessionId: z.string().optional(),
  data: z.object({
    id: z.string().optional(),
    from: z.string().optional(),
    body: z.string().optional(),
    timestamp: z.number().optional(),
  }).optional(),
});

function errorResponse(status: number, message: string, detail?: string) {
  return NextResponse.json({ error: message, detail }, { status });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const start = Date.now();

  try {
    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return errorResponse(400, "Invalid JSON body");
    }

    // Allow projectId from query param (OpenWA cannot send it in body)
    const queryProjectId = request.nextUrl.searchParams.get("projectId") || undefined;

    // Normalize OpenWA payload (wraps data in { event, sessionId, data: {...} })
    let normalizedBody = rawBody;
    if (typeof rawBody === "object" && rawBody !== null && "data" in rawBody) {
      const { data, ...rest } = rawBody as Record<string, unknown>;
      const nested = typeof data === "object" && data !== null ? (data as Record<string, unknown>) : {};
      normalizedBody = {
        ...rest,
        from: nested.from || rest.from,
        body: nested.body || rest.body,
        messageId: nested.id || rest.messageId,
        timestamp: nested.timestamp || rest.timestamp,
        projectId: queryProjectId || rest.projectId,
      };
    } else if (typeof rawBody === "object" && rawBody !== null) {
      (normalizedBody as Record<string, unknown>).projectId = queryProjectId || (rawBody as Record<string, unknown>).projectId;
    }

    const parsed = webhookSchema.safeParse(normalizedBody);
    if (!parsed.success) {
      return errorResponse(
        422,
        "Validation failed",
        JSON.stringify(parsed.error.flatten().fieldErrors)
      );
    }

    const { from, body, messageId, projectId } = parsed.data;

    const eventId = await logWebhookEvent({
      source: "openwa",
      eventType: "message",
      rawPayload: parsed.data,
      projectId,
    });

    if (!projectId) {
      await markWebhookFailed(eventId, "No projectId provided");
      return errorResponse(400, "projectId is required - add ?projectId=YOUR_PROJECT_ID to webhook URL");
    }

    // Idempotency
    if (messageId) {
      const duplicate = await isDuplicateMessage(projectId, messageId);
      if (duplicate) {
        await markWebhookProcessed(eventId);
        return NextResponse.json({
          status: "ok",
          duplicate: true,
          duration: Date.now() - start,
        });
      }
    }

    // Persist user message
    await addMessage(projectId, from, { role: "user", content: body }, messageId);

    // Check handoff
    if (await isHandoffRequested(projectId, from)) {
      const reply = "تم تحويل محادثتك إلى فريق الدعم البشري. سيتم الرد عليك قريبًا.";
      await sendMessage(from, reply, projectId).catch(() => {});
      await markWebhookProcessed(eventId);
      return NextResponse.json({ status: "ok", replySent: true, duration: Date.now() - start });
    }

    // Check message limit
    const msgLimit = await checkMessageLimit(projectId);
    if (!msgLimit.allowed) {
      const reply = "عذرًا، تم تجاوز الحد المسموح من الرسائل لهذا الشهر. يرجى ترقية خطتك للمتابعة.";
      await sendMessage(from, reply, projectId).catch(() => {});
      await markWebhookProcessed(eventId);
      return NextResponse.json({ status: "ok", replySent: true, blocked: true, duration: Date.now() - start });
    }

    // Process with AI (project-specific model, prompt, knowledge)
    const reply = await processWithTools(projectId, from);

    // Send reply
    try {
      await sendMessage(from, reply, projectId);
    } catch (sendErr) {
      await markWebhookFailed(
        eventId,
        `Send failed: ${sendErr instanceof Error ? sendErr.message : String(sendErr)}`
      );
      return errorResponse(502, "Failed to send reply via OpenWA");
    }

    await markWebhookProcessed(eventId);

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

    return errorResponse(500, "Internal server error", message);
  }
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    service: "WhatsApp Bot Webhook",
    status: "active",
    endpoints: { webhook: "POST /api/openwa/webhook", health: "GET /api/openwa/webhook" },
  });
}
