const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL ?? "";

export interface N8nEvent {
  event: string;
  projectId?: string;
  tenantId?: string;
  phone?: string;
  conversationId?: string;
  payload?: unknown;
  timestamp: string;
}

export async function emitN8nEvent(event: N8nEvent): Promise<void> {
  if (!N8N_WEBHOOK_URL) return;

  try {
    await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
      signal: AbortSignal.timeout(3000),
    });
  } catch (err) {
    console.error("[n8n] failed to emit event", event.event, err);
  }
}

export function buildN8nEvent(
  event: string,
  opts: {
    projectId?: string;
    tenantId?: string;
    phone?: string;
    conversationId?: string;
    payload?: unknown;
  }
): N8nEvent {
  return {
    event,
    projectId: opts.projectId,
    tenantId: opts.tenantId,
    phone: opts.phone,
    conversationId: opts.conversationId,
    payload: opts.payload,
    timestamp: new Date().toISOString(),
  };
}

export function isN8nConfigured(): boolean {
  return !!N8N_WEBHOOK_URL;
}
