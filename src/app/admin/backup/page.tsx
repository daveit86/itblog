'use client'

import { useState } from "react"
import Link from "next/link"

export default function BackupPage() {
  const [restoring, setRestoring] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleBackup = async () => {
    try {
      const res = await fetch('/api/admin/backup')
      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `itblog-backup-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        setMessage({ type: 'success', text: 'Backup downloaded successfully!' })
      } else {
        setMessage({ type: 'error', text: 'Failed to create backup' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to create backup' })
    }
  }

  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setRestoring(true)
    setMessage(null)

    try {
      const text = await file.text()
      const backup = JSON.parse(text)

      const res = await fetch('/api/admin/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(backup),
      })

      const data = await res.json()

      if (res.ok) {
        setMessage({ 
          type: 'success', 
          text: `Restore completed! Imported ${data.importedArticles} articles and ${data.importedComments} comments.` 
        })
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to restore backup' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Invalid backup file' })
    } finally {
      setRestoring(false)
      // Reset input
      e.target.value = ''
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-foreground">Backup & Restore</h1>
        <Link
          href="/admin"
          className="text-primary hover:text-primary-hover"
        >
          ← Back to Admin
        </Link>
      </div>

      {message && (
        <div className={`mb-6 px-4 py-3 rounded ${
          message.type === 'error' 
            ? 'bg-error/10 border border-error/20 text-error' 
            : 'bg-success/10 border border-success/20 text-success'
        }`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Backup Section */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Create Backup</h2>
          <p className="text-muted-foreground mb-6">
            Download a complete backup of your blog data including articles, comments, and users.
          </p>
          <button
            onClick={handleBackup}
            className="btn btn-primary flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download Backup
          </button>
        </div>

        {/* Restore Section */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Restore Backup</h2>
          <p className="text-muted-foreground mb-6">
            Restore your blog from a backup file. This will add or update existing data.
          </p>
          <div className="space-y-4">
            <input
              type="file"
              accept=".json"
              onChange={handleRestore}
              disabled={restoring}
              className="block w-full text-sm text-muted-foreground
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-primary file:text-white
                hover:file:bg-primary-hover
                disabled:opacity-50"
            />
            {restoring && (
              <p className="text-sm text-muted-foreground">Restoring...</p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 card p-6">
        <h3 className="text-lg font-semibold text-foreground mb-2">What gets backed up?</h3>
        <ul className="list-disc list-inside text-muted-foreground space-y-1">
          <li>All articles and their content</li>
          <li>Article versions and history</li>
          <li>Comments and replies</li>
          <li>User accounts and settings</li>
          <li>SEO metadata and tags</li>
        </ul>
        <p className="mt-4 text-sm text-muted-foreground">
          Note: Uploaded media files are not included in the backup. Please backup your /public/uploads folder separately.
        </p>
      </div>
    </div>
  )
}
