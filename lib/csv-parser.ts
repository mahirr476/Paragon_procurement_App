import { PurchaseOrder } from './types'

export function parseCSV(csvText: string): PurchaseOrder[] {
  const lines = csvText.trim().split('\n')
  if (lines.length < 2) return []

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"(.*)"$/, '$1'))
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

      const po: PurchaseOrder = {
        id: `PO-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 9)}`,
        date: values[0]?.trim() || '',
        supplier: supplier, // Use the carry-forward supplier logic
        orderNo: values[2]?.trim() || '',
        refNo: values[3]?.trim() || '',
        dueDate: values[4]?.trim() || '',
        branch: values[5]?.trim() || '',
        requisitionType: values[6]?.trim() || '',
        itemLedgerGroup: values[7]?.trim() || '',
        item: values[8]?.trim() || '',
        minQty: parseFloat(values[9]?.trim() || '0'),
        maxQty: parseFloat(values[10]?.trim() || '0'),
        unit: values[11]?.trim() || '',
        rate: parseFloat(values[12]?.replace(/,/g, '')?.trim() || '0'),
        deliveryDate: values[13]?.trim() || '',
        cgst: parseFloat(values[14]?.trim() || '0'),
        sgst: parseFloat(values[15]?.trim() || '0'),
        igst: parseFloat(values[16]?.trim() || '0'),
        vat: parseFloat(values[17]?.trim() || '0'),
        lastApprovedRate: parseFloat(values[18]?.replace(/,/g, '')?.trim() || '0'),
        lastSupplier: values[19]?.trim() || '',
        broker: values[20]?.trim() || '',
        totalAmount: parseFloat(values[21]?.replace(/,/g, '')?.trim() || '0'),
        status: values[22]?.trim() || 'pending',
        deliveryType: values[23]?.trim() || '',
        openPO: values[24]?.trim() || '',
        openPONo: values[25]?.trim() || '',
        uploadedAt: new Date().toISOString(),
        isApproved: false,
      }

      pos.push(po)
    } catch (error) {
      console.log(`[v0] Error parsing line ${i}:`, error)
    }
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
