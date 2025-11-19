'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PurchaseOrder } from '@/lib/types'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { generateSupplierReport, generateCategoryReport, generateMonthlyTrends } from '@/lib/report-generator'

interface ChartBuilderProps {
  pos: PurchaseOrder[]
  title: string
}

export function ChartBuilder({ pos, title }: ChartBuilderProps) {
  const [chartType, setChartType] = useState<'supplier' | 'category' | 'trend'>('supplier')

  const COLORS = ['#f97316', '#fb923c', '#fdba74', '#fcd34d', '#fbbf24', '#f59e0b', '#d97706', '#b45309']

  const supplierData = useMemo(() => {
    const suppliers = generateSupplierReport(pos)
    return Object.entries(suppliers)
      .sort((a: any, b: any) => b[1].totalAmount - a[1].totalAmount)
      .slice(0, 10)
      .map(([name, data]: any) => ({
        name: name.length > 20 ? name.substring(0, 17) + '...' : name,
        amount: data.totalAmount,
        orders: data.orderCount,
      }))
  }, [pos])

  const categoryData = useMemo(() => {
    const categories = generateCategoryReport(pos)
    return Object.entries(categories)
      .sort((a: any, b: any) => b[1].totalAmount - a[1].totalAmount)
      .map(([name, data]: any) => ({
        name: name || 'Uncategorized',
        value: data.totalAmount,
        orders: data.orderCount,
      }))
  }, [pos])

  const trendData = useMemo(() => {
    return generateMonthlyTrends(pos).map((item: any) => ({
      month: item.month,
      amount: item.totalAmount,
      orders: item.orderCount,
    }))
  }, [pos])

  if (pos.length === 0) {
    return (
      <Card className="bg-neutral-900 border-neutral-700">
        <CardContent className="p-8 text-center">
          <p className="text-neutral-400 text-sm">No data available for visualization</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-neutral-900 border-neutral-700">
      <CardHeader className="border-b border-neutral-700">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">{title}</CardTitle>
          <div className="flex gap-2">
            {['supplier', 'category', 'trend'].map(type => (
              <Button
                key={type}
                onClick={() => setChartType(type as any)}
                variant={chartType === type ? 'default' : 'outline'}
                className={`text-xs ${
                  chartType === type
                    ? 'bg-orange-500 hover:bg-orange-600 text-white border-orange-500'
                    : 'border-neutral-700 text-neutral-400 hover:bg-neutral-800'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <div className="w-full h-80">
          {chartType === 'supplier' && supplierData.length > 0 && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={supplierData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
                <XAxis dataKey="name" stroke="#999" style={{ fontSize: '12px' }} angle={-45} textAnchor="end" height={100} />
                <YAxis stroke="#999" style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #404040' }}
                  formatter={(value: any) => `₹${value.toLocaleString()}`}
                />
                <Legend wrapperStyle={{ color: '#999', fontSize: '12px' }} />
                <Bar dataKey="amount" fill="#f97316" name="Total Amount" />
              </BarChart>
            </ResponsiveContainer>
          )}

          {chartType === 'category' && categoryData.length > 0 && (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ₹${(value / 100000).toFixed(1)}L`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #404040' }}
                  formatter={(value: any) => `₹${value.toLocaleString()}`}
                />
              </PieChart>
            </ResponsiveContainer>
          )}

          {chartType === 'trend' && trendData.length > 0 && (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
                <XAxis dataKey="month" stroke="#999" style={{ fontSize: '12px' }} />
                <YAxis stroke="#999" style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #404040' }}
                  formatter={(value: any) => `₹${value.toLocaleString()}`}
                />
                <Legend wrapperStyle={{ color: '#999', fontSize: '12px' }} />
                <Line type="monotone" dataKey="amount" stroke="#f97316" name="Total Amount" strokeWidth={2} dot={{ fill: '#f97316' }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
