'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { MediaFile, deleteMediaFile, bulkDeleteMediaFiles } from './actions'
import FileUpload from '@/components/FileUpload'
import { showToast } from '@/lib/toast'

interface MediaClientProps {
  files: MediaFile[]
  stats: {
    totalFiles: number
    totalSizeFormatted: string
    usedFiles: number
    unusedFiles: number
  }
}

export default function MediaClient({ files, stats }: MediaClientProps) {
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
  const [filter, setFilter] = useState<'all' | 'used' | 'unused'>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredFiles = files.filter(file => {
    // Usage filter
    if (filter === 'used' && !file.isUsed) return false
    if (filter === 'unused' && file.isUsed) return false
    
    // Type filter
    if (typeFilter !== 'all' && file.type !== typeFilter) return false
    
    // Search filter
    if (searchQuery && !file.filename.toLowerCase().includes(searchQuery.toLowerCase())) return false
    
    return true
  })

  const toggleSelection = (filename: string) => {
    const newSelected = new Set(selectedFiles)
    if (newSelected.has(filename)) {
      newSelected.delete(filename)
    } else {
      newSelected.add(filename)
    }
    setSelectedFiles(newSelected)
  }

  const toggleAll = () => {
    if (selectedFiles.size === filteredFiles.length) {
      setSelectedFiles(new Set())
    } else {
      setSelectedFiles(new Set(filteredFiles.map(f => f.filename)))
    }
  }

  const handleDelete = async (filename: string) => {
    if (!confirm(`Are you sure you want to delete "${filename}"?`)) return
    
    const result = await deleteMediaFile(filename)
    if (result.error) {
      showToast.error(result.error)
    } else {
      showToast.success(`"${filename}" deleted successfully`)
      window.location.reload()
    }
  }

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedFiles.size} files?`)) return
    
    const result = await bulkDeleteMediaFiles(Array.from(selectedFiles))
    if (result.error) {
      showToast.error(result.error)
    } else {
      showToast.success(`Successfully deleted ${result.success} files`)
      window.location.reload()
    }
  }

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image': return '🖼️'
      case 'document': return '📄'
      case 'video': return '🎬'
      case 'audio': return '🎵'
      default: return '📎'
    }
  }

  const handleUploadComplete = (url: string) => {
    // Refresh the page to show the new upload
    window.location.reload()
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Media Library</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage uploaded files and images
          </p>
        </div>
      </div>

      {/* Upload Section */}
      <div className="card p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Upload New File</h2>
        <FileUpload onUpload={handleUploadComplete} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="card p-4">
          <p className="text-sm text-muted-foreground">Total Files</p>
          <p className="text-2xl font-bold text-foreground">{stats.totalFiles}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-muted-foreground">Storage Used</p>
          <p className="text-2xl font-bold text-foreground">{stats.totalSizeFormatted}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-muted-foreground">In Use</p>
          <p className="text-2xl font-bold text-success">{stats.usedFiles}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-muted-foreground">Unused</p>
          <p className="text-2xl font-bold text-warning">{stats.unusedFiles}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input flex-1"
          />
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value as 'all' | 'used' | 'unused')}
            className="input w-full sm:w-auto"
          >
            <option value="all">All Files</option>
            <option value="used">Used in Articles</option>
            <option value="unused">Unused</option>
          </select>
          <select 
            value={typeFilter} 
            onChange={(e) => setTypeFilter(e.target.value)}
            className="input w-full sm:w-auto"
          >
            <option value="all">All Types</option>
            <option value="image">Images</option>
            <option value="document">Documents</option>
            <option value="video">Videos</option>
            <option value="audio">Audio</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedFiles.size > 0 && (
        <div className="card p-4 bg-primary/5 border-primary/20 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <span className="text-sm font-medium text-foreground">
              {selectedFiles.size} file{selectedFiles.size !== 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleBulkDelete}
                className="px-3 py-2 rounded-md text-sm font-medium bg-error text-white hover:bg-error/90 transition-colors"
              >
                Delete Selected
              </button>
              <button
                onClick={() => setSelectedFiles(new Set())}
                className="px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Files Grid */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedFiles.size === filteredFiles.length && filteredFiles.length > 0}
                    onChange={toggleAll}
                    className="rounded border-border"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Preview</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Filename</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Size</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Uploaded</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {filteredFiles.map((file) => (
                <tr key={file.filename} className="hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedFiles.has(file.filename)}
                      onChange={() => toggleSelection(file.filename)}
                      className="rounded border-border"
                    />
                  </td>
                  <td className="px-4 py-3">
                    {file.type === 'image' ? (
                      <div className="relative w-12 h-12 rounded overflow-hidden bg-muted">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                          src={file.url} 
                          alt={file.filename}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded bg-muted flex items-center justify-center text-2xl">
                        {getFileIcon(file.type)}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-foreground truncate max-w-[200px]">
                        {file.filename}
                      </span>
                      <code className="text-xs text-muted-foreground">{file.url}</code>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap hidden sm:table-cell">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground capitalize">
                      {getFileIcon(file.type)} {file.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-muted-foreground hidden md:table-cell">
                    {file.sizeFormatted}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap hidden md:table-cell">
                    {file.isUsed ? (
                      <span className="inline-flex items-center gap-1 text-xs text-success">
                        <span className="w-1.5 h-1.5 rounded-full bg-success" />
                        In use
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-warning">
                        <span className="w-1.5 h-1.5 rounded-full bg-warning" />
                        Unused
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-muted-foreground hidden lg:table-cell">
                    {format(file.createdAt, 'MMM d, yyyy')}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary-hover text-sm"
                      >
                        View
                      </a>
                      <button
                        onClick={() => handleDelete(file.filename)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredFiles.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-muted flex items-center justify-center">
                      <svg className="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-muted-foreground">
                      {files.length === 0 ? 'No uploads yet.' : 'No files match your filters.'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
