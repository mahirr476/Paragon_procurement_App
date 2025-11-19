'use client'

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Target, MapPin, Clock, Users, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { BarChart3, Filter, Download, Calendar } from 'lucide-react'
import { getCurrentPOs, getApprovedPOs } from "@/lib/storage"
import { ReportViewer } from "@/components/report-viewer"
import { ChartBuilder } from "@/components/chart-builder"
import { PurchaseOrder } from "@/lib/types"

export default function OperationsPage() {
  const [currentPOs] = useState(getCurrentPOs())
  const [approvedPOs] = useState(getApprovedPOs())
  const [activeReport, setActiveReport] = useState<'current' | 'approved'>('current')
  const [timePeriod, setTimePeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly')

  const allPOs = activeReport === 'current' ? currentPOs : approvedPOs

  const filteredPOs = useMemo(() => {
    const now = new Date()
    const filterDate = new Date()

    switch (timePeriod) {
      case 'daily':
        filterDate.setDate(now.getDate() - 1)
        break
      case 'weekly':
        filterDate.setDate(now.getDate() - 7)
        break
      case 'monthly':
        filterDate.setMonth(now.getMonth() - 1)
        break
      case 'yearly':
        filterDate.setFullYear(now.getFullYear() - 1)
        break
    }

    return allPOs.filter(po => {
      const poDate = new Date(po.date)
      return !isNaN(poDate.getTime()) && poDate >= filterDate
    })
  }, [allPOs, timePeriod])

  if (currentPOs.length === 0 && approvedPOs.length === 0) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white tracking-wider">REPORTS & ANALYTICS</h1>
          <p className="text-sm text-neutral-400">Comprehensive PO analysis and visualization</p>
        </div>
        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-8 text-center">
            <BarChart3 className="w-8 h-8 text-neutral-500 mx-auto mb-3" />
            <p className="text-neutral-400 text-sm">Upload purchase orders to view reports</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wider">REPORTS & ANALYTICS</h1>
          <p className="text-sm text-neutral-400">Comprehensive PO analysis and visualization</p>
        </div>
      </div>

      {/* Tab Selection and Time Period Filter */}
      <div className="flex justify-between items-center gap-4 flex-wrap">
        <div className="flex gap-2 border-b border-neutral-700">
          {['current', 'approved'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveReport(tab as 'current' | 'approved')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeReport === tab
                  ? 'text-orange-500 border-b-2 border-orange-500'
                  : 'text-neutral-400 hover:text-neutral-300'
              }`}
            >
              {tab === 'current' ? 'CURRENT POs' : 'APPROVED POs'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-neutral-400" />
          <div className="flex gap-2">
            {(['daily', 'weekly', 'monthly', 'yearly'] as const).map(period => (
              <Button
                key={period}
                onClick={() => setTimePeriod(period)}
                variant={timePeriod === period ? 'default' : 'outline'}
                className={`text-xs ${
                  timePeriod === period
                    ? 'bg-orange-500 hover:bg-orange-600 text-white border-orange-500'
                    : 'border-neutral-700 text-neutral-400 hover:bg-neutral-800'
                }`}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Badge className="bg-neutral-800 text-neutral-300 border-neutral-700">
          Showing {filteredPOs.length} of {allPOs.length} POs
        </Badge>
        <span className="text-xs text-neutral-500">
          (Last {timePeriod === 'daily' ? '24 hours' : timePeriod === 'weekly' ? '7 days' : timePeriod === 'monthly' ? '30 days' : '365 days'})
        </span>
      </div>

      {/* Reports and Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ReportViewer pos={filteredPOs} title={activeReport === 'current' ? 'Current PO Report' : 'Approved PO Report'} />
        <ChartBuilder pos={filteredPOs} title={activeReport === 'current' ? 'Current PO Analytics' : 'Approved PO Analytics'} />
      </div>
    </div>
  )
}
