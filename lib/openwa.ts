export class OpenWAError extends Error {
  constructor(
    message: string,
    public status?: number
  ) {
    super(message);
    this.name = "OpenWAError";
  }
}

let _sessionId: string | null = null;

async function getSessionId(): Promise<string> {
  if (_sessionId) return _sessionId;

  const baseUrl = process.env.OPENWA_BASE_URL;
  const token = process.env.OPENWA_API_TOKEN;
  const sessionName = process.env.OPENWA_SESSION || "bot-session2";

  const res = await fetch(`${baseUrl}/api/sessions`, {
    headers: { "X-API-Key": token ?? "" },
  });
  if (res.ok) {
    const sessions: { id: string; name: string }[] = await res.json();
    const found = sessions.find((s) => s.name === sessionName);
    if (found) {
      _sessionId = found.id;
      return found.id;
    }
  }
  return sessionName;
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

  const sessionId = await getSessionId();
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
