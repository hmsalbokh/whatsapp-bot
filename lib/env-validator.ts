export interface EnvValidation {
  valid: boolean;
  missing: string[];
  warnings: string[];
}

const REQUIRED_VARS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "OPENROUTER_API_KEY",
  "NEXT_PUBLIC_SITE_URL",
] as const;

const SERVICE_KEY_VARS = [
  "SUPABASE_SERVICE_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;

const OPTIONAL_VARS = [
  "OPENWA_BASE_URL",
  "OPENWA_API_TOKEN",
  "N8N_WEBHOOK_URL",
  "OPENROUTER_MODEL",
] as const;

export function validateEnv(): EnvValidation {
  const missing: string[] = [];
  const warnings: string[] = [];

  for (const key of REQUIRED_VARS) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  const hasServiceKey = SERVICE_KEY_VARS.some((k) => !!process.env[k]);
  if (!hasServiceKey) {
    missing.push("SUPABASE_SERVICE_KEY");
  }

  if (!process.env.OPENWA_BASE_URL || !process.env.OPENWA_API_TOKEN) {
    warnings.push(
      "OPENWA not configured — WhatsApp messaging will fail. Set OPENWA_BASE_URL and OPENWA_API_TOKEN."
    );
  }

  if (process.env.N8N_WEBHOOK_URL) {
    try {
      new URL(process.env.N8N_WEBHOOK_URL);
    } catch {
      warnings.push("N8N_WEBHOOK_URL is set but not a valid URL");
    }
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (siteUrl && !siteUrl.startsWith("http")) {
    warnings.push(
      `NEXT_PUBLIC_SITE_URL should start with http:// or https:// (got: ${siteUrl})`
    );
  }

  return {
    valid: missing.length === 0,
    missing,
    warnings,
  };
}
