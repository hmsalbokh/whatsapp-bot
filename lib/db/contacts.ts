import { getServiceClient } from "@/lib/supabase";

function getSupabase() { return getServiceClient(); }

export async function upsertContact(
  projectId: string,
  tenantId: string,
  phone: string
): Promise<string> {
  const { data: existing } = await getSupabase()
    .from("contacts")
    .select("id")
    .eq("project_id", projectId)
    .eq("phone", phone)
    .single();

  if (existing) return (existing as unknown as { id: string }).id;

  const { data: created, error } = await getSupabase()
    .from("contacts")
    .insert({
      tenant_id: tenantId,
      project_id: projectId,
      phone,
    } as any)
    .select("id")
    .single();

  if (error || !created) {
    throw new Error(`Failed to create contact: ${error?.message}`);
  }

  return (created as unknown as { id: string }).id;
}
