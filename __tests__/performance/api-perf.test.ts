/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { POST, GET, PUT } from '@/app/api/pos/route'
import { getTestPrismaClient, cleanDatabase } from '../integration/test-db-setup'
import type { PurchaseOrder } from '@/lib/types'

describe('API Performance (Real Handlers + Test DB)', () => {
  const prisma = getTestPrismaClient()
  jest.setTimeout(15000)

  beforeEach(async () => {
    await cleanDatabase()
  })

  afterAll(async () => {
    await cleanDatabase()
    await prisma.$disconnect()
  })

  function createTestPO(overrides?: Partial<PurchaseOrder>): PurchaseOrder {
    return {
      id: 'PO-1',
      date: '15/03/24',
      supplier: 'Supplier A',
      orderNo: 'PO-1',
      refNo: 'REF-1',
      dueDate: '20/03/24',
      branch: 'Branch A',
      requisitionType: 'Type A',
      itemLedgerGroup: 'Group A',
      item: 'Item A',
      minQty: 10,
      maxQty: 20,
      unit: 'KG',
      rate: 100,
      deliveryDate: '25/03/24',
      cgst: 9,
      sgst: 9,
      igst: 0,
      vat: 0,
      lastApprovedRate: 95,
      lastSupplier: 'Supplier A',
      broker: 'Broker A',
      totalAmount: 2000,
      status: 'Pending',
      deliveryType: 'Type A',
      openPO: 'Yes',
      openPONo: 'PO-1',
      uploadedAt: new Date().toISOString(),
      isApproved: false,
      ...overrides,
    } as PurchaseOrder
  }

  test('saves 100 POs quickly via POST /api/pos', async () => {
    const pos = Array.from({ length: 100 }, (_, i) =>
      createTestPO({ id: `PO-${i}`, orderNo: `PO-${i}` }),
    )

    const start = Date.now()

    const request = new NextRequest('http://localhost/api/pos', {
      method: 'POST',
      body: JSON.stringify({ pos }),
      headers: {
        'Content-Type': 'application/json',
      },
    } as any)

    const response = await POST(request)
    const data = await response.json()
    const duration = Date.now() - start

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.count).toBe(100)
    expect(duration).toBeLessThan(5000) // Real DB insert under 5 seconds
  })

  test('fetches 1000 POs within reasonable time via GET /api/pos', async () => {
    const pos = Array.from({ length: 1000 }, (_, i) =>
      createTestPO({ id: `PO-${i}`, orderNo: `PO-${i}` }),
    )

    await prisma.purchaseOrder.createMany({ data: pos, skipDuplicates: true })

    const start = Date.now()

    const request = new NextRequest('http://localhost/api/pos?approved=false', {
      method: 'GET',
    } as any)

    const response = await GET(request)
    const data = await response.json()
    const duration = Date.now() - start

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.pos.length).toBeGreaterThanOrEqual(1000)
    expect(duration).toBeLessThan(5000) // Real DB fetch under 5 seconds
  })

  test('updates 100 POs quickly via PUT /api/pos', async () => {
    const pos = Array.from({ length: 100 }, (_, i) =>
      createTestPO({ id: `PO-${i}`, orderNo: `PO-${i}` }),
    )

    await prisma.purchaseOrder.createMany({ data: pos, skipDuplicates: true })

    const poIds = pos.map(p => p.id)

    const start = Date.now()

    const request = new NextRequest('http://localhost/api/pos', {
      method: 'PUT',
      body: JSON.stringify({ poIds, updates: { isApproved: true } }),
      headers: {
        'Content-Type': 'application/json',
      },
    } as any)

    const response = await PUT(request)
    const data = await response.json()
    const duration = Date.now() - start

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.count).toBe(100)
    expect(duration).toBeLessThan(5000) // Real DB update under 5 seconds

    const approvedCount = await prisma.purchaseOrder.count({
      where: { isApproved: true },
    })
    expect(approvedCount).toBe(100)
  })
})

