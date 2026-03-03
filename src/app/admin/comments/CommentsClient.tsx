'use client'

import Link from "next/link"
import { format } from "date-fns"
import { useState } from "react"
import CommentActions from "./CommentActions"
import BulkCommentActions from "./BulkCommentActions"

interface Comment {
  id: string
  authorName: string
  authorEmail: string
  content: string
  approved: boolean
  createdAt: Date
  article: {
    title: string
    slug: string
  }
}

interface CommentsClientProps {
  pendingComments: Comment[]
  approvedComments: Comment[]
}

export default function CommentsClient({ pendingComments, approvedComments }: CommentsClientProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id)
        : [...prev, id]
    )
  }

  const toggleAll = (comments: Comment[]) => {
    const allIds = comments.map(c => c.id)
    const allSelected = allIds.every(id => selectedIds.includes(id))
    
    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !allIds.includes(id)))
    } else {
      setSelectedIds(prev => [...new Set([...prev, ...allIds])])
    }
  }

  const clearSelection = () => setSelectedIds([])

  const truncateContent = (content: string, maxLength: number = 120) => {
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength) + '...'
  }

  const CommentRow = ({ comment, isPending }: { comment: Comment; isPending: boolean }) => {
    const isExpanded = expandedId === comment.id
    const shouldTruncate = comment.content.length > 120
    
    return (
      <div className={`group border-b border-border last:border-0 hover:bg-muted/30 transition-colors ${isPending ? 'bg-warning/5' : ''}`}>
        <div className="flex items-start gap-3 p-3">
          {/* Checkbox */}
          <div className="flex-shrink-0 pt-0.5">
            <input
              type="checkbox"
              checked={selectedIds.includes(comment.id)}
              onChange={() => toggleSelection(comment.id)}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
            />
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header row: Author + Article + Date + Actions */}
            <div className="flex items-center justify-between gap-4 mb-1.5">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {/* Author */}
                <span className="font-medium text-foreground text-sm truncate">
                  {comment.authorName}
                </span>
                
                {/* Article link */}
                <Link 
                  href={`/blog/${comment.article.slug}`} 
                  className="text-xs text-primary hover:underline truncate max-w-[200px]"
                  title={comment.article.title}
                >
                  on: {comment.article.title}
                </Link>
                
                {/* Date */}
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {format(comment.createdAt, 'MMM d')}
                </span>
              </div>
              
              {/* Actions */}
              <div className="flex-shrink-0">
                <CommentActions commentId={comment.id} isApproved={!isPending} />
              </div>
            </div>
            
            {/* Content */}
            <div className="text-sm text-foreground/90 leading-relaxed">
              {shouldTruncate && !isExpanded ? (
                <>
                  {truncateContent(comment.content)}
                  <button 
                    onClick={() => setExpandedId(comment.id)}
                    className="text-primary hover:underline ml-1 text-xs"
                  >
                    show more
                  </button>
                </>
              ) : (
                <>
                  <span className="whitespace-pre-wrap">{comment.content}</span>
                  {shouldTruncate && (
                    <button 
                      onClick={() => setExpandedId(null)}
                      className="text-primary hover:underline ml-1 text-xs"
                    >
                      show less
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const CommentsSection = ({ 
    title, 
    comments, 
    isPending 
  }: { 
    title: string
    comments: Comment[]
    isPending: boolean
  }) => (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-3 px-1">
        <h2 className="text-lg font-semibold text-foreground">
          {title} <span className="text-muted-foreground font-normal">({comments.length})</span>
        </h2>
        {comments.length > 0 && (
          <button
            onClick={() => toggleAll(comments)}
            className="text-xs text-primary hover:text-primary-hover font-medium"
          >
            {comments.every(c => selectedIds.includes(c.id)) ? 'Deselect All' : 'Select All'}
          </button>
        )}
      </div>
      
      {comments.length === 0 ? (
        <p className="text-muted-foreground text-sm px-1">No comments.</p>
      ) : (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          {comments.map((comment) => (
            <CommentRow key={comment.id} comment={comment} isPending={isPending} />
          ))}
        </div>
      )}
    </div>
  )

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-foreground">Comments Moderation</h1>
        <Link
          href="/admin"
          className="text-sm text-primary hover:text-primary-hover"
        >
          ← Back to Articles
        </Link>
      </div>

      <CommentsSection 
        title="Pending"
        comments={pendingComments}
        isPending={true}
      />

      <CommentsSection 
        title="Approved"
        comments={approvedComments}
        isPending={false}
      />

      <BulkCommentActions 
        selectedIds={selectedIds} 
        onClearSelection={clearSelection} 
      />
    </div>
  )
}
