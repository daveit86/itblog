import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true }
    })

    if (user?.role !== 'admin') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get pending comments count
    const pendingCount = await prisma.comment.count({
      where: { approved: false }
    })

    // Get total comments count for context
    const totalCount = await prisma.comment.count()

    return NextResponse.json({ 
      pending: pendingCount,
      total: totalCount
    })
  } catch (error) {
    console.error("Error fetching comment stats:", error)
    return NextResponse.json(
      { error: "Failed to fetch comment statistics" },
      { status: 500 }
    )
  }
}
