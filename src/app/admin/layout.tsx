import prisma from "@/lib/prisma"
import Link from "next/link"
import { format } from "date-fns"
import { authOptions } from "@/lib/auth"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import AdminNav from "@/components/AdminNav"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/auth/signin')
  }

  if (session.user?.role !== 'admin' && session.user?.role !== 'author') {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminNav userName={session.user?.name} userRole={session.user?.role} />
      <main className="max-w-6xl mx-auto py-8 sm:px-6 lg:px-8 px-4">
        {children}
      </main>
    </div>
  )
}