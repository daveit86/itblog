'use client'

import { useState, useEffect } from 'react'
import { MediaFile } from '@/app/admin/media/actions'

interface MediaPickerProps {
  onSelect: (url: string) => void
  onClose: () => void
}

export default function MediaPicker({ onSelect, onClose }: MediaPickerProps) {
  const [files, setFiles] = useState<MediaFile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFile, setSelectedFile] = useState<string | null>(null)

  useEffect(() => {
    fetchFiles()
  }, [])

  const fetchFiles = async () => {
    try {
      const res = await fetch('/api/admin/media')
      const data = await res.json()
      if (data.files) {
        setFiles(data.files)
      }
    } catch (error) {
      console.error('Failed to fetch media files:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredFiles = files.filter(file => 
    file.filename.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSelect = () => {
    if (selectedFile) {
      onSelect(selectedFile)
      onClose()
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

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-xl font-bold">Select Media</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-border">
          <input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input w-full"
          />
        </div>

        {/* File Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No media files found
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredFiles.map((file) => (
                <div
                  key={file.filename}
                  onClick={() => setSelectedFile(file.url)}
                  className={`relative cursor-pointer rounded-lg border-2 p-3 transition-all ${
                    selectedFile === file.url
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  {/* Preview */}
                  <div className="aspect-square rounded bg-muted flex items-center justify-center mb-2 overflow-hidden">
                    {file.type === 'image' ? (
                      <img
                        src={file.url}
                        alt={file.filename}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-4xl">{getFileIcon(file.type)}</span>
                    )}
                  </div>

                  {/* Info */}
                  <p className="text-xs truncate font-medium">{file.filename}</p>
                  <p className="text-xs text-muted-foreground">{file.sizeFormatted}</p>

                  {/* Selection Indicator */}
                  {selectedFile === file.url && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-primary text-white rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-border">
          <span className="text-sm text-muted-foreground">
            {filteredFiles.length} files
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
            <button
              onClick={handleSelect}
              disabled={!selectedFile}
              className="px-4 py-2 rounded-md text-sm font-medium bg-primary text-white hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Insert Selected
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
