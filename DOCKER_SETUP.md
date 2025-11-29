# Docker Setup with Live Reload

This project supports both development and production Docker setups.

## Development Mode (with Live Reload)

### Quick Start

```bash
# Start development environment with live reload
npm run docker:dev

# Or rebuild and start
npm run docker:dev:build

# Stop development environment
npm run docker:dev:down
```

### What's Included

The development setup includes:
- **Live Reload**: Code changes automatically reflect in the container
- **PostgreSQL Database**: Local database on port 5434
- **Prisma Studio**: Database GUI on http://localhost:5555
- **Next.js Dev Server**: Running on http://localhost:3000

### How Live Reload Works

1. **Volume Mounting**: Your source code is mounted into the container
   ```yaml
   volumes:
     - ./:/app
     - /app/node_modules
     - /app/.next
   ```

2. **File Watching**: Environment variables enable file polling
   ```yaml
   WATCHPACK_POLLING: "true"
   CHOKIDAR_USEPOLLING: "true"
   ```

3. **Development Server**: Uses `npm run dev` instead of production build

### Manual Docker Commands

```bash
# Build development containers
docker-compose -f docker-compose.dev.yml build

# Start in detached mode
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f web

# Stop containers
docker-compose -f docker-compose.dev.yml down

# Remove volumes (clean slate)
docker-compose -f docker-compose.dev.yml down -v
```

## Production Mode

### Quick Start

```bash
# Start production environment
npm run docker:prod

# Or rebuild and start
npm run docker:prod:build
```

### Production vs Development

| Feature | Development | Production |
|---------|------------|------------|
| Dockerfile | `Dockerfile.dev` | `Dockerfile` |
| Build | No build step | Multi-stage optimized build |
| Live Reload | ✅ Yes | ❌ No |
| Volume Mounting | ✅ Source code | ❌ Only built files |
| Server | `next dev` | `node server.js` |
| NODE_ENV | development | production |

## Database Access

### Using Prisma Studio

1. Prisma Studio runs automatically in both dev and prod setups
2. Access it at: http://localhost:5555
3. You can view and edit database records through the GUI

### Direct Database Connection

For development:
```bash
# Connect to PostgreSQL
docker exec -it procurement-db-dev psql -U postgres -d procurement_db
```

### Running Migrations

Development mode automatically runs migrations on startup. To manually run:

```bash
# Inside the web container
docker exec -it procurement-app-dev npx prisma migrate dev

# Or from your host machine (if you have dependencies installed)
npx prisma migrate dev
```

## Troubleshooting

### Live Reload Not Working

1. **Check file watching is enabled**:
   ```bash
   docker exec -it procurement-app-dev env | grep POLLING
   ```
   Should show `WATCHPACK_POLLING=true` and `CHOKIDAR_USEPOLLING=true`

2. **Restart the container**:
   ```bash
   docker-compose -f docker-compose.dev.yml restart web
   ```

3. **Check logs for errors**:
   ```bash
   docker-compose -f docker-compose.dev.yml logs -f web
   ```

### Port Conflicts

If ports 3000, 5434, or 5555 are already in use:

1. Stop conflicting services
2. Or modify ports in `docker-compose.dev.yml`:
   ```yaml
   ports:
     - "3001:3000"  # Use port 3001 instead
   ```

### Container Won't Start

```bash
# Clean up everything and start fresh
docker-compose -f docker-compose.dev.yml down -v
docker system prune -f
npm run docker:dev:build
```

### Database Connection Issues

1. **Wait for database to be ready**: The healthcheck should handle this, but sometimes it needs more time
2. **Check DATABASE_URL**: Ensure it points to `db:5432` (internal Docker network)
3. **Verify database is running**:
   ```bash
   docker ps | grep procurement-db
   ```

## Files Overview

- `Dockerfile.dev` - Development Docker configuration
- `Dockerfile` - Production Docker configuration
- `docker-compose.dev.yml` - Development environment
- `docker-compose.local.yml` - Local production environment
- `docker-compose.yml` - Cloud production environment
- `.dockerignore` - Files excluded from Docker context

## Best Practices

1. **Use development mode for coding**: Faster iteration with live reload
2. **Test production build locally**: Run `npm run docker:prod` before deploying
3. **Keep volumes clean**: Periodically run `docker-compose down -v` to remove old data
4. **Monitor logs**: Use `docker-compose logs -f` to watch for issues
5. **Database backups**: Export important data before running `down -v`

## Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@db:5432/procurement_db?schema=public

# NextAuth
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000

# App
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

## Next Steps

1. Start development: `npm run docker:dev`
2. Make code changes - they'll reload automatically
3. Access your app: http://localhost:3000
4. View database: http://localhost:5555
5. Happy coding!
