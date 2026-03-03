'use client'

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useEffect, useCallback } from "react"
import FileUpload from "@/components/FileUpload"
import MediaPicker from "@/components/MediaPicker"

interface DraftData {
  title: string
  slug: string
  tags: string
  excerpt: string
  content: string
  metaTitle: string
  metaDescription: string
  published: boolean
  lastSaved: string
}

const DRAFT_KEY = 'article-draft-new'

export default function NewArticlePage() {
  const router = useRouter()
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [lastSaved, setLastSaved] = useState<string | null>(null)
  const [showMediaPicker, setShowMediaPicker] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    tags: '',
    excerpt: '',
    content: '',
    metaTitle: '',
    metaDescription: '',
    published: false,
  })

  // Load draft from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(DRAFT_KEY)
    if (saved) {
      try {
        const draft: DraftData = JSON.parse(saved)
        setFormData({
          title: draft.title || '',
          slug: draft.slug || '',
          tags: draft.tags || '',
          excerpt: draft.excerpt || '',
          content: draft.content || '',
          metaTitle: draft.metaTitle || '',
          metaDescription: draft.metaDescription || '',
          published: draft.published || false,
        })
        setLastSaved(draft.lastSaved)
      } catch (e) {
        console.error('Failed to load draft:', e)
      }
    }
  }, [])

  // Auto-save to localStorage every 30 seconds and on form changes
  const saveDraft = useCallback(() => {
    const draft: DraftData = {
      ...formData,
      lastSaved: new Date().toISOString(),
    }
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
    setLastSaved(draft.lastSaved)
  }, [formData])

  useEffect(() => {
    const interval = setInterval(saveDraft, 30000) // Auto-save every 30 seconds
    return () => clearInterval(interval)
  }, [saveDraft])

  // Save draft whenever form data changes
  useEffect(() => {
    const timeout = setTimeout(saveDraft, 1000) // Debounce for 1 second
    return () => clearTimeout(timeout)
  }, [formData, saveDraft])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    
    // Auto-format slug: lowercase, replace spaces with hyphens, remove special chars
    if (name === 'slug') {
      const formattedSlug = value
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-_]/g, '')
      setFormData(prev => ({
        ...prev,
        [name]: formattedSlug,
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
      }))
    }
  }

  const clearDraft = () => {
    localStorage.removeItem(DRAFT_KEY)
    setLastSaved(null)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError("")
    
    const submitFormData = new FormData()
    Object.entries(formData).forEach(([key, value]) => {
      submitFormData.append(key, value.toString())
    })
    
    try {
      const res = await fetch("/api/articles", {
        method: "POST",
        body: submitFormData,
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Failed to create article")
      } else {
        clearDraft() // Clear draft on successful save
        router.push("/admin")
        router.refresh()
      }
    } catch (err) {
      setError("An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const formatLastSaved = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const handleFileUpload = (url: string) => {
    const imageMarkdown = `\n\n![Uploaded Image](${url})\n\n`
    setFormData(prev => ({
      ...prev,
      content: prev.content + imageMarkdown
    }))
  }

  const handleMediaSelect = (url: string) => {
    const imageMarkdown = `\n\n![Image](${url})\n\n`
    setFormData(prev => ({
      ...prev,
      content: prev.content + imageMarkdown
    }))
  }

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin" className="text-blue-600 hover:text-blue-800">
          ← Back to Articles
        </Link>
      </div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">New Article</h1>
        {lastSaved && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">
              Auto-saved at {formatLastSaved(lastSaved)}
            </span>
            <button
              type="button"
              onClick={clearDraft}
              className="text-sm text-red-600 hover:text-red-800"
            >
              Clear Draft
            </button>
          </div>
        )}
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Title
          </label>
          <input
            type="text"
            name="title"
            id="title"
            required
            value={formData.title}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
          />
        </div>

        <div>
          <label htmlFor="slug" className="block text-sm font-medium text-gray-700">
            Slug (URL-friendly name)
          </label>
          <input
            type="text"
            name="slug"
            id="slug"
            required
            value={formData.slug}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
          />
        </div>

        <div>
          <label htmlFor="tags" className="block text-sm font-medium text-gray-700">
            Tags (comma-separated)
          </label>
          <input
            type="text"
            name="tags"
            id="tags"
            placeholder="DevOps, React, JavaScript"
            value={formData.tags}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
          />
        </div>

        <div>
          <label htmlFor="excerpt" className="block text-sm font-medium text-gray-700">
            Excerpt (short description)
          </label>
          <textarea
            name="excerpt"
            id="excerpt"
            rows={2}
            value={formData.excerpt}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
          />
        </div>

        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700">
            Content (Markdown supported)
          </label>
          <textarea
            name="content"
            id="content"
            required
            rows={15}
            value={formData.content}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border font-mono text-sm"
          />
          <p className="mt-1 text-sm text-gray-500">
            Supports Markdown. Use ``` for code blocks.
          </p>
          
          {/* Media Upload & Selection */}
          <div className="mt-4 p-4 bg-gray-50 rounded-md border border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Add Media</h4>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <FileUpload onUpload={handleFileUpload} />
              </div>
              <div className="flex items-center justify-center">
                <span className="text-sm text-gray-500">or</span>
              </div>
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => setShowMediaPicker(true)}
                  className="w-full sm:w-auto px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 text-sm font-medium"
                >
                  Choose from Library
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t pt-4">
          <h3 className="text-lg font-medium text-gray-800 mb-3">SEO Settings</h3>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="metaTitle" className="block text-sm font-medium text-gray-700">
                Meta Title (optional, defaults to article title)
              </label>
              <input
                type="text"
                name="metaTitle"
                id="metaTitle"
                value={formData.metaTitle}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
              />
            </div>

            <div>
              <label htmlFor="metaDescription" className="block text-sm font-medium text-gray-700">
                Meta Description (for search engines)
              </label>
              <textarea
                name="metaDescription"
                id="metaDescription"
                rows={2}
                value={formData.metaDescription}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            name="published"
            id="published"
            checked={formData.published}
            onChange={handleChange}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="published" className="ml-2 block text-sm text-gray-900">
            Publish immediately
          </label>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Article'}
          </button>
          <Link
            href="/admin"
            className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300"
          >
            Cancel
          </Link>
        </div>
      </form>

      {/* Media Picker Modal */}
      {showMediaPicker && (
        <MediaPicker
          onSelect={handleMediaSelect}
          onClose={() => setShowMediaPicker(false)}
        />
      )}
    </div>
  )
}
