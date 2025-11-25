import { parseDate, parseCSV } from '../../lib/csv-parser'

describe('CSV Parser', () => {
  // ============================================
  // ESSENTIAL: Date Parsing (3 key formats)
  // ============================================
  describe('parseDate - Essential Date Formats', () => {
    test('parses DD/MM/YY format (most common)', () => {
      const result = parseDate('15/03/24')
      expect(result).not.toBeNull()
      expect(result?.getFullYear()).toBe(2024)
      expect(result?.getMonth()).toBe(2)
      expect(result?.getDate()).toBe(15)
    })

    test('parses DD/MM/YYYY format', () => {
      const result = parseDate('15/03/2024')
      expect(result).not.toBeNull()
      expect(result?.getFullYear()).toBe(2024)
      expect(result?.getMonth()).toBe(2)
      expect(result?.getDate()).toBe(15)
    })

    test('rejects invalid dates', () => {
      expect(parseDate('32/13/2024')).toBeNull()
      expect(parseDate('invalid')).toBeNull()
      expect(parseDate('')).toBeNull()
    })
  })

  // ============================================
  // ESSENTIAL: Format Detection (OLD vs NEW)
  // ============================================
  describe('parseCSV - Format Detection', () => {
    test('detects OLD format (26 columns, no Weight)', () => {
      const csvOld = `Date,Supplier,Order No.,Ref No.,Due Date,Branch,Requisition Type,Item/Ledger Group,Item,Min Qty,Max Qty,Unit,Rate,Delivery Date,CGST,SGST,IGST,VAT,Last Approved Rate,Last Supplier,Broker,Total Amount,Status,Delivery Type,Open PO,Open PO No.
15/03/24,ABC Corp,PO-001,REF-001,20/03/24,Branch A,Type A,Group A,Item A,10,20,KG,100,25/03/24,9,9,0,0,95,ABC Corp,Broker A,2000,Pending,Type A,Yes,PO-001`
      
      const result = parseCSV(csvOld)
      expect(result.length).toBe(1)
      expect(result[0].unit).toBe('KG') // Unit at column 11 in OLD format
      expect(result[0].rate).toBe(100)
    })

    test('detects NEW format (28 columns, with Weight)', () => {
      const csvNew = `Date,Supplier,Order No.,Ref No.,Due Date,Branch,Requisition Type,Item/Ledger Group,Item,Min Qty,Max Qty,Weight,Unit,Rate,Pending Wt.,Delivery Date,CGST,SGST,IGST,VAT,Last Approved Rate,Last Supplier,Broker,Total Amount,Status,Delivery Type,Open PO,Open PO No.
15/03/24,ABC Corp,PO-001,REF-001,20/03/24,Branch A,Type A,Group A,Item A,10,20,50,KG,100,0,25/03/24,9,9,0,0,95,ABC Corp,Broker A,2000,Pending,Type A,Yes,PO-001`
      
      const result = parseCSV(csvNew)
      expect(result.length).toBe(1)
      expect(result[0].unit).toBe('KG') // Unit at column 12 in NEW format
      expect(result[0].rate).toBe(100)
    })
  })

  // ============================================
  // ESSENTIAL: Data Type Conversion
  // ============================================
  describe('parseCSV - Data Type Conversion', () => {
    const csv = `Date,Supplier,Order No.,Ref No.,Due Date,Branch,Requisition Type,Item/Ledger Group,Item,Min Qty,Max Qty,Unit,Rate,Delivery Date,CGST,SGST,IGST,VAT,Last Approved Rate,Last Supplier,Broker,Total Amount,Status,Delivery Type,Open PO,Open PO No.
15/03/24,ABC Corp,PO-001,REF-001,20/03/24,Branch A,Type A,Group A,Item A,10,20,KG,100.50,25/03/24,9,9,0,0,95.50,ABC Corp,Broker A,2000.00,Pending,Type A,Yes,PO-001`

    test('converts numeric fields correctly', () => {
      const result = parseCSV(csv)
      expect(typeof result[0].minQty).toBe('number')
      expect(typeof result[0].maxQty).toBe('number')
      expect(typeof result[0].rate).toBe('number')
      expect(typeof result[0].totalAmount).toBe('number')
      expect(result[0].rate).toBe(100.5)
      expect(result[0].totalAmount).toBe(2000)
    })

    test('converts tax fields correctly', () => {
      const result = parseCSV(csv)
      expect(typeof result[0].cgst).toBe('number')
      expect(typeof result[0].sgst).toBe('number')
      expect(result[0].cgst).toBe(9)
      expect(result[0].sgst).toBe(9)
    })
  })

  // ============================================
  // ESSENTIAL: Complete CSV Parsing (End-to-End)
  // ============================================
  describe('parseCSV - Complete CSV File Parsing', () => {
    test('parses complete OLD format CSV correctly', () => {
      const csv = `Date,Supplier,Order No.,Ref No.,Due Date,Branch,Requisition Type,Item/Ledger Group,Item,Min Qty,Max Qty,Unit,Rate,Delivery Date,CGST,SGST,IGST,VAT,Last Approved Rate,Last Supplier,Broker,Total Amount,Status,Delivery Type,Open PO,Open PO No.
15/03/24,ABC Corp,PO-001,REF-001,20/03/24,Branch A,Type A,Group A,Item A,10,20,KG,100.50,25/03/24,9,9,0,0,95.50,ABC Corp,Broker A,2000.00,Pending,Type A,Yes,PO-001
16/03/24,XYZ Ltd,PO-002,REF-002,21/03/24,Branch B,Type B,Group B,Item B,15,25,KG,200.75,26/03/24,9,9,0,0,190.75,XYZ Ltd,Broker B,4000.50,Pending,Type B,Yes,PO-002`

      const result = parseCSV(csv)
      
      // Verify count
      expect(result.length).toBe(2)
      
      // Verify first row data integrity
      expect(result[0].date).toBe('15/03/24')
      expect(result[0].supplier).toBe('ABC Corp')
      expect(result[0].orderNo).toBe('PO-001')
      expect(result[0].item).toBe('Item A')
      expect(result[0].minQty).toBe(10)
      expect(result[0].maxQty).toBe(20)
      expect(result[0].unit).toBe('KG')
      expect(result[0].rate).toBe(100.5)
      expect(result[0].totalAmount).toBe(2000)
      expect(result[0].cgst).toBe(9)
      
      // Verify second row data integrity
      expect(result[1].supplier).toBe('XYZ Ltd')
      expect(result[1].orderNo).toBe('PO-002')
      expect(result[1].rate).toBe(200.75)
      expect(result[1].totalAmount).toBe(4000.5)
      
      // Verify all POs have required fields
      result.forEach(po => {
        expect(po.id).toMatch(/^PO-\d+-\d+-[a-z0-9]+$/)
        expect(po.isApproved).toBe(false)
        expect(po.uploadedAt).toBeDefined()
        expect(typeof po.uploadedAt).toBe('string')
      })
    })

    test('parses complete NEW format CSV correctly', () => {
      const csv = `Date,Supplier,Order No.,Ref No.,Due Date,Branch,Requisition Type,Item/Ledger Group,Item,Min Qty,Max Qty,Weight,Unit,Rate,Pending Wt.,Delivery Date,CGST,SGST,IGST,VAT,Last Approved Rate,Last Supplier,Broker,Total Amount,Status,Delivery Type,Open PO,Open PO No.
15/03/24,ABC Corp,PO-001,REF-001,20/03/24,Branch A,Type A,Group A,Item A,10,20,50,KG,100.50,0,25/03/24,9,9,0,0,95.50,ABC Corp,Broker A,2000.00,Pending,Type A,Yes,PO-001`

      const result = parseCSV(csv)
      
      expect(result.length).toBe(1)
      expect(result[0].supplier).toBe('ABC Corp')
      expect(result[0].unit).toBe('KG')
      expect(result[0].rate).toBe(100.5)
      expect(result[0].totalAmount).toBe(2000)
    })

    test('handles empty CSV gracefully', () => {
      expect(parseCSV('')).toEqual([])
      expect(parseCSV('Date,Supplier,Order No.')).toEqual([])
    })
  })

  // ============================================
  // ESSENTIAL: Edge Cases (Common Issues)
  // ============================================
  describe('parseCSV - Common Edge Cases', () => {
    test('handles empty fields', () => {
      const csv = `Date,Supplier,Order No.,Ref No.,Due Date,Branch,Requisition Type,Item/Ledger Group,Item,Min Qty,Max Qty,Unit,Rate,Delivery Date,CGST,SGST,IGST,VAT,Last Approved Rate,Last Supplier,Broker,Total Amount,Status,Delivery Type,Open PO,Open PO No.
15/03/24,,PO-001,REF-001,20/03/24,Branch A,Type A,Group A,Item A,10,20,KG,100,25/03/24,9,9,0,0,95,ABC Corp,Broker A,2000,Pending,Type A,Yes,PO-001`
      
      const result = parseCSV(csv)
      expect(result.length).toBe(1)
      expect(result[0].supplier).toBe('')
    })

    test('skips invalid rows (missing date)', () => {
      const csv = `Date,Supplier,Order No.,Ref No.,Due Date,Branch,Requisition Type,Item/Ledger Group,Item,Min Qty,Max Qty,Unit,Rate,Delivery Date,CGST,SGST,IGST,VAT,Last Approved Rate,Last Supplier,Broker,Total Amount,Status,Delivery Type,Open PO,Open PO No.
15/03/24,ABC Corp,PO-001,REF-001,20/03/24,Branch A,Type A,Group A,Item A,10,20,KG,100,25/03/24,9,9,0,0,95,ABC Corp,Broker A,2000,Pending,Type A,Yes,PO-001
invalid-date,XYZ Ltd,PO-002,REF-002,21/03/24,Branch B,Type B,Group B,Item B,15,25,KG,200,26/03/24,9,9,0,0,190,XYZ Ltd,Broker B,4000,Pending,Type B,Yes,PO-002`
      
      const result = parseCSV(csv)
      expect(result.length).toBe(1) // Only valid row parsed
      expect(result[0].orderNo).toBe('PO-001')
    })

    test('handles multiple rows correctly', () => {
      const header = `Date,Supplier,Order No.,Ref No.,Due Date,Branch,Requisition Type,Item/Ledger Group,Item,Min Qty,Max Qty,Unit,Rate,Delivery Date,CGST,SGST,IGST,VAT,Last Approved Rate,Last Supplier,Broker,Total Amount,Status,Delivery Type,Open PO,Open PO No.`
      const rows: string[] = [header]
      
      for (let i = 1; i <= 10; i++) {
        rows.push(`15/03/24,Supplier ${i},PO-${i},REF-${i},20/03/24,Branch A,Type A,Group A,Item ${i},${i * 10},${i * 20},KG,${i * 100},25/03/24,9,9,0,0,95,Supplier ${i},Broker A,${i * 2000},Pending,Type A,Yes,PO-${i}`)
      }
      
      const csv = rows.join('\n')
      const result = parseCSV(csv)
      
      expect(result.length).toBe(10)
      expect(result[0].supplier).toBe('Supplier 1')
      expect(result[9].supplier).toBe('Supplier 10')
      expect(result[4].totalAmount).toBe(10000) // 5 * 2000
    })
  })

  // ============================================
  // FAILING TEST CASES - To understand issues
  // ============================================
  describe('parseCSV - Failing Test Cases (For Investigation)', () => {
    test('FAILING: Numbers with commas should be parsed correctly (e.g., "1,000" → 1000)', () => {
      // This test will FAIL because parseFloat("1,000") returns 1, not 1000
      // The parser needs to remove commas BEFORE calling parseFloat
      const csv = `Date,Supplier,Order No.,Ref No.,Due Date,Branch,Requisition Type,Item/Ledger Group,Item,Min Qty,Max Qty,Unit,Rate,Delivery Date,CGST,SGST,IGST,VAT,Last Approved Rate,Last Supplier,Broker,Total Amount,Status,Delivery Type,Open PO,Open PO No.
15/03/24,ABC Corp,PO-001,REF-001,20/03/24,Branch A,Type A,Group A,Item A,10,20,KG,100,25/03/24,9,9,0,0,95,ABC Corp,Broker A,1,000,Pending,Type A,Yes,PO-001`
      
      const result = parseCSV(csv)
      
      // Expected: totalAmount should be 1000
      // Actual: Will likely be 1 (parseFloat stops at comma)
      expect(result[0].totalAmount).toBe(1000)
      expect(typeof result[0].totalAmount).toBe('number')
    })

    test('FAILING: Invalid numbers should return 0, not NaN (e.g., "abc" → 0)', () => {
      // This test will FAIL because parseFloat("abc") returns NaN
      // The parser should handle NaN and convert it to 0
      const csv = `Date,Supplier,Order No.,Ref No.,Due Date,Branch,Requisition Type,Item/Ledger Group,Item,Min Qty,Max Qty,Unit,Rate,Delivery Date,CGST,SGST,IGST,VAT,Last Approved Rate,Last Supplier,Broker,Total Amount,Status,Delivery Type,Open PO,Open PO No.
15/03/24,ABC Corp,PO-001,REF-001,20/03/24,Branch A,Type A,Group A,Item A,10,20,KG,100,25/03/24,9,9,0,0,95,ABC Corp,Broker A,abc,Pending,Type A,Yes,PO-001`
      
      const result = parseCSV(csv)
      
      // Expected: totalAmount should be 0 (invalid number)
      // Actual: Will likely be NaN
      expect(result[0].totalAmount).toBe(0)
      expect(Number.isNaN(result[0].totalAmount)).toBe(false)
      expect(typeof result[0].totalAmount).toBe('number')
    })
  })
})
