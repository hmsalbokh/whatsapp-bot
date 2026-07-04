import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { validateEnv } from "@/lib/env-validator";

export async function GET() {
  const checks: Record<string, unknown> = {
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV ?? "development",
  };

  // Env validation
  const env = validateEnv();
  checks.configuration = {
    valid: env.valid,
    missingVars: env.missing,
    warnings: env.warnings,
  };

  // DB connectivity
  try {
    const admin = getServiceClient();
    const { data, error } = await admin
      .from("project_profiles")
      .select("id", { count: "exact", head: true });
    checks.database = error
      ? { status: "error", message: error.message }
      : { status: "ok", projectCount: data?.length ?? 0 };
  } catch (err) {
    checks.database = {
      status: "error",
      message: err instanceof Error ? err.message : "Unknown error",
    };
  }

  // OpenRouter key
  checks.openrouter = process.env.OPENROUTER_API_KEY
    ? { status: "ok", configured: true }
    : { status: "warning", configured: false };

  // OpenWA
  checks.openwa = {
    configured: !!(process.env.OPENWA_BASE_URL && process.env.OPENWA_API_TOKEN),
  };

  // Sidecar
  checks.sidecar = {
    n8nConfigured: !!process.env.N8N_WEBHOOK_URL,
    sidecarApiKeyConfigured: !!process.env.SIDECAR_API_KEY,
    integrationApiKeyConfigured: !!process.env.INTEGRATION_API_KEY,
  };

  const overallOk =
    checks.database &&
    typeof checks.database === "object" &&
    (checks.database as Record<string, unknown>).status === "ok";

  return NextResponse.json(
    { ...checks, status: overallOk && env.valid ? "ok" : "degraded" },
    { status: overallOk ? 200 : 503 }
  );
}
