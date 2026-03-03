import { authOptions } from "@/lib/auth"
import { getServerSession } from "next-auth"
import prisma from "@/lib/prisma"

export async function approveComment(commentId: string) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    throw new Error("Unauthorized")
  }

  await prisma.comment.update({
    where: { id: commentId },
    data: { approved: true },
  })
}

export async function deleteComment(commentId: string) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    throw new Error("Unauthorized")
  }

  await prisma.comment.delete({
    where: { id: commentId },
  })
}