import { NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import { getServerSession } from "next-auth"
import prisma from "@/lib/prisma"

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Only admins can approve/disapprove comments
  if (session.user?.role !== 'admin') {
    return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 })
  }

  const body = await request.json()
  const { id, approved } = body

  const comment = await prisma.comment.update({
    where: { id },
    data: { approved },
  })

  return NextResponse.json(comment)
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Only admins can delete comments
  if (session.user?.role !== 'admin') {
    return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")

  if (!id) {
    return NextResponse.json({ error: "Comment ID required" }, { status: 400 })
  }

  await prisma.comment.delete({
    where: { id },
  })

  return NextResponse.json({ success: true })
}