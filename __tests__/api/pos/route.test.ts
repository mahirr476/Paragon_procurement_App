/**
 * @jest-environment node
 */
import { GET, POST, PUT, DELETE } from '../../../app/api/pos/route'
import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    purchaseOrder: {
      findMany: jest.fn(),
      createMany: jest.fn(),
      updateMany: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
}))

const mockedPrisma = prisma as jest.Mocked<typeof prisma>

describe('API /api/pos', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // ============================================
  // ESSENTIAL: GET /api/pos (Fetch POs)
  // ============================================
  describe('GET /api/pos', () => {
    test('fetches approved POs when approved=true', async () => {
      const mockPOs = [
        {
          id: 'PO-1',
          supplier: 'ABC Corp',
          orderNo: 'PO-001',
          totalAmount: 2000,
          isApproved: true,
          uploadedAt: new Date('2024-03-15'),
        },
        {
          id: 'PO-2',
          supplier: 'XYZ Ltd',
          orderNo: 'PO-002',
          totalAmount: 4000,
          isApproved: true,
          uploadedAt: new Date('2024-03-16'),
        },
      ]

      mockedPrisma.purchaseOrder.findMany.mockResolvedValue(mockPOs as any)

      const url = new URL('http://localhost/api/pos?approved=true')
      const request = new NextRequest(url)

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(Array.isArray(data.pos)).toBe(true)
      expect(data.pos.length).toBe(2)
      expect(data.pos[0].supplier).toBe('ABC Corp')
      expect(data.pos[0].isApproved).toBe(true)

      expect(mockedPrisma.purchaseOrder.findMany).toHaveBeenCalledWith({
        where: { isApproved: true },
        orderBy: { uploadedAt: 'desc' },
      })
    })

    test('fetches pending POs when approved=false', async () => {
      const mockPOs = [
        {
          id: 'PO-3',
          supplier: 'DEF Inc',
          orderNo: 'PO-003',
          totalAmount: 3000,
          isApproved: false,
          uploadedAt: new Date('2024-03-17'),
        },
      ]

      mockedPrisma.purchaseOrder.findMany.mockResolvedValue(mockPOs as any)

      const url = new URL('http://localhost/api/pos?approved=false')
      const request = new NextRequest(url)

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.pos.length).toBe(1)
      expect(data.pos[0].isApproved).toBe(false)

      expect(mockedPrisma.purchaseOrder.findMany).toHaveBeenCalledWith({
        where: { isApproved: false },
        orderBy: { uploadedAt: 'desc' },
      })
    })

    test('returns empty array when no POs exist', async () => {
      mockedPrisma.purchaseOrder.findMany.mockResolvedValue([])

      const url = new URL('http://localhost/api/pos?approved=true')
      const request = new NextRequest(url)

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.pos).toEqual([])
    })

    test('handles database errors gracefully', async () => {
      mockedPrisma.purchaseOrder.findMany.mockRejectedValue(
        new Error('Database connection failed')
      )

      const url = new URL('http://localhost/api/pos?approved=true')
      const request = new NextRequest(url)

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.pos).toEqual([])
      expect(data.error).toBeDefined()
    })
  })

  // ============================================
  // ESSENTIAL: POST /api/pos (Save POs)
  // ============================================
  describe('POST /api/pos', () => {
    test('saves single PO successfully', async () => {
      const mockPO = {
        id: 'PO-1',
        date: '15/03/24',
        supplier: 'ABC Corp',
        orderNo: 'PO-001',
        refNo: 'REF-001',
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
        lastSupplier: 'ABC Corp',
        broker: 'Broker A',
        totalAmount: 2000,
        status: 'Pending',
        deliveryType: 'Type A',
        openPO: 'Yes',
        openPONo: 'PO-001',
        uploadedAt: new Date().toISOString(),
        isApproved: false,
      }

      mockedPrisma.purchaseOrder.createMany.mockResolvedValue({ count: 1 } as any)

      const request = new NextRequest('http://localhost/api/pos', {
        method: 'POST',
        body: JSON.stringify({ pos: [mockPO] }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.count).toBe(1)

      expect(mockedPrisma.purchaseOrder.createMany).toHaveBeenCalledWith({
        data: [mockPO],
        skipDuplicates: true,
      })
    })

    test('saves multiple POs successfully', async () => {
      const mockPOs = [
        {
          id: 'PO-1',
          supplier: 'ABC Corp',
          orderNo: 'PO-001',
          totalAmount: 2000,
          isApproved: false,
          // ... other required fields
          date: '15/03/24',
          refNo: 'REF-001',
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
          lastSupplier: 'ABC Corp',
          broker: 'Broker A',
          status: 'Pending',
          deliveryType: 'Type A',
          openPO: 'Yes',
          openPONo: 'PO-001',
          uploadedAt: new Date().toISOString(),
        },
        {
          id: 'PO-2',
          supplier: 'XYZ Ltd',
          orderNo: 'PO-002',
          totalAmount: 4000,
          isApproved: false,
          // ... other required fields
          date: '16/03/24',
          refNo: 'REF-002',
          dueDate: '21/03/24',
          branch: 'Branch B',
          requisitionType: 'Type B',
          itemLedgerGroup: 'Group B',
          item: 'Item B',
          minQty: 15,
          maxQty: 25,
          unit: 'KG',
          rate: 200,
          deliveryDate: '26/03/24',
          cgst: 9,
          sgst: 9,
          igst: 0,
          vat: 0,
          lastApprovedRate: 190,
          lastSupplier: 'XYZ Ltd',
          broker: 'Broker B',
          status: 'Pending',
          deliveryType: 'Type B',
          openPO: 'Yes',
          openPONo: 'PO-002',
          uploadedAt: new Date().toISOString(),
        },
      ]

      mockedPrisma.purchaseOrder.createMany.mockResolvedValue({ count: 2 } as any)

      const request = new NextRequest('http://localhost/api/pos', {
        method: 'POST',
        body: JSON.stringify({ pos: mockPOs }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.count).toBe(2)
    })

    test('rejects empty array', async () => {
      const request = new NextRequest('http://localhost/api/pos', {
        method: 'POST',
        body: JSON.stringify({ pos: [] }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.count).toBe(0)
      expect(data.error).toBe('No purchase orders provided')

      expect(mockedPrisma.purchaseOrder.createMany).not.toHaveBeenCalled()
    })

    test('rejects invalid input (not an array)', async () => {
      const request = new NextRequest('http://localhost/api/pos', {
        method: 'POST',
        body: JSON.stringify({ pos: 'not-an-array' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('No purchase orders provided')
    })

    test('handles database errors gracefully', async () => {
      mockedPrisma.purchaseOrder.createMany.mockRejectedValue(
        new Error('Database insertion failed')
      )

      const mockPO = {
        id: 'PO-1',
        supplier: 'ABC Corp',
        orderNo: 'PO-001',
        totalAmount: 2000,
        isApproved: false,
        date: '15/03/24',
        refNo: 'REF-001',
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
        lastSupplier: 'ABC Corp',
        broker: 'Broker A',
        status: 'Pending',
        deliveryType: 'Type A',
        openPO: 'Yes',
        openPONo: 'PO-001',
        uploadedAt: new Date().toISOString(),
      }

      const request = new NextRequest('http://localhost/api/pos', {
        method: 'POST',
        body: JSON.stringify({ pos: [mockPO] }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.count).toBe(0)
      expect(data.error).toBeDefined()
    })

    test('handles duplicate IDs with skipDuplicates', async () => {
      const mockPO = {
        id: 'PO-1',
        supplier: 'ABC Corp',
        orderNo: 'PO-001',
        totalAmount: 2000,
        isApproved: false,
        date: '15/03/24',
        refNo: 'REF-001',
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
        lastSupplier: 'ABC Corp',
        broker: 'Broker A',
        status: 'Pending',
        deliveryType: 'Type A',
        openPO: 'Yes',
        openPONo: 'PO-001',
        uploadedAt: new Date().toISOString(),
      }

      // Simulate duplicate - only 0 created because skipDuplicates is true
      mockedPrisma.purchaseOrder.createMany.mockResolvedValue({ count: 0 } as any)

      const request = new NextRequest('http://localhost/api/pos', {
        method: 'POST',
        body: JSON.stringify({ pos: [mockPO] }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.count).toBe(0) // Duplicate skipped

      expect(mockedPrisma.purchaseOrder.createMany).toHaveBeenCalledWith({
        data: [mockPO],
        skipDuplicates: true,
      })
    })
  })

  // ============================================
  // ESSENTIAL: PUT /api/pos (Update POs)
  // ============================================
  describe('PUT /api/pos', () => {
    test('updates single PO isApproved status', async () => {
      mockedPrisma.purchaseOrder.updateMany.mockResolvedValue({ count: 1 } as any)

      const request = new NextRequest('http://localhost/api/pos', {
        method: 'PUT',
        body: JSON.stringify({
          poIds: ['PO-1'],
          updates: { isApproved: true },
        }),
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.count).toBe(1)

      expect(mockedPrisma.purchaseOrder.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['PO-1'] } },
        data: { isApproved: true },
      })
    })

    test('updates multiple POs', async () => {
      mockedPrisma.purchaseOrder.updateMany.mockResolvedValue({ count: 3 } as any)

      const request = new NextRequest('http://localhost/api/pos', {
        method: 'PUT',
        body: JSON.stringify({
          poIds: ['PO-1', 'PO-2', 'PO-3'],
          updates: { isApproved: true },
        }),
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.count).toBe(3)
    })

    test('rejects empty PO IDs array', async () => {
      const request = new NextRequest('http://localhost/api/pos', {
        method: 'PUT',
        body: JSON.stringify({
          poIds: [],
          updates: { isApproved: true },
        }),
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('No purchase order IDs provided')

      expect(mockedPrisma.purchaseOrder.updateMany).not.toHaveBeenCalled()
    })

    test('handles non-existent PO IDs (returns count 0)', async () => {
      mockedPrisma.purchaseOrder.updateMany.mockResolvedValue({ count: 0 } as any)

      const request = new NextRequest('http://localhost/api/pos', {
        method: 'PUT',
        body: JSON.stringify({
          poIds: ['PO-NONEXISTENT'],
          updates: { isApproved: true },
        }),
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.count).toBe(0)
    })

    test('handles database errors gracefully', async () => {
      mockedPrisma.purchaseOrder.updateMany.mockRejectedValue(
        new Error('Database update failed')
      )

      const request = new NextRequest('http://localhost/api/pos', {
        method: 'PUT',
        body: JSON.stringify({
          poIds: ['PO-1'],
          updates: { isApproved: true },
        }),
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBeDefined()
    })
  })

  // ============================================
  // ESSENTIAL: DELETE /api/pos (Delete POs)
  // ============================================
  describe('DELETE /api/pos', () => {
    test('deletes single PO by ID', async () => {
      mockedPrisma.purchaseOrder.deleteMany.mockResolvedValue({ count: 1 } as any)

      const url = new URL('http://localhost/api/pos?ids=PO-1')
      const request = new NextRequest(url, { method: 'DELETE' })

      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)

      expect(mockedPrisma.purchaseOrder.deleteMany).toHaveBeenCalledWith({
        where: { id: { in: ['PO-1'] } },
      })
    })

    test('deletes multiple POs (comma-separated IDs)', async () => {
      mockedPrisma.purchaseOrder.deleteMany.mockResolvedValue({ count: 3 } as any)

      const url = new URL('http://localhost/api/pos?ids=PO-1,PO-2,PO-3')
      const request = new NextRequest(url, { method: 'DELETE' })

      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)

      expect(mockedPrisma.purchaseOrder.deleteMany).toHaveBeenCalledWith({
        where: { id: { in: ['PO-1', 'PO-2', 'PO-3'] } },
      })
    })

    test('handles empty ID list gracefully', async () => {
      mockedPrisma.purchaseOrder.deleteMany.mockResolvedValue({ count: 0 } as any)

      const url = new URL('http://localhost/api/pos?ids=')
      const request = new NextRequest(url, { method: 'DELETE' })

      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)

      // When ids= is empty, split(',') creates [''] - this is expected behavior
      expect(mockedPrisma.purchaseOrder.deleteMany).toHaveBeenCalled()
    })

    test('handles non-existent IDs (still returns success)', async () => {
      mockedPrisma.purchaseOrder.deleteMany.mockResolvedValue({ count: 0 } as any)

      const url = new URL('http://localhost/api/pos?ids=PO-NONEXISTENT')
      const request = new NextRequest(url, { method: 'DELETE' })

      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    test('handles database errors gracefully', async () => {
      mockedPrisma.purchaseOrder.deleteMany.mockRejectedValue(
        new Error('Database deletion failed')
      )

      const url = new URL('http://localhost/api/pos?ids=PO-1')
      const request = new NextRequest(url, { method: 'DELETE' })

      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBeDefined()
    })
  })
})

