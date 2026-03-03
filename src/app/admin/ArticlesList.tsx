'use client'

import { useState } from "react"
import Link from "next/link"
import { format } from "date-fns"
import ArticleActions from "./articles/ArticleActions"

interface Article {
  id: string
  title: string
  slug: string
  published: boolean
  createdAt: Date
  _count: {
    comments: number
  }
}

interface ArticlesListProps {
  articles: Article[]
}

export default function ArticlesList({ articles }: ArticlesListProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [processing, setProcessing] = useState(false)

  const publishedCount = articles.filter(a => a.published).length
  const draftCount = articles.length - publishedCount

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const toggleAll = () => {
    if (selectedIds.size === articles.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(articles.map(a => a.id)))
    }
  }

  const handleBulkAction = async (action: 'publish' | 'unpublish' | 'delete') => {
    if (selectedIds.size === 0) return
    
    const confirmMsg = action === 'delete' 
      ? `Are you sure you want to delete ${selectedIds.size} articles? This cannot be undone.`
      : `Are you sure you want to ${action} ${selectedIds.size} articles?`
    
    if (!confirm(confirmMsg)) return

    setProcessing(true)
    try {
      const res = await fetch('/api/admin/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          ids: Array.from(selectedIds),
        }),
      })

      const data = await res.json()

      if (res.ok) {
        window.location.reload()
      } else {
        alert('Bulk action failed: ' + (data.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Bulk action error:', error)
      alert('Bulk action failed')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Articles</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your blog posts and content
          </p>
        </div>
        <Link
          href="/admin/articles/new"
          className="btn btn-primary inline-flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Article
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="card p-4">
          <p className="text-sm text-muted-foreground">Total Articles</p>
          <p className="text-2xl font-bold text-foreground">{articles.length}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-muted-foreground">Published</p>
          <p className="text-2xl font-bold text-success">{publishedCount}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-muted-foreground">Drafts</p>
          <p className="text-2xl font-bold text-warning">{draftCount}</p>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="card p-4 bg-primary/5 border-primary/20">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <span className="text-sm font-medium text-foreground">
              {selectedIds.size} article{selectedIds.size !== 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleBulkAction('publish')}
                disabled={processing}
                className="btn btn-secondary text-sm"
              >
                Publish
              </button>
              <button
                onClick={() => handleBulkAction('unpublish')}
                disabled={processing}
                className="btn btn-secondary text-sm"
              >
                Unpublish
              </button>
              <button
                onClick={() => handleBulkAction('delete')}
                disabled={processing}
                className="px-3 py-2 rounded-md text-sm font-medium bg-error text-white hover:bg-error/90 disabled:opacity-50 transition-colors"
              >
                Delete
              </button>
              <button
                onClick={() => setSelectedIds(new Set())}
                disabled={processing}
                className="px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === articles.length && articles.length > 0}
                    onChange={toggleAll}
                    className="rounded border-border"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Article</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Comments</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Date</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {articles.map((article) => (
                <tr key={article.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(article.id)}
                      onChange={() => toggleSelection(article.id)}
                      className="rounded border-border"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-foreground">{article.title}</span>
                      <span className="text-xs text-muted-foreground">/blog/{article.slug}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      article.published 
                        ? 'bg-success/10 text-success border border-success/20' 
                        : 'bg-warning/10 text-warning border border-warning/20'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${article.published ? 'bg-success' : 'bg-warning'}`} />
                      {article.published ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground hidden sm:table-cell">
                    <div className="flex items-center gap-1.5">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      {article._count.comments}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground hidden md:table-cell">
                    {format(article.createdAt, 'MMM d, yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center gap-3">
                      <Link 
                        href={`/admin/articles/${article.id}/edit`} 
                        className="text-primary hover:text-primary-hover font-medium"
                      >
                        Edit
                      </Link>
                      <Link 
                        href={`/blog/${article.slug}`} 
                        className="text-muted-foreground hover:text-foreground"
                      >
                        View
                      </Link>
                      <ArticleActions articleId={article.id} isPublished={article.published} />
                    </div>
                  </td>
                </tr>
              ))}
              {articles.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-muted flex items-center justify-center">
                      <svg className="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <p className="text-muted-foreground">No articles yet. Create your first article!</p>
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
