'use server'

import { authOptions } from "@/lib/auth"
import { getServerSession } from "next-auth"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { logAuditEvent } from "@/lib/audit"
import { headers } from "next/headers"
import { readdir, stat, unlink } from "fs/promises"
import { join } from "path"

export interface MediaFile {
  filename: string
  url: string
  size: number
  sizeFormatted: string
  createdAt: Date
  type: string
  isUsed: boolean
}

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

export async function getMediaFiles(): Promise<{ files: MediaFile[]; error?: string }> {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return { files: [], error: "Unauthorized" }
  }

  try {
    const uploadsDir = join(process.cwd(), "public", "uploads")
    let files: string[] = []
    
    try {
      files = await readdir(uploadsDir)
    } catch (err) {
      // Directory doesn't exist or is empty
      files = []
    }
    
    // Get all articles to check which files are being used
    const articles = await prisma.article.findMany({
      select: { content: true }
    })
    
    const allContent = articles.map(a => a.content).join(' ')
    
    const mediaFiles: MediaFile[] = await Promise.all(
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
    
    return { files: mediaFiles }
  } catch (error) {
    console.error('Failed to get media files:', error)
    return { files: [], error: "Failed to load media files" }
  }
}

export async function deleteMediaFile(filename: string): Promise<{ error?: string }> {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return { error: "Unauthorized" }
  }

  try {
    // Security check: ensure filename doesn't contain path traversal
    if (filename.includes('..') || filename.includes('/')) {
      return { error: "Invalid filename" }
    }

    const uploadsDir = join(process.cwd(), "public", "uploads")
    const filepath = join(uploadsDir, filename)
    
    await unlink(filepath)
    revalidatePath('/admin/media')

    // Log audit event
    const headersList = await headers()
    await logAuditEvent({
      userId: session.user.id,
      action: 'media_delete',
      resourceType: 'media',
      resourceId: filename,
      ipAddress: headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown',
      userAgent: headersList.get('user-agent') || 'unknown',
    })

    return {}
  } catch (error) {
    console.error('Failed to delete media file:', error)
    return { error: "Failed to delete media file" }
  }
}

export async function bulkDeleteMediaFiles(filenames: string[]): Promise<{ success: number; error?: string }> {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return { success: 0, error: "Unauthorized" }
  }

  try {
    const uploadsDir = join(process.cwd(), "public", "uploads")
    let successCount = 0

    for (const filename of filenames) {
      // Security check
      if (filename.includes('..') || filename.includes('/')) {
        continue
      }

      try {
        const filepath = join(uploadsDir, filename)
        await unlink(filepath)
        successCount++
      } catch (error) {
        console.error(`Failed to delete ${filename}:`, error)
      }
    }

    revalidatePath('/admin/media')

    // Log audit event
    const headersList = await headers()
    await logAuditEvent({
      userId: session.user.id,
      action: 'bulk_media_delete',
      resourceType: 'media',
      details: { count: successCount },
      ipAddress: headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown',
      userAgent: headersList.get('user-agent') || 'unknown',
    })

    return { success: successCount }
  } catch (error) {
    console.error('Failed to bulk delete media files:', error)
    return { success: 0, error: "Failed to delete media files" }
  }
}

export async function getStorageStats(): Promise<{ 
  totalFiles: number; 
  totalSize: number; 
  totalSizeFormatted: string;
  usedFiles: number;
  unusedFiles: number;
  error?: string 
}> {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return { totalFiles: 0, totalSize: 0, totalSizeFormatted: '0 B', usedFiles: 0, unusedFiles: 0, error: "Unauthorized" }
  }

  try {
    const uploadsDir = join(process.cwd(), "public", "uploads")
    let files: string[] = []
    
    try {
      files = await readdir(uploadsDir)
    } catch (err) {
      // Directory doesn't exist or is empty
      files = []
    }
    
    // Get all articles to check which files are being used
    const articles = await prisma.article.findMany({
      select: { content: true }
    })
    
    const allContent = articles.map(a => a.content).join(' ')
    
    let totalSize = 0
    let usedFiles = 0
    
    for (const filename of files) {
      const filepath = join(uploadsDir, filename)
      const stats = await stat(filepath)
      totalSize += stats.size
      
      if (allContent.includes(`/uploads/${filename}`)) {
        usedFiles++
      }
    }
    
    return {
      totalFiles: files.length,
      totalSize,
      totalSizeFormatted: formatFileSize(totalSize),
      usedFiles,
      unusedFiles: files.length - usedFiles
    }
  } catch (error) {
    console.error('Failed to get storage stats:', error)
    return { totalFiles: 0, totalSize: 0, totalSizeFormatted: '0 B', usedFiles: 0, unusedFiles: 0, error: "Failed to get storage stats" }
  }
}
