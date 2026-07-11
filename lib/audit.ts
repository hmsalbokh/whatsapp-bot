import { getServiceClient } from "@/lib/supabase";

function getSupabase() { return getServiceClient(); }

export interface AuditParams {
  tenantId: string;
  userId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  changes?: unknown;
  ipAddress?: string;
}

export async function logAudit(params: AuditParams): Promise<void> {
  const { error } = await getSupabase().from("audit_logs").insert({
    tenant_id: params.tenantId,
    user_id: params.userId ?? null,
    action: params.action,
    entity_type: params.entityType,
    entity_id: params.entityId ?? null,
    changes: params.changes ?? null,
    ip_address: params.ipAddress ?? null,
  } as any);

  if (error) {
    console.error("[audit] failed to log", params.action, error.message);
  }
}

export function createAuditMiddleware(tenantId: string, userId?: string) {
  return {
    log: (action: string, entityType: string, entityId?: string, changes?: unknown) =>
      logAudit({ tenantId, userId, action, entityType, entityId, changes }),
  };
}
