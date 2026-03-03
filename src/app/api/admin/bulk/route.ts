import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { adminLimiter, checkRateLimit, getClientIp } from "@/lib/rate-limit"
import { unlink } from "fs/promises"
import { join } from "path"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check rate limit for admin actions
    const clientIp = getClientIp(request)
    const rateLimitKey = `${clientIp}-${session.user.id}`
    const rateLimitResult = await checkRateLimit(adminLimiter, rateLimitKey)
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: "Too many requests. Please slow down.",
          retryAfter: Math.ceil((rateLimitResult.msBeforeNext || 0) / 1000)
        },
        { 
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((rateLimitResult.msBeforeNext || 0) / 1000))
          }
        }
      )
    }

    const { action, ids } = await request.json()

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "No articles selected" }, { status: 400 })
    }

    switch (action) {
      case 'publish':
        await prisma.article.updateMany({
          where: { id: { in: ids } },
          data: { published: true }
        })
        break

      case 'unpublish':
        await prisma.article.updateMany({
          where: { id: { in: ids } },
          data: { published: false }
        })
        break

      case 'delete':
        // First fetch articles to get their content and extract uploads
        const articlesToDelete = await prisma.article.findMany({
          where: { id: { in: ids } },
          select: { id: true, content: true }
        })

        // Extract upload filenames from all articles
        const uploadRegex = /(?:!\[.*?\]\(|<img[^>]+src=")\/uploads\/([^\)"\s]+)/g
        const uploadsToDelete: string[] = []

        articlesToDelete.forEach(article => {
          let match
          while ((match = uploadRegex.exec(article.content)) !== null) {
            uploadsToDelete.push(match[1])
          }
        })

        // Delete the articles
        await prisma.article.deleteMany({
          where: { id: { in: ids } }
        })

        // Delete associated upload files
        const uploadsDir = join(process.cwd(), "public", "uploads")
        await Promise.all(uploadsToDelete.map(async (filename) => {
          try {
            await unlink(join(uploadsDir, filename))
          } catch (error) {
            // File might not exist, ignore error
          }
        }))
        break

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    return NextResponse.json({ 
      success: true, 
      count: ids.length,
      action 
    })
  } catch (error) {
    console.error('Bulk action error:', error)
    return NextResponse.json(
      { error: "Failed to perform bulk action" },
      { status: 500 }
    )
  }
}
