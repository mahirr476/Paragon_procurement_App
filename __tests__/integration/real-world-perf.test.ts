/**
 * @jest-environment node
 *
 * Real-world integration + performance test
 *
 * This test uses a REAL CSV sample file and a REAL test database
 * to measure end-to-end performance of:
 *   CSV → Parser → Database (Prisma)
 *
 * It complements the synthetic performance tests in:
 *   - __tests__/performance/csv-parsing-perf.test.ts
 *   - __tests__/performance/api-perf.test.ts
 */

import fs from 'fs'
import path from 'path'

import { getTestPrismaClient, cleanDatabase } from './test-db-setup'
import { parseCSV } from '../../lib/csv-parser'
import type { PurchaseOrder } from '../../lib/types'

describe('Real-World Performance: CSV → Parser → Database', () => {
  const prisma = getTestPrismaClient()

  // Allow a bit more time because this uses a real database and file IO
  jest.setTimeout(20000)

  let parsedPOs: PurchaseOrder[] = []

  beforeAll(async () => {
    await cleanDatabase()

    const csvPath = path.join(process.cwd(), 'csv_samples', 'sample-procurement-data.csv')
    const csvContent = fs.readFileSync(csvPath, 'utf-8')

    const startParse = Date.now()
    parsedPOs = parseCSV(csvContent)
    const parseDuration = Date.now() - startParse

    // Basic sanity checks on parsed data
    expect(parsedPOs.length).toBeGreaterThan(0)

    // Real-world parse should still be comfortably fast
    expect(parseDuration).toBeLessThan(10_000) // < 10 seconds for full sample file
  })

  afterAll(async () => {
    await cleanDatabase()
    await prisma.$disconnect()
  })

  test('inserts all parsed POs into the database within time budget', async () => {
    const startInsert = Date.now()

    const result = await prisma.purchaseOrder.createMany({
      data: parsedPOs,
      skipDuplicates: true,
    })

    const insertDuration = Date.now() - startInsert

    // Ensure we actually inserted a meaningful number of records
    expect(result.count).toBeGreaterThan(0)

    // Real database insert should stay within a reasonable bound
    expect(insertDuration).toBeLessThan(15_000) // < 15 seconds for full sample file

    const dbCount = await prisma.purchaseOrder.count()

    // At minimum, all inserted rows should now exist
    expect(dbCount).toBeGreaterThanOrEqual(result.count)
  })
})


