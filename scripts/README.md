# IT Blog Article CLI

A command-line tool for creating and managing blog articles with direct database access.

## Quick Start

```bash
# Create a simple draft
npx ts-node scripts/article-cli.ts create "My Article Title"

# Interactive mode
npx ts-node scripts/article-cli.ts create --interactive

# Create from markdown file
npx ts-node scripts/article-cli.ts create --file ./article.md

# Bulk import
npx ts-node scripts/article-cli.ts import ./articles/ --tags "imported"
```

## Commands

### `create` - Create a new article

Create an article with various options:

```bash
# Simple draft (default)
npx ts-node scripts/article-cli.ts create "My Article Title"

# With content
npx ts-node scripts/article-cli.ts create "Docker Tutorial" \
  --content "# Introduction\n\nThis tutorial..." \
  --tags "docker,devops" \
  --language en

# From markdown file
npx ts-node scripts/article-cli.ts create \
  --file ./my-article.md \
  --tags "tutorial" \
  --language it

# Using template
npx ts-node scripts/article-cli.ts create "React Guide" \
  --template tutorial \
  --tags "react,javascript"

# Interactive mode (prompts for all fields)
npx ts-node scripts/article-cli.ts create --interactive
```

#### Options

- `--title, -t` - Article title
- `--content, -c` - Article content (markdown)
- `--file, -f` - Read content from markdown file
- `--template` - Use template (tutorial, news, review, reference, blank)
- `--excerpt` - Short description
- `--tags` - Comma-separated tags
- `--language, -l` - Language code (en, it, es, fr, de, pt, ru, zh, ja, ko)
- `--publish` - Publish immediately (default: draft)
- `--meta-title` - SEO title
- `--meta-description` - SEO description
- `--interactive, -i` - Interactive mode

### `import` - Bulk import articles

Import all markdown files from a directory:

```bash
# Import all .md files from directory
npx ts-node scripts/article-cli.ts import ./my-articles/

# With default tags
npx ts-node scripts/article-cli.ts import ./my-articles/ \
  --tags "imported,blog" \
  --language en
```

Each file's name (without .md) becomes the article title. Files are imported as drafts.

## Templates

Available templates to quickly scaffold articles:

### `tutorial`
Step-by-step tutorial structure with:
- Prerequisites section
- Numbered steps
- Code examples
- Conclusion

### `news`
Announcement format with:
- Date header
- What's new section
- Key features list
- Quick start commands

### `review`
Product/tool review with:
- Overview
- Pros/Cons lists
- Rating
- Verdict
- Alternatives

### `reference`
Technical documentation with:
- Quick reference table
- Detailed sections
- Common patterns
- Best practices
- Further reading

### `blank`
Empty template with just a title placeholder.

## Examples

### Example 1: Create a tutorial

```bash
npx ts-node scripts/article-cli.ts create "Getting Started with Docker" \
  --template tutorial \
  --tags "docker,devops,tutorial" \
  --language en
```

### Example 2: Create from existing markdown

```bash
npx ts-node scripts/article-cli.ts create \
  --file ./posts/react-hooks-guide.md \
  --tags "react,javascript" \
  --excerpt "A comprehensive guide to React Hooks"
```

### Example 3: Interactive mode for detailed article

```bash
npx ts-node scripts/article-cli.ts create --interactive
```

This will prompt you for:
- Title
- Template selection
- Language
- Excerpt
- Tags
- SEO metadata
- Publish status

### Example 4: Bulk import from directory

If you have a folder `markdown-posts/` with files like:
- `docker-basics.md`
- `react-tutorial.md`
- `devops-tools.md`

Run:

```bash
npx ts-node scripts/article-cli.ts import ./markdown-posts/ \
  --tags "imported" \
  --language en
```

This creates 3 draft articles with titles derived from filenames.

## Workflow Tips

### 1. Draft-First Workflow

Create drafts from the CLI, then edit in the admin panel:

```bash
# Create drafts in bulk
for file in ./drafts/*.md; do
  npx ts-node scripts/article-cli.ts create \
    --file "$file" \
    --tags "draft"
done

# Then review and publish in the admin panel
```

### 2. Template-Based Content Creation

Use templates for consistent article structure:

```bash
# Create monthly news post
npx ts-node scripts/article-cli.ts create "March 2024 Updates" \
  --template news \
  --tags "news,updates" \
  --publish

# Create tool review
npx ts-node scripts/article-cli.ts create "VS Code Review" \
  --template review \
  --tags "review,vscode"
```

### 3. Multi-Language Articles

Create same article in multiple languages:

```bash
# English version
npx ts-node scripts/article-cli.ts create "Docker Guide" \
  --template tutorial \
  --language en \
  --file ./content/docker-en.md

# Italian version (link in admin panel after creation)
npx ts-node scripts/article-cli.ts create "Guida Docker" \
  --template tutorial \
  --language it \
  --file ./content/docker-it.md
```

## Database Connection

The CLI tool connects directly to your SQLite database using Prisma. It uses the same `DATABASE_URL` from your `.env` file.

**Security Note**: Since this uses direct database access, it should only be run on the server where the database file is located.

## Troubleshooting

### "PrismaClientInitializationError"

Make sure your database exists and is accessible:

```bash
# Check if database exists
ls -la prisma/dev.db

# If not, run migrations
npx prisma migrate dev
```

### "Article with this slug already exists"

The CLI generates slugs from titles. If you get this error, either:
- Choose a different title
- Delete the existing article first
- Edit the existing article instead

### "File not found"

When using `--file`, provide the full or relative path:

```bash
# Good
npx ts-node scripts/article-cli.ts create --file ./articles/post.md

# Good (absolute path)
npx ts-node scripts/article-cli.ts create --file /home/user/articles/post.md
```
