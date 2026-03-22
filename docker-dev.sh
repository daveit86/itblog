#!/bin/bash

# Docker Development Helper Script for IT Blog
# Usage: ./docker-dev.sh [start|stop|logs|shell|db-shell]

set -e

COMPOSE_FILE="docker-compose.dev.yml"
APP_NAME="itblog"

case "${1:-start}" in
  start)
    echo "🚀 Starting IT Blog development environment..."
    echo "Building and starting containers..."
    docker-compose -f $COMPOSE_FILE up --build -d
    echo ""
    echo "✅ Development server is starting!"
    echo "📱 App: http://localhost:98172"
    echo "🗄️  Database: localhost:5432"
    echo ""
    echo "View logs with: ./docker-dev.sh logs"
    ;;
    
  stop)
    echo "🛑 Stopping IT Blog development environment..."
    docker-compose -f $COMPOSE_FILE down
    echo "✅ Stopped!"
    ;;
    
  restart)
    echo "🔄 Restarting IT Blog development environment..."
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
    docker-compose -f $COMPOSE_FILE exec db psql -U itblog -d itblog
    ;;
    
  clean)
    echo "🧹 Cleaning up containers and volumes..."
    docker-compose -f $COMPOSE_FILE down -v
    echo "✅ Cleaned! All data has been removed."
    ;;
    
  migrate)
    echo "🗄️  Running database migrations..."
    docker-compose -f $COMPOSE_FILE exec app npx prisma migrate dev
    ;;
    
  seed)
    echo "🌱 Seeding database..."
    docker-compose -f $COMPOSE_FILE exec app npx prisma db seed
    ;;
    
  status)
    echo "📊 Container status:"
    docker-compose -f $COMPOSE_FILE ps
    ;;
    
  *)
    echo "IT Blog Docker Development Helper"
    echo ""
    echo "Usage: ./docker-dev.sh [command]"
    echo ""
    echo "Commands:"
    echo "  start      - Build and start development environment (default)"
    echo "  stop       - Stop all containers"
    echo "  restart    - Restart all containers"
    echo "  logs       - Show all container logs"
    echo "  app-logs   - Show app logs only"
    echo "  db-logs    - Show database logs only"
    echo "  shell      - Open shell in app container"
    echo "  db-shell   - Open PostgreSQL shell"
    echo "  migrate    - Run database migrations"
    echo "  seed       - Seed the database"
    echo "  clean      - Remove containers and volumes (⚠️  deletes all data)"
    echo "  status     - Show container status"
    echo ""
    echo "Examples:"
    echo "  ./docker-dev.sh start      # Start development environment"
    echo "  ./docker-dev.sh logs       # Watch logs"
    echo "  ./docker-dev.sh shell      # Access app container"
    ;;
esac
