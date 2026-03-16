'use client'

import { useState, useCallback } from "react"
import CommentForm from "./CommentForm"
import CommentList from "./CommentList"

type Comment = {
  id: string
  authorName: string | null
  authorEmail: string | null
  content: string
  createdAt: Date
  likes: number
  parentId: string | null
  replies?: Comment[]
}

interface CommentsSectionProps {
  articleId: string
  initialComments: Comment[]
}

export default function CommentsSection({ articleId, initialComments }: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Fetch fresh comments from API
  const refreshComments = useCallback(async () => {
    setIsRefreshing(true)
    try {
      const res = await fetch(`/api/comments?articleId=${articleId}`)
      if (res.ok) {
        const data = await res.json()
        setComments(data)
      }
    } catch (error) {
      console.error('Failed to refresh comments:', error)
    } finally {
      setIsRefreshing(false)
    }
  }, [articleId])

  const handleReply = (commentId: string) => {
    setReplyingTo(commentId)
  }

  const handleReplySuccess = async () => {
    setReplyingTo(null)
    // Wait 2 seconds so user can see the success message
    setTimeout(() => {
      refreshComments()
    }, 2000)
  }

  return (
    <section className="mt-16 pt-8 border-t border-border">
      <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
        <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        Comments
        <span className="text-sm font-normal text-muted-foreground">
          ({comments.length})
        </span>
        {isRefreshing && (
          <span className="ml-2 text-sm text-muted-foreground animate-pulse">
            Refreshing...
          </span>
        )}
      </h2>

      {!replyingTo && <CommentForm articleId={articleId} />}

      {replyingTo && (
        <div className="mb-6">
          <CommentForm 
            articleId={articleId} 
            parentId={replyingTo}
            isReply
            onSuccess={handleReplySuccess}
            onCancel={() => setReplyingTo(null)}
          />
        </div>
      )}

      <CommentList 
        comments={comments} 
        onReply={handleReply}
      />
    </section>
  )
}
