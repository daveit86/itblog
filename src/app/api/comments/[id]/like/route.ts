import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { likeLimiter, checkRateLimit } from "@/lib/rate-limit"
import { generateFingerprint } from "@/lib/fingerprint"

// In-memory store for tracking likes (in production, use Redis)
const likedComments = new Map<string, Set<string>>()

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Get user identifier (session or fingerprint)
    const session = await getServerSession(authOptions)
    const fingerprint = generateFingerprint(request)
    
    // Use session ID if logged in, otherwise use fingerprint
    const userId = session?.user?.id || fingerprint
    
    // Apply rate limiting only for anonymous users
    if (!session?.user?.id) {
      const rateLimitResult = await checkRateLimit(likeLimiter, userId)
      if (!rateLimitResult.success) {
        return NextResponse.json(
          { 
            error: "Rate limit exceeded. Please slow down.",
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
    }
    
    // Check if user already liked this comment (prevent duplicate likes)
    const commentLikers = likedComments.get(id) || new Set()
    if (commentLikers.has(userId)) {
      return NextResponse.json(
        { error: "You have already liked this comment" },
        { status: 400 }
      )
    }
    
    // Increment like count
    const comment = await prisma.comment.update({
      where: { id },
      data: {
        likes: {
          increment: 1
        }
      }
    })
    
    // Track that this user liked this comment
    commentLikers.add(userId)
    likedComments.set(id, commentLikers)

    return NextResponse.json({ 
      success: true, 
      likes: comment.likes,
      hasLiked: true
    })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to like comment" },
      { status: 500 }
    )
  }
}

// GET endpoint to check if user has liked a comment
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Get user identifier
    const session = await getServerSession(authOptions)
    const fingerprint = generateFingerprint(request)
    const userId = session?.user?.id || fingerprint
    
    // Check if user has liked this comment
    const commentLikers = likedComments.get(id) || new Set()
    const hasLiked = commentLikers.has(userId)
    
    // Get current like count
    const comment = await prisma.comment.findUnique({
      where: { id },
      select: { likes: true }
    })
    
    return NextResponse.json({
      likes: comment?.likes || 0,
      hasLiked
    })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to check like status" },
      { status: 500 }
    )
  }
}
