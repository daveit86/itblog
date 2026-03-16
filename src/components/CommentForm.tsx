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

      const data = await res.json()

      if (res.ok) {
        setStatus('success')
        setMessage(data.message || "Comment submitted successfully! It will appear after moderation.")
        ;(e.target as HTMLFormElement).reset()
        onSuccess?.()
      } else {
        setStatus('error')
        setMessage(data.error || "Failed to submit comment. Please try again.")
      }
    } catch {
      setStatus('error')
      setMessage("Failed to submit comment. Please check your connection and try again.")
    }
  }

  return (
    <div className={`bg-muted rounded-lg p-6 ${isReply ? 'mb-4' : 'mb-8'}`}>
      <h3 className="text-lg font-semibold text-foreground mb-4">
        {isReply ? 'Write a Reply' : 'Leave a Comment'}
      </h3>
      
      {status === 'success' && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-600 px-4 py-3 rounded mb-4">
          <p className="font-medium">✓ {message}</p>
          <p className="text-sm mt-1 opacity-80">Thank you for your contribution!</p>
        </div>
      )}
      
      {status === 'error' && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-600 px-4 py-3 rounded mb-4">
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Honeypot field - invisible to humans, bots will fill it */}
        <div style={{ display: 'none' }} aria-hidden="true">
          <label htmlFor="website">Website</label>
          <input 
            type="text" 
            id="website" 
            name="honeypot" 
            tabIndex={-1} 
            autoComplete="off"
          />
        </div>

        <div>
          <label htmlFor="authorName" className="block text-sm font-medium text-foreground mb-1">
            Name <span className="text-muted-foreground font-normal">(optional)</span>
          </label>
          <input
            type="text"
            name="authorName"
            id="authorName"
            placeholder="Your name or leave blank for anonymous"
            className="w-full rounded-md border border-border bg-card px-3 py-2 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Leave blank to post anonymously
          </p>
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
            maxLength={5000}
            placeholder="Share your thoughts..."
            className="w-full rounded-md border border-border bg-card px-3 py-2 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Max 5000 characters. Comments are moderated before appearing.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
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

        <p className="text-xs text-muted-foreground pt-2">
          💡 <strong>Privacy note:</strong> We don't collect your email or any personal information. 
          All comments are moderated before publication.
        </p>
      </form>
    </div>
  )
}
