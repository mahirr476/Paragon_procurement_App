"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CSVUploader } from "@/components/csv-uploader"
import { POComparison } from "@/components/po-comparison"
import { DashboardStats } from "@/components/dashboard-stats"
import { PurchaseOrder } from "@/lib/types"
import { getApprovedPOs, getCurrentPOs, addToApprovedPOs, clearCurrentPOs, saveCurrentPOs, addNotification, removeCurrentPOs } from "@/lib/storage"
import { getCurrentUser } from "@/lib/auth"
import { CheckCircle, Trash2 } from 'lucide-react'

export default function UploadPage() {
  const [currentPOs, setCurrentPOs] = useState<PurchaseOrder[]>([])
  const [approvedPOs, setApprovedPOs] = useState<PurchaseOrder[]>([])
  const [uploadCount, setUploadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  // Load data on mount
  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true)
        const [current, approved] = await Promise.all([
          getCurrentPOs(),
          getApprovedPOs()
        ])
        setCurrentPOs(current)
        setApprovedPOs(approved)
      } catch (error) {
        console.error('[Upload Page] Error loading data:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  const handleUploadSuccess = async (count: number) => {
    setUploadCount(count)
    
    // Reload current POs after upload
    try {
      const updated = await getCurrentPOs()
      setCurrentPOs(updated)
    } catch (error) {
      console.error('[Upload Page] Error reloading POs:', error)
    }
    
    if (count > 0) {
      const user = getCurrentUser()
      if (user) {
        await addNotification(user.id, {
          type: 'approval_needed',
          title: 'New Purchase Orders Uploaded',
          message: `${count} purchase orders have been uploaded and are ready for review.`,
          count: count,
          severity: 'info',
          link: '/upload'
        })
      }
    }
  }

  const handleApproveSelected = async (poIds: string[]) => {
    if (poIds.length === 0) return
    
    const toApprove = currentPOs
      .filter(po => poIds.includes(po.id))
      .map(po => ({ ...po, isApproved: true }))
    
    try {
      console.log('[Upload Page] Approving POs:', poIds.length, 'IDs:', poIds.slice(0, 5))
      const result = await addToApprovedPOs(toApprove)
      
      if (!result.success) {
        console.error('[Upload Page] Approval failed:', result.error)
        alert(`Failed to approve POs: ${result.error || 'Unknown error'}`)
        return
      }
      
      console.log('[Upload Page] Approval successful, updating count:', result.count)
      
      // Reload data from database
      const [updated, approved] = await Promise.all([
        getCurrentPOs(),
        getApprovedPOs()
      ])
      
      console.log('[Upload Page] After approval - Current:', updated.length, 'Approved:', approved.length)
      
      setCurrentPOs(updated)
      setApprovedPOs(approved)
      
      if (updated.length === 0) {
        setUploadCount(0)
      }
      
      // Trigger a custom event to notify other pages to refresh
      if (result.count > 0) {
        window.dispatchEvent(new CustomEvent('pos-approved', { detail: { count: result.count } }))
        // Also update localStorage as a backup signal
        localStorage.setItem('pos-last-approved', Date.now().toString())
        
        alert(`Successfully approved ${result.count} purchase order(s)! They will now appear in the Dashboard and Reports.`)
      }
    } catch (error) {
      console.error('[Upload Page] Error approving POs:', error)
      alert(`Error approving POs: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleDeleteSelected = async (poIds: string[]) => {
    try {
      await removeCurrentPOs(poIds)
      
      // Reload data from database
      const updated = await getCurrentPOs()
      setCurrentPOs(updated)
      
      if (updated.length === 0) {
        setUploadCount(0)
      }
    } catch (error) {
      console.error('[Upload Page] Error deleting POs:', error)
    }
  }

  const handleApprovePOs = () => {
    const allIds = currentPOs.map(po => po.id)
    handleApproveSelected(allIds)
  }

  const handleRejectPOs = async () => {
    try {
      await clearCurrentPOs()
      setCurrentPOs([])
      setUploadCount(0)
    } catch (error) {
      console.error('[Upload Page] Error clearing POs:', error)
    }
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
