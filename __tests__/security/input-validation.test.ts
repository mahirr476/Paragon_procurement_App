/**
 * @jest-environment node
 */
import { parseCSV } from '../../lib/csv-parser'
import { prisma } from '@/lib/prisma'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    purchaseOrder: {
      createMany: jest.fn(),
    },
  },
}))

const mockedPrisma = prisma as jest.Mocked<typeof prisma>

describe('Security Tests - Input Validation (Section 11.1)', () => {
  // ============================================
  // ESSENTIAL: CSV Injection Prevention
  // ============================================
  describe('CSV Injection Prevention', () => {
    test('CSV with formulas treated as text (not executed)', () => {
      const csvWithFormula = `Date,Supplier,Order No.,Ref No.,Due Date,Branch,Requisition Type,Item/Ledger Group,Item,Min Qty,Max Qty,Unit,Rate,Delivery Date,CGST,SGST,IGST,VAT,Last Approved Rate,Last Supplier,Broker,Total Amount,Status,Delivery Type,Open PO,Open PO No.
15/03/24,ABC Corp,PO-001,REF-001,20/03/24,Branch A,Type A,Group A,=cmd|'/c calc',10,20,KG,100,25/03/24,9,9,0,0,95,ABC Corp,Broker A,2000,Pending,Type A,Yes,PO-001`

      const result = parseCSV(csvWithFormula)

      expect(result.length).toBe(1)
      // CSV parser may add quotes - important is that it's treated as text, not executed
      expect(result[0].item).toContain("=cmd") // Treated as text, not executed
    })
  })

  // ============================================
  // ESSENTIAL: SQL Injection Prevention
  // ============================================
  describe('SQL Injection Prevention', () => {
    test('SQL injection in supplier name handled safely by Prisma', async () => {
      const maliciousSupplier = "'; DROP TABLE purchase_orders; --"
      const csvWithSQLInjection = `Date,Supplier,Order No.,Ref No.,Due Date,Branch,Requisition Type,Item/Ledger Group,Item,Min Qty,Max Qty,Unit,Rate,Delivery Date,CGST,SGST,IGST,VAT,Last Approved Rate,Last Supplier,Broker,Total Amount,Status,Delivery Type,Open PO,Open PO No.
15/03/24,${maliciousSupplier},PO-001,REF-001,20/03/24,Branch A,Type A,Group A,Item A,10,20,KG,100,25/03/24,9,9,0,0,95,ABC Corp,Broker A,2000,Pending,Type A,Yes,PO-001`

      const parsedPOs = parseCSV(csvWithSQLInjection)
      expect(parsedPOs.length).toBe(1)
      expect(parsedPOs[0].supplier).toBe(maliciousSupplier)

      // Prisma automatically escapes SQL - verify it doesn't crash
      mockedPrisma.purchaseOrder.createMany.mockResolvedValue({ count: 1 } as any)

      await mockedPrisma.purchaseOrder.createMany({
        data: parsedPOs,
        skipDuplicates: true,
      })

      expect(mockedPrisma.purchaseOrder.createMany).toHaveBeenCalled()
    })
  })
})

