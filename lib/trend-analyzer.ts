import { PurchaseOrder } from './types'

export interface TrendAnomaly {
  type: string
  description: string
  severity: 'low' | 'medium' | 'high'
  itemName: string
  category: string
  supplier: string
  branch: string
  date: string
  relatedPOs: PurchaseOrder[]
  metrics: {
    currentValue: number
    expectedValue: number
    deviation: number
    unit: string
  }
  suggestedActions: string[]
}

export interface TrendMetrics {
  period: string // week, month, quarter
  label: string // display label
  orderCount: number
  totalAmount: number
  avgOrderValue: number
  uniqueSuppliers: number
  topCategory: string
  branches: string[]
}

export interface SupplierTrend {
  supplier: string
  orderCount: number
  totalAmount: number
  avgRate: number
  rateVolatility: number
  lastOrderDate: string
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'irregular'
}

export interface CategoryTrend {
  category: string
  volumeTrend: number
  priceTrend: number
  lastUpdated: string
}

export function analyzeDailyTrends(pos: PurchaseOrder[]): TrendMetrics[] {
  const dailyData: Record<string, PurchaseOrder[]> = {}

  pos.forEach(po => {
    const date = po.date.split('T')[0]
    if (!dailyData[date]) dailyData[date] = []
    dailyData[date].push(po)
  })

  const dates = Object.keys(dailyData).sort()
  const metrics: TrendMetrics[] = []

  dates.forEach((date, idx) => {
    const orders = dailyData[date]
    const amount = orders.reduce((sum, po) => sum + po.totalAmount, 0)

    const last7Days = dates.slice(Math.max(0, idx - 6), idx + 1).map(d => dailyData[d])
    const weeklyAvg = last7Days.reduce((sum, day) => sum + day.length, 0) / Math.min(7, last7Days.length)

    const last30Days = dates.slice(Math.max(0, idx - 29), idx + 1).map(d => dailyData[d])
    const monthlyAvg = last30Days.reduce((sum, day) => sum + day.length, 0) / Math.min(30, last30Days.length)

    const prevAmount = idx > 0 ? dailyData[dates[idx - 1]].reduce((sum, po) => sum + po.totalAmount, 0) : amount
    const trend = amount > prevAmount * 1.1 ? 'up' : amount < prevAmount * 0.9 ? 'down' : 'stable'

    const anomalies: string[] = []
    if (orders.length > weeklyAvg * 2) anomalies.push('High order volume')
    if (amount > monthlyAvg * 5000000) anomalies.push('Unusual order amount')

    metrics.push({
      period: 'daily',
      label: date,
      orderCount: orders.length,
      totalAmount: amount,
      avgOrderValue: amount / orders.length,
      uniqueSuppliers: new Set(orders.map(po => po.supplier)).size,
      topCategory: 'N/A',
      branches: orders.map(po => po.branch).filter(Boolean),
    })
  })

  return metrics
}

export function analyzePeriodTrends(pos: PurchaseOrder[], periodType: 'weekly' | 'monthly' = 'monthly'): TrendMetrics[] {
  if (pos.length === 0) return []

  const periodData: Record<string, PurchaseOrder[]> = {}

  pos.forEach(po => {
    const date = new Date(po.date)
    if (isNaN(date.getTime())) return

    let periodKey: string
    if (periodType === 'weekly') {
      const weekStart = new Date(date)
      weekStart.setDate(date.getDate() - date.getDay())
      periodKey = weekStart.toISOString().split('T')[0]
    } else {
      periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    }

    if (!periodData[periodKey]) periodData[periodKey] = []
    periodData[periodKey].push(po)
  })

  const periods = Object.keys(periodData).sort()
  const metrics: TrendMetrics[] = []

  periods.forEach(period => {
    const orders = periodData[period]
    const totalAmount = orders.reduce((sum, po) => sum + po.totalAmount, 0)
    const avgOrderValue = totalAmount / orders.length

    const categoryCount: Record<string, number> = {}
    const suppliers = new Set<string>()
    const branches = new Set<string>()

    orders.forEach(po => {
      const cat = po.itemLedgerGroup || 'Uncategorized'
      categoryCount[cat] = (categoryCount[cat] || 0) + 1
      suppliers.add(po.supplier)
      if (po.branch) branches.add(po.branch)
    })

    const topCategory = Object.entries(categoryCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'

    const label = periodType === 'weekly' 
      ? `Week of ${period}` 
      : new Date(period + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'short' })

    metrics.push({
      period,
      label,
      orderCount: orders.length,
      totalAmount,
      avgOrderValue,
      uniqueSuppliers: suppliers.size,
      topCategory,
      branches: Array.from(branches),
    })
  })

  return metrics
}

export function analyzeSupplierTrends(pos: PurchaseOrder[]): SupplierTrend[] {
  const supplierData: Record<string, any> = {}

  pos.forEach(po => {
    if (!supplierData[po.supplier]) {
      supplierData[po.supplier] = {
        orders: [],
        rates: [],
        dates: [],
      }
    }
    supplierData[po.supplier].orders.push(po)
    supplierData[po.supplier].rates.push(po.rate)
    
    const date = new Date(po.date)
    if (!isNaN(date.getTime())) {
      supplierData[po.supplier].dates.push(date)
    }
  })

  return Object.entries(supplierData).map(([supplier, data]: any) => {
    const rates = data.rates
    const avgRate = rates.reduce((a: number, b: number) => a + b, 0) / rates.length
    const variance = rates.reduce((sum: number, rate: number) => sum + Math.pow(rate - avgRate, 2), 0) / rates.length
    const volatility = Math.sqrt(variance) / avgRate

    const dates = data.dates.sort((a: Date, b: Date) => b.getTime() - a.getTime())
    const gaps: number[] = []
    for (let i = 1; i < dates.length; i++) {
      gaps.push((dates[i - 1].getTime() - dates[i].getTime()) / (1000 * 60 * 60 * 24))
    }
    const avgGap = gaps.length > 0 ? gaps.reduce((a: number, b: number) => a + b, 0) / gaps.length : 0

    let frequency: 'weekly' | 'monthly' | 'quarterly' | 'irregular' = 'irregular'
    if (avgGap < 10) frequency = 'weekly'
    else if (avgGap < 35) frequency = 'monthly'
    else if (avgGap < 100) frequency = 'quarterly'

    const lastDate = dates.length > 0 && dates[0] ? dates[0].toISOString().split('T')[0] : 'N/A'

    return {
      supplier,
      orderCount: data.orders.length,
      totalAmount: data.orders.reduce((sum: number, po: PurchaseOrder) => sum + po.totalAmount, 0),
      avgRate,
      rateVolatility: volatility,
      lastOrderDate: lastDate,
      frequency,
    }
  })
}

export function identifyDetailedAnomalies(pos: PurchaseOrder[]): TrendAnomaly[] {
  const anomalies: TrendAnomaly[] = []

  // Calculate item baselines from historical data
  const itemBaselines: Record<string, { rates: number[], totalAmount: number, count: number }> = {}
  
  pos.forEach(po => {
    const key = `${po.supplier}-${po.item}`
    if (!itemBaselines[key]) {
      itemBaselines[key] = { rates: [], totalAmount: 0, count: 0 }
    }
    itemBaselines[key].rates.push(po.rate)
    itemBaselines[key].totalAmount += po.totalAmount
    itemBaselines[key].count++
  })

  // Check each PO against its baseline
  pos.forEach(po => {
    const key = `${po.supplier}-${po.item}`
    const baseline = itemBaselines[key]
    
    if (baseline.count < 2) return // Need at least 2 data points
    
    const avgRate = baseline.rates.reduce((a, b) => a + b, 0) / baseline.rates.length
    const avgAmount = baseline.totalAmount / baseline.count
    
    // Price deviation anomaly
    if (avgRate > 0) {
      const deviation = ((po.rate - avgRate) / avgRate) * 100
      
      if (Math.abs(deviation) > 30 && isFinite(deviation)) {
        anomalies.push({
          type: 'Price Deviation',
          description: `Item price ${deviation > 0 ? 'increased' : 'decreased'} by ${Math.abs(deviation).toFixed(1)}% from historical average`,
          severity: Math.abs(deviation) > 50 ? 'high' : 'medium',
          itemName: po.item,
          category: po.itemLedgerGroup || 'Uncategorized',
          supplier: po.supplier,
          branch: po.branch || 'N/A',
          date: po.date.split('T')[0],
          relatedPOs: [po],
          metrics: {
            currentValue: po.rate,
            expectedValue: avgRate,
            deviation: deviation,
            unit: '₹ per unit'
          },
          suggestedActions: [
            'Contact supplier to verify pricing',
            'Check for quantity discount changes',
            'Review purchase agreement terms',
            deviation > 0 ? 'Consider alternative suppliers' : 'Confirm quality standards maintained'
          ]
        })
      }
    }
    
    // Large order anomaly
    if (po.totalAmount > avgAmount * 3 && baseline.count > 3) {
      anomalies.push({
        type: 'Unusually Large Order',
        description: `Order value is ${(po.totalAmount / avgAmount).toFixed(1)}x the typical order size for this item`,
        severity: po.totalAmount > avgAmount * 5 ? 'high' : 'medium',
        itemName: po.item,
        category: po.itemLedgerGroup || 'Uncategorized',
        supplier: po.supplier,
        branch: po.branch || 'N/A',
        date: po.date.split('T')[0],
        relatedPOs: [po],
        metrics: {
          currentValue: po.totalAmount,
          expectedValue: avgAmount,
          deviation: ((po.totalAmount - avgAmount) / avgAmount) * 100,
          unit: '₹'
        },
        suggestedActions: [
          'Verify order quantity is correct',
          'Check if this is a bulk purchase',
          'Confirm budget allocation',
          'Review approval hierarchy'
        ]
      })
    }
  })

  // Check for duplicate orders on same day
  const dailyOrders: Record<string, PurchaseOrder[]> = {}
  pos.forEach(po => {
    const key = `${po.date.split('T')[0]}-${po.supplier}-${po.item}`
    if (!dailyOrders[key]) dailyOrders[key] = []
    dailyOrders[key].push(po)
  })

  Object.entries(dailyOrders).forEach(([key, orders]) => {
    if (orders.length > 1) {
      const [date, supplier, item] = key.split('-')
      const totalAmount = orders.reduce((sum, po) => sum + po.totalAmount, 0)
      
      anomalies.push({
        type: 'Potential Duplicate Orders',
        description: `${orders.length} orders placed for the same item from same supplier on the same day`,
        severity: 'medium',
        itemName: item,
        category: orders[0].itemLedgerGroup || 'Uncategorized',
        supplier: supplier,
        branch: orders[0].branch || 'N/A',
        date: date,
        relatedPOs: orders,
        metrics: {
          currentValue: orders.length,
          expectedValue: 1,
          deviation: ((orders.length - 1) / 1) * 100,
          unit: 'orders'
        },
        suggestedActions: [
          'Verify if multiple orders are intentional',
          'Check for data entry errors',
          'Consolidate orders if possible',
          'Cancel duplicate if confirmed'
        ]
      })
    }
  })

  // High volume from single supplier
  const supplierDailyVolume: Record<string, { date: string, pos: PurchaseOrder[], amount: number }> = {}
  pos.forEach(po => {
    const key = `${po.date.split('T')[0]}-${po.supplier}`
    if (!supplierDailyVolume[key]) {
      supplierDailyVolume[key] = { date: po.date.split('T')[0], pos: [], amount: 0 }
    }
    supplierDailyVolume[key].pos.push(po)
    supplierDailyVolume[key].amount += po.totalAmount
  })

  Object.entries(supplierDailyVolume).forEach(([key, data]) => {
    if (data.pos.length > 10 && data.amount > 1000000) { // More than 10 orders or > 10L
      const [date, supplier] = key.split('-')
      
      anomalies.push({
        type: 'High Volume Day',
        description: `Unusually high number of orders (${data.pos.length}) from ${supplier} totaling ₹${(data.amount / 100000).toFixed(1)}L`,
        severity: data.amount > 5000000 ? 'high' : 'medium',
        itemName: `${data.pos.length} items`,
        category: 'Multiple',
        supplier: supplier,
        branch: data.pos[0].branch || 'N/A',
        date: date,
        relatedPOs: data.pos,
        metrics: {
          currentValue: data.amount,
          expectedValue: data.amount / 2,
          deviation: 100,
          unit: '₹'
        },
        suggestedActions: [
          'Review bulk order justification',
          'Verify budget impact',
          'Check if inventory levels warrant large purchase',
          'Confirm supplier capacity'
        ]
      })
    }
  })

  return anomalies.sort((a, b) => {
    const severityOrder = { high: 0, medium: 1, low: 2 }
    return severityOrder[a.severity] - severityOrder[b.severity]
  })
}
