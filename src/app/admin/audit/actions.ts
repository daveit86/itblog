'use server'

import { authOptions } from "@/lib/auth"
import { getServerSession } from "next-auth"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function clearOldLogs(days: number = 30): Promise<{ success: number; error?: string }> {
  const session = await getServerSession(authOptions)
  
  if (!session || session.user?.role !== 'admin') {
    return { success: 0, error: "Unauthorized" }
  }

  try {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    const result = await prisma.auditLog.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate
        }
      }
    })

    revalidatePath('/admin/audit')
    
    return { success: result.count }
  } catch (error) {
    console.error('Failed to clear old logs:', error)
    return { success: 0, error: "Failed to clear old logs" }
  }
}
