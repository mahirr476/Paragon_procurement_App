// // "use client"

// // import { useState, useEffect } from "react"
// // import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// // import { Button } from "@/components/ui/button"
// // import { RefreshCw, CheckCircle2, XCircle } from "lucide-react"
// // import { POComparison } from "@/components/po-comparison"
// // import { DashboardStats } from "@/components/dashboard-stats"
// // import { getApprovedPOs } from "@/lib/storage"
// // import type { PurchaseOrder } from "@/lib/types"

// // export default function ApprovalPOPage() {
// //   const [approvedPOs, setApprovedPOs] = useState<PurchaseOrder[]>([])
// //   const [isLoading, setIsLoading] = useState(true)

// //   const fetchApprovedPOs = async () => {
// //     setIsLoading(true)
// //     try {
// //       const pos = await getApprovedPOs()
// //       // Only show POs that were explicitly approved from Pending PO workflow
// //       // This means they must have:
// //       // 1. isApproved === true
// //       // 2. status === "approved" 
// //       // 3. uploadedAt timestamp (from API conversion)
// //       // 4. The PO should not exist in current pending API data (to avoid showing data that should be pending)
// //       const filtered = Array.isArray(pos) 
// //         ? pos.filter((po: PurchaseOrder) => {
// //             // Must be explicitly approved
// //             if (po.isApproved !== true) return false
            
// //             // Must have approved status (lowercase)
// //             if (po.status?.toLowerCase() !== "approved") return false
            
// //             // Must have uploadedAt (indicates it came from API/Pending PO)
// //             if (!po.uploadedAt) return false
            
// //             // Additional check: uploadedAt should be recent (within last 30 days)
// //             // This filters out very old approved data
// //             try {
// //               const uploadedDate = new Date(po.uploadedAt)
// //               const daysSinceUpload = (Date.now() - uploadedDate.getTime()) / (1000 * 60 * 60 * 24)
// //               if (daysSinceUpload > 30) return false
// //             } catch {
// //               // If date parsing fails, exclude it
// //               return false
// //             }
            
// //             return true
// //           }) 
// //         : []
// //       setApprovedPOs(filtered)
// //     } catch (error) {
// //       console.error("Error fetching approved POs:", error)
// //       setApprovedPOs([])
// //     } finally {
// //       setIsLoading(false)
// //     }
// //   }

// //   useEffect(() => {
// //     fetchApprovedPOs()

// //     // Refresh on window focus
// //     const handleFocus = () => {
// //       fetchApprovedPOs()
// //     }

// //     // Listen for approval events
// //     const handlePOsApproved = () => {
// //       fetchApprovedPOs()
// //     }

// //     window.addEventListener("focus", handleFocus)
// //     window.addEventListener("pos-approved", handlePOsApproved)

// //     return () => {
// //       window.removeEventListener("focus", handleFocus)
// //       window.removeEventListener("pos-approved", handlePOsApproved)
// //     }
// //   }, [])

// //   // Calculate stats
// //   const totalAmount = approvedPOs.reduce((sum: number, po: PurchaseOrder) => sum + (po.totalAmount || 0), 0)
// //   const totalCount = approvedPOs.length
// //   const averageAmount = totalCount > 0 ? totalAmount / totalCount : 0
// //   const uniqueSuppliers = new Set(approvedPOs.map((po: PurchaseOrder) => po.supplier)).size

// //   return (
// //     <div className="p-6 space-y-6">
// //       {/* Header */}
// //       <div className="flex justify-between items-start">
// //         <div>
// //           <h1 className="text-2xl font-bold text-foreground tracking-wider">APPROVAL PO</h1>
// //           <p className="text-sm text-muted-foreground">Approved purchase orders</p>
// //         </div>
// //         <Button
// //           onClick={fetchApprovedPOs}
// //           disabled={isLoading}
// //           variant="outline"
// //           size="sm"
// //           className="flex items-center gap-2"
// //         >
// //           <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
// //           Refresh
// //         </Button>
// //       </div>

// //       {/* Stats */}
// //       {approvedPOs.length > 0 && <DashboardStats currentPOs={[]} approvedPOs={approvedPOs} />}

// //       {/* Main Grid - Same layout as Pending PO */}
// //       <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
// //         {/* Left Sidebar - Stats/Info */}
// //         <div className="lg:col-span-1 space-y-4">
// //           <Card className="bg-card border-border">
// //             <CardHeader>
// //               <CardTitle className="text-sm font-medium text-muted-foreground tracking-wider">
// //                 APPROVED ORDERS
// //               </CardTitle>
// //             </CardHeader>
// //             <CardContent>
// //               <p className="text-sm text-foreground font-mono">{totalCount} approved orders</p>
// //               <p className="text-xs text-muted-foreground mt-1">
// //                 ৳{totalAmount.toLocaleString()}
// //               </p>
// //             </CardContent>
// //           </Card>

// //           {totalCount > 0 && (
// //             <Card className="bg-card border-border">
// //               <CardHeader>
// //                 <CardTitle className="text-sm font-medium text-muted-foreground tracking-wider">
// //                   STATISTICS
// //                 </CardTitle>
// //               </CardHeader>
// //               <CardContent className="space-y-2">
// //                 <div className="text-xs text-muted-foreground">
// //                   <div>Avg Order: ৳{(averageAmount / 1000).toFixed(0)}K</div>
// //                   <div className="mt-1">Suppliers: {uniqueSuppliers}</div>
// //                 </div>
// //               </CardContent>
// //             </Card>
// //           )}
// //         </div>

// //         {/* Main Content - PO Comparison (read-only for approved) */}
// //         <div className="lg:col-span-3">
// //           {isLoading ? (
// //             <Card className="bg-card border-border">
// //               <CardContent className="p-8 text-center">
// //                 <RefreshCw className="w-8 h-8 animate-spin text-accent mx-auto mb-4" />
// //                 <p className="text-muted-foreground">Loading approved purchase orders...</p>
// //               </CardContent>
// //             </Card>
// //           ) : approvedPOs.length === 0 ? (
// //             <Card className="bg-card border-border">
// //               <CardContent className="p-8 text-center">
// //                 <XCircle className="w-8 h-8 text-muted-foreground mx-auto mb-4" />
// //                 <p className="text-muted-foreground">No approved purchase orders found</p>
// //                 <p className="text-xs text-muted-foreground mt-2">
// //                   Approve purchase orders from the Pending PO page to see them here.
// //                 </p>
// //               </CardContent>
// //             </Card>
// //           ) : (
// //             <POComparison
// //               currentPOs={approvedPOs}
// //               approvedPOs={approvedPOs}
// //               onApprove={undefined}
// //               onDelete={undefined}
// //             />
// //           )}
// //         </div>
// //       </div>
// //     </div>
// //   )
// // }






// "use client"

// import { useState, useEffect } from "react"
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// import { Button } from "@/components/ui/button"
// import { RefreshCw, CheckCircle2, XCircle } from "lucide-react"
// import { POComparison } from "@/components/po-comparison"
// import { DashboardStats } from "@/components/dashboard-stats"
// import { getApprovedPOs } from "@/lib/storage"
// import { getCurrentUser } from "@/lib/auth"
// import type { PurchaseOrder } from "@/lib/types"

// export default function ApprovalPOPage() {
//   const [approvedPOs, setApprovedPOs] = useState<PurchaseOrder[]>([])
//   const [isLoading, setIsLoading] = useState(true)

//   const fetchApprovedPOs = async () => {
//     setIsLoading(true)
//     try {
//       // Get current user's empId and fetch only their approved POs
//       const user = getCurrentUser()
//       const pos = await getApprovedPOs(user?.empId)
//       // All data from ApprovalPO table is already approved, so no filtering needed
//       setApprovedPOs(Array.isArray(pos) ? pos : [])
//     } catch (error) {
//       console.error("Error fetching approved POs:", error)
//       setApprovedPOs([])
//     } finally {
//       setIsLoading(false)
//     }
//   }

//   useEffect(() => {
//     fetchApprovedPOs()

//     const handleFocus = () => {
//       fetchApprovedPOs()
//     }

//     const handlePOsApproved = () => {
//       fetchApprovedPOs()
//     }

//     window.addEventListener("focus", handleFocus)
//     window.addEventListener("pos-approved", handlePOsApproved)

//     return () => {
//       window.removeEventListener("focus", handleFocus)
//       window.removeEventListener("pos-approved", handlePOsApproved)
//     }
//   }, [])

//   const totalAmount = approvedPOs.reduce((sum: number, po: PurchaseOrder) => sum + (po.totalAmount || 0), 0)
//   const totalCount = approvedPOs.length
//   const averageAmount = totalCount > 0 ? totalAmount / totalCount : 0
//   const uniqueSuppliers = new Set(approvedPOs.map((po: PurchaseOrder) => po.supplier)).size

//   return (
//     <div className="p-6 space-y-6">
//       <div className="flex justify-between items-start">
//         <div>
//           <h1 className="text-2xl font-bold text-foreground tracking-wider">APPROVAL PO</h1>
//           <p className="text-sm text-muted-foreground">Approved purchase orders</p>
//         </div>
//         <Button
//           onClick={fetchApprovedPOs}
//           disabled={isLoading}
//           variant="outline"
//           size="sm"
//           className="flex items-center gap-2"
//         >
//           <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
//           Refresh
//         </Button>
//       </div>

//       {approvedPOs.length > 0 && <DashboardStats currentPOs={[]} approvedPOs={approvedPOs} showPending={false} />}

//       <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
//         <div className="lg:col-span-1 space-y-4">
//           <Card className="bg-card border-border">
//             <CardHeader>
//               <CardTitle className="text-sm font-medium text-muted-foreground tracking-wider">
//                 APPROVED ORDERS
//               </CardTitle>
//             </CardHeader>
//             <CardContent>
//               <p className="text-sm text-foreground font-mono">{totalCount} approved orders</p>
//               <p className="text-xs text-muted-foreground mt-1">
//                 ৳{totalAmount.toLocaleString()}
//               </p>
//             </CardContent>
//           </Card>

//           {totalCount > 0 && (
//             <Card className="bg-card border-border">
//               <CardHeader>
//                 <CardTitle className="text-sm font-medium text-muted-foreground tracking-wider">
//                   STATISTICS
//                 </CardTitle>
//               </CardHeader>
//               <CardContent className="space-y-2">
//                 <div className="text-xs text-muted-foreground">
//                   <div>Avg Order: ৳{(averageAmount / 1000).toFixed(0)}K</div>
//                   <div className="mt-1">Suppliers: {uniqueSuppliers}</div>
//                 </div>
//               </CardContent>
//             </Card>
//           )}
//         </div>

//         <div className="lg:col-span-3">
//           {isLoading ? (
//             <Card className="bg-card border-border">
//               <CardContent className="p-8 text-center">
//                 <RefreshCw className="w-8 h-8 animate-spin text-accent mx-auto mb-4" />
//                 <p className="text-muted-foreground">Loading approved purchase orders...</p>
//               </CardContent>
//             </Card>
//           ) : approvedPOs.length === 0 ? (
//             <Card className="bg-card border-border">
//               <CardContent className="p-8 text-center">
//                 <XCircle className="w-8 h-8 text-muted-foreground mx-auto mb-4" />
//                 <p className="text-muted-foreground">No approved purchase orders found</p>
//                 <p className="text-xs text-muted-foreground mt-2">
//                   Approve purchase orders from the Pending PO page to see them here.
//                 </p>
//               </CardContent>
//             </Card>
//           ) : (
//             <POComparison
//               currentPOs={approvedPOs}
//               approvedPOs={approvedPOs}
//               onApprove={undefined}
//               onDelete={undefined}
//               isReadOnly={true}
//             />
//           )}
//         </div>
//       </div>
//     </div>
//   )
// }





"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RefreshCw, CheckCircle2, XCircle } from "lucide-react"
import { POComparison } from "@/components/po-comparison"
import { DashboardStats } from "@/components/dashboard-stats"
import { getApprovedPOs } from "@/lib/storage"
import { getCurrentUser } from "@/lib/auth"
import type { PurchaseOrder } from "@/lib/types"

export default function ApprovalPOPage() {
  const [approvedPOs, setApprovedPOs] = useState<PurchaseOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchApprovedPOs = async () => {
    setIsLoading(true)
    try {
      // Get current user's empId and fetch only their approved POs
      const user = getCurrentUser()
      const pos = await getApprovedPOs(user?.empId)
      // All data from ApprovalPO table is already approved, so no filtering needed
      setApprovedPOs(Array.isArray(pos) ? pos : [])
    } catch (error) {
      console.error("Error fetching approved POs:", error)
      setApprovedPOs([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchApprovedPOs()

    const handleFocus = () => {
      fetchApprovedPOs()
    }

    const handlePOsApproved = () => {
      fetchApprovedPOs()
    }

    window.addEventListener("focus", handleFocus)
    window.addEventListener("pos-approved", handlePOsApproved)

    return () => {
      window.removeEventListener("focus", handleFocus)
      window.removeEventListener("pos-approved", handlePOsApproved)
    }
  }, [])

  const totalAmount = approvedPOs.reduce((sum: number, po: PurchaseOrder) => sum + (po.totalAmount || 0), 0)
  const totalCount = approvedPOs.length
  const averageAmount = totalCount > 0 ? totalAmount / totalCount : 0
  const uniqueSuppliers = new Set(approvedPOs.map((po: PurchaseOrder) => po.supplier)).size

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-wider">APPROVAL PO</h1>
          <p className="text-sm text-muted-foreground">Approved purchase orders</p>
        </div>
        <Button
          onClick={fetchApprovedPOs}
          disabled={isLoading}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      {approvedPOs.length > 0 && <DashboardStats currentPOs={[]} approvedPOs={approvedPOs} showPending={false} />}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar - Stats/Info */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground tracking-wider">
                APPROVED ORDERS
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground font-mono">{totalCount} approved orders</p>
              <p className="text-xs text-muted-foreground mt-1">
                ৳{totalAmount.toLocaleString()}
              </p>
            </CardContent>
          </Card>

          {totalCount > 0 && (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground tracking-wider">
                  STATISTICS
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-xs text-muted-foreground">
                  <div>Avg Order: ৳{(averageAmount / 1000).toFixed(0)}K</div>
                  <div className="mt-1">Suppliers: {uniqueSuppliers}</div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Main Content - PO Comparison (read-only for approved) */}
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
                <XCircle className="w-8 h-8 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No approved purchase orders found</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Approve purchase orders from the Pending PO page to see them here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <POComparison
              currentPOs={approvedPOs}
              approvedPOs={approvedPOs}
              onApprove={undefined}
              onDelete={undefined}
              isReadOnly={true}
            />
          )}
        </div>
      </div>
    </div>
  )
}