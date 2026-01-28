

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, Clock, CheckCircle2, AlertCircle, FileSpreadsheet, Database } from "lucide-react"
import { POComparison } from "@/components/po-comparison"
import { DashboardStats } from "@/components/dashboard-stats"
import { CSVUploader } from "@/components/csv-uploader"
import {
  addToApprovedPOs,
  addToRejectedPOs,
  getApprovedPOs,
  getCurrentPOs,
  removeCurrentPOs,
  addNotification,
} from "@/lib/storage"
import { getCurrentUser } from "@/lib/auth"
import type { PurchaseOrder } from "@/lib/types"
import type { PoloxyDatabase } from "@/lib/poloxy-types"
import { mockDatabases } from "@/lib/poloxy-mock-data"

interface PendingPOData {
  Date: string
  Supplier: string
  OrderNo: string
  RefNo: string
  DueDate: string
  Branch: string
  RequisitionType: string
  ItemOrLedgerGroup: string
  Item: string
  MinQty: string
  MaxQty: string
  Unit: string
  Rate: string
  LastApprovedRate: string
  LastSupplier: string
  TotalAmount: string
  Status: string
  DeliveryType: string
}

// Convert API data to PurchaseOrder format
function convertToPurchaseOrder(po: PendingPOData, index: number): PurchaseOrder {
  return {
    id: `${po.OrderNo}-${index}-${Date.now()}`,
    date: po.Date,
    supplier: po.Supplier,
    orderNo: po.OrderNo,
    refNo: po.RefNo || "",
    dueDate: po.DueDate,
    branch: po.Branch,
    requisitionType: po.RequisitionType,
    itemLedgerGroup: po.ItemOrLedgerGroup,
    item: po.Item,
    minQty: parseFloat(po.MinQty) || 0,
    maxQty: parseFloat(po.MaxQty) || 0,
    unit: po.Unit,
    rate: parseFloat(po.Rate) || 0,
    deliveryDate: po.DueDate,
    cgst: 0,
    sgst: 0,
    igst: 0,
    vat: 0,
    lastApprovedRate: parseFloat(po.LastApprovedRate) || 0,
    lastSupplier: po.LastSupplier || "",
    broker: "",
    totalAmount: parseFloat(po.TotalAmount) || 0,
    status: po.Status || "pending",
    deliveryType: po.DeliveryType,
    openPO: "",
    openPONo: "",
    uploadedAt: new Date().toISOString(),
    isApproved: false,
  }
}

type TabType = "api" | "csv"

export default function PendingPOPage() {
  const [activeTab, setActiveTab] = useState<TabType>("api")
  
  // API Pending POs state
  const [pendingPOs, setPendingPOs] = useState<PurchaseOrder[]>([])
  const [approvedPOs, setApprovedPOs] = useState<PurchaseOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null)
  
  // CSV Upload state
  const [currentPOs, setCurrentPOs] = useState<PurchaseOrder[]>([])
  const [uploadCount, setUploadCount] = useState(0)
  const [databases, setDatabases] = useState<PoloxyDatabase[]>(mockDatabases)

  const fetchPendingPOs = async () => {
    setIsLoading(true)
    setError(null)
    try {
      // Get logged-in user's empId
      const user = getCurrentUser()
      if (!user || !user.empId) {
        setError("Please login with a valid Employee ID to fetch pending POs")
        setIsLoading(false)
        return
      }

      // ✅ Changed back to REAL API endpoint with user's empId
      const response = await fetch(`/api/pending-pos?empId=${encodeURIComponent(user.empId)}&approvalLevel=2`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        let errorMessage = `API request failed: ${response.status}`
        let errorDetails = ""
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
          errorDetails = errorData.details || errorData.rawText || ""
        } catch {
          // If error response is not JSON, use default message
        }
        const fullError = errorDetails ? `${errorMessage}\n\nDetails: ${errorDetails}` : errorMessage
        throw new Error(fullError)
      }

      const result = await response.json()

      console.log("[Pending PO Page] API Response:", {
        success: result.success,
        dataLength: result.data?.length || 0,
        hasData: Array.isArray(result.data),
        error: result.error
      })

      if (result.success && Array.isArray(result.data)) {
        console.log("[Pending PO Page] Converting", result.data.length, "POs")
        // Convert API data to PurchaseOrder format
        const convertedPOs = result.data.map((po: PendingPOData, index: number) =>
          convertToPurchaseOrder(po, index)
        )
        console.log("[Pending PO Page] Converted", convertedPOs.length, "POs")
        setPendingPOs(convertedPOs)
        const fetchTime = new Date()
        setLastFetchTime(fetchTime)
        
        // Cache the data in sessionStorage (persists across page navigation)
        try {
          sessionStorage.setItem("pendingPOs_cache", JSON.stringify(convertedPOs))
          sessionStorage.setItem("pendingPOs_cache_time", fetchTime.getTime().toString())
          console.log("[Pending PO Page] Data cached successfully")
        } catch (error) {
          console.error("[Pending PO Page] Error caching data:", error)
        }
      } else {
        console.warn("[Pending PO Page] No data or invalid response:", result)
        setPendingPOs([])
        if (result.error) {
          setError(result.error)
        }
      }
    } catch (err) {
      console.error("Error fetching pending POs:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch data")
      setPendingPOs([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleApproveSelected = async (poIds: string[]) => {
    if (poIds.length === 0) return

    const toApprove = pendingPOs.filter((po) => poIds.includes(po.id)).map((po) => ({
      ...po,
      isApproved: true,
      status: "approved",
    }))

    try {
      const result = await addToApprovedPOs(toApprove)

      if (!result.success) {
        console.error("Approval failed:", result.error)
        alert(`Failed to approve POs: ${result.error || "Unknown error"}`)
        return
      }

      // Remove approved POs from pending list
      setPendingPOs((prev: PurchaseOrder[]) => {
        const updatedPendingPOs = prev.filter((po: PurchaseOrder) => !poIds.includes(po.id))
        // Update cache
        sessionStorage.setItem("pendingPOs_cache", JSON.stringify(updatedPendingPOs))
        sessionStorage.setItem("pendingPOs_cache_time", Date.now().toString())
        return updatedPendingPOs
      })

      // Reload approved POs for current user
      const user = getCurrentUser()
      const approved = await getApprovedPOs(user?.empId)
      setApprovedPOs(approved)

      // Trigger refresh event
      if (result.count > 0) {
        window.dispatchEvent(new CustomEvent("pos-approved", { detail: { count: result.count } }))
        localStorage.setItem("pos-last-approved", Date.now().toString())

        alert(`Successfully approved ${result.count} purchase order(s)! They will now appear in the Approval PO page.`)
      }
    } catch (error) {
      console.error("Error approving POs:", error)
      alert(`Error approving POs: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  const handleDeleteSelected = async (poIds: string[]) => {
    if (activeTab === "api") {
      // Treat "Delete" as "Reject" for Pending PO (API tab)
      const toReject = pendingPOs.filter((po) => poIds.includes(po.id)).map((po) => ({
        ...po,
        status: "rejected",
        isApproved: false,
      }))

      try {
        const result = await addToRejectedPOs(toReject)
        if (!result?.success) {
          alert(`Failed to reject POs: ${result?.error || "Unknown error"}`)
          return
        }
      } catch (error) {
        console.error("Error rejecting POs:", error)
        alert(`Error rejecting POs: ${error instanceof Error ? error.message : "Unknown error"}`)
        return
      }

      // Remove from UI + cache after reject saved
      setPendingPOs((prev: PurchaseOrder[]) => {
        const updatedPendingPOs = prev.filter((po: PurchaseOrder) => !poIds.includes(po.id))
        sessionStorage.setItem("pendingPOs_cache", JSON.stringify(updatedPendingPOs))
        sessionStorage.setItem("pendingPOs_cache_time", Date.now().toString())
        return updatedPendingPOs
      })
    } else {
      // CSV tab - Treat delete as reject: save to RejectPO DB then remove from current POs DB
      try {
        const toReject = currentPOs.filter((po) => poIds.includes(po.id)).map((po) => ({
          ...po,
          status: "rejected",
          isApproved: false,
        }))
        if (toReject.length > 0) {
          const result = await addToRejectedPOs(toReject)
          if (!result?.success) {
            alert(`Failed to reject POs: ${result?.error || "Unknown error"}`)
            return
          }
        }
        await removeCurrentPOs(poIds)
        const updated = await getCurrentPOs()
        setCurrentPOs(updated)
        if (updated.length === 0) {
          setUploadCount(0)
        }
      } catch (error) {
        console.error("Error deleting POs:", error)
      }
    }
  }
  
  // CSV Upload handlers
  const handleUploadSuccess = async (count: number, databaseId?: string) => {
    setUploadCount(count)
    if (databaseId) {
      console.log("[Pending PO Page] CSV uploaded with database:", databaseId)
    }
    try {
      const updated = await getCurrentPOs()
      setCurrentPOs(updated)
    } catch (error) {
      console.error("[Pending PO Page] Error reloading POs:", error)
    }
    if (count > 0) {
      const user = getCurrentUser()
      if (user) {
        await addNotification(user.id, {
          type: "approval_needed",
          title: "New Purchase Orders Uploaded",
          message: `${count} purchase orders have been uploaded and are ready for review.`,
          count: count,
          severity: "info",
          link: "/pending-po",
        })
      }
    }
  }
  
  const handleApproveSelectedCSV = async (poIds: string[]) => {
    if (poIds.length === 0) return
    const toApprove = currentPOs
      .filter((po) => poIds.includes(po.id))
      .map((po) => ({ ...po, isApproved: true }))
    try {
      const result = await addToApprovedPOs(toApprove)
      if (!result.success) {
        alert(`Failed to approve POs: ${result.error || "Unknown error"}`)
        return
      }
      const user = getCurrentUser()
      const [updated, approved] = await Promise.all([getCurrentPOs(), getApprovedPOs(user?.empId)])
      setCurrentPOs(updated)
      setApprovedPOs(approved)
      if (updated.length === 0) {
        setUploadCount(0)
      }
      if (result.count > 0) {
        window.dispatchEvent(new CustomEvent("pos-approved", { detail: { count: result.count } }))
        localStorage.setItem("pos-last-approved", Date.now().toString())
        alert(`Successfully approved ${result.count} purchase order(s)!`)
      }
    } catch (error) {
      console.error("Error approving POs:", error)
      alert(`Error approving POs: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }
  
  const handleAddDatabase = (db: PoloxyDatabase) => {
    setDatabases((prev) => [...prev, db])
  }

  useEffect(() => {
    // Check if we have cached data in sessionStorage
    // Always load from cache if available (no expiration check)
    const cachedData = sessionStorage.getItem("pendingPOs_cache")
    const cacheTimestamp = sessionStorage.getItem("pendingPOs_cache_time")
    
    if (cachedData) {
      try {
        const parsedData = JSON.parse(cachedData)
        console.log("[Pending PO Page] Loading from cache, count:", parsedData.length)
        setPendingPOs(parsedData)
        setIsLoading(false)
        
        // Set last fetch time from cache if available
        if (cacheTimestamp) {
          const cacheTime = parseInt(cacheTimestamp, 10)
          if (!isNaN(cacheTime)) {
            setLastFetchTime(new Date(cacheTime))
          }
        }
      } catch (error) {
        console.error("Error parsing cached data:", error)
        setIsLoading(false)
        // Clear corrupted cache
        sessionStorage.removeItem("pendingPOs_cache")
        sessionStorage.removeItem("pendingPOs_cache_time")
      }
    } else {
      // No cache - data will be empty, user can click refresh
      console.log("[Pending PO Page] No cache found")
      setIsLoading(false)
    }

    // Load approved POs for current user
    const loadApproved = async () => {
      try {
        const user = getCurrentUser()
        const approved = await getApprovedPOs(user?.empId)
        setApprovedPOs(approved)
      } catch (error) {
        console.error("Error loading approved POs:", error)
      }
    }
    loadApproved()
    
    // Load CSV uploaded POs
    const loadCurrentPOs = async () => {
      try {
        const current = await getCurrentPOs()
        setCurrentPOs(current)
        setUploadCount(current.length)
      } catch (error) {
        console.error("Error loading current POs:", error)
      }
    }
    loadCurrentPOs()
  }, [])

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-wider">PENDING PO</h1>
          <p className="text-sm text-muted-foreground">
            {activeTab === "api"
              ? "Review and approve purchase orders from API"
              : "Upload CSV files and analyze purchase orders"}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {activeTab === "api" && lastFetchTime && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              Last fetched: {lastFetchTime.toLocaleTimeString()}
            </div>
          )}
          {activeTab === "api" && (
            <Button
              onClick={fetchPendingPOs}
              disabled={isLoading}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          )}
        </div>
      </div>

      {/* Tab Selector */}
      <div className="flex gap-2 border-b border-border">
        <button
          onClick={() => setActiveTab("api")}
          className={`px-6 py-3 font-medium text-sm flex items-center gap-2 transition-colors relative ${
            activeTab === "api"
              ? "text-accent border-b-2 border-accent"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Database className="w-4 h-4" />
          API Pending PO
          {pendingPOs.length > 0 && (
            <Badge variant="secondary" className="ml-2 bg-accent/20 text-accent">
              {pendingPOs.length}
            </Badge>
          )}
        </button>
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
      </div>

      {/* API Tab */}
      {activeTab === "api" && (
        <>
          {/* Error Message */}
          {error && (
            <Card className="bg-red-500/10 border-red-500/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-red-500">
                  <AlertCircle className="w-4 h-4" />
                  <div className="flex-1">
                    <span className="text-sm font-semibold">Error loading data:</span>
                    <p className="text-sm mt-1">{error}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Check browser console for more details. Make sure the API is accessible.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Stats */}
          {pendingPOs.length > 0 && <DashboardStats currentPOs={pendingPOs} approvedPOs={approvedPOs} />}

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Sidebar - Stats/Info */}
            <div className="lg:col-span-1 space-y-4">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-muted-foreground tracking-wider">
                    PENDING ORDERS
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-foreground font-mono">{pendingPOs.length} pending orders</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    ৳{pendingPOs.reduce((sum: number, po: PurchaseOrder) => sum + po.totalAmount, 0).toLocaleString()}
                  </p>
                </CardContent>
              </Card>

              {approvedPOs.length > 0 && (
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-muted-foreground tracking-wider">
                      APPROVED HISTORY
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-foreground font-mono">{approvedPOs.length} approved orders</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      ৳{approvedPOs.reduce((sum: number, po: PurchaseOrder) => sum + po.totalAmount, 0).toLocaleString()}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Main Content - PO Comparison */}
            <div className="lg:col-span-3">
              {isLoading ? (
                <Card className="bg-card border-border">
                  <CardContent className="p-8 text-center">
                    <RefreshCw className="w-8 h-8 animate-spin text-accent mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading pending purchase orders...</p>
                  </CardContent>
                </Card>
              ) : pendingPOs.length === 0 ? (
                <Card className="bg-card border-border">
                  <CardContent className="p-8 text-center">
                    <CheckCircle2 className="w-8 h-8 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No pending purchase orders found</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {error 
                        ? "There was an error fetching data. Check the error message above."
                        : "The API returned no data. Make sure the API endpoint is working correctly."}
                    </p>
                    <Button onClick={fetchPendingPOs} variant="outline" className="mt-4">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Refresh
                    </Button>
                    <p className="text-xs text-muted-foreground mt-4">
                      Check browser console (F12) for detailed logs
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <POComparison
                  currentPOs={pendingPOs}
                  approvedPOs={approvedPOs}
                  onApprove={handleApproveSelected}
                  onDelete={handleDeleteSelected}
                />
              )}
            </div>
          </div>
        </>
      )}

      {/* CSV Upload Tab */}
      {activeTab === "csv" && (
        <>
          {/* Stats */}
          {currentPOs.length > 0 && <DashboardStats currentPOs={currentPOs} approvedPOs={approvedPOs} />}

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
                onApprove={handleApproveSelectedCSV}
                onDelete={handleDeleteSelected}
              />
            </div>
          </div>
        </>
      )}
    </div>
  )
}