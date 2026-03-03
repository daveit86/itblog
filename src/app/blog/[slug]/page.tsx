import prisma from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import ReactMarkdown from "react-markdown"
import rehypeHighlight from "rehype-highlight"
import { format } from "date-fns"
import CommentsSection from "@/components/CommentsSection"
import { ReadingProgress } from "@/components/ReadingProgress"
import ViewCounter from "@/components/ViewCounter"
import BookmarkButton from "@/components/BookmarkButton"
import ShareButtons from "@/components/ShareButtons"
import { calculateReadingTime } from "@/lib/utils"
import { Header } from "@/components/Header"
import { Metadata } from "next"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const session = await getServerSession(authOptions)
  const isAdmin = !!session

  const article = await prisma.article.findUnique({
    where: isAdmin ? { slug } : { slug, published: true },
  })

  if (!article) {
    return { title: 'Article Not Found' }
  }

  const title = article.metaTitle || article.title
  const description = article.metaDescription || article.excerpt || 'Read this article on IT Blog'
  const url = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/blog/${slug}`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: 'IT Blog',
      locale: 'en_US',
      type: 'article',
      publishedTime: article.createdAt.toISOString(),
      modifiedTime: article.updatedAt.toISOString(),
      tags: article.tags ? article.tags.split(',').map(t => t.trim()) : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    alternates: {
      canonical: url,
    },
  }
}

// Generate table of contents from markdown headings
function generateTOC(content: string) {
  const headings = content.match(/^#{1,3}\s+.+$/gm) || []
  return headings.map(heading => {
    const level = heading.match(/^#+/)?.[0].length || 1
    const text = heading.replace(/^#+\s+/, '')
    const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')
    return { level, text, id }
  })
}

// Find related articles based on shared tags
async function getRelatedArticles(currentArticle: { id: string; tags: string | null }) {
  if (!currentArticle.tags) return []
  
  const currentTags = currentArticle.tags.split(',').map(t => t.trim().toLowerCase())
  
  const allArticles = await prisma.article.findMany({
    where: { 
      published: true,
      id: { not: currentArticle.id }
    },
    select: {
      id: true,
      title: true,
      slug: true,
      tags: true,
    }
  })
  
  // Score articles by matching tags
  const scored = allArticles.map(article => {
    const articleTags = article.tags?.split(',').map(t => t.trim().toLowerCase()) || []
    const matchingTags = currentTags.filter(tag => articleTags.includes(tag))
    return { ...article, score: matchingTags.length }
  })
  
  // Sort by score and return top 3
  return scored
    .filter(a => a.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
}

export default async function ArticlePage({ 
  params 
}: { 
  params: Promise<{ slug: string }> 
}) {
  const { slug } = await params
  
  // Check if user is admin
  const session = await getServerSession(authOptions)
  const isAdmin = !!session
  
  const article = await prisma.article.findUnique({
    where: isAdmin ? { slug } : { slug, published: true },
    include: {
      comments: isAdmin ? {
        orderBy: { createdAt: 'desc' }
      } : {
        where: { approved: true },
        orderBy: { createdAt: 'desc' }
      }
    }
  })

  if (!article) {
    notFound()
  }

  // Get related articles, TOC, and author info in parallel
  const [relatedArticles, toc, author] = await Promise.all([
    getRelatedArticles(article),
    generateTOC(article.content),
    prisma.user.findFirst({
      where: { role: 'admin' },
      select: { name: true, image: true, bio: true }
    })
  ])

  return (
    <div className="min-h-screen bg-background">
      <ReadingProgress />
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to articles
          </Link>
        </nav>

        <article className="animate-fade-in">
          {/* Article Header */}
          <header className="mb-8">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-6">
              {article.title}
            </h1>
            
            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <time dateTime={article.createdAt.toISOString()}>
                  {format(article.createdAt, 'MMMM d, yyyy')}
                </time>
              </div>
              <span className="hidden sm:inline text-border">|</span>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {calculateReadingTime(article.content)} min read
              </div>
              <span className="hidden sm:inline text-border">|</span>
              <ViewCounter articleId={article.id} initialCount={article.viewCount} />
              {!article.published && (
                <span className="badge bg-warning/10 text-warning border-warning/20">
                  Draft
                </span>
              )}
            </div>

            {/* Tags and Bookmark */}
            <div className="flex flex-wrap items-center justify-between gap-4 mt-4">
              {article.tags && (
                <div className="flex flex-wrap gap-2">
                  {article.tags.split(',').map(tag => (
                    <span key={tag} className="badge badge-primary">
                      {tag.trim()}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-2">
                <BookmarkButton article={{
                  slug: article.slug,
                  title: article.title,
                  excerpt: article.excerpt
                }} />
                <div className="h-6 w-px bg-border mx-2" />
                <ShareButtons title={article.title} slug={article.slug} />
              </div>
            </div>
          </header>

          {/* Table of Contents */}
          {toc.length > 0 && (
            <div className="toc mb-8">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                </svg>
                Table of Contents
              </h2>
              <nav>
                <ul className="space-y-1">
                  {toc.map((item, index) => (
                    <li key={index} className={`${item.level === 1 ? '' : item.level === 2 ? 'ml-4' : 'ml-8'}`}>
                      <a 
                        href={`#${item.id}`}
                        className="text-sm hover:text-primary transition-colors"
                      >
                        {item.text}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          )}

          {/* Article Content */}
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <ReactMarkdown 
              rehypePlugins={[rehypeHighlight]}
              components={{
                h1: ({ children }) => {
                  const id = children?.toString().toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')
                  return <h1 id={id} className="scroll-mt-24">{children}</h1>
                },
                h2: ({ children }) => {
                  const id = children?.toString().toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')
                  return <h2 id={id} className="scroll-mt-24">{children}</h2>
                },
                h3: ({ children }) => {
                  const id = children?.toString().toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')
                  return <h3 id={id} className="scroll-mt-24">{children}</h3>
                },
              }}
            >
              {article.content}
            </ReactMarkdown>
          </div>
        </article>

        {/* Author Bio */}
        {author && (
          <section className="mt-12 pt-8 border-t border-border">
            <div className="card p-6">
              <div className="flex items-start gap-4">
                {author.image ? (
                  <img 
                    src={author.image} 
                    alt={author.name || 'Author'}
                    className="w-16 h-16 rounded-full object-cover border-2 border-border"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center text-white text-xl font-bold border-2 border-border">
                    {author.name?.charAt(0).toUpperCase() || 'A'}
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground">
                    {author.name || 'Author'}
                  </h3>
                  <p className="text-sm text-primary mb-2">Blog Author</p>
                  {author.bio && (
                    <p className="text-muted-foreground leading-relaxed">
                      {author.bio}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Related Articles */}
        {relatedArticles.length > 0 && (
          <section className="mt-16 pt-8 border-t border-border">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              Related Articles
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {relatedArticles.map(related => (
                <Link 
                  key={related.id}
                  href={`/blog/${related.slug}`}
                  className="card p-4 article-card group"
                >
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                    {related.title}
                  </h3>
                  {related.tags && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {related.tags.split(',').slice(0, 2).map(tag => (
                        <span key={tag} className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                          {tag.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Comments Section */}
        <CommentsSection articleId={article.id} comments={article.comments} />
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} IT Blog. All rights reserved.
            </p>
            <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Back to Home
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
