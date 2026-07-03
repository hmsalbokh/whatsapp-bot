export class OpenWAError extends Error {
  constructor(
    message: string,
    public status?: number
  ) {
    super(message);
    this.name = 'OpenWAError';
  }
}

function getConfig() {
  const baseUrl = process.env.OPENWA_BASE_URL;
  const token = process.env.OPENWA_API_TOKEN;
  const session = process.env.OPENWA_SESSION;
  if (!baseUrl || !token || !session) {
    throw new OpenWAError('OpenWA is not configured (need OPENWA_BASE_URL, OPENWA_API_TOKEN, OPENWA_SESSION)', 500);
  }
  return { baseUrl: baseUrl.replace(/\/+$/, ''), token, session };
}

export async function sendMessage(to: string, text: string): Promise<void> {
  const { baseUrl, token, session } = getConfig();
  const chatId = to.includes('@') ? to : `${to}@c.us`;

  const response = await fetch(
    `${baseUrl}/api/sessions/${encodeURIComponent(session)}/messages/send-text`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ chatId, text }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new OpenWAError(
      `OpenWA API error (${response.status}): ${errorText}`,
      response.status
    );
  }
}

export async function getStatus() {
  const { baseUrl } = getConfig();
  const response = await fetch(`${baseUrl}/api/health/ready`);
  if (!response.ok) {
    throw new OpenWAError(`OpenWA health check failed (${response.status})`);
  }
  return response.json();
}
