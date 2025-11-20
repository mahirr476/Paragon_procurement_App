"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CSVUploader } from "@/components/csv-uploader"
import { POComparison } from "@/components/po-comparison"
import { DashboardStats } from "@/components/dashboard-stats"
import type { PurchaseOrder } from "@/lib/types"
import { getApprovedPOs, getCurrentPOs, addToApprovedPOs, clearCurrentPOs } from "@/lib/storage"
import { CheckCircle, Trash2 } from "lucide-react"

export default function CommandCenterPage() {
  const [currentPOs, setCurrentPOs] = useState<PurchaseOrder[]>([])
  const [approvedPOs, setApprovedPOs] = useState<PurchaseOrder[]>([])
  const [uploadCount, setUploadCount] = useState(0)

  useEffect(() => {
    const loadPOs = async () => {
      const [current, approved] = await Promise.all([getCurrentPOs(), getApprovedPOs()])
      setCurrentPOs(current)
      setApprovedPOs(approved)
    }
    loadPOs()
  }, [])

  const handleUploadSuccess = async (count: number) => {
    setUploadCount(count)
    const current = await getCurrentPOs()
    setCurrentPOs(current)
  }

  const handleApprovePOs = async () => {
    const toApprove = currentPOs.map((po) => ({ ...po, isApproved: true }))
    await addToApprovedPOs(toApprove)
    const approved = await getApprovedPOs()
    setApprovedPOs(approved)
    await clearCurrentPOs()
    setCurrentPOs([])
    setUploadCount(0)
  }

  const handleRejectPOs = async () => {
    await clearCurrentPOs()
    setCurrentPOs([])
    setUploadCount(0)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wider">PO COMMAND CENTER</h1>
          <p className="text-sm text-neutral-400">Upload and review purchase orders</p>
        </div>
      </div>

      {/* Stats */}
      {currentPOs.length > 0 && <DashboardStats currentPOs={currentPOs} approvedPOs={approvedPOs} />}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Upload Section */}
        <div className="lg:col-span-1 space-y-4">
          <CSVUploader onUploadSuccess={handleUploadSuccess} />

          {uploadCount > 0 && (
            <Card className="bg-neutral-900 border-neutral-700">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">READY TO APPROVE</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-orange-500/10 border border-orange-500/20 rounded p-4">
                  <p className="text-sm text-orange-300">{uploadCount} purchase orders uploaded and analyzed</p>
                </div>

                <div className="space-y-2">
                  <Button
                    onClick={handleApprovePOs}
                    className="w-full bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Approve All
                  </Button>
                  <Button
                    onClick={handleRejectPOs}
                    variant="outline"
                    className="w-full border-neutral-700 text-neutral-400 hover:bg-neutral-800 bg-transparent"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Reject All
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {approvedPOs.length > 0 && (
            <Card className="bg-neutral-900 border-neutral-700">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">HISTORY</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-white font-mono">{approvedPOs.length} approved orders</p>
                <p className="text-xs text-neutral-500 mt-1">
                  ৳{approvedPOs.reduce((sum, po) => sum + po.totalAmount, 0).toLocaleString()}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Analysis Section */}
        <div className="lg:col-span-3">
          <POComparison currentPOs={currentPOs} approvedPOs={approvedPOs} />
        </div>
      </div>
    </div>
  )
}
