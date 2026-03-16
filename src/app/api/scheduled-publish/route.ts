import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function POST() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Check admin role
    if (session.user?.role !== 'admin') {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      )
    }
    
    const now = new Date()
    
    // Find all scheduled articles that should be published
    const scheduledArticles = await prisma.article.findMany({
      where: {
        scheduled: true,
        published: false,
        publishAt: {
          lte: now
        }
      }
    })

    // Publish them
    for (const article of scheduledArticles) {
      await prisma.article.update({
        where: { id: article.id },
        data: {
          published: true,
          scheduled: false,
          publishAt: null
        }
      })
    }

    return NextResponse.json({ 
      success: true, 
      published: scheduledArticles.length,
      articles: scheduledArticles.map(a => ({ id: a.id, title: a.title }))
    })
  } catch (error) {
    console.error('Failed to process scheduled articles:', error)
    return NextResponse.json(
      { error: "Failed to process scheduled articles" },
      { status: 500 }
    )
  }
}
