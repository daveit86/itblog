# Docker Setup for IT Blog

This document describes how to run IT Blog using Docker. Two environments are provided:

1. **Development** - With hot-reloading for development work
2. **Production** - Optimized for production deployment

## Quick Start

### Development Environment

```bash
# Start development environment
./docker-dev.sh start

# Access the app at http://localhost:98172
```

### Production Environment

```bash
# Copy environment template
cp .env.docker.example .env.docker

# Edit .env.docker with your values
nano .env.docker

# Start production environment
./docker-prod.sh start
```

## Development Setup

### Using Helper Script

```bash
# Start development server with hot-reloading
./docker-dev.sh start

# View logs
./docker-dev.sh logs

# Access app shell
./docker-dev.sh shell

# Access database
./docker-dev.sh db-shell

# Run migrations
./docker-dev.sh migrate

# Stop environment
./docker-dev.sh stop
```

### Using Docker Compose Directly

```bash
# Build and start
docker-compose -f docker-compose.dev.yml up --build

# Run in background
docker-compose -f docker-compose.dev.yml up --build -d

# Stop
docker-compose -f docker-compose.dev.yml down

# Clean up (removes data)
docker-compose -f docker-compose.dev.yml down -v
```

### Development Features

- ✅ **Hot-reloading** - Changes to code are automatically reflected
- ✅ **Source code mounting** - Your local changes are synced to the container
- ✅ **Database persistence** - Data survives container restarts
- ✅ **Uploads persistence** - Uploaded files are stored in a volume

### Default Development Credentials

- **App URL**: http://localhost:98172
- **Database Port**: 5432 (exposed for external tools)
- **Admin Email**: admin@example.com
- **Admin Password**: admin123

## Production Setup

### Prerequisites

1. Create environment file:
```bash
cp .env.docker.example .env.docker
```

2. Edit `.env.docker` with your production values:
```env
# Required
NEXTAUTH_SECRET=your-secret-key-here
ADMIN_EMAIL=your-email@example.com
ADMIN_PASSWORD=your-secure-password

# Optional - for email notifications
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### Using Helper Script

```bash
# Start production server
./docker-prod.sh start

# View logs
./docker-prod.sh logs

# Create backup
./docker-prod.sh backup

# Update application
./docker-prod.sh update

# Stop environment
./docker-prod.sh stop
```

### Using Docker Compose Directly

```bash
# Build and start
docker-compose up --build -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

### Production Features

- ✅ **Multi-stage build** - Optimized Docker image (~200MB)
- ✅ **Security** - Runs as non-root user
- ✅ **Health checks** - Automatic container health monitoring
- ✅ **Auto-migrations** - Database migrations run on startup
- ✅ **Data persistence** - Database and uploads stored in volumes

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXTAUTH_SECRET` | Secret for JWT signing | `openssl rand -base64 32` |
| `ADMIN_EMAIL` | Initial admin user email | `admin@example.com` |
| `ADMIN_PASSWORD` | Initial admin user password | `secure-password` |
| `DB_PASSWORD` | PostgreSQL password | `your-db-password` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `APP_PORT` | Port to expose app on host | `98172` |
| `ADMIN_NOTIFICATION_EMAIL` | Email for notifications | Same as ADMIN_EMAIL |
| `SMTP_HOST` | SMTP server hostname | - |
| `SMTP_PORT` | SMTP port | `587` |
| `SMTP_USER` | SMTP username | - |
| `SMTP_PASS` | SMTP password | - |

## Data Persistence

### Volumes

The following Docker volumes are created for data persistence:

- **itblog-postgres-data** - Database files
- **itblog-uploads-data** - Uploaded images/avatars

### Backup and Restore

**Development:**
```bash
# Database is exposed on port 5432 for external tools
pg_dump -h localhost -p 5432 -U itblog itblog > backup.sql
```

**Production:**
```bash
# Create backup
./docker-prod.sh backup

# Backups are saved to ./backups/
```

## Troubleshooting

### Port Already in Use

If port 98172 is already in use:

```bash
# Edit .env.docker and change APP_PORT
APP_PORT=98173
```

### Database Connection Issues

```bash
# Check database logs
./docker-dev.sh db-logs

# Reset database (⚠️ loses all data)
./docker-dev.sh clean
```

### Rebuild After Dependency Changes

```bash
# Development
./docker-dev.sh stop
./docker-dev.sh start

# Production
./docker-prod.sh stop
docker-compose -f docker-compose.yml build --no-cache
./docker-prod.sh start
```

### View Container Status

```bash
# Development
./docker-dev.sh status

# Production
./docker-prod.sh status
```

## Docker Architecture

### Images

- **Production**: Multi-stage build with Node.js 20 Alpine (~200MB)
- **Development**: Node.js 20 Alpine with dev dependencies (~500MB)

### Services

**Development:**
- `app` - Next.js development server with hot-reloading
- `db` - PostgreSQL 15 with exposed port 5432

**Production:**
- `app` - Optimized Next.js production server
- `db` - PostgreSQL 15 (internal network only)

### Networks

- **itblog-network** (production) - Isolated internal network
- **itblog-dev-network** (development) - Development network

## Performance

### Resource Usage

**Development:**
- Memory: ~1GB (includes dev tools and source watching)
- CPU: Low to moderate (hot-reloading)

**Production:**
- Memory: ~300MB
- CPU: Low (optimized build)

### Optimization

The production Dockerfile uses:
- Multi-stage builds to minimize image size
- Standalone Next.js output (no Node.js server needed)
- Alpine Linux for minimal footprint
- Non-root user for security

## Security

### Production Container Security

- Runs as non-root user (uid: 1001)
- Minimal attack surface (Alpine Linux)
- No dev dependencies in production image
- Secrets passed via environment variables only
- Database not exposed to host (internal network only)

### Recommendations

1. **Change default passwords** in production
2. **Use strong NEXTAUTH_SECRET** (32+ chars)
3. **Enable firewall** to restrict port access
4. **Regular backups** of volumes
5. **Keep images updated** with `./docker-prod.sh update`

## Useful Commands

```bash
# View all running containers
docker ps

# View container stats
docker stats

# Access container shell
docker exec -it itblog-app sh

# View container logs
docker logs -f itblog-app

# Restart single service
docker-compose restart app

# Scale (if needed)
docker-compose up --scale app=3 -d
```

## Support

For issues specific to Docker setup:
1. Check container logs: `./docker-dev.sh logs`
2. Verify environment variables in `.env.docker`
3. Ensure ports are not in use by other services
4. Try rebuilding: `./docker-dev.sh clean && ./docker-dev.sh start`
