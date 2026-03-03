'use client'

import { useState } from "react"
import CommentForm from "./CommentForm"
import CommentList from "./CommentList"

type Comment = {
  id: string
  authorName: string
  authorEmail: string
  content: string
  createdAt: Date
  likes: number
  parentId: string | null
}

interface CommentsSectionProps {
  articleId: string
  comments: Comment[]
}

export default function CommentsSection({ articleId, comments }: CommentsSectionProps) {
  const [replyingTo, setReplyingTo] = useState<string | null>(null)

  const handleReply = (commentId: string) => {
    setReplyingTo(commentId)
  }

  const handleReplySuccess = () => {
    setReplyingTo(null)
    // Refresh the page to show the new reply
    window.location.reload()
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
