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

    const { count: totalUsers } = await admin
      .from("tenant_users")
      .select("user_id", { count: "exact", head: true });

    const { count: uniqueUsers } = await admin
      .from("tenant_users")
      .select("user_id", { count: "exact", head: true });

    const { count: totalTenants } = await admin
      .from("tenants")
      .select("id", { count: "exact", head: true });

    const { count: totalProjects } = await admin
      .from("project_profiles")
      .select("id", { count: "exact", head: true });

    const { count: totalMessages } = await admin
      .from("messages")
      .select("id", { count: "exact", head: true });

    const { count: totalConversations } = await admin
      .from("conversations")
      .select("id", { count: "exact", head: true });

    const { count: totalContacts } = await admin
      .from("contacts")
      .select("id", { count: "exact", head: true });

    const { count: totalKnowledge } = await admin
      .from("knowledge_items")
      .select("id", { count: "exact", head: true });

    const { count: totalHandoffs } = await admin
      .from("handoff_requests")
      .select("id", { count: "exact", head: true });

    const { count: activeSubscriptions } = await admin
      .from("subscriptions")
      .select("id", { count: "exact", head: true })
      .in("status", ["active", "trialing"]);

    const { count: failedJobs } = await admin
      .from("failed_jobs")
      .select("id", { count: "exact", head: true });

    const { count: messagesToday } = await admin
      .from("messages")
      .select("id", { count: "exact", head: true })
      .gte("created_at", new Date(new Date().setHours(0, 0, 0, 0)).toISOString());

    const { data: recentUsers } = await admin
      .from("tenant_users")
      .select("user_id, created_at")
      .order("created_at", { ascending: false })
      .limit(1) as unknown as { data: { user_id: string; created_at: string }[] | null };

    const lastActivity = recentUsers?.[0]?.created_at ?? null;

    return NextResponse.json({
      stats: {
        users: { total: uniqueUsers ?? 0 },
        tenants: { total: totalTenants ?? 0 },
        projects: { total: totalProjects ?? 0 },
        messages: { total: totalMessages ?? 0, today: messagesToday ?? 0 },
        conversations: { total: totalConversations ?? 0 },
        contacts: { total: totalContacts ?? 0 },
        knowledge: { total: totalKnowledge ?? 0 },
        handoffs: { total: totalHandoffs ?? 0 },
        subscriptions: { active: activeSubscriptions ?? 0 },
        failedJobs: { total: failedJobs ?? 0 },
        lastActivity,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
