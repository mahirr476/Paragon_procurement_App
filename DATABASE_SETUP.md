# Database Setup Instructions

This application uses Prisma ORM with PostgreSQL (Neon) in a microservice architecture.

## Quick Start

The Neon integration is already connected and DATABASE_URL is configured. Follow these steps:

### 1. Generate Prisma Client

\`\`\`bash
npx prisma generate
\`\`\`

This creates the Prisma client based on your schema.

### 2. Create Database Tables

Run the SQL script to create all necessary tables:

\`\`\`bash
npx prisma db execute --file ./scripts/setup-database.sql --schema ./prisma/schema.prisma
\`\`\`

Or manually run the `scripts/setup-database.sql` file in your Neon database console.

### 3. Verify Setup

Check that tables were created:

\`\`\`bash
npx prisma studio
\`\`\`

This opens Prisma Studio where you can view and manage your database.

## Database Structure

The microservice architecture includes:

- **Auth Service** (`/api/auth/*`) - User authentication and management
- **PO Service** (`/api/pos`) - Purchase order management  
- **Chat Service** (`/api/chat/*`) - AI chat sessions and messages
- **Notifications Service** (`/api/notifications`) - User notifications
- **Tutorials Service** (`/api/tutorials`) - Tutorial progress tracking
- **Theme Service** (`/api/theme`) - User theme preferences

## Tables Created

1. `users` - User accounts
2. `purchase_orders` - Procurement data
3. `chat_sessions` - Chat conversations
4. `chat_messages` - Individual messages
5. `notifications` - User notifications
6. `tutorials` - Tutorial completion tracking
7. `themes` - User theme preferences

## Fallback Behavior

Without a database connection, the API routes use in-memory storage that doesn't persist between server restarts. Once you run the setup, all data will persist in PostgreSQL.

## Environment Variables (Already Set)

Your Neon integration provides:
- `DATABASE_URL` - Primary connection string
- `POSTGRES_URL` - Alternative connection string
- Plus additional Neon-specific variables

No additional configuration needed!
