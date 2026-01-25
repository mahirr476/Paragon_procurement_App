/**
 * @jest-environment node
 */
import { parseCSV, parseDate } from '@/lib/csv-parser'

describe('CSV Edge Cases', () => {
  test('handles empty CSV file', () => {
    const result = parseCSV('')
    expect(result).toEqual([])
  })

  test('handles CSV with only headers', () => {
    const csv = `Date,Supplier,Order No.,Ref No.,Due Date,Branch,Requisition Type,Item/Ledger Group,Item,Min Qty,Max Qty,Unit,Rate,Delivery Date,CGST,SGST,IGST,VAT,Last Approved Rate,Last Supplier,Broker,Total Amount,Status,Delivery Type,Open PO,Open PO No.`
    const result = parseCSV(csv)
    expect(result).toEqual([])
  })

  test('handles CSV with empty fields', () => {
    const csv = `Date,Supplier,Order No.,Ref No.,Due Date,Branch,Requisition Type,Item/Ledger Group,Item,Min Qty,Max Qty,Unit,Rate,Delivery Date,CGST,SGST,IGST,VAT,Last Approved Rate,Last Supplier,Broker,Total Amount,Status,Delivery Type,Open PO,Open PO No.
15/03/24,,PO-001,,20/03/24,,Type A,Group A,Item A,10,20,KG,100,25/03/24,9,9,0,0,95,,Broker A,2000,Pending,Type A,Yes,PO-001`
    const result = parseCSV(csv)
    expect(result.length).toBe(1)
    expect(result[0].supplier).toBe('')
  })

  test('rejects CSV with missing required columns', () => {
    const csv = `Date,Supplier,Order No.
15/03/24,ABC,PO-001`
    expect(() => parseCSV(csv)).toThrow('Missing required columns')
  })

  test('handles CSV with special characters', () => {
    const csv = `Date,Supplier,Order No.,Ref No.,Due Date,Branch,Requisition Type,Item/Ledger Group,Item,Min Qty,Max Qty,Unit,Rate,Delivery Date,CGST,SGST,IGST,VAT,Last Approved Rate,Last Supplier,Broker,Total Amount,Status,Delivery Type,Open PO,Open PO No.
15/03/24,"ABC & Co., Ltd",PO-001,REF-001,20/03/24,Branch A,Type A,Group A,"Item ""Special""",10,20,KG,100,25/03/24,9,9,0,0,95,ABC Corp,Broker A,2000,Pending,Type A,Yes,PO-001`
    const result = parseCSV(csv)
    expect(result.length).toBe(1)
    expect(result[0].supplier).toContain('ABC')
  })

  test('handles CSV with very large numbers', () => {
    const csv = `Date,Supplier,Order No.,Ref No.,Due Date,Branch,Requisition Type,Item/Ledger Group,Item,Min Qty,Max Qty,Unit,Rate,Delivery Date,CGST,SGST,IGST,VAT,Last Approved Rate,Last Supplier,Broker,Total Amount,Status,Delivery Type,Open PO,Open PO No.
15/03/24,ABC Corp,PO-001,REF-001,20/03/24,Branch A,Type A,Group A,Item A,10,20,KG,100,25/03/24,9,9,0,0,95,ABC Corp,Broker A,999999999,Pending,Type A,Yes,PO-001`
    const result = parseCSV(csv)
    expect(result.length).toBe(1)
    expect(result[0].totalAmount).toBe(999999999)
  })

  test('handles negative quantities and rates', () => {
    const csv = `Date,Supplier,Order No.,Ref No.,Due Date,Branch,Requisition Type,Item/Ledger Group,Item,Min Qty,Max Qty,Unit,Rate,Delivery Date,CGST,SGST,IGST,VAT,Last Approved Rate,Last Supplier,Broker,Total Amount,Status,Delivery Type,Open PO,Open PO No.
15/03/24,ABC Corp,PO-001,REF-001,20/03/24,Branch A,Type A,Group A,Item A,-10,-5,KG,-100,25/03/24,9,9,0,0,95,ABC Corp,Broker A,-2000,Pending,Type A,Yes,PO-001`
    const result = parseCSV(csv)
    expect(result.length).toBe(1)
    expect(result[0].minQty).toBe(-10)
    expect(result[0].maxQty).toBe(-5)
    expect(result[0].rate).toBe(-100)
    expect(result[0].totalAmount).toBe(-2000)
  })

  test('handles CSV with zero values', () => {
    const csv = `Date,Supplier,Order No.,Ref No.,Due Date,Branch,Requisition Type,Item/Ledger Group,Item,Min Qty,Max Qty,Unit,Rate,Delivery Date,CGST,SGST,IGST,VAT,Last Approved Rate,Last Supplier,Broker,Total Amount,Status,Delivery Type,Open PO,Open PO No.
15/03/24,ABC Corp,PO-001,REF-001,20/03/24,Branch A,Type A,Group A,Item A,0,0,KG,0,25/03/24,0,0,0,0,0,ABC Corp,Broker A,0,Pending,Type A,Yes,PO-001`
    const result = parseCSV(csv)
    expect(result.length).toBe(1)
    expect(result[0].totalAmount).toBe(0)
    expect(result[0].rate).toBe(0)
  })

  test('skips rows with clearly invalid dates', () => {
    const csv = `Date,Supplier,Order No.,Ref No.,Due Date,Branch,Requisition Type,Item/Ledger Group,Item,Min Qty,Max Qty,Unit,Rate,Delivery Date,CGST,SGST,IGST,VAT,Last Approved Rate,Last Supplier,Broker,Total Amount,Status,Delivery Type,Open PO,Open PO No.
00/00/00,ABC Corp,PO-001,REF-001,00/00/00,Branch A,Type A,Group A,Item A,10,20,KG,100,25/03/24,9,9,0,0,95,ABC Corp,Broker A,2000,Pending,Type A,Yes,PO-001`
    const result = parseCSV(csv)
    expect(result.length).toBe(0)
  })

  test('handles leap year dates correctly', () => {
    const leap = parseDate('29/02/2024')
    const nonLeap = parseDate('29/02/2023')

    expect(leap).not.toBeNull()
    expect(nonLeap).toBeNull()
  })

  test('handles unicode characters in CSV', () => {
    const csv = `Date,Supplier,Order No.,Ref No.,Due Date,Branch,Requisition Type,Item/Ledger Group,Item,Min Qty,Max Qty,Unit,Rate,Delivery Date,CGST,SGST,IGST,VAT,Last Approved Rate,Last Supplier,Broker,Total Amount,Status,Delivery Type,Open PO,Open PO No.
15/03/24,供应商公司,PO-001,REF-001,20/03/24,فرع أ,Type A,Group A,😀 Item,10,20,KG,100,25/03/24,9,9,0,0,95,ABC Corp,Broker A,2000,Pending,Type A,Yes,PO-001`
    const result = parseCSV(csv)
    expect(result.length).toBe(1)
    expect(result[0].supplier).toContain('供应商')
    expect(result[0].item).toContain('😀')
  })

  test('handles CSV with BOM (byte order mark)', () => {
    const bom = '\uFEFFDate,Supplier,Order No.,Ref No.,Due Date,Branch,Requisition Type,Item/Ledger Group,Item,Min Qty,Max Qty,Unit,Rate,Delivery Date,CGST,SGST,IGST,VAT,Last Approved Rate,Last Supplier,Broker,Total Amount,Status,Delivery Type,Open PO,Open PO No.\n' +
      '15/03/24,ABC Corp,PO-001,REF-001,20/03/24,Branch A,Type A,Group A,Item A,10,20,KG,100,25/03/24,9,9,0,0,95,ABC Corp,Broker A,2000,Pending,Type A,Yes,PO-001'
    const result = parseCSV(bom)
    expect(result.length).toBe(1)
  })

  test('handles Windows CRLF line endings', () => {
    const csv = 'Date,Supplier,Order No.,Ref No.,Due Date,Branch,Requisition Type,Item/Ledger Group,Item,Min Qty,Max Qty,Unit,Rate,Delivery Date,CGST,SGST,IGST,VAT,Last Approved Rate,Last Supplier,Broker,Total Amount,Status,Delivery Type,Open PO,Open PO No.\r\n' +
      '15/03/24,ABC Corp,PO-001,REF-001,20/03/24,Branch A,Type A,Group A,Item A,10,20,KG,100,25/03/24,9,9,0,0,95,ABC Corp,Broker A,2000,Pending,Type A,Yes,PO-001'
    const result = parseCSV(csv)
    expect(result.length).toBe(1)
  })

  test('handles quoted fields with embedded commas and newlines', () => {
    const csv = `Date,Supplier,Order No.,Ref No.,Due Date,Branch,Requisition Type,Item/Ledger Group,Item,Min Qty,Max Qty,Unit,Rate,Delivery Date,CGST,SGST,IGST,VAT,Last Approved Rate,Last Supplier,Broker,Total Amount,Status,Delivery Type,Open PO,Open PO No.
15/03/24,"ABC, Corp",PO-001,REF-001,20/03/24,Branch A,Type A,Group A,"Item with
newline",10,20,KG,100,25/03/24,9,9,0,0,95,ABC Corp,Broker A,2000,Pending,Type A,Yes,PO-001`
    const result = parseCSV(csv)
    expect(result.length).toBe(1)
    expect(result[0].supplier).toContain('ABC, Corp')
  })
})

