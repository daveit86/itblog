'use client'

import { approveComment, disapproveComment, deleteComment } from "./actions"
import { showToast } from "@/lib/toast"

interface CommentActionsProps {
  commentId: string
  isApproved?: boolean
}

export default function CommentActions({ commentId, isApproved = false }: CommentActionsProps) {
  const handleApprove = async () => {
    const result = await approveComment(commentId)
    if (result.error) {
      showToast.error(result.error)
    } else {
      showToast.success('Comment approved')
      window.location.reload()
    }
  }

  const handleDisapprove = async () => {
    const result = await disapproveComment(commentId)
    if (result.error) {
      showToast.error(result.error)
    } else {
      showToast.success('Comment disapproved')
      window.location.reload()
    }
  }

  const handleDelete = async () => {
    if (!confirm('Delete this comment?')) {
      return
    }
    const result = await deleteComment(commentId)
    if (result.error) {
      showToast.error(result.error)
    } else {
      showToast.success('Comment deleted')
      window.location.reload()
    }
  }

  return (
    <div className="flex items-center gap-1">
      {!isApproved ? (
        <button
          onClick={handleApprove}
          className="bg-green-600/90 text-white px-2 py-0.5 rounded text-xs font-medium hover:bg-green-700 transition-colors"
          title="Approve"
        >
          ✓
        </button>
      ) : (
        <button
          onClick={handleDisapprove}
          className="bg-yellow-600/90 text-white px-2 py-0.5 rounded text-xs font-medium hover:bg-yellow-700 transition-colors"
          title="Disapprove"
        >
          ✕
        </button>
      )}
      <button
        onClick={handleDelete}
        className="bg-red-600/90 text-white px-2 py-0.5 rounded text-xs font-medium hover:bg-red-700 transition-colors"
        title="Delete"
      >
        🗑
      </button>
    </div>
  )
}
