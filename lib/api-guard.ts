import { getServiceClient } from "@/lib/supabase";

function getSupabase() { return getServiceClient(); }

export async function verifyProjectAccess(
  userId: string | undefined,
  projectId: string
): Promise<{ tenantId: string; role: string } | null> {
  if (!userId) return null;

  const { data: project } = await getSupabase()
    .from("project_profiles")
    .select("tenant_id")
    .eq("id", projectId)
    .single();

  if (!project) return null;

  const tenantId = (project as unknown as { tenant_id: string }).tenant_id;

  const { data: membership } = await getSupabase()
    .from("tenant_users")
    .select("role")
    .eq("tenant_id", tenantId)
    .eq("user_id", userId)
    .single();

  if (!membership) return null;

  return { tenantId, role: (membership as unknown as { role: string }).role };
}

export async function requireProjectAccess(
  userId: string | undefined,
  projectId: string
): Promise<{ tenantId: string; role: string }> {
  const access = await verifyProjectAccess(userId, projectId);
  if (!access) {
    throw new ProjectAccessError("Project not found or access denied");
  }
  return access;
}

export async function requireAdminAccess(
  userId: string | undefined,
  projectId: string
): Promise<{ tenantId: string }> {
  const access = await requireProjectAccess(userId, projectId);
  if (access.role !== "admin") {
    throw new ProjectAccessError("Admin access required");
  }
  return { tenantId: access.tenantId };
}

export class ProjectAccessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProjectAccessError";
  }
}
