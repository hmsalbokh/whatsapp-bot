import { OpenWAError } from "./errors";

export async function openwaFetch(
  baseUrl: string,
  path: string,
  options?: RequestInit
): Promise<Response> {
  return fetch(`${baseUrl.replace(/\/+$/, "")}${path}`, options);
}

export async function resolveSessionId(
  baseUrl: string,
  token: string,
  sessionNameOrId: string
): Promise<string> {
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidPattern.test(sessionNameOrId)) return sessionNameOrId;

  const directRes = await openwaFetch(baseUrl, `/api/sessions/${encodeURIComponent(sessionNameOrId)}`, {
    headers: { "X-API-Key": token },
  });
  if (directRes.ok) {
    const data = await directRes.json();
    return data.id ?? data.sessionId ?? sessionNameOrId;
  }

  const listRes = await openwaFetch(baseUrl, "/api/sessions", {
    headers: { "X-API-Key": token },
  });
  if (listRes.ok) {
    const list = await listRes.json() as Array<{ id: string; name: string }>;
    const found = list.find((s) => s.name === sessionNameOrId);
    if (found) return found.id;
  }

  return sessionNameOrId;
}
