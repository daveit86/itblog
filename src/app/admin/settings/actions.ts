'use server'

import { authOptions } from "@/lib/auth"
import { getServerSession } from "next-auth"
import prisma from "@/lib/prisma"
import bcrypt from 'bcryptjs'
import { testSMTPConnection } from "@/lib/email"
import { revalidatePath } from "next/cache"

// Helper function to check admin authorization
async function checkAdminAuth() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.email) {
    return { error: "Unauthorized", session: null, email: null }
  }

  if (session.user?.role !== 'admin') {
    return { error: "Forbidden - Admin access required", session: null, email: null }
  }

  return { error: null, session, email: session.user.email }
}

export async function updateProfile(formData: FormData): Promise<{ error?: string; success?: boolean }> {
  const auth = await checkAdminAuth()
  
  if (auth.error) {
    return { error: auth.error }
  }

  const name = formData.get("name") as string
  const image = formData.get("image") as string
  const bio = formData.get("bio") as string

  try {
    // Try to find user by email first
    let user = await prisma.user.findUnique({
      where: { email: auth.email! }
    })

    if (!user) {
      // Create user if doesn't exist (for credentials auth)
      user = await prisma.user.create({
        data: {
          email: auth.email!,
          name: name || null,
          image: image || null,
          bio: bio || null,
          role: 'admin',
        }
      })
    } else {
      // Update existing user
      await prisma.user.update({
        where: { email: auth.email! },
        data: { 
          name: name || null,
          image: image || null,
          bio: bio || null
        },
      })
    }

    return { success: true }
  } catch (error) {
    return { error: "Failed to update profile" }
  }
}

export async function updateEmail(formData: FormData): Promise<{ error?: string; success?: boolean }> {
  const auth = await checkAdminAuth()
  
  if (auth.error) {
    return { error: auth.error }
  }

  const newEmail = formData.get("email") as string
  const currentPassword = formData.get("currentPassword") as string

  if (!newEmail || !currentPassword) {
    return { error: "Email and current password are required" }
  }

  // Find user by current email
  const user = await prisma.user.findUnique({
    where: { email: auth.email! },
    include: { accounts: true }
  })

  if (!user) {
    return { error: "User not found" }
  }

  // Check if new email is already taken by another user
  const existingUser = await prisma.user.findUnique({
    where: { email: newEmail }
  })

  if (existingUser && existingUser.id !== user.id) {
    return { error: "Email is already in use" }
  }

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: { email: newEmail },
    })
    return { success: true }
  } catch (error) {
    return { error: "Failed to update email" }
  }
}

export async function updatePassword(formData: FormData): Promise<{ error?: string; success?: boolean }> {
  const auth = await checkAdminAuth()
  
  if (auth.error) {
    return { error: auth.error }
  }

  const currentPassword = formData.get("currentPassword") as string
  const newPassword = formData.get("newPassword") as string
  const confirmPassword = formData.get("confirmPassword") as string

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { error: "All fields are required" }
  }

  if (newPassword !== confirmPassword) {
    return { error: "New passwords do not match" }
  }

  if (newPassword.length < 6) {
    return { error: "Password must be at least 6 characters long" }
  }

  try {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: auth.email! },
      include: { accounts: true }
    })

    if (!user) {
      return { error: "User not found" }
    }

    // Get user's credential account
    const account = await prisma.account.findFirst({
      where: { 
        userId: user.id,
        provider: 'credentials'
      }
    })

    if (!account) {
      return { error: "Password can only be changed for credential-based accounts" }
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, account.access_token || '')
    
    if (!isValid) {
      return { error: "Current password is incorrect" }
    }

    // Hash new password and update
    const hashedPassword = await bcrypt.hash(newPassword, 10)
    
    await prisma.account.update({
      where: { id: account.id },
      data: { access_token: hashedPassword }
    })

    return { success: true }
  } catch (error) {
    return { error: "Failed to update password" }
  }
}

export async function updateNotificationSettings(formData: FormData): Promise<{ error?: string; success?: boolean }> {
  const auth = await checkAdminAuth()
  
  if (auth.error) {
    return { error: auth.error }
  }

  const notifyOnComments = formData.get("notifyOnComments") === "on"
  const notifyOnPublish = formData.get("notifyOnPublish") === "on"
  const adminEmail = formData.get("adminEmail") as string

  try {
    // Find user by email first
    const user = await prisma.user.findUnique({
      where: { email: auth.email! }
    })

    if (!user) {
      return { error: "User not found" }
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { 
        notifyOnComments,
        notifyOnPublish,
        adminEmail: adminEmail || null
      },
    })
    return { success: true }
  } catch (error) {
    return { error: "Failed to update notification settings" }
  }
}

export async function updateSMTPSettings(formData: FormData): Promise<{ error?: string; success?: boolean }> {
  const auth = await checkAdminAuth()
  
  if (auth.error) {
    return { error: auth.error }
  }

  const smtpHost = formData.get("smtpHost") as string
  const smtpPort = parseInt(formData.get("smtpPort") as string) || 587
  const smtpSecure = formData.get("smtpSecure") === "on"
  const smtpUser = formData.get("smtpUser") as string
  const smtpPass = formData.get("smtpPass") as string

  try {
    const user = await prisma.user.findUnique({
      where: { email: auth.email! }
    })

    if (!user) {
      return { error: "User not found" }
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { 
        smtpHost: smtpHost || null,
        smtpPort,
        smtpSecure,
        smtpUser: smtpUser || null,
        smtpPass: smtpPass || null,
      },
    })
    return { success: true }
  } catch (error) {
    return { error: "Failed to update SMTP settings" }
  }
}

export async function updateProfilePicture(imageUrl: string): Promise<{ error?: string; success?: boolean }> {
  const auth = await checkAdminAuth()
  
  if (auth.error) {
    return { error: auth.error }
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: auth.email! }
    })

    if (!user) {
      return { error: "User not found" }
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { image: imageUrl },
    })
    
    console.log('Profile picture updated in database:', updatedUser.image)
    
    // Revalidate the settings page to clear cache
    revalidatePath('/admin/settings')
    
    return { success: true }
  } catch (error) {
    console.error('Failed to update profile picture in database:', error)
    return { error: "Failed to update profile picture" }
  }
}

export async function testSMTP(): Promise<{ success: boolean; message: string }> {
  const auth = await checkAdminAuth()
  
  if (auth.error) {
    return { success: false, message: auth.error }
  }

  return await testSMTPConnection()
}
