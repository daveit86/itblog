import prisma from "./prisma"

export type AuditAction = 
  | 'article_create'
  | 'article_update'
  | 'article_delete'
  | 'article_publish'
  | 'article_unpublish'
  | 'comment_approve'
  | 'comment_disapprove'
  | 'comment_delete'
  | 'bulk_comment_approve'
  | 'bulk_comment_disapprove'
  | 'bulk_comment_delete'
  | 'media_delete'
  | 'bulk_media_delete'
  | 'user_create'
  | 'user_update'
  | 'user_delete'
  | 'backup_create'
  | 'backup_restore'
  | 'bulk_action'
  | 'login_success'
  | 'login_failed'

interface AuditLogData {
  userId: string
  action: AuditAction
  resourceType: string
  resourceId?: string
  details?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
}

export async function logAuditEvent(data: AuditLogData) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        resourceType: data.resourceType,
        resourceId: data.resourceId,
        details: data.details ? JSON.stringify(data.details) : null,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      }
    })
  } catch (error) {
    // Log to console if database logging fails
    console.error('Failed to write audit log:', error)
    console.error('Audit event:', data)
  }
}

// Helper to get request metadata
export function getAuditMetadata(request: Request) {
  return {
    ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
  }
}
