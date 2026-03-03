'use server'

import prisma from "@/lib/prisma"
import { authOptions } from "@/lib/auth"
import { getServerSession } from "next-auth"

export async function getArticleVersions(articleId: string) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return { error: "Unauthorized" }
  }

  try {
    const versions = await prisma.articleVersion.findMany({
      where: { articleId },
      orderBy: { version: 'desc' }
    })
    
    return { versions }
  } catch (error) {
    console.error('Failed to get versions:', error)
    return { error: "Failed to get versions" }
  }
}

export async function restoreVersion(versionId: string) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return { error: "Unauthorized" }
  }

  try {
    const version = await prisma.articleVersion.findUnique({
      where: { id: versionId }
    })

    if (!version) {
      return { error: "Version not found" }
    }

    // Update article with version data
    await prisma.article.update({
      where: { id: version.articleId },
      data: {
        title: version.title,
        content: version.content,
        excerpt: version.excerpt,
        tags: version.tags,
        metaTitle: version.metaTitle,
        metaDescription: version.metaDescription,
      }
    })

    return { success: true }
  } catch (error) {
    console.error('Failed to restore version:', error)
    return { error: "Failed to restore version" }
  }
}

export async function deleteVersion(versionId: string) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return { error: "Unauthorized" }
  }

  try {
    await prisma.articleVersion.delete({
      where: { id: versionId }
    })
    
    return { success: true }
  } catch (error) {
    console.error('Failed to delete version:', error)
    return { error: "Failed to delete version" }
  }
}
