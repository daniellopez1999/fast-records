#!/bin/bash

# Script to run the app in production
# Usage: ./docker.prod.sh [up|down|logs|rebuild]

# Detect docker-compose command (try new version first, then fallback to old)
if command -v docker &> /dev/null && docker compose version &> /dev/null; then
  DOCKER_COMPOSE="docker compose"
elif command -v docker-compose &> /dev/null; then
  DOCKER_COMPOSE="docker-compose"
else
  echo "Error: neither 'docker compose' nor 'docker-compose' found"
  exit 1
fi

COMMAND=$1

# Show usage if no command provided
if [ -z "$COMMAND" ]; then
  echo "Usage: $0 {up|down|logs|rebuild}"
  echo ""
  echo "Commands:"
  echo "  up       - Start the services"
  echo "  down     - Stop and remove containers"
  echo "  logs     - Show live app logs"
  echo "  rebuild  - Rebuild the image without cache"
  exit 0
fi

case $COMMAND in
  up)
    echo "Starting production services..."
    $DOCKER_COMPOSE -f docker-compose.yml up
    ;;
  down)
    echo "Stopping services..."
    $DOCKER_COMPOSE -f docker-compose.yml down
    ;;
  logs)
    echo "Showing logs..."
    $DOCKER_COMPOSE -f docker-compose.yml logs -f app
    ;;
  rebuild)
    echo "Rebuilding without cache..."
    $DOCKER_COMPOSE -f docker-compose.yml up --build --no-cache
    ;;
  *)
    echo "Usage: $0 {up|down|logs|rebuild}"
    echo ""
    echo "Commands:"
    echo "  up       - Start the services (default)"
    echo "  down     - Stop and remove containers"
    echo "  logs     - Show live app logs"
    echo "  rebuild  - Rebuild the image without cache"
    ;;
esac
