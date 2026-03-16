import prisma from "@/lib/prisma"
import HomePage from "./HomePage"

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

export default async function Home() {
  let articles: Article[] = []
  
  try {
    articles = await prisma.article.findMany({
      where: { published: true },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        content: true,
        tags: true,
        language: true,
        createdAt: true,
        _count: {
          select: { comments: { where: { approved: true } } }
        }
      }
    })
  } catch {
    // Database not available during build or other error
    // Return empty articles array - will be populated at runtime
    articles = []
  }

  return <HomePage articles={articles} />
}
