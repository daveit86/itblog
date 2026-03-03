import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import SettingsClient from "./SettingsClient"

export default async function SettingsPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.email) {
    redirect('/auth/signin')
  }

  // Only admins can access settings
  if (session.user?.role !== 'admin') {
    redirect('/admin')
  }

  // Try to find user by email, or create a default user object from session
  let user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      bio: true,
      notifyOnComments: true,
      notifyOnPublish: true,
      adminEmail: true,
    }
  })

  // If user doesn't exist in database (credentials auth), use session data with defaults
  if (!user) {
    user = {
      id: session.user.id || '1',
      name: session.user.name || null,
      email: session.user.email,
      image: session.user.image || null,
      bio: null,
      notifyOnComments: true,
      notifyOnPublish: false,
      adminEmail: session.user.email,
    }
  }

  return <SettingsClient user={user} />
}
