import { NextRequest } from "next/server";
import { z } from "zod";
import { ok, err } from "@/lib/api-utils";

const SIDECAR_API_KEY = process.env.SIDECAR_API_KEY;

function verifySidecarAuth(request: NextRequest): boolean {
  if (!SIDECAR_API_KEY) return false;
  const auth = request.headers.get("authorization");
  return auth === `Bearer ${SIDECAR_API_KEY}`;
}

const n8nSchema = z.object({
  action: z.enum(["send_message", "update_conversation", "trigger_handoff", "custom"]),
  projectId: z.string().optional(),
  phone: z.string().optional(),
  text: z.string().optional(),
  payload: z.record(z.unknown()).optional(),
});

export async function POST(request: NextRequest) {
  if (!verifySidecarAuth(request)) {
    return err("Unauthorized — valid SIDECAR_API_KEY required", 401);
  }

  try {
    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return err("Invalid JSON", 400);
    }

    const parsed = n8nSchema.safeParse(rawBody);
    if (!parsed.success) {
      return err("Validation failed", 422, JSON.stringify(parsed.error.flatten().fieldErrors));
    }

    const { action, projectId, phone, text, payload } = parsed.data;

    switch (action) {
      case "send_message": {
        if (!phone || !text) return err("phone and text are required", 400);
        const { sendMessage } = await import("@/lib/openwa");
        await sendMessage(phone, text);
        return ok({ status: "ok", action: "message_sent" });
      }

      case "trigger_handoff": {
        if (!projectId || !phone) return err("projectId and phone are required", 400);
        const { setHandoffRequested } = await import("@/lib/memory");
        await setHandoffRequested(
          projectId,
          phone,
          (payload?.reason as string) ?? "تحويل من n8n"
        );
        return ok({ status: "ok", action: "handoff_triggered" });
      }

      case "custom": {
        const { logWebhookEvent } = await import("@/lib/memory");
        await logWebhookEvent({
          source: "n8n",
          eventType: "custom_action",
          rawPayload: payload ?? {},
          projectId,
        });
        return ok({ status: "ok", action: "custom_logged" });
      }

      default:
        return err("Unknown action", 400);
    }
  } catch (e) {
    return err("Sidecar error", 500, (e as Error).message);
  }
}

export async function GET(request: NextRequest) {
  if (!verifySidecarAuth(request)) {
    return err("Unauthorized", 401);
  }
  return ok({
    service: "n8n Sidecar",
    version: "1.0",
    actions: ["send_message", "update_conversation", "trigger_handoff", "custom"],
  });
}
