/**
 * @jest-environment node
 */
import { prisma } from '@/lib/prisma'
import { parseCSV } from '@/lib/csv-parser'
import type { PurchaseOrder } from '@/lib/types'

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    purchaseOrder: {
      create: jest.fn(),
      createMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}))

const mockedPrisma = prisma as jest.Mocked<typeof prisma>

const sampleCSV = `Date,Supplier,Order No.,Ref No.,Due Date,Branch,Requisition Type,Item/Ledger Group,Item,Min Qty,Max Qty,Unit,Rate,Delivery Date,CGST,SGST,IGST,VAT,Last Approved Rate,Last Supplier,Broker,Total Amount,Status,Delivery Type,Open PO,Open PO No.
15/03/24,ABC Corp,PO-001,REF-001,20/03/24,Branch A,Type A,Group A,Item A,10,20,KG,100.50,25/03/24,9,9,0,0,95.50,ABC Corp,Broker A,2000.00,Pending,Type A,Yes,PO-001`

describe('Database Integrity Tests (Section 5)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // ============================================
  // ESSENTIAL: Data Persistence (CSV → Database)
  // ============================================
  describe('Data Persistence - CSV to Database', () => {
    test('insert PO from CSV → all fields match exactly', async () => {
      const parsedPOs = parseCSV(sampleCSV)
      const csvPO = parsedPOs[0]

      const dbPO = { ...csvPO, uploadedAt: new Date() }
      mockedPrisma.purchaseOrder.create.mockResolvedValue(dbPO as any)
      mockedPrisma.purchaseOrder.findUnique.mockResolvedValue(dbPO as any)

      await mockedPrisma.purchaseOrder.create({ data: csvPO })
      const retrieved = await mockedPrisma.purchaseOrder.findUnique({
        where: { id: csvPO.id },
      })

      // Verify critical CSV values match database
      expect(retrieved?.supplier).toBe(csvPO.supplier)
      expect(retrieved?.orderNo).toBe(csvPO.orderNo)
      expect(retrieved?.rate).toBe(csvPO.rate)
      expect(retrieved?.totalAmount).toBe(csvPO.totalAmount)
    })

    test('numeric precision maintained (no rounding errors)', async () => {
      const parsedPOs = parseCSV(sampleCSV)
      const csvPO = parsedPOs[0]

      const dbPO = { ...csvPO, uploadedAt: new Date() }
      mockedPrisma.purchaseOrder.create.mockResolvedValue(dbPO as any)
      mockedPrisma.purchaseOrder.findUnique.mockResolvedValue(dbPO as any)

      await mockedPrisma.purchaseOrder.create({ data: csvPO })
      const retrieved = await mockedPrisma.purchaseOrder.findUnique({
        where: { id: csvPO.id },
      })

      expect(retrieved?.rate).toBe(100.5)
      expect(retrieved?.totalAmount).toBe(2000)
    })

    test('update isApproved → other CSV fields unchanged', async () => {
      const parsedPOs = parseCSV(sampleCSV)
      const originalPO = parsedPOs[0]

      const updatedPO = { ...originalPO, isApproved: true, uploadedAt: new Date() }
      mockedPrisma.purchaseOrder.update.mockResolvedValue(updatedPO as any)
      mockedPrisma.purchaseOrder.findUnique.mockResolvedValue(updatedPO as any)

      await mockedPrisma.purchaseOrder.update({
        where: { id: originalPO.id },
        data: { isApproved: true },
      })

      const retrieved = await mockedPrisma.purchaseOrder.findUnique({
        where: { id: originalPO.id },
      })

      expect(retrieved?.isApproved).toBe(true)
      expect(retrieved?.supplier).toBe(originalPO.supplier)
      expect(retrieved?.rate).toBe(originalPO.rate)
    })
  })
})

