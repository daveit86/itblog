import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'

const adapter = new PrismaLibSql({ url: 'file:./prisma/dev.db' })
const prisma = new PrismaClient({ adapter })

async function main() {
  const article = await prisma.article.create({
    data: {
      slug: 'welcome-to-my-it-blog',
      title: 'Welcome to My IT Blog',
      excerpt: 'This is my new IT blog where I will share articles and notes about software development, programming, and technology.',
      content: `# Welcome to My IT Blog!

This is my new blog where I'll be sharing my thoughts, tutorials, and notes about **software development** and **IT**.

## What to Expect

Here are some topics I plan to cover:

- **Programming Languages**: Python, JavaScript, TypeScript, Go, and more
- **Web Development**: Frontend and backend frameworks
- **DevOps**: Docker, Kubernetes, CI/CD
- **System Administration**: Linux, servers, networking

## Code Example

Here's a simple Python function:

\`\`\`python
def greet(name: str) -> str:
    """Return a greeting message."""
    return f"Hello, {name}! Welcome to my blog."

# Example usage
message = greet("World")
print(message)
\`\`\`

## What's Next

Stay tuned for more articles! If you have any questions or suggestions, feel free to leave a comment below.

Happy coding!`,
      published: true,
    },
  })
  console.log('Article created:', article.id)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
