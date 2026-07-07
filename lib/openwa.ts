export class OpenWAError extends Error {
  constructor(
    message: string,
    public status?: number
  ) {
    super(message);
    this.name = "OpenWAError";
  }
}

export async function sendMessage(
  to: string,
  text: string
): Promise<void> {
  const baseUrl = process.env.OPENWA_BASE_URL;
  const token = process.env.OPENWA_API_TOKEN;

  if (!baseUrl || !token) {
    throw new OpenWAError("OpenWA is not configured");
  }

  const sessionId = process.env.OPENWA_SESSION_ID || "131eae3c-5842-4492-bb3c-7bdface3edd3";
  const res = await fetch(`${baseUrl}/api/sessions/${sessionId}/messages/send-text`, {
    method: "POST",
    headers: {
      "X-API-Key": token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chatId: to,
      text: text,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "unknown error");
    throw new OpenWAError(
      `OpenWA API error (${res.status}): ${errText}`,
      res.status
    );
  }
}
