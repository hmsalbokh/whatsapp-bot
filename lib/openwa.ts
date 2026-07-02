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

  const res = await fetch(`${baseUrl}/api/send`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to,
      text,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "unknown error");
    throw new OpenWAError(
      `OpenWA API error (${res.status}): ${text}`,
      res.status
    );
  }
}
