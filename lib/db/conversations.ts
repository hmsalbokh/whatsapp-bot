import { getServiceClient } from "@/lib/supabase";
import { getProjectTenant } from "./projects";
import { upsertContact } from "./contacts";

function getSupabase() { return getServiceClient(); }

export async function getOrCreateConversation(
  projectId: string,
  phone: string
): Promise<{ id: string; contact_id: string; human_handoff: boolean }> {
  const { tenant_id } = await getProjectTenant(projectId);
  const contactId = await upsertContact(projectId, tenant_id, phone);

  const { data: existing } = await getSupabase()
    .from("conversations")
    .select("id, contact_id, human_handoff")
    .eq("project_id", projectId)
    .eq("contact_id", contactId)
    .single();

  if (existing) return existing as unknown as { id: string; contact_id: string; human_handoff: boolean };

  const { data: created, error } = await getSupabase()
    .from("conversations")
    .insert({
      tenant_id,
      project_id: projectId,
      contact_id: contactId,
    } as any)
    .select("id, contact_id, human_handoff")
    .single();

  if (error || !created) {
    throw new Error(`Failed to create conversation: ${error?.message}`);
  }

  return created as unknown as { id: string; contact_id: string; human_handoff: boolean };
}

export async function isHandoffRequested(
  projectId: string,
  phone: string
): Promise<boolean> {
  try {
    const conv = await getOrCreateConversation(projectId, phone);
    return conv.human_handoff;
  } catch {
    return false;
  }
}

export async function clearMemory(
  projectId: string,
  phone: string
): Promise<void> {
  const { tenant_id } = await getProjectTenant(projectId);
  const contactId = await upsertContact(projectId, tenant_id, phone);

  const { data: conv } = await getSupabase()
    .from("conversations")
    .select("id")
    .eq("project_id", projectId)
    .eq("contact_id", contactId)
    .single();

  if (conv) {
    await getSupabase()
      .from("messages")
      .delete()
      .eq("conversation_id", (conv as unknown as { id: string }).id);
    await getSupabase()
      .from("conversations")
      .delete()
      .eq("id", (conv as unknown as { id: string }).id);
  }
}
