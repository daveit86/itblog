import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { readdir, stat } from "fs/promises"
import { join } from "path"

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function getFileType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp']
  const documentTypes = ['pdf', 'doc', 'docx', 'txt', 'md']
  const videoTypes = ['mp4', 'webm', 'mov', 'avi']
  const audioTypes = ['mp3', 'wav', 'ogg', 'aac']
  
  if (imageTypes.includes(ext)) return 'image'
  if (documentTypes.includes(ext)) return 'document'
  if (videoTypes.includes(ext)) return 'video'
  if (audioTypes.includes(ext)) return 'audio'
  return 'other'
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const uploadsDir = join(process.cwd(), "public", "uploads")
    let files: string[] = []
    
    try {
      files = await readdir(uploadsDir)
    } catch (err) {
      files = []
    }

    // Get all articles to check which files are being used
    const articles = await prisma.article.findMany({
      select: { content: true }
    })
    
    const allContent = articles.map(a => a.content).join(' ')
    
    const mediaFiles = await Promise.all(
      files.map(async (filename) => {
        const filepath = join(uploadsDir, filename)
        const stats = await stat(filepath)
        const isUsed = allContent.includes(`/uploads/${filename}`)
        
        return {
          filename,
          url: `/uploads/${filename}`,
          size: stats.size,
          sizeFormatted: formatFileSize(stats.size),
          createdAt: stats.birthtime,
          type: getFileType(filename),
          isUsed
        }
      })
    )
    
    // Sort by creation date (newest first)
    mediaFiles.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    
    return NextResponse.json({ files: mediaFiles })
  } catch (error) {
    console.error('Failed to get media files:', error)
    return NextResponse.json(
      { error: "Failed to load media files" },
      { status: 500 }
    )
  }
}
