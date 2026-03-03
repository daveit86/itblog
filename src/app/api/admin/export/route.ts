import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const format = searchParams.get("format") || "json"
    const articleId = searchParams.get("id")

    if (articleId) {
      // Export single article
      const article = await prisma.article.findUnique({
        where: { id: articleId }
      })

      if (!article) {
        return NextResponse.json({ error: "Article not found" }, { status: 404 })
      }

      if (format === "markdown") {
        const frontmatter = `---
title: ${article.title}
slug: ${article.slug}
excerpt: ${article.excerpt || ''}
tags: ${article.tags || ''}
published: ${article.published}
createdAt: ${article.createdAt.toISOString()}
---

`
        const content = frontmatter + article.content
        
        return new NextResponse(content, {
          headers: {
            'Content-Type': 'text/markdown',
            'Content-Disposition': `attachment; filename="${article.slug}.md"`,
          },
        })
      } else {
        return new NextResponse(JSON.stringify(article, null, 2), {
          headers: {
            'Content-Type': 'application/json',
            'Content-Disposition': `attachment; filename="${article.slug}.json"`,
          },
        })
      }
    } else {
      // Export all articles
      const articles = await prisma.article.findMany({
        orderBy: { createdAt: 'desc' }
      })

      if (format === "markdown") {
        // Create a zip-like content with all articles
        let combinedContent = "# Blog Export\n\n"
        
        for (const article of articles) {
          combinedContent += `## ${article.title}\n\n`
          combinedContent += `**Slug:** ${article.slug}  \n`
          combinedContent += `**Published:** ${article.published}  \n`
          combinedContent += `**Tags:** ${article.tags || 'None'}  \n\n`
          combinedContent += article.content
          combinedContent += "\n\n---\n\n"
        }

        return new NextResponse(combinedContent, {
          headers: {
            'Content-Type': 'text/markdown',
            'Content-Disposition': `attachment; filename="blog-export-${new Date().toISOString().split('T')[0]}.md"`,
          },
        })
      } else {
        return new NextResponse(JSON.stringify({ articles }, null, 2), {
          headers: {
            'Content-Type': 'application/json',
            'Content-Disposition': `attachment; filename="blog-export-${new Date().toISOString().split('T')[0]}.json"`,
          },
        })
      }
    }
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      { error: "Failed to export" },
      { status: 500 }
    )
  }
}
