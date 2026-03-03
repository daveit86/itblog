'use client'

import { useState } from "react"

interface CommentFormProps {
  articleId: string
  parentId?: string
  onSuccess?: () => void
  onCancel?: () => void
  isReply?: boolean
}

export default function CommentForm({ 
  articleId, 
  parentId,
  onSuccess,
  onCancel,
  isReply = false 
}: CommentFormProps) {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState("")

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('submitting')
    
    const formData = new FormData(e.currentTarget)
    formData.append("articleId", articleId)
    if (parentId) {
      formData.append("parentId", parentId)
    }

    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        body: formData,
      })

      if (res.ok) {
        setStatus('success')
        setMessage(isReply ? "Reply submitted!" : "Comment submitted! It will appear after moderation.")
        ;(e.target as HTMLFormElement).reset()
        onSuccess?.()
      } else {
        const data = await res.json()
        setStatus('error')
        setMessage(data.error || "Failed to submit comment")
      }
    } catch {
      setStatus('error')
      setMessage("Failed to submit comment")
    }
  }

  return (
    <div className={`bg-muted rounded-lg p-6 ${isReply ? 'mb-4' : 'mb-8'}`}>
      <h3 className="text-lg font-semibold text-foreground mb-4">
        {isReply ? 'Write a Reply' : 'Leave a Comment'}
      </h3>
      
      {status === 'success' && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-500 px-4 py-3 rounded mb-4">
          {message}
        </div>
      )}
      
      {status === 'error' && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded mb-4">
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="authorName" className="block text-sm font-medium text-foreground mb-1">
            Name *
          </label>
          <input
            type="text"
            name="authorName"
            id="authorName"
            required
            className="w-full rounded-md border border-border bg-card px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label htmlFor="authorEmail" className="block text-sm font-medium text-foreground mb-1">
            Email *
          </label>
          <input
            type="email"
            name="authorEmail"
            id="authorEmail"
            required
            className="w-full rounded-md border border-border bg-card px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <p className="mt-1 text-xs text-muted-foreground">Won't be published</p>
        </div>

        <div>
          <label htmlFor="content" className="block text-sm font-medium text-foreground mb-1">
            Comment *
          </label>
          <textarea
            name="content"
            id="content"
            required
            rows={4}
            className="w-full rounded-md border border-border bg-card px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={status === 'submitting'}
            className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-hover disabled:opacity-50 transition-colors font-medium"
          >
            {status === 'submitting' ? 'Submitting...' : isReply ? 'Submit Reply' : 'Submit Comment'}
          </button>
          {isReply && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-md border border-border text-foreground hover:bg-muted transition-colors font-medium"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
