import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";

type AuditActorType = "admin" | "invitation" | "system";

type AuditInput = {
  action: string;
  actorType: AuditActorType;
  actorId?: string;
  entityType: string;
  entityId?: string | Id<any>;
  metadata?: Record<string, unknown>;
};

export async function writeAuditLog(ctx: MutationCtx, input: AuditInput) {
  const metadata =
    input.metadata && Object.keys(input.metadata).length > 0
      ? JSON.stringify(input.metadata)
      : undefined;

  await ctx.db.insert("auditLogs", {
    action: input.action,
    actorType: input.actorType,
    actorId: input.actorId,
    entityType: input.entityType,
    entityId: input.entityId ? String(input.entityId) : undefined,
    metadata,
    createdAt: Date.now(),
  });
}
