'use client'

import { useState, useEffect } from 'react'
import { format } from "date-fns"
import DOMPurify from 'isomorphic-dompurify'

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

function CommentItem({ 
  comment, 
  depth = 0,
  onReply,
  onLike 
}: { 
  comment: Comment
  depth?: number
  onReply?: (parentId: string) => void
  onLike?: (commentId: string) => void
}) {
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(comment.likes || 0)
  const [error, setError] = useState<string | null>(null)

  // Check if user has already liked this comment
  useEffect(() => {
    const checkLikeStatus = async () => {
      try {
        const res = await fetch(`/api/comments/${comment.id}/like`)
        if (res.ok) {
          const data = await res.json()
          setIsLiked(data.hasLiked)
          setLikeCount(data.likes)
        }
      } catch {
        // Silently fail - not critical
      }
    }
    checkLikeStatus()
  }, [comment.id])

  const handleLike = async () => {
    if (isLiked) {
      setError("You have already liked this comment")
      setTimeout(() => setError(null), 3000)
      return
    }
    
    setError(null)
    
    try {
      const res = await fetch(`/api/comments/${comment.id}/like`, { method: 'POST' })
      const data = await res.json()
      
      if (res.ok) {
        setLikeCount(data.likes)
        setIsLiked(true)
        onLike?.(comment.id)
      } else {
        // Handle errors
        if (res.status === 429) {
          setError("Rate limit exceeded. Please slow down.")
        } else if (data.error) {
          setError(data.error)
        } else {
          setError("Failed to like comment")
        }
        setTimeout(() => setError(null), 5000)
      }
    } catch {
      setError("Failed to like comment. Please try again.")
      setTimeout(() => setError(null), 5000)
    }
  }

  return (
    <div className={`${depth > 0 ? 'ml-8 border-l-2 border-border pl-4' : ''}`}>
      <div className="border border-border rounded-lg p-4 bg-card">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary-hover/20 flex items-center justify-center text-sm font-semibold text-primary">
              {(comment.authorName || 'A').charAt(0).toUpperCase()}
            </div>
            <div>
              <span className="font-semibold text-foreground">{comment.authorName || 'Anonymous'}</span>
              <span className="text-muted-foreground mx-2">·</span>
              <span className="text-sm text-muted-foreground">
                {format(new Date(comment.createdAt), 'MMM d, yyyy')}
              </span>
            </div>
          </div>
        </div>
        
        <p className="mt-3 text-foreground/80 whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(comment.content) }} />
        
        {/* Error message */}
        {error && (
          <div className="mt-2 text-sm text-red-500 bg-red-500/10 px-3 py-1 rounded">
            {error}
          </div>
        )}
        
        <div className="mt-3 flex items-center gap-4">
          <button
            onClick={handleLike}
            disabled={isLiked}
            className={`flex items-center gap-1.5 text-sm transition-colors ${
              isLiked 
                ? 'text-primary' 
                : 'text-muted-foreground hover:text-primary'
            }`}
            title={isLiked ? "You have already liked this comment" : "Like this comment"}
          >
            <svg className="w-4 h-4" fill={isLiked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            {likeCount}
          </button>
          
          {depth === 0 && (
            <button
              onClick={() => onReply?.(comment.id)}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
              Reply
            </button>
          )}
        </div>
      </div>
      
      {/* Render replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-4 space-y-4">
          {comment.replies.map(reply => (
            <CommentItem
              key={reply.id}
              comment={reply}
              depth={depth + 1}
              onReply={onReply}
              onLike={onLike}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function CommentList({ 
  comments,
  onReply 
}: { 
  comments: Comment[]
  onReply?: (parentId: string) => void
}) {
  // Organize comments into parent-child structure
  const organizedComments = comments.reduce((acc, comment) => {
    if (!comment.parentId) {
      acc.push({
        ...comment,
        replies: comments.filter(c => c.parentId === comment.id)
      })
    }
    return acc
  }, [] as Comment[])

  if (organizedComments.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-8">
        No comments yet. Be the first to comment!
      </p>
    )
  }

  return (
    <div className="space-y-6">
      {organizedComments.map((comment) => (
        <CommentItem 
          key={comment.id} 
          comment={comment}
          onReply={onReply}
        />
      ))}
    </div>
  )
}
