#!/bin/bash

echo "=================================="
echo "  Prisma Studio Launcher"
echo "=================================="
echo ""

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "ERROR: .env file not found!"
    echo "Please create a .env file with your DATABASE_URL"
    echo ""
    echo "Example:"
    echo 'DATABASE_URL="postgresql://user:pass@host.neon.tech/db?sslmode=require"'
    exit 1
fi

echo "Starting Prisma Studio..."
echo ""
echo "Prisma Studio will open at: http://localhost:5555"
echo "Press Ctrl+C to stop"
echo ""

# Run Prisma Studio
npx prisma studio

