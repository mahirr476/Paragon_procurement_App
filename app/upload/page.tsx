"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CSVUploader } from "@/components/csv-uploader"
import { POComparison } from "@/components/po-comparison"
import { DashboardStats } from "@/components/dashboard-stats"
import { PurchaseOrder } from "@/lib/types"
import { getApprovedPOs, getCurrentPOs, addToApprovedPOs, clearCurrentPOs, saveCurrentPOs, addNotification } from "@/lib/storage"
import { CheckCircle, Trash2 } from 'lucide-react'

export default function UploadPage() {
  const [currentPOs, setCurrentPOs] = useState<PurchaseOrder[]>(getCurrentPOs())
  const [approvedPOs, setApprovedPOs] = useState<PurchaseOrder[]>(getApprovedPOs())
  const [uploadCount, setUploadCount] = useState(0)

  const handleUploadSuccess = (count: number) => {
    setUploadCount(count)
    setCurrentPOs(getCurrentPOs())
    
    if (count > 0) {
      addNotification({
        type: 'approval_needed',
        title: 'New Purchase Orders Uploaded',
        message: `${count} purchase orders have been uploaded and are ready for review.`,
        count: count,
        severity: 'info',
        link: '/upload'
      })
    }
  }

  const handleApproveSelected = (poIds: string[]) => {
    const toApprove = currentPOs
      .filter(po => poIds.includes(po.id))
      .map(po => ({ ...po, isApproved: true }))
    
    addToApprovedPOs(toApprove)
    setApprovedPOs([...approvedPOs, ...toApprove])
    
    const remaining = currentPOs.filter(po => !poIds.includes(po.id))
    saveCurrentPOs(remaining)
    setCurrentPOs(remaining)
    
    if (remaining.length === 0) {
      setUploadCount(0)
    }
  }

  const handleDeleteSelected = (poIds: string[]) => {
    const remaining = currentPOs.filter(po => !poIds.includes(po.id))
    saveCurrentPOs(remaining)
    setCurrentPOs(remaining)
    
    if (remaining.length === 0) {
      setUploadCount(0)
    }
  }

  const handleApprovePOs = () => {
    const allIds = currentPOs.map(po => po.id)
    handleApproveSelected(allIds)
  }

  const handleRejectPOs = () => {
    clearCurrentPOs()
    setCurrentPOs([])
    setUploadCount(0)
  }


  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-wider">UPLOAD & REVIEW</h1>
          <p className="text-sm text-muted-foreground">Upload CSV files and analyze purchase orders</p>
        </div>
      </div>

      {/* Stats */}
      {currentPOs.length > 0 && (
        <DashboardStats currentPOs={currentPOs} approvedPOs={approvedPOs} />
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Upload Section */}
        <div className="lg:col-span-1 space-y-4">
          <CSVUploader onUploadSuccess={handleUploadSuccess} />

          {approvedPOs.length > 0 && (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground tracking-wider">HISTORY</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground font-mono">{approvedPOs.length} approved orders</p>
                <p className="text-xs text-muted-foreground mt-1">
                  ৳{approvedPOs.reduce((sum, po) => sum + po.totalAmount, 0).toLocaleString()}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Analysis Section */}
        <div className="lg:col-span-3">
          <POComparison 
            currentPOs={currentPOs} 
            approvedPOs={approvedPOs}
            onApprove={handleApproveSelected}
            onDelete={handleDeleteSelected}
          />
        </div>
      </div>
    </div>
  )
}
