/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom'
import { parseCSV } from '@/lib/csv-parser'
import type { PurchaseOrder } from '@/lib/types'

describe('Multiple Upload Workflow', () => {
  jest.setTimeout(10000)

  const csvA = `Date,Supplier,Order No.,Ref No.,Due Date,Branch,Requisition Type,Item/Ledger Group,Item,Min Qty,Max Qty,Unit,Rate,Delivery Date,CGST,SGST,IGST,VAT,Last Approved Rate,Last Supplier,Broker,Total Amount,Status,Delivery Type,Open PO,Open PO No.
15/03/24,ABC Corp,PO-001,REF-001,20/03/24,Branch A,Type A,Group A,Item A,10,20,KG,100,25/03/24,9,9,0,0,95,ABC Corp,Broker A,2000,Pending,Type A,Yes,PO-001
16/03/24,XYZ Ltd,PO-002,REF-002,21/03/24,Branch B,Type B,Group B,Item B,15,25,KG,200,26/03/24,9,9,0,0,190,XYZ Ltd,Broker B,4000,Pending,Type B,Yes,PO-002`

  const csvB = `Date,Supplier,Order No.,Ref No.,Due Date,Branch,Requisition Type,Item/Ledger Group,Item,Min Qty,Max Qty,Unit,Rate,Delivery Date,CGST,SGST,IGST,VAT,Last Approved Rate,Last Supplier,Broker,Total Amount,Status,Delivery Type,Open PO,Open PO No.
17/03/24,DEF Inc,PO-003,REF-003,22/03/24,Branch A,Type A,Group A,Item C,20,30,KG,150,27/03/24,9,9,0,0,140,DEF Inc,Broker C,4500,Pending,Type A,Yes,PO-003
18/03/24,GHI Corp,PO-004,REF-004,23/03/24,Branch C,Type C,Group C,Item D,25,35,KG,120,28/03/24,9,9,0,0,110,GHI Corp,Broker D,4200,Pending,Type C,Yes,PO-004`

  test('uploads multiple CSV files sequentially', () => {
    const posA = parseCSV(csvA)
    const posB = parseCSV(csvB)

    expect(posA.length).toBe(2)
    expect(posB.length).toBe(2)
    expect(posA[0].orderNo).toBe('PO-001')
    expect(posB[0].orderNo).toBe('PO-003')
  })

  test('combines multiple uploads correctly', () => {
    const posA = parseCSV(csvA)
    const posB = parseCSV(csvB)
    const combined = [...posA, ...posB]

    expect(combined.length).toBe(4)
    expect(combined.map(p => p.orderNo)).toEqual(['PO-001', 'PO-002', 'PO-003', 'PO-004'])
  })
})

