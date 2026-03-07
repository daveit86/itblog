import prisma from "@/lib/prisma"
import HomePage from "./HomePage"

export default async function Home() {
  const articles = await prisma.article.findMany({
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

  return <HomePage articles={articles} />
}
