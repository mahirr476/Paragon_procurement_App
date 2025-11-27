import { PurchaseOrder } from './types'

/**
 * Parse a number string, handling commas and invalid values
 * Returns 0 for invalid/NaN values
 */
function parseNumber(value: string | undefined): number {
  if (!value) return 0
  const cleaned = value.replace(/,/g, '').trim()
  if (!cleaned) return 0
  const num = parseFloat(cleaned)
  return isNaN(num) ? 0 : num
}

/**
 * Parse date string in various formats (DD/MM/YY, DD/MM/YYYY, MM/DD/YY, etc.)
 */
export function parseDate(dateStr: string): Date | null {
  if (!dateStr || !dateStr.trim()) return null

  const trimmed = dateStr.trim()

  // Try DD/MM/YY or DD/MM/YYYY format (most common in the CSV)
  const ddmmyyMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/)
  if (ddmmyyMatch) {
    const day = parseInt(ddmmyyMatch[1], 10)
    const month = parseInt(ddmmyyMatch[2], 10) - 1 // JavaScript months are 0-indexed
    let year = parseInt(ddmmyyMatch[3], 10)
    
    // Convert 2-digit year to 4-digit (assuming 20xx for years 00-99)
    if (year < 100) {
      year = year < 50 ? 2000 + year : 1900 + year
    }
    
    const date = new Date(year, month, day)
    // Validate the date (check if it's a valid date)
    if (date.getFullYear() === year && date.getMonth() === month && date.getDate() === day) {
      return date
    }
  }

  // Try standard Date parsing for other formats (ISO, etc.)
  const standardDate = new Date(trimmed)
  if (!isNaN(standardDate.getTime())) {
    return standardDate
  }

  return null
}

export function parseCSV(csvText: string): PurchaseOrder[] {
  const lines = csvText.trim().split('\n').filter(line => line.trim().length > 0)
  if (lines.length < 2) return []

  // Parse headers using the CSV line parser to handle quoted fields correctly
  const headerLine = lines[0]
  const headers = parseCSVLine(headerLine).map(h => h.trim())

  // Detect CSV format by checking for "Weight" and "Pending Wt." columns
  const hasWeightColumn = headers.some(h =>
    h.toLowerCase().includes('weight') && !h.toLowerCase().includes('qty')
  )

  console.log(`[CSV Parser] Detected ${hasWeightColumn ? 'NEW' : 'OLD'} CSV format (${hasWeightColumn ? 'WITH' : 'WITHOUT'} Weight columns)`)
  console.log(`[CSV Parser] Total columns: ${headers.length}`)
  console.log(`[CSV Parser] Headers:`, headers.slice(0, 15).join(', '))

  const pos: PurchaseOrder[] = []
  let lastSupplier = ''

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    if (!line.trim() || line.trim().replace(/,/g, '').length === 0) continue

    try {
      const values = parseCSVLine(line)
      if (values.length < headers.length) continue
      
      const hasData = values[0]?.trim() || values[1]?.trim() || values[8]?.trim() || values[2]?.trim()
      if (!hasData) continue

      const currentSupplier = values[1]?.trim() || ''
      if (currentSupplier) {
        lastSupplier = currentSupplier
      }
      const supplier = currentSupplier || lastSupplier

      // Validate date field
      const dateStr = values[0]?.trim() || ''
      const parsedDate = parseDate(dateStr)
      if (!parsedDate) {
        console.warn(`[CSV Parser] Skipping line ${i}: Invalid date "${dateStr}"`)
        continue
      }

      // Column mapping based on CSV format:
      // OLD format: Date,Supplier,Order No.,Ref. No.,Due Date,Branch,Requisition Type,Item/Ledger Group,Item,Min. Qty.,Max. Qty.,Unit.,Rate,Delivery Date,...
      //             0    1        2         3         4        5      6                 7                8     9          10         11    12    13
      // NEW format: Date,Supplier,Order No.,Ref. No.,Due Date,Branch,Requisition Type,Item/Ledger Group,Item,Min. Qty.,Max. Qty.,Weight,Unit.,Rate,Pending Wt.,Delivery Date,...
      //             0    1        2         3         4        5      6                 7                8     9          10         11     12    13    14           15

      const po: PurchaseOrder = {
        id: `PO-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 9)}`,
        date: dateStr,
        supplier: supplier,
        orderNo: values[2]?.trim() || '',
        refNo: values[3]?.trim() || '',
        dueDate: values[4]?.trim() || '',
        branch: values[5]?.trim() || '',
        requisitionType: values[6]?.trim() || '',
        itemLedgerGroup: values[7]?.trim() || '',
        item: values[8]?.trim() || '',
        minQty: parseNumber(values[9]),
        maxQty: parseNumber(values[10]),
        // OLD: Unit at 11 | NEW: Weight at 11, Unit at 12
        unit: hasWeightColumn ? values[12]?.trim() || '' : values[11]?.trim() || '',
        // OLD: Rate at 12 | NEW: Rate at 13
        rate: parseNumber(values[hasWeightColumn ? 13 : 12]),
        // OLD: Delivery Date at 13 | NEW: Pending Wt. at 14, Delivery Date at 15
        deliveryDate: hasWeightColumn ? values[15]?.trim() || '' : values[13]?.trim() || '',
        // OLD: CGST at 14 | NEW: CGST at 16
        cgst: parseNumber(values[hasWeightColumn ? 16 : 14]),
        // OLD: SGST at 15 | NEW: SGST at 17
        sgst: parseNumber(values[hasWeightColumn ? 17 : 15]),
        // OLD: IGST at 16 | NEW: IGST at 18
        igst: parseNumber(values[hasWeightColumn ? 18 : 16]),
        // OLD: VAT at 17 | NEW: VAT at 19
        vat: parseNumber(values[hasWeightColumn ? 19 : 17]),
        // OLD: Last Approved Rate at 18 | NEW: at 20
        lastApprovedRate: parseNumber(values[hasWeightColumn ? 20 : 18]),
        // OLD: Last Supplier at 19 | NEW: at 21
        lastSupplier: values[hasWeightColumn ? 21 : 19]?.trim() || '',
        // OLD: Broker at 20 | NEW: at 22
        broker: values[hasWeightColumn ? 22 : 20]?.trim() || '',
        // OLD: Total Amount at 21 | NEW: at 23
        totalAmount: parseNumber(values[hasWeightColumn ? 23 : 21]),
        // OLD: Status at 22 | NEW: at 24
        status: values[hasWeightColumn ? 24 : 22]?.trim() || 'pending',
        // OLD: Delivery Type at 23 | NEW: at 25
        deliveryType: values[hasWeightColumn ? 25 : 23]?.trim() || '',
        // OLD: Open PO at 24 | NEW: at 26
        openPO: values[hasWeightColumn ? 26 : 24]?.trim() || '',
        // OLD: Open PO No at 25 | NEW: at 27
        openPONo: values[hasWeightColumn ? 27 : 25]?.trim() || '',
        uploadedAt: new Date().toISOString(),
        isApproved: false,
      }

      // Debug logging for first entry
      if (i === 1) {
        console.log(`[CSV Parser] DEBUG - First row field mapping:`)
        console.log(`  - values[11]: "${values[11]}" (${hasWeightColumn ? 'Weight' : 'Unit'})`)
        console.log(`  - values[12]: "${values[12]}" (${hasWeightColumn ? 'Unit' : 'Rate'})`)
        console.log(`  - values[13]: "${values[13]}" (${hasWeightColumn ? 'Rate' : 'Delivery Date'})`)
        console.log(`  - Parsed unit: "${po.unit}"`)
        console.log(`  - Parsed rate: ${po.rate}`)
        console.log(`  - Parsed totalAmount: ${po.totalAmount}`)
      }

      pos.push(po)
    } catch (error) {
      console.error(`[CSV Parser] Error parsing line ${i}:`, error)
      console.error(`[CSV Parser] Line content:`, line.substring(0, 100))
    }
  }

  console.log(`[CSV Parser] Successfully parsed ${pos.length} purchase orders from ${lines.length - 1} data lines`)

  if (pos.length > 0) {
    console.log(`[CSV Parser] Sample first entry:`)
    console.log(`  - Date: ${pos[0].date}`)
    console.log(`  - Supplier: ${pos[0].supplier}`)
    console.log(`  - Item: ${pos[0].item}`)
    console.log(`  - Unit: ${pos[0].unit}`)
    console.log(`  - Rate: ${pos[0].rate}`)
    console.log(`  - Total Amount: ${pos[0].totalAmount}`)
  }

  return pos
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let insideQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      insideQuotes = !insideQuotes
    } else if (char === ',' && !insideQuotes) {
      result.push(current.trim().replace(/^"(.*)"$/, '$1'))
      current = ''
    } else {
      current += char
    }
  }

  result.push(current.trim().replace(/^"(.*)"$/, '$1'))
  return result
}
