import { getServiceClient } from "@/lib/supabase";

const supabase = getServiceClient();

export async function verifyProjectAccess(
  userId: string | undefined,
  projectId: string
): Promise<{ tenantId: string } | null> {
  if (!userId) return null;

  const { data: project } = await supabase
    .from("project_profiles")
    .select("tenant_id")
    .eq("id", projectId)
    .single();

  if (!project) return null;

  const tenantId = (project as unknown as { tenant_id: string }).tenant_id;

  const { data: membership } = await supabase
    .from("tenant_users")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("user_id", userId)
    .single();

  if (!membership) return null;

  return { tenantId };
}

export async function requireProjectAccess(
  userId: string | undefined,
  projectId: string
): Promise<{ tenantId: string }> {
  const access = await verifyProjectAccess(userId, projectId);
  if (!access) {
    throw new ProjectAccessError("Project not found or access denied");
  }
  return access;
}

export class ProjectAccessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProjectAccessError";
  }
}
