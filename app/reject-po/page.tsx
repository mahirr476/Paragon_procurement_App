"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RefreshCw, XCircle } from "lucide-react"
import { POComparison } from "@/components/po-comparison"
import { DashboardStats } from "@/components/dashboard-stats"
import { getRejectedPOs } from "@/lib/storage"
import type { PurchaseOrder } from "@/lib/types"

export default function RejectPOPage() {
  const [rejectedPOs, setRejectedPOs] = useState<PurchaseOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchRejectedPOs = async () => {
    setIsLoading(true)
    try {
      const pos = await getRejectedPOs()
      setRejectedPOs(Array.isArray(pos) ? pos : [])
    } catch (error) {
      console.error("Error fetching rejected POs:", error)
      setRejectedPOs([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchRejectedPOs()

    const handleFocus = () => fetchRejectedPOs()
    window.addEventListener("focus", handleFocus)
    return () => window.removeEventListener("focus", handleFocus)
  }, [])

  const totalAmount = rejectedPOs.reduce((sum, po) => sum + (po.totalAmount || 0), 0)
  const totalCount = rejectedPOs.length

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-wider">REJECT PO</h1>
          <p className="text-sm text-muted-foreground">Rejected purchase orders</p>
        </div>
        <Button
          onClick={fetchRejectedPOs}
          disabled={isLoading}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {rejectedPOs.length > 0 && (
        <DashboardStats currentPOs={rejectedPOs} approvedPOs={[]} showPending={false} statusLabel="REJECTED" statusValue={totalCount} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground tracking-wider">REJECTED ORDERS</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground font-mono">{totalCount} rejected orders</p>
              <p className="text-xs text-muted-foreground mt-1">৳{totalAmount.toLocaleString()}</p>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3">
          {isLoading ? (
            <Card className="bg-card border-border">
              <CardContent className="p-8 text-center">
                <RefreshCw className="w-8 h-8 animate-spin text-accent mx-auto mb-4" />
                <p className="text-muted-foreground">Loading rejected purchase orders...</p>
              </CardContent>
            </Card>
          ) : rejectedPOs.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="p-8 text-center">
                <XCircle className="w-8 h-8 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No rejected purchase orders found</p>
              </CardContent>
            </Card>
          ) : (
            <POComparison currentPOs={rejectedPOs} approvedPOs={[]} isReadOnly={true} />
          )}
        </div>
      </div>
    </div>
  )
}



