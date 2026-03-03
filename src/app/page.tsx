import prisma from "@/lib/prisma"
import HomePage from "./HomePage"

export default async function Home() {
  const articles = await prisma.article.findMany({
    where: { published: true },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { comments: { where: { approved: true } } }
      }
    }
  })

  return <HomePage articles={articles} />
}
