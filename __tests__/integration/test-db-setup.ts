/**
 * Test Database Setup Utilities
 * 
 * This file provides utilities for setting up and tearing down a real test database.
 * NO MOCKS - These functions interact with a real PostgreSQL database.
 */

import { PrismaClient } from '@prisma/client'

let prisma: PrismaClient | null = null

/**
 * Get or create a Prisma client instance for testing
 * Uses the DATABASE_URL from .env.test
 */
export function getTestPrismaClient(): PrismaClient {
  if (prisma) {
    return prisma
  }

  // Ensure we're using the test database URL
  const testDbUrl = process.env.DATABASE_URL
  if (!testDbUrl) {
    throw new Error(
      'DATABASE_URL not found. Make sure .env.test file exists and contains DATABASE_URL.\n' +
      'Run: npm run test:integration\n' +
      'Or set up test database: docker-compose -f docker-compose.dev.yml up -d db'
    )
  }

  if (!testDbUrl.includes('test')) {
    console.warn(
      '⚠️  WARNING: DATABASE_URL does not contain "test". Make sure you are using a test database!'
    )
  }

  prisma = new PrismaClient({
    log: process.env.DEBUG ? ['query', 'error', 'warn'] : ['error'],
  })

  return prisma
}

/**
 * Check if test database is available
 */
export async function isTestDatabaseAvailable(): Promise<boolean> {
  try {
    const client = getTestPrismaClient()
    await client.$connect()
    await client.$disconnect()
    return true
  } catch (error) {
    return false
  }
}

/**
 * Clean all tables in the test database
 * This is called between tests to ensure a clean state
 */
export async function cleanDatabase(): Promise<void> {
  try {
    const client = getTestPrismaClient()
    await client.$connect()

    // Delete in order to respect foreign key constraints
    await client.chatMessage.deleteMany()
    await client.chatSession.deleteMany()
    await client.notification.deleteMany()
    await client.tutorial.deleteMany()
    await client.theme.deleteMany()
    await client.purchaseOrder.deleteMany()
    await client.user.deleteMany()
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    if (errorMessage.includes("Can't reach database server")) {
      throw new Error(
        '❌ Test database is not running!\n\n' +
        'To fix this:\n' +
        '1. Start Docker Desktop\n' +
        '2. Start the database: docker-compose -f docker-compose.dev.yml up -d db\n' +
        '3. Create test database: docker exec -it procurement-db-dev psql -U postgres -c "CREATE DATABASE procurement_db_test;"\n' +
        '4. Run migrations: DATABASE_URL="postgresql://postgres:postgres@localhost:5434/procurement_db_test?schema=public" npx prisma migrate deploy\n' +
        '5. Run tests again: npm run test:integration\n\n' +
        `Original error: ${errorMessage}`
      )
    }
    throw error
  }
}

/**
 * Setup test database - run migrations and ensure schema is up to date
 */
export async function setupTestDatabase(): Promise<void> {
  const client = getTestPrismaClient()

  try {
    // Verify connection
    await client.$connect()
    console.log('✅ Test database connected successfully')

    // Run migrations (Prisma will handle this automatically)
    // In a real scenario, you might want to run: npx prisma migrate deploy
    // For now, we'll rely on the schema being up to date
  } catch (error) {
    console.error('❌ Failed to setup test database:', error)
    throw error
  }
}

/**
 * Teardown test database - disconnect Prisma client
 */
export async function teardownTestDatabase(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect()
    prisma = null
    console.log('✅ Test database disconnected')
  }
}

/**
 * Execute a test with automatic database cleanup
 * Usage:
 *   await withCleanDatabase(async () => {
 *     // Your test code here
 *   })
 */
export async function withCleanDatabase<T>(
  testFn: () => Promise<T>
): Promise<T> {
  await cleanDatabase()
  try {
    return await testFn()
  } finally {
    await cleanDatabase()
  }
}

