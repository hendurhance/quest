import { db } from '@/core/db'
import type { AuditLog } from '@/core/db'

export async function logAudit(action: string, fields: Omit<Partial<AuditLog>, 'action'>): Promise<void> {
  try {
    await db.init()
    await db.audit.log({ action, ...fields })
  } catch (error) {
    console.error('Failed to write audit log:', error)
  }
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error'
}
