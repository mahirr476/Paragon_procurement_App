import type { PurchaseOrder } from './types'

export function generateBranchReport(pos: PurchaseOrder[]) {
  const branchMap: Record<string, any> = {}
  
  pos.forEach(po => {
    const branch = po.branch || 'Unknown'
    if (!branchMap[branch]) {
      branchMap[branch] = {
        totalAmount: 0,
        orderCount: 0,
        itemCount: 0,
        avgOrderValue: 0,
        suppliers: new Set(),
        items: new Set()
      }
    }
    
    branchMap[branch].totalAmount += po.totalAmount
    branchMap[branch].orderCount += 1
    branchMap[branch].items.add(po.item)
    branchMap[branch].suppliers.add(po.supplier)
  })
  
  // Calculate averages
  Object.keys(branchMap).forEach(branch => {
    const data = branchMap[branch]
    data.itemCount = data.items.size
    data.supplierCount = data.suppliers.size
    data.avgOrderValue = data.totalAmount / data.orderCount
    delete data.items
    delete data.suppliers
  })
  
  return branchMap
}

export function generateCategoryReport(pos: PurchaseOrder[]) {
  const categoryMap: Record<string, any> = {}
  
  pos.forEach(po => {
    const category = po.itemLedgerGroup || 'Unknown'
    if (!categoryMap[category]) {
      categoryMap[category] = {
        totalAmount: 0,
        orderCount: 0,
        itemCount: 0,
        avgRate: 0,
        items: new Set()
      }
    }
    
    categoryMap[category].totalAmount += po.totalAmount
    categoryMap[category].orderCount += 1
    categoryMap[category].items.add(po.item)
  })
  
  // Calculate averages
  Object.keys(categoryMap).forEach(category => {
    const data = categoryMap[category]
    data.itemCount = data.items.size
    data.avgRate = data.totalAmount / data.orderCount
    delete data.items // Remove Set before returning
  })
  
  return categoryMap
}

export function generateSummaryReport(pos: PurchaseOrder[]) {
  const totalAmount = pos.reduce((sum, po) => sum + po.totalAmount, 0)
  const totalOrders = pos.length
  const uniqueSuppliers = new Set(pos.map(po => po.supplier)).size
  const avgOrderValue = totalAmount / totalOrders || 0
  
  const highValueOrders = [...pos]
    .sort((a, b) => b.totalAmount - a.totalAmount)
    .slice(0, 10)
  
  return {
    totalAmount,
    totalOrders,
    uniqueSuppliers,
    avgOrderValue,
    highValueOrders
  }
}

export function generateSupplierReport(pos: PurchaseOrder[]) {
  const supplierMap: Record<string, any> = {}
  
  pos.forEach(po => {
    if (!supplierMap[po.supplier]) {
      supplierMap[po.supplier] = {
        totalAmount: 0,
        orderCount: 0,
        itemCount: 0,
        avgOrderValue: 0,
        avgRate: 0,
        items: new Set()
      }
    }
    
    supplierMap[po.supplier].totalAmount += po.totalAmount
    supplierMap[po.supplier].orderCount += 1
    supplierMap[po.supplier].items.add(po.item)
  })
  
  // Calculate averages
  Object.keys(supplierMap).forEach(supplier => {
    const data = supplierMap[supplier]
    data.itemCount = data.items.size
    data.avgOrderValue = data.totalAmount / data.orderCount
    data.avgRate = data.totalAmount / data.orderCount
    delete data.items // Remove Set before returning
  })
  
  return supplierMap
}

export function generateMonthlyTrends(pos: PurchaseOrder[]) {
  const monthMap = new Map<string, { total: number; count: number }>()
  
  pos.forEach(po => {
    const month = po.date.substring(0, 7) // Extract YYYY-MM
    const existing = monthMap.get(month) || { total: 0, count: 0 }
    monthMap.set(month, {
      total: existing.total + po.totalAmount,
      count: existing.count + 1
    })
  })
  
  return Array.from(monthMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, data]) => ({
      month,
      total: data.total,
      count: data.count,
      average: data.total / data.count
    }))
}
