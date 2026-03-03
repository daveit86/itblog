'use server'

import { authOptions } from "@/lib/auth"
import { getServerSession } from "next-auth"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { logAuditEvent } from "@/lib/audit"
import { headers } from "next/headers"

export async function approveComment(commentId: string): Promise<{ error?: string }> {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return { error: "Unauthorized" }
  }

  try {
    await prisma.comment.update({
      where: { id: commentId },
      data: { approved: true },
    })
    revalidatePath('/admin/comments')

    // Log audit event
    const headersList = await headers()
    await logAuditEvent({
      userId: session.user.id,
      action: 'comment_approve',
      resourceType: 'comment',
      resourceId: commentId,
      ipAddress: headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown',
      userAgent: headersList.get('user-agent') || 'unknown',
    })

    return {}
  } catch (error) {
    console.error('Failed to approve comment:', error)
    return { error: "Failed to approve comment" }
  }
}

export async function disapproveComment(commentId: string): Promise<{ error?: string }> {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return { error: "Unauthorized" }
  }

  try {
    await prisma.comment.update({
      where: { id: commentId },
      data: { approved: false },
    })
    revalidatePath('/admin/comments')

    // Log audit event
    const headersList = await headers()
    await logAuditEvent({
      userId: session.user.id,
      action: 'comment_disapprove',
      resourceType: 'comment',
      resourceId: commentId,
      ipAddress: headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown',
      userAgent: headersList.get('user-agent') || 'unknown',
    })

    return {}
  } catch (error) {
    console.error('Failed to disapprove comment:', error)
    return { error: "Failed to disapprove comment" }
  }
}

export async function deleteComment(commentId: string): Promise<{ error?: string }> {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return { error: "Unauthorized" }
  }

  try {
    await prisma.comment.delete({
      where: { id: commentId },
    })
    revalidatePath('/admin/comments')

    // Log audit event
    const headersList = await headers()
    await logAuditEvent({
      userId: session.user.id,
      action: 'comment_delete',
      resourceType: 'comment',
      resourceId: commentId,
      ipAddress: headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown',
      userAgent: headersList.get('user-agent') || 'unknown',
    })

    return {}
  } catch (error) {
    console.error('Failed to delete comment:', error)
    return { error: "Failed to delete comment" }
  }
}

// Bulk Operations
export async function bulkApproveComments(commentIds: string[]): Promise<{ success: number; error?: string }> {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return { success: 0, error: "Unauthorized" }
  }

  try {
    const result = await prisma.comment.updateMany({
      where: { id: { in: commentIds } },
      data: { approved: true },
    })
    revalidatePath('/admin/comments')

    // Log audit event
    const headersList = await headers()
    await logAuditEvent({
      userId: session.user.id,
      action: 'bulk_comment_approve',
      resourceType: 'comment',
      details: { count: result.count },
      ipAddress: headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown',
      userAgent: headersList.get('user-agent') || 'unknown',
    })

    return { success: result.count }
  } catch (error) {
    console.error('Failed to bulk approve comments:', error)
    return { success: 0, error: "Failed to approve comments" }
  }
}

export async function bulkDisapproveComments(commentIds: string[]): Promise<{ success: number; error?: string }> {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return { success: 0, error: "Unauthorized" }
  }

  try {
    const result = await prisma.comment.updateMany({
      where: { id: { in: commentIds } },
      data: { approved: false },
    })
    revalidatePath('/admin/comments')

    // Log audit event
    const headersList = await headers()
    await logAuditEvent({
      userId: session.user.id,
      action: 'bulk_comment_disapprove',
      resourceType: 'comment',
      details: { count: result.count },
      ipAddress: headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown',
      userAgent: headersList.get('user-agent') || 'unknown',
    })

    return { success: result.count }
  } catch (error) {
    console.error('Failed to bulk disapprove comments:', error)
    return { success: 0, error: "Failed to disapprove comments" }
  }
}

export async function bulkDeleteComments(commentIds: string[]): Promise<{ success: number; error?: string }> {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return { success: 0, error: "Unauthorized" }
  }

  try {
    const result = await prisma.comment.deleteMany({
      where: { id: { in: commentIds } },
    })
    revalidatePath('/admin/comments')

    // Log audit event
    const headersList = await headers()
    await logAuditEvent({
      userId: session.user.id,
      action: 'bulk_comment_delete',
      resourceType: 'comment',
      details: { count: result.count },
      ipAddress: headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown',
      userAgent: headersList.get('user-agent') || 'unknown',
    })

    return { success: result.count }
  } catch (error) {
    console.error('Failed to bulk delete comments:', error)
    return { success: 0, error: "Failed to delete comments" }
  }
}
