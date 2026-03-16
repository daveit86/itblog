import { NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import { getServerSession } from "next-auth"
import prisma from "@/lib/prisma"

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Only admins can create articles
  if (session.user?.role !== 'admin') {
    return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 })
  }

  const formData = await request.formData()
  
  const title = formData.get("title") as string
  const slug = formData.get("slug") as string
  const tags = formData.get("tags") as string | null
  const excerpt = formData.get("excerpt") as string | null
  const content = formData.get("content") as string
  const metaTitle = formData.get("metaTitle") as string | null
  const metaDescription = formData.get("metaDescription") as string | null
  const publishedValue = formData.get("published")
  const published = publishedValue === "on" || publishedValue === "true"
  const language = (formData.get("language") as string) || "en"
  const linkedArticleId = (formData.get("linkedArticleId") as string) || null

  if (!title || !slug || !content) {
    return NextResponse.json({ error: "Required fields missing" }, { status: 400 })
  }

  // Input length validation
  if (title.length > 200) {
    return NextResponse.json({ error: "Title must be less than 200 characters" }, { status: 400 })
  }
  if (content.length > 100000) {
    return NextResponse.json({ error: "Content must be less than 100KB" }, { status: 400 })
  }
  if (excerpt && excerpt.length > 500) {
    return NextResponse.json({ error: "Excerpt must be less than 500 characters" }, { status: 400 })
  }
  if (tags && tags.length > 500) {
    return NextResponse.json({ error: "Tags must be less than 500 characters" }, { status: 400 })
  }
  if (metaTitle && metaTitle.length > 200) {
    return NextResponse.json({ error: "Meta title must be less than 200 characters" }, { status: 400 })
  }
  if (metaDescription && metaDescription.length > 500) {
    return NextResponse.json({ error: "Meta description must be less than 500 characters" }, { status: 400 })
  }

  // Validate slug format
  const validSlugPattern = /^[a-z0-9-_]+$/
  if (!validSlugPattern.test(slug)) {
    return NextResponse.json({ error: "Slug can only contain lowercase letters, numbers, hyphens, and underscores" }, { status: 400 })
  }

  const existingArticle = await prisma.article.findUnique({
    where: { slug },
  })

  if (existingArticle) {
    return NextResponse.json({ error: "An article with this slug already exists" }, { status: 400 })
  }

  // If linking to an existing article, get its translation group
  let translationGroupId: string | null = null
  if (linkedArticleId) {
    const linkedArticle = await prisma.article.findUnique({
      where: { id: linkedArticleId },
      select: { translationGroupId: true }
    })
    if (linkedArticle) {
      translationGroupId = linkedArticle.translationGroupId || `group-${Date.now()}`
      // Update the linked article to have the translation group if it doesn't
      if (!linkedArticle.translationGroupId) {
        await prisma.article.update({
          where: { id: linkedArticleId },
          data: { translationGroupId }
        })
      }
    }
  }

  await prisma.article.create({
    data: { 
      title, 
      slug, 
      tags: tags || null,
      excerpt: excerpt || null, 
      content, 
      metaTitle: metaTitle || null,
      metaDescription: metaDescription || null,
      published: published || false,
      language,
      translationGroupId
    },
  })

  return NextResponse.json({ success: true })
}
