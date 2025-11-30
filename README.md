# Paragon Procurement App

A modern procurement management application built with Next.js, Prisma, and PostgreSQL.

## 🚀 Quick Start

### Prerequisites
- Docker Desktop installed and running
- No other services on ports 3000, 5434, or 5555

### Setup Steps

1. **Start all services:**
   ```bash
   docker-compose up -d --build
   ```

2. **Initialize the database:**
   ```bash
   docker-compose exec web npx prisma@5.22.0 db push
   ```

3. **Access the application:**
   - **Application**: http://localhost:3000
   - **Prisma Studio**: http://localhost:5555

That's it! ✅ Everything runs in Docker.

## 📋 Common Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View application logs
docker-compose logs -f web

# View database logs
docker-compose logs -f db

# Access Prisma Studio (if not already running)
docker-compose exec web npx prisma@5.22.0 studio --hostname 0.0.0.0

# Execute commands in the web container
docker-compose exec web sh
```

## 🏗️ Architecture

The application uses a microservice architecture with the following services:

- **Auth Service** (`/api/auth/*`) - User authentication and management
- **PO Service** (`/api/pos`) - Purchase order management  
- **Chat Service** (`/api/chat/*`) - AI chat sessions and messages
- **Notifications Service** (`/api/notifications`) - User notifications
- **Tutorials Service** (`/api/tutorials`) - Tutorial progress tracking
- **Theme Service** (`/api/theme`) - User theme preferences

## 🗄️ Database

The application uses PostgreSQL running in Docker. The database includes:

- `users` - User accounts
- `purchase_orders` - Procurement data
- `chat_sessions` - Chat conversations
- `chat_messages` - Individual messages
- `notifications` - User notifications
- `tutorials` - Tutorial completion tracking
- `themes` - User theme preferences

## 🔧 Development

For local development without Docker:

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Start development server
npm run dev
```

## 📚 Additional Documentation

- [Microservices Architecture](./README-MICROSERVICES.md) - Detailed architecture documentation
- [Database Setup](./DATABASE_SETUP.md) - Database configuration details

## 🐛 Troubleshooting

**Port conflicts:**
- Change ports in `docker-compose.yml` if 3000, 5434, or 5555 are already in use

**Database connection issues:**
- Ensure the `db` service is healthy: `docker-compose ps`
- Check logs: `docker-compose logs db`

**Prisma errors:**
- Regenerate Prisma client: `docker-compose exec web npx prisma@5.22.0 generate`
- Reset database: `docker-compose exec web npx prisma@5.22.0 db push --force-reset`

## 📝 License

Private - All rights reserved

