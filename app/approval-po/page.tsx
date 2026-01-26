"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, RefreshCw, TrendingUp, Building2, Package } from "lucide-react"
import { POComparison } from "@/components/po-comparison"
import { DashboardStats } from "@/components/dashboard-stats"
import { getApprovedPOs } from "@/lib/storage"
import type { PurchaseOrder } from "@/lib/types"

export default function ApprovalPOPage() {
  const [approvedPOs, setApprovedPOs] = useState<PurchaseOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null)

  const fetchApprovedPOs = async () => {
    setIsLoading(true)
    try {
      const approved = await getApprovedPOs()
      setApprovedPOs(approved)
      setLastRefreshTime(new Date())
    } catch (error) {
      console.error("Error loading approved POs:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchApprovedPOs()

    // Refresh on window focus
    const handleFocus = () => {
      fetchApprovedPOs()
    }
    window.addEventListener("focus", handleFocus)

    // Listen for approval events
    const handlePOsApproved = () => {
      fetchApprovedPOs()
    }
    window.addEventListener("pos-approved", handlePOsApproved)

    // Check for updates periodically
    const interval = setInterval(() => {
      const lastApproved = localStorage.getItem("pos-last-approved")
      if (lastApproved) {
        const lastTime = parseInt(lastApproved)
        const now = Date.now()
        // If approved within last 10 seconds, refresh
        if (now - lastTime < 10000) {
          fetchApprovedPOs()
        }
      }
    }, 2000)

    return () => {
      window.removeEventListener("focus", handleFocus)
      window.removeEventListener("pos-approved", handlePOsApproved)
      clearInterval(interval)
    }
  }, [])

  // Calculate stats
  const totalAmount = approvedPOs.reduce((sum, po) => sum + po.totalAmount, 0)
  const uniqueSuppliers = new Set(approvedPOs.map((po) => po.supplier)).size
  const uniqueBranches = new Set(approvedPOs.map((po) => po.branch)).size
  const totalItems = approvedPOs.length

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-wider">APPROVAL PO</h1>
          <p className="text-sm text-muted-foreground">View all approved purchase orders</p>
        </div>
        <div className="flex items-center gap-4">
          {lastRefreshTime && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <RefreshCw className="w-3 h-3" />
              Last refreshed: {lastRefreshTime.toLocaleTimeString()}
            </div>
          )}
          <Button onClick={fetchApprovedPOs} disabled={isLoading} variant="outline" size="sm" className="flex items-center gap-2">
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Orders</p>
                <p className="text-2xl font-bold text-foreground mt-1">{totalItems}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Value</p>
                <p className="text-2xl font-bold text-foreground mt-1">৳{(totalAmount / 1000000).toFixed(2)}M</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Suppliers</p>
                <p className="text-2xl font-bold text-foreground mt-1">{uniqueSuppliers}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-cyan-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Branches</p>
                <p className="text-2xl font-bold text-foreground mt-1">{uniqueBranches}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Package className="w-5 h-5 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar - Stats/Info */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground tracking-wider">APPROVED ORDERS</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground font-mono">{approvedPOs.length} approved orders</p>
              <p className="text-xs text-muted-foreground mt-1">৳{totalAmount.toLocaleString()}</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground tracking-wider">SUMMARY</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Suppliers:</span>
                <span className="text-foreground font-medium">{uniqueSuppliers}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Branches:</span>
                <span className="text-foreground font-medium">{uniqueBranches}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Avg Order:</span>
                <span className="text-foreground font-medium">
                  ৳{totalItems > 0 ? (totalAmount / totalItems).toLocaleString(undefined, { maximumFractionDigits: 0 }) : "0"}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content - PO List */}
        <div className="lg:col-span-3">
          {isLoading ? (
            <Card className="bg-card border-border">
              <CardContent className="p-8 text-center">
                <RefreshCw className="w-8 h-8 animate-spin text-accent mx-auto mb-4" />
                <p className="text-muted-foreground">Loading approved purchase orders...</p>
              </CardContent>
            </Card>
          ) : approvedPOs.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="p-8 text-center">
                <CheckCircle2 className="w-8 h-8 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No approved purchase orders found</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Approved orders from Pending PO will appear here.
                </p>
                <Button onClick={fetchApprovedPOs} variant="outline" className="mt-4">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </CardContent>
            </Card>
          ) : (
            <POComparison
              currentPOs={approvedPOs}
              approvedPOs={approvedPOs}
              onApprove={() => {}}
              onDelete={() => {}}
            />
          )}
        </div>
      </div>
    </div>
  )
}
