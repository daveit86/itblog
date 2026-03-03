import { NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { uploadLimiter, checkRateLimit, getClientIp } from "@/lib/rate-limit"
import crypto from "crypto"

// File signature validation (magic numbers)
const fileSignatures: Record<string, number[]> = {
  'image/jpeg': [0xFF, 0xD8, 0xFF],
  'image/png': [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
  'image/gif': [0x47, 0x49, 0x46, 0x38],
  'image/webp': [0x52, 0x49, 0x46, 0x46],
  'application/pdf': [0x25, 0x50, 0x44, 0x46],
}

// Allowed file extensions
const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf']

function validateFileSignature(buffer: Buffer, mimeType: string): boolean {
  const signature = fileSignatures[mimeType]
  if (!signature) return false
  
  for (let i = 0; i < signature.length; i++) {
    if (buffer[i] !== signature[i]) {
      return false
    }
  }
  return true
}

function getExtension(filename: string): string {
  const ext = filename.slice(filename.lastIndexOf('.')).toLowerCase()
  return ext
}

function generateSecureFilename(originalName: string): string {
  // Extract extension
  const ext = getExtension(originalName)
  
  // Generate cryptographically secure random filename
  const randomBytes = crypto.randomBytes(16).toString('hex')
  const timestamp = Date.now()
  
  return `${timestamp}-${randomBytes}${ext}`
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check rate limit
    const clientIp = getClientIp(request)
    const rateLimitResult = await checkRateLimit(uploadLimiter, clientIp)
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: "Upload limit exceeded. Please try again later.",
          retryAfter: Math.ceil((rateLimitResult.msBeforeNext || 0) / 1000)
        },
        { 
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((rateLimitResult.msBeforeNext || 0) / 1000))
          }
        }
      )
    }

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only images and PDFs are allowed." },
        { status: 400 }
      )
    }

    // Validate file extension
    const extension = getExtension(file.name)
    if (!allowedExtensions.includes(extension)) {
      return NextResponse.json(
        { error: "Invalid file extension." },
        { status: 400 }
      )
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 5MB." },
        { status: 400 }
      )
    }

    // Read file content
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Validate file signature (prevent MIME type spoofing)
    if (!validateFileSignature(buffer, file.type)) {
      return NextResponse.json(
        { error: "Invalid file content. File may be corrupted or mislabeled." },
        { status: 400 }
      )
    }
    
    // Generate secure filename
    const filename = generateSecureFilename(file.name)
    
    // Ensure uploads directory exists
    const uploadsDir = join(process.cwd(), "public", "uploads")
    await mkdir(uploadsDir, { recursive: true })
    
    // Save file with sanitized path (prevent directory traversal)
    const filepath = join(uploadsDir, filename)
    const resolvedPath = join(filepath)
    const resolvedUploadsDir = join(uploadsDir)
    
    // Verify the resolved path is within the uploads directory
    if (!resolvedPath.startsWith(resolvedUploadsDir)) {
      return NextResponse.json(
        { error: "Invalid filename." },
        { status: 400 }
      )
    }
    
    await writeFile(filepath, buffer)

    // Return the public URL
    const url = `/uploads/${filename}`

    return NextResponse.json({
      success: true,
      url,
      filename: file.name,
      size: file.size,
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    )
  }
}
