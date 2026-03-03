import prisma from "@/lib/prisma"
import EditArticleClient from "./EditArticleClient"
import { notFound } from "next/navigation"

type ArticleData = {
  id: string
  title: string
  slug: string
  tags: string | null
  excerpt: string | null
  content: string
  metaTitle: string | null
  metaDescription: string | null
  published: boolean
}

export default async function EditArticlePage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params
  
  const article = await prisma.article.findUnique({
    where: { id },
  })

  if (!article) {
    notFound()
  }

  return <EditArticleClient article={article as ArticleData} />
}
