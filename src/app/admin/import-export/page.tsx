'use client'

import { useState } from "react"
import Link from "next/link"

export default function ImportExportPage() {
  const [importing, setImporting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [importFormat, setImportFormat] = useState<'json' | 'markdown'>('json')
  const [exportFormat, setExportFormat] = useState<'json' | 'markdown'>('json')

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImporting(true)
    setMessage(null)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('format', importFormat)

    try {
      const res = await fetch('/api/admin/import', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (res.ok) {
        setMessage({ type: 'success', text: data.message })
      } else {
        setMessage({ type: 'error', text: data.error || 'Import failed' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Import failed' })
    } finally {
      setImporting(false)
      e.target.value = ''
    }
  }

  const handleExport = () => {
    const url = `/api/admin/export?format=${exportFormat}`
    window.location.href = url
  }

  const handleExportSingle = (articleId: string) => {
    const url = `/api/admin/export?format=${exportFormat}&id=${articleId}`
    window.location.href = url
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-foreground">Import & Export</h1>
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
        {/* Import Section */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Import Articles</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-foreground mb-2">
              Import Format
            </label>
            <select
              value={importFormat}
              onChange={(e) => setImportFormat(e.target.value as 'json' | 'markdown')}
              className="w-full rounded-md border-border bg-card px-3 py-2"
            >
              <option value="json">JSON (Blog Export)</option>
              <option value="markdown">Markdown (.md files)</option>
            </select>
          </div>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {importFormat === 'json' 
                ? 'Import articles from a JSON backup file. Articles will be added as drafts.'
                : 'Import single or multiple Markdown files. Supports YAML frontmatter.'}
            </p>
            <input
              type="file"
              accept={importFormat === 'json' ? '.json' : '.md'}
              onChange={handleImport}
              disabled={importing}
              className="block w-full text-sm text-muted-foreground
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-primary file:text-white
                hover:file:bg-primary-hover
                disabled:opacity-50"
            />
            {importing && (
              <p className="text-sm text-muted-foreground">Importing...</p>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-border">
            <h3 className="text-sm font-semibold text-foreground mb-2">Markdown Frontmatter Format:</h3>
            <pre className="bg-muted p-3 rounded text-xs text-muted-foreground overflow-x-auto">
{`---
title: Article Title
excerpt: Brief description
tags: tag1, tag2, tag3
published: false
---

Article content here...`}
            </pre>
          </div>
        </div>

        {/* Export Section */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Export Articles</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-foreground mb-2">
              Export Format
            </label>
            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value as 'json' | 'markdown')}
              className="w-full rounded-md border-border bg-card px-3 py-2"
            >
              <option value="json">JSON (Full Data)</option>
              <option value="markdown">Markdown (Content Only)</option>
            </select>
          </div>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {exportFormat === 'json'
                ? 'Export all articles as JSON with complete metadata and content.'
                : 'Export articles as Markdown files with YAML frontmatter.'}
            </p>
            <button
              onClick={handleExport}
              className="btn btn-primary w-full"
            >
              Export All Articles
            </button>
          </div>

          <div className="mt-6 pt-4 border-t border-border">
            <h3 className="text-sm font-semibold text-foreground mb-2">Supported Formats:</h3>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              <li><strong>JSON:</strong> Complete data export with all metadata</li>
              <li><strong>Markdown:</strong> Portable format with YAML frontmatter</li>
              <li><strong>Frontmatter:</strong> title, excerpt, tags, published</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
