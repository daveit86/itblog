import prisma from "@/lib/prisma"
import HomePage from "./HomePage"

export default async function Home() {
  let articles: any[] = []
  
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
