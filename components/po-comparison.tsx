

// "use client"

// import { useState, useMemo } from "react"
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// import { Badge } from "@/components/ui/badge"
// import { Button } from "@/components/ui/button"
// import { Checkbox } from "@/components/ui/checkbox"
// import { Input } from "@/components/ui/input"
// import { AlertTriangle, CheckCircle, Trash2, Building2, PackageOpen, Filter, RotateCcw } from "lucide-react"
// import type { PurchaseOrder, AnalysisResult } from "@/lib/types"
// import { analyzeOrders } from "@/lib/analysis"
// import { AnalysisDetailPanel } from "./analysis-detail-panel"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// interface POComparisonProps {
//   currentPOs: PurchaseOrder[]
//   approvedPOs: PurchaseOrder[]
//   onApprove?: (poIds: string[]) => void
//   onDelete?: (poIds: string[]) => void
//   isReadOnly?: boolean // For approved PO view - hides approve buttons and issues
//   hideActions?: boolean // NEW: Hide all action buttons and checkboxes
// }

// interface POGroup {
//   id: string
//   supplier: string
//   totalAmount: number
//   pos: PurchaseOrder[]
// }

// export function POComparison({ 
//   currentPOs = [], 
//   approvedPOs = [], 
//   onApprove, 
//   onDelete, 
//   isReadOnly = false,
//   hideActions = false // NEW: Default to false
// }: POComparisonProps) {
//   const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null)
//   const [resolvedIssues, setResolvedIssues] = useState<Set<string>>(new Set())
//   const [selectedBranch, setSelectedBranch] = useState<string>("all")
//   const [selectedPOIds, setSelectedPOIds] = useState<Set<string>>(new Set())

//   // Additional filter states
//   const [searchTerm, setSearchTerm] = useState("")
//   const [filterRequisitionType, setFilterRequisitionType] = useState<string>("all")
//   const [filterDeliveryType, setFilterDeliveryType] = useState<string>("all")

//   const branches = useMemo(() => {
//     if (!Array.isArray(currentPOs)) return []
//     const branchSet = new Set(currentPOs.map((po) => po.branch).filter(Boolean))
//     return Array.from(branchSet).sort()
//   }, [currentPOs])

//   const filteredPOs = useMemo(() => {
//     if (!Array.isArray(currentPOs)) return []

//     return currentPOs.filter((po) => {
//       // Search filter
//       const searchLower = searchTerm.toLowerCase()
//       const matchesSearch =
//         searchTerm === "" ||
//         po.orderNo.toLowerCase().includes(searchLower) ||
//         po.supplier.toLowerCase().includes(searchLower) ||
//         po.item.toLowerCase().includes(searchLower) ||
//         (po.refNo && po.refNo.toLowerCase().includes(searchLower))

//       // Branch filter
//       const matchesBranch = selectedBranch === "all" || po.branch === selectedBranch

//       // Requisition type filter
//       const matchesRequisitionType =
//         filterRequisitionType === "all" || po.requisitionType === filterRequisitionType

//       // Delivery type filter
//       const matchesDeliveryType =
//         filterDeliveryType === "all" || po.deliveryType === filterDeliveryType

//       return matchesSearch && matchesBranch && matchesRequisitionType && matchesDeliveryType
//     })
//   }, [currentPOs, searchTerm, selectedBranch, filterRequisitionType, filterDeliveryType])

//   const groupedPOs = useMemo(() => {
//     const groups = new Map<string, POGroup>()

//     filteredPOs.forEach((po) => {
//       const key = po.supplier

//       if (groups.has(key)) {
//         const group = groups.get(key)!
//         group.pos.push(po)
//         group.totalAmount += po.totalAmount
//       } else {
//         groups.set(key, {
//           id: key,
//           supplier: po.supplier,
//           totalAmount: po.totalAmount,
//           pos: [po],
//         })
//       }
//     })

//     return Array.from(groups.values())
//   }, [filteredPOs])

//   const allIssues = useMemo(() => {
//     if (!Array.isArray(filteredPOs) || !Array.isArray(approvedPOs)) return []
//     return analyzeOrders(filteredPOs, approvedPOs)
//       .filter((issue) => !resolvedIssues.has(issue.poId))
//       .sort((a, b) => {
//         const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
//         return severityOrder[a.severity] - severityOrder[b.severity]
//       })
//   }, [filteredPOs, approvedPOs, resolvedIssues])

//   const poIssuesMap = useMemo(() => {
//     const map = new Map<string, AnalysisResult[]>()
//     allIssues.forEach((issue) => {
//       const existing = map.get(issue.poId) || []
//       map.set(issue.poId, [...existing, issue])
//     })
//     return map
//   }, [allIssues])

//   const handleResolve = (issueId: string) => {
//     setResolvedIssues((prev) => new Set([...prev, issueId]))
//     setSelectedPO(null)
//   }

//   const handleSelectGroup = (group: POGroup, checked: boolean) => {
//     setSelectedPOIds((prev) => {
//       const newSet = new Set(prev)
//       group.pos.forEach((po) => {
//         if (checked) {
//           newSet.add(po.id)
//         } else {
//           newSet.delete(po.id)
//         }
//       })
//       return newSet
//     })
//   }

//   const isGroupSelected = (group: POGroup) => {
//     return group.pos.every((po) => selectedPOIds.has(po.id))
//   }

//   const isGroupPartiallySelected = (group: POGroup) => {
//     const selected = group.pos.filter((po) => selectedPOIds.has(po.id))
//     return selected.length > 0 && selected.length < group.pos.length
//   }

//   const handleSelectAll = (checked: boolean) => {
//     if (checked) {
//       setSelectedPOIds(new Set(filteredPOs.map((po) => po.id)))
//     } else {
//       setSelectedPOIds(new Set())
//     }
//   }

//   const handleApproveSelected = () => {
//     if (onApprove && selectedPOIds.size > 0) {
//       onApprove(Array.from(selectedPOIds))
//       setSelectedPOIds(new Set())
//     }
//   }

//   const handleDeleteSelected = () => {
//     if (onDelete && selectedPOIds.size > 0) {
//       onDelete(Array.from(selectedPOIds))
//       setSelectedPOIds(new Set())
//     }
//   }

//   const handleClearFilters = () => {
//     setSearchTerm("")
//     setSelectedBranch("all")
//     setFilterRequisitionType("all")
//     setFilterDeliveryType("all")
//   }

//   const hasActiveFilters =
//     searchTerm !== "" ||
//     selectedBranch !== "all" ||
//     filterRequisitionType !== "all" ||
//     filterDeliveryType !== "all"

//   const selectedPOIssues = selectedPO ? poIssuesMap.get(selectedPO.id) || [] : []

//   const getSeverityColor = (severity: string) => {
//     switch (severity) {
//       case "critical":
//         return "bg-red-500/20 text-red-500 border-red-500/30"
//       case "high":
//         return "bg-orange-500/20 text-orange-500 border-orange-500/30"
//       case "medium":
//         return "bg-yellow-500/20 text-yellow-500 border-yellow-500/30"
//       default:
//         return "bg-blue-500/20 text-blue-500 border-blue-500/30"
//     }
//   }

//   const getHighestSeverity = (issues: AnalysisResult[]) => {
//     if (issues.length === 0) return null
//     const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
//     return issues.reduce((highest, issue) =>
//       severityOrder[issue.severity] < severityOrder[highest.severity] ? issue : highest,
//     )
//   }

//   const getGroupIssues = (group: POGroup) => {
//     const issues: AnalysisResult[] = []
//     group.pos.forEach((po) => {
//       const poIssues = poIssuesMap.get(po.id) || []
//       issues.push(...poIssues)
//     })
//     return issues
//   }

//   const allSelected = Array.isArray(filteredPOs) && filteredPOs.length > 0 && selectedPOIds.size === filteredPOs.length

//   // Determine if we should show actions (checkboxes, buttons, issues)
//   const showActions = !isReadOnly && !hideActions

//   if (!Array.isArray(currentPOs) || currentPOs.length === 0) {
//     return (
//       <Card className="bg-card border-border">
//         <CardContent className="p-8 text-center">
//           <p className="text-muted-foreground text-sm">Upload a CSV to begin analysis</p>
//         </CardContent>
//       </Card>
//     )
//   }

//   return (
//     <>
//       <Card className="bg-card border-border">
//         <CardHeader>
//           <div className="flex items-center justify-between flex-wrap gap-4">
//             <div className="flex items-center gap-4" data-tour="upload-actions">
//               {showActions && (
//                 <Checkbox checked={allSelected} onCheckedChange={handleSelectAll} className="border-border" />
//               )}
//               <CardTitle className="text-sm font-medium text-muted-foreground tracking-wider">
//                 {isReadOnly || hideActions ? "PURCHASE ORDERS" : "UPLOADED PURCHASE ORDERS"} ({filteredPOs.length})
//                 {showActions && selectedPOIds.size > 0 && <span className="ml-2 text-primary">{selectedPOIds.size} selected</span>}
//               </CardTitle>
//             </div>

//             {/* {branches.length > 0 && (
//               <div className="flex items-center gap-2" data-tour="upload-branch-filter">
//                 <Building2 className="w-4 h-4 text-muted-foreground" />
//                 <Select value={selectedBranch} onValueChange={setSelectedBranch}>
//                   <SelectTrigger className="w-[200px] bg-card border-border text-foreground">
//                     <SelectValue />
//                   </SelectTrigger>
//                   <SelectContent className="bg-card border-border">
//                     <SelectItem value="all" className="text-foreground hover:bg-muted">
//                       All Branches ({currentPOs.length})
//                     </SelectItem>
//                     {branches.map((branch) => {
//                       const branchCount = currentPOs.filter((po) => po.branch === branch).length
//                       return (
//                         <SelectItem key={branch} value={branch} className="text-foreground hover:bg-muted">
//                           {branch} ({branchCount})
//                         </SelectItem>
//                       )
//                     })}
//                   </SelectContent>
//                 </Select>
//               </div>
//             )} */}
//           </div>

//           {showActions && selectedPOIds.size > 0 && (
//             <div className="mt-4 flex gap-2">
//               <Button
//                 onClick={handleApproveSelected}
//                 className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
//               >
//                 <CheckCircle className="w-4 h-4" />
//                 Approve Selected ({selectedPOIds.size})
//               </Button>
//               <Button
//                 onClick={handleDeleteSelected}
//                 variant="outline"
//                 className="border-red-700 text-red-500 hover:bg-red-900/20 bg-transparent flex items-center gap-2"
//               >
//                 <Trash2 className="w-4 h-4" />
//                 Delete Selected ({selectedPOIds.size})
//               </Button>
//             </div>
//           )}

//           {showActions && allIssues.length > 0 && (
//             <div className="mt-4 p-3 bg-primary/10 border border-primary/20 rounded">
//               <div className="flex items-center gap-2">
//                 <AlertTriangle className="w-4 h-4 text-primary" />
//                 <p className="text-sm text-foreground">
//                   {allIssues.length} issue{allIssues.length !== 1 ? "s" : ""} found requiring attention
//                 </p>
//               </div>
//             </div>
//           )}
//         </CardHeader>
//         <CardContent className="space-y-4">
//           {/* Minimal Filter Bar - REDUCED SEARCH WIDTH */}
//           <div className="flex items-center gap-2 px-3 py-2 bg-neutral-800/50 rounded-lg border border-neutral-700/50">
//             <Filter className="w-3.5 h-3.5 text-neutral-500" />

//             {/* Search - REDUCED WIDTH from flex-1 max-w-xs to w-48 */}
//             <Input
//               placeholder="Search PO, supplier..."
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               className="h-7 text-xs w-48 bg-neutral-900 border-neutral-700 text-white placeholder:text-neutral-500"
//             />

//             {/* Branch Filter */}
//             {branches.length > 0 && (
//               <Select value={selectedBranch} onValueChange={setSelectedBranch}>
//                 <SelectTrigger className="h-7 text-xs w-32 bg-neutral-900 border-neutral-700 text-white">
//                   <SelectValue placeholder="All Branches" />
//                 </SelectTrigger>
//                 <SelectContent className="bg-neutral-800 border-neutral-700">
//                   <SelectItem value="all" className="text-xs text-white hover:bg-neutral-700">
//                     All Branches
//                   </SelectItem>
//                   {branches.map((branch) => (
//                     <SelectItem key={branch} value={branch} className="text-xs text-white hover:bg-neutral-700">
//                       {branch}
//                     </SelectItem>
//                   ))}
//                 </SelectContent>
//               </Select>
//             )}

//             {/* Requisition Type Filter */}
//             <Select value={filterRequisitionType} onValueChange={setFilterRequisitionType}>
//               <SelectTrigger className="h-7 text-xs w-28 bg-neutral-900 border-neutral-700 text-white">
//                 <SelectValue placeholder="All Types" />
//               </SelectTrigger>
//               <SelectContent className="bg-neutral-800 border-neutral-700">
//                 <SelectItem value="all" className="text-xs text-white hover:bg-neutral-700">
//                   All Types
//                 </SelectItem>
//                 <SelectItem value="Standard" className="text-xs text-white hover:bg-neutral-700">
//                   Standard
//                 </SelectItem>
//                 <SelectItem value="Urgent" className="text-xs text-white hover:bg-neutral-700">
//                   Urgent
//                 </SelectItem>
//               </SelectContent>
//             </Select>

//             {/* Delivery Type Filter */}
//             <Select value={filterDeliveryType} onValueChange={setFilterDeliveryType}>
//               <SelectTrigger className="h-7 text-xs w-28 bg-neutral-900 border-neutral-700 text-white">
//                 <SelectValue placeholder="Delivery" />
//               </SelectTrigger>
//               <SelectContent className="bg-neutral-800 border-neutral-700">
//                 <SelectItem value="all" className="text-xs text-white hover:bg-neutral-700">
//                   All Delivery
//                 </SelectItem>
//                 <SelectItem value="Standard" className="text-xs text-white hover:bg-neutral-700">
//                   Standard
//                 </SelectItem>
//                 <SelectItem value="Express" className="text-xs text-white hover:bg-neutral-700">
//                   Express
//                 </SelectItem>
//               </SelectContent>
//             </Select>

//             {/* Clear Filters */}
//             {hasActiveFilters && (
//               <Button
//                 variant="ghost"
//                 size="sm"
//                 onClick={handleClearFilters}
//                 className="h-7 text-xs px-2 text-neutral-400 hover:text-white"
//               >
//                 <RotateCcw className="w-3 h-3 mr-1" />
//                 Clear
//               </Button>
//             )}
//           </div>

//           {/* PO List */}
//           <div className="space-y-3 max-h-[600px] overflow-y-auto" data-tour="upload-po-list">
//             {groupedPOs.map((group) => {
//               const groupIssues = getGroupIssues(group)
//               const highestIssue = getHighestSeverity(groupIssues)
//               const isSelected = isGroupSelected(group)
//               const isPartiallySelected = isGroupPartiallySelected(group)
//               const isMultiItem = group.pos.length > 1

//               return (
//                 <div
//                   key={group.id}
//                   className={`border rounded p-4 transition-all ${
//                     showActions && highestIssue
//                       ? `${getSeverityColor(highestIssue.severity)} border-l-4 hover:bg-opacity-30`
//                       : "border-border hover:border-muted hover:bg-muted/50"
//                   } ${isSelected ? "ring-2 ring-primary/50" : ""}`}
//                 >
//                   <div className="flex items-start gap-4">
//                     {/* ENHANCED CHECKBOX with better styling */}
//                     {showActions && (
//                       <div className="mt-1 p-1.5 rounded-md bg-accent/10 border border-accent/20 hover:bg-accent/20 transition-colors">
//                         <Checkbox
//                           checked={isSelected}
//                           ref={(el) => {
//                             if (el && isPartiallySelected) {
//                               const inputEl = el.querySelector('input[type="checkbox"]') as HTMLInputElement
//                               if (inputEl) {
//                                 inputEl.indeterminate = true
//                               }
//                             }
//                           }}
//                           onCheckedChange={(checked) => handleSelectGroup(group, checked as boolean)}
//                           className="border-accent data-[state=checked]:bg-accent data-[state=checked]:border-accent"
//                           onClick={(e) => e.stopPropagation()}
//                         />
//                       </div>
//                     )}

//                     <div className="flex-1 min-w-0">
//                       <div className="flex items-center gap-2 flex-wrap mb-3">
//                         <span className="text-sm font-semibold text-foreground">{group.supplier}</span>
//                         <Badge variant="outline" className="text-xs border-primary/30 text-primary">
//                           ৳{group.totalAmount.toLocaleString()}
//                         </Badge>
//                         {isMultiItem && (
//                           <Badge
//                             variant="outline"
//                             className="text-xs border-blue-500/30 text-blue-400 flex items-center gap-1"
//                           >
//                             <PackageOpen className="w-3 h-3" />
//                             {group.pos.length} Items Grouped
//                           </Badge>
//                         )}
//                         {showActions && groupIssues.length > 0 && (
//                           <Badge className={getSeverityColor(highestIssue!.severity)}>
//                             {groupIssues.length} ISSUE{groupIssues.length !== 1 ? "S" : ""}
//                           </Badge>
//                         )}
//                         {(isReadOnly || hideActions) && (
//                           <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
//                             APPROVED
//                           </Badge>
//                         )}
//                       </div>

//                       <div className="space-y-3">
//                         {group.pos.map((po, idx) => {
//                           const poIssues = poIssuesMap.get(po.id) || []

//                           return (
//                             <div
//                               key={po.id}
//                               className={`${idx > 0 ? "pt-3 border-t border-border/50" : ""} cursor-pointer hover:bg-muted/30 p-2 rounded transition-colors`}
//                               onClick={() => setSelectedPO(po)}
//                             >
//                               {/* HEADER: PO Number (LEFT) + Date (RIGHT) */}
//                               <div className="flex items-start justify-between gap-4 mb-3">
//                                 {/* LEFT: HIGHLIGHTED PO NUMBER with enhanced styling */}
//                                 <div className="flex items-center gap-2">
//                                   <div className="px-3 py-1.5 bg-accent/20 border-2 border-accent/40 rounded-md">
//                                     <span className="text-sm font-bold text-accent font-mono tracking-wide">
//                                       {po.orderNo}
//                                     </span>
//                                   </div>
//                                   {po.branch && (
//                                     <Badge variant="outline" className="text-xs border-border text-muted-foreground">
//                                       {po.branch}
//                                     </Badge>
//                                   )}
//                                 </div>

//                                 {/* RIGHT: DATE ONLY in top right corner */}
//                                 <div className="text-right">
//                                   <div className="flex items-center justify-end gap-2">
//                                     <span className="text-xs text-muted-foreground">Date:</span>
//                                     <span className="text-xs font-semibold text-foreground">{po.date}</span>
//                                   </div>
//                                 </div>
//                               </div>

//                               {/* DETAILS GRID: Item, Quantity and Rate */}
//                               <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
//                                 <div>
//                                   <p className="text-muted-foreground">Item</p>
//                                   <p className="text-foreground truncate">{po.item}</p>
//                                 </div>
//                                 <div>
//                                   <p className="text-muted-foreground">Quantity</p>
//                                   <p className="text-foreground font-medium">
//                                     {po.maxQty} {po.unit}
//                                   </p>
//                                 </div>
//                                 <div>
//                                   <p className="text-muted-foreground">Rate</p>
//                                   <p className="text-foreground font-mono font-semibold">৳{po.rate.toLocaleString()}</p>
//                                 </div>
//                               </div>

//                               {showActions && poIssues.length > 0 && (
//                                 <div className="mt-2 pt-2 border-t border-border/30">
//                                   <div className="flex items-start gap-2">
//                                     <AlertTriangle className="w-3 h-3 text-primary mt-0.5 flex-shrink-0" />
//                                     <div className="flex-1">
//                                       <ul className="space-y-1">
//                                         {poIssues.map((issue, issueIdx) => (
//                                           <li key={issueIdx} className="text-xs text-foreground">
//                                             • {issue.message}
//                                           </li>
//                                         ))}
//                                       </ul>
//                                     </div>
//                                   </div>
//                                 </div>
//                               )}
//                             </div>
//                           )
//                         })}
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               )
//             })}
//           </div>
//         </CardContent>
//       </Card>

//       {selectedPO && showActions && (
//         <>
//           <div
//             className="fixed inset-0 bg-black/50 z-40 animate-in fade-in duration-300"
//             onClick={() => setSelectedPO(null)}
//           />
//           <AnalysisDetailPanel
//             po={selectedPO}
//             issues={selectedPOIssues}
//             onClose={() => setSelectedPO(null)}
//             onResolve={handleResolve}
//           />
//         </>
//       )}
//     </>
//   )
// }





"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { AlertTriangle, CheckCircle, Trash2, Building2, PackageOpen, Filter, RotateCcw, Search, X } from "lucide-react"
import type { PurchaseOrder, AnalysisResult } from "@/lib/types"
import { analyzeOrders } from "@/lib/analysis"
import { AnalysisDetailPanel } from "./analysis-detail-panel"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface POComparisonProps {
  currentPOs: PurchaseOrder[]
  approvedPOs: PurchaseOrder[]
  onApprove?: (poIds: string[]) => void
  onDelete?: (poIds: string[]) => void
  isReadOnly?: boolean
  hideActions?: boolean
}

interface POGroup {
  id: string
  supplier: string
  totalAmount: number
  pos: PurchaseOrder[]
}

export function POComparison({ 
  currentPOs = [], 
  approvedPOs = [], 
  onApprove, 
  onDelete, 
  isReadOnly = false,
  hideActions = false
}: POComparisonProps) {
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null)
  const [resolvedIssues, setResolvedIssues] = useState<Set<string>>(new Set())
  const [selectedBranch, setSelectedBranch] = useState<string>("all")
  const [selectedPOIds, setSelectedPOIds] = useState<Set<string>>(new Set())

  const [searchTerm, setSearchTerm] = useState("")
  const [filterRequisitionType, setFilterRequisitionType] = useState<string>("all")
  const [filterDeliveryType, setFilterDeliveryType] = useState<string>("all")

  const branches = useMemo(() => {
    if (!Array.isArray(currentPOs)) return []
    const branchSet = new Set(currentPOs.map((po) => po.branch).filter(Boolean))
    return Array.from(branchSet).sort()
  }, [currentPOs])

  const filteredPOs = useMemo(() => {
    if (!Array.isArray(currentPOs)) return []
    return currentPOs.filter((po) => {
      const searchLower = searchTerm.toLowerCase()
      const matchesSearch =
        searchTerm === "" ||
        po.orderNo.toLowerCase().includes(searchLower) ||
        po.supplier.toLowerCase().includes(searchLower) ||
        po.item.toLowerCase().includes(searchLower) ||
        (po.refNo && po.refNo.toLowerCase().includes(searchLower))
      const matchesBranch = selectedBranch === "all" || po.branch === selectedBranch
      const matchesRequisitionType = filterRequisitionType === "all" || po.requisitionType === filterRequisitionType
      const matchesDeliveryType = filterDeliveryType === "all" || po.deliveryType === filterDeliveryType
      return matchesSearch && matchesBranch && matchesRequisitionType && matchesDeliveryType
    })
  }, [currentPOs, searchTerm, selectedBranch, filterRequisitionType, filterDeliveryType])

  const groupedPOs = useMemo(() => {
    const groups = new Map<string, POGroup>()
    filteredPOs.forEach((po) => {
      const key = po.supplier
      if (groups.has(key)) {
        const group = groups.get(key)!
        group.pos.push(po)
        group.totalAmount += po.totalAmount
      } else {
        groups.set(key, { id: key, supplier: po.supplier, totalAmount: po.totalAmount, pos: [po] })
      }
    })
    return Array.from(groups.values())
  }, [filteredPOs])

  const allIssues = useMemo(() => {
    if (!Array.isArray(filteredPOs) || !Array.isArray(approvedPOs)) return []
    return analyzeOrders(filteredPOs, approvedPOs)
      .filter((issue) => !resolvedIssues.has(issue.poId))
      .sort((a, b) => {
        const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
        return severityOrder[a.severity] - severityOrder[b.severity]
      })
  }, [filteredPOs, approvedPOs, resolvedIssues])

  const poIssuesMap = useMemo(() => {
    const map = new Map<string, AnalysisResult[]>()
    allIssues.forEach((issue) => {
      const existing = map.get(issue.poId) || []
      map.set(issue.poId, [...existing, issue])
    })
    return map
  }, [allIssues])

  const handleResolve = (issueId: string) => {
    setResolvedIssues((prev) => new Set([...prev, issueId]))
    setSelectedPO(null)
  }

  const handleSelectGroup = (group: POGroup, checked: boolean) => {
    setSelectedPOIds((prev) => {
      const newSet = new Set(prev)
      group.pos.forEach((po) => {
        if (checked) newSet.add(po.id)
        else newSet.delete(po.id)
      })
      return newSet
    })
  }

  const isGroupSelected = (group: POGroup) => group.pos.every((po) => selectedPOIds.has(po.id))

  const isGroupPartiallySelected = (group: POGroup) => {
    const selected = group.pos.filter((po) => selectedPOIds.has(po.id))
    return selected.length > 0 && selected.length < group.pos.length
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) setSelectedPOIds(new Set(filteredPOs.map((po) => po.id)))
    else setSelectedPOIds(new Set())
  }

  const handleApproveSelected = () => {
    if (onApprove && selectedPOIds.size > 0) {
      onApprove(Array.from(selectedPOIds))
      setSelectedPOIds(new Set())
    }
  }

  const handleDeleteSelected = () => {
    if (onDelete && selectedPOIds.size > 0) {
      onDelete(Array.from(selectedPOIds))
      setSelectedPOIds(new Set())
    }
  }

  const handleClearFilters = () => {
    setSearchTerm("")
    setSelectedBranch("all")
    setFilterRequisitionType("all")
    setFilterDeliveryType("all")
  }

  const hasActiveFilters = searchTerm !== "" || selectedBranch !== "all" || filterRequisitionType !== "all" || filterDeliveryType !== "all"

  const selectedPOIssues = selectedPO ? poIssuesMap.get(selectedPO.id) || [] : []

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "bg-red-500/20 text-red-500 border-red-500/30"
      case "high": return "bg-orange-500/20 text-orange-500 border-orange-500/30"
      case "medium": return "bg-yellow-500/20 text-yellow-500 border-yellow-500/30"
      default: return "bg-blue-500/20 text-blue-500 border-blue-500/30"
    }
  }

  const getHighestSeverity = (issues: AnalysisResult[]) => {
    if (issues.length === 0) return null
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
    return issues.reduce((highest, issue) =>
      severityOrder[issue.severity] < severityOrder[highest.severity] ? issue : highest,
    )
  }

  const getGroupIssues = (group: POGroup) => {
    const issues: AnalysisResult[] = []
    group.pos.forEach((po) => {
      const poIssues = poIssuesMap.get(po.id) || []
      issues.push(...poIssues)
    })
    return issues
  }

  const allSelected = Array.isArray(filteredPOs) && filteredPOs.length > 0 && selectedPOIds.size === filteredPOs.length
  const showActions = !isReadOnly && !hideActions

  if (!Array.isArray(currentPOs) || currentPOs.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-6 sm:p-8 text-center">
          <p className="text-muted-foreground text-xs sm:text-sm">Upload a CSV to begin analysis</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="bg-card border-border">
        <CardHeader className="p-3 sm:p-4 md:p-6">
          <div className="flex items-center justify-between flex-wrap gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-4" data-tour="upload-actions">
              {showActions && (
                <Checkbox checked={allSelected} onCheckedChange={handleSelectAll} className="border-border" />
              )}
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground tracking-wider">
                {isReadOnly || hideActions ? "PURCHASE ORDERS" : "UPLOADED PURCHASE ORDERS"} ({filteredPOs.length})
                {showActions && selectedPOIds.size > 0 && (
                  <span className="ml-2 text-primary">{selectedPOIds.size} selected</span>
                )}
              </CardTitle>
            </div>
          </div>

          {/* Desktop action buttons */}
          {showActions && selectedPOIds.size > 0 && (
            <div className="mt-3 sm:mt-4 hidden md:flex gap-2">
              <Button
                onClick={handleApproveSelected}
                className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Approve Selected ({selectedPOIds.size})
              </Button>
              <Button
                onClick={handleDeleteSelected}
                variant="outline"
                className="border-red-700 text-red-500 hover:bg-red-900/20 bg-transparent flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Reject Selected ({selectedPOIds.size})
              </Button>
            </div>
          )}

          {showActions && allIssues.length > 0 && (
            <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-primary/10 border border-primary/20 rounded">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary shrink-0" />
                <p className="text-xs sm:text-sm text-foreground">
                  {allIssues.length} issue{allIssues.length !== 1 ? "s" : ""} found
                </p>
              </div>
            </div>
          )}
        </CardHeader>

        <CardContent className="p-3 sm:p-4 md:p-6 pt-0 space-y-3 sm:space-y-4">
          {/* Filter Bar - scrollable on mobile */}
          <div className="space-y-2 md:space-y-0 md:flex md:items-center md:gap-2 px-2 sm:px-3 py-2 bg-neutral-800/50 rounded-lg border border-neutral-700/50">
            {/* Search - full width on mobile */}
            <div className="relative w-full md:w-48">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-neutral-500" />
              <Input
                placeholder="Search PO, supplier..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-8 md:h-7 text-xs pl-7 w-full bg-neutral-900 border-neutral-700 text-white placeholder:text-neutral-500"
              />
            </div>

            {/* Filter pills - scrollable row on mobile */}
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 md:pb-0">
              <Filter className="w-3.5 h-3.5 text-neutral-500 shrink-0 mt-1.5 hidden md:block" />

              {branches.length > 0 && (
                <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                  <SelectTrigger className="h-8 md:h-7 text-xs w-[120px] sm:w-32 bg-neutral-900 border-neutral-700 text-white shrink-0">
                    <SelectValue placeholder="Branch" />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-800 border-neutral-700">
                    <SelectItem value="all" className="text-xs text-white hover:bg-neutral-700">All Branches</SelectItem>
                    {branches.map((branch) => (
                      <SelectItem key={branch} value={branch} className="text-xs text-white hover:bg-neutral-700">{branch}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <Select value={filterRequisitionType} onValueChange={setFilterRequisitionType}>
                <SelectTrigger className="h-8 md:h-7 text-xs w-[100px] sm:w-28 bg-neutral-900 border-neutral-700 text-white shrink-0">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent className="bg-neutral-800 border-neutral-700">
                  <SelectItem value="all" className="text-xs text-white hover:bg-neutral-700">All Types</SelectItem>
                  <SelectItem value="Standard" className="text-xs text-white hover:bg-neutral-700">Standard</SelectItem>
                  <SelectItem value="Urgent" className="text-xs text-white hover:bg-neutral-700">Urgent</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterDeliveryType} onValueChange={setFilterDeliveryType}>
                <SelectTrigger className="h-8 md:h-7 text-xs w-[100px] sm:w-28 bg-neutral-900 border-neutral-700 text-white shrink-0">
                  <SelectValue placeholder="Delivery" />
                </SelectTrigger>
                <SelectContent className="bg-neutral-800 border-neutral-700">
                  <SelectItem value="all" className="text-xs text-white hover:bg-neutral-700">All Delivery</SelectItem>
                  <SelectItem value="Standard" className="text-xs text-white hover:bg-neutral-700">Standard</SelectItem>
                  <SelectItem value="Express" className="text-xs text-white hover:bg-neutral-700">Express</SelectItem>
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFilters}
                  className="h-8 md:h-7 text-xs px-2 text-neutral-400 hover:text-white shrink-0"
                >
                  <RotateCcw className="w-3 h-3 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* PO List */}
          <div className="space-y-2 sm:space-y-3 max-h-[600px] overflow-y-auto" data-tour="upload-po-list">
            {groupedPOs.map((group) => {
              const groupIssues = getGroupIssues(group)
              const highestIssue = getHighestSeverity(groupIssues)
              const isSelected = isGroupSelected(group)
              const isPartiallySelected = isGroupPartiallySelected(group)
              const isMultiItem = group.pos.length > 1

              return (
                <div
                  key={group.id}
                  className={`border rounded p-3 sm:p-4 transition-all ${
                    showActions && highestIssue
                      ? `${getSeverityColor(highestIssue.severity)} border-l-4 hover:bg-opacity-30`
                      : "border-border hover:border-muted hover:bg-muted/50"
                  } ${isSelected ? "ring-2 ring-primary/50" : ""}`}
                >
                  <div className="flex items-start gap-2 sm:gap-4">
                    {showActions && (
                      <div className="mt-1 p-1 sm:p-1.5 rounded-md bg-accent/10 border border-accent/20 hover:bg-accent/20 transition-colors shrink-0">
                        <Checkbox
                          checked={isSelected}
                          ref={(el) => {
                            if (el && isPartiallySelected) {
                              const inputEl = el.querySelector('input[type="checkbox"]') as HTMLInputElement
                              if (inputEl) inputEl.indeterminate = true
                            }
                          }}
                          onCheckedChange={(checked) => handleSelectGroup(group, checked as boolean)}
                          className="border-accent data-[state=checked]:bg-accent data-[state=checked]:border-accent"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      {/* Group Header */}
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap mb-2 sm:mb-3">
                        <span className="text-xs sm:text-sm font-semibold text-foreground">{group.supplier}</span>
                        <Badge variant="outline" className="text-[10px] sm:text-xs border-primary/30 text-primary">
                          ৳{group.totalAmount.toLocaleString()}
                        </Badge>
                        {isMultiItem && (
                          <Badge variant="outline" className="text-[10px] sm:text-xs border-blue-500/30 text-blue-400 flex items-center gap-0.5">
                            <PackageOpen className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                            {group.pos.length} Items
                          </Badge>
                        )}
                        {showActions && groupIssues.length > 0 && (
                          <Badge className={`text-[10px] sm:text-xs ${getSeverityColor(highestIssue!.severity)}`}>
                            {groupIssues.length} ISSUE{groupIssues.length !== 1 ? "S" : ""}
                          </Badge>
                        )}
                        {(isReadOnly || hideActions) && (
                          <Badge className="text-[10px] sm:text-xs bg-green-500/20 text-green-500 border-green-500/30">APPROVED</Badge>
                        )}
                      </div>

                      {/* Individual POs */}
                      <div className="space-y-2 sm:space-y-3">
                        {group.pos.map((po, idx) => {
                          const poIssues = poIssuesMap.get(po.id) || []

                          return (
                            <div
                              key={po.id}
                              className={`${idx > 0 ? "pt-2 sm:pt-3 border-t border-border/50" : ""} cursor-pointer hover:bg-muted/30 p-1.5 sm:p-2 rounded transition-colors`}
                              onClick={() => setSelectedPO(po)}
                            >
                              {/* PO Header */}
                              <div className="flex items-start justify-between gap-2 mb-2 sm:mb-3">
                                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                                  <div className="px-2 sm:px-3 py-1 sm:py-1.5 bg-accent/20 border border-accent/40 sm:border-2 rounded-md">
                                    <span className="text-[11px] sm:text-sm font-bold text-accent font-mono tracking-wide">
                                      {po.orderNo}
                                    </span>
                                  </div>
                                  {po.branch && (
                                    <Badge variant="outline" className="text-[10px] sm:text-xs border-border text-muted-foreground">
                                      {po.branch}
                                    </Badge>
                                  )}
                                  {po.requisitionType === "Urgent" && (
                                    <Badge variant="outline" className="text-[10px] bg-red-500/10 text-red-500 border-red-500/20 md:hidden">
                                      Urgent
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-right shrink-0">
                                  <span className="text-[10px] sm:text-xs text-muted-foreground">{po.date}</span>
                                </div>
                              </div>

                              {/* Details Grid - 2 cols on mobile, 3 on desktop */}
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 text-xs">
                                <div className="col-span-2 sm:col-span-1">
                                  <p className="text-[10px] sm:text-xs text-muted-foreground">Item</p>
                                  <p className="text-xs sm:text-sm text-foreground truncate">{po.item}</p>
                                </div>
                                <div>
                                  <p className="text-[10px] sm:text-xs text-muted-foreground">Quantity</p>
                                  <p className="text-xs sm:text-sm text-foreground font-medium">
                                    {po.maxQty} {po.unit}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-[10px] sm:text-xs text-muted-foreground">Rate</p>
                                  <p className="text-xs sm:text-sm text-foreground font-mono font-semibold">৳{po.rate.toLocaleString()}</p>
                                </div>
                              </div>

                              {/* Mobile: Total amount prominently */}
                              <div className="mt-2 flex items-center justify-between sm:hidden">
                                <span className="text-[10px] text-muted-foreground uppercase">Total</span>
                                <span className="text-sm font-bold text-accent font-mono">৳{po.totalAmount.toLocaleString()}</span>
                              </div>

                              {showActions && poIssues.length > 0 && (
                                <div className="mt-2 pt-2 border-t border-border/30">
                                  <div className="flex items-start gap-1.5 sm:gap-2">
                                    <AlertTriangle className="w-3 h-3 text-primary mt-0.5 shrink-0" />
                                    <ul className="space-y-0.5 sm:space-y-1 flex-1">
                                      {poIssues.map((issue, issueIdx) => (
                                        <li key={issueIdx} className="text-[10px] sm:text-xs text-foreground">
                                          • {issue.message}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Mobile Sticky Bottom Action Bar */}
      {showActions && selectedPOIds.size > 0 && (
        <div className="md:hidden fixed bottom-16 left-0 right-0 z-40 bg-card/95 backdrop-blur-xl border-t border-border px-3 py-3 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
          <div className="flex items-center justify-between gap-2">
            <Button
              onClick={handleDeleteSelected}
              variant="outline"
              size="sm"
              className="flex-1 border-red-700 text-red-500 hover:bg-red-900/20 bg-transparent text-xs h-10"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Reject
            </Button>
            <Button
              onClick={handleApproveSelected}
              size="sm"
              className="flex-[2] bg-green-600 hover:bg-green-700 text-white text-xs h-10 font-bold"
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              Approve ({selectedPOIds.size})
            </Button>
          </div>
        </div>
      )}

      {selectedPO && showActions && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 animate-in fade-in duration-300"
            onClick={() => setSelectedPO(null)}
          />
          <AnalysisDetailPanel
            po={selectedPO}
            issues={selectedPOIssues}
            onClose={() => setSelectedPO(null)}
            onResolve={handleResolve}
          />
        </>
      )}
    </>
  )
}