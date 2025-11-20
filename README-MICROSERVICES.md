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

## Database Setup

1. Install PostgreSQL on your system
2. Create a database:
   \`\`\`bash
   createdb procurement_db
   \`\`\`

3. Copy `.env.example` to `.env` and update DATABASE_URL:
   \`\`\`
   DATABASE_URL="postgresql://username:password@localhost:5432/procurement_db?schema=public"
   \`\`\`

4. Run Prisma migrations:
   \`\`\`bash
   npx prisma migrate dev --name init
   \`\`\`

5. Generate Prisma Client:
   \`\`\`bash
   npx prisma generate
   \`\`\`

## Running the Application

\`\`\`bash
npm install
npm run dev
\`\`\`

## Prisma Studio

View and edit your database using Prisma Studio:

\`\`\`bash
npx prisma studio
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
