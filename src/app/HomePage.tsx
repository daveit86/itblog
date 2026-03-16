'use client'

import { useState, useEffect, useCallback } from "react"
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
  language: string
  createdAt: Date
  _count: {
    comments: number
  }
}

const languageNames: Record<string, string> = {
  en: 'English',
  it: 'Italian',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  pt: 'Portuguese',
  ru: 'Russian',
  zh: 'Chinese',
  ja: 'Japanese',
  ko: 'Korean'
}

const languageFlags: Record<string, string> = {
  en: '🇬🇧',
  it: '🇮🇹',
  es: '🇪🇸',
  fr: '🇫🇷',
  de: '🇩🇪',
  pt: '🇵🇹',
  ru: '🇷🇺',
  zh: '🇨🇳',
  ja: '🇯🇵',
  ko: '🇰🇷'
}

export default function HomePage({ articles: initialArticles }: { articles: Article[] }) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all')
  const [articles, setArticles] = useState<Article[]>(initialArticles)
  const [isSearching, setIsSearching] = useState(false)
  const [searchCount, setSearchCount] = useState(0)

  // Get unique languages from initial articles
  const availableLanguages = [...new Set(initialArticles.map(a => a.language))].sort()

  // Debounced search function
  const performSearch = useCallback(async (query: string, language: string) => {
    if (!query.trim()) {
      // If no search query, filter by language only
      let filtered = initialArticles
      if (language !== 'all') {
        filtered = initialArticles.filter(a => a.language === language)
      }
      setArticles(filtered)
      setSearchCount(filtered.length)
      return
    }

    setIsSearching(true)
    try {
      const params = new URLSearchParams()
      params.set('q', query)
      if (language !== 'all') {
        params.set('language', language)
      }

      const res = await fetch(`/api/search?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setArticles(data.articles)
        setSearchCount(data.count)
      }
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setIsSearching(false)
    }
  }, [initialArticles])

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(searchQuery, selectedLanguage)
    }, 300) // 300ms debounce

    return () => clearTimeout(timer)
  }, [searchQuery, selectedLanguage, performSearch])

  // Filter articles by language when not searching
  const filteredArticles = searchQuery.trim() ? articles : 
    selectedLanguage === 'all' ? initialArticles : 
    initialArticles.filter(a => a.language === selectedLanguage)

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
              <span className="text-2xl font-bold text-foreground">{initialArticles.length}</span>
              <span>articles</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-foreground">
                {initialArticles.reduce((acc, a) => acc + (a._count.comments || 0), 0)}
              </span>
              <span>comments</span>
            </div>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="mb-12 space-y-4">
          <div className="relative max-w-xl mx-auto">
            <input
              type="text"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pr-4 py-3 bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              style={{ padding: '.625rem 1rem .625rem 2.5rem' }}
            />
            {/* Search Icon */}
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
              {isSearching ? (
                <svg className="animate-spin h-5 w-5 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
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
              )}
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
          
          {/* Language Filter */}
          {availableLanguages.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2">
              <button
                onClick={() => setSelectedLanguage('all')}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  selectedLanguage === 'all'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                All Languages
              </button>
              {availableLanguages.map((lang) => (
                <button
                  key={lang}
                  onClick={() => setSelectedLanguage(lang)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    selectedLanguage === lang
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  <span className="mr-1">{languageFlags[lang] || '🌐'}</span>
                  {languageNames[lang] || lang}
                </button>
              ))}
            </div>
          )}
          
          {(searchQuery || selectedLanguage !== 'all') && (
            <p className="text-center text-sm text-muted-foreground">
              Found <span className="font-medium text-foreground">{searchQuery.trim() ? searchCount : filteredArticles.length}</span> {filteredArticles.length === 1 ? 'article' : 'articles'}
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
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-muted text-xs font-medium">
                    {languageFlags[article.language] || '🌐'}
                    {languageNames[article.language] || article.language}
                  </span>
                  <span className="text-border">·</span>
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
