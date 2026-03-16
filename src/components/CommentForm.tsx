'use client'

import { useState } from "react"
import toast from "react-hot-toast"

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
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)
    
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
        toast.success(data.message || "Comment submitted successfully! It will appear after moderation.", {
          duration: 4000,
          icon: '✅',
        })
        ;(e.target as HTMLFormElement).reset()
        onSuccess?.()
      } else {
        const errorMessage = data.error || "Failed to submit comment. Please try again."
        toast.error(errorMessage, {
          duration: 5000,
          icon: '❌',
        })
      }
    } catch {
      toast.error("Failed to submit comment. Please check your connection and try again.", {
        duration: 5000,
        icon: '❌',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={`bg-muted rounded-lg p-6 ${isReply ? 'mb-4' : 'mb-8'}`}>
      <h3 className="text-lg font-semibold text-foreground mb-4">
        {isReply ? 'Write a Reply' : 'Leave a Comment'}
      </h3>

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
            disabled={isSubmitting}
            className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-hover disabled:opacity-50 transition-colors font-medium"
          >
            {isSubmitting ? 'Submitting...' : isReply ? 'Submit Reply' : 'Submit Comment'}
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
