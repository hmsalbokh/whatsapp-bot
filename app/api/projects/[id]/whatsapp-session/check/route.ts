import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireProjectAccess } from "@/lib/api-guard";
import { getOpenWASessionStatus } from "@/lib/wa-manager";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const s = await createClient();
    const { data: { user } } = await s.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await requireProjectAccess(user.id, projectId);

    const body = await request.json();
    const { baseUrl, apiToken, sessionName } = body;

    if (!baseUrl || !apiToken || !sessionName) {
      return NextResponse.json(
        { error: "baseUrl, apiToken, and sessionName are required" },
        { status: 400 }
      );
    }

    const result = await getOpenWASessionStatus(baseUrl, apiToken, sessionName);

    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const status = message.includes("denied") || message.includes("not found") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
