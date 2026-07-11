import { getServiceClient } from "@/lib/supabase";

function getSupabase() { return getServiceClient(); }

export async function logFailedJob(params: {
  tenantId?: string;
  jobType: string;
  payload?: unknown;
  error?: string;
  attempt?: number;
  maxAttempts?: number;
}): Promise<string> {
  const { data, error } = await getSupabase()
    .from("failed_jobs")
    .insert({
      tenant_id: params.tenantId ?? null,
      job_type: params.jobType,
      payload: params.payload ?? null,
      error: params.error ?? null,
      attempt: params.attempt ?? 1,
      max_attempts: params.maxAttempts ?? 3,
      last_attempt_at: new Date().toISOString(),
    } as any)
    .select("id")
    .single();

  if (error) {
    console.error("[retry] failed to log failed job", error.message);
    return "";
  }

  return (data as unknown as { id: string }).id;
}

export async function retryFailedJob(
  jobId: string
): Promise<{ success: boolean; error?: string }> {
  const { data: job } = await getSupabase()
    .from("failed_jobs")
    .select("*")
    .eq("id", jobId)
    .single();

  if (!job) {
    return { success: false, error: "Job not found" };
  }

  const j = job as unknown as {
    job_type: string;
    payload: Record<string, unknown>;
    attempt: number;
    max_attempts: number;
  };

  if (j.attempt >= j.max_attempts) {
    return { success: false, error: "Max attempts reached" };
  }

  const newAttempt = j.attempt + 1;

  await getSupabase()
    .from("failed_jobs")
    .update({
      attempt: newAttempt,
      last_attempt_at: new Date().toISOString(),
      error: null,
    } as never)
    .eq("id", jobId);

  try {
    // Route to the appropriate retry handler
    switch (j.job_type) {
      case "openrouter_chat":
        // OpenRouter retries are handled by withRetry in the calling code
        return { success: true };
      case "webhook_process":
        return { success: true, error: "Use webhook replay instead" };
      case "send_message":
        return { success: true, error: "Message send retry not yet implemented" };
      default:
        return { success: false, error: `Unknown job type: ${j.job_type}` };
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    await getSupabase()
      .from("failed_jobs")
      .update({ error: errorMsg } as never)
      .eq("id", jobId);
    return { success: false, error: errorMsg };
  }
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  params: {
    jobType: string;
    tenantId?: string;
    payload?: unknown;
    maxAttempts?: number;
    retryDelayMs?: number;
  }
): Promise<T> {
  const maxAttempts = params.maxAttempts ?? 3;
  const retryDelayMs = params.retryDelayMs ?? 1000;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error(
        `[retry] attempt ${attempt}/${maxAttempts} failed for ${params.jobType}: ${errorMsg}`
      );

      await logFailedJob({
        tenantId: params.tenantId,
        jobType: params.jobType,
        payload: params.payload,
        error: errorMsg,
        attempt,
        maxAttempts,
      });

      if (attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, retryDelayMs * attempt));
      } else {
        throw err;
      }
    }
  }

  throw new Error("Unreachable");
}
