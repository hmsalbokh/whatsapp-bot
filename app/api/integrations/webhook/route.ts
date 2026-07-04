import { NextRequest } from "next/server";
import { z } from "zod";
import { logWebhookEvent } from "@/lib/memory";
import { emitN8nEvent, buildN8nEvent } from "@/lib/sidecar/n8n";
import { ok, err } from "@/lib/api-utils";

const INTEGRATION_API_KEY = process.env.INTEGRATION_API_KEY;

function verifyIntegrationAuth(request: NextRequest): boolean {
  if (!INTEGRATION_API_KEY) return false;
  const auth = request.headers.get("authorization");
  return auth === `Bearer ${INTEGRATION_API_KEY}`;
}

const integrationSchema = z.object({
  source: z.string().min(1),
  event: z.string().min(1),
  projectId: z.string().optional(),
  phone: z.string().optional(),
  payload: z.record(z.unknown()).optional(),
});

export async function POST(request: NextRequest) {
  if (!verifyIntegrationAuth(request)) {
    return err("Unauthorized — valid INTEGRATION_API_KEY required", 401);
  }

  try {
    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return err("Invalid JSON", 400);
    }

    const parsed = integrationSchema.safeParse(rawBody);
    if (!parsed.success) {
      return err("Validation failed", 422, JSON.stringify(parsed.error.flatten().fieldErrors));
    }

    const { source, event, projectId, phone, payload } = parsed.data;

    const eventId = await logWebhookEvent({
      source: `integration:${source}`,
      eventType: event,
      rawPayload: payload ?? {},
      projectId,
    });

    emitN8nEvent(
      buildN8nEvent(`integration:${event}`, { projectId, phone, payload })
    ).catch(() => {});

    return ok(
      { status: "ok", eventId, message: `Event '${event}' from '${source}' received` },
      201
    );
  } catch (e) {
    return err("Integration error", 500, (e as Error).message);
  }
}

export async function GET(request: NextRequest) {
  if (!verifyIntegrationAuth(request)) {
    return err("Unauthorized", 401);
  }
  return ok({
    service: "External Integrations",
    version: "1.0",
    endpoints: {
      webhook: "POST /api/integrations/webhook — Receive events from Zapier, Make, etc.",
    },
  });
}
