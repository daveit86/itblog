import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function POST() {
  try {
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
      console.log(`Published scheduled article: ${article.title}`)
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
