/**
 * @jest-environment node
 *
 * Real-world API performance test for /api/pos
 *
 * This test:
 *   - Parses a REAL CSV sample file
 *   - Sends POs through the real /api/pos POST handler
 *   - Reads them back via /api/pos GET
 *   - Measures end-to-end timings with a real test database
 */

import fs from 'fs'
import path from 'path'
import { NextRequest } from 'next/server'

import { getTestPrismaClient, cleanDatabase } from './test-db-setup'
import { parseCSV } from '../../lib/csv-parser'
import { POST, GET } from '../../app/api/pos/route'
import type { PurchaseOrder } from '../../lib/types'

describe('Real-World API Performance: /api/pos', () => {
  const prisma = getTestPrismaClient()

  jest.setTimeout(20000)

  let parsedPOs: PurchaseOrder[] = []

  beforeAll(async () => {
    await cleanDatabase()

    const csvPath = path.join(process.cwd(), 'csv_samples', 'sample-procurement-data.csv')
    const csvContent = fs.readFileSync(csvPath, 'utf-8')

    parsedPOs = parseCSV(csvContent)

    // Use a capped subset if the file is extremely large
    if (parsedPOs.length > 1000) {
      parsedPOs = parsedPOs.slice(0, 1000)
    }

    expect(parsedPOs.length).toBeGreaterThan(0)
  })

  afterAll(async () => {
    await cleanDatabase()
    await prisma.$disconnect()
  })

  test('POST + GET with real data complete within time budget', async () => {
    const postStart = Date.now()

    const postRequest = new NextRequest('http://localhost/api/pos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ pos: parsedPOs }),
    } as any)

    const postResponse = await POST(postRequest)
    const postData = await postResponse.json()
    const postDuration = Date.now() - postStart

    expect(postResponse.status).toBe(200)
    expect(postData.success).toBe(true)
    expect(postData.count).toBeGreaterThan(0)
    expect(postDuration).toBeLessThan(15_000) // Insert within 15 seconds

    const getStart = Date.now()

    const getRequest = new NextRequest('http://localhost/api/pos?approved=false', {
      method: 'GET',
    } as any)

    const getResponse = await GET(getRequest)
    const getData = await getResponse.json()
    const getDuration = Date.now() - getStart

    expect(getResponse.status).toBe(200)
    expect(getData.success).toBe(true)
    expect(Array.isArray(getData.pos)).toBe(true)
    expect(getData.pos.length).toBeGreaterThanOrEqual(postData.count)
    expect(getDuration).toBeLessThan(5_000) // Fetch within 5 seconds
  })
})


