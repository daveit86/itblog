import prisma from "@/lib/prisma"

export async function GET() {
  const articles = await prisma.article.findMany({
    where: { published: true },
    select: { slug: true, updatedAt: true },
  })

  const blogUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${blogUrl}</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${blogUrl}/feed.xml</loc>
    <changefreq>weekly</changefreq>
    <priority>0.5</priority>
  </url>
  ${articles.map(article => `
  <url>
    <loc>${blogUrl}/blog/${article.slug}</loc>
    <lastmod>${article.updatedAt.toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  `).join('')}
</urlset>`

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
    },
  })
}
