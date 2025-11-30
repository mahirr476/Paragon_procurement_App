/**
 * @jest-environment node
 * 
 * Integration Test: Upload Flow
 * 
 * This test verifies the complete upload workflow from CSV to database.
 * NO MOCKS - Uses real database and real API calls.
 */

import { getTestPrismaClient, cleanDatabase } from './test-db-setup'
import { parseCSV } from '../../lib/csv-parser'
import { POST, GET } from '../../app/api/pos/route'
import { NextRequest } from 'next/server'
import type { PurchaseOrder } from '../../lib/types'

describe('Integration Test: Upload Flow (Real Database)', () => {
  const prisma = getTestPrismaClient()

  // Clean database before each test
  beforeEach(async () => {
    await cleanDatabase()
  })

  // Clean database after all tests
  afterAll(async () => {
    await cleanDatabase()
  })

  // ============================================
  // Test: Complete CSV Upload Workflow
  // ============================================
  test('complete upload workflow: CSV → Parse → API → Database → Retrieve', async () => {
    // Step 1: Parse CSV file (real parsing, no mocks)
    const sampleCSV = `Date,Supplier,Order No.,Ref No.,Due Date,Branch,Requisition Type,Item/Ledger Group,Item,Min Qty,Max Qty,Unit,Rate,Delivery Date,CGST,SGST,IGST,VAT,Last Approved Rate,Last Supplier,Broker,Total Amount,Status,Delivery Type,Open PO,Open PO No.
15/03/24,ABC Corp,PO-001,REF-001,20/03/24,Branch A,Type A,Group A,Item A,10,20,KG,100.50,25/03/24,9,9,0,0,95.50,ABC Corp,Broker A,2000.00,Pending,Type A,Yes,PO-001
16/03/24,XYZ Ltd,PO-002,REF-002,21/03/24,Branch B,Type B,Group B,Item B,15,25,KG,200.75,26/03/24,9,9,0,0,190.75,XYZ Ltd,Broker B,4000.50,Pending,Type B,Yes,PO-002`

    const parsedPOs = parseCSV(sampleCSV)
    
    // Verify CSV parsing worked
    expect(parsedPOs.length).toBe(2)
    expect(parsedPOs[0].supplier).toBe('ABC Corp')
    expect(parsedPOs[0].orderNo).toBe('PO-001')
    expect(parsedPOs[0].rate).toBe(100.5)
    expect(parsedPOs[0].totalAmount).toBe(2000)
    expect(parsedPOs[1].supplier).toBe('XYZ Ltd')
    expect(parsedPOs[1].totalAmount).toBe(4000.5)

    // Step 2: Save to database via API (real API call, real database)
    const request = new NextRequest('http://localhost/api/pos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ pos: parsedPOs }),
    })

    const response = await POST(request)
    const responseData = await response.json()

    // Verify API response
    expect(response.status).toBe(200)
    expect(responseData.success).toBe(true)
    expect(responseData.count).toBe(2)

    // Step 3: Verify data is actually in the database (real database query)
    const dbPOs = await prisma.purchaseOrder.findMany({
      where: {
        orderNo: { in: ['PO-001', 'PO-002'] },
      },
      orderBy: { orderNo: 'asc' },
    })

    // Verify database contains the data
    expect(dbPOs.length).toBe(2)

    // Verify first PO data integrity
    const dbPO1 = dbPOs.find(po => po.orderNo === 'PO-001')
    expect(dbPO1).toBeDefined()
    expect(dbPO1?.supplier).toBe('ABC Corp')
    expect(dbPO1?.rate).toBe(100.5)
    expect(dbPO1?.totalAmount).toBe(2000)
    expect(dbPO1?.isApproved).toBe(false)
    expect(dbPO1?.status).toBe('Pending')

    // Verify second PO data integrity
    const dbPO2 = dbPOs.find(po => po.orderNo === 'PO-002')
    expect(dbPO2).toBeDefined()
    expect(dbPO2?.supplier).toBe('XYZ Ltd')
    expect(dbPO2?.rate).toBe(200.75)
    expect(dbPO2?.totalAmount).toBe(4000.5)

    // Step 4: Retrieve via API (real API call)
    const getRequest = new NextRequest('http://localhost/api/pos?approved=false', {
      method: 'GET',
    })

    const getResponse = await GET(getRequest)
    const getData = await getResponse.json()

    // Verify API returns the data
    expect(getResponse.status).toBe(200)
    expect(getData.success).toBe(true)
    expect(getData.pos.length).toBeGreaterThanOrEqual(2)

    // Verify the uploaded POs are in the API response
    const apiPO1 = getData.pos.find((po: PurchaseOrder) => po.orderNo === 'PO-001')
    const apiPO2 = getData.pos.find((po: PurchaseOrder) => po.orderNo === 'PO-002')

    expect(apiPO1).toBeDefined()
    expect(apiPO1.supplier).toBe('ABC Corp')
    expect(apiPO1.totalAmount).toBe(2000)

    expect(apiPO2).toBeDefined()
    expect(apiPO2.supplier).toBe('XYZ Ltd')
    expect(apiPO2.totalAmount).toBe(4000.5)
  })

  // ============================================
  // Test: Data Integrity - CSV values match database
  // ============================================
  test('data integrity: CSV values exactly match database values', async () => {
    const csv = `Date,Supplier,Order No.,Ref No.,Due Date,Branch,Requisition Type,Item/Ledger Group,Item,Min Qty,Max Qty,Unit,Rate,Delivery Date,CGST,SGST,IGST,VAT,Last Approved Rate,Last Supplier,Broker,Total Amount,Status,Delivery Type,Open PO,Open PO No.
15/03/24,Test Supplier,PO-TEST-001,REF-TEST,20/03/24,Branch Test,Type Test,Group Test,Test Item,100,200,KG,123.45,25/03/24,9,9,0,0,120.00,Test Supplier,Test Broker,12345.67,Pending,Standard,Yes,PO-TEST-001`

    const parsedPOs = parseCSV(csv)
    expect(parsedPOs.length).toBe(1)

    const csvPO = parsedPOs[0]

    // Save to database
    const request = new NextRequest('http://localhost/api/pos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ pos: [csvPO] }),
    })

    await POST(request)

    // Retrieve from database
    const dbPO = await prisma.purchaseOrder.findUnique({
      where: { id: csvPO.id },
    })

    expect(dbPO).toBeDefined()

    // Verify every field matches exactly
    expect(dbPO?.date).toBe(csvPO.date)
    expect(dbPO?.supplier).toBe(csvPO.supplier)
    expect(dbPO?.orderNo).toBe(csvPO.orderNo)
    expect(dbPO?.refNo).toBe(csvPO.refNo)
    expect(dbPO?.dueDate).toBe(csvPO.dueDate)
    expect(dbPO?.branch).toBe(csvPO.branch)
    expect(dbPO?.item).toBe(csvPO.item)
    expect(dbPO?.minQty).toBe(csvPO.minQty)
    expect(dbPO?.maxQty).toBe(csvPO.maxQty)
    expect(dbPO?.unit).toBe(csvPO.unit)
    expect(dbPO?.rate).toBe(csvPO.rate)
    expect(dbPO?.totalAmount).toBe(csvPO.totalAmount)
    expect(dbPO?.cgst).toBe(csvPO.cgst)
    expect(dbPO?.sgst).toBe(csvPO.sgst)
    expect(dbPO?.igst).toBe(csvPO.igst)
    expect(dbPO?.vat).toBe(csvPO.vat)
  })

  // ============================================
  // Test: Multiple Uploads - Data Persistence
  // ============================================
  test('multiple uploads: data persists across API calls', async () => {
    // First upload
    const csv1 = `Date,Supplier,Order No.,Ref No.,Due Date,Branch,Requisition Type,Item/Ledger Group,Item,Min Qty,Max Qty,Unit,Rate,Delivery Date,CGST,SGST,IGST,VAT,Last Approved Rate,Last Supplier,Broker,Total Amount,Status,Delivery Type,Open PO,Open PO No.
15/03/24,Supplier A,PO-A-001,REF-A,20/03/24,Branch A,Type A,Group A,Item A,10,20,KG,100,25/03/24,9,9,0,0,95,Supplier A,Broker A,2000,Pending,Type A,Yes,PO-A-001`

    const pos1 = parseCSV(csv1)
    const request1 = new NextRequest('http://localhost/api/pos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pos: pos1 }),
    })

    await POST(request1)

    // Verify first upload
    const count1 = await prisma.purchaseOrder.count()
    expect(count1).toBe(1)

    // Second upload
    const csv2 = `Date,Supplier,Order No.,Ref No.,Due Date,Branch,Requisition Type,Item/Ledger Group,Item,Min Qty,Max Qty,Unit,Rate,Delivery Date,CGST,SGST,IGST,VAT,Last Approved Rate,Last Supplier,Broker,Total Amount,Status,Delivery Type,Open PO,Open PO No.
16/03/24,Supplier B,PO-B-001,REF-B,21/03/24,Branch B,Type B,Group B,Item B,15,25,KG,200,26/03/24,9,9,0,0,190,Supplier B,Broker B,4000,Pending,Type B,Yes,PO-B-001`

    const pos2 = parseCSV(csv2)
    const request2 = new NextRequest('http://localhost/api/pos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pos: pos2 }),
    })

    await POST(request2)

    // Verify both uploads persisted
    const count2 = await prisma.purchaseOrder.count()
    expect(count2).toBe(2)

    // Verify both POs are in database
    const allPOs = await prisma.purchaseOrder.findMany()
    expect(allPOs.length).toBe(2)
    expect(allPOs.some(po => po.orderNo === 'PO-A-001')).toBe(true)
    expect(allPOs.some(po => po.orderNo === 'PO-B-001')).toBe(true)
  })

  // ============================================
  // Test: Error Handling - Invalid Data
  // ============================================
  test('error handling: invalid data is rejected', async () => {
    // Try to save invalid data (empty array)
    const request = new NextRequest('http://localhost/api/pos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pos: [] }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toContain('No purchase orders provided')

    // Verify nothing was saved to database
    const count = await prisma.purchaseOrder.count()
    expect(count).toBe(0)
  })
})

