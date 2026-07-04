import { NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getServiceClient } from "@/lib/supabase";
import { requireProjectAccess } from "@/lib/api-guard";
import { ok, err, parseJson } from "@/lib/api-utils";

const supabase = getServiceClient();

export async function GET(request: NextRequest) {
  try {
    const s = await createClient();
    const { data: { user } } = await s.auth.getUser();
    if (!user) return err("Unauthorized", 401);

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const limit = Math.min(Number(searchParams.get("limit")) || 20, 100);
    const unreadOnly = searchParams.get("unread") === "true";

    if (projectId) {
      await requireProjectAccess(user.id, projectId);
    }

    let query = supabase
      .from("webhook_events")
      .select("id, source, event_type, status, error, created_at, project_id")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (projectId) {
      query = query.eq("project_id", projectId);
    } else {
      const { data: memberships } = await supabase
        .from("tenant_users")
        .select("tenant_id")
        .eq("user_id", user.id);
      const tenantIds = (memberships ?? []).map((m: unknown) => (m as { tenant_id: string }).tenant_id);
      query = query.in("tenant_id", tenantIds.length > 0 ? tenantIds : [null]);
    }

    if (unreadOnly) {
      query = query.eq("status", "received");
    }

    const { data } = await query;
    return ok({ notifications: data ?? [] });
  } catch (e) {
    return err("Failed to fetch notifications", 500, (e as Error).message);
  }
}

export async function POST(request: NextRequest) {
  try {
    const s = await createClient();
    const { data: { user } } = await s.auth.getUser();
    if (!user) return err("Unauthorized", 401);

    const rawBody = parseJson(await request.text());
    if (!rawBody) return err("Invalid JSON", 400);

    const schema = z.object({
      projectId: z.string(),
      type: z.string(),
      title: z.string(),
      body: z.string().optional(),
      data: z.record(z.unknown()).optional(),
    });

    const parsed = schema.safeParse(rawBody);
    if (!parsed.success) {
      return err("Validation failed", 422, JSON.stringify(parsed.error.flatten().fieldErrors));
    }

    const { projectId, type, title, body, data } = parsed.data;

    const { tenantId } = await requireProjectAccess(user.id, projectId);

    const { data: notif, error } = await supabase
      .from("webhook_events")
      .insert({
        tenant_id: tenantId,
        project_id: projectId,
        source: "notification",
        event_type: type,
        status: "received",
        raw_payload: { title, body, data },
      } as never)
      .select("id")
      .single();

    if (error) return err("Failed to create notification", 500);
    return ok({ notification: notif }, 201);
  } catch (e) {
    return err("Failed to create notification", 500, (e as Error).message);
  }
}
