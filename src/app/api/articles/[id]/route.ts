import { NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import { getServerSession } from "next-auth"
import prisma from "@/lib/prisma"

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const formData = await request.formData()
  
  const id = formData.get("id") as string
  const title = formData.get("title") as string
  const slug = formData.get("slug") as string
  const excerpt = formData.get("excerpt") as string | null
  const content = formData.get("content") as string
  const publishedValue = formData.get("published")
  const published = publishedValue === "on" || publishedValue === "true"
  const tags = formData.get("tags") as string | null
  const metaTitle = formData.get("metaTitle") as string | null
  const metaDescription = formData.get("metaDescription") as string | null
  const language = (formData.get("language") as string) || "en"

  if (!id || !title || !slug || !content) {
    return NextResponse.json({ error: "Required fields missing" }, { status: 400 })
  }

  // Validate slug format
  const validSlugPattern = /^[a-z0-9-_]+$/
  if (!validSlugPattern.test(slug)) {
    return NextResponse.json({ error: "Slug can only contain lowercase letters, numbers, hyphens, and underscores" }, { status: 400 })
  }

  const existingArticle = await prisma.article.findFirst({
    where: { slug, NOT: { id } },
  })

  if (existingArticle) {
    return NextResponse.json({ error: "An article with this slug already exists" }, { status: 400 })
  }

  await prisma.article.update({
    where: { id },
    data: { 
      title, 
      slug, 
      excerpt: excerpt || null, 
      content, 
      published,
      tags: tags || null,
      metaTitle: metaTitle || null,
      metaDescription: metaDescription || null,
      language,
    },
  })

  return NextResponse.json({ success: true })
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")

  if (!id) {
    return NextResponse.json({ error: "Article ID required" }, { status: 400 })
  }

  await prisma.article.delete({
    where: { id },
  })

  return NextResponse.json({ success: true })
}