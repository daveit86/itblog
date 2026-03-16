import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")
    const language = searchParams.get("language") || undefined
    
    if (!query || query.trim().length === 0) {
      return NextResponse.json({ articles: [] })
    }

    const searchTerm = query.trim().toLowerCase()
    
    // Build where clause
    const where: any = {
      published: true,
      OR: [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { content: { contains: searchTerm, mode: 'insensitive' } },
        { excerpt: { contains: searchTerm, mode: 'insensitive' } },
        { tags: { contains: searchTerm, mode: 'insensitive' } },
      ]
    }
    
    if (language) {
      where.language = language
    }

    const articles = await prisma.article.findMany({
      where,
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        content: true,
        tags: true,
        language: true,
        createdAt: true,
        _count: {
          select: { comments: { where: { approved: true } } }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50 // Limit results
    })

    return NextResponse.json({ 
      articles,
      count: articles.length,
      query: searchTerm 
    })
  } catch (error) {
    console.error("Search error:", error)
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 }
    )
  }
}
