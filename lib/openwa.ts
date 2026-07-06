export class OpenWAError extends Error {
  constructor(
    message: string,
    public status?: number
  ) {
    super(message);
    this.name = "OpenWAError";
  }
}

function getSessionName(): string {
  return process.env.OPENWA_SESSION || "bot-session2";
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

  const sessionName = getSessionName();
  const res = await fetch(`${baseUrl}/api/sessions/${sessionName}/messages/send-text`, {
    method: "POST",
    headers: {
      "X-API-Key": token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to,
      body: text,
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
