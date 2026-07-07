import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

export const runtime = "nodejs";

export async function GET() {
  try {
    const admin = getServiceClient();
    const { data, error } = await admin
      .from("subscription_plans")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message, plans: [] }, { status: 200 });
    }
    return NextResponse.json({ plans: data ?? [] });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err), plans: [] },
      { status: 200 }
    );
  }
}
