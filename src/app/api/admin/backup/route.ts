import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Export all data
    const [articles, comments, users] = await Promise.all([
      prisma.article.findMany({
        include: {
          comments: true,
          versions: true,
        }
      }),
      prisma.comment.findMany(),
      prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          bio: true,
          role: true,
          notifyOnComments: true,
          notifyOnPublish: true,
          adminEmail: true,
          createdAt: true,
          updatedAt: true,
        }
      }),
    ])

    const backup = {
      exportedAt: new Date().toISOString(),
      version: "1.0",
      articles,
      comments,
      users,
    }

    // Return as downloadable JSON
    return new NextResponse(JSON.stringify(backup, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="itblog-backup-${new Date().toISOString().split('T')[0]}.json"`,
      },
    })
  } catch (error) {
    console.error('Backup error:', error)
    return NextResponse.json(
      { error: "Failed to create backup" },
      { status: 500 }
    )
  }
}
