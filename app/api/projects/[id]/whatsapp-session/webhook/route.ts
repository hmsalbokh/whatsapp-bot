import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireProjectAccess } from "@/lib/api-guard";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const s = await createClient();
    const { data: { user } } = await s.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await requireProjectAccess(user.id, projectId);

    const body = await request.json();
    let { baseUrl, apiToken, sessionName } = body;

    if (!sessionName) {
      return NextResponse.json({ error: "اسم الجلسة مطلوب" }, { status: 400 });
    }

    baseUrl = baseUrl || process.env.OPENWA_BASE_URL || "";
    apiToken = apiToken || process.env.OPENWA_API_TOKEN || "";

    if (!baseUrl || !apiToken) {
      return NextResponse.json({ error: "OpenWA غير مضبوط" }, { status: 400 });
    }

    const origin = new URL(request.url).origin;
    const webhookUrl = `${origin}/api/openwa/webhook?projectId=${projectId}`;

    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    let sid = sessionName;
    if (!uuidPattern.test(sid)) {
      const resolveRes = await fetch(`${baseUrl.replace(/\/+$/, "")}/api/sessions/${encodeURIComponent(sessionName)}`, {
        headers: { "X-API-Key": apiToken },
      });
      if (resolveRes.ok) {
        const data = await resolveRes.json();
        sid = data.id ?? data.sessionId ?? sessionName;
      } else {
        const listRes = await fetch(`${baseUrl.replace(/\/+$/, "")}/api/sessions`, {
          headers: { "X-API-Key": apiToken },
        });
        if (listRes.ok) {
          const list = await listRes.json() as Array<{ id: string; name: string }>;
          const found = list.find((s) => s.name === sessionName);
          if (found) sid = found.id;
        }
      }
    }

    const whRes = await fetch(`${baseUrl.replace(/\/+$/, "")}/api/sessions/${encodeURIComponent(sid)}/webhooks`, {
      method: "POST",
      headers: { "X-API-Key": apiToken, "Content-Type": "application/json" },
      body: JSON.stringify({
        url: webhookUrl,
        events: ["message.received", "session.status"],
        retryCount: 3,
      }),
    });

    if (!whRes.ok) {
      const text = await whRes.text().catch(() => "unknown error");
      return NextResponse.json({ error: `Failed to set webhook: ${text}` }, { status: 500 });
    }

    return NextResponse.json({ success: true, webhookUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const status = message.includes("denied") || message.includes("not found") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
