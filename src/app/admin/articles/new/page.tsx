'use client'

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useEffect, useCallback } from "react"
import ReactMarkdown from "react-markdown"
import rehypeHighlight from "rehype-highlight"
import FileUpload from "@/components/FileUpload"
import MediaPicker from "@/components/MediaPicker"
import NewArticleTranslationManager from "@/components/NewArticleTranslationManager"

interface DraftData {
  title: string
  slug: string
  tags: string
  excerpt: string
  content: string
  metaTitle: string
  metaDescription: string
  published: boolean
  language: string
  translationGroupId: string
  lastSaved: string
}

const DRAFT_KEY = 'article-draft-new'

export default function NewArticlePage() {
  const router = useRouter()
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [lastSaved, setLastSaved] = useState<string | null>(null)
  const [showMediaPicker, setShowMediaPicker] = useState(false)
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit')
  const [linkedArticleId, setLinkedArticleId] = useState('')
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    tags: '',
    excerpt: '',
    content: '',
    metaTitle: '',
    metaDescription: '',
    published: false,
    language: 'en',
    translationGroupId: '',
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
          language: draft.language || 'en',
          translationGroupId: draft.translationGroupId || '',
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
    } else if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked,
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
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
    if (linkedArticleId) {
      submitFormData.append('linkedArticleId', linkedArticleId)
    }
    
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
        <Link href="/admin" className="text-primary hover:text-primary-hover">
          ← Back to Articles
        </Link>
      </div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-foreground">New Article</h1>
        {lastSaved && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              Auto-saved at {formatLastSaved(lastSaved)}
            </span>
            <button
              type="button"
              onClick={clearDraft}
              className="text-sm text-error hover:text-error/80"
            >
              Clear Draft
            </button>
          </div>
        )}
      </div>
      
      {error && (
        <div className="bg-error/10 border border-error/20 text-error px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-border mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            type="button"
            onClick={() => setActiveTab('edit')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'edit'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            }`}
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'preview'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            }`}
          >
            Preview
          </button>
        </nav>
      </div>

      {activeTab === 'edit' ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-foreground">
              Title
            </label>
            <input
              type="text"
              name="title"
              id="title"
              required
              value={formData.title}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-border bg-card shadow-sm focus:border-primary focus:ring-primary p-2 border"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="slug" className="block text-sm font-medium text-foreground">
                Slug (URL-friendly name)
              </label>
              <input
                type="text"
                name="slug"
                id="slug"
                required
                value={formData.slug}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-border bg-card shadow-sm focus:border-primary focus:ring-primary p-2 border"
              />
            </div>

            <div>
              <label htmlFor="language" className="block text-sm font-medium text-foreground">
                Language
              </label>
              <select
                name="language"
                id="language"
                value={formData.language}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-border bg-card shadow-sm focus:border-primary focus:ring-primary p-2 border"
              >
                <option value="en">English</option>
                <option value="it">Italian</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="pt">Portuguese</option>
                <option value="ru">Russian</option>
                <option value="zh">Chinese</option>
                <option value="ja">Japanese</option>
                <option value="ko">Korean</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="tags" className="block text-sm font-medium text-foreground">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              name="tags"
              id="tags"
              placeholder="DevOps, React, JavaScript"
              value={formData.tags}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-border bg-card shadow-sm focus:border-primary focus:ring-primary p-2 border"
            />
          </div>

          <div>
            <label htmlFor="excerpt" className="block text-sm font-medium text-foreground">
              Excerpt (short description)
            </label>
            <textarea
              name="excerpt"
              id="excerpt"
              rows={2}
              value={formData.excerpt}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-border bg-card shadow-sm focus:border-primary focus:ring-primary p-2 border"
            />
          </div>

          {/* Translation Manager for linking to existing articles */}
          <NewArticleTranslationManager
            currentLanguage={formData.language}
            onLink={setLinkedArticleId}
          />

          <div>
            <label htmlFor="content" className="block text-sm font-medium text-foreground">
              Content (Markdown supported)
            </label>
            <textarea
              name="content"
              id="content"
              required
              rows={15}
              value={formData.content}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-border bg-card shadow-sm focus:border-primary focus:ring-primary p-2 border font-mono text-sm"
            />
            <p className="mt-1 text-sm text-muted-foreground">
              Supports Markdown. Use ``` for code blocks.
            </p>
            
            {/* Media Upload & Selection */}
            <div className="mt-4 p-4 bg-muted rounded-md border border-border">
              <h4 className="text-sm font-medium text-foreground mb-3">Add Media</h4>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <FileUpload onUpload={handleFileUpload} />
                </div>
                <div className="flex items-center justify-center">
                  <span className="text-sm text-muted-foreground">or</span>
                </div>
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => setShowMediaPicker(true)}
                    className="w-full sm:w-auto px-4 py-2 bg-card text-foreground border border-border rounded-md hover:bg-muted text-sm font-medium"
                  >
                    Choose from Library
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <h3 className="text-lg font-medium text-foreground mb-3">SEO Settings</h3>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="metaTitle" className="block text-sm font-medium text-foreground">
                  Meta Title (optional, defaults to article title)
                </label>
                <input
                  type="text"
                  name="metaTitle"
                  id="metaTitle"
                  value={formData.metaTitle}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-border bg-card shadow-sm focus:border-primary focus:ring-primary p-2 border"
                />
              </div>

              <div>
                <label htmlFor="metaDescription" className="block text-sm font-medium text-foreground">
                  Meta Description (for search engines)
                </label>
                <textarea
                  name="metaDescription"
                  id="metaDescription"
                  rows={2}
                  value={formData.metaDescription}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-border bg-card shadow-sm focus:border-primary focus:ring-primary p-2 border"
                />
              </div>
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="published"
              id="published"
              checked={formData.published}
              onChange={handleChange}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary bg-card"
            />
            <span className="text-sm text-foreground">Publish immediately</span>
          </label>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? 'Creating...' : 'Create Article'}
            </button>
            <Link
              href="/admin"
              className="btn btn-secondary"
            >
              Cancel
            </Link>
          </div>
        </form>
      ) : (
        <div className="bg-card border border-border rounded-lg p-8 min-h-[500px]">
          <div className="mb-4 pb-4 border-b border-border">
            <h1 className="text-3xl font-bold text-foreground">{formData.title || 'Untitled'}</h1>
          </div>
          <article className="prose prose-lg max-w-none dark:prose-invert">
            <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
              {formData.content || '*No content yet*'}
            </ReactMarkdown>
          </article>
        </div>
      )}

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
