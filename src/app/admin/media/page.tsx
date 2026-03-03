import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { getMediaFiles, getStorageStats } from "./actions"
import MediaClient from "./MediaClient"

export default async function MediaPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/auth/signin')
  }

  const [{ files, error: filesError }, { totalFiles, totalSizeFormatted, usedFiles, unusedFiles, error: statsError }] = await Promise.all([
    getMediaFiles(),
    getStorageStats()
  ])

  if (filesError || statsError) {
    return (
      <div className="text-center py-12">
        <p className="text-error">{filesError || statsError}</p>
      </div>
    )
  }

  return (
    <MediaClient 
      files={files} 
      stats={{
        totalFiles,
        totalSizeFormatted,
        usedFiles,
        unusedFiles
      }}
    />
  )
}
