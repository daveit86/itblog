'use client'

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import ReactMarkdown from "react-markdown"
import rehypeHighlight from "rehype-highlight"
import { format } from "date-fns"
import FileUpload from "@/components/FileUpload"
import MediaPicker from "@/components/MediaPicker"
import TranslationManager from "@/components/TranslationManager"

export default function EditArticleClient({
  article
}: {
  article: {
    id: string
    title: string
    slug: string
    tags: string | null
    excerpt: string | null
    content: string
    metaTitle: string | null
    metaDescription: string | null
    published: boolean
    language: string
    translationGroupId: string | null
  }
}) {
  const router = useRouter()
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'edit' | 'preview' | 'versions'>('edit')
  const [content, setContent] = useState(article.content)
  const [title, setTitle] = useState(article.title)
  const [slug, setSlug] = useState(article.slug)
  const [language, setLanguage] = useState(article.language)
  const [showMediaPicker, setShowMediaPicker] = useState(false)
  const [versions, setVersions] = useState<Array<{
    id: string
    version: number
    title: string
    createdAt: string
  }>>([])
  const [loadingVersions, setLoadingVersions] = useState(false)

  const handleFileUpload = (url: string) => {
    const imageMarkdown = `\n\n![Uploaded Image](${url})\n\n`
    setContent(prev => prev + imageMarkdown)
  }

  const handleMediaSelect = (url: string) => {
    const imageMarkdown = `\n\n![Image](${url})\n\n`
    setContent(prev => prev + imageMarkdown)
  }

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Auto-format slug: lowercase, replace spaces with hyphens, remove special chars
    const formattedSlug = value
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-_]/g, '')
    setSlug(formattedSlug)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const formData = new FormData(e.currentTarget)

    try {
      // Save current version before updating
      await fetch(`/api/articles/${article.id}/versions`, {
        method: "POST",
      })

      const res = await fetch(`/api/articles/${article.id}`, {
        method: "PUT",
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Failed to update article")
      } else {
        router.push("/admin")
        router.refresh()
      }
    } catch (err) {
      setError("An error occurred")
    } finally {
      setLoading(false)
    }
  }

  async function loadVersions() {
    setLoadingVersions(true)
    try {
      const res = await fetch(`/api/articles/${article.id}/versions`)
      const data = await res.json()
      if (data.versions) {
        setVersions(data.versions)
      }
    } catch (err) {
      console.error('Failed to load versions:', err)
    } finally {
      setLoadingVersions(false)
    }
  }

  async function restoreVersion(versionId: string) {
    if (!confirm("Are you sure you want to restore this version? Current content will be replaced.")) {
      return
    }
    
    setLoading(true)
    try {
      const res = await fetch(`/api/articles/${article.id}/versions/${versionId}/restore`, {
        method: "POST",
      })
      
      if (res.ok) {
        router.refresh()
        window.location.reload()
      } else {
        setError("Failed to restore version")
      }
    } catch (err) {
      setError("An error occurred")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'versions') {
      loadVersions()
    }
  }, [activeTab])

  async function handleDelete() {
    if (confirm("Are you sure you want to delete this article? This cannot be undone.")) {
      setLoading(true)
      try {
        const res = await fetch(`/api/articles/${article.id}?id=${article.id}`, {
          method: "DELETE",
        })

        if (res.ok) {
          router.push("/admin")
          router.refresh()
        } else {
          setError("Failed to delete article")
        }
      } catch (err) {
        setError("An error occurred")
      } finally {
        setLoading(false)
      }
    }
  }

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin" className="text-blue-600 hover:text-blue-800">
          ← Back to Articles
        </Link>
      </div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Edit Article</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            type="button"
            onClick={() => setActiveTab('edit')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'edit'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'preview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Preview
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('versions')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'versions'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Versions
          </button>
        </nav>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <input type="hidden" name="id" value={article.id} />

        {activeTab === 'edit' ? (
          <>
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Title
              </label>
              <input
                type="text"
                name="title"
                id="title"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="slug" className="block text-sm font-medium text-gray-700">
                  Slug (URL-friendly name)
                </label>
                <input
                  type="text"
                  name="slug"
                  id="slug"
                  required
                  value={slug}
                  onChange={handleSlugChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                />
              </div>

              <div>
                <label htmlFor="language" className="block text-sm font-medium text-gray-700">
                  Language
                </label>
                <select
                  name="language"
                  id="language"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
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
              <label htmlFor="tags" className="block text-sm font-medium text-gray-700">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                name="tags"
                id="tags"
                defaultValue={article.tags || ""}
                placeholder="DevOps, React, JavaScript"
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
                defaultValue={article.excerpt || ""}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
              />
            </div>

            {/* Translation Manager */}
            <TranslationManager 
              articleId={article.id} 
              currentLanguage={language} 
            />

            {/* Media Upload & Selection */}
            <div className="p-4 bg-muted rounded-md border border-border">
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

            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700">
                Content (Markdown supported)
              </label>
              <textarea
                name="content"
                id="content"
                required
                rows={15}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border font-mono text-sm"
              />
              <p className="mt-1 text-sm text-gray-500">
                Supports Markdown. Use ``` for code blocks.
              </p>
            </div>

            <div className="border-t pt-4">
              <h3 className="text-lg font-medium text-gray-800 mb-3">SEO Settings</h3>

              <div className="space-y-4">
                <div>
                  <label htmlFor="metaTitle" className="block text-sm font-medium text-gray-700">
                    Meta Title
                  </label>
                  <input
                    type="text"
                    name="metaTitle"
                    id="metaTitle"
                    defaultValue={article.metaTitle || ""}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                  />
                </div>

                <div>
                  <label htmlFor="metaDescription" className="block text-sm font-medium text-gray-700">
                    Meta Description
                  </label>
                  <textarea
                    name="metaDescription"
                    id="metaDescription"
                    rows={2}
                    defaultValue={article.metaDescription || ""}
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
                defaultChecked={article.published}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary bg-card"
              />
              <label htmlFor="published" className="ml-2 block text-sm text-foreground">
                Publish
              </label>
            </div>
          </>
        ) : activeTab === 'preview' ? (
          <div className="bg-card border border-border rounded-lg p-8 min-h-[500px]">
            <div className="mb-4 pb-4 border-b border-border">
              <h1 className="text-3xl font-bold text-foreground">{title}</h1>
            </div>
            <article className="prose prose-lg max-w-none dark:prose-invert">
              <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
                {content}
              </ReactMarkdown>
            </article>
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-foreground">Version History</h3>
            {loadingVersions ? (
              <p className="text-muted-foreground">Loading versions...</p>
            ) : versions.length === 0 ? (
              <p className="text-muted-foreground">No previous versions saved.</p>
            ) : (
              <div className="space-y-3">
                {versions.map((version) => (
                  <div key={version.id} className="border border-border rounded-lg p-4 flex justify-between items-center bg-card">
                    <div>
                      <p className="font-medium text-foreground">{version.title}</p>
                      <p className="text-sm text-muted-foreground">
                        Version {version.version} • {format(new Date(version.createdAt), 'MMM d, yyyy HH:mm')}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => restoreVersion(version.id)}
                      disabled={loading}
                      className="text-primary hover:text-primary-hover text-sm font-medium disabled:opacity-50"
                    >
                      Restore
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
          >
            {loading ? 'Updating...' : 'Update Article'}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="btn btn-danger"
          >
            Delete
          </button>
          <Link
            href="/admin"
            className="btn btn-secondary"
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
