import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { createClient } from "@/lib/supabase/server";
import { requireProjectAccess } from "@/lib/api-guard";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const s = await createClient();
    const { data: { user } } = await s.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await requireProjectAccess(user.id, projectId);
    const admin = getServiceClient();

    const { data: session } = await admin
      .from("whatsapp_sessions")
      .select("*")
      .eq("project_id", projectId)
      .maybeSingle();

    return NextResponse.json({ session: session ?? null });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const status = message.includes("denied") || message.includes("not found") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const s = await createClient();
    const { data: { user } } = await s.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const access = await requireProjectAccess(user.id, projectId);

    const body = await request.json();
    const { provider, phoneNumberId, webhookSecret, config, isActive } = body;

    const admin = getServiceClient();

    const { data: existing } = await admin
      .from("whatsapp_sessions")
      .select("id")
      .eq("project_id", projectId)
      .maybeSingle() as unknown as { data: { id: string } | null };

    let result;
    if (existing) {
      const { data } = await admin
        .from("whatsapp_sessions")
        .update({
          provider: provider ?? "openwa",
          phone_number_id: phoneNumberId ?? null,
          webhook_secret: webhookSecret ?? null,
          config: config ?? {},
          is_active: isActive ?? true,
        } as never)
        .eq("id", existing.id)
        .select()
        .single();
      result = data;
    } else {
      const { data } = await admin
        .from("whatsapp_sessions")
        .insert({
          tenant_id: access.tenantId,
          project_id: projectId,
          provider: provider ?? "openwa",
          phone_number_id: phoneNumberId ?? null,
          webhook_secret: webhookSecret ?? null,
          config: config ?? {},
          is_active: isActive ?? true,
        } as never)
        .select()
        .single();
      result = data;
    }

    return NextResponse.json({ session: result, saved: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const status = message.includes("denied") || message.includes("not found") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
