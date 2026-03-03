import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import { z } from "zod"
import { sendNewCommentNotification } from "@/lib/email"
import { commentLimiter, getClientIp, checkRateLimit } from "@/lib/rate-limit"

const commentSchema = z.object({
  authorName: z.string().min(1),
  authorEmail: z.string().email(),
  content: z.string().min(1).max(5000, "Comment too long"),
  articleId: z.string(),
  parentId: z.string().optional(),
})

export async function POST(request: Request) {
  try {
    // Check rate limit
    const clientIp = getClientIp(request)
    const rateLimitResult = await checkRateLimit(commentLimiter, clientIp)
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: "Too many comments. Please try again later.",
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

    const formData = await request.formData()
    const data = commentSchema.parse({
      authorName: formData.get("authorName"),
      authorEmail: formData.get("authorEmail"),
      content: formData.get("content"),
      articleId: formData.get("articleId"),
    })

    const article = await prisma.article.findUnique({
      where: { id: data.articleId, published: true },
    })

    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 })
    }

    const comment = await prisma.comment.create({
      data: {
        authorName: data.authorName,
        authorEmail: data.authorEmail,
        content: data.content,
        articleId: data.articleId,
        parentId: data.parentId || null,
        approved: false,
      },
    })

    // Send email notification (don't await - don't block response)
    sendNewCommentNotification({
      authorName: data.authorName,
      authorEmail: data.authorEmail,
      content: data.content,
      articleTitle: article.title,
      articleSlug: article.slug,
      commentId: comment.id,
    }).catch(err => console.error('Email notification failed:', err))

    return NextResponse.json(comment, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    console.error("Error creating comment:", error)
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    )
  }
}
