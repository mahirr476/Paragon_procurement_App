/**
 * @jest-environment node
 */
import { parseCSV } from '@/lib/csv-parser'

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

  test('handles CSV with zero values', () => {
    const csv = `Date,Supplier,Order No.,Ref No.,Due Date,Branch,Requisition Type,Item/Ledger Group,Item,Min Qty,Max Qty,Unit,Rate,Delivery Date,CGST,SGST,IGST,VAT,Last Approved Rate,Last Supplier,Broker,Total Amount,Status,Delivery Type,Open PO,Open PO No.
15/03/24,ABC Corp,PO-001,REF-001,20/03/24,Branch A,Type A,Group A,Item A,0,0,KG,0,25/03/24,0,0,0,0,0,ABC Corp,Broker A,0,Pending,Type A,Yes,PO-001`
    const result = parseCSV(csv)
    expect(result.length).toBe(1)
    expect(result[0].totalAmount).toBe(0)
    expect(result[0].rate).toBe(0)
  })
})

