import prisma from "@/lib/prisma"
import ArticlesList from "./ArticlesList"

export default async function AdminPage() {
  const articles = await prisma.article.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      slug: true,
      published: true,
      language: true,
      translationGroupId: true,
      createdAt: true,
      _count: {
        select: { comments: true }
      }
    }
  })

  return <ArticlesList articles={articles} />
}
