import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import bcrypt from 'bcryptjs'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const { name, email, role, password } = await request.json()

    const updateData: any = {
      name,
      email,
      role,
    }

    // Only update password if provided
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10)
      const account = await prisma.account.findFirst({
        where: { userId: id, provider: 'credentials' }
      })
      
      if (account) {
        await prisma.account.update({
          where: { id: account.id },
          data: { access_token: hashedPassword }
        })
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json({ success: true, user })
  } catch (error) {
    console.error('Update user error:', error)
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const currentUserId = session.user?.id

    // Prevent deleting yourself
    if (id === currentUserId) {
      return NextResponse.json(
        { error: "Cannot delete your own account" },
        { status: 400 }
      )
    }

    await prisma.user.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete user error:', error)
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    )
  }
}
