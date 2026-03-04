'use client'

import { useState, useMemo } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { calculateReadingTime } from "@/lib/utils"
import { Header } from "@/components/Header"

interface Article {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: string
  tags: string | null
  createdAt: Date
  _count: {
    comments: number
  }
}

export default function HomePage({ articles }: { articles: Article[] }) {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredArticles = useMemo(() => {
    if (!searchQuery.trim()) return articles
    
    const query = searchQuery.toLowerCase()
    return articles.filter(article => {
      const titleMatch = article.title.toLowerCase().includes(query)
      const contentMatch = article.content.toLowerCase().includes(query)
      const excerptMatch = article.excerpt?.toLowerCase().includes(query) || false
      const tagsMatch = article.tags?.toLowerCase().includes(query) || false
      return titleMatch || contentMatch || excerptMatch || tagsMatch
    })
  }, [articles, searchQuery])

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16 animate-fade-in">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
            <span className="bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
              Welcome to IT Blog
            </span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Explore articles about software development, DevOps, system administration, and technology.
          </p>
          
          {/* Stats */}
          <div className="flex justify-center gap-8 mt-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-foreground">{articles.length}</span>
              <span>articles</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-foreground">
                {articles.reduce((acc, a) => acc + (a._count.comments || 0), 0)}
              </span>
              <span>comments</span>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-12">
          <div className="relative max-w-xl mx-auto">
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-12 pr-10 py-3 bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              style={{ textIndent: '0' }}
            />
            {/* Search Icon */}
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <svg
                className="h-5 w-5 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-muted-foreground hover:text-foreground"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          {searchQuery && (
            <p className="text-center mt-3 text-sm text-muted-foreground">
              Found <span className="font-medium text-foreground">{filteredArticles.length}</span> {filteredArticles.length === 1 ? 'article' : 'articles'}
            </p>
          )}
        </div>

        {/* Articles Grid */}
        {filteredArticles.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              {searchQuery ? 'No articles found' : 'No articles yet'}
            </h2>
            <p className="text-muted-foreground">
              {searchQuery ? 'Try adjusting your search terms' : 'Check back soon for new content'}
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredArticles.map((article, index) => (
              <article 
                key={article.id} 
                className="group card article-card p-6 sm:p-8 animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <Link href={`/blog/${article.slug}`} className="block">
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground group-hover:text-primary transition-colors mb-3">
                    {article.title}
                  </h2>
                </Link>
                
                {/* Meta */}
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-4">
                  <time dateTime={article.createdAt.toISOString()} className="flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {format(article.createdAt, 'MMM d, yyyy')}
                  </time>
                  <span className="text-border">·</span>
                  <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {calculateReadingTime(article.content)} min read
                  </span>
                  {article._count.comments > 0 && (
                    <>
                      <span className="text-border">·</span>
                      <span className="flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        {article._count.comments}
                      </span>
                    </>
                  )}
                </div>

                {/* Tags */}
                {article.tags && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {article.tags.split(',').slice(0, 4).map(tag => (
                      <span 
                        key={tag} 
                        className="badge badge-primary"
                      >
                        {tag.trim()}
                      </span>
                    ))}
                  </div>
                )}

                {/* Excerpt */}
                {article.excerpt && (
                  <p className="text-muted-foreground leading-relaxed mb-4 line-clamp-2">
                    {article.excerpt}
                  </p>
                )}

                {/* Read More */}
                <Link 
                  href={`/blog/${article.slug}`}
                  className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary-hover transition-colors group/link"
                >
                  Read article
                  <svg 
                    className="w-4 h-4 transition-transform group-hover/link:translate-x-1" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </article>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} IT Blog. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <Link href="/feed.xml" className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6.503 20.752c0 1.794-1.456 3.248-3.251 3.248-1.796 0-3.252-1.454-3.252-3.248 0-1.794 1.456-3.248 3.252-3.248 1.795.001 3.251 1.454 3.251 3.248zm-6.503-12.572v4.811c6.05.062 10.96 4.966 11.022 11.009h4.817c-.062-8.71-7.118-15.758-15.839-15.82zm0-3.368c10.58.046 19.152 8.594 19.183 19.188h4.817c-.03-13.231-10.739-23.954-24-24v4.812z"/>
                </svg>
                RSS Feed
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
