import { authOptions } from "@/lib/auth"
import { getServerSession } from "next-auth"
import prisma from "@/lib/prisma"

export async function updateArticle(formData: FormData): Promise<{ error?: string } | { redirect: string }> {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return { error: "Unauthorized" }
  }

  const id = formData.get("id") as string
  const title = formData.get("title") as string
  const slug = formData.get("slug") as string
  const excerpt = formData.get("excerpt") as string | null
  const content = formData.get("content") as string
  const published = formData.get("published") === "on"

  if (!id || !title || !slug || !content) {
    return { error: "Required fields missing" }
  }

  const existingArticle = await prisma.article.findFirst({
    where: { slug, NOT: { id } },
  })

  if (existingArticle) {
    return { error: "An article with this slug already exists" }
  }

  await prisma.article.update({
    where: { id },
    data: { title, slug, excerpt: excerpt || null, content, published },
  })

  return { redirect: "/admin" }
}

export async function deleteArticle(id: string): Promise<{ redirect: string }> {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    throw new Error("Unauthorized")
  }

  await prisma.article.delete({
    where: { id },
  })

  return { redirect: "/admin" }
}