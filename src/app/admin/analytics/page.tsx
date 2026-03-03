import prisma from "@/lib/prisma"
import Link from "next/link"
import { format } from "date-fns"
import { authOptions } from "@/lib/auth"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/auth/signin')
  }

  // Get article statistics
  const totalArticles = await prisma.article.count()
  const publishedArticles = await prisma.article.count({ where: { published: true } })
  const draftArticles = totalArticles - publishedArticles
  
  // Get total views across all articles
  const articles = await prisma.article.findMany({
    select: { viewCount: true }
  })
  const totalViews = articles.reduce((sum, a) => sum + a.viewCount, 0)
  
  // Get total comments
  const totalComments = await prisma.comment.count()
  const pendingComments = await prisma.comment.count({ where: { approved: false } })
  
  // Get top 5 most viewed articles
  const topArticles = await prisma.article.findMany({
    where: { published: true },
    orderBy: { viewCount: 'desc' },
    take: 5,
    select: {
      id: true,
      title: true,
      slug: true,
      viewCount: true,
      _count: { select: { comments: true } }
    }
  })

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-foreground">Analytics Dashboard</h1>
        <Link
          href="/admin"
          className="text-primary hover:text-primary-hover"
        >
          ← Back to Admin
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card p-6">
          <h3 className="text-sm font-medium text-muted-foreground">Total Articles</h3>
          <p className="text-3xl font-bold text-foreground mt-2">{totalArticles}</p>
          <div className="mt-2 text-sm text-muted-foreground">
            {publishedArticles} published · {draftArticles} drafts
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-sm font-medium text-muted-foreground">Total Views</h3>
          <p className="text-3xl font-bold text-foreground mt-2">{totalViews.toLocaleString()}</p>
          <div className="mt-2 text-sm text-muted-foreground">
            {publishedArticles > 0 ? Math.round(totalViews / publishedArticles) : 0} avg per article
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-sm font-medium text-muted-foreground">Total Comments</h3>
          <p className="text-3xl font-bold text-foreground mt-2">{totalComments}</p>
          {pendingComments > 0 && (
            <div className="mt-2 text-sm text-warning">
              {pendingComments} pending approval
            </div>
          )}
        </div>

        <div className="card p-6">
          <h3 className="text-sm font-medium text-muted-foreground">Engagement Rate</h3>
          <p className="text-3xl font-bold text-foreground mt-2">
            {totalViews > 0 ? ((totalComments / totalViews) * 100).toFixed(2) : 0}%
          </p>
          <div className="mt-2 text-sm text-muted-foreground">
            Comments per view
          </div>
        </div>
      </div>

      {/* Top Articles */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Top Articles by Views</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Article</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Views</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Comments</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {topArticles.map((article, index) => (
                <tr key={article.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-muted-foreground font-mono w-6">{index + 1}</span>
                      <div>
                        <div className="text-sm font-medium text-foreground">{article.title}</div>
                        <div className="text-sm text-muted-foreground">/blog/{article.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                    {article.viewCount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                    {article._count.comments}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                    <Link href={`/blog/${article.slug}`} className="text-primary hover:text-primary-hover">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
              {topArticles.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-muted-foreground">
                    No articles with views yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
