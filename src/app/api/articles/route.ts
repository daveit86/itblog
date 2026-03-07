import { NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import { getServerSession } from "next-auth"
import prisma from "@/lib/prisma"

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
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
  const translationGroupId = (formData.get("translationGroupId") as string) || null

  if (!title || !slug || !content) {
    return NextResponse.json({ error: "Required fields missing" }, { status: 400 })
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
