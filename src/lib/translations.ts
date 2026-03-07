'use server'

import { authOptions } from "@/lib/auth"
import { getServerSession } from "next-auth"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function getArticleTranslations(articleId: string) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return { translations: [], error: "Unauthorized" }
  }

  try {
    const article = await prisma.article.findUnique({
      where: { id: articleId },
      select: { translationGroupId: true }
    })

    if (!article?.translationGroupId) {
      return { translations: [], error: null }
    }

    const translations = await prisma.article.findMany({
      where: { 
        translationGroupId: article.translationGroupId,
        NOT: { id: articleId }
      },
      select: {
        id: true,
        title: true,
        slug: true,
        language: true,
      }
    })

    return { translations, error: null }
  } catch (error) {
    console.error('Failed to get translations:', error)
    return { translations: [], error: "Failed to get translations" }
  }
}

export async function linkTranslation(
  articleId: string, 
  targetArticleId: string
): Promise<{ success: boolean; error?: string }> {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const [article, targetArticle] = await Promise.all([
      prisma.article.findUnique({ where: { id: articleId } }),
      prisma.article.findUnique({ where: { id: targetArticleId } })
    ])

    if (!article || !targetArticle) {
      return { success: false, error: "Article not found" }
    }

    // Generate a new translation group ID if neither article has one
    const translationGroupId = article.translationGroupId || 
                               targetArticle.translationGroupId || 
                               `group-${Date.now()}`

    // Update both articles to share the same translation group
    await prisma.$transaction([
      prisma.article.update({
        where: { id: articleId },
        data: { translationGroupId }
      }),
      prisma.article.update({
        where: { id: targetArticleId },
        data: { translationGroupId }
      })
    ])

    revalidatePath('/admin')
    return { success: true }
  } catch (error) {
    console.error('Failed to link translation:', error)
    return { success: false, error: "Failed to link translation" }
  }
}

export async function unlinkTranslation(
  articleId: string
): Promise<{ success: boolean; error?: string }> {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    await prisma.article.update({
      where: { id: articleId },
      data: { translationGroupId: null }
    })

    revalidatePath('/admin')
    return { success: true }
  } catch (error) {
    console.error('Failed to unlink translation:', error)
    return { success: false, error: "Failed to unlink translation" }
  }
}

export async function getAvailableTranslations(
  currentArticleId: string,
  currentLanguage: string
) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return { articles: [], error: "Unauthorized" }
  }

  try {
    const articles = await prisma.article.findMany({
      where: { 
        NOT: { 
          OR: [
            { id: currentArticleId },
            { language: currentLanguage }
          ]
        }
      },
      select: {
        id: true,
        title: true,
        slug: true,
        language: true,
      },
      orderBy: { createdAt: 'desc' }
    })

    return { articles, error: null }
  } catch (error) {
    console.error('Failed to get available translations:', error)
    return { articles: [], error: "Failed to get available translations" }
  }
}
