'use client'

import { publishArticle, unpublishArticle, deleteArticle } from "./actions"
import { showToast } from "@/lib/toast"

interface ArticleActionsProps {
  articleId: string
  isPublished: boolean
}

export default function ArticleActions({ articleId, isPublished }: ArticleActionsProps) {
  const handlePublish = async () => {
    const result = await publishArticle(articleId)
    if (result.error) {
      showToast.error(result.error)
    } else {
      showToast.success('Article published successfully')
      window.location.reload()
    }
  }

  const handleUnpublish = async () => {
    const result = await unpublishArticle(articleId)
    if (result.error) {
      showToast.error(result.error)
    } else {
      showToast.success('Article unpublished')
      window.location.reload()
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this article? This action cannot be undone.')) {
      return
    }
    const result = await deleteArticle(articleId)
    if (result.error) {
      showToast.error(result.error)
    } else {
      showToast.success('Article deleted successfully')
      window.location.reload()
    }
  }

  return (
    <div className="flex items-center gap-2">
      {isPublished ? (
        <button
          onClick={handleUnpublish}
          className="text-orange-600 hover:text-orange-800 text-sm"
        >
          Unpublish
        </button>
      ) : (
        <button
          onClick={handlePublish}
          className="text-green-600 hover:text-green-800 text-sm font-medium"
        >
          Publish
        </button>
      )}
      <button
        onClick={handleDelete}
        className="text-red-600 hover:text-red-800 text-sm"
        title="Delete"
      >
        Delete
      </button>
    </div>
  )
}
