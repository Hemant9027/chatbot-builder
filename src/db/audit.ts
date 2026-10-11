import { randomUUID } from "node:crypto";
import { getCollection } from "@/db/mongo";
import type { AuditLog } from "@/db/models";

type AuditLogInput = Omit<AuditLog, "id" | "createdAt" | "orgId" | "propertyId" | "userId"> &
  Partial<Pick<AuditLog, "orgId" | "propertyId" | "userId">>;

export async function writeAuditLog(entry: AuditLogInput): Promise<void> {
  await (await getCollection<AuditLog>("auditLogs")).insertOne({
    id: randomUUID(),
    orgId: entry.orgId ?? null,
    propertyId: entry.propertyId ?? null,
    userId: entry.userId ?? null,
    action: entry.action,
    ...(entry.meta === undefined ? {} : { meta: entry.meta }),
    createdAt: new Date(),
  });
}