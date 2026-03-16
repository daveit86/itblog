import { PrismaClient } from '../generated/prisma/client.js'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import bcrypt from 'bcryptjs'

const connectionString = process.env.DATABASE_URL || ''
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)

const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Starting database seed...\n')

  // Check if admin user already exists
  const existingAdmin = await prisma.user.findFirst({
    where: { role: 'admin' }
  })

  if (existingAdmin) {
    console.log('Admin user already exists, skipping creation')
  } else {
    // Create admin user from environment variables
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com'
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123'
    
    const hashedPassword = await bcrypt.hash(adminPassword, 12)
    
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        name: 'Admin User',
        role: 'admin',
        emailVerified: new Date(),
      }
    })
    
    // Create Account record with hashed password for credentials provider
    await prisma.account.create({
      data: {
        userId: admin.id,
        type: 'credentials',
        provider: 'credentials',
        providerAccountId: admin.id,
        access_token: hashedPassword,
      }
    })
    
    console.log('Admin user created:')
    console.log('  Email: ' + adminEmail)
    console.log('  Password: ' + adminPassword)
    console.log('  ID: ' + admin.id)
    console.log()
  }

  // Check if sample articles exist
  const existingArticles = await prisma.article.count()
  
  if (existingArticles > 0) {
    console.log(existingArticles + ' articles already exist, skipping sample data')
  } else {
    console.log('Creating sample articles...\n')
    
    // Create sample articles
    const articles = [
      {
        slug: 'welcome-to-it-blog',
        title: 'Welcome to IT Blog',
        excerpt: 'Your new blog is ready! Learn how to create articles and manage content.',
        content: '# Welcome to IT Blog\n\nThis is your first article! The IT Blog platform is now running with PostgreSQL.\n\n## Features\n\n- **Multi-language support**: Write articles in different languages\n- **Markdown editing**: Full support for code blocks, images, and formatting\n- **Comments**: Engage with your readers through nested comments\n- **Admin dashboard**: Manage all your content from one place\n- **Scheduled publishing**: Queue articles for future publication\n- **Version history**: Track changes and revert if needed\n\n## Getting Started\n\n1. Log in to the admin panel at "/admin"\n2. Create your first article\n3. Customize your settings\n4. Share your content!\n\nHappy blogging!',
        tags: 'welcome,getting-started,tutorial',
        language: 'en',
        published: true,
      },
      {
        slug: 'sample-article-italian',
        title: 'Articolo di Esempio',
        excerpt: 'Questo è un esempio di articolo in italiano.',
        content: '# Articolo di Esempio\n\nQuesto è un esempio di come creare contenuti in diverse lingue.\n\n## Caratteristiche\n\n- Supporto multi-lingua\n- Editing in Markdown\n- Sistema di commenti\n\nBenvenuto nel tuo nuovo blog!',
        tags: 'esempio,italiano',
        language: 'it',
        published: true,
      },
    ]

    for (const article of articles) {
      await prisma.article.create({
        data: article
      })
      console.log('  Created: ' + article.title)
    }
    
    console.log('\nCreated ' + articles.length + ' sample articles')
  }

  console.log('\nDatabase seed completed!')
  console.log('\nNext steps:')
  console.log('  1. Visit your deployed site')
  console.log('  2. Go to /admin')
  console.log('  3. Login with admin credentials')
}

main()
  .catch((e) => {
    console.error('Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
