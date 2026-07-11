import { OpenWAError } from "@/lib/integrations/openwa/errors";
import { resolveSessionId } from "@/lib/integrations/openwa/utils";

async function getSessionConfig(projectId?: string, sessionIdOverride?: string): Promise<{
  baseUrl: string;
  token: string;
  sessionId: string;
}> {
  if (projectId) {
    try {
      const { getServiceClient } = await import("@/lib/supabase");
      const admin = getServiceClient();
      const { data } = await admin
        .from("whatsapp_sessions")
        .select("config, is_active")
        .eq("project_id", projectId)
        .maybeSingle();

      if (data) {
        const session = data as unknown as { config: Record<string, string>; is_active: boolean };
        if (session.is_active && session.config) {
          return {
            baseUrl: session.config.baseUrl,
            token: session.config.apiToken,
            sessionId: sessionIdOverride || session.config.sessionId || session.config.sessionName,
          };
        }
      }
    } catch {
      // Fall through to env vars
    }
  }

  const baseUrl = process.env.OPENWA_BASE_URL;
  const token = process.env.OPENWA_API_TOKEN;
  const sessionId = sessionIdOverride || process.env.OPENWA_SESSION_ID || "131eae3c-5842-4492-bb3c-7bdface3edd3";

  if (!baseUrl || !token) {
    throw new OpenWAError("OpenWA is not configured");
  }

  return { baseUrl, token, sessionId };
}

export async function sendMessage(
  to: string,
  text: string,
  projectId?: string,
  sessionIdOverride?: string
): Promise<void> {
  const { baseUrl, token, sessionId } = await getSessionConfig(projectId, sessionIdOverride);
  const sid = await resolveSessionId(baseUrl, token, sessionId);

  const res = await fetch(`${baseUrl}/api/sessions/${sid}/messages/send-text`, {
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
