import prisma from "@/lib/prisma"
import Link from "next/link"
import { authOptions } from "@/lib/auth"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import CommentsClient from "./CommentsClient"

export default async function AdminCommentsPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/auth/signin')
  }

  const pendingComments = await prisma.comment.findMany({
    where: { approved: false },
    orderBy: { createdAt: 'desc' },
    include: {
      article: {
        select: { title: true, slug: true }
      }
    }
  })

  const approvedComments = await prisma.comment.findMany({
    where: { approved: true },
    orderBy: { createdAt: 'desc' },
    include: {
      article: {
        select: { title: true, slug: true }
      }
    },
    take: 50
  })

  return (
    <CommentsClient 
      pendingComments={pendingComments} 
      approvedComments={approvedComments} 
    />
  )
}
