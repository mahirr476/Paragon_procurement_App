import { PurchaseOrder, AnalysisResult } from './types'

export function analyzeOrders(currentOrders: PurchaseOrder[], approvedOrders: PurchaseOrder[]): AnalysisResult[] {
  const results: AnalysisResult[] = []

  currentOrders.forEach(current => {
    // Price anomaly detection
    const priceResults = checkPriceAnomalies(current, approvedOrders)
    results.push(...priceResults)

    // Duplicate detection
    const duplicateResults = checkDuplicates(current, currentOrders)
    results.push(...duplicateResults)

    // Pattern analysis
    const patternResults = analyzeSupplierPatterns(current, approvedOrders)
    results.push(...patternResults)

    // Risk flags
    const riskResults = identifyRisks(current, approvedOrders)
    results.push(...riskResults)
  })

  return results
}

function checkPriceAnomalies(po: PurchaseOrder, approved: PurchaseOrder[]): AnalysisResult[] {
  const results: AnalysisResult[] = []
  const similar = approved.filter(
    a => a.item.toLowerCase().includes(po.item.toLowerCase()) || 
         po.item.toLowerCase().includes(a.item.toLowerCase())
  )

  if (similar.length === 0) {
    results.push({
      type: 'price_anomaly',
      severity: 'low',
      message: `No historical price data available for comparison. This is the first order for "${po.item}" (Rate: ₹${po.rate.toFixed(2)})`,
      poId: po.id,
      details: { currentRate: po.rate, historicalCount: 0, reason: 'no_baseline' }
    })
    return results
  }

  const avgRate = similar.reduce((sum, a) => sum + a.rate, 0) / similar.length
  
  if (avgRate === 0) {
    results.push({
      type: 'price_anomaly',
      severity: 'medium',
      message: `Cannot calculate price deviation - Historical average rate is ₹0. Current rate: ₹${po.rate.toFixed(2)}. Review pricing for "${po.item}"`,
      poId: po.id,
      details: { avgRate: 0, currentRate: po.rate, historicalCount: similar.length, reason: 'zero_baseline' }
    })
    return results
  }

  const percentDiff = Math.abs((po.rate - avgRate) / avgRate) * 100

  if (percentDiff > 20) {
    results.push({
      type: 'price_anomaly',
      severity: percentDiff > 50 ? 'critical' : percentDiff > 35 ? 'high' : 'medium',
      message: `Price deviation of ${percentDiff.toFixed(1)}% from historical average (₹${avgRate.toFixed(2)} vs ₹${po.rate.toFixed(2)})`,
      poId: po.id,
      details: { avgRate, currentRate: po.rate, percentDiff, historicalCount: similar.length }
    })
  }

  return results
}

function checkDuplicates(po: PurchaseOrder, all: PurchaseOrder[]): AnalysisResult[] {
  const results: AnalysisResult[] = []
  const duplicates = all.filter(
    a => a.id !== po.id &&
         a.orderNo === po.orderNo &&
         a.supplier === po.supplier &&
         a.item === po.item
  )

  if (duplicates.length > 0) {
    results.push({
      type: 'duplicate',
      severity: 'high',
      message: `Potential duplicate order found (${duplicates.length} match)`,
      poId: po.id,
      details: { duplicateIds: duplicates.map(d => d.id), orderNo: po.orderNo }
    })
  }

  return results
}

function analyzeSupplierPatterns(po: PurchaseOrder, approved: PurchaseOrder[]): AnalysisResult[] {
  const results: AnalysisResult[] = []
  const supplierOrders = approved.filter(a => a.supplier === po.supplier)

  if (supplierOrders.length > 5) {
    const avgAmount = supplierOrders.reduce((sum, a) => sum + a.totalAmount, 0) / supplierOrders.length
    const percentDiff = Math.abs((po.totalAmount - avgAmount) / avgAmount) * 100

    if (percentDiff > 100) {
      results.push({
        type: 'pattern',
        severity: 'medium',
        message: `Unusual order size: ${percentDiff.toFixed(1)}% above supplier average`,
        poId: po.id,
        details: { supplierAvg: avgAmount, currentAmount: po.totalAmount }
      })
    }
  }

  return results
}

function identifyRisks(po: PurchaseOrder, approved: PurchaseOrder[]): AnalysisResult[] {
  const results: AnalysisResult[] = []

  // New supplier risk
  const supplierExists = approved.some(a => a.supplier === po.supplier)
  if (!supplierExists) {
    results.push({
      type: 'risk_flag',
      severity: 'medium',
      message: 'New/Unverified supplier - Not found in approved PO history',
      poId: po.id,
      details: { newSupplier: po.supplier }
    })
  }

  // High value order
  if (po.totalAmount > 500000) {
    results.push({
      type: 'risk_flag',
      severity: 'high',
      message: `High-value order: ₹${po.totalAmount.toLocaleString()}`,
      poId: po.id,
      details: { amount: po.totalAmount }
    })
  }

  // Rate mismatch
  if (po.lastApprovedRate > 0 && po.rate > po.lastApprovedRate * 1.1) {
    const increase = ((po.rate - po.lastApprovedRate) / po.lastApprovedRate * 100).toFixed(1)
    results.push({
      type: 'risk_flag',
      severity: 'medium',
      message: `Rate increased ${increase}% from last approved (₹${po.lastApprovedRate.toFixed(2)})`,
      poId: po.id,
      details: { lastRate: po.lastApprovedRate, currentRate: po.rate }
    })
  }

  return results
}
