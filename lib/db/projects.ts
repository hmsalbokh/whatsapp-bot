import { getServiceClient } from "@/lib/supabase";

function getSupabase() { return getServiceClient(); }

export async function getProjectTenant(
  projectId: string
): Promise<{ tenant_id: string }> {
  const { data } = await getSupabase()
    .from("project_profiles")
    .select("tenant_id")
    .eq("id", projectId)
    .single();

  if (!data) throw new Error(`Project not found: ${projectId}`);
  return data as unknown as { tenant_id: string };
}
