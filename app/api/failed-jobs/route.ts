import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getServiceClient } from "@/lib/supabase";
import { requireProjectAccess } from "@/lib/api-guard";
import { ok, err } from "@/lib/api-utils";

function getSupabase() { return getServiceClient(); }

export async function GET(request: NextRequest) {
  try {
    const s = await createClient();
    const { data: { user } } = await s.auth.getUser();
    if (!user) return err("Unauthorized", 401);

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const jobType = searchParams.get("jobType");
    const limit = Math.min(Number(searchParams.get("limit")) || 50, 200);

    if (projectId) {
      await requireProjectAccess(user.id, projectId);
    }

    let query = getSupabase()
      .from("failed_jobs")
      .select("id, job_type, error, attempt, max_attempts, created_at, last_attempt_at")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (projectId) {
      query = query.eq("payload->>projectId", projectId);
    }
    if (jobType) {
      query = query.eq("job_type", jobType);
    }

    if (!projectId) {
      const { data: memberships } = await getSupabase()
        .from("tenant_users")
        .select("tenant_id")
        .eq("user_id", user.id);
      const tenantIds = (memberships ?? []).map((m: unknown) => (m as { tenant_id: string }).tenant_id);
      query = query.in("tenant_id", tenantIds.length > 0 ? tenantIds : [null]);
    }

    const { data } = await query;
    return ok({ failedJobs: data ?? [] });
  } catch (e) {
    return err("Failed to fetch failed jobs", 500, (e as Error).message);
  }
}
