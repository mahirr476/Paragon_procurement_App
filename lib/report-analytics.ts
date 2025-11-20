import type { PurchaseOrder } from "./types"

export interface SpendByCategory {
  category: string
  amount: number
  percentage: number
  orderCount: number
  [key: string]: string | number // Index signature for Recharts compatibility
}

export interface SpendBySupplier {
  supplier: string
  amount: number
  percentage: number
  orderCount: number
  [key: string]: string | number // Index signature for Recharts compatibility
}

export interface SpendTrend {
  period: string
  amount: number
  orderCount: number
  [key: string]: string | number // Index signature for Recharts compatibility
}

export interface SupplierPerformance {
  supplier: string
  onTimeDeliveryRate: number
  averageLeadTime: number
  priceVariance: number
  totalOrders: number
  [key: string]: string | number // Index signature for Recharts compatibility
}

export interface POVolumeData {
  month: string
  volume: number
  value: number
  [key: string]: string | number // Index signature for Recharts compatibility
}

export interface RiskData {
  supplier: string
  concentration: number
  singleSourceItems: string[]
  totalSpend: number
  [key: string]: string | number | string[] // Index signature for Recharts compatibility
}

export function analyzeSpendByCategory(pos: PurchaseOrder[]): SpendByCategory[] {
  const categoryMap = new Map<string, { amount: number; count: number }>()
  let totalSpend = 0

  pos.forEach((po) => {
    const category = po.itemLedgerGroup || "Uncategorized"
    const existing = categoryMap.get(category) || { amount: 0, count: 0 }
    categoryMap.set(category, {
      amount: existing.amount + po.totalAmount,
      count: existing.count + 1,
    })
    totalSpend += po.totalAmount
  })

  return Array.from(categoryMap.entries())
    .map(([category, data]) => ({
      category,
      amount: data.amount,
      percentage: (data.amount / totalSpend) * 100,
      orderCount: data.count,
    }))
    .sort((a, b) => b.amount - a.amount)
}

export function analyzeSpendBySupplier(pos: PurchaseOrder[], limit = 20): SpendBySupplier[] {
  const supplierMap = new Map<string, { amount: number; count: number }>()
  let totalSpend = 0

  pos.forEach((po) => {
    const supplier = po.supplier || "Unknown"
    const existing = supplierMap.get(supplier) || { amount: 0, count: 0 }
    supplierMap.set(supplier, {
      amount: existing.amount + po.totalAmount,
      count: existing.count + 1,
    })
    totalSpend += po.totalAmount
  })

  return Array.from(supplierMap.entries())
    .map(([supplier, data]) => ({
      supplier,
      amount: data.amount,
      percentage: (data.amount / totalSpend) * 100,
      orderCount: data.count,
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, limit)
}

export function analyzeSpendTrend(pos: PurchaseOrder[], period: "monthly" | "quarterly" = "monthly"): SpendTrend[] {
  const trendMap = new Map<string, { amount: number; count: number }>()

  pos.forEach((po) => {
    const date = new Date(po.date)
    if (isNaN(date.getTime())) return

    let key: string
    if (period === "monthly") {
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
    } else {
      const quarter = Math.floor(date.getMonth() / 3) + 1
      key = `${date.getFullYear()}-Q${quarter}`
    }

    const existing = trendMap.get(key) || { amount: 0, count: 0 }
    trendMap.set(key, {
      amount: existing.amount + po.totalAmount,
      count: existing.count + 1,
    })
  })

  return Array.from(trendMap.entries())
    .map(([period, data]) => ({
      period,
      amount: data.amount,
      orderCount: data.count,
    }))
    .sort((a, b) => a.period.localeCompare(b.period))
}

export function analyzeSupplierPerformance(pos: PurchaseOrder[]): SupplierPerformance[] {
  const supplierMap = new Map<
    string,
    {
      onTimeCount: number
      totalOrders: number
      leadTimes: number[]
      prices: number[]
    }
  >()

  pos.forEach((po) => {
    const supplier = po.supplier || "Unknown"
    const existing = supplierMap.get(supplier) || {
      onTimeCount: 0,
      totalOrders: 0,
      leadTimes: [],
      prices: [],
    }

    // Calculate lead time
    const orderDate = new Date(po.date)
    const deliveryDate = new Date(po.deliveryDate)
    if (!isNaN(orderDate.getTime()) && !isNaN(deliveryDate.getTime())) {
      const leadTime = Math.ceil((deliveryDate.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24))
      existing.leadTimes.push(leadTime)

      // On-time if delivered within expected timeframe (assume 30 days)
      if (leadTime <= 30) {
        existing.onTimeCount++
      }
    }

    existing.totalOrders++
    existing.prices.push(po.rate)

    supplierMap.set(supplier, existing)
  })

  return Array.from(supplierMap.entries())
    .map(([supplier, data]) => {
      const avgLeadTime =
        data.leadTimes.length > 0 ? data.leadTimes.reduce((a, b) => a + b, 0) / data.leadTimes.length : 0

      const avgPrice = data.prices.reduce((a, b) => a + b, 0) / data.prices.length
      const priceVariance =
        data.prices.length > 1
          ? (Math.sqrt(
              data.prices.reduce((sum, price) => sum + Math.pow(price - avgPrice, 2), 0) / data.prices.length,
            ) /
              avgPrice) *
            100
          : 0

      return {
        supplier,
        onTimeDeliveryRate: data.totalOrders > 0 ? (data.onTimeCount / data.totalOrders) * 100 : 0,
        averageLeadTime: avgLeadTime,
        priceVariance,
        totalOrders: data.totalOrders,
      }
    })
    .filter((s) => s.totalOrders >= 3) // Only include suppliers with 3+ orders
    .sort((a, b) => b.totalOrders - a.totalOrders)
}

export function analyzePOVolume(pos: PurchaseOrder[]): POVolumeData[] {
  const monthMap = new Map<string, { volume: number; value: number }>()

  pos.forEach((po) => {
    const date = new Date(po.date)
    if (isNaN(date.getTime())) return

    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
    const existing = monthMap.get(key) || { volume: 0, value: 0 }
    monthMap.set(key, {
      volume: existing.volume + 1,
      value: existing.value + po.totalAmount,
    })
  })

  return Array.from(monthMap.entries())
    .map(([month, data]) => ({
      month,
      volume: data.volume,
      value: data.value,
    }))
    .sort((a, b) => a.month.localeCompare(b.month))
}

export function analyzeSupplierConcentration(pos: PurchaseOrder[]): RiskData[] {
  const supplierMap = new Map<string, { spend: number; items: Set<string> }>()
  let totalSpend = 0

  pos.forEach((po) => {
    const supplier = po.supplier || "Unknown"
    const existing = supplierMap.get(supplier) || { spend: 0, items: new Set<string>() }
    existing.spend += po.totalAmount
    existing.items.add(po.item)
    supplierMap.set(supplier, existing)
    totalSpend += po.totalAmount
  })

  // Find single-source items
  const itemSuppliers = new Map<string, Set<string>>()
  pos.forEach((po) => {
    const suppliers = itemSuppliers.get(po.item) || new Set<string>()
    suppliers.add(po.supplier)
    itemSuppliers.set(po.item, suppliers)
  })

  const singleSourceItems = Array.from(itemSuppliers.entries())
    .filter(([_, suppliers]) => suppliers.size === 1)
    .map(([item]) => item)

  return Array.from(supplierMap.entries())
    .map(([supplier, data]) => ({
      supplier,
      concentration: (data.spend / totalSpend) * 100,
      singleSourceItems: singleSourceItems.filter((item) =>
        pos.some((po) => po.supplier === supplier && po.item === item),
      ),
      totalSpend: data.spend,
    }))
    .sort((a, b) => b.concentration - a.concentration)
}

export function calculateCostPerPO(pos: PurchaseOrder[]): number {
  if (pos.length === 0) return 0
  const totalSpend = pos.reduce((sum, po) => sum + po.totalAmount, 0)
  return totalSpend / pos.length
}

export function calculateAveragePOValue(pos: PurchaseOrder[]): { current: number; trend: number } {
  if (pos.length === 0) return { current: 0, trend: 0 }

  const sortedPOs = [...pos].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  const midpoint = Math.floor(sortedPOs.length / 2)

  const firstHalf = sortedPOs.slice(0, midpoint)
  const secondHalf = sortedPOs.slice(midpoint)

  const avgFirst = firstHalf.reduce((sum, po) => sum + po.totalAmount, 0) / firstHalf.length
  const avgSecond = secondHalf.reduce((sum, po) => sum + po.totalAmount, 0) / secondHalf.length

  const trend = avgFirst > 0 ? ((avgSecond - avgFirst) / avgFirst) * 100 : 0

  return {
    current: avgSecond,
    trend,
  }
}
