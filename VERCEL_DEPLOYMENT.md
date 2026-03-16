# Deploying IT Blog to Vercel

This guide walks you through deploying the IT Blog to Vercel with PostgreSQL.

## Prerequisites

- [Vercel account](https://vercel.com/signup) (free)
- [PostgreSQL database](#database-options)
- Git repository with your code

## Quick Start (Recommended)

### 1. Set Up Database

#### Option A: Vercel Postgres (Easiest)

1. Go to your Vercel dashboard
2. Create a new project or open existing
3. Go to **Storage** tab
4. Click **Create Database** → **Postgres**
5. Choose region (pick one closest to your users)
6. Connect to your project
7. Copy the `DATABASE_URL` environment variable

#### Option B: External PostgreSQL (Neon, Supabase, etc.)

**Neon** (Free tier available):
1. Create account at [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string
4. Add as environment variable in Vercel

**Supabase** (Free tier available):
1. Create account at [supabase.com](https://supabase.com)
2. Create new project
3. Go to Settings → Database
4. Copy connection string
5. Add as environment variable in Vercel

### 2. Deploy to Vercel

#### Using Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel
```

#### Using Vercel Dashboard

1. Push code to GitHub/GitLab/Bitbucket
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your repository
4. Configure environment variables (see below)
5. Deploy

### 3. Configure Environment Variables

Add these in Vercel Dashboard → Project Settings → Environment Variables:

| Variable | Value | Required |
|----------|-------|----------|
| `DATABASE_URL` | Your PostgreSQL connection string | ✅ Yes |
| `NEXTAUTH_SECRET` | Random secret (generate: `openssl rand -base64 32`) | ✅ Yes |
| `NEXTAUTH_URL` | Your production URL (e.g., `https://your-domain.vercel.app`) | ✅ Yes |
| `ADMIN_EMAIL` | Admin login email | ✅ Yes |
| `ADMIN_PASSWORD` | Admin password | ✅ Yes |
| `ADMIN_NOTIFICATION_EMAIL` | Where notifications are sent | ⚠️ Recommended |
| `SMTP_HOST` | SMTP server for emails | ❌ Optional |
| `SMTP_PORT` | SMTP port (usually 587) | ❌ Optional |
| `SMTP_SECURE` | Use TLS (true/false) | ❌ Optional |
| `SMTP_USER` | SMTP username | ❌ Optional |
| `SMTP_PASSWORD` | SMTP password | ❌ Optional |

### 4. Initialize Database

After first deployment, run migrations:

**Using Vercel CLI:**
```bash
# Run migrations
vercel --prod

# Or run directly
npx prisma migrate deploy
```

**Create admin user:**
The admin user will be automatically created on first run using your `ADMIN_EMAIL` and `ADMIN_PASSWORD` environment variables.

## Step-by-Step Migration from SQLite

If you're migrating from the SQLite version:

### 1. Export SQLite Data

```bash
# From your local machine with SQLite database
npx prisma db pull --schema sqlite-schema.prisma
```

### 2. Update Schema

The schema has already been updated for PostgreSQL. Changes made:
- ✅ Changed `provider = "sqlite"` to `provider = "postgresql"`
- ✅ Removed `@prisma/adapter-libsql` dependency
- ✅ Added `url = env("DATABASE_URL")` to datasource

### 3. Create New Migration

```bash
# Generate migration for PostgreSQL
npx prisma migrate dev --name init_postgres
```

### 4. Migrate Data (Optional)

To transfer existing data from SQLite to PostgreSQL:

```bash
# Install pgloader (or use a GUI tool like DBeaver)
# For Ubuntu/Debian:
sudo apt-get install pgloader

# Convert SQLite to PostgreSQL
pgloader sqlite:///path/to/prisma/dev.db postgresql://user:pass@host/dbname
```

**Alternative GUI tools:**
- [DBeaver](https://dbeaver.io/) - Free database tool
- [TablePlus](https://tableplus.com/) - Paid with free trial

### 5. Update Package Scripts

The `package.json` has been updated to remove SQLite dependencies.

Run:
```bash
npm install
```

## Database Options Comparison

| Provider | Free Tier | Storage | Pros | Cons |
|----------|-----------|---------|------|------|
| **Vercel Postgres** | ✅ Yes | 256 MB - 512 MB | Integrated, zero config | Vercel ecosystem only |
| **Neon** | ✅ Yes | 500 MB - 3 GB | Serverless, scales to zero | Slightly complex setup |
| **Supabase** | ✅ Yes | 500 MB | Full platform, auth included | More than just DB |
| **Railway** | ✅ Yes | 5 GB | Simple, generous free tier | Limited regions |
| **Render** | ✅ Yes | 1 GB | Easy setup | Slower cold starts |

## Post-Deployment Checklist

- [ ] Database migrations applied
- [ ] Admin user can log in
- [ ] Can create/edit articles
- [ ] Comments work (if enabled)
- [ ] Email notifications work (if configured)
- [ ] Images/media upload works
- [ ] Custom domain configured (optional)

## Troubleshooting

### "Prisma Client initialization error"

**Cause:** Database not connected or migrations not applied.

**Fix:**
```bash
# Check database connection
npx prisma db pull

# Apply migrations
npx prisma migrate deploy
```

### "NEXTAUTH_URL must be set"

**Fix:** Add environment variable in Vercel:
- Key: `NEXTAUTH_URL`
- Value: Your actual domain (e.g., `https://myblog.vercel.app`)

### "Cannot find module '@prisma/client'"

**Fix:** Ensure Prisma generates client during build:
```json
{
  "scripts": {
    "postinstall": "prisma generate",
    "build": "prisma generate && next build"
  }
}
```

Already added to your package.json.

### Database connection timeout

**Cause:** Cold start or connection limits.

**Fix:**
1. Use connection pooling (Vercel Postgres includes this)
2. For external DBs, add `?pgbouncer=true` to connection string
3. Increase timeout in Prisma config

## Updating After Deployment

### Schema Changes

```bash
# Make changes to prisma/schema.prisma

# Create migration
npx prisma migrate dev --name descriptive_name

# Deploy
npx prisma migrate deploy

# Commit and push
git add .
git commit -m "Update schema"
git push
```

Vercel will automatically redeploy.

## Custom Domain Setup

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add your domain
3. Update DNS records as instructed
4. Update `NEXTAUTH_URL` to your custom domain
5. Redeploy

## Cost Estimation

**Free Tier Limits:**
- Vercel: 100GB bandwidth, 6,000 build minutes/month
- Vercel Postgres: 256MB - 512MB storage
- Neon: 500MB - 3GB storage
- Supabase: 500MB storage, 2GB transfer

**Typical costs for small blog:**
- 0-1K visitors/month: **FREE**
- 1K-10K visitors/month: **FREE** (most providers)
- 10K+ visitors/month: ~$5-20/month

## Support

- [Vercel Documentation](https://vercel.com/docs)
- [NextAuth.js Documentation](https://next-auth.js.org)
- [Prisma Documentation](https://www.prisma.io/docs)
