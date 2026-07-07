export class OpenWAError extends Error {
  constructor(
    message: string,
    public status?: number
  ) {
    super(message);
    this.name = "OpenWAError";
  }
}

export async function createOpenWASession(
  baseUrl: string,
  token: string,
  sessionName: string
): Promise<{ sessionId: string; qr?: string }> {
  const url = `${baseUrl.replace(/\/+$/, "")}/api/sessions`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name: sessionName }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "unknown error");
    throw new OpenWAError(`OpenWA create session error (${res.status}): ${text}`, res.status);
  }

  const data = await res.json();
  return {
    sessionId: data.id ?? data.sessionId ?? data.name ?? sessionName,
    qr: data.qr ?? data.qrCode ?? undefined,
  };
}

export async function getOpenWAQR(
  baseUrl: string,
  token: string,
  sessionName: string
): Promise<{ qr: string }> {
  const url = `${baseUrl.replace(/\/+$/, "")}/api/sessions/${encodeURIComponent(sessionName)}/qr`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "unknown error");
    throw new OpenWAError(`OpenWA QR error (${res.status}): ${text}`, res.status);
  }

  const contentType = res.headers.get("content-type") ?? "";

  if (contentType.includes("image")) {
    const buffer = await res.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const mime = contentType.includes("png") ? "image/png" : "image/jpeg";
    return { qr: `data:${mime};base64,${base64}` };
  }

  const data = await res.json();
  return { qr: data.qr ?? data.qrCode ?? data.image ?? "" };
}

export async function getOpenWASessionStatus(
  baseUrl: string,
  token: string,
  sessionName: string
): Promise<{
  exists: boolean;
  status: string;
  phone?: string;
}> {
  const url = `${baseUrl.replace(/\/+$/, "")}/api/sessions/${encodeURIComponent(sessionName)}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
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

export async function deleteOpenWASession(
  baseUrl: string,
  token: string,
  sessionName: string
): Promise<void> {
  const url = `${baseUrl.replace(/\/+$/, "")}/api/sessions/${encodeURIComponent(sessionName)}`;

  const res = await fetch(url, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok && res.status !== 404) {
    const text = await res.text().catch(() => "unknown error");
    throw new OpenWAError(`OpenWA delete error (${res.status}): ${text}`, res.status);
  }
}
