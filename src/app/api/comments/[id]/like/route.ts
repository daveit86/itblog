import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const comment = await prisma.comment.update({
      where: { id },
      data: {
        likes: {
          increment: 1
        }
      }
    })

    return NextResponse.json({ success: true, likes: comment.likes })
  } catch (error) {
    console.error('Failed to like comment:', error)
    return NextResponse.json(
      { error: "Failed to like comment" },
      { status: 500 }
    )
  }
}
