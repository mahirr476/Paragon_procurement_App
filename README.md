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

---

## 🛠️ Tech Stack Overview

A detailed breakdown of every technology used in this application and how they fit together.

### Core Framework

| Technology | Version | Purpose |
|---|---|---|
| **Next.js** | 15.0.0 | Full-stack React framework (App Router) |
| **React** | 19 | UI library |
| **TypeScript** | 5 | Type-safe JavaScript |

The application is a **single Next.js monolith** using the App Router (`/app` directory). Next.js serves both the frontend pages and the backend API routes, eliminating the need for a separate server. The build output is set to `standalone` mode for optimized Docker deployments.

---

### Frontend

#### Styling

| Technology | Version | Purpose |
|---|---|---|
| **Tailwind CSS** | 3.4.17 | Utility-first CSS framework |
| **PostCSS** | 8.5 | CSS transformation pipeline |
| **Autoprefixer** | 10.4.20 | Automatic vendor prefixes |
| **tailwind-merge** | 2.5.5 | Intelligent Tailwind class merging |
| **tailwindcss-animate** | 1.0.7 | Animation utilities for Tailwind |
| **clsx** | 2.1.1 | Conditional class name construction |
| **class-variance-authority** | 0.7.1 | Component variant management |

Tailwind is configured with a class-based dark mode strategy and custom CSS variables for theming. The `cn()` utility (combining `clsx` and `tailwind-merge`) is used throughout for composing class names.

#### UI Component Library

| Technology | Purpose |
|---|---|
| **Radix UI** | Headless, accessible component primitives |
| **shadcn/ui** | Pre-built components on top of Radix UI |
| **Lucide React** | Icon library |
| **Recharts** | Charting and data visualization |
| **Embla Carousel** | Carousel/slider component |
| **Sonner** | Toast notifications |
| **React Day Picker** | Date picker component |
| **React Resizable Panels** | Resizable panel layouts |
| **Input OTP** | One-time password input |
| **Geist** | Vercel's design system font/utilities |

The UI is built on **shadcn/ui** — a component collection that wraps **Radix UI** primitives with Tailwind CSS styling. Over 20 Radix UI packages are installed, covering dialogs, dropdowns, popovers, tabs, tooltips, accordions, checkboxes, radio groups, switches, and more. All components are co-located in `/components/ui/`.

#### Form Handling

| Technology | Version | Purpose |
|---|---|---|
| **React Hook Form** | 7.54.1 | Performant form state management |
| **@hookform/resolvers** | 3.9.1 | Validation resolver integration |
| **Zod** | 3.24.1 | Schema-based runtime validation |

Forms use React Hook Form with Zod schemas for type-safe validation. The `@hookform/resolvers` package bridges the two libraries.

#### State Management

No external state management library (Redux, Zustand, etc.) is used. The app relies on:

- **React hooks** (`useState`, `useEffect`, `useCallback`) for component state
- **sessionStorage** for the current user session
- **localStorage** for tutorial progress and UI preferences
- **URL search params** for active section/page tracking
- Direct API calls from components for server state

---

### Backend

#### API Architecture

The backend is organized as REST API routes inside `/app/api/`, following a microservice-like pattern:

| Endpoint | Methods | Description |
|---|---|---|
| `/api/auth/register` | POST | User registration with bcrypt password hashing |
| `/api/auth/login` | POST | User authentication |
| `/api/auth/user` | GET, PUT, DELETE | User profile management |
| `/api/pos` | GET, POST, PUT, DELETE | Bulk purchase order CRUD |
| `/api/chat/sessions` | GET, POST, PUT, DELETE | AI chat session management |
| `/api/chat/messages` | POST | Add messages to chat sessions |
| `/api/notifications` | GET, POST, PUT, DELETE | User notification management |
| `/api/tutorials` | GET, POST, DELETE | Tutorial progress tracking |
| `/api/theme` | GET, POST | User theme preferences |
| `/api/analyze` | POST | AI-powered procurement analysis |
| `/api/health` | GET | Application health check |

#### Database

| Technology | Version | Purpose |
|---|---|---|
| **PostgreSQL** | 16 (Alpine) | Relational database |
| **Prisma** | 5.22.0 | ORM and database toolkit |

PostgreSQL runs in Docker. Prisma handles schema management, migrations, and type-safe database queries. The Prisma client is generated with the `linux-musl-openssl-3.0.x` binary target for Alpine Linux compatibility.

**Database schema** (7 tables):

- **users** — Accounts with email, hashed password, company, and role
- **purchase_orders** — Full procurement records (supplier, quantities, rates, taxes, approval status, etc.)
- **chat_sessions** — AI conversation sessions linked to users
- **chat_messages** — Individual messages within chat sessions
- **notifications** — Typed alerts with severity levels
- **tutorials** — Per-user tutorial completion tracking
- **themes** — User theme preferences (default: "cyberpunk")

All foreign keys cascade on delete. The `users` table uses CUID primary keys.

#### Authentication

| Technology | Purpose |
|---|---|
| **bcryptjs** | Password hashing |
| **sessionStorage** | Client-side session persistence |

Authentication is implemented manually (no NextAuth.js). Passwords are hashed with bcrypt and validated against requirements: minimum 8 characters, uppercase, lowercase, number, and special character. User sessions are stored in the browser's `sessionStorage`.

---

### AI Integration

| Provider | SDK / Method | Models | Role |
|---|---|---|---|
| **Anthropic Claude** | @anthropic-ai/sdk v0.24.3 | claude-3-haiku, claude-3.5-sonnet, claude-3-sonnet, claude-3-opus | Primary AI provider |
| **Google Gemini** | REST API | gemini-2.5-flash | Free-tier fallback |
| **Groq** | REST API | llama-3.3-70b, mixtral-8x7b, llama-3.1-8b | Fast inference fallback |
| **Vercel AI SDK** | "ai" package | — | Streaming AI responses |

The `/api/analyze` endpoint implements a **multi-provider fallback strategy**: it attempts Claude first (best quality), falls back to Gemini (free), then Groq (fast). This ensures AI analysis remains available even if one provider is down or unconfigured.

---

### Testing

| Technology | Version | Purpose |
|---|---|---|
| **Jest** | 29.7.0 | Test runner |
| **ts-jest** | 29.1.0 | TypeScript support for Jest |
| **jest-environment-jsdom** | 29.7.0 | Browser-like DOM environment |
| **@testing-library/react** | 14.0.0 | React component testing |
| **@testing-library/user-event** | 14.5.0 | User interaction simulation |
| **@testing-library/jest-dom** | 6.1.0 | Custom DOM matchers |

Tests are organized under `/__tests__/` by category: `api/`, `lib/`, `components/`, `integration/`, `e2e/`, `performance/`, and `database/`. Coverage thresholds are set at **80%** for branches, functions, lines, and statements.

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

---

### Containerization & Deployment

#### Docker

The application uses a **multi-stage Dockerfile** for optimized production builds:

1. **deps** — Installs `node_modules` and generates the Prisma client
2. **builder** — Builds the Next.js application
3. **runner** — Minimal production image (Alpine-based, non-root user)

#### Docker Compose Services

| Service | Image | Port | Purpose |
|---|---|---|---|
| **web** | Built from Dockerfile | 3000 | Next.js application |
| **db** | postgres:16-alpine | 5434 → 5432 | PostgreSQL database |
| **prisma** | node:18-bullseye-slim | 5565 | Prisma Studio (DB admin) |

Three compose variants are available:
- `docker-compose.yml` — Production
- `docker-compose.dev.yml` — Development (hot reload)
- `docker-compose.local.yml` — Local testing

All services include health checks. The `web` service depends on `db` being healthy before starting.

#### Analytics

| Technology | Version | Purpose |
|---|---|---|
| **Vercel Analytics** | 1.3.1 | Production performance monitoring |

---

### Project Structure

```
Paragon_procurement_App/
├── app/                    # Next.js App Router
│   ├── api/                # REST API routes
│   │   ├── auth/           # Authentication endpoints
│   │   ├── pos/            # Purchase order endpoints
│   │   ├── chat/           # Chat session & message endpoints
│   │   ├── notifications/  # Notification endpoints
│   │   ├── tutorials/      # Tutorial endpoints
│   │   ├── theme/          # Theme preference endpoints
│   │   ├── analyze/        # AI analysis endpoint
│   │   └── health/         # Health check endpoint
│   ├── login/              # Login page
│   ├── register/           # Registration page
│   └── (app pages)         # Dashboard, upload, reports, etc.
├── components/             # React components
│   └── ui/                 # shadcn/ui component library
├── hooks/                  # Custom React hooks
├── lib/                    # Utilities, types, Prisma client
├── prisma/                 # Schema and migrations
├── __tests__/              # Test suites (API, components, e2e, etc.)
├── public/                 # Static assets
├── styles/                 # Global CSS
├── scripts/                # Utility scripts
├── csv_samples/            # Sample CSV files for testing
├── docker-compose.yml      # Production compose
├── docker-compose.dev.yml  # Development compose
├── docker-compose.local.yml# Local compose
├── Dockerfile              # Multi-stage production build
└── package.json            # Dependencies and scripts
```

---

### NPM Scripts Reference

| Script | Command | Description |
|---|---|---|
| `dev` | `next dev` | Start development server |
| `build` | `next build` | Production build |
| `start` | `next start` | Start production server |
| `lint` | `eslint .` | Run linter |
| `postinstall` | `prisma generate` | Auto-generate Prisma client |
| `test` | `jest` | Run test suite |
| `test:watch` | `jest --watch` | Tests in watch mode |
| `test:coverage` | `jest --coverage` | Tests with coverage report |
| `docker:dev` | `docker-compose -f docker-compose.dev.yml up` | Start dev environment |
| `docker:dev:build` | `docker-compose -f docker-compose.dev.yml up --build` | Rebuild dev environment |
| `docker:prod` | `docker-compose -f docker-compose.local.yml up` | Start local prod environment |

