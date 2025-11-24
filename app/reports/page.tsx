"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { getApprovedPOs } from "@/lib/storage"
import type { PurchaseOrder } from "@/lib/types"
import {
  analyzeSpendByCategory,
  analyzeSpendBySupplier,
  analyzeSpendTrend,
  analyzeSupplierPerformance,
  analyzePOVolume,
  analyzeSupplierConcentration,
  calculateAveragePOValue,
} from "@/lib/report-analytics"
import { analyzePeriodTrends, analyzeSupplierTrends, identifyDetailedAnomalies, TrendAnomaly } from "@/lib/trend-analyzer"
import { AnomalyDetailPanel } from "@/components/anomaly-detail-panel"
import { BarChart3, TrendingUp, AlertTriangle, DollarSign, Package, FileText, Download, Filter, Settings2, Building2, Target, Eye, EyeOff } from "lucide-react"
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

// View visibility state interface
interface ViewVisibility {
  stats: boolean
  topBranchesAndCategory: boolean
  supplierPerformance: boolean
  spendingTrends: boolean
  riskManagement: boolean
  anomalies: boolean
}

export default function ReportsPage() {
  const [pos, setPos] = useState<PurchaseOrder[]>([])
  const [period, setPeriod] = useState<"monthly" | "quarterly">("monthly")
  const [timePeriod, setTimePeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly')

  // Filters
  const [selectedBranch, setSelectedBranch] = useState<string>("all")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [supplierCategory, setSupplierCategory] = useState<string>("all")
  const [spendTrendCategory, setSpendTrendCategory] = useState<string>("all")
  const [riskCategory, setRiskCategory] = useState<string>("all")
  const [anomalyCategory, setAnomalyCategory] = useState<string>("all")

  // Anomaly state
  const [selectedAnomaly, setSelectedAnomaly] = useState<TrendAnomaly | null>(null)
  const [resolvedAnomalies, setResolvedAnomalies] = useState<Set<string>>(new Set())

  // View visibility toggles
  const [showSettings, setShowSettings] = useState(false)
  const [viewVisibility, setViewVisibility] = useState<ViewVisibility>({
    stats: true,
    topBranchesAndCategory: true,
    supplierPerformance: true,
    spendingTrends: true,
    riskManagement: true,
    anomalies: true,
  })

  const toggleView = (view: keyof ViewVisibility) => {
    setViewVisibility(prev => ({ ...prev, [view]: !prev[view] }))
  }

  useEffect(() => {
    async function loadPOs() {
      try {
        const approvedPOs = await getApprovedPOs()
        console.log('[Reports] Loaded approved POs:', approvedPOs.length)
        setPos(approvedPOs)
      } catch (error) {
        console.error('[Reports] Error loading POs:', error)
        setPos([])
      }
    }
    loadPOs()

    const handleFocus = () => loadPOs()
    const handlePOsApproved = () => {
      console.log('[Reports] POs approved, refreshing...')
      loadPOs()
    }

    window.addEventListener('focus', handleFocus)
    window.addEventListener('pos-approved', handlePOsApproved)

    const interval = setInterval(() => loadPOs(), 3000)

    return () => {
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('pos-approved', handlePOsApproved)
      clearInterval(interval)
    }
  }, [])

  // Apply branch and category filters
  const filteredPOs = useMemo(() => {
    return pos.filter(po => {
      const matchBranch = selectedBranch === 'all' || po.branch === selectedBranch
      const matchCategory = selectedCategory === 'all' || po.itemLedgerGroup === selectedCategory
      return matchBranch && matchCategory
    })
  }, [pos, selectedBranch, selectedCategory])

  const branches = useMemo(() => {
    if (!Array.isArray(pos)) return []
    const uniqueBranches = Array.from(new Set(pos.map((po) => po.branch).filter(Boolean)))
    return uniqueBranches.sort()
  }, [pos])

  const categories = useMemo(() => {
    if (!Array.isArray(pos)) return []
    const uniqueCategories = Array.from(new Set(pos.map((po) => po.itemLedgerGroup).filter(Boolean)))
    return uniqueCategories.sort()
  }, [pos])

  // Trend Dashboard metrics
  const monthlyTrends = useMemo(() => {
    const periodType = timePeriod === 'yearly' ? 'monthly' : timePeriod === 'monthly' ? 'monthly' : timePeriod === 'weekly' ? 'weekly' : 'daily'
    return analyzePeriodTrends(filteredPOs, periodType)
  }, [filteredPOs, timePeriod])

  const supplierTrends = useMemo(() => analyzeSupplierTrends(filteredPOs), [filteredPOs])

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

  const branchComparison = useMemo(() => {
    const branchData: Record<string, { spending: number, orders: number, branch: string }> = {}

    filteredPOs.forEach(po => {
      const branch = po.branch || 'Unknown'
      if (!branchData[branch]) {
        branchData[branch] = { spending: 0, orders: 0, branch }
      }
      branchData[branch].spending += po.totalAmount || 0
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
      catData[cat].spending += po.totalAmount || 0
      catData[cat].orders += 1
    })

    return Object.values(catData)
      .sort((a, b) => b.spending - a.spending)
      .slice(0, 8)
  }, [filteredPOs])

  // Reports page metrics
  const supplierPerformance = useMemo(() => {
    const categoryFiltered =
      supplierCategory === "all" ? filteredPOs : filteredPOs.filter((po) => po.itemLedgerGroup === supplierCategory)
    return analyzeSupplierPerformance(categoryFiltered)
  }, [filteredPOs, supplierCategory])

  const spendTrend = useMemo(() => {
    const categoryFiltered =
      spendTrendCategory === "all" ? filteredPOs : filteredPOs.filter((po) => po.itemLedgerGroup === spendTrendCategory)
    return analyzeSpendTrend(categoryFiltered, period)
  }, [filteredPOs, spendTrendCategory, period])

  const riskData = useMemo(() => {
    const categoryFiltered =
      riskCategory === "all" ? filteredPOs : filteredPOs.filter((po) => po.itemLedgerGroup === riskCategory)
    return analyzeSupplierConcentration(categoryFiltered)
  }, [filteredPOs, riskCategory])

  const avgPOValue = useMemo(() => calculateAveragePOValue(filteredPOs), [filteredPOs])

  const allAnomalies = useMemo(() => {
    const categoryFiltered =
      anomalyCategory === "all" ? filteredPOs : filteredPOs.filter((po) => po.itemLedgerGroup === anomalyCategory)
    return identifyDetailedAnomalies(categoryFiltered)
  }, [filteredPOs, anomalyCategory])

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

  // Top Suppliers by Frequency (from Trends)
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

  const totalSpend = filteredPOs.reduce((sum, po) => sum + po.totalAmount, 0)
  const totalOrders = filteredPOs.length
  const uniqueSuppliers = new Set(filteredPOs.map((po) => po.supplier)).size

  return (
    <div className="p-6 space-y-6 bg-background">
      {/* Header with Filters and Settings */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Advanced Reports & Analytics</h1>
          <p className="text-muted-foreground text-sm">Comprehensive procurement intelligence and insights</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
            className="gap-2"
          >
            <Settings2 className="w-4 h-4" />
            {showSettings ? 'Hide' : 'Show'} Settings
          </Button>
          <Button className="bg-accent hover:bg-accent/90">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <Card className="bg-card border-border p-4">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Customize View
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(viewVisibility).map(([key, value]) => (
              <div key={key} className="flex items-center space-x-2">
                <Switch
                  id={key}
                  checked={value}
                  onCheckedChange={() => toggleView(key as keyof ViewVisibility)}
                />
                <Label htmlFor={key} className="text-sm cursor-pointer">
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </Label>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Global Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 bg-card/50 rounded-lg px-3 py-2 border border-border">
          <Building2 className="w-4 h-4 text-muted-foreground" />
          <Select value={selectedBranch} onValueChange={setSelectedBranch}>
            <SelectTrigger className="w-48 border-none bg-transparent text-foreground">
              <SelectValue placeholder="Filter by Branch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Branches</SelectItem>
              {branches.map((branch) => (
                <SelectItem key={branch} value={branch}>
                  {branch}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 bg-card/50 rounded-lg px-3 py-2 border border-border">
          <Target className="w-4 h-4 text-muted-foreground" />
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-48 border-none bg-transparent text-foreground">
              <SelectValue placeholder="Filter by Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Cards */}
      {viewVisibility.stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-card border-border p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0 pr-2">
                <p className="text-muted-foreground text-xs mb-1">Total Spend</p>
                <p className="text-xl font-bold text-foreground truncate">₹{(totalSpend / 100000).toFixed(2)}L</p>
              </div>
              <DollarSign className="w-8 h-8 text-accent flex-shrink-0" />
            </div>
          </Card>

          <Card className="bg-card border-border p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0 pr-2">
                <p className="text-muted-foreground text-xs mb-1">Total Orders</p>
                <p className="text-xl font-bold text-foreground truncate">{totalOrders}</p>
              </div>
              <Package className="w-8 h-8 text-blue-500 flex-shrink-0" />
            </div>
          </Card>

          <Card className="bg-card border-border p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0 pr-2">
                <p className="text-muted-foreground text-xs mb-1">Avg PO Value</p>
                <p className="text-xl font-bold text-foreground truncate">₹{(avgPOValue.current / 1000).toFixed(1)}K</p>
                <p className={`text-xs ${avgPOValue.trend >= 0 ? "text-green-500" : "text-red-500"}`}>
                  {avgPOValue.trend >= 0 ? "+" : ""}
                  {avgPOValue.trend.toFixed(1)}%
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500 flex-shrink-0" />
            </div>
          </Card>

          <Card className="bg-card border-border p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0 pr-2">
                <p className="text-muted-foreground text-xs mb-1">Active Suppliers</p>
                <p className="text-xl font-bold text-foreground truncate">{uniqueSuppliers}</p>
              </div>
              <FileText className="w-8 h-8 text-purple-500 flex-shrink-0" />
            </div>
          </Card>

          <Card className="bg-card border-border p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0 pr-2">
                <p className="text-muted-foreground text-xs mb-1">Avg Monthly Orders</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-xl font-bold text-foreground">{avgMonthlyOrders}</p>
                  <Badge className={trendDirection === 'up' ? 'bg-green-500/20 text-green-500' : trendDirection === 'down' ? 'bg-red-500/20 text-red-500' : 'bg-neutral-500/20 text-neutral-500'}>
                    {trendDirection === 'up' ? '↑' : trendDirection === 'down' ? '↓' : '→'}
                  </Badge>
                </div>
              </div>
              <BarChart3 className="w-8 h-8 text-cyan-500 flex-shrink-0" />
            </div>
          </Card>

          <Card className="bg-card border-border p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0 pr-2">
                <p className="text-muted-foreground text-xs mb-1">Avg Monthly Spending</p>
                <p className="text-xl font-bold text-foreground">₹{(avgMonthlyAmount / 100000).toFixed(1)}L</p>
              </div>
              <TrendingUp className="w-8 h-8 text-emerald-500 flex-shrink-0" />
            </div>
          </Card>

          <Card className="bg-card border-border p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0 pr-2">
                <p className="text-muted-foreground text-xs mb-1">Supplier Volatility</p>
                <p className="text-xl font-bold text-foreground">
                  {(avgVolatility * 100).toFixed(1)}%
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-amber-500 flex-shrink-0" />
            </div>
          </Card>

          <Card className="bg-card border-border p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0 pr-2">
                <p className="text-muted-foreground text-xs mb-1">Anomalies Detected</p>
                <p className="text-xl font-bold text-orange-500">{anomalies.length}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-500 flex-shrink-0" />
            </div>
          </Card>
        </div>
      )}

      {/* Top Branches by Spending & Spending by Category */}
      {viewVisibility.topBranchesAndCategory && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {branchComparison.length > 0 && (
            <Card className="bg-card border-border p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Top Branches by Spending</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={branchComparison} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" style={{ fontSize: '12px' }} />
                  <YAxis dataKey="branch" type="category" stroke="hsl(var(--muted-foreground))" style={{ fontSize: '10px' }} width={100} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                    formatter={(value: any) => `₹${(value / 100000).toFixed(2)}L`}
                  />
                  <Bar dataKey="spending" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}

          {categorySpending.length > 0 && (
            <Card className="bg-card border-border p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Spending by Category</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categorySpending}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="category" stroke="hsl(var(--muted-foreground))" style={{ fontSize: '11px' }} angle={-45} textAnchor="end" height={100} />
                  <YAxis stroke="hsl(var(--muted-foreground))" style={{ fontSize: '12px' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                    formatter={(value: any, name: string) => {
                      if (name === 'spending') return [`₹${(value / 100000).toFixed(2)}L`, 'Total Spending']
                      return [value, 'Orders']
                    }}
                  />
                  <Legend />
                  <Bar dataKey="spending" fill="hsl(var(--accent))" name="Spending (₹)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="orders" fill="#10b981" name="Order Count" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}
        </div>
      )}

      {/* Supplier Performance */}
      {viewVisibility.supplierPerformance && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-500" />
            Supplier Performance
          </h2>

          <Card className="bg-card border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Supplier Metrics Overview</h3>
              <Select value={supplierCategory} onValueChange={setSupplierCategory}>
                <SelectTrigger className="w-[140px] h-8 text-xs">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-muted-foreground">Supplier</th>
                    <th className="text-right py-3 px-4 text-muted-foreground">Orders</th>
                    <th className="text-right py-3 px-4 text-muted-foreground">Price Variance</th>
                    <th className="text-left py-3 px-4 text-muted-foreground">Most Frequent Item</th>
                  </tr>
                </thead>
                <tbody>
                  {supplierPerformance.slice(0, 10).map((supplier, idx) => (
                    <tr key={idx} className="border-b border-border/50">
                      <td className="py-3 px-4 text-foreground">{supplier.supplier}</td>
                      <td className="py-3 px-4 text-right text-foreground">{supplier.totalOrders}</td>
                      <td className="py-3 px-4 text-right text-foreground">{supplier.priceVariance.toFixed(1)}%</td>
                      <td className="py-3 px-4 text-foreground truncate max-w-xs" title={supplier.mostFrequentItem}>
                        {supplier.mostFrequentItem}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Spending Trends - Monthly and Over Time */}
      {viewVisibility.spendingTrends && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {monthlyTrends.length > 0 && (
            <Card className="bg-card border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">Spending Trend (Monthly)</h3>
                <div className="flex items-center gap-2">
                  {(['daily', 'weekly', 'monthly', 'yearly'] as const).map(period => (
                    <Button
                      key={period}
                      onClick={() => setTimePeriod(period)}
                      variant={timePeriod === period ? 'default' : 'outline'}
                      size="sm"
                      className={`text-xs ${
                        timePeriod === period
                          ? 'bg-accent hover:bg-accent/90 text-white'
                          : 'border-border text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      {period.charAt(0).toUpperCase() + period.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" style={{ fontSize: '11px' }} angle={-45} textAnchor="end" height={80} />
                  <YAxis stroke="hsl(var(--muted-foreground))" style={{ fontSize: '12px' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                    formatter={(value: any) => `₹${(value / 100000).toFixed(2)}L`}
                  />
                  <Bar dataKey="totalAmount" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}

          <Card className="bg-card border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Spend Over Time</h3>
              <div className="flex gap-2">
                <Select value={spendTrendCategory} onValueChange={setSpendTrendCategory}>
                  <SelectTrigger className="w-[140px] h-9 text-xs">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  variant={period === "monthly" ? "default" : "outline"}
                  onClick={() => setPeriod("monthly")}
                  className={period === "monthly" ? "bg-accent hover:bg-accent/90" : ""}
                >
                  Monthly
                </Button>
                <Button
                  size="sm"
                  variant={period === "quarterly" ? "default" : "outline"}
                  onClick={() => setPeriod("quarterly")}
                  className={period === "quarterly" ? "bg-accent hover:bg-accent/90" : ""}
                >
                  Quarterly
                </Button>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={spendTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="period" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip formatter={(value: number) => `₹${(value / 1000).toFixed(2)}K`} />
                <Legend />
                <Line type="monotone" dataKey="amount" stroke="hsl(var(--accent))" strokeWidth={2} name="Spending" />
                <Line type="monotone" dataKey="orderCount" stroke="#60a5fa" strokeWidth={2} name="Order Count" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}

      {/* Risk Management */}
      {viewVisibility.riskManagement && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            Risk Management
          </h2>

          <Card className="bg-card border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Supplier Concentration Risk</h3>
              <Select value={riskCategory} onValueChange={setRiskCategory}>
                <SelectTrigger className="w-[140px] h-8 text-xs">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3">
              {riskData.slice(0, 10).map((risk, idx) => (
                <div key={idx} className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-foreground text-sm">{risk.supplier}</span>
                      <span className="text-muted-foreground text-xs">
                        ₹{(risk.totalSpend / 1000).toFixed(1)}K ({risk.concentration.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-card-hover rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          risk.concentration > 20 ? "bg-red-500" : risk.concentration > 10 ? "bg-accent" : "bg-green-500"
                        }`}
                        style={{ width: `${Math.min(risk.concentration, 100)}%` }}
                      />
                    </div>
                    {risk.singleSourceItems.length > 0 && (
                      <p className="text-xs text-red-400 mt-1">⚠ {risk.singleSourceItems.length} single-source item(s)</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Top Suppliers by Frequency */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Package className="w-5 h-5 text-purple-500" />
          Top Suppliers by Frequency
        </h2>

        <Card className="bg-card border-border p-6">
          <div className="space-y-4">
            {Object.entries(topSuppliersByCategory).map(([category, suppliers]) => (
              <div key={category}>
                <p className="text-sm text-muted-foreground mb-2 font-semibold">{category}</p>
                <div className="space-y-2">
                  {suppliers.slice(0, 3).map((supplier) => (
                    <div key={supplier.supplier} className="flex items-center justify-between p-3 bg-muted/50 rounded border border-border">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{supplier.supplier}</p>
                        <p className="text-xs text-muted-foreground">
                          {supplier.orderCount} orders · Last: {supplier.lastOrderDate} · {supplier.frequency}
                        </p>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-sm font-mono text-accent">₹{(supplier.totalAmount / 100000).toFixed(1)}L</p>
                        <p className={`text-xs ${!isFinite(supplier.rateVolatility) ? 'text-muted-foreground' : supplier.rateVolatility > 0.15 ? 'text-red-400' : 'text-green-400'}`}>
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
                  <div key={supplier.supplier} className="flex items-center justify-between p-3 bg-muted/50 rounded border border-border">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{supplier.supplier}</p>
                      <p className="text-xs text-muted-foreground">
                        {supplier.orderCount} orders · Last: {supplier.lastOrderDate} · {supplier.frequency}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-sm font-mono text-accent">₹{(supplier.totalAmount / 100000).toFixed(1)}L</p>
                      <p className={`text-xs ${!isFinite(supplier.rateVolatility) ? 'text-muted-foreground' : supplier.rateVolatility > 0.15 ? 'text-red-400' : 'text-green-400'}`}>
                        Vol: {isFinite(supplier.rateVolatility) ? `${(supplier.rateVolatility * 100).toFixed(1)}%` : 'N/A'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Detected Anomalies */}
      {viewVisibility.anomalies && anomalies.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            Detected Anomalies
          </h2>

          <Card className="bg-card border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                DETECTED ANOMALIES ({anomalies.length})
              </h3>
              <Select value={anomalyCategory} onValueChange={setAnomalyCategory}>
                <SelectTrigger className="w-[140px] h-8 text-xs">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {anomalies.map((anomaly, idx) => (
                <div
                  key={idx}
                  className={`flex items-start gap-3 p-3 border rounded text-sm cursor-pointer hover:bg-muted/50 transition-colors ${
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
                        <p className="text-foreground font-medium">{anomaly.type}</p>
                        <p className="text-muted-foreground text-xs mt-1">{anomaly.itemName} · {anomaly.category}</p>
                      </div>
                      <Badge variant="outline" className="text-xs whitespace-nowrap">
                        {anomaly.date}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground text-xs mt-2">{anomaly.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-muted-foreground">{anomaly.supplier}</span>
                      <span className="text-xs text-muted-foreground/50">•</span>
                      <span className="text-xs text-muted-foreground">{anomaly.branch}</span>
                      <span className="text-xs text-muted-foreground/50">•</span>
                      <span className="text-xs text-accent">Click for details</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      <AnomalyDetailPanel
        anomaly={selectedAnomaly}
        onClose={() => setSelectedAnomaly(null)}
        onResolve={handleResolveAnomaly}
      />
    </div>
  )
}
