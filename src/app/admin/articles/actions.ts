'use server'

import { authOptions } from "@/lib/auth"
import { getServerSession } from "next-auth"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { logAuditEvent } from "@/lib/audit"
import { headers } from "next/headers"
import { unlink } from "fs/promises"
import { join } from "path"

export async function createArticle(formData: FormData): Promise<{ error?: string } | { redirect: string }> {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return { error: "Unauthorized" }
  }

  // Only admins can create articles
  if (session.user?.role !== 'admin') {
    return { error: "Forbidden - Admin access required" }
  }

  const title = formData.get("title") as string
  const slug = formData.get("slug") as string
  const excerpt = formData.get("excerpt") as string | null
  const content = formData.get("content") as string
  const publishedValue = formData.get("published")
  const published = publishedValue === "on" || publishedValue === "true"

  if (!title || !slug || !content) {
    return { error: "Required fields missing" }
  }

  // Input length validation
  if (title.length > 200) {
    return { error: "Title must be less than 200 characters" }
  }
  if (content.length > 100000) {
    return { error: "Content must be less than 100KB" }
  }
  if (excerpt && excerpt.length > 500) {
    return { error: "Excerpt must be less than 500 characters" }
  }

  const existingArticle = await prisma.article.findUnique({
    where: { slug },
  })

  if (existingArticle) {
    return { error: "An article with this slug already exists" }
  }

  const article = await prisma.article.create({
    data: { title, slug, excerpt: excerpt || null, content, published: published || false },
  })

  // Log audit event
  const headersList = await headers()
  await logAuditEvent({
    userId: session.user.id,
    action: published ? 'article_create' : 'article_create',
    resourceType: 'article',
    resourceId: article.id,
    details: { title, slug, published },
    ipAddress: headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown',
    userAgent: headersList.get('user-agent') || 'unknown',
  })

  return { redirect: "/admin" }
}

export async function publishArticle(articleId: string): Promise<{ error?: string }> {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return { error: "Unauthorized" }
  }

  // Only admins can publish articles
  if (session.user?.role !== 'admin') {
    return { error: "Forbidden - Admin access required" }
  }

  try {
    await prisma.article.update({
      where: { id: articleId },
      data: { published: true },
    })
    revalidatePath('/admin')
    revalidatePath('/')

    // Log audit event
    const headersList = await headers()
    await logAuditEvent({
      userId: session.user.id,
      action: 'article_publish',
      resourceType: 'article',
      resourceId: articleId,
      ipAddress: headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown',
      userAgent: headersList.get('user-agent') || 'unknown',
    })

    return {}
  } catch (error) {
    console.error('Failed to publish article:', error)
    return { error: "Failed to publish article" }
  }
}

export async function unpublishArticle(articleId: string): Promise<{ error?: string }> {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return { error: "Unauthorized" }
  }

  // Only admins can unpublish articles
  if (session.user?.role !== 'admin') {
    return { error: "Forbidden - Admin access required" }
  }

  try {
    await prisma.article.update({
      where: { id: articleId },
      data: { published: false },
    })
    revalidatePath('/admin')
    revalidatePath('/')

    // Log audit event
    const headersList = await headers()
    await logAuditEvent({
      userId: session.user.id,
      action: 'article_unpublish',
      resourceType: 'article',
      resourceId: articleId,
      ipAddress: headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown',
      userAgent: headersList.get('user-agent') || 'unknown',
    })

    return {}
  } catch (error) {
    console.error('Failed to unpublish article:', error)
    return { error: "Failed to unpublish article" }
  }
}

export async function deleteArticle(articleId: string): Promise<{ error?: string }> {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: "Unauthorized" }
  }

  // Only admins can delete articles
  if (session.user?.role !== 'admin') {
    return { error: "Forbidden - Admin access required" }
  }

  try {
    // First, fetch the article to get its content and extract upload references
    const article = await prisma.article.findUnique({
      where: { id: articleId },
    })

    if (!article) {
      return { error: "Article not found" }
    }

    // Extract upload filenames from article content
    // Matches both Markdown images: ![alt](/uploads/filename) and HTML: <img src="/uploads/filename">
    const uploadRegex = /(?:!\[.*?\]\(|<img[^>]+src=")\/uploads\/([^\)"\s]+)/g
    const uploadsToDelete: string[] = []
    let match

    while ((match = uploadRegex.exec(article.content)) !== null) {
      uploadsToDelete.push(match[1])
    }

    // Delete the article first (this will cascade delete related records like comments)
    await prisma.article.delete({
      where: { id: articleId },
    })

    // Delete associated upload files
    const uploadsDir = join(process.cwd(), "public", "uploads")
    const deletePromises = uploadsToDelete.map(async (filename) => {
      try {
        const filepath = join(uploadsDir, filename)
        await unlink(filepath)
      } catch {
        // Silently ignore errors - file may not exist
      }
    })

    await Promise.all(deletePromises)

    revalidatePath('/admin')
    revalidatePath('/')

    // Log audit event
    const headersList = await headers()
    await logAuditEvent({
      userId: session.user.id,
      action: 'article_delete',
      resourceType: 'article',
      resourceId: articleId,
      details: { deletedUploads: uploadsToDelete.length },
      ipAddress: headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown',
      userAgent: headersList.get('user-agent') || 'unknown',
    })

    return {}
  } catch (error) {
    console.error('Failed to delete article:', error)
    return { error: "Failed to delete article" }
  }
}
