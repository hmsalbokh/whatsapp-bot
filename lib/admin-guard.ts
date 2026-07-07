import { getServiceClient } from "@/lib/supabase";

export async function isSuperAdmin(userId: string): Promise<boolean> {
  try {
    const admin = getServiceClient();
    const { data } = await admin
      .from("super_admins")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();
    return !!data;
  } catch {
    return false;
  }
}

export async function requireSuperAdmin(
  userId: string | undefined
): Promise<void> {
  if (!userId) {
    throw new AdminAccessError("Unauthorized");
  }
  const admin = await isSuperAdmin(userId);
  if (!admin) {
    throw new AdminAccessError("Access denied. Super admin privileges required.");
  }
}

export class AdminAccessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AdminAccessError";
  }
}
