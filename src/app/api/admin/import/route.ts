import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const format = formData.get("format") as string

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const content = await file.text()
    let imported = 0

    if (format === "json") {
      // Import JSON format
      const data = JSON.parse(content)
      
      if (data.articles && Array.isArray(data.articles)) {
        for (const article of data.articles) {
          await prisma.article.create({
            data: {
              title: article.title,
              slug: article.slug || article.title.toLowerCase().replace(/\s+/g, '-'),
              content: article.content,
              excerpt: article.excerpt || null,
              tags: article.tags || null,
              published: article.published || false,
            }
          })
          imported++
        }
      }
    } else if (format === "markdown") {
      // Import single markdown file
      let title = file.name.replace(/\.md$/, '').replace(/-/g, ' ')
      const slug = file.name.replace(/\.md$/, '').toLowerCase().replace(/\s+/g, '-')
      
      // Parse frontmatter if exists
      let articleContent = content
      let excerpt = null
      let tags = null
      
      const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
      if (frontmatterMatch) {
        const frontmatter = frontmatterMatch[1]
        articleContent = frontmatterMatch[2].trim()
        
        // Parse frontmatter
        const titleMatch = frontmatter.match(/title:\s*(.+)/)
        const excerptMatch = frontmatter.match(/excerpt:\s*(.+)/)
        const tagsMatch = frontmatter.match(/tags:\s*(.+)/)
        
        if (titleMatch) title = titleMatch[1].trim()
        if (excerptMatch) excerpt = excerptMatch[1].trim()
        if (tagsMatch) tags = tagsMatch[1].trim()
      }
      
      await prisma.article.create({
        data: {
          title,
          slug,
          content: articleContent,
          excerpt,
          tags,
          published: false,
        }
      })
      imported = 1
    }

    return NextResponse.json({ 
      success: true, 
      imported,
      message: `Successfully imported ${imported} article${imported !== 1 ? 's' : ''}`
    })
  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json(
      { error: "Failed to import: " + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    )
  }
}
