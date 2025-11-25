import { analyzeOrders } from '../../lib/analysis'
import type { PurchaseOrder, AnalysisResult } from '../../lib/types'

const createPO = (overrides: Partial<PurchaseOrder> = {}): PurchaseOrder => ({
  id: overrides.id || `PO-${Date.now()}-${Math.random()}`,
  date: overrides.date || '15/03/24',
  supplier: overrides.supplier || 'Supplier A',
  orderNo: overrides.orderNo || 'PO-001',
  refNo: overrides.refNo || 'REF-001',
  dueDate: overrides.dueDate || '20/03/24',
  branch: overrides.branch || 'Branch A',
  requisitionType: overrides.requisitionType || 'Type A',
  itemLedgerGroup: overrides.itemLedgerGroup || 'Group A',
  item: overrides.item || 'Item A',
  minQty: overrides.minQty ?? 10,
  maxQty: overrides.maxQty ?? 20,
  unit: overrides.unit || 'KG',
  rate: overrides.rate ?? 100,
  deliveryDate: overrides.deliveryDate || '25/03/24',
  cgst: overrides.cgst ?? 9,
  sgst: overrides.sgst ?? 9,
  igst: overrides.igst ?? 0,
  vat: overrides.vat ?? 0,
  lastApprovedRate: overrides.lastApprovedRate ?? 95,
  lastSupplier: overrides.lastSupplier || 'Supplier A',
  broker: overrides.broker || 'Broker A',
  totalAmount: overrides.totalAmount ?? 2000,
  status: overrides.status || 'Pending',
  deliveryType: overrides.deliveryType || 'Type A',
  openPO: overrides.openPO || 'Yes',
  openPONo: overrides.openPONo || 'PO-001',
  uploadedAt: overrides.uploadedAt || new Date().toISOString(),
  isApproved: overrides.isApproved ?? false,
  ...overrides,
})

describe('Data Analysis Tests (lib/analysis.ts)', () => {
  // ============================================
  // ESSENTIAL: Price Anomaly Detection
  // ============================================
  describe('Price Anomaly Detection (checkPriceAnomalies)', () => {
    test('flags CRITICAL severity for 50%+ price increase', () => {
      const currentPO = createPO({ id: 'PO-1', item: 'Item A', rate: 151 }) // > 50% increase
      const approvedPOs = [
        createPO({ item: 'Item A', rate: 100, isApproved: true }),
        createPO({ item: 'Item A', rate: 100, isApproved: true }),
      ]

      const results = analyzeOrders([currentPO], approvedPOs)
      const priceAnomaly = results.find(r => r.type === 'price_anomaly' && r.poId === 'PO-1')

      expect(priceAnomaly).toBeDefined()
      expect(priceAnomaly?.severity).toBe('critical')
      expect(priceAnomaly?.message).toContain('51')
    })

    test('flags HIGH severity for 35-50% price increase', () => {
      const currentPO = createPO({ id: 'PO-1', item: 'Item A', rate: 140 })
      const approvedPOs = [
        createPO({ item: 'Item A', rate: 100, isApproved: true }),
        createPO({ item: 'Item A', rate: 100, isApproved: true }),
      ]

      const results = analyzeOrders([currentPO], approvedPOs)
      const priceAnomaly = results.find(r => r.type === 'price_anomaly' && r.poId === 'PO-1')

      expect(priceAnomaly).toBeDefined()
      expect(priceAnomaly?.severity).toBe('high')
      expect(priceAnomaly?.message).toContain('40')
    })

    test('flags MEDIUM severity for 20-35% price increase', () => {
      const currentPO = createPO({ id: 'PO-1', item: 'Item A', rate: 125 })
      const approvedPOs = [
        createPO({ item: 'Item A', rate: 100, isApproved: true }),
        createPO({ item: 'Item A', rate: 100, isApproved: true }),
      ]

      const results = analyzeOrders([currentPO], approvedPOs)
      const priceAnomaly = results.find(r => r.type === 'price_anomaly' && r.poId === 'PO-1')

      expect(priceAnomaly).toBeDefined()
      expect(priceAnomaly?.severity).toBe('medium')
      expect(priceAnomaly?.message).toContain('25')
    })

    test('does not flag for 10% price increase (below threshold)', () => {
      const currentPO = createPO({ id: 'PO-1', item: 'Item A', rate: 110 })
      const approvedPOs = [
        createPO({ item: 'Item A', rate: 100, isApproved: true }),
        createPO({ item: 'Item A', rate: 100, isApproved: true }),
      ]

      const results = analyzeOrders([currentPO], approvedPOs)
      const priceAnomaly = results.find(r => r.type === 'price_anomaly' && r.poId === 'PO-1')

      expect(priceAnomaly).toBeUndefined()
    })

    test('does not flag for 10% price decrease', () => {
      const currentPO = createPO({ id: 'PO-1', item: 'Item A', rate: 90 })
      const approvedPOs = [
        createPO({ item: 'Item A', rate: 100, isApproved: true }),
        createPO({ item: 'Item A', rate: 100, isApproved: true }),
      ]

      const results = analyzeOrders([currentPO], approvedPOs)
      const priceAnomaly = results.find(r => r.type === 'price_anomaly' && r.poId === 'PO-1')

      expect(priceAnomaly).toBeUndefined()
    })

    test('flags as "No historical data" when no approved orders exist', () => {
      const currentPO = createPO({ id: 'PO-1', item: 'Item A', rate: 100 })
      const approvedPOs: PurchaseOrder[] = []

      const results = analyzeOrders([currentPO], approvedPOs)
      const priceAnomaly = results.find(r => r.type === 'price_anomaly' && r.poId === 'PO-1')

      expect(priceAnomaly).toBeDefined()
      expect(priceAnomaly?.severity).toBe('low')
      expect(priceAnomaly?.message).toContain('No historical price data')
      expect(priceAnomaly?.details.reason).toBe('no_baseline')
    })

    test('flags as issue when historical average rate is 0', () => {
      const currentPO = createPO({ id: 'PO-1', item: 'Item A', rate: 100 })
      const approvedPOs = [
        createPO({ item: 'Item A', rate: 0, isApproved: true }),
        createPO({ item: 'Item A', rate: 0, isApproved: true }),
      ]

      const results = analyzeOrders([currentPO], approvedPOs)
      const priceAnomaly = results.find(r => r.type === 'price_anomaly' && r.poId === 'PO-1')

      expect(priceAnomaly).toBeDefined()
      expect(priceAnomaly?.severity).toBe('medium')
      expect(priceAnomaly?.message).toContain('Historical average rate is ₹0')
      expect(priceAnomaly?.details.reason).toBe('zero_baseline')
    })

    test('calculates correctly with single historical record', () => {
      const currentPO = createPO({ id: 'PO-1', item: 'Item A', rate: 151 }) // > 50% increase
      const approvedPOs = [
        createPO({ item: 'Item A', rate: 100, isApproved: true }),
      ]

      const results = analyzeOrders([currentPO], approvedPOs)
      const priceAnomaly = results.find(r => r.type === 'price_anomaly' && r.poId === 'PO-1')

      expect(priceAnomaly).toBeDefined()
      expect(priceAnomaly?.severity).toBe('critical')
      expect(priceAnomaly?.details.avgRate).toBe(100)
      expect(priceAnomaly?.details.currentRate).toBe(151)
    })

    test('matches items with exact name match', () => {
      const currentPO = createPO({ id: 'PO-1', item: 'Item A', rate: 150 })
      const approvedPOs = [
        createPO({ item: 'Item A', rate: 100, isApproved: true }),
      ]

      const results = analyzeOrders([currentPO], approvedPOs)
      const priceAnomaly = results.find(r => r.type === 'price_anomaly' && r.poId === 'PO-1')

      expect(priceAnomaly).toBeDefined()
    })

    test('matches items case-insensitively', () => {
      const currentPO = createPO({ id: 'PO-1', item: 'ITEM A', rate: 150 })
      const approvedPOs = [
        createPO({ item: 'item a', rate: 100, isApproved: true }),
      ]

      const results = analyzeOrders([currentPO], approvedPOs)
      const priceAnomaly = results.find(r => r.type === 'price_anomaly' && r.poId === 'PO-1')

      expect(priceAnomaly).toBeDefined()
    })

    test('matches items with partial name match', () => {
      const currentPO = createPO({ id: 'PO-1', item: 'Item A Large', rate: 150 })
      const approvedPOs = [
        createPO({ item: 'Item A', rate: 100, isApproved: true }),
      ]

      const results = analyzeOrders([currentPO], approvedPOs)
      const priceAnomaly = results.find(r => r.type === 'price_anomaly' && r.poId === 'PO-1')

      expect(priceAnomaly).toBeDefined()
    })

    test('flags as "new item" when no matching item found', () => {
      const currentPO = createPO({ id: 'PO-1', item: 'New Item X', rate: 100 })
      const approvedPOs = [
        createPO({ item: 'Item A', rate: 100, isApproved: true }),
        createPO({ item: 'Item B', rate: 100, isApproved: true }),
      ]

      const results = analyzeOrders([currentPO], approvedPOs)
      const priceAnomaly = results.find(r => r.type === 'price_anomaly' && r.poId === 'PO-1')

      expect(priceAnomaly).toBeDefined()
      expect(priceAnomaly?.severity).toBe('low')
      expect(priceAnomaly?.message).toContain('first order')
    })
  })

  // ============================================
  // ESSENTIAL: Duplicate Detection
  // ============================================
  describe('Duplicate Detection (checkDuplicates)', () => {
    test('finds duplicate when orderNo + supplier + item match', () => {
      const currentPOs = [
        createPO({ id: 'PO-1', orderNo: 'PO-001', supplier: 'Supplier A', item: 'Item A' }),
        createPO({ id: 'PO-2', orderNo: 'PO-001', supplier: 'Supplier A', item: 'Item A' }),
      ]

      const results = analyzeOrders(currentPOs, [])
      const duplicates = results.filter(r => r.type === 'duplicate')

      expect(duplicates.length).toBeGreaterThan(0)
      expect(duplicates.some(d => d.poId === 'PO-1' || d.poId === 'PO-2')).toBe(true)
    })

    test('does not flag as duplicate when orderNo matches but supplier differs', () => {
      const currentPOs = [
        createPO({ id: 'PO-1', orderNo: 'PO-001', supplier: 'Supplier A', item: 'Item A' }),
        createPO({ id: 'PO-2', orderNo: 'PO-001', supplier: 'Supplier B', item: 'Item A' }),
      ]

      const results = analyzeOrders(currentPOs, [])
      const duplicates = results.filter(r => r.type === 'duplicate')

      expect(duplicates.length).toBe(0)
    })

    test('does not flag as duplicate when supplier + item match but orderNo differs', () => {
      const currentPOs = [
        createPO({ id: 'PO-1', orderNo: 'PO-001', supplier: 'Supplier A', item: 'Item A' }),
        createPO({ id: 'PO-2', orderNo: 'PO-002', supplier: 'Supplier A', item: 'Item A' }),
      ]

      const results = analyzeOrders(currentPOs, [])
      const duplicates = results.filter(r => r.type === 'duplicate')

      expect(duplicates.length).toBe(0)
    })

    test('flags all duplicates when 3+ identical orders exist', () => {
      const currentPOs = [
        createPO({ id: 'PO-1', orderNo: 'PO-001', supplier: 'Supplier A', item: 'Item A' }),
        createPO({ id: 'PO-2', orderNo: 'PO-001', supplier: 'Supplier A', item: 'Item A' }),
        createPO({ id: 'PO-3', orderNo: 'PO-001', supplier: 'Supplier A', item: 'Item A' }),
      ]

      const results = analyzeOrders(currentPOs, [])
      const duplicates = results.filter(r => r.type === 'duplicate')

      expect(duplicates.length).toBeGreaterThan(0)
    })

    test('returns array of duplicate PO IDs in details', () => {
      const currentPOs = [
        createPO({ id: 'PO-1', orderNo: 'PO-001', supplier: 'Supplier A', item: 'Item A' }),
        createPO({ id: 'PO-2', orderNo: 'PO-001', supplier: 'Supplier A', item: 'Item A' }),
      ]

      const results = analyzeOrders(currentPOs, [])
      const duplicate = results.find(r => r.type === 'duplicate')

      expect(duplicate).toBeDefined()
      expect(duplicate?.details.duplicateIds).toBeDefined()
      expect(Array.isArray(duplicate?.details.duplicateIds)).toBe(true)
    })

    test('includes count of duplicates in message', () => {
      const currentPOs = [
        createPO({ id: 'PO-1', orderNo: 'PO-001', supplier: 'Supplier A', item: 'Item A' }),
        createPO({ id: 'PO-2', orderNo: 'PO-001', supplier: 'Supplier A', item: 'Item A' }),
      ]

      const results = analyzeOrders(currentPOs, [])
      const duplicate = results.find(r => r.type === 'duplicate')

      expect(duplicate).toBeDefined()
      expect(duplicate?.message).toContain('match')
    })

    test('sets severity to HIGH for duplicates', () => {
      const currentPOs = [
        createPO({ id: 'PO-1', orderNo: 'PO-001', supplier: 'Supplier A', item: 'Item A' }),
        createPO({ id: 'PO-2', orderNo: 'PO-001', supplier: 'Supplier A', item: 'Item A' }),
      ]

      const results = analyzeOrders(currentPOs, [])
      const duplicate = results.find(r => r.type === 'duplicate')

      expect(duplicate).toBeDefined()
      expect(duplicate?.severity).toBe('high')
    })
  })

  // ============================================
  // ESSENTIAL: Supplier Pattern Analysis
  // ============================================
  describe('Supplier Pattern Analysis (analyzeSupplierPatterns)', () => {
    test('flags order when value is 2x supplier average (>100% difference)', () => {
      const currentPO = createPO({ 
        id: 'PO-1', 
        supplier: 'Supplier A', 
        totalAmount: 2001 // > 100% above 1000 average
      })
      const approvedPOs = [
        createPO({ supplier: 'Supplier A', totalAmount: 1000, isApproved: true }),
        createPO({ supplier: 'Supplier A', totalAmount: 1000, isApproved: true }),
        createPO({ supplier: 'Supplier A', totalAmount: 1000, isApproved: true }),
        createPO({ supplier: 'Supplier A', totalAmount: 1000, isApproved: true }),
        createPO({ supplier: 'Supplier A', totalAmount: 1000, isApproved: true }),
        createPO({ supplier: 'Supplier A', totalAmount: 1000, isApproved: true }),
      ]

      const results = analyzeOrders([currentPO], approvedPOs)
      const pattern = results.find(r => r.type === 'pattern' && r.poId === 'PO-1')

      expect(pattern).toBeDefined()
      expect(pattern?.severity).toBe('medium')
    })

    test('does not flag when value is 1.5x supplier average (<100% difference)', () => {
      const currentPO = createPO({ 
        id: 'PO-1', 
        supplier: 'Supplier A', 
        totalAmount: 1500 // 50% above average, but code requires >100%
      })
      const approvedPOs = [
        createPO({ supplier: 'Supplier A', totalAmount: 1000, isApproved: true }),
        createPO({ supplier: 'Supplier A', totalAmount: 1000, isApproved: true }),
        createPO({ supplier: 'Supplier A', totalAmount: 1000, isApproved: true }),
        createPO({ supplier: 'Supplier A', totalAmount: 1000, isApproved: true }),
        createPO({ supplier: 'Supplier A', totalAmount: 1000, isApproved: true }),
        createPO({ supplier: 'Supplier A', totalAmount: 1000, isApproved: true }),
      ]

      const results = analyzeOrders([currentPO], approvedPOs)
      const pattern = results.find(r => r.type === 'pattern' && r.poId === 'PO-1')

      expect(pattern).toBeUndefined() // Code requires >100% difference
    })

    test('does not flag when order value equals supplier average', () => {
      const currentPO = createPO({ 
        id: 'PO-1', 
        supplier: 'Supplier A', 
        totalAmount: 1000 
      })
      const approvedPOs = [
        createPO({ supplier: 'Supplier A', totalAmount: 1000, isApproved: true }),
        createPO({ supplier: 'Supplier A', totalAmount: 1000, isApproved: true }),
        createPO({ supplier: 'Supplier A', totalAmount: 1000, isApproved: true }),
        createPO({ supplier: 'Supplier A', totalAmount: 1000, isApproved: true }),
        createPO({ supplier: 'Supplier A', totalAmount: 1000, isApproved: true }),
        createPO({ supplier: 'Supplier A', totalAmount: 1000, isApproved: true }),
      ]

      const results = analyzeOrders([currentPO], approvedPOs)
      const pattern = results.find(r => r.type === 'pattern' && r.poId === 'PO-1')

      expect(pattern).toBeUndefined()
    })

    test('requires 5+ historical orders to analyze (skips with 4 orders)', () => {
      const currentPO = createPO({ 
        id: 'PO-1', 
        supplier: 'Supplier A', 
        totalAmount: 3000 
      })
      const approvedPOs = [
        createPO({ supplier: 'Supplier A', totalAmount: 100, isApproved: true }),
        createPO({ supplier: 'Supplier A', totalAmount: 100, isApproved: true }),
        createPO({ supplier: 'Supplier A', totalAmount: 100, isApproved: true }),
        createPO({ supplier: 'Supplier A', totalAmount: 100, isApproved: true }),
      ]

      const results = analyzeOrders([currentPO], approvedPOs)
      const pattern = results.find(r => r.type === 'pattern' && r.poId === 'PO-1')

      expect(pattern).toBeUndefined()
    })

    test('calculates correctly: historical [100, 100, 100], current 300 → 200% above avg', () => {
      const currentPO = createPO({ 
        id: 'PO-1', 
        supplier: 'Supplier A', 
        totalAmount: 300 
      })
      const approvedPOs = [
        createPO({ supplier: 'Supplier A', totalAmount: 100, isApproved: true }),
        createPO({ supplier: 'Supplier A', totalAmount: 100, isApproved: true }),
        createPO({ supplier: 'Supplier A', totalAmount: 100, isApproved: true }),
        createPO({ supplier: 'Supplier A', totalAmount: 100, isApproved: true }),
        createPO({ supplier: 'Supplier A', totalAmount: 100, isApproved: true }),
        createPO({ supplier: 'Supplier A', totalAmount: 100, isApproved: true }),
      ]

      const results = analyzeOrders([currentPO], approvedPOs)
      const pattern = results.find(r => r.type === 'pattern' && r.poId === 'PO-1')

      expect(pattern).toBeDefined()
      expect(pattern?.message).toContain('200')
    })

    test('skips new supplier (no historical data)', () => {
      const currentPO = createPO({ 
        id: 'PO-1', 
        supplier: 'New Supplier', 
        totalAmount: 1000 
      })
      const approvedPOs: PurchaseOrder[] = []

      const results = analyzeOrders([currentPO], approvedPOs)
      const pattern = results.find(r => r.type === 'pattern' && r.poId === 'PO-1')

      expect(pattern).toBeUndefined()
    })
  })

  // ============================================
  // ESSENTIAL: Risk Identification
  // ============================================
  describe('Risk Identification (identifyRisks)', () => {
    test('flags new supplier not found in approved history', () => {
      const currentPO = createPO({ 
        id: 'PO-1', 
        supplier: 'New Supplier X' 
      })
      const approvedPOs = [
        createPO({ supplier: 'Supplier A', isApproved: true }),
        createPO({ supplier: 'Supplier B', isApproved: true }),
      ]

      const results = analyzeOrders([currentPO], approvedPOs)
      const risk = results.find(r => r.type === 'risk_flag' && r.poId === 'PO-1' && r.message.includes('New'))

      expect(risk).toBeDefined()
      expect(risk?.severity).toBe('medium')
      expect(risk?.message).toContain('New/Unverified supplier')
    })

    test('does not flag supplier that exists in approved history', () => {
      const currentPO = createPO({ 
        id: 'PO-1', 
        supplier: 'Supplier A' 
      })
      const approvedPOs = [
        createPO({ supplier: 'Supplier A', isApproved: true }),
        createPO({ supplier: 'Supplier B', isApproved: true }),
      ]

      const results = analyzeOrders([currentPO], approvedPOs)
      const risk = results.find(r => r.type === 'risk_flag' && r.poId === 'PO-1' && r.message.includes('New'))

      expect(risk).toBeUndefined()
    })

    test('flags high-value order when total amount > ₹500,000', () => {
      const currentPO = createPO({ 
        id: 'PO-1', 
        totalAmount: 600000 
      })
      const approvedPOs: PurchaseOrder[] = []

      const results = analyzeOrders([currentPO], approvedPOs)
      const risk = results.find(r => r.type === 'risk_flag' && r.poId === 'PO-1' && r.message.includes('High-value'))

      expect(risk).toBeDefined()
      expect(risk?.severity).toBe('high')
      expect(risk?.message).toContain('High-value order')
    })

    test('does not flag when total amount = ₹500,000 (code uses > not >=)', () => {
      const currentPO = createPO({ 
        id: 'PO-1', 
        totalAmount: 500000 // Code checks > 500000, not >=
      })
      const approvedPOs: PurchaseOrder[] = []

      const results = analyzeOrders([currentPO], approvedPOs)
      const risk = results.find(r => r.type === 'risk_flag' && r.poId === 'PO-1' && r.message.includes('High-value'))

      expect(risk).toBeUndefined() // Code uses > 500000, not >=
    })

    test('does not flag when total amount < ₹500,000', () => {
      const currentPO = createPO({ 
        id: 'PO-1', 
        totalAmount: 400000 
      })
      const approvedPOs: PurchaseOrder[] = []

      const results = analyzeOrders([currentPO], approvedPOs)
      const risk = results.find(r => r.type === 'risk_flag' && r.poId === 'PO-1' && r.message.includes('High-value'))

      expect(risk).toBeUndefined()
    })

    test('flags rate increase when 11% higher than last approved', () => {
      const currentPO = createPO({ 
        id: 'PO-1', 
        rate: 111,
        lastApprovedRate: 100 
      })
      const approvedPOs: PurchaseOrder[] = []

      const results = analyzeOrders([currentPO], approvedPOs)
      const risk = results.find(r => r.type === 'risk_flag' && r.poId === 'PO-1' && r.message.includes('Rate increased'))

      expect(risk).toBeDefined()
      expect(risk?.severity).toBe('medium')
      expect(risk?.message).toContain('11')
    })

    test('does not flag when rate is 10% higher than last approved', () => {
      const currentPO = createPO({ 
        id: 'PO-1', 
        rate: 110,
        lastApprovedRate: 100 
      })
      const approvedPOs: PurchaseOrder[] = []

      const results = analyzeOrders([currentPO], approvedPOs)
      const risk = results.find(r => r.type === 'risk_flag' && r.poId === 'PO-1' && r.message.includes('Rate increased'))

      expect(risk).toBeUndefined()
    })

    test('does not flag when rate is lower than last approved', () => {
      const currentPO = createPO({ 
        id: 'PO-1', 
        rate: 90,
        lastApprovedRate: 100 
      })
      const approvedPOs: PurchaseOrder[] = []

      const results = analyzeOrders([currentPO], approvedPOs)
      const risk = results.find(r => r.type === 'risk_flag' && r.poId === 'PO-1' && r.message.includes('Rate increased'))

      expect(risk).toBeUndefined()
    })

    test('skips rate check when no last approved rate', () => {
      const currentPO = createPO({ 
        id: 'PO-1', 
        rate: 150,
        lastApprovedRate: 0 
      })
      const approvedPOs: PurchaseOrder[] = []

      const results = analyzeOrders([currentPO], approvedPOs)
      const risk = results.find(r => r.type === 'risk_flag' && r.poId === 'PO-1' && r.message.includes('Rate increased'))

      expect(risk).toBeUndefined()
    })
  })

  // ============================================
  // ESSENTIAL: Full Analysis Integration
  // ============================================
  describe('Full Analysis Integration (analyzeOrders)', () => {
    test('runs all checks on multiple POs', () => {
      const currentPOs = [
        createPO({ id: 'PO-1', item: 'Item A', rate: 150 }),
        createPO({ id: 'PO-2', orderNo: 'PO-001', supplier: 'Supplier A', item: 'Item B' }),
        createPO({ id: 'PO-3', orderNo: 'PO-001', supplier: 'Supplier A', item: 'Item B' }),
      ]
      const approvedPOs = [
        createPO({ item: 'Item A', rate: 100, isApproved: true }),
      ]

      const results = analyzeOrders(currentPOs, approvedPOs)

      expect(results.length).toBeGreaterThan(0)
      expect(results.some(r => r.type === 'price_anomaly')).toBe(true)
      expect(results.some(r => r.type === 'duplicate')).toBe(true)
    })

    test('returns issues grouped by severity', () => {
      const currentPOs = [
        createPO({ id: 'PO-1', item: 'Item A', rate: 151 }), // Critical price anomaly (>50%)
        createPO({ id: 'PO-2', totalAmount: 600000 }), // High value risk
        createPO({ id: 'PO-3', supplier: 'New Supplier' }), // Medium new supplier risk
      ]
      const approvedPOs = [
        createPO({ item: 'Item A', rate: 100, isApproved: true }),
      ]

      const results = analyzeOrders(currentPOs, approvedPOs)

      const critical = results.filter(r => r.severity === 'critical')
      const high = results.filter(r => r.severity === 'high')
      const medium = results.filter(r => r.severity === 'medium')

      expect(critical.length).toBeGreaterThan(0)
      expect(high.length).toBeGreaterThan(0)
      expect(medium.length).toBeGreaterThan(0)
    })

    test('each issue has proper structure with all required fields', () => {
      const currentPO = createPO({ id: 'PO-1', item: 'Item A', rate: 150 })
      const approvedPOs = [
        createPO({ item: 'Item A', rate: 100, isApproved: true }),
      ]

      const results = analyzeOrders([currentPO], approvedPOs)
      const issue = results[0]

      expect(issue).toBeDefined()
      expect(issue).toHaveProperty('type')
      expect(issue).toHaveProperty('severity')
      expect(issue).toHaveProperty('message')
      expect(issue).toHaveProperty('poId')
      expect(issue).toHaveProperty('details')
      expect(typeof issue.type).toBe('string')
      expect(typeof issue.severity).toBe('string')
      expect(typeof issue.message).toBe('string')
      expect(typeof issue.poId).toBe('string')
      expect(typeof issue.details).toBe('object')
    })

    test('handles empty current orders array', () => {
      const results = analyzeOrders([], [])

      expect(results).toEqual([])
    })

    test('handles empty approved orders array', () => {
      const currentPO = createPO({ id: 'PO-1', item: 'New Item', rate: 100 })
      const results = analyzeOrders([currentPO], [])

      expect(results.length).toBeGreaterThan(0)
      // Should flag as no historical data
      expect(results.some(r => r.type === 'price_anomaly' && r.severity === 'low')).toBe(true)
    })
  })
})

