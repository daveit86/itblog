import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    
    // Get current article data
    const article = await prisma.article.findUnique({
      where: { id }
    })

    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 })
    }

    // Get the next version number
    const lastVersion = await prisma.articleVersion.findFirst({
      where: { articleId: id },
      orderBy: { version: 'desc' }
    })
    
    const nextVersion = (lastVersion?.version || 0) + 1

    // Create version
    const version = await prisma.articleVersion.create({
      data: {
        articleId: id,
        title: article.title,
        content: article.content,
        excerpt: article.excerpt,
        tags: article.tags,
        metaTitle: article.metaTitle,
        metaDescription: article.metaDescription,
        version: nextVersion,
      }
    })

    return NextResponse.json({ success: true, version })
  } catch (error) {
    console.error('Failed to create version:', error)
    return NextResponse.json(
      { error: "Failed to create version" },
      { status: 500 }
    )
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    
    const versions = await prisma.articleVersion.findMany({
      where: { articleId: id },
      orderBy: { version: 'desc' },
      select: {
        id: true,
        version: true,
        title: true,
        createdAt: true,
      }
    })

    return NextResponse.json({ versions })
  } catch (error) {
    console.error('Failed to get versions:', error)
    return NextResponse.json(
      { error: "Failed to get versions" },
      { status: 500 }
    )
  }
}
