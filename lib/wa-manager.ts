import { OpenWAError } from "@/lib/integrations/openwa/errors";
import { openwaFetch, resolveSessionId } from "@/lib/integrations/openwa/utils";

export async function createOpenWASession(
  baseUrl: string,
  token: string,
  sessionName: string,
  webhookUrl?: string
): Promise<{ sessionId: string; qr?: string }> {
  // Check if session already exists
  let sid: string | undefined;
  try {
    const existing = await resolveSessionId(baseUrl, token, sessionName);
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidPattern.test(existing)) sid = existing;
  } catch {}

  if (!sid) {
    // Create new session
    const res = await openwaFetch(baseUrl, "/api/sessions", {
      method: "POST",
      headers: { "X-API-Key": token, "Content-Type": "application/json" },
      body: JSON.stringify({ name: sessionName }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "unknown error");
      throw new OpenWAError(`OpenWA create error (${res.status}): ${text}`, res.status);
    }

    const created = await res.json();
    sid = created.id ?? created.sessionId;
  }

  if (!sid) {
    throw new OpenWAError("Failed to resolve or create session ID");
  }

  // Start the session (skip if already started)
  const startRes = await openwaFetch(baseUrl, `/api/sessions/${sid}/start`, {
    method: "POST",
    headers: { "X-API-Key": token, "Content-Type": "application/json" },
    body: "{}",
  });

  if (!startRes.ok) {
    const text = await startRes.text().catch(() => "unknown error");
    if (text.includes("already started")) {
      // Session is already running — that's fine
    } else {
      throw new OpenWAError(`OpenWA start error (${startRes.status}): ${text}`, startRes.status);
    }
  }

  if (webhookUrl?.startsWith("http")) {
    await openwaFetch(baseUrl, `/api/sessions/${sid}/webhooks`, {
      method: "POST",
      headers: { "X-API-Key": token, "Content-Type": "application/json" },
      body: JSON.stringify({
        url: webhookUrl,
        events: ["message.received", "session.status"],
        retryCount: 3,
      }),
    }).catch(() => {});
  }

  let qr: string | undefined;
  for (let i = 0; i < 15; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    const qrRes = await openwaFetch(baseUrl, `/api/sessions/${sid}/qr`, {
      headers: { "X-API-Key": token },
    });
    if (qrRes.ok) {
      const ct = qrRes.headers.get("content-type") ?? "";
      if (ct.includes("image") || ct.includes("octet")) {
        const buf = await qrRes.arrayBuffer();
        qr = `data:${ct.includes("png") ? "image/png" : "image/jpeg"};base64,${Buffer.from(buf).toString("base64")}`;
      } else {
        const j = await qrRes.json();
        qr = j.qr ?? j.qrCode ?? j.image;
      }
      if (qr) break;
    }
  }

  return { sessionId: sid as string, qr };
}

export async function getOpenWAQR(
  baseUrl: string,
  token: string,
  sessionNameOrId: string
): Promise<{ qr: string }> {
  const sid = await resolveSessionId(baseUrl, token, sessionNameOrId);
  const res = await openwaFetch(baseUrl, `/api/sessions/${encodeURIComponent(sid)}/qr`, {
    headers: { "X-API-Key": token },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "unknown error");
    throw new OpenWAError(`OpenWA QR error (${res.status}): ${text}`, res.status);
  }

  const ct = res.headers.get("content-type") ?? "";

  if (ct.includes("image") || ct.includes("octet")) {
    const buf = await res.arrayBuffer();
    const mime = ct.includes("png") ? "image/png" : "image/jpeg";
    return { qr: `data:${mime};base64,${Buffer.from(buf).toString("base64")}` };
  }

  const data = await res.json();
  return { qr: data.qr ?? data.qrCode ?? data.image ?? "" };
}

export async function getOpenWASessionStatus(
  baseUrl: string,
  token: string,
  sessionNameOrId: string
): Promise<{
  exists: boolean;
  status: string;
  phone?: string;
}> {
  const sid = await resolveSessionId(baseUrl, token, sessionNameOrId);
  const res = await openwaFetch(baseUrl, `/api/sessions/${encodeURIComponent(sid)}`, {
    headers: { "X-API-Key": token },
  });

  if (res.status === 404) {
    return { exists: false, status: "not_found" };
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "unknown error");
    throw new OpenWAError(`OpenWA status error (${res.status}): ${text}`, res.status);
  }

  const data = await res.json();
  return {
    exists: true,
    status: data.status ?? data.state ?? "unknown",
    phone: data.phone ?? data.phoneNumber ?? data.phone_number ?? undefined,
  };
}

export async function startOpenWASession(
  baseUrl: string,
  token: string,
  sessionNameOrId: string
): Promise<void> {
  const sid = await resolveSessionId(baseUrl, token, sessionNameOrId);
  const res = await openwaFetch(baseUrl, `/api/sessions/${encodeURIComponent(sid)}/start`, {
    method: "POST",
    headers: { "X-API-Key": token, "Content-Type": "application/json" },
    body: "{}",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "unknown error");
    if (!text.includes("already started")) {
      throw new OpenWAError(`OpenWA start error (${res.status}): ${text}`, res.status);
    }
  }
}

export async function stopOpenWASession(
  baseUrl: string,
  token: string,
  sessionNameOrId: string
): Promise<void> {
  const sid = await resolveSessionId(baseUrl, token, sessionNameOrId);
  const res = await openwaFetch(baseUrl, `/api/sessions/${encodeURIComponent(sid)}/stop`, {
    method: "POST",
    headers: { "X-API-Key": token, "Content-Type": "application/json" },
    body: "{}",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "unknown error");
    throw new OpenWAError(`OpenWA stop error (${res.status}): ${text}`, res.status);
  }
}

export async function deleteOpenWASession(
  baseUrl: string,
  token: string,
  sessionNameOrId: string
): Promise<void> {
  const sid = await resolveSessionId(baseUrl, token, sessionNameOrId);
  const res = await openwaFetch(baseUrl, `/api/sessions/${encodeURIComponent(sid)}`, {
    method: "DELETE",
    headers: { "X-API-Key": token },
  });

  if (!res.ok && res.status !== 404) {
    const text = await res.text().catch(() => "unknown error");
    throw new OpenWAError(`OpenWA delete error (${res.status}): ${text}`, res.status);
  }
}
