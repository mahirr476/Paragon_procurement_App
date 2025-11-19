"use client"

import { useState, useEffect, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getApprovedPOs } from '@/lib/storage'
import { PurchaseOrder } from '@/lib/types'
import {
  analyzeSpendByCategory,
  analyzeSpendBySupplier,
  analyzeSpendTrend,
  analyzeSupplierPerformance,
  analyzePOVolume,
  analyzeSupplierConcentration,
  calculateAveragePOValue,
  SpendByCategory,
  SpendBySupplier,
  SupplierPerformance,
  RiskData
} from '@/lib/report-analytics'
import { BarChart3, TrendingUp, AlertTriangle, DollarSign, Package, FileText, Download, Filter } from 'lucide-react'
import { Bar, BarChart, Line, LineChart, Pie, PieChart, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export default function ReportsPage() {
  const [pos, setPos] = useState<PurchaseOrder[]>([])
  const [period, setPeriod] = useState<'monthly' | 'quarterly'>('monthly')
  
  const [selectedBranch, setSelectedBranch] = useState<string>('all')
  const [supplierCategory, setSupplierCategory] = useState<string>('all')
  const [spendTrendCategory, setSpendTrendCategory] = useState<string>('all')
  const [poVolumeCategory, setPoVolumeCategory] = useState<string>('all')
  const [riskCategory, setRiskCategory] = useState<string>('all')

  useEffect(() => {
    const approvedPOs = getApprovedPOs()
    setPos(approvedPOs)
  }, [])

  const filteredPOs = useMemo(() => {
    if (selectedBranch === 'all') return pos
    return pos.filter(po => po.branch === selectedBranch)
  }, [pos, selectedBranch])

  const branches = useMemo(() => {
    const uniqueBranches = Array.from(new Set(pos.map(po => po.branch).filter(Boolean)))
    return uniqueBranches.sort()
  }, [pos])

  const categories = useMemo(() => {
    const uniqueCategories = Array.from(new Set(pos.map(po => po.itemLedgerGroup).filter(Boolean)))
    return uniqueCategories.sort()
  }, [pos])

  const spendByCategory = useMemo(() => analyzeSpendByCategory(filteredPOs), [filteredPOs])
  
  const spendBySupplier = useMemo(() => {
    const categoryFiltered = supplierCategory === 'all' 
      ? filteredPOs 
      : filteredPOs.filter(po => po.itemLedgerGroup === supplierCategory)
    return analyzeSpendBySupplier(categoryFiltered, 15)
  }, [filteredPOs, supplierCategory])

  const supplierPerformance = useMemo(() => {
    const categoryFiltered = supplierCategory === 'all' 
      ? filteredPOs 
      : filteredPOs.filter(po => po.itemLedgerGroup === supplierCategory)
    return analyzeSupplierPerformance(categoryFiltered)
  }, [filteredPOs, supplierCategory])

  const spendTrend = useMemo(() => {
    const categoryFiltered = spendTrendCategory === 'all' 
      ? filteredPOs 
      : filteredPOs.filter(po => po.itemLedgerGroup === spendTrendCategory)
    return analyzeSpendTrend(categoryFiltered, period)
  }, [filteredPOs, spendTrendCategory, period])

  const poVolume = useMemo(() => {
    const categoryFiltered = poVolumeCategory === 'all' 
      ? filteredPOs 
      : filteredPOs.filter(po => po.itemLedgerGroup === poVolumeCategory)
    return analyzePOVolume(categoryFiltered)
  }, [filteredPOs, poVolumeCategory])

  const riskData = useMemo(() => {
    const categoryFiltered = riskCategory === 'all' 
      ? filteredPOs 
      : filteredPOs.filter(po => po.itemLedgerGroup === riskCategory)
    return analyzeSupplierConcentration(categoryFiltered)
  }, [filteredPOs, riskCategory])

  const avgPOValue = useMemo(() => calculateAveragePOValue(filteredPOs), [filteredPOs])

  const totalSpend = filteredPOs.reduce((sum, po) => sum + po.totalAmount, 0)
  const totalOrders = filteredPOs.length
  const uniqueSuppliers = new Set(filteredPOs.map(po => po.supplier)).size

  const PIE_COLORS = [
    'rgba(249, 115, 22, 0.6)',   // Orange
    'rgba(251, 146, 60, 0.6)',   // Light Orange
    'rgba(34, 197, 94, 0.6)',    // Green
    'rgba(96, 165, 250, 0.6)',   // Blue
    'rgba(167, 139, 250, 0.6)',  // Purple
    'rgba(244, 114, 182, 0.6)',  // Pink
    'rgba(251, 113, 133, 0.6)',  // Rose
    'rgba(252, 211, 77, 0.6)',   // Yellow
    'rgba(45, 212, 191, 0.6)',   // Teal
    'rgba(248, 113, 113, 0.6)',  // Red
  ]

  const SOLID_COLORS = ['#f97316', '#fb923c', '#22c55e', '#60a5fa', '#a78bfa', '#f472b6', '#fb7185', '#fcd34d', '#2dd4bf', '#f87171']

  return (
    <div className="p-6 space-y-6 bg-background">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Advanced Reports & Analytics</h1>
          <p className="text-muted-foreground text-sm">Comprehensive procurement intelligence and insights</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-card/50 rounded-lg px-3 py-2 border border-border">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={selectedBranch} onValueChange={setSelectedBranch}>
              <SelectTrigger className="w-[180px] border-none bg-transparent text-foreground">
                <SelectValue placeholder="Filter by Branch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Branches</SelectItem>
                {branches.map((branch) => (
                  <SelectItem key={branch} value={branch}>{branch}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button className="bg-accent hover:bg-accent/90">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              <p className={`text-xs ${avgPOValue.trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {avgPOValue.trend >= 0 ? '+' : ''}{avgPOValue.trend.toFixed(1)}%
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
      </div>

      {/* Spending Analysis Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-accent" />
          Spending Analysis
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Spend by Category */}
          <Card className="bg-card border-border p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Spend by Category</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={spendByCategory.slice(0, 10).map(item => ({ ...item, [item.category]: item.amount }))}
                  dataKey="amount"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(1)}%`}
                  stroke="#fff"
                  strokeWidth={2}
                >
                  {spendByCategory.slice(0, 10).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `₹${(value / 1000).toFixed(2)}K`} />
              </PieChart>
            </ResponsiveContainer>
          </Card>

          {/* Spend by Supplier */}
          <Card className="bg-card border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Top 15 Suppliers by Spend</h3>
              <Select value={supplierCategory} onValueChange={setSupplierCategory}>
                <SelectTrigger className="w-[140px] h-8 text-xs">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={spendBySupplier} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                <YAxis dataKey="supplier" type="category" width={120} stroke="hsl(var(--muted-foreground))" />
                <Tooltip formatter={(value: number) => `₹${(value / 1000).toFixed(2)}K`} />
                <Bar dataKey="amount" fill="hsl(var(--accent))" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Spend Trend Over Time */}
        <Card className="bg-card border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Spend Trend Over Time</h3>
            <div className="flex gap-2">
              <Select value={spendTrendCategory} onValueChange={setSpendTrendCategory}>
                <SelectTrigger className="w-[140px] h-9 text-xs">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                variant={period === 'monthly' ? 'default' : 'outline'}
                onClick={() => setPeriod('monthly')}
                className={period === 'monthly' ? 'bg-accent hover:bg-accent/90' : ''}
              >
                Monthly
              </Button>
              <Button
                size="sm"
                variant={period === 'quarterly' ? 'default' : 'outline'}
                onClick={() => setPeriod('quarterly')}
                className={period === 'quarterly' ? 'bg-accent hover:bg-accent/90' : ''}
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

      {/* Supplier Performance Section */}
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
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
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
                  <th className="text-right py-3 px-4 text-muted-foreground">On-Time %</th>
                  <th className="text-right py-3 px-4 text-muted-foreground">Avg Lead Time</th>
                  <th className="text-right py-3 px-4 text-muted-foreground">Price Variance</th>
                </tr>
              </thead>
              <tbody>
                {supplierPerformance.slice(0, 10).map((supplier, idx) => (
                  <tr key={idx} className="border-b border-border/50">
                    <td className="py-3 px-4 text-foreground">{supplier.supplier}</td>
                    <td className="py-3 px-4 text-right text-foreground">{supplier.totalOrders}</td>
                    <td className="py-3 px-4 text-right">
                      <span className={supplier.onTimeDeliveryRate >= 80 ? 'text-green-500' : 'text-red-500'}>
                        {supplier.onTimeDeliveryRate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-foreground">
                      {supplier.averageLeadTime.toFixed(0)} days
                    </td>
                    <td className="py-3 px-4 text-right text-foreground">
                      {supplier.priceVariance.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* PO Analysis Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Package className="w-5 h-5 text-blue-500" />
          Purchase Order Analysis
        </h2>

        <Card className="bg-card border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">PO Volume & Value by Month</h3>
            <Select value={poVolumeCategory} onValueChange={setPoVolumeCategory}>
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={poVolume}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
              <YAxis yAxisId="left" stroke="hsl(var(--muted-foreground))" />
              <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--muted-foreground))" />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="volume" fill="#60a5fa" name="Order Count" />
              <Bar yAxisId="right" dataKey="value" fill="hsl(var(--accent))" name="Total Value (₹)" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Risk Management Section */}
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
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
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
                        risk.concentration > 20 ? 'bg-red-500' : risk.concentration > 10 ? 'bg-accent' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(risk.concentration, 100)}%` }}
                    />
                  </div>
                  {risk.singleSourceItems.length > 0 && (
                    <p className="text-xs text-red-400 mt-1">
                      ⚠ {risk.singleSourceItems.length} single-source item(s)
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
