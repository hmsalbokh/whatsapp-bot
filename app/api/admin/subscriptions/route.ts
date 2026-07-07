import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { createClient } from "@/lib/supabase/server";
import { isSuperAdmin } from "@/lib/admin-guard";

export async function GET() {
  try {
    const s = await createClient();
    const { data: { user } } = await s.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const isAdmin = await isSuperAdmin(user.id);
    if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const admin = getServiceClient();

    const { data: subscriptions } = await admin
      .from("subscriptions")
      .select("*, subscription_plans!inner(name, slug, price_monthly), tenants!inner(name, slug)")
      .order("created_at", { ascending: false });

    return NextResponse.json({ subscriptions: subscriptions ?? [] });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
