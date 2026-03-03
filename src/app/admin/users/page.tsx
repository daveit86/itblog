import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import UsersClient from "./UsersClient"

export default async function UsersPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/auth/signin')
  }

  // Only admins can access user management
  if (session.user?.role !== 'admin') {
    redirect('/admin')
  }

  return <UsersClient />
}
