# Quick Start for Local Testing

## ✅ Setup Complete!

Your local development environment is ready. Here's how to use it:

### 1. Database is Running
- **PostgreSQL** is running on Docker
- **Port:** 5433 (to avoid conflicts with any existing PostgreSQL)
- **Database:** itblog
- **User:** itblog
- **Password:** localdev123

### 2. Start the Development Server

```bash
npm run dev
```

The server will start on **http://localhost:3000**

### 3. Login Credentials

**Admin Panel:** http://localhost:3000/admin

- **Email:** admin@example.com
- **Password:** admin123

*(Note: The seed script used default credentials. You can change these in the admin panel.)*

### 4. Test the Blog

1. **Homepage** - http://localhost:3000
   - Should show 2 sample articles
   - Language filter works
   - Search works

2. **Admin Panel** - http://localhost:3000/admin
   - Login with credentials above
   - Create, edit, delete articles
   - Manage comments
   - View analytics

3. **Article Pages** - http://localhost:3000/blog/welcome-to-it-blog
   - View articles
   - Post comments (will be queued for approval)
   - Like comments

### 5. Database Management

**View Database:**
```bash
npm run db:studio
```
Opens Prisma Studio at http://localhost:5555

**Reset Database:**
```bash
# Stop and remove container
docker rm -f itblog-local-db

# Start fresh
docker run -d --name itblog-local-db -e POSTGRES_USER=itblog -e POSTGRES_PASSWORD=localdev123 -e POSTGRES_DB=itblog -p 5433:5432 postgres:15-alpine

# Run migrations
npm run db:migrate

# Seed data
npm run db:seed
```

### 6. Stop Everything

**Stop Development Server:**
Press `Ctrl+C` in the terminal

**Stop Database:**
```bash
docker stop itblog-local-db
```

**Start Database Again:**
```bash
docker start itblog-local-db
```

### 7. Files Changed for Local Testing

- `.env` - Now configured for local database
- `.env.local` - Created with local settings (gitignored)
- `.env.production.backup` - Backup of production config

### 8. Before Production Deploy

Remember to:
1. Restore production `.env` from backup: `cp .env.production.backup .env`
2. Set your real `DATABASE_URL` from Neon
3. Change admin credentials
4. Set production `NEXTAUTH_URL`
5. Deploy to Vercel

## 🧪 Testing Checklist

- [ ] Homepage loads with articles
- [ ] Can login to admin panel
- [ ] Can create new article
- [ ] Can edit article
- [ ] Can delete article
- [ ] Comments work (submit, approve, delete)
- [ ] File uploads work
- [ ] Search works
- [ ] Language filter works
- [ ] RSS feed works (http://localhost:3000/feed.xml)
- [ ] Sitemap works (http://localhost:3000/sitemap.xml)

Happy testing! 🚀
