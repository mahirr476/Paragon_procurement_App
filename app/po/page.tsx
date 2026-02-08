// "use client"

// import { useState, useEffect } from "react"
// import { Card, CardContent } from "@/components/ui/card"
// import { Badge } from "@/components/ui/badge"
// import { CheckCircle, XCircle } from "lucide-react"
// import { POComparison } from "@/components/po-comparison"
// import { DashboardStats } from "@/components/dashboard-stats"
// import { getApprovedPOs, getRejectedPOs } from "@/lib/storage"
// import type { PurchaseOrder } from "@/lib/types"

// type TabType = "approval" | "reject"

// export default function POPage() {
//   const [activeTab, setActiveTab] = useState<TabType>("approval")
//   const [approvedPOs, setApprovedPOs] = useState<PurchaseOrder[]>([])
//   const [rejectedPOs, setRejectedPOs] = useState<PurchaseOrder[]>([])
//   const [isLoading, setIsLoading] = useState(true)

//   useEffect(() => {
//     const loadData = async () => {
//       setIsLoading(true)
//       try {
//         const [approved, rejected] = await Promise.all([
//           getApprovedPOs(),
//           getRejectedPOs()
//         ])
//         setApprovedPOs(approved)
//         setRejectedPOs(rejected)
//       } catch (error) {
//         console.error("Error loading POs:", error)
//       } finally {
//         setIsLoading(false)
//       }
//     }
//     loadData()
//   }, [])

//   // Refresh when tab changes
//   useEffect(() => {
//     const refreshData = async () => {
//       const [approved, rejected] = await Promise.all([
//         getApprovedPOs(),
//         getRejectedPOs()
//       ])
//       setApprovedPOs(approved)
//       setRejectedPOs(rejected)
//     }
//     refreshData()
//   }, [activeTab])

//   const currentPOs = activeTab === "approval" ? approvedPOs : rejectedPOs

//   return (
//     <div className="p-6 space-y-6">
//       {/* Header */}
//       <div className="flex justify-between items-start">
//         <div>
//           <h1 className="text-2xl font-bold text-foreground tracking-wider">PO MANAGEMENT</h1>
//           <p className="text-sm text-muted-foreground">
//             {activeTab === "approval"
//               ? "View all approved purchase orders"
//               : "View all rejected purchase orders"}
//           </p>
//         </div>
//       </div>

//       {/* Tab Selector */}
//       <div className="flex gap-2 border-b border-border">
//         <button
//           onClick={() => setActiveTab("approval")}
//           className={`px-6 py-3 font-medium text-sm flex items-center gap-2 transition-colors relative ${
//             activeTab === "approval"
//               ? "text-accent border-b-2 border-accent"
//               : "text-muted-foreground hover:text-foreground"
//           }`}
//         >
//           <CheckCircle className="w-4 h-4" />
//           Approval PO
//           {approvedPOs.length > 0 && (
//             <Badge variant="secondary" className="ml-2 bg-accent/20 text-accent">
//               {approvedPOs.length}
//             </Badge>
//           )}
//         </button>
//         <button
//           onClick={() => setActiveTab("reject")}
//           className={`px-6 py-3 font-medium text-sm flex items-center gap-2 transition-colors relative ${
//             activeTab === "reject"
//               ? "text-accent border-b-2 border-accent"
//               : "text-muted-foreground hover:text-foreground"
//           }`}
//         >
//           <XCircle className="w-4 h-4" />
//           Reject PO
//           {rejectedPOs.length > 0 && (
//             <Badge variant="secondary" className="ml-2 bg-accent/20 text-accent">
//               {rejectedPOs.length}
//             </Badge>
//           )}
//         </button>
//       </div>

//       {/* Stats */}
//       {currentPOs.length > 0 && <DashboardStats currentPOs={currentPOs} approvedPOs={[]} />}

//       {/* Main Content */}
//       <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
//         {/* Left Sidebar - Stats */}
//         <div className="lg:col-span-1 space-y-4">
//           <Card className="bg-card border-border">
//             <CardContent className="p-4">
//               <div className="text-sm text-muted-foreground mb-2">
//                 {activeTab === "approval" ? "APPROVED ORDERS" : "REJECTED ORDERS"}
//               </div>
//               <p className="text-2xl font-bold text-foreground">{currentPOs.length}</p>
//               <p className="text-xs text-muted-foreground mt-1">
//                 ৳{currentPOs.reduce((sum, po) => sum + po.totalAmount, 0).toLocaleString()}
//               </p>
//             </CardContent>
//           </Card>
//         </div>

//         {/* Main Content - PO List */}
//         <div className="lg:col-span-3">
//           {isLoading ? (
//             <Card className="bg-card border-border">
//               <CardContent className="p-8 text-center">
//                 <p className="text-muted-foreground">Loading...</p>
//               </CardContent>
//             </Card>
//           ) : currentPOs.length === 0 ? (
//             <Card className="bg-card border-border">
//               <CardContent className="p-8 text-center">
//                 {activeTab === "approval" ? (
//                   <CheckCircle className="w-8 h-8 text-muted-foreground mx-auto mb-4" />
//                 ) : (
//                   <XCircle className="w-8 h-8 text-muted-foreground mx-auto mb-4" />
//                 )}
//                 <p className="text-muted-foreground">
//                   {activeTab === "approval"
//                     ? "No approved purchase orders found"
//                     : "No rejected purchase orders found"}
//                 </p>
//               </CardContent>
//             </Card>
//           ) : (
//             <POComparison
//               currentPOs={currentPOs}
//               approvedPOs={[]}
//               onApprove={() => {}}
//               onDelete={() => {}}
//               hideActions={true}
//             />
//           )}
//         </div>
//       </div>
//     </div>
//   )
// }









"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle } from "lucide-react"
import { POComparison } from "@/components/po-comparison"
import { DashboardStats } from "@/components/dashboard-stats"
import { getApprovedPOs, getRejectedPOs } from "@/lib/storage"
import type { PurchaseOrder } from "@/lib/types"

type TabType = "approval" | "reject"

export default function POPage() {
  const [activeTab, setActiveTab] = useState<TabType>("approval")
  const [approvedPOs, setApprovedPOs] = useState<PurchaseOrder[]>([])
  const [rejectedPOs, setRejectedPOs] = useState<PurchaseOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        const [approved, rejected] = await Promise.all([
          getApprovedPOs(),
          getRejectedPOs()
        ])
        setApprovedPOs(approved)
        setRejectedPOs(rejected)
      } catch (error) {
        console.error("Error loading POs:", error)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  useEffect(() => {
    const refreshData = async () => {
      const [approved, rejected] = await Promise.all([
        getApprovedPOs(),
        getRejectedPOs()
      ])
      setApprovedPOs(approved)
      setRejectedPOs(rejected)
    }
    refreshData()
  }, [activeTab])

  const currentPOs = activeTab === "approval" ? approvedPOs : rejectedPOs

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground tracking-wider">PO MANAGEMENT</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {activeTab === "approval"
              ? "View all approved purchase orders"
              : "View all rejected purchase orders"}
          </p>
        </div>
      </div>

      {/* Tab Selector */}
      <div className="flex gap-1 sm:gap-2 border-b border-border overflow-x-auto scrollbar-hide">
        <button
          onClick={() => setActiveTab("approval")}
          className={`px-3 sm:px-6 py-2 sm:py-3 font-medium text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 transition-colors relative whitespace-nowrap ${
            activeTab === "approval"
              ? "text-accent border-b-2 border-accent"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          Approval PO
          {approvedPOs.length > 0 && (
            <Badge variant="secondary" className="ml-1 sm:ml-2 bg-accent/20 text-accent text-[10px] sm:text-xs px-1.5 sm:px-2">
              {approvedPOs.length}
            </Badge>
          )}
        </button>
        <button
          onClick={() => setActiveTab("reject")}
          className={`px-3 sm:px-6 py-2 sm:py-3 font-medium text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 transition-colors relative whitespace-nowrap ${
            activeTab === "reject"
              ? "text-accent border-b-2 border-accent"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          Reject PO
          {rejectedPOs.length > 0 && (
            <Badge variant="secondary" className="ml-1 sm:ml-2 bg-accent/20 text-accent text-[10px] sm:text-xs px-1.5 sm:px-2">
              {rejectedPOs.length}
            </Badge>
          )}
        </button>
      </div>

      {/* Stats */}
      {currentPOs.length > 0 && <DashboardStats currentPOs={currentPOs} approvedPOs={[]} />}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Left Sidebar - hidden on mobile, shown inline */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="bg-card border-border">
            <CardContent className="p-3 sm:p-4">
              <div className="text-xs sm:text-sm text-muted-foreground mb-2">
                {activeTab === "approval" ? "APPROVED ORDERS" : "REJECTED ORDERS"}
              </div>
              <p className="text-xl sm:text-2xl font-bold text-foreground">{currentPOs.length}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                ৳{currentPOs.reduce((sum, po) => sum + po.totalAmount, 0).toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content - PO List */}
        <div className="lg:col-span-3">
          {isLoading ? (
            <Card className="bg-card border-border">
              <CardContent className="p-6 sm:p-8 text-center">
                <p className="text-xs sm:text-sm text-muted-foreground">Loading...</p>
              </CardContent>
            </Card>
          ) : currentPOs.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="p-6 sm:p-8 text-center">
                {activeTab === "approval" ? (
                  <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground mx-auto mb-3 sm:mb-4" />
                ) : (
                  <XCircle className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground mx-auto mb-3 sm:mb-4" />
                )}
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {activeTab === "approval"
                    ? "No approved purchase orders found"
                    : "No rejected purchase orders found"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <POComparison
              currentPOs={currentPOs}
              approvedPOs={[]}
              onApprove={() => {}}
              onDelete={() => {}}
              hideActions={true}
            />
          )}
        </div>
      </div>
    </div>
  )
}