'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { Header } from '@/components/Header'
import { getBookmarks, removeBookmark, Bookmark } from '@/lib/bookmarks'

export default function ReadingListPage() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setBookmarks(getBookmarks())
  }, [])

  const handleRemove = (slug: string) => {
    removeBookmark(slug)
    setBookmarks(getBookmarks())
  }

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-3xl font-bold text-foreground mb-6">Reading List</h1>
          <div className="animate-pulse">
            <div className="h-32 bg-muted rounded-lg mb-4"></div>
            <div className="h-32 bg-muted rounded-lg mb-4"></div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Reading List</h1>
          <p className="text-muted-foreground">
            Articles you have saved to read later
          </p>
        </div>

        {bookmarks.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">No saved articles</h2>
            <p className="text-muted-foreground mb-6">
              Articles you bookmark will appear here
            </p>
            <Link 
              href="/"
              className="btn btn-primary"
            >
              Browse Articles
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookmarks.map((bookmark) => (
              <div key={bookmark.slug} className="card p-6 article-card group">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <Link 
                      href={`/blog/${bookmark.slug}`}
                      className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors"
                    >
                      {bookmark.title}
                    </Link>
                    {bookmark.excerpt && (
                      <p className="mt-2 text-muted-foreground line-clamp-2">
                        {bookmark.excerpt}
                      </p>
                    )}
                    <p className="mt-3 text-sm text-muted-foreground">
                      Saved {format(new Date(bookmark.savedAt), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemove(bookmark.slug)}
                    className="ml-4 p-2 text-muted-foreground hover:text-error transition-colors"
                    title="Remove from reading list"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} IT Blog. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
