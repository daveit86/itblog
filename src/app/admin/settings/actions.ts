'use server'

import { authOptions } from "@/lib/auth"
import { getServerSession } from "next-auth"
import prisma from "@/lib/prisma"
import bcrypt from 'bcryptjs'

export async function updateProfile(formData: FormData): Promise<{ error?: string; success?: boolean }> {
  console.log('updateProfile called')
  const session = await getServerSession(authOptions)
  
  console.log('Session:', session)
  
  if (!session?.user?.email) {
    console.log('No session or email found')
    return { error: "Unauthorized" }
  }

  const name = formData.get("name") as string
  const image = formData.get("image") as string
  const bio = formData.get("bio") as string
  
  console.log('Form data:', { name, image, bio, email: session.user.email })

  try {
    // Try to find user by email first
    let user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })
    
    console.log('Found user:', user)

    if (!user) {
      console.log('Creating new user...')
      // Create user if doesn't exist (for credentials auth)
      user = await prisma.user.create({
        data: {
          email: session.user.email,
          name: name || null,
          image: image || null,
          bio: bio || null,
          role: 'admin',
        }
      })
      console.log('User created:', user)
    } else {
      console.log('Updating existing user...')
      // Update existing user
      await prisma.user.update({
        where: { email: session.user.email },
        data: { 
          name: name || null,
          image: image || null,
          bio: bio || null
        },
      })
      console.log('User updated successfully')
    }

    return { success: true }
  } catch (error) {
    console.error('Failed to update profile:', error)
    return { error: "Failed to update profile: " + (error instanceof Error ? error.message : String(error)) }
  }
}

export async function updateEmail(formData: FormData): Promise<{ error?: string; success?: boolean }> {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.email) {
    return { error: "Unauthorized" }
  }

  const newEmail = formData.get("email") as string
  const currentPassword = formData.get("currentPassword") as string

  if (!newEmail || !currentPassword) {
    return { error: "Email and current password are required" }
  }

  // Find user by current email
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
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
    console.error('Failed to update email:', error)
    return { error: "Failed to update email" }
  }
}

export async function updatePassword(formData: FormData): Promise<{ error?: string; success?: boolean }> {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.email) {
    return { error: "Unauthorized" }
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
      where: { email: session.user.email },
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
    console.error('Failed to update password:', error)
    return { error: "Failed to update password" }
  }
}

export async function updateNotificationSettings(formData: FormData): Promise<{ error?: string; success?: boolean }> {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.email) {
    return { error: "Unauthorized" }
  }

  const notifyOnComments = formData.get("notifyOnComments") === "on"
  const notifyOnPublish = formData.get("notifyOnPublish") === "on"
  const adminEmail = formData.get("adminEmail") as string

  try {
    // Find user by email first
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
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
    console.error('Failed to update notification settings:', error)
    return { error: "Failed to update notification settings" }
  }
}
