import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import { z } from "zod"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { 
  anonymousCommentLimiter, 
  checkRateLimit 
} from "@/lib/rate-limit"
import { generateFingerprint } from "@/lib/fingerprint"

// Schema for anonymous comments - email is no longer required
const commentSchema = z.object({
  authorName: z.string().max(100, "Name must be less than 100 characters").optional(),
  content: z.string().min(1, "Comment is required").max(5000, "Comment must be less than 5000 characters"),
  articleId: z.string(),
  parentId: z.string().optional(),
  honeypot: z.string().optional(), // Invisible field for bot detection
})

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    
    // Check honeypot - if filled, it's a bot
    const honeypot = formData.get("honeypot") as string | null
    if (honeypot && honeypot.length > 0) {
      // Silently reject but return success to avoid revealing it's a honeypot
      return NextResponse.json(
        { 
          success: true, 
          message: "Comment submitted for moderation",
          pending: true 
        }, 
        { status: 201 }
      )
    }

    // Parse and validate data
    const data = commentSchema.parse({
      authorName: formData.get("authorName") || undefined,
      content: formData.get("content"),
      articleId: formData.get("articleId"),
      parentId: formData.get("parentId") || undefined,
      honeypot: formData.get("honeypot") || undefined,
    })

    // Check if article exists and is published
    const article = await prisma.article.findUnique({
      where: { id: data.articleId, published: true },
    })

    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 })
    }

    // Check if user is logged in
    const session = await getServerSession(authOptions)
    
    let fingerprintHash: string | null = null
    let sessionId: string | null = null

    if (session?.user?.id) {
      // Logged-in user: no rate limiting
      sessionId = session.user.id
    } else {
      // Anonymous user: apply rate limiting
      fingerprintHash = generateFingerprint(request)
      const rateLimitResult = await checkRateLimit(anonymousCommentLimiter, fingerprintHash)
      
      if (!rateLimitResult.success) {
        const retryAfter = Math.ceil((rateLimitResult.msBeforeNext || 0) / 1000)
        const minutes = Math.ceil(retryAfter / 60)
        
        return NextResponse.json(
          { 
            error: `Rate limit exceeded. Please wait ${minutes} minute${minutes > 1 ? 's' : ''} before commenting again.`,
            retryAfter: retryAfter
          },
          { 
            status: 429,
            headers: {
              'Retry-After': String(retryAfter)
            }
          }
        )
      }
    }

    // Create comment - always pending moderation
    const comment = await prisma.comment.create({
      data: {
        authorName: data.authorName || null, // Null for anonymous
        authorEmail: null, // No longer collecting email
        fingerprintHash: fingerprintHash || undefined, // For anonymous rate limiting
        sessionId: sessionId || undefined, // For logged-in user tracking
        content: data.content,
        articleId: data.articleId,
        parentId: data.parentId || null,
        approved: false, // All comments pending moderation
        likes: 0,
      },
    })

    // Note: Email notifications disabled since we don't collect emails anymore
    // In the future, you could implement admin-only notifications via settings

    return NextResponse.json(
      { 
        success: true, 
        message: "Comment submitted successfully! It will appear after moderation.",
        pending: true,
        commentId: comment.id
      }, 
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    console.error("Error creating comment:", error)
    return NextResponse.json(
      { error: "Failed to create comment. Please try again." },
      { status: 500 }
    )
  }
}

// GET endpoint for fetching approved comments only
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const articleId = searchParams.get("articleId")
    
    if (!articleId) {
      return NextResponse.json({ error: "Article ID required" }, { status: 400 })
    }

    const comments = await prisma.comment.findMany({
      where: { 
        articleId: articleId,
        approved: true, // Only return approved comments
        parentId: null  // Only top-level comments
      },
      include: {
        replies: {
          where: { approved: true },
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(comments)
  } catch (error) {
    console.error("Error fetching comments:", error)
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    )
  }
}
