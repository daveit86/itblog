import prisma from "@/lib/prisma"
import ArticlesList from "./ArticlesList"

export default async function AdminPage() {
  const articles = await prisma.article.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { comments: true }
      }
    }
  })

  return <ArticlesList articles={articles} />
}
