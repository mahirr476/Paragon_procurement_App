"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PurchaseOrder } from "@/lib/types"
import { BarChart3, Search, TrendingUp, Package, Building2, DollarSign, X } from 'lucide-react'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface DashboardOverviewProps {
  approvedPOs: PurchaseOrder[]
}

export function DashboardOverview({ approvedPOs }: DashboardOverviewProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedBranch, setSelectedBranch] = useState<string>("all")
  const [selectedSupplier, setSelectedSupplier] = useState<string>("all")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")

  // Extract unique values for filters
  const branches = useMemo(() => {
    const unique = Array.from(new Set(approvedPOs.map(po => po.branch).filter(Boolean)))
    return unique.sort()
  }, [approvedPOs])

  const suppliers = useMemo(() => {
    const unique = Array.from(new Set(approvedPOs.map(po => po.supplier).filter(Boolean)))
    return unique.sort()
  }, [approvedPOs])

  const categories = useMemo(() => {
    // Fixed property from category to itemLedgerGroup
    const unique = Array.from(new Set(approvedPOs.map(po => po.itemLedgerGroup).filter(Boolean)))
    return unique.sort()
  }, [approvedPOs])

  // Filter POs based on selections
  const filteredPOs = useMemo(() => {
    return approvedPOs.filter(po => {
      const matchesSearch = searchTerm === "" || 
        // Fixed properties from itemName/poNumber to item/orderNo
        (po.item && po.item.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (po.supplier && po.supplier.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (po.orderNo && po.orderNo.toLowerCase().includes(searchTerm.toLowerCase()))
      
      const matchesBranch = selectedBranch === "all" || po.branch === selectedBranch
      const matchesSupplier = selectedSupplier === "all" || po.supplier === selectedSupplier
      // Fixed property from category to itemLedgerGroup
      const matchesCategory = selectedCategory === "all" || po.itemLedgerGroup === selectedCategory

      return matchesSearch && matchesBranch && matchesSupplier && matchesCategory
    })
  }, [approvedPOs, searchTerm, selectedBranch, selectedSupplier, selectedCategory])

  // Calculate metrics
  const metrics = useMemo(() => {
    const totalAmount = filteredPOs.reduce((sum, po) => sum + po.totalAmount, 0)
    const totalOrders = filteredPOs.length
    const uniqueSuppliers = new Set(filteredPOs.map(po => po.supplier)).size
    const uniqueBranches = new Set(filteredPOs.map(po => po.branch)).size
    const avgOrderValue = totalOrders > 0 ? totalAmount / totalOrders : 0

    return { totalAmount, totalOrders, uniqueSuppliers, uniqueBranches, avgOrderValue }
  }, [filteredPOs])

  // Chart data
  const branchData = useMemo(() => {
    const branchMap = new Map<string, number>()
    filteredPOs.forEach(po => {
      branchMap.set(po.branch, (branchMap.get(po.branch) || 0) + po.totalAmount)
    })
    return Array.from(branchMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)
  }, [filteredPOs])

  const supplierData = useMemo(() => {
    const supplierMap = new Map<string, number>()
    filteredPOs.forEach(po => {
      supplierMap.set(po.supplier, (supplierMap.get(po.supplier) || 0) + po.totalAmount)
    })
    return Array.from(supplierMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8)
  }, [filteredPOs])

  const categoryData = useMemo(() => {
    const categoryMap = new Map<string, number>()
    filteredPOs.forEach(po => {
      // Fixed property from category to itemLedgerGroup
      categoryMap.set(po.itemLedgerGroup, (categoryMap.get(po.itemLedgerGroup) || 0) + po.totalAmount)
    })
    return Array.from(categoryMap.entries())
      .map(([name, value]) => ({ name, value }))
  }, [filteredPOs])

  const COLORS = [
    '#3b82f6', // Blue
    '#8b5cf6', // Purple
    '#ec4899', // Pink
    '#f97316', // Orange
    '#22c55e', // Green
    '#06b6d4', // Cyan
    '#eab308', // Yellow
    '#ef4444', // Red
    '#14b8a6', // Teal
    '#a855f7', // Violet
  ]

  const clearFilters = () => {
    setSearchTerm("")
    setSelectedBranch("all")
    setSelectedSupplier("all")
    setSelectedCategory("all")
  }

  const hasActiveFilters = searchTerm !== "" || selectedBranch !== "all" || selectedSupplier !== "all" || selectedCategory !== "all"

  // Custom tick renderers with truncation
  const renderXAxisTick = ({ x, y, payload }: any) => {
    const maxLength = 10
    const displayValue = payload.value.length > maxLength
      ? `${payload.value.slice(0, maxLength)}...`
      : payload.value

    return (
      <g transform={`translate(${x},${y})`}>
        <text
          x={0}
          y={0}
          dy={16}
          textAnchor="end"
          fill="hsl(var(--muted-foreground))"
          transform="rotate(-45)"
          fontSize={10}
        >
          {displayValue}
        </text>
      </g>
    )
  }

  const renderYAxisTick = ({ x, y, payload }: any) => {
    const maxLength = 12
    const displayValue = payload.value.length > maxLength
      ? `${payload.value.slice(0, maxLength)}...`
      : payload.value

    return (
      <g transform={`translate(${x},${y})`}>
        <text
          x={0}
          y={0}
          dy={4}
          textAnchor="end"
          fill="hsl(var(--muted-foreground))"
          fontSize={9}
        >
          {displayValue}
        </text>
      </g>
    )
  }

  const StatCard = ({ 
    label, 
    value, 
    icon: Icon, 
    iconColor 
  }: { 
    label: string
    value: string | number
    icon: React.ComponentType<{ className?: string }>
    iconColor: string
  }) => {
    const [isTruncated, setIsTruncated] = useState(false)
    const textRef = useRef<HTMLParagraphElement>(null)

    useEffect(() => {
      const checkTruncation = () => {
        if (textRef.current) {
          setIsTruncated(textRef.current.scrollWidth > textRef.current.clientWidth)
        }
      }
      checkTruncation()
      window.addEventListener('resize', checkTruncation)
      return () => window.removeEventListener('resize', checkTruncation)
    }, [value])

    return (
      <Tooltip content="Value is truncated" show={isTruncated}>
        <Card 
          className={`bg-card border-border flex-grow ${
            isTruncated ? 'shadow-[0_0_20px_rgba(249,115,22,0.5)] border-accent' : ''
          }`}
        >
          <CardContent className="p-6 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground mb-1">{label}</p>
                <p 
                  ref={textRef}
                  className="text-xl md:text-2xl font-bold text-foreground truncate"
                >
                  {value}
                </p>
              </div>
              <Icon className={`w-7 h-7 md:w-8 md:h-8 ${iconColor} flex-shrink-0`} />
            </div>
          </CardContent>
        </Card>
      </Tooltip>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-wider">DASHBOARD OVERVIEW</h1>
          <p className="text-sm text-muted-foreground">At-a-glance analytics of approved purchase orders</p>
        </div>
        <Button 
          onClick={clearFilters}
          variant="outline" 
          className="border-border text-muted-foreground hover:bg-muted"
        >
          <Search className="w-4 h-4 mr-2" />
          Clear Filters
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-card/50 border border-border rounded-lg p-4" data-tour="dashboard-filters">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search items, suppliers, PO#..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-muted/50 border-border text-foreground placeholder:text-muted-foreground h-9"
            />
          </div>

          {/* Branch Filter */}
          <Select value={selectedBranch} onValueChange={setSelectedBranch}>
            <SelectTrigger className="w-[140px] bg-muted/50 border-border text-foreground h-9">
              <SelectValue placeholder="Branch" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="all">All Branches</SelectItem>
              {branches.map(branch => (
                <SelectItem key={branch} value={branch}>{branch}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Supplier Filter */}
          <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
            <SelectTrigger className="w-[140px] bg-muted/50 border-border text-foreground h-9">
              <SelectValue placeholder="Supplier" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="all">All Suppliers</SelectItem>
              {suppliers.map(supplier => (
                <SelectItem key={supplier} value={supplier}>{supplier}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Category Filter */}
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[140px] bg-muted/50 border-border text-foreground h-9">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(category => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Clear Filters Button - only show when filters are active */}
          {hasActiveFilters && (
            <Button 
              onClick={clearFilters}
              size="sm"
              variant="ghost"
              className="text-accent hover:bg-accent/10 hover:text-accent h-9"
            >
              <X className="w-4 h-4 mr-1" />
              Clear
            </Button>
          )}
          
          {/* Filtered Count Badge */}
          <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
            <span className="bg-accent/20 text-accent px-3 py-1 rounded-full font-mono">
              {filteredPOs.length} / {approvedPOs.length}
            </span>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="flex flex-wrap gap-4" data-tour="dashboard-metrics">
        <StatCard 
          label="TOTAL AMOUNT" 
          value={`৳${metrics.totalAmount.toLocaleString()}`}
          icon={DollarSign}
          iconColor="text-icon-green"
        />
        <StatCard 
          label="TOTAL ORDERS" 
          value={metrics.totalOrders}
          icon={Package}
          iconColor="text-icon-orange"
        />
        <StatCard 
          label="AVG ORDER VALUE" 
          value={`৳${Math.round(metrics.avgOrderValue).toLocaleString()}`}
          icon={TrendingUp}
          iconColor="text-icon-blue"
        />
        <StatCard 
          label="SUPPLIERS" 
          value={metrics.uniqueSuppliers}
          icon={BarChart3}
          iconColor="text-icon-purple"
        />
        <StatCard 
          label="BRANCHES" 
          value={metrics.uniqueBranches}
          icon={Building2}
          iconColor="text-icon-cyan"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" data-tour="dashboard-charts">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-card-foreground tracking-wider">SPENDING BY BRANCH</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={branchData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="name"
                  stroke="hsl(var(--muted-foreground))"
                  height={100}
                  interval={0}
                  tick={renderXAxisTick}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fontSize: 10 }}
                />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                    color: 'hsl(var(--card-foreground))'
                  }}
                  labelStyle={{ color: 'hsl(var(--card-foreground))', fontWeight: 'bold' }}
                  formatter={(value: number) => [`৳${value.toLocaleString()}`, 'Amount']}
                />
                <Bar dataKey="value" fill="hsl(var(--accent))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-card-foreground tracking-wider">TOP SUPPLIERS</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={supplierData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  type="number"
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fontSize: 10 }}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  stroke="hsl(var(--muted-foreground))"
                  width={100}
                  tick={renderYAxisTick}
                />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                    color: 'hsl(var(--card-foreground))'
                  }}
                  labelStyle={{ color: 'hsl(var(--card-foreground))', fontWeight: 'bold' }}
                  formatter={(value: number) => [`৳${value.toLocaleString()}`, 'Amount']}
                />
                <Bar dataKey="value" fill="hsl(var(--accent))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-card-foreground tracking-wider">CATEGORY DISTRIBUTION</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                    color: 'hsl(var(--card-foreground))'
                  }}
                  labelStyle={{ color: 'hsl(var(--card-foreground))' }}
                  itemStyle={{ color: 'hsl(var(--card-foreground))' }}
                  formatter={(value: number) => [`৳${value.toLocaleString()}`, 'Amount']}
                />
                <Legend
                  wrapperStyle={{
                    fontSize: '11px',
                    color: 'hsl(var(--foreground))'
                  }}
                  iconType="circle"
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-card border-border" data-tour="dashboard-recent">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-card-foreground tracking-wider">RECENT ORDERS</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {filteredPOs.slice(0, 10).map((po, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 bg-muted rounded border border-border">
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="text-sm text-foreground font-medium truncate">{po.item}</p>
                    <p className="text-xs text-muted-foreground truncate">{po.supplier} • {po.branch}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm text-accent font-mono">৳{po.totalAmount.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{po.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
