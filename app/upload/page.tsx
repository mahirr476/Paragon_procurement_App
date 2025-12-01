"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CSVUploader } from "@/components/csv-uploader"
import { POComparison } from "@/components/po-comparison"
import { DashboardStats } from "@/components/dashboard-stats"
import { DatabaseManager } from "@/components/database-manager"
import { ApprovalComparison } from "@/components/approval-comparison"
import { PurchaseOrder } from "@/lib/types"
import type { PoloxyDatabase, PoloxyApprovalRequest } from "@/lib/poloxy-types"
import { mockDatabases, fetchMockApprovals } from "@/lib/poloxy-mock-data"
import { getApprovedPOs, getCurrentPOs, addToApprovedPOs, clearCurrentPOs, saveCurrentPOs, addNotification, removeCurrentPOs } from "@/lib/storage"
import { getCurrentUser } from "@/lib/auth"
import { CheckCircle, Trash2, RefreshCw, TrendingUp, Clock, Database, Upload, FileSpreadsheet } from 'lucide-react'

type TabType = "csv" | "database"

export default function UploadPage() {
  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>("csv")

  // CSV Upload state
  const [currentPOs, setCurrentPOs] = useState<PurchaseOrder[]>([])
  const [approvedPOs, setApprovedPOs] = useState<PurchaseOrder[]>([])
  const [uploadCount, setUploadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  // Database Approval state
  const [databases, setDatabases] = useState<PoloxyDatabase[]>(mockDatabases)
  const [approvals, setApprovals] = useState<PoloxyApprovalRequest[]>([])
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)

  // Database Approval handlers
  const handleSyncAll = async () => {
    setIsSyncing(true)

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1500))

    const newApprovals = fetchMockApprovals(databases)
    setApprovals(newApprovals)
    setLastSyncTime(new Date())

    // Update database sync times
    setDatabases((prev) =>
      prev.map((db) => ({
        ...db,
        lastSynced: new Date(),
      })),
    )

    setIsSyncing(false)
  }

  const handleSyncDatabase = async (dbId: string) => {
    setIsSyncing(true)
    await new Promise((resolve) => setTimeout(resolve, 800))

    const db = databases.find((d) => d.id === dbId)
    if (db) {
      const dbApprovals = fetchMockApprovals([db])
      setApprovals((prev) => {
        const filtered = prev.filter((a) => a.databaseId !== dbId)
        return [...filtered, ...dbApprovals]
      })

      setDatabases((prev) => prev.map((d) => (d.id === dbId ? { ...d, lastSynced: new Date() } : d)))
    }

    setIsSyncing(false)
  }

  const handleAddDatabase = (db: PoloxyDatabase) => {
    setDatabases((prev) => [...prev, db])
    // Auto-sync new database
    handleSyncDatabase(db.id)
  }

  const handleUnlinkDatabase = (dbId: string) => {
    setDatabases((prev) => prev.filter((d) => d.id !== dbId))
    setApprovals((prev) => prev.filter((a) => a.databaseId !== dbId))
  }

  const convertToPurchaseOrder = (approval: PoloxyApprovalRequest): PurchaseOrder => ({
    id: approval.id,
    date: approval.date,
    supplier: approval.supplier,
    orderNo: approval.orderNo,
    refNo: approval.refNo,
    dueDate: approval.dueDate,
    branch: approval.branch,
    requisitionType: approval.requisitionType,
    itemLedgerGroup: approval.itemLedgerGroup,
    item: approval.item,
    minQty: approval.minQty,
    maxQty: approval.maxQty,
    unit: approval.unit,
    rate: approval.rate,
    deliveryDate: approval.deliveryDate,
    cgst: approval.cgst,
    sgst: approval.sgst,
    igst: approval.igst,
    vat: approval.vat,
    lastApprovedRate: approval.lastApprovedRate,
    lastSupplier: approval.lastSupplier,
    broker: approval.broker,
    totalAmount: approval.totalAmount,
    status: "approved",
    deliveryType: approval.deliveryType,
    openPO: approval.openPO,
    openPONo: approval.openPONo,
    uploadedAt: new Date().toISOString(),
    isApproved: true,
  })

  const handleApprove = async (ids: string[]) => {
    const toApprove = approvals.filter((a) => ids.includes(a.id))
    const purchaseOrders = toApprove.map(convertToPurchaseOrder)

    await addToApprovedPOs(purchaseOrders)
    setApprovedPOs((prev) => [...prev, ...purchaseOrders])
    setApprovals((prev) => prev.filter((a) => !ids.includes(a.id)))
  }

  const handleReject = async (ids: string[]) => {
    // In real implementation, this would call Poloxy API to reject
    setApprovals((prev) => prev.filter((a) => !ids.includes(a.id)))
  }

  const handleDeleteApproval = async (ids: string[]) => {
    setApprovals((prev) => prev.filter((a) => !ids.includes(a.id)))
  }

  // CSV Upload handlers
  const handleUploadSuccess = async (count: number, databaseId?: string) => {
    setUploadCount(count)

    // If a database was selected, you could tag the uploaded POs here
    if (databaseId) {
      console.log('[Upload Page] CSV uploaded with database:', databaseId)
    }
    
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
        setApprovedPOs(Array.isArray(approved) ? approved : [])

        // Initial sync for database approvals
        setTimeout(() => {
          handleSyncAll()
        }, 100)
      } catch (error) {
        console.error('[Upload Page] Error loading data:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Calculate stats for database approval tab
  const totalPending = approvals.length
  const totalAmount = approvals.reduce((sum, a) => sum + a.totalAmount, 0)
  const urgentCount = approvals.filter((a) => a.requisitionType === "Urgent").length

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-wider">UPLOAD & REVIEW</h1>
          <p className="text-sm text-muted-foreground">
            {activeTab === "csv"
              ? "Upload CSV files and analyze purchase orders"
              : "Manage approval requests from Poloxy databases"}
          </p>
        </div>

        {activeTab === "database" && lastSyncTime && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            Last synced: {lastSyncTime.toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* Tab Selector */}
      <div className="flex gap-2 border-b border-border">
        <button
          onClick={() => setActiveTab("csv")}
          className={`px-6 py-3 font-medium text-sm flex items-center gap-2 transition-colors relative ${
            activeTab === "csv"
              ? "text-accent border-b-2 border-accent"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          CSV Upload
          {currentPOs.length > 0 && (
            <Badge variant="secondary" className="ml-2 bg-accent/20 text-accent">
              {currentPOs.length}
            </Badge>
          )}
        </button>
        <button
          onClick={() => setActiveTab("database")}
          className={`px-6 py-3 font-medium text-sm flex items-center gap-2 transition-colors relative ${
            activeTab === "database"
              ? "text-accent border-b-2 border-accent"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Database className="w-4 h-4" />
          Database Approval
          {approvals.length > 0 && (
            <Badge variant="secondary" className="ml-2 bg-accent/20 text-accent">
              {approvals.length}
            </Badge>
          )}
        </button>
      </div>

      {/* CSV Upload Tab */}
      {activeTab === "csv" && (
        <>
          {/* Stats */}
          {currentPOs.length > 0 && (
            <DashboardStats currentPOs={currentPOs} approvedPOs={approvedPOs} />
          )}

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Upload Section */}
            <div className="lg:col-span-1 space-y-4">
              <CSVUploader
                onUploadSuccess={handleUploadSuccess}
                databases={databases}
                onAddDatabase={handleAddDatabase}
              />

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
        </>
      )}

      {/* Database Approval Tab */}
      {activeTab === "database" && (
        <>
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Pending Approvals</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{totalPending}</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                    <RefreshCw className={`w-5 h-5 text-accent ${isSyncing ? "animate-spin" : ""}`} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Value</p>
                    <p className="text-2xl font-bold text-foreground mt-1">৳{(totalAmount / 1000).toFixed(0)}K</p>
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
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Connected DBs</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{databases.length}</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                    <Database className="w-5 h-5 text-cyan-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Urgent</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{urgentCount}</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                    <Badge className="bg-red-500 text-white text-xs px-1.5">!</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Database Manager */}
            <div className="lg:col-span-1 space-y-4">
              <DatabaseManager
                databases={databases}
                onAddDatabase={handleAddDatabase}
                onUnlinkDatabase={handleUnlinkDatabase}
                onSyncDatabase={handleSyncDatabase}
                onSyncAll={handleSyncAll}
                isSyncing={isSyncing}
              />

              {/* History Card */}
              {approvedPOs.length > 0 && (
                <Card className="bg-card border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground tracking-wider">
                      APPROVAL HISTORY
                    </CardTitle>
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

            {/* Approval Comparison */}
            <div className="lg:col-span-3">
              <ApprovalComparison
                approvals={approvals}
                databases={databases}
                approvedPOs={approvedPOs}
                onApprove={handleApprove}
                onReject={handleReject}
                onDelete={handleDeleteApproval}
              />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
