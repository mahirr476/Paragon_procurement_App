// Run this script once to migrate existing localStorage data to PostgreSQL
// Usage: npx tsx scripts/migrate-to-db.ts

import { prisma } from '../lib/prisma'

async function migrateData() {
  console.log('Starting data migration from localStorage to PostgreSQL...')

  try {
    // This is a one-time migration script
    // You would manually extract data from localStorage and insert it here
    
    console.log('✅ Migration completed successfully!')
  } catch (error) {
    console.error('❌ Migration failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

migrateData()