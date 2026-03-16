import { PrismaClient } from '../generated/prisma/client.js'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import * as fs from 'fs'
import * as path from 'path'

const connectionString = process.env.DATABASE_URL || ''
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

interface ArticleVersion {
  title: string
  content: string
  excerpt?: string
  tags?: string
  metaTitle?: string
  metaDescription?: string
  version: number
  createdAt: string
}

interface Article {
  id: string
  slug: string
  title: string
  excerpt?: string
  content: string
  tags?: string
  metaTitle?: string
  metaDescription?: string
  published: boolean
  scheduled: boolean
  publishAt?: string
  viewCount: number
  language: string
  translationGroupId?: string
  createdAt: string
  updatedAt: string
  comments: any[]
  versions: ArticleVersion[]
}

interface BackupData {
  exportedAt: string
  version: string
  articles: Article[]
}

async function restoreArticles() {
  console.log('🔄 Starting article restoration...\n')

  // Read backup file
  const backupPath = path.join(process.cwd(), 'itblog-backup-2026-03-14.json')
  
  if (!fs.existsSync(backupPath)) {
    console.error('❌ Backup file not found:', backupPath)
    process.exit(1)
  }

  const backupData: BackupData = JSON.parse(fs.readFileSync(backupPath, 'utf-8'))
  console.log(`📁 Found backup from ${backupData.exportedAt}`)
  console.log(`📄 Total articles to restore: ${backupData.articles.length}\n`)

  // First, delete sample articles if they exist
  console.log('🧹 Cleaning up sample articles...')
  const sampleSlugs = ['welcome-to-it-blog', 'sample-article-italian']
  for (const slug of sampleSlugs) {
    try {
      await prisma.article.deleteMany({
        where: { slug }
      })
      console.log(`  ✓ Removed sample article: ${slug}`)
    } catch {
      // Article might not exist, that's fine
    }
  }
  console.log()

  // Track translation group mappings (old ID -> new ID)
  const translationGroupMap = new Map<string, string>()
  const restoredArticles: { title: string; slug: string; language: string }[] = []

  // Process articles in order to handle translation groups
  for (const article of backupData.articles) {
    console.log(`📝 Restoring: "${article.title}" (${article.language})`)

    // Handle translation group
    let newTranslationGroupId: string | null = null
    if (article.translationGroupId) {
      if (translationGroupMap.has(article.translationGroupId)) {
        newTranslationGroupId = translationGroupMap.get(article.translationGroupId)!
      } else {
        newTranslationGroupId = `group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        translationGroupMap.set(article.translationGroupId, newTranslationGroupId)
      }
    }

    // Check if article with same slug already exists
    const existingArticle = await prisma.article.findUnique({
      where: { slug: article.slug }
    })

    if (existingArticle) {
      console.log(`  ⚠️  Article with slug "${article.slug}" already exists, skipping...`)
      continue
    }

    try {
      // Create the article
      const newArticle = await prisma.article.create({
        data: {
          slug: article.slug,
          title: article.title,
          excerpt: article.excerpt,
          content: article.content,
          tags: article.tags,
          metaTitle: article.metaTitle,
          metaDescription: article.metaDescription,
          published: article.published,
          scheduled: article.scheduled || false,
          publishAt: article.publishAt ? new Date(article.publishAt) : null,
          viewCount: article.viewCount || 0,
          language: article.language,
          translationGroupId: newTranslationGroupId,
          createdAt: new Date(article.createdAt),
          updatedAt: new Date(article.updatedAt),
        }
      })

      // Restore version history if exists
      if (article.versions && article.versions.length > 0) {
        console.log(`  📚 Restoring ${article.versions.length} version(s)...`)
        for (const version of article.versions) {
          await prisma.articleVersion.create({
            data: {
              articleId: newArticle.id,
              title: version.title,
              content: version.content,
              excerpt: version.excerpt,
              tags: version.tags,
              metaTitle: version.metaTitle,
              metaDescription: version.metaDescription,
              version: version.version,
              createdAt: new Date(version.createdAt),
            }
          })
        }
      }

      restoredArticles.push({
        title: newArticle.title,
        slug: newArticle.slug,
        language: newArticle.language
      })

      console.log(`  ✅ Restored successfully\n`)
    } catch (error) {
      console.error(`  ❌ Failed to restore: ${error}`)
    }
  }

  console.log('\n' + '='.repeat(50))
  console.log('🎉 RESTORATION COMPLETE!')
  console.log('='.repeat(50))
  console.log(`\n✅ Successfully restored: ${restoredArticles.length} articles`)
  console.log('\nRestored articles:')
  restoredArticles.forEach((article, index) => {
    console.log(`  ${index + 1}. ${article.title} (${article.language})`)
  })

  console.log('\n📝 Next steps:')
  console.log('  1. Start the dev server: npm run dev')
  console.log('  2. Visit: http://localhost:3000')
  console.log('  3. Login to admin: http://localhost:3000/admin')
  console.log('     Email: admin@example.com')
  console.log('     Password: admin123')
  console.log('  4. Your restored articles should be visible!')
}

restoreArticles()
  .catch((e) => {
    console.error('❌ Restoration failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
