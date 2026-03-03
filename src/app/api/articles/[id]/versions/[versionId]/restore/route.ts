import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id, versionId } = await params
    
    const version = await prisma.articleVersion.findUnique({
      where: { id: versionId }
    })

    if (!version) {
      return NextResponse.json({ error: "Version not found" }, { status: 404 })
    }

    // Update article with version data
    await prisma.article.update({
      where: { id },
      data: {
        title: version.title,
        content: version.content,
        excerpt: version.excerpt,
        tags: version.tags,
        metaTitle: version.metaTitle,
        metaDescription: version.metaDescription,
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to restore version:', error)
    return NextResponse.json(
      { error: "Failed to restore version" },
      { status: 500 }
    )
  }
}
