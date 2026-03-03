export interface Bookmark {
  slug: string
  title: string
  excerpt: string | null
  savedAt: string
}

const STORAGE_KEY = 'itblog-reading-list'

export function getBookmarks(): Bookmark[] {
  if (typeof window === 'undefined') return []
  
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : []
  } catch {
    return []
  }
}

export function saveBookmark(article: { slug: string; title: string; excerpt: string | null }): void {
  if (typeof window === 'undefined') return
  
  const bookmarks = getBookmarks()
  const existingIndex = bookmarks.findIndex(b => b.slug === article.slug)
  
  if (existingIndex >= 0) {
    // Update saved date
    bookmarks[existingIndex].savedAt = new Date().toISOString()
  } else {
    bookmarks.push({
      slug: article.slug,
      title: article.title,
      excerpt: article.excerpt,
      savedAt: new Date().toISOString()
    })
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks))
}

export function removeBookmark(slug: string): void {
  if (typeof window === 'undefined') return
  
  const bookmarks = getBookmarks().filter(b => b.slug !== slug)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks))
}

export function isBookmarked(slug: string): boolean {
  return getBookmarks().some(b => b.slug === slug)
}
