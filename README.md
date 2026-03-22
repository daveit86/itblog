# IT Blog

A modern, secure, and feature-rich blogging platform built with Next.js, React, and PostgreSQL. Designed for developers and tech enthusiasts who want a powerful yet easy-to-manage blog.

[![Next.js](https://img.shields.io/badge/Next.js-16.1.6-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.3-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-7.4.2-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)

## ✨ Features

### Content Management
- 📝 **Markdown Editor** - Write articles with full Markdown support and live preview
- 🌍 **Multi-language Support** - Publish articles in multiple languages with translation linking
- 🏷️ **Tags & Categories** - Organize content with tags and filtering
- 📅 **Scheduled Publishing** - Queue articles for future publication
- 🔄 **Version History** - Track changes and restore previous versions
- 🔍 **Server-side Search** - Full-text search across all articles

### Comments System
- 💬 **Nested Comments** - Threaded discussions with replies
- 👍 **Like System** - Users can like comments
- 🛡️ **Moderation Queue** - All comments require approval before publishing
- 👤 **Anonymous Comments** - No email required, optional names
- 🚫 **Rate Limiting** - Prevents spam and abuse

### Admin Dashboard
- 📊 **Analytics** - View statistics and trends
- 👥 **User Management** - Manage admin users and permissions
- 💾 **Backup & Restore** - Complete database and media backup system
- 📤 **Import/Export** - Bulk article management
- 📝 **Audit Logs** - Track all admin actions
- 🖼️ **Media Library** - Upload and manage images

### Security & Performance
- 🔐 **Authentication** - Secure JWT-based sessions with NextAuth.js
- 🛡️ **Authorization** - Role-based access control (Admin/User)
- 📧 **Rate Limiting** - Protection against brute force and spam
- 🧹 **XSS Protection** - DOMPurify sanitization on all user content
- 🔒 **Security Headers** - Comprehensive CSP and security policies
- 📈 **Error Monitoring** - Sentry integration for production monitoring
- 🚀 **Image Optimization** - Next.js Image component with WebP/AVIF support

### SEO & Accessibility
- 🗺️ **XML Sitemap** - Auto-generated sitemap for search engines
- 📰 **RSS Feed** - Subscribe to new articles
- 🏷️ **Meta Tags** - Open Graph and Twitter Cards support
- 🎨 **Dark Mode** - Automatic theme switching
- 📱 **Responsive Design** - Mobile-first approach

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL 15+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/daveit86/itblog.git
   cd itblog
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` with your values:
   ```env
   # Database
   DATABASE_URL="postgresql://user:password@localhost:5432/itblog"
   
   # NextAuth
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key"
   
   # Admin
   ADMIN_EMAIL="admin@example.com"
   ADMIN_PASSWORD="secure-password"
   
   # Optional: SMTP for email notifications
   SMTP_HOST=""
   SMTP_PORT="587"
   SMTP_SECURE="false"
   SMTP_USER=""
   SMTP_PASS=""
   ```

4. **Set up the database**
   ```bash
   # Run database migrations
   npm run db:migrate
   
   # Seed with sample data
   npm run db:seed
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🐳 Docker Quick Start

Prefer Docker? No problem! Run the entire stack with one command:

### Development (with hot-reloading)
```bash
# Start everything
./docker-dev.sh start

# Access at http://localhost:98172
```

### Production
```bash
# Copy environment template
cp .env.docker.example .env.docker

# Edit with your values, then start
./docker-prod.sh start
```

See [DOCKER.md](DOCKER.md) for detailed Docker documentation.

## 📚 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm test` | Run Jest tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:deploy` | Deploy migrations to production |
| `npm run db:studio` | Open Prisma Studio (database GUI) |
| `npm run db:seed` | Seed database with sample data |
| `npm run backup:create` | Create full backup (database + media) |
| `npm run backup:restore` | Restore from backup |
| `npm run article:create` | Create new article via CLI |
| `npm run article:import` | Import articles from markdown files |

## 🏗️ Tech Stack

### Core
- **Next.js 16** - React framework with App Router
- **React 19** - UI library
- **TypeScript 5** - Type safety
- **Tailwind CSS 4** - Utility-first styling

### Database & ORM
- **PostgreSQL 15** - Relational database
- **Prisma 7.4** - Type-safe database client
- **@prisma/adapter-pg** - PostgreSQL adapter

### Authentication
- **NextAuth.js 4** - Authentication library
- **bcryptjs** - Password hashing
- **JWT** - Session management

### Security
- **isomorphic-dompurify** - XSS protection
- **rate-limiter-flexible** - Rate limiting
- **@sentry/nextjs** - Error monitoring

### Content
- **react-markdown** - Markdown rendering
- **rehype-highlight** - Syntax highlighting
- **date-fns** - Date formatting

## 📖 Documentation

- [Deployment Guide](VERCEL_DEPLOYMENT.md) - Deploy to Vercel with PostgreSQL
- [Security Overview](SECURITY_FIXES.md) - Security features and best practices
- [Backup System](BACKUP_SYSTEM.md) - Complete backup and restore guide
- [Sentry Setup](SENTRY_SETUP.md) - Configure error monitoring
- [Local Testing](LOCAL_TESTING.md) - Development environment setup

## 🔒 Security Features

- ✅ JWT-based authentication with secure HTTP-only cookies
- ✅ Role-based access control (Admin/User)
- ✅ Password hashing with bcrypt (10-12 rounds)
- ✅ Rate limiting on all endpoints
- ✅ XSS protection with DOMPurify
- ✅ CSRF protection
- ✅ Input validation with Zod schemas
- ✅ File upload validation (magic numbers, MIME types)
- ✅ Comprehensive security headers (CSP, HSTS, etc.)
- ✅ SQL injection prevention via Prisma ORM
- ✅ Path traversal protection on uploads
- ✅ Audit logging for all admin actions

## 🎨 Customization

### Themes
The blog supports both light and dark modes. Customize colors in:
- `src/app/globals.css` - CSS variables
- `tailwind.config.ts` - Tailwind configuration

### Language Support
Add new languages by updating:
- `src/app/HomePage.tsx` - Add to `languageNames` and `languageFlags`
- Database supports ISO language codes

### Components
All UI components are in `src/components/` and use Tailwind CSS for styling.

## 🧪 Testing

Run the test suite:
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm test -- --coverage
```

## 🚀 Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy!

For detailed instructions, see [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md)

### Environment Variables for Production

```env
# Required
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="https://your-domain.com"
ADMIN_EMAIL="admin@yourdomain.com"
ADMIN_PASSWORD="strong-password"

# Optional but recommended
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="app-password"
SENTRY_DSN="https://..."
SENTRY_ORG="your-org"
SENTRY_PROJECT="your-project"
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Database powered by [PostgreSQL](https://www.postgresql.org/)
- ORM by [Prisma](https://www.prisma.io/)
- Icons by [Heroicons](https://heroicons.com/)

## 📞 Support

If you encounter any issues or have questions:

1. Check the [documentation](#-documentation) links above
2. Search [existing issues](https://github.com/daveit86/itblog/issues)
3. Create a new issue with details about your problem

---

**Built with ❤️ by [daveit86](https://github.com/daveit86)**
