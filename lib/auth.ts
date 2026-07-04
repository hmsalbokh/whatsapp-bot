import { createClient } from "@/lib/supabase/server";

export interface ServerUser {
  id: string;
  email?: string;
}

export async function getServerUser(): Promise<ServerUser | null> {
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    if (!data?.user) return null;
    return {
      id: data.user.id,
      email: data.user.email ?? undefined,
    };
  } catch {
    return null;
  }
}
