#!/bin/bash

# Docker utilities script for Fast Records
# Usage: ./docker.sh [command]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_NAME="fast-records"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo -e "${BLUE}▶ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

show_help() {
    cat << EOF
${BLUE}Fast Records - Docker Management Script${NC}

${GREEN}Usage:${NC}
    ./docker.sh [command]

${GREEN}Commands:${NC}
    up              Start containers in background
    down            Stop and remove containers
    logs            Show logs (app + db)
    logs-app        Show app logs only
    logs-db         Show database logs only
    restart         Restart containers
    rebuild         Rebuild Docker image
    shell           Enter app container shell
    psql            Connect to PostgreSQL database
    backup          Backup the database
    restore [file]  Restore database from backup
    clean           Remove containers and volumes (WARNING: deletes data)
    status          Show container status
    health          Check container health
    help            Show this help message

${GREEN}Examples:${NC}
    ./docker.sh up              # Start the application
    ./docker.sh logs -f         # Follow logs
    ./docker.sh shell           # Enter container shell
    ./docker.sh backup          # Create database backup

EOF
}

# Check if .env exists
check_env() {
    if [ ! -f "$SCRIPT_DIR/.env" ]; then
        print_warning ".env file not found"
        print_header "Creating .env from .env.example..."
        if [ -f "$SCRIPT_DIR/.env.example" ]; then
            cp "$SCRIPT_DIR/.env.example" "$SCRIPT_DIR/.env"
            print_success ".env created - PLEASE UPDATE WITH YOUR CREDENTIALS"
        else
            print_error ".env.example not found"
            exit 1
        fi
    fi
}

# Commands
cmd_up() {
    check_env
    print_header "Starting ${PROJECT_NAME} containers..."
    docker-compose up -d
    print_success "Containers started"
    print_header "Waiting for services to be healthy..."
    sleep 5
    cmd_status
}

cmd_down() {
    print_header "Stopping ${PROJECT_NAME} containers..."
    docker-compose down
    print_success "Containers stopped"
}

cmd_logs() {
    print_header "Showing logs..."
    docker-compose logs -f --tail=100 "$@"
}

cmd_logs_app() {
    docker-compose logs -f --tail=100 app
}

cmd_logs_db() {
    docker-compose logs -f --tail=100 db
}

cmd_restart() {
    print_header "Restarting containers..."
    docker-compose restart
    print_success "Containers restarted"
}

cmd_rebuild() {
    print_header "Rebuilding Docker image..."
    docker-compose build --no-cache
    print_success "Image rebuilt"
}

cmd_shell() {
    print_header "Entering app container shell..."
    docker-compose exec app sh
}

cmd_psql() {
    print_header "Connecting to PostgreSQL..."
    source .env
    docker-compose exec db psql -U "${DB_USER}" -d "${DB_NAME}"
}

cmd_backup() {
    print_header "Creating database backup..."
    source .env
    BACKUP_FILE="backups/backup_$(date +%Y%m%d_%H%M%S).sql"
    mkdir -p backups
    docker-compose exec -T db pg_dump -U "${DB_USER}" -d "${DB_NAME}" > "$BACKUP_FILE"
    print_success "Backup created: $BACKUP_FILE"
}

cmd_restore() {
    if [ -z "$1" ]; then
        print_error "Please specify backup file: ./docker.sh restore [file]"
        exit 1
    fi

    if [ ! -f "$1" ]; then
        print_error "Backup file not found: $1"
        exit 1
    fi

    print_warning "This will replace the current database. Continue? (yes/no)"
    read -r response
    if [ "$response" != "yes" ]; then
        print_error "Restore cancelled"
        exit 1
    fi

    print_header "Restoring database from backup..."
    source .env
    docker-compose exec -T db psql -U "${DB_USER}" -d "${DB_NAME}" < "$1"
    print_success "Database restored"
}

cmd_clean() {
    print_warning "This will delete all containers and volumes (including database data)!"
    print_warning "Continue? (yes/no)"
    read -r response
    if [ "$response" != "yes" ]; then
        print_error "Cancelled"
        exit 1
    fi

    print_header "Removing containers and volumes..."
    docker-compose down -v
    print_success "Cleanup complete"
}

cmd_status() {
    print_header "Container Status:"
    docker-compose ps
}

cmd_health() {
    print_header "Health Status:"
    docker-compose ps --format "table {{.Names}}\t{{.Status}}"
}

# Main script
case "${1:-help}" in
    up)
        cmd_up
        ;;
    down)
        cmd_down
        ;;
    logs)
        shift
        cmd_logs "$@"
        ;;
    logs-app)
        cmd_logs_app
        ;;
    logs-db)
        cmd_logs_db
        ;;
    restart)
        cmd_restart
        ;;
    rebuild)
        cmd_rebuild
        ;;
    shell)
        cmd_shell
        ;;
    psql)
        cmd_psql
        ;;
    backup)
        cmd_backup
        ;;
    restore)
        cmd_restore "$2"
        ;;
    clean)
        cmd_clean
        ;;
    status)
        cmd_status
        ;;
    health)
        cmd_health
        ;;
    help)
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac
