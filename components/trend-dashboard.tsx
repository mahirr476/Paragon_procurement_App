'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PurchaseOrder } from '@/lib/types'
import { TrendingUp, AlertTriangle, Target, Building2, Package } from 'lucide-react'
import { analyzePeriodTrends, analyzeSupplierTrends, identifyDetailedAnomalies, TrendAnomaly } from '@/lib/trend-analyzer'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts'
import { AnomalyDetailPanel } from './anomaly-detail-panel'

interface TrendDashboardProps {
  currentPOs: PurchaseOrder[]
  approvedPOs: PurchaseOrder[]
  timePeriod?: 'daily' | 'weekly' | 'monthly' | 'yearly'
}

export function TrendDashboard({ currentPOs, approvedPOs, timePeriod = 'monthly' }: TrendDashboardProps) {
  const allPOs = [...approvedPOs, ...currentPOs]
  
  const [selectedBranch, setSelectedBranch] = useState<string>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedAnomaly, setSelectedAnomaly] = useState<TrendAnomaly | null>(null)
  const [resolvedAnomalies, setResolvedAnomalies] = useState<Set<string>>(new Set())

  const branches = useMemo(() => {
    const branchSet = new Set(allPOs.map(po => po.branch).filter(Boolean))
    return ['all', ...Array.from(branchSet)]
  }, [allPOs])

  const categories = useMemo(() => {
    const categorySet = new Set(allPOs.map(po => po.itemLedgerGroup).filter(Boolean))
    return ['all', ...Array.from(categorySet)]
  }, [allPOs])

  const filteredPOs = useMemo(() => {
    return allPOs.filter(po => {
      const matchBranch = selectedBranch === 'all' || po.branch === selectedBranch
      const matchCategory = selectedCategory === 'all' || po.itemLedgerGroup === selectedCategory
      return matchBranch && matchCategory
    })
  }, [allPOs, selectedBranch, selectedCategory])

  const monthlyTrends = useMemo(() => {
    const period = timePeriod === 'yearly' ? 'monthly' : timePeriod === 'monthly' ? 'monthly' : timePeriod === 'weekly' ? 'weekly' : 'daily'
    return analyzePeriodTrends(filteredPOs, period)
  }, [filteredPOs, timePeriod])

  const supplierTrends = useMemo(() => analyzeSupplierTrends(filteredPOs), [filteredPOs])
  
  const allAnomalies = useMemo(() => identifyDetailedAnomalies(filteredPOs), [filteredPOs])
  const anomalies = useMemo(() => {
    return allAnomalies.filter(a => {
      const key = `${a.date}-${a.itemName}-${a.type}`
      return !resolvedAnomalies.has(key)
    })
  }, [allAnomalies, resolvedAnomalies])

  const handleResolveAnomaly = (anomaly: TrendAnomaly) => {
    const key = `${anomaly.date}-${anomaly.itemName}-${anomaly.type}`
    setResolvedAnomalies(prev => new Set([...prev, key]))
    setSelectedAnomaly(null)
  }

  const avgMonthlyOrders = monthlyTrends.length > 0
    ? Math.round(monthlyTrends.reduce((sum, t) => sum + t.orderCount, 0) / monthlyTrends.length)
    : 0

  const avgMonthlyAmount = monthlyTrends.length > 0
    ? monthlyTrends.reduce((sum, t) => sum + t.totalAmount, 0) / monthlyTrends.length
    : 0

  const trendDirection = monthlyTrends.length >= 2
    ? monthlyTrends[monthlyTrends.length - 1].totalAmount > monthlyTrends[0].totalAmount ? 'up' : 'down'
    : 'stable'

  const avgVolatility = supplierTrends.length > 0
    ? supplierTrends.reduce((sum, s) => sum + (isFinite(s.rateVolatility) ? s.rateVolatility : 0), 0) / supplierTrends.length
    : 0

  const topSuppliersByCategory = useMemo(() => {
    const categoryMap: Record<string, typeof supplierTrends> = {}
    
    supplierTrends.forEach(supplier => {
      const supplierPOs = filteredPOs.filter(po => po.supplier === supplier.supplier)
      supplierPOs.forEach(po => {
        const cat = po.itemLedgerGroup || 'Uncategorized'
        if (!categoryMap[cat]) categoryMap[cat] = []
        const existing = categoryMap[cat].find(s => s.supplier === supplier.supplier)
        if (!existing) {
          categoryMap[cat].push({...supplier})
        }
      })
    })

    return categoryMap
  }, [supplierTrends, filteredPOs])

  const topSuppliers = supplierTrends
    .sort((a, b) => b.orderCount - a.orderCount)
    .slice(0, 10)

  const branchComparison = useMemo(() => {
    const branchData: Record<string, { spending: number, orders: number, branch: string }> = {}
    
    filteredPOs.forEach(po => {
      const branch = po.branch || 'Unknown'
      if (!branchData[branch]) {
        branchData[branch] = { spending: 0, orders: 0, branch }
      }
      branchData[branch].spending += po.amount || 0
      branchData[branch].orders += 1
    })

    return Object.values(branchData)
      .sort((a, b) => b.spending - a.spending)
      .slice(0, 10)
  }, [filteredPOs])

  const categorySpending = useMemo(() => {
    const catData: Record<string, { category: string, spending: number, orders: number }> = {}
    
    filteredPOs.forEach(po => {
      const cat = po.itemLedgerGroup || 'Uncategorized'
      if (!catData[cat]) {
        catData[cat] = { category: cat, spending: 0, orders: 0 }
      }
      catData[cat].spending += po.amount || 0
      catData[cat].orders += 1
    })

    return Object.values(catData)
      .sort((a, b) => b.spending - a.spending)
      .slice(0, 8)
  }, [filteredPOs])

  if (allPOs.length === 0) {
    return (
      <Card className="bg-neutral-900 border-neutral-700">
        <CardContent className="p-8 text-center">
          <TrendingUp className="w-8 h-8 text-neutral-500 mx-auto mb-3" />
          <p className="text-neutral-400 text-sm">Upload PO data to view trends</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-neutral-400" />
          <Select value={selectedBranch} onValueChange={setSelectedBranch}>
            <SelectTrigger className="w-48 bg-neutral-800 border-neutral-700">
              <SelectValue placeholder="Select Branch" />
            </SelectTrigger>
            <SelectContent>
              {branches.map(branch => (
                <SelectItem key={branch} value={branch}>
                  {branch === 'all' ? 'All Branches' : branch}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-neutral-400" />
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-48 bg-neutral-800 border-neutral-700">
              <SelectValue placeholder="Select Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat}>
                  {cat === 'all' ? 'All Categories' : cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <p className="text-xs text-neutral-400 mb-2">AVG MONTHLY ORDERS</p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold text-white">{avgMonthlyOrders}</p>
              <Badge className={trendDirection === 'up' ? 'bg-green-500/20 text-green-500' : trendDirection === 'down' ? 'bg-red-500/20 text-red-500' : 'bg-neutral-500/20 text-neutral-500'}>
                {trendDirection === 'up' ? '↑' : trendDirection === 'down' ? '↓' : '→'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <p className="text-xs text-neutral-400 mb-2">AVG MONTHLY SPENDING</p>
            <p className="text-2xl font-bold text-white">₹{(avgMonthlyAmount / 100000).toFixed(1)}L</p>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <p className="text-xs text-neutral-400 mb-2">SUPPLIER VOLATILITY</p>
            <p className="text-2xl font-bold text-white">
              {(avgVolatility * 100).toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <p className="text-xs text-neutral-400 mb-2">ANOMALIES DETECTED</p>
            <p className="text-2xl font-bold text-orange-500">{anomalies.length}</p>
          </CardContent>
        </Card>
      </div>

      {monthlyTrends.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="bg-neutral-900 border-neutral-700">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">SPENDING TREND ({timePeriod.toUpperCase()})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
                    <XAxis dataKey="label" stroke="#999" style={{ fontSize: '11px' }} angle={-45} textAnchor="end" height={80} />
                    <YAxis stroke="#999" style={{ fontSize: '12px' }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #404040' }}
                      formatter={(value: any) => `₹${(value / 100000).toFixed(2)}L`}
                    />
                    <Bar dataKey="totalAmount" fill="#f97316" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-neutral-900 border-neutral-700">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">TOP BRANCHES BY SPENDING</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={branchComparison} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
                    <XAxis type="number" stroke="#999" style={{ fontSize: '12px' }} />
                    <YAxis dataKey="branch" type="category" stroke="#999" style={{ fontSize: '10px' }} width={100} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #404040' }}
                      formatter={(value: any) => `₹${(value / 100000).toFixed(2)}L`}
                    />
                    <Bar dataKey="spending" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {categorySpending.length > 0 && (
        <Card className="bg-neutral-900 border-neutral-700">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">SPENDING BY CATEGORY</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categorySpending}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
                  <XAxis dataKey="category" stroke="#999" style={{ fontSize: '11px' }} angle={-45} textAnchor="end" height={100} />
                  <YAxis stroke="#999" style={{ fontSize: '12px' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #404040' }}
                    formatter={(value: any, name: string) => {
                      if (name === 'spending') return [`₹${(value / 100000).toFixed(2)}L`, 'Total Spending']
                      return [value, 'Orders']
                    }}
                  />
                  <Legend />
                  <Bar dataKey="spending" fill="#f97316" name="Spending (₹)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="orders" fill="#10b981" name="Order Count" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-neutral-900 border-neutral-700">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">TOP SUPPLIERS BY FREQUENCY</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(topSuppliersByCategory).map(([category, suppliers]) => (
              <div key={category}>
                <p className="text-xs text-neutral-400 mb-2 font-medium">{category}</p>
                <div className="space-y-2">
                  {suppliers.slice(0, 3).map((supplier) => (
                    <div key={supplier.supplier} className="flex items-center justify-between p-3 bg-neutral-800 rounded">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{supplier.supplier}</p>
                        <p className="text-xs text-neutral-500">
                          {supplier.orderCount} orders · Last: {supplier.lastOrderDate} · {supplier.frequency}
                        </p>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-sm font-mono text-orange-500">₹{(supplier.totalAmount / 100000).toFixed(1)}L</p>
                        <p className={`text-xs ${!isFinite(supplier.rateVolatility) ? 'text-neutral-500' : supplier.rateVolatility > 0.15 ? 'text-red-400' : 'text-green-400'}`}>
                          Vol: {isFinite(supplier.rateVolatility) ? `${(supplier.rateVolatility * 100).toFixed(1)}%` : 'N/A'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            
            {Object.keys(topSuppliersByCategory).length === 0 && (
              <div className="space-y-2">
                {topSuppliers.map((supplier) => (
                  <div key={supplier.supplier} className="flex items-center justify-between p-3 bg-neutral-800 rounded">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{supplier.supplier}</p>
                      <p className="text-xs text-neutral-500">
                        {supplier.orderCount} orders · Last: {supplier.lastOrderDate} · {supplier.frequency}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-sm font-mono text-orange-500">₹{(supplier.totalAmount / 100000).toFixed(1)}L</p>
                      <p className={`text-xs ${!isFinite(supplier.rateVolatility) ? 'text-neutral-500' : supplier.rateVolatility > 0.15 ? 'text-red-400' : 'text-green-400'}`}>
                        Vol: {isFinite(supplier.rateVolatility) ? `${(supplier.rateVolatility * 100).toFixed(1)}%` : 'N/A'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {anomalies.length > 0 && (
        <Card className="bg-neutral-900 border-neutral-700">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              DETECTED ANOMALIES ({anomalies.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {anomalies.map((anomaly, idx) => (
                <div 
                  key={idx} 
                  className={`flex items-start gap-3 p-3 border rounded text-sm cursor-pointer hover:bg-neutral-800/50 transition-colors ${
                    anomaly.severity === 'high' ? 'bg-red-500/10 border-red-500/20' :
                    anomaly.severity === 'medium' ? 'bg-orange-500/10 border-orange-500/20' :
                    'bg-yellow-500/10 border-yellow-500/20'
                  }`}
                  onClick={() => setSelectedAnomaly(anomaly)}
                >
                  <Package className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                    anomaly.severity === 'high' ? 'text-red-500' :
                    anomaly.severity === 'medium' ? 'text-orange-500' :
                    'text-yellow-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium">{anomaly.type}</p>
                        <p className="text-neutral-300 text-xs mt-1">{anomaly.itemName} · {anomaly.category}</p>
                      </div>
                      <Badge variant="outline" className="text-xs whitespace-nowrap">
                        {anomaly.date}
                      </Badge>
                    </div>
                    <p className="text-neutral-400 text-xs mt-2">{anomaly.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-neutral-500">{anomaly.supplier}</span>
                      <span className="text-xs text-neutral-600">•</span>
                      <span className="text-xs text-neutral-500">{anomaly.branch}</span>
                      <span className="text-xs text-neutral-600">•</span>
                      <span className="text-xs text-orange-500">Click for details</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <AnomalyDetailPanel
        anomaly={selectedAnomaly}
        onClose={() => setSelectedAnomaly(null)}
        onResolve={handleResolveAnomaly}
      />
    </div>
  )
}
