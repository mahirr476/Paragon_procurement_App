'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PurchaseOrder } from '@/lib/types'
import { Download, Filter, FileText, TrendingUp } from 'lucide-react'
import { generateSummaryReport, generateSupplierReport, generateCategoryReport } from '@/lib/report-generator'

interface ReportViewerProps {
  pos: PurchaseOrder[]
  title: string
}

export function ReportViewer({ pos, title }: ReportViewerProps) {
  const [activeTab, setActiveTab] = useState<'summary' | 'suppliers' | 'categories'>('summary')
  const [filterText, setFilterText] = useState('')

  const summary = useMemo(() => generateSummaryReport(pos), [pos])
  const suppliers = useMemo(() => generateSupplierReport(pos), [pos])
  const categories = useMemo(() => generateCategoryReport(pos), [pos])

  const handleDownloadPDF = () => {
    const content = `
PO REPORT - ${title}
Generated: ${new Date().toLocaleDateString()}

SUMMARY
-------
Total Orders: ${summary.totalOrders}
Total Amount: ₹${summary.totalAmount.toLocaleString()}
Average Order Value: ₹${summary.avgOrderValue.toLocaleString()}
Unique Suppliers: ${summary.uniqueSuppliers}

TOP 10 HIGH VALUE ORDERS
------------------------
${summary.highValueOrders.map((po, i) => `${i + 1}. ${po.supplier} - ₹${po.totalAmount.toLocaleString()}`).join('\n')}
`
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `po-report-${Date.now()}.txt`
    a.click()
  }

  if (pos.length === 0) {
    return (
      <Card className="bg-neutral-900 border-neutral-700">
        <CardContent className="p-8 text-center">
          <FileText className="w-8 h-8 text-neutral-500 mx-auto mb-3" />
          <p className="text-neutral-400 text-sm">No data available for report</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-neutral-900 border-neutral-700">
      <CardHeader className="border-b border-neutral-700">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4" />
            {title}
          </CardTitle>
          <Button
            onClick={handleDownloadPDF}
            className="bg-orange-500 hover:bg-orange-600 text-white text-xs flex items-center gap-2"
          >
            <Download className="w-3 h-3" />
            Export
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-neutral-700">
          {['summary', 'suppliers', 'categories'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'text-orange-500 border-b-2 border-orange-500'
                  : 'text-neutral-400 hover:text-neutral-300'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Summary Tab */}
        {activeTab === 'summary' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-neutral-800 rounded p-4 border border-neutral-700">
                <p className="text-xs text-neutral-400 mb-1">Total Orders</p>
                <p className="text-2xl font-bold text-white">{summary.totalOrders}</p>
              </div>
              <div className="bg-neutral-800 rounded p-4 border border-neutral-700">
                <p className="text-xs text-neutral-400 mb-1">Total Amount</p>
                <p className="text-2xl font-bold text-orange-500">₹{summary.totalAmount.toLocaleString()}</p>
              </div>
              <div className="bg-neutral-800 rounded p-4 border border-neutral-700">
                <p className="text-xs text-neutral-400 mb-1">Average Order Value</p>
                <p className="text-2xl font-bold text-white">₹{Math.round(summary.avgOrderValue).toLocaleString()}</p>
              </div>
              <div className="bg-neutral-800 rounded p-4 border border-neutral-700">
                <p className="text-xs text-neutral-400 mb-1">Unique Suppliers</p>
                <p className="text-2xl font-bold text-white">{summary.uniqueSuppliers}</p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-neutral-300 mb-3">Top 10 High Value Orders</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {summary.highValueOrders.map((po, idx) => (
                  <div key={po.id} className="flex items-center justify-between p-2 bg-neutral-800 rounded text-sm">
                    <div>
                      <p className="text-white">{po.supplier}</p>
                      <p className="text-xs text-neutral-500">{po.item}</p>
                    </div>
                    <p className="text-orange-500 font-mono">₹{po.totalAmount.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Suppliers Tab */}
        {activeTab === 'suppliers' && (
          <div className="space-y-4">
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {Object.entries(suppliers)
                .sort((a: any, b: any) => b[1].totalAmount - a[1].totalAmount)
                .map(([name, data]: any) => (
                  <div key={name} className="border border-neutral-700 rounded p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-white">{name}</h4>
                      <Badge className="bg-orange-500/20 text-orange-500">{data.orderCount} orders</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-neutral-400 text-xs">Total Amount</p>
                        <p className="text-white font-mono">₹{data.totalAmount.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-neutral-400 text-xs">Avg Order Value</p>
                        <p className="text-white font-mono">₹{Math.round(data.avgOrderValue).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-neutral-400 text-xs">Avg Rate</p>
                        <p className="text-white font-mono">₹{data.avgRate.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-neutral-400 text-xs">Unique Items</p>
                        <p className="text-white font-mono">{data.itemCount}</p>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Categories Tab */}
        {activeTab === 'categories' && (
          <div className="space-y-4">
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {Object.entries(categories)
                .sort((a: any, b: any) => b[1].totalAmount - a[1].totalAmount)
                .map(([name, data]: any) => (
                  <div key={name} className="border border-neutral-700 rounded p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-white">{name || 'Uncategorized'}</h4>
                      <Badge className="bg-blue-500/20 text-blue-400">{data.orderCount} orders</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-neutral-400 text-xs">Total Amount</p>
                        <p className="text-white font-mono">₹{data.totalAmount.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-neutral-400 text-xs">Items Count</p>
                        <p className="text-white font-mono">{data.itemCount}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-neutral-400 text-xs">Avg Rate</p>
                        <p className="text-white font-mono">₹{data.avgRate.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
