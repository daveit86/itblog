import prisma from "@/lib/prisma"

export async function GET() {
  const articles = await prisma.article.findMany({
    where: { published: true },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })

  const blogUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'

  const rss = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
<channel>
  <title>Dave's IT Blog</title>
  <description>IT related articles and notes</description>
  <link>${blogUrl}</link>
  <language>en</language>
  ${articles.map(article => `
  <item>
    <title><![CDATA[${article.title}]]></title>
    <description><![CDATA[${article.excerpt || article.content.substring(0, 150) + '...'}]]></description>
    <link>${blogUrl}/blog/${article.slug}</link>
    <guid isPermaLink="true">${blogUrl}/blog/${article.slug}</guid>
    <pubDate>${article.createdAt.toUTCString()}</pubDate>
  </item>
  `).join('')}
</channel>
</rss>`

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/xml',
    },
  })
}
