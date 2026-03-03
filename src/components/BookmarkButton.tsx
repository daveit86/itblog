'use client'

import { useState, useEffect } from 'react'
import { isBookmarked, saveBookmark, removeBookmark } from '@/lib/bookmarks'

interface BookmarkButtonProps {
  article: {
    slug: string
    title: string
    excerpt: string | null
  }
}

export default function BookmarkButton({ article }: BookmarkButtonProps) {
  const [bookmarked, setBookmarked] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setBookmarked(isBookmarked(article.slug))
  }, [article.slug])

  const toggleBookmark = () => {
    if (bookmarked) {
      removeBookmark(article.slug)
      setBookmarked(false)
    } else {
      saveBookmark(article)
      setBookmarked(true)
    }
  }

  if (!mounted) {
    return (
      <button className="p-2 rounded-md text-muted-foreground hover:text-foreground transition-colors">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
      </button>
    )
  }

  return (
    <button
      onClick={toggleBookmark}
      className={`p-2 rounded-md transition-colors ${
        bookmarked 
          ? 'text-primary hover:text-primary-hover' 
          : 'text-muted-foreground hover:text-foreground'
      }`}
      title={bookmarked ? 'Remove from reading list' : 'Save to reading list'}
    >
      <svg 
        className="w-5 h-5" 
        fill={bookmarked ? "currentColor" : "none"} 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
      </svg>
    </button>
  )
}
