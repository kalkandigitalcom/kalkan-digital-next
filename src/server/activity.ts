import "server-only";
import { db } from "@/server/db";
import { activityLogs } from "@/server/db/schema";
import { getClientIp } from "@/server/request";
import type { Tx } from "@/server/db";

export interface ActivityInput {
  userId: string | null;
  action: string;
  entityType?: string;
  entityId?: string;
  summary?: string;
  details?: Record<string, unknown>;
}

/** Writes an audit log entry. Pass `tx` to make it part of the same DB transaction. */
export async function logActivity(input: ActivityInput, tx?: Tx) {
  const ip = await getClientIp().catch(() => "unknown");
  await (tx ?? db).insert(activityLogs).values({
    userId: input.userId,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    summary: input.summary?.slice(0, 500),
    details: input.details,
    ipAddress: ip,
  });
}
