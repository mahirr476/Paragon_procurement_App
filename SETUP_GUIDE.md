# 🚀 Complete Setup Guide - Paragon Procurement App

Complete guide for Prisma, Database, and Docker setup.

---

## 📋 Table of Contents

1. [Quick Start with Docker](#-quick-start-with-docker-recommended)
2. [Prisma Studio - Database Viewer](#-prisma-studio---database-viewer)
3. [Docker Commands Reference](#-docker-commands-reference)
4. [Database Management](#-database-management)
5. [Troubleshooting](#-troubleshooting)

---

## 🐳 Quick Start with Docker (Recommended)

### Prerequisites
- Docker Desktop installed and running
- No other services on ports 3000, 5433, or 5555

### Step 1: Start the Containers

```powershell
docker-compose -f docker-compose.local.yml up -d --build
```

This starts:
- PostgreSQL database (port 5433)
- Next.js application (port 3000)
- Prisma Studio access (port 5555)

### Step 2: Initialize the Database

Wait 10 seconds for containers to start, then:

```powershell
docker-compose -f docker-compose.local.yml exec web npx prisma@5.22.0 db push
```

### Step 3: Access Your Application

Open your browser:
- **Application**: http://localhost:3000
- **Prisma Studio**: See section below

**That's it!** ✅ Everything runs in Docker.

---

## 📊 Prisma Studio - Database Viewer

Prisma Studio is a visual database browser to view and edit your data.

### Open Prisma Studio

```powershell
docker-compose -f docker-compose.local.yml exec web npx prisma@5.22.0 studio --hostname 0.0.0.0
```

Then open: **http://localhost:5555**

### What You'll See

**Left Sidebar:** All your tables
- users
- purchase_orders
- chat_sessions
- chat_messages
- notifications
- tutorials
- themes

**Main Panel:** View, add, edit, or delete records

**Features:**
- ✅ Visual interface - no SQL required
- ✅ Real-time data from your database
- ✅ Easy editing with clicks
- ✅ Search and filter records
- ✅ Navigate relationships

### Stop Prisma Studio

Press `Ctrl+C` in the terminal

---

## 🔧 Docker Commands Reference

### View Logs

```powershell
# All services
docker-compose -f docker-compose.local.yml logs -f

# Only app
docker-compose -f docker-compose.local.yml logs -f web

# Only database
docker-compose -f docker-compose.local.yml logs -f db
```

### Stop Everything

```powershell
docker-compose -f docker-compose.local.yml down
```

### Start Everything

```powershell
docker-compose -f docker-compose.local.yml up -d
```

### Restart App

```powershell
docker-compose -f docker-compose.local.yml restart web
```

### Check Running Containers

```powershell
docker-compose -f docker-compose.local.yml ps
```

### Access Container Shell

```powershell
docker-compose -f docker-compose.local.yml exec web sh
```

### Health Check

Open: http://localhost:3000/api/health

Should return:
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2025-11-23T10:00:00.000Z"
}
```

---

## 🗃️ Database Management

### View Database in Prisma Studio

```powershell
docker-compose -f docker-compose.local.yml exec web npx prisma@5.22.0 studio --hostname 0.0.0.0
```

Open: http://localhost:5555

### Reset Database (Delete All Data)

```powershell
docker-compose -f docker-compose.local.yml exec web npx prisma@5.22.0 db push --force-reset
```

### Backup Database

```powershell
docker exec procurement-db pg_dump -U postgres procurement_db > backup.sql
```

### Restore Database

```powershell
docker exec -i procurement-db psql -U postgres procurement_db < backup.sql
```

### Database Credentials

**From Host Machine:**
- Host: `localhost`
- Port: `5433`
- Database: `procurement_db`
- Username: `postgres`
- Password: `postgres`

**Connection String (Host):**
```
postgresql://postgres:postgres@localhost:5433/procurement_db?schema=public
```

**From Docker Container:**
- Host: `db`
- Port: `5432`
- Database: `procurement_db`
- Username: `postgres`
- Password: `postgres`

**Connection String (Container):**
```
postgresql://postgres:postgres@db:5432/procurement_db?schema=public
```

---

## 🛠️ Troubleshooting

### Port Already in Use

**Problem:** Port 3000, 5433, or 5555 is already in use

**Solution:** Edit `docker-compose.local.yml` and change ports:

```yaml
ports:
  - "3001:3000"  # Change 3000 to 3001
  - "5434:5432"  # Change 5433 to 5434
  - "5556:5555"  # Change 5555 to 5556
```

### Container Won't Start

```powershell
# Check logs for errors
docker-compose -f docker-compose.local.yml logs

# Remove everything and start fresh
docker-compose -f docker-compose.local.yml down -v
docker-compose -f docker-compose.local.yml up -d --build
```

### Database Connection Failed

```powershell
# Verify DATABASE_URL inside container
docker-compose -f docker-compose.local.yml exec web env | findstr DATABASE_URL

# Should show: postgresql://postgres:postgres@db:5432/procurement_db?schema=public
```

**If it shows `localhost:5432`:**
1. Make sure you don't have a `.env` file (rename it to `.env.backup`)
2. Rebuild: `docker-compose -f docker-compose.local.yml up -d --build`

### Can't Access Prisma Studio

Make sure to use `--hostname 0.0.0.0`:

```powershell
docker-compose -f docker-compose.local.yml exec web npx prisma@5.22.0 studio --hostname 0.0.0.0
```

### Application Shows Errors

```powershell
# Check application logs
docker-compose -f docker-compose.local.yml logs -f web

# Restart application
docker-compose -f docker-compose.local.yml restart web
```

### Prisma Client Error

```powershell
# Regenerate Prisma client
docker-compose -f docker-compose.local.yml exec web npx prisma@5.22.0 generate

# Rebuild containers
docker-compose -f docker-compose.local.yml up -d --build web
```

---

## 🔄 Complete Fresh Start

If you want to start completely from scratch:

```powershell
# 1. Stop and remove everything (including data)
docker-compose -f docker-compose.local.yml down -v

# 2. Remove Docker images (optional)
docker rmi paragon_procurement_app-web postgres:16-alpine

# 3. Start fresh
docker-compose -f docker-compose.local.yml up -d --build

# 4. Wait 10 seconds, then initialize database
docker-compose -f docker-compose.local.yml exec web npx prisma@5.22.0 db push

# 5. Access application
# Open: http://localhost:3000
```

---

## ✅ Verification Checklist

After setup, verify everything works:

```powershell
# 1. Check containers are running
docker-compose -f docker-compose.local.yml ps
# Should show: procurement-db (healthy) and procurement-app (running)

# 2. Check logs for errors
docker-compose -f docker-compose.local.yml logs web | Select-String "error" -Context 2

# 3. Test database connection
docker-compose -f docker-compose.local.yml exec web env | findstr DATABASE_URL

# 4. Test health endpoint
curl http://localhost:3000/api/health

# 5. Open application
# Browser: http://localhost:3000

# 6. Open Prisma Studio
docker-compose -f docker-compose.local.yml exec web npx prisma@5.22.0 studio --hostname 0.0.0.0
# Browser: http://localhost:5555
```

---

## 📦 What's Running

| Service | Container | Port (Host) | Port (Container) | Purpose |
|---------|-----------|-------------|------------------|---------|
| PostgreSQL | `procurement-db` | 5433 | 5432 | Database server |
| Next.js App | `procurement-app` | 3000 | 3000 | Web application |
| Prisma Studio | (in web container) | 5555 | 5555 | Database viewer |

---

## 🎯 Daily Usage

### Start Working

```powershell
# Start everything
docker-compose -f docker-compose.local.yml up -d

# Check logs
docker-compose -f docker-compose.local.yml logs -f web
```

### Stop Working

```powershell
# Stop everything (data is preserved)
docker-compose -f docker-compose.local.yml down
```

### View Database

```powershell
# Open Prisma Studio
docker-compose -f docker-compose.local.yml exec web npx prisma@5.22.0 studio --hostname 0.0.0.0

# Browser: http://localhost:5555
```

### Update Code

```powershell
# After making code changes, rebuild
docker-compose -f docker-compose.local.yml up -d --build web

# View logs to verify
docker-compose -f docker-compose.local.yml logs -f web
```

---

## 🌐 URLs

- **Application**: http://localhost:3000
- **Health Check**: http://localhost:3000/api/health
- **Prisma Studio**: http://localhost:5555 (after running studio command)

---

## 💡 Pro Tips

1. **Keep logs open** while developing:
   ```powershell
   docker-compose -f docker-compose.local.yml logs -f web
   ```

2. **Use Prisma Studio** to quickly inspect data instead of writing SQL queries

3. **Health check endpoint** (`/api/health`) helps verify database connectivity

4. **Data persists** between restarts unless you use `-v` flag with `down` command

5. **Always use `npx prisma@5.22.0`** to ensure correct Prisma version

---

## 📝 Summary

**To setup (first time):**
1. `docker-compose -f docker-compose.local.yml up -d --build`
2. Wait 10 seconds
3. `docker-compose -f docker-compose.local.yml exec web npx prisma@5.22.0 db push`
4. Open http://localhost:3000

**Daily usage:**
- Start: `docker-compose -f docker-compose.local.yml up -d`
- Stop: `docker-compose -f docker-compose.local.yml down`
- Logs: `docker-compose -f docker-compose.local.yml logs -f web`
- Studio: `docker-compose -f docker-compose.local.yml exec web npx prisma@5.22.0 studio --hostname 0.0.0.0`

**Everything runs in Docker** - no local database or Node.js setup needed! 🚀

