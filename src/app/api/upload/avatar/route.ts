import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { writeFile } from "fs/promises"
import { join } from "path"
import crypto from "crypto"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed." },
        { status: 400 }
      )
    }

    // Validate file size (max 2MB)
    const maxSize = 2 * 1024 * 1024 // 2MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 2MB." },
        { status: 400 }
      )
    }

    // Generate unique filename
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const hash = crypto.createHash('md5').update(buffer).digest('hex').substring(0, 8)
    const timestamp = Date.now()
    const extension = file.type.split('/')[1]
    const filename = `avatar-${timestamp}-${hash}.${extension}`

    // Save to public/uploads/avatars
    const uploadDir = join(process.cwd(), "public", "uploads", "avatars")
    const filepath = join(uploadDir, filename)
    
    console.log('Saving avatar to:', filepath)
    await writeFile(filepath, buffer)
    console.log('Avatar saved successfully')

    // Return the public URL
    const imageUrl = `/uploads/avatars/${filename}`
    console.log('Returning image URL:', imageUrl)

    return NextResponse.json({ 
      success: true, 
      url: imageUrl,
      message: "Profile picture uploaded successfully"
    })
  } catch (error) {
    console.error("Profile picture upload error:", error)
    return NextResponse.json(
      { error: "Failed to upload profile picture" },
      { status: 500 }
    )
  }
}
