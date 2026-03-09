#!/usr/bin/env node

/**
 * IT Blog Article CLI Tool
 * 
 * Usage:
 *   npx ts-node scripts/article-cli.ts create "My Article Title" [options]
 *   npx ts-node scripts/article-cli.ts create --interactive
 *   npx ts-node scripts/article-cli.ts create --file ./article.md
 *   npx ts-node scripts/article-cli.ts import ./articles-directory/
 * 
 * Examples:
 *   # Create simple draft
 *   npx ts-node scripts/article-cli.ts create "How to Use Docker"
 * 
 *   # Create with content
 *   npx ts-node scripts/article-cli.ts create "Tutorial" --content "# Intro\n\nThis is..." --tags "docker,devops"
 * 
 *   # Create from markdown file
 *   npx ts-node scripts/article-cli.ts create --file ./my-post.md --tags "tutorial"
 * 
 *   # Interactive mode
 *   npx ts-node scripts/article-cli.ts create --interactive
 * 
 *   # Use template
 *   npx ts-node scripts/article-cli.ts create "My Tutorial" --template tutorial --tags "react"
 * 
 *   # Bulk import
 *   npx ts-node scripts/article-cli.ts import ./markdown-files/ --tags "imported"
 */

import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'
import { createInterface } from 'readline'

const prisma = new PrismaClient()

// Templates for different article types
const templates: Record<string, { content: string; excerpt: string }> = {
  tutorial: {
    content: `# Introduction

In this tutorial, we will cover...

## Prerequisites

- Item 1
- Item 2
- Item 3

## Step 1: Getting Started

Content here...

## Step 2: Implementation

\`\`\`bash
# Code example
npm install package-name
\`\`\`

## Conclusion

Summary of what we learned...

---

*If you found this tutorial helpful, please leave a comment below!*`,
    excerpt: 'Learn how to... A step-by-step tutorial covering everything you need to know.'
  },
  
  news: {
    content: `# Announcement Title

**Date:** ${new Date().toLocaleDateString()}

## What's New

We are excited to announce...

## Key Features

- Feature 1: Description
- Feature 2: Description
- Feature 3: Description

## How to Get Started

\`\`\`bash
# Quick start command
npm run setup
\`\`\`

## Feedback Welcome

Let us know what you think in the comments!

---

*Stay updated by following our [RSS feed](/feed.xml)*`,
    excerpt: 'Latest updates and announcements. Discover what\'s new and how it can help you.'
  },
  
  review: {
    content: `# Tool/Service Review

## Overview

Today we're reviewing...

## Pros

- ✅ Advantage 1
- ✅ Advantage 2
- ✅ Advantage 3

## Cons

- ❌ Disadvantage 1
- ❌ Disadvantage 2

## Verdict

**Rating:** ⭐⭐⭐⭐☆ (4/5)

Overall thoughts and recommendations...

## Alternatives

- Alternative 1
- Alternative 2

---

*Have you used this tool? Share your experience in the comments!*`,
    excerpt: 'An in-depth review covering pros, cons, and our final verdict. Is it worth your time?'
  },
  
  reference: {
    content: `# Topic Reference Guide

## Quick Reference

| Command | Description |
|---------|-------------|
| \`cmd1\` | Description 1 |
| \`cmd2\` | Description 2 |
| \`cmd3\` | Description 3 |

## Detailed Explanation

### Section 1

Detailed content...

### Section 2

More details...

## Common Patterns

\`\`\`javascript
// Code example
const example = () => {
  return "Hello World";
};
\`\`\`

## Best Practices

1. Practice 1
2. Practice 2
3. Practice 3

## Further Reading

- [Link 1](#)
- [Link 2](#)

---

*Last updated: ${new Date().toLocaleDateString()}*`,
    excerpt: 'A comprehensive reference guide with examples, best practices, and quick tips.'
  },
  
  blank: {
    content: `# Title

Your content here...`,
    excerpt: ''
  }
}

// Language options
const languages = [
  { code: 'en', name: 'English' },
  { code: 'it', name: 'Italian' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' }
]

// Parse command line arguments
function parseArgs(): Record<string, string | boolean> {
  const args: Record<string, string | boolean> = {}
  const argv = process.argv.slice(2)
  
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    
    if (arg.startsWith('--')) {
      const key = arg.replace('--', '')
      const nextArg = argv[i + 1]
      
      if (nextArg && !nextArg.startsWith('--')) {
        args[key] = nextArg
        i++
      } else {
        args[key] = true
      }
    } else if (arg.startsWith('-')) {
      const key = arg.replace('-', '')
      const nextArg = argv[i + 1]
      
      if (nextArg && !nextArg.startsWith('-')) {
        args[key] = nextArg
        i++
      } else {
        args[key] = true
      }
    } else {
      // Positional argument (title)
      if (!args.title) {
        args.title = arg
      }
    }
  }
  
  return args
}

// Generate slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 100)
}

// Interactive prompt
function prompt(question: string): Promise<string> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout
  })
  
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close()
      resolve(answer.trim())
    })
  })
}

// Interactive mode
async function interactiveMode(): Promise<{
  title: string
  content: string
  excerpt: string
  tags: string
  language: string
  metaTitle: string
  metaDescription: string
  published: boolean
}> {
  console.log('\n📝 Create New Article (Interactive Mode)\n')
  
  const title = await prompt('Title: ')
  if (!title) {
    throw new Error('Title is required')
  }
  
  console.log('\nAvailable templates:')
  console.log('  1. tutorial - Step-by-step tutorial')
  console.log('  2. news - News/announcement')
  console.log('  3. review - Product/tool review')
  console.log('  4. reference - Technical reference')
  console.log('  5. blank - Empty template')
  console.log('  6. custom - Write your own')
  
  const templateChoice = await prompt('\nSelect template (1-6) [5]: ') || '5'
  
  let content = ''
  const templateKeys = ['tutorial', 'news', 'review', 'reference', 'blank', 'custom']
  const selectedTemplate = templateKeys[parseInt(templateChoice) - 1] || 'blank'
  
  if (selectedTemplate === 'custom') {
    console.log('\nEnter content (press Ctrl+D or type "END" on a new line when done):\n')
    const lines: string[] = []
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout
    })
    
    await new Promise<void>((resolve) => {
      rl.on('line', (line) => {
        if (line.trim() === 'END') {
          rl.close()
          resolve()
        } else {
          lines.push(line)
        }
      })
      
      rl.on('close', () => {
        resolve()
      })
    })
    
    content = lines.join('\n')
  } else {
    content = templates[selectedTemplate].content
    console.log(`\n✓ Using "${selectedTemplate}" template`)
  }
  
  console.log('\nAvailable languages:')
  languages.forEach((lang, i) => {
    console.log(`  ${i + 1}. ${lang.name} (${lang.code})`)
  })
  
  const langChoice = await prompt('\nSelect language (1-10) [1]: ') || '1'
  const language = languages[parseInt(langChoice) - 1]?.code || 'en'
  
  const excerpt = await prompt('Excerpt (short description): ')
  const tags = await prompt('Tags (comma-separated): ')
  const metaTitle = await prompt('Meta Title (optional): ')
  const metaDescription = await prompt('Meta Description (optional): ')
  const publishNow = await prompt('Publish immediately? (y/N): ')
  
  return {
    title,
    content,
    excerpt,
    tags,
    language,
    metaTitle,
    metaDescription,
    published: publishNow.toLowerCase() === 'y'
  }
}

// Create article
async function createArticle(args: Record<string, string | boolean>) {
  try {
    let articleData: any
    
    if (args.interactive || args.i) {
      // Interactive mode
      articleData = await interactiveMode()
    } else {
      // Command line mode
      const title = args.title as string
      
      if (!title) {
        console.error('❌ Error: Title is required')
        console.log('\nUsage:')
        console.log('  npx ts-node scripts/article-cli.ts create "Article Title" [options]')
        console.log('  npx ts-node scripts/article-cli.ts create --interactive')
        console.log('\nUse --help for more information')
        process.exit(1)
      }
      
      // Get content from file or argument
      let content = ''
      if (args.file || args.f) {
        const filePath = (args.file || args.f) as string
        if (!fs.existsSync(filePath)) {
          console.error(`❌ Error: File not found: ${filePath}`)
          process.exit(1)
        }
        content = fs.readFileSync(filePath, 'utf-8')
      } else if (args.content || args.c) {
        content = (args.content || args.c) as string
      } else if (args.template) {
        const templateName = args.template as string
        if (templates[templateName]) {
          content = templates[templateName].content
        } else {
          console.error(`❌ Error: Unknown template "${templateName}"`)
          console.log(`Available templates: ${Object.keys(templates).join(', ')}`)
          process.exit(1)
        }
      } else {
        content = templates.blank.content
      }
      
      // Generate excerpt if not provided
      let excerpt = (args.excerpt as string) || ''
      if (!excerpt && args.template) {
        excerpt = templates[args.template as string]?.excerpt || ''
      }
      
      articleData = {
        title,
        content,
        excerpt,
        tags: (args.tags as string) || '',
        language: (args.language || args.l || 'en') as string,
        metaTitle: (args['meta-title'] as string) || '',
        metaDescription: (args['meta-description'] as string) || '',
        published: args.publish === true || args.publish === 'true'
      }
    }
    
    // Generate slug
    const slug = generateSlug(articleData.title)
    
    // Check if slug already exists
    const existing = await prisma.article.findUnique({
      where: { slug }
    })
    
    if (existing) {
      console.error(`❌ Error: An article with slug "${slug}" already exists`)
      process.exit(1)
    }
    
    // Create article
    const article = await prisma.article.create({
      data: {
        title: articleData.title,
        slug,
        content: articleData.content,
        excerpt: articleData.excerpt || null,
        tags: articleData.tags || null,
        language: articleData.language,
        metaTitle: articleData.metaTitle || null,
        metaDescription: articleData.metaDescription || null,
        published: articleData.published || false,
        scheduled: false,
        viewCount: 0
      }
    })
    
    console.log('\n✅ Article created successfully!')
    console.log(`\n📄 ${article.title}`)
    console.log(`🔗 /blog/${article.slug}`)
    console.log(`🌐 Language: ${article.language}`)
    console.log(`📊 Status: ${article.published ? 'Published' : 'Draft'}`)
    console.log(`🆔 ID: ${article.id}`)
    
    if (!article.published) {
      console.log('\n💡 This article is saved as a draft.')
      console.log('   Edit it in the admin panel to publish.')
    }
    
  } catch (error) {
    console.error('\n❌ Error creating article:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Bulk import from directory
async function bulkImport(args: Record<string, string | boolean>) {
  const dirPath = (args.import as string)
  
  if (!dirPath) {
    console.error('❌ Error: Directory path is required')
    console.log('\nUsage: npx ts-node scripts/article-cli.ts import ./articles/')
    process.exit(1)
  }
  
  if (!fs.existsSync(dirPath)) {
    console.error(`❌ Error: Directory not found: ${dirPath}`)
    process.exit(1)
  }
  
  const files = fs.readdirSync(dirPath)
    .filter(f => f.endsWith('.md') || f.endsWith('.txt'))
    .sort()
  
  if (files.length === 0) {
    console.error('❌ Error: No .md or .txt files found in directory')
    process.exit(1)
  }
  
  console.log(`\n📁 Found ${files.length} files to import\n`)
  
  const defaultTags = (args.tags as string) || 'imported'
  const defaultLanguage = (args.language || args.l || 'en') as string
  
  let successCount = 0
  let errorCount = 0
  
  for (const file of files) {
    try {
      const filePath = path.join(dirPath, file)
      const content = fs.readFileSync(filePath, 'utf-8')
      
      // Use filename (without extension) as title
      const title = file.replace(/\.(md|txt)$/, '').replace(/[-_]/g, ' ')
      const slug = generateSlug(title)
      
      // Check if exists
      const existing = await prisma.article.findUnique({ where: { slug } })
      if (existing) {
        console.log(`⏭️  Skipping "${title}" - already exists`)
        continue
      }
      
      await prisma.article.create({
        data: {
          title,
          slug,
          content,
          excerpt: content.substring(0, 150).replace(/[#*_]/g, '') + '...',
          tags: defaultTags,
          language: defaultLanguage,
          published: false,
          scheduled: false,
          viewCount: 0
        }
      })
      
      console.log(`✅ Imported: ${title}`)
      successCount++
      
    } catch (error) {
      console.error(`❌ Error importing ${file}:`, error)
      errorCount++
    }
  }
  
  console.log(`\n📊 Import complete: ${successCount} success, ${errorCount} errors`)
  await prisma.$disconnect()
}

// Show help
function showHelp() {
  console.log(`
📝 IT Blog Article CLI Tool

COMMANDS:
  create [title] [options]     Create a new article
  import <directory> [options] Bulk import from directory
  help                         Show this help message

OPTIONS:
  --title, -t          Article title
  --content, -c        Article content (markdown)
  --file, -f           Read content from markdown file
  --template           Use template: tutorial, news, review, reference, blank
  --excerpt            Short description
  --tags               Comma-separated tags
  --language, -l       Language code (en, it, es, fr, de, pt, ru, zh, ja, ko)
  --publish            Publish immediately (default: draft)
  --meta-title         SEO title
  --meta-description   SEO description
  --interactive, -i    Interactive mode (prompts for all fields)

EXAMPLES:
  # Create simple draft
  npx ts-node scripts/article-cli.ts create "My Article Title"

  # Create with content
  npx ts-node scripts/article-cli.ts create "Docker Tutorial" \\
    --content "# Intro\\n\\nThis is..." \\
    --tags "docker,devops"

  # Create from file
  npx ts-node scripts/article-cli.ts create --file ./article.md

  # Use template
  npx ts-node scripts/article-cli.ts create "React Guide" \\
    --template tutorial \\
    --tags "react,javascript"

  # Interactive mode
  npx ts-node scripts/article-cli.ts create --interactive

  # Bulk import
  npx ts-node scripts/article-cli.ts import ./markdown-files/ --tags "imported"

TEMPLATES:
  tutorial    Step-by-step tutorial with code examples
  news        News/announcement format
  review      Product/tool review format
  reference   Technical reference guide
  blank       Empty template
`)
}

// Main
async function main() {
  const args = parseArgs()
  const command = process.argv[2]
  
  if (args.help || command === 'help' || !command) {
    showHelp()
    process.exit(0)
  }
  
  if (command === 'create') {
    await createArticle(args)
  } else if (command === 'import') {
    await bulkImport(args)
  } else {
    console.error(`❌ Unknown command: ${command}`)
    console.log('\nUse "help" for usage information')
    process.exit(1)
  }
}

main()
