import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getServiceClient } from "@/lib/supabase";
import { ok, err } from "@/lib/api-utils";
import { retryFailedJob } from "@/lib/retry";

function getSupabase() { return getServiceClient(); }

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = (await params).id;
    const s = await createClient();
    const { data: { user } } = await s.auth.getUser();
    if (!user) return err("Unauthorized", 401);

    // Verify caller has access to this job via tenant
    const { data: job } = await getSupabase()
      .from("failed_jobs")
      .select("tenant_id")
      .eq("id", id)
      .single();

    if (!job) return err("Job not found", 404);

    const j = job as unknown as { tenant_id: string | null };

    if (j.tenant_id) {
      const { data: membership } = await getSupabase()
        .from("tenant_users")
        .select("id")
        .eq("tenant_id", j.tenant_id)
        .eq("user_id", user.id)
        .single();
      if (!membership) return err("Access denied", 403);
    }

    const result = await retryFailedJob(id);
    if (!result.success) {
      return err(result.error ?? "Retry failed", 400);
    }

    return ok({ status: "ok", message: "Retry initiated" });
  } catch (e) {
    return err("Failed to retry job", 500, (e as Error).message);
  }
}
