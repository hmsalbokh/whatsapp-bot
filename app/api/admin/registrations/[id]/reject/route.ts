import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { createClient } from "@/lib/supabase/server";
import { isSuperAdmin } from "@/lib/admin-guard";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const s = await createClient();
    const { data: { user } } = await s.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const isAdmin = await isSuperAdmin(user.id);
    if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json().catch(() => ({}));
    const reason = body.reason || "";

    const admin = getServiceClient();

    const { error } = await admin
      .from("registration_requests")
      .update({
        status: "rejected",
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        notes: reason || null,
      } as never)
      .eq("id", id);

    if (error) {
      return NextResponse.json(
        { error: `فشل رفض الطلب: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: "تم رفض الطلب" });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
