/**
 * @jest-environment node
 */
import { parseCSV } from '@/lib/csv-parser'

describe('CSV Parsing Performance', () => {
  function generateLargeCSV(rowCount: number): string {
    const header = `Date,Supplier,Order No.,Ref No.,Due Date,Branch,Requisition Type,Item/Ledger Group,Item,Min Qty,Max Qty,Unit,Rate,Delivery Date,CGST,SGST,IGST,VAT,Last Approved Rate,Last Supplier,Broker,Total Amount,Status,Delivery Type,Open PO,Open PO No.`
    const rows = Array.from({ length: rowCount }, (_, i) => {
      const day = String(15 + (i % 15)).padStart(2, '0')
      return `${day}/03/24,Supplier ${i},PO-${String(i + 1).padStart(3, '0')},REF-${String(i + 1).padStart(3, '0')},${day}/03/24,Branch A,Type A,Group A,Item ${i},10,20,KG,100,25/03/24,9,9,0,0,95,Supplier ${i},Broker A,2000,Pending,Type A,Yes,PO-${String(i + 1).padStart(3, '0')}`
    })
    return [header, ...rows].join('\n')
  }

  test('parses 100 rows quickly', () => {
    const csv = generateLargeCSV(100)
    const start = Date.now()
    const result = parseCSV(csv)
    const duration = Date.now() - start

    expect(result.length).toBe(100)
    expect(duration).toBeLessThan(1000) // Should complete in under 1 second
  })

  test('parses 1000 rows within reasonable time', () => {
    const csv = generateLargeCSV(1000)
    const start = Date.now()
    const result = parseCSV(csv)
    const duration = Date.now() - start

    expect(result.length).toBe(1000)
    expect(duration).toBeLessThan(5000) // Should complete in under 5 seconds
  })

  test('handles large CSV files efficiently', () => {
    const csv = generateLargeCSV(500)
    const start = Date.now()
    const result = parseCSV(csv)
    const duration = Date.now() - start

    expect(result.length).toBe(500)
    expect(duration).toBeLessThan(3000) // Should complete in under 3 seconds
  })
})

