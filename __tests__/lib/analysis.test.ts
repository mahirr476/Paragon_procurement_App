/**
 * @jest-environment node
 */
import { analyzeOrders } from '@/lib/analysis'
import type { PurchaseOrder } from '@/lib/types'

function createTestPO(overrides?: Partial<PurchaseOrder>): PurchaseOrder {
  return {
    id: 'PO-1',
    supplier: 'Supplier A',
    orderNo: 'PO-001',
    item: 'Item A',
    rate: 100,
    totalAmount: 2000,
    isApproved: false,
    ...overrides,
  } as PurchaseOrder
}

describe('Analysis Functions', () => {
  test('analyzeOrders detects price anomalies', () => {
    const currentPOs = [createTestPO({ rate: 200 })] // 100% increase
    const approvedPOs = [createTestPO({ rate: 100, id: 'PO-2', isApproved: true })]

    const results = analyzeOrders(currentPOs, approvedPOs)

    expect(results.length).toBeGreaterThan(0)
    expect(results.some(r => r.type === 'price_anomaly')).toBe(true)
  })

  test('analyzeOrders detects duplicates', () => {
    const currentPOs = [
      createTestPO({ id: 'PO-1', orderNo: 'PO-001', supplier: 'Supplier A', item: 'Item A' }),
      createTestPO({ id: 'PO-2', orderNo: 'PO-001', supplier: 'Supplier A', item: 'Item A' }),
    ]

    const results = analyzeOrders(currentPOs, [])

    expect(results.some(r => r.type === 'duplicate')).toBe(true)
  })

  test('analyzeOrders detects new supplier', () => {
    const currentPOs = [createTestPO({ supplier: 'New Supplier' })]
    const approvedPOs = [createTestPO({ supplier: 'Old Supplier', isApproved: true })]

    const results = analyzeOrders(currentPOs, approvedPOs)

    expect(results.some(r => r.type === 'risk_flag' && r.message.includes('New'))).toBe(true)
  })

  test('analyzeOrders detects high value orders', () => {
    const currentPOs = [createTestPO({ totalAmount: 600000 })] // Above 500k threshold
    const approvedPOs = []

    const results = analyzeOrders(currentPOs, approvedPOs)

    expect(results.some(r => r.type === 'risk_flag' && r.message.includes('High-value'))).toBe(true)
  })

  test('analyzeOrders returns empty array for empty input', () => {
    const results = analyzeOrders([], [])

    expect(results).toEqual([])
  })
})

