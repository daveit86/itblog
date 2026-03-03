import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    await prisma.article.update({
      where: { id },
      data: { viewCount: { increment: 1 } }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to increment view count:', error)
    return NextResponse.json({ error: "Failed to update view count" }, { status: 500 })
  }
}
