import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getServiceClient } from "@/lib/supabase";
import { ok, err } from "@/lib/api-utils";

const supabase = getServiceClient();

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = (await params).id;
    const s = await createClient();
    const { data: { user } } = await s.auth.getUser();
    if (!user) return err("Unauthorized", 401);

    const { data: event } = await supabase
      .from("webhook_events")
      .select("id, raw_payload, project_id, tenant_id")
      .eq("id", id)
      .single();

    if (!event) return err("Webhook event not found", 404);

    const ev = event as unknown as {
      raw_payload: Record<string, unknown> | null;
      project_id: string | null;
      tenant_id: string | null;
    };

    // Verify tenant access
    if (ev.tenant_id) {
      const { data: membership } = await supabase
        .from("tenant_users")
        .select("id")
        .eq("tenant_id", ev.tenant_id)
        .eq("user_id", user.id)
        .single();
      if (!membership) return err("Access denied", 403);
    }

    if (!ev.raw_payload || !ev.project_id) {
      return err("Event has no payload or project_id to replay", 400);
    }

    const webhookUrl = new URL(
      "/api/openwa/webhook",
      process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
    );

    const res = await fetch(webhookUrl.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ev.raw_payload),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "unknown");
      return err(`Replay failed: ${res.status}`, 502, text);
    }

    const result = await res.json();

    await supabase
      .from("webhook_events")
      .update({ status: "replayed", processed_at: new Date().toISOString() } as never)
      .eq("id", id);

    return ok({ status: "ok", replayResult: result });
  } catch (e) {
    return err("Replay failed", 502, (e as Error).message);
  }
}
