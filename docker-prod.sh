#!/bin/bash

# Docker Production Helper Script for IT Blog
# Usage: ./docker-prod.sh [start|stop|logs|shell|backup|restore]

set -e

COMPOSE_FILE="docker-compose.yml"
APP_NAME="itblog"

case "${1:-start}" in
  start)
    echo "🚀 Starting IT Blog production environment..."
    
    # Check if .env.docker exists
    if [ ! -f ".env.docker" ]; then
      echo "⚠️  Warning: .env.docker file not found!"
      echo "Creating from template..."
      cp .env.docker.example .env.docker
      echo "Please edit .env.docker with your production values before continuing."
      exit 1
    fi
    
    echo "Building and starting containers..."
    docker-compose -f $COMPOSE_FILE up --build -d
    echo ""
    echo "✅ Production server is starting!"
    echo "📱 App: http://localhost:98172"
    echo ""
    echo "View logs with: ./docker-prod.sh logs"
    ;;
    
  stop)
    echo "🛑 Stopping IT Blog production environment..."
    docker-compose -f $COMPOSE_FILE down
    echo "✅ Stopped!"
    ;;
    
  restart)
    echo "🔄 Restarting IT Blog production environment..."
    docker-compose -f $COMPOSE_FILE restart
    echo "✅ Restarted!"
    ;;
    
  logs)
    echo "📋 Showing logs (Ctrl+C to exit)..."
    docker-compose -f $COMPOSE_FILE logs -f
    ;;
    
  app-logs)
    echo "📋 Showing app logs only (Ctrl+C to exit)..."
    docker-compose -f $COMPOSE_FILE logs -f app
    ;;
    
  db-logs)
    echo "📋 Showing database logs only (Ctrl+C to exit)..."
    docker-compose -f $COMPOSE_FILE logs -f db
    ;;
    
  shell)
    echo "🐚 Opening shell in app container..."
    docker-compose -f $COMPOSE_FILE exec app sh
    ;;
    
  db-shell)
    echo "🗄️  Opening database shell..."
    docker-compose -f $COMPOSE_FILE exec db psql -U ${DB_USER:-itblog} -d ${DB_NAME:-itblog}
    ;;
    
  backup)
    echo "💾 Creating backup..."
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    mkdir -p backups
    
    # Backup database
    docker-compose -f $COMPOSE_FILE exec -T db pg_dump -U ${DB_USER:-itblog} ${DB_NAME:-itblog} > backups/db_backup_$TIMESTAMP.sql
    
    # Backup uploads
    docker-compose -f $COMPOSE_FILE exec -T app tar -czf - /app/public/uploads > backups/uploads_backup_$TIMESTAMP.tar.gz
    
    echo "✅ Backup created: backups/db_backup_$TIMESTAMP.sql and backups/uploads_backup_$TIMESTAMP.tar.gz"
    ;;
    
  update)
    echo "🔄 Updating application..."
    docker-compose -f $COMPOSE_FILE pull
    docker-compose -f $COMPOSE_FILE up --build -d
    echo "✅ Updated!"
    ;;
    
  migrate)
    echo "🗄️  Running database migrations..."
    docker-compose -f $COMPOSE_FILE exec app npx prisma migrate deploy
    ;;
    
  status)
    echo "📊 Container status:"
    docker-compose -f $COMPOSE_FILE ps
    ;;
    
  *)
    echo "IT Blog Docker Production Helper"
    echo ""
    echo "Usage: ./docker-prod.sh [command]"
    echo ""
    echo "Commands:"
    echo "  start      - Build and start production environment (default)"
    echo "  stop       - Stop all containers"
    echo "  restart    - Restart all containers"
    echo "  logs       - Show all container logs"
    echo "  app-logs   - Show app logs only"
    echo "  db-logs    - Show database logs only"
    echo "  shell      - Open shell in app container"
    echo "  db-shell   - Open PostgreSQL shell"
    echo "  backup     - Create database and uploads backup"
    echo "  update     - Update and rebuild containers"
    echo "  migrate    - Run database migrations"
    echo "  status     - Show container status"
    echo ""
    echo "Examples:"
    echo "  ./docker-prod.sh start      # Start production environment"
    echo "  ./docker-prod.sh backup     # Create backup"
    echo "  ./docker-prod.sh logs       # Watch logs"
    ;;
esac
