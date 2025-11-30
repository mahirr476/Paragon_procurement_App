/**
 * Integration Test Setup
 * 
 * This file runs before all integration tests.
 * It sets up the test database and ensures everything is ready.
 */

import { setupTestDatabase, teardownTestDatabase, isTestDatabaseAvailable } from './test-db-setup'

// Setup before all integration tests
beforeAll(async () => {
  console.log('🔧 Setting up integration test database...')
  
  // Check if database is available
  const isAvailable = await isTestDatabaseAvailable()
  if (!isAvailable) {
    console.error('\n❌ Test database is not available!')
    console.error('\n📋 Setup Instructions:')
    console.error('1. Start Docker Desktop')
    console.error('2. Start database: docker-compose -f docker-compose.dev.yml up -d db')
    console.error('3. Create test database: docker exec -it procurement-db-dev psql -U postgres -c "CREATE DATABASE procurement_db_test;"')
    console.error('4. Run migrations: DATABASE_URL="postgresql://postgres:postgres@localhost:5434/procurement_db_test?schema=public" npx prisma migrate deploy')
    console.error('5. Run tests: npm run test:integration\n')
    throw new Error('Test database not available. See instructions above.')
  }
  
  await setupTestDatabase()
  console.log('✅ Integration test database ready')
})

// Teardown after all integration tests
afterAll(async () => {
  console.log('🧹 Cleaning up integration test database...')
  await teardownTestDatabase()
  console.log('✅ Integration test database cleaned up')
})

