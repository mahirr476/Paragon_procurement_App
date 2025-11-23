# Microservices Architecture Migration

This application has been migrated from localStorage to a microservice architecture using Prisma ORM and PostgreSQL.

## Architecture Overview

The app now uses a microservice pattern with the following services:

### 1. Authentication Service (`/api/auth/*`)
- User registration, login, and profile management
- Endpoints: `/register`, `/login`, `/user`

### 2. Purchase Order Service (`/api/pos`)
- CRUD operations for purchase orders
- Approved/current PO management

### 3. Chat Service (`/api/chat/*`)
- Session and message management
- Endpoints: `/sessions`, `/messages`

### 4. Notification Service (`/api/notifications`)
- User notification management
- Mark as read, delete operations

### 5. Tutorial Service (`/api/tutorials`)
- Track tutorial completion status

### 6. Theme Service (`/api/theme`)
- User theme preferences

## Quick Start with Docker

### Prerequisites
- Docker Desktop installed and running
- No other services on ports 3000, 5433, or 5555

### Step 1: Start the Containers

\`\`\`bash
docker-compose up -d --build
\`\`\`

This starts:
- PostgreSQL database (port 5433)
- Next.js application (port 3000)
- Prisma Studio (port 5555)

### Step 2: Initialize the Database

Wait 10 seconds for containers to start, then:

\`\`\`bash
docker-compose exec web npx prisma@5.22.0 db push
\`\`\`

### Step 3: Access Your Application

Open your browser:
- **Application**: http://localhost:3000
- **Prisma Studio**: http://localhost:5555

**That's it!** ✅ Everything runs in Docker.

## Docker Commands

\`\`\`bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f web

# Access Prisma Studio (if not already running)
docker-compose exec web npx prisma@5.22.0 studio --hostname 0.0.0.0
\`\`\`

## API Testing

All API endpoints return JSON responses in the format:
\`\`\`json
{
  "success": boolean,
  "data": any,
  "error": string (if failed)
}
\`\`\`

## Migration Notes

- All localStorage calls have been replaced with API calls
- User sessions now use sessionStorage for client-side state
- Password hashing implemented with bcryptjs
- All dates are properly handled with PostgreSQL timestamps
- Foreign key relationships enforce data integrity
