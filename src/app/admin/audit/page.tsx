import prisma from "@/lib/prisma"
import { authOptions } from "@/lib/auth"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import AuditClient from "./AuditClient"

export default async function AuditLogPage() {
  const session = await getServerSession(authOptions)
  
  if (!session || session.user?.role !== 'admin') {
    redirect('/auth/signin')
  }

  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      user: {
        select: { name: true, email: true }
      }
    }
  })

  return <AuditClient logs={logs} />
}
