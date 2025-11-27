import {
  analyzeSpendBySupplier,
  analyzeSpendByCategory,
  analyzeSpendTrend,
} from '../../lib/report-analytics'
import type { PurchaseOrder } from '../../lib/types'

const createPO = (overrides: Partial<PurchaseOrder> = {}): PurchaseOrder => ({
  id: overrides.id || 'PO-1',
  date: overrides.date || '15/03/24',
  supplier: overrides.supplier || 'Supplier A',
  orderNo: 'PO-001',
  refNo: 'REF-001',
  dueDate: '20/03/24',
  branch: 'Branch A',
  requisitionType: 'Type A',
  itemLedgerGroup: overrides.itemLedgerGroup || 'Category A',
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
  totalAmount: overrides.totalAmount ?? 2000,
  status: 'Approved',
  deliveryType: 'Type A',
  openPO: 'Yes',
  openPONo: 'PO-001',
  uploadedAt: new Date().toISOString(),
  isApproved: true,
  ...overrides,
})

describe('Report Analytics Tests (lib/report-analytics.ts)', () => {
  // ============================================
  // ESSENTIAL: Spend by Supplier (CSV Data Accuracy)
  // ============================================
  describe('analyzeSpendBySupplier - CSV Data Accuracy', () => {
    test('calculates correctly: 10 orders from Supplier A, total ₹100,000 → avg ₹10,000', () => {
      const pos: PurchaseOrder[] = []
      for (let i = 0; i < 10; i++) {
        pos.push(createPO({ id: `PO-${i}`, supplier: 'Supplier A', totalAmount: 10000 }))
      }

      const results = analyzeSpendBySupplier(pos)

      expect(results.length).toBe(1)
      expect(results[0].supplier).toBe('Supplier A')
      expect(results[0].amount).toBe(100000)
      expect(results[0].orderCount).toBe(10)
    })

    test('multiple suppliers → each calculated correctly from CSV data', () => {
      const pos = [
        createPO({ supplier: 'Supplier A', totalAmount: 5000 }),
        createPO({ supplier: 'Supplier A', totalAmount: 5000 }),
        createPO({ supplier: 'Supplier B', totalAmount: 3000 }),
      ]

      const results = analyzeSpendBySupplier(pos)

      expect(results.length).toBe(2)
      expect(results[0].supplier).toBe('Supplier A')
      expect(results[0].amount).toBe(10000)
      expect(results[1].supplier).toBe('Supplier B')
      expect(results[1].amount).toBe(3000)
    })

    test('result sorted by total spend DESC', () => {
      const pos = [
        createPO({ supplier: 'Supplier B', totalAmount: 5000 }),
        createPO({ supplier: 'Supplier A', totalAmount: 10000 }),
      ]

      const results = analyzeSpendBySupplier(pos)

      expect(results[0].supplier).toBe('Supplier A')
      expect(results[0].amount).toBe(10000)
      expect(results[1].supplier).toBe('Supplier B')
    })
  })

  // ============================================
  // ESSENTIAL: Spend by Category (CSV Data Accuracy)
  // ============================================
  describe('analyzeSpendByCategory - CSV Data Accuracy', () => {
    test('groups by itemLedgerGroup and sums totals correctly', () => {
      const pos = [
        createPO({ itemLedgerGroup: 'Category A', totalAmount: 5000 }),
        createPO({ itemLedgerGroup: 'Category A', totalAmount: 5000 }),
        createPO({ itemLedgerGroup: 'Category B', totalAmount: 3000 }),
      ]

      const results = analyzeSpendByCategory(pos)

      expect(results.length).toBe(2)
      expect(results[0].category).toBe('Category A')
      expect(results[0].amount).toBe(10000)
      expect(results[0].orderCount).toBe(2)
    })
  })

  // ============================================
  // ESSENTIAL: Spend Trends (CSV Data Accuracy)
  // ============================================
  describe('analyzeSpendTrend - CSV Data Accuracy', () => {
    test('groups by month and sums amounts correctly from CSV dates', () => {
      // Use ISO date format that new Date() can parse
      const pos = [
        createPO({ date: '2024-03-15', totalAmount: 2000 }),
        createPO({ date: '2024-03-16', totalAmount: 3000 }),
        createPO({ date: '2024-04-15', totalAmount: 4000 }),
      ]

      const results = analyzeSpendTrend(pos, 'monthly')

      expect(results.length).toBe(2)
      expect(results[0].period).toBe('2024-03')
      expect(results[0].amount).toBe(5000) // 2000 + 3000
      expect(results[1].period).toBe('2024-04')
      expect(results[1].amount).toBe(4000)
    })

    test('sorts chronologically (oldest first)', () => {
      // Use ISO date format that new Date() can parse
      const pos = [
        createPO({ date: '2024-04-15', totalAmount: 4000 }),
        createPO({ date: '2024-03-15', totalAmount: 2000 }),
      ]

      const results = analyzeSpendTrend(pos, 'monthly')

      expect(results.length).toBe(2)
      expect(results[0].period).toBe('2024-03')
      expect(results[1].period).toBe('2024-04')
    })
  })
})

