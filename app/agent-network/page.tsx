"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TrendingUp, Calendar } from 'lucide-react'
import { getCurrentPOs, getApprovedPOs } from "@/lib/storage"
import { TrendDashboard } from "@/components/trend-dashboard"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { PurchaseOrder } from "@/lib/types"

type TimePeriod = 'daily' | 'weekly' | 'monthly' | 'yearly'

export default function AgentNetworkPage() {
  const [currentPOs, setCurrentPOs] = useState<PurchaseOrder[]>([])
  const [approvedPOs, setApprovedPOs] = useState<PurchaseOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('monthly')

  useEffect(() => {
    async function loadPOs() {
      setIsLoading(true)
      try {
        const [current, approved] = await Promise.all([
          getCurrentPOs(),
          getApprovedPOs()
        ])
        setCurrentPOs(current)
        setApprovedPOs(approved)
      } catch (error) {
        console.error('Error loading POs:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadPOs()

    // Refresh when POs are approved or when window gains focus
    const handlePOsApproved = () => {
      console.log('[Trend Analysis] POs approved, refreshing...')
      loadPOs()
    }

    const handleFocus = () => {
      loadPOs()
    }

    window.addEventListener('pos-approved', handlePOsApproved)
    window.addEventListener('focus', handleFocus)

    return () => {
      window.removeEventListener('pos-approved', handlePOsApproved)
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground tracking-wider flex items-center gap-2">
            <TrendingUp className="w-6 h-6" />
            TREND ANALYSIS
          </h1>
          <p className="text-sm text-muted-foreground">Historical patterns and supplier analysis</p>
        </div>
        <Card className="bg-card border-border">
          <CardContent className="p-8 text-center">
            <TrendingUp className="w-8 h-8 text-muted-foreground mx-auto mb-3 animate-pulse" />
            <p className="text-muted-foreground text-sm">Loading trends...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (currentPOs.length > 0 || approvedPOs.length > 0) {
    return (
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-wider flex items-center gap-2">
              <TrendingUp className="w-6 h-6" />
              TREND ANALYSIS
            </h1>
            <p className="text-sm text-muted-foreground">Historical patterns and supplier analysis</p>
          </div>
          <div className="flex items-center gap-3" data-tour="trends-filters">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <Select value={timePeriod} onValueChange={(value) => setTimePeriod(value as TimePeriod)}>
                <SelectTrigger className="w-32 bg-input border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">Export Report</Button>
          </div>
        </div>

        {/* Trend Dashboard */}
        <TrendDashboard
          currentPOs={currentPOs}
          approvedPOs={approvedPOs}
          timePeriod={timePeriod}
        />
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground tracking-wider">TREND ANALYSIS</h1>
        <p className="text-sm text-muted-foreground">Historical patterns and supplier analysis</p>
      </div>
      <Card className="bg-card border-border">
        <CardContent className="p-8 text-center">
          <TrendingUp className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Upload purchase orders to view trends</p>
        </CardContent>
      </Card>
    </div>
  )
}
