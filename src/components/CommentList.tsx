'use client'

import { useState } from 'react'
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

  const handleLike = async () => {
    if (isLiked) return
    
    try {
      const res = await fetch(`/api/comments/${comment.id}/like`, { method: 'POST' })
      if (res.ok) {
        setLikeCount(prev => prev + 1)
        setIsLiked(true)
        onLike?.(comment.id)
      }
    } catch (error) {
      console.error('Failed to like comment:', error)
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
        
        <div className="mt-3 flex items-center gap-4">
          <button
            onClick={handleLike}
            disabled={isLiked}
            className={`flex items-center gap-1.5 text-sm transition-colors ${
              isLiked 
                ? 'text-primary' 
                : 'text-muted-foreground hover:text-primary'
            }`}
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
