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

    const backup = await request.json()

    if (!backup.articles || !Array.isArray(backup.articles)) {
      return NextResponse.json(
        { error: "Invalid backup file" },
        { status: 400 }
      )
    }

    // Clear existing data (optional - depends on restore strategy)
    // For now, we'll skip clearing and just add/update
    
    let importedArticles = 0
    let importedComments = 0

    // Restore articles
    for (const article of backup.articles) {
      const { id, comments, versions, createdAt, updatedAt, ...articleData } = article
      
      await prisma.article.upsert({
        where: { id },
        update: {
          ...articleData,
          createdAt: new Date(createdAt),
          updatedAt: new Date(updatedAt),
        },
        create: {
          ...articleData,
          id,
          createdAt: new Date(createdAt),
          updatedAt: new Date(updatedAt),
        },
      })
      importedArticles++

      // Restore comments for this article
      if (comments && Array.isArray(comments)) {
        for (const comment of comments) {
          const { id: commentId, createdAt: commentCreatedAt, ...commentData } = comment
          
          await prisma.comment.upsert({
            where: { id: commentId },
            update: {
              ...commentData,
              createdAt: new Date(commentCreatedAt),
            },
            create: {
              ...commentData,
              id: commentId,
              createdAt: new Date(commentCreatedAt),
            },
          })
          importedComments++
        }
      }
    }

    // Restore users (skip if they exist)
    if (backup.users && Array.isArray(backup.users)) {
      for (const user of backup.users) {
        const { id, createdAt, updatedAt, ...userData } = user
        
        await prisma.user.upsert({
          where: { id },
          update: {
            ...userData,
            createdAt: new Date(createdAt),
            updatedAt: new Date(updatedAt),
          },
          create: {
            ...userData,
            id,
            createdAt: new Date(createdAt),
            updatedAt: new Date(updatedAt),
          },
        })
      }
    }

    return NextResponse.json({
      success: true,
      importedArticles,
      importedComments,
    })
  } catch (error) {
    console.error('Restore error:', error)
    return NextResponse.json(
      { error: "Failed to restore backup: " + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    )
  }
}
