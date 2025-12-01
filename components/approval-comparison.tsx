"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Trash2,
  Building2,
  Filter,
  RotateCcw,
  TrendingUp,
  TrendingDown,
  Database as DatabaseIcon,
  PackageOpen,
} from "lucide-react"
import type { PoloxyApprovalRequest, PoloxyDatabase } from "@/lib/poloxy-types"
import type { PurchaseOrder, AnalysisResult } from "@/lib/types"
import { analyzeOrders } from "@/lib/analysis"
import { AnalysisDetailPanel } from "./analysis-detail-panel"

interface ApprovalComparisonProps {
  approvals: PoloxyApprovalRequest[]
  databases: PoloxyDatabase[]
  approvedPOs: PurchaseOrder[]
  onApprove?: (ids: string[]) => void
  onReject?: (ids: string[]) => void
  onDelete?: (ids: string[]) => void
}

interface ApprovalGroup {
  id: string
  supplier: string
  totalAmount: number
  approvals: PoloxyApprovalRequest[]
}

export function ApprovalComparison({
  approvals = [],
  databases = [],
  approvedPOs = [],
  onApprove,
  onReject,
  onDelete,
}: ApprovalComparisonProps) {
  const [selectedApproval, setSelectedApproval] = useState<PoloxyApprovalRequest | null>(null)
  const [resolvedIssues, setResolvedIssues] = useState<Set<string>>(new Set())
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Filter states
  const [searchTerm, setSearchTerm] = useState("")
  const [filterDatabase, setFilterDatabase] = useState<string>("all")
  const [filterBranch, setFilterBranch] = useState<string>("all")
  const [filterRequisitionType, setFilterRequisitionType] = useState<string>("all")
  const [filterDeliveryType, setFilterDeliveryType] = useState<string>("all")

  // Get unique branches
  const branches = useMemo(() => {
    if (!Array.isArray(approvals)) return []
    const branchSet = new Set(approvals.map((a) => a.branch).filter(Boolean))
    return Array.from(branchSet).sort()
  }, [approvals])

  // Apply filters
  const filteredApprovals = useMemo(() => {
    return approvals.filter((approval) => {
      // Search filter
      const searchLower = searchTerm.toLowerCase()
      const matchesSearch =
        searchTerm === "" ||
        approval.orderNo.toLowerCase().includes(searchLower) ||
        approval.supplier.toLowerCase().includes(searchLower) ||
        approval.item.toLowerCase().includes(searchLower) ||
        approval.databaseName.toLowerCase().includes(searchLower) ||
        approval.refNo.toLowerCase().includes(searchLower)

      // Database filter
      const matchesDatabase = filterDatabase === "all" || approval.databaseId === filterDatabase

      // Branch filter
      const matchesBranch = filterBranch === "all" || approval.branch === filterBranch

      // Requisition type filter
      const matchesRequisitionType =
        filterRequisitionType === "all" || approval.requisitionType === filterRequisitionType

      // Delivery type filter
      const matchesDeliveryType =
        filterDeliveryType === "all" || approval.deliveryType === filterDeliveryType

      return (
        matchesSearch &&
        matchesDatabase &&
        matchesBranch &&
        matchesRequisitionType &&
        matchesDeliveryType
      )
    })
  }, [approvals, searchTerm, filterDatabase, filterBranch, filterRequisitionType, filterDeliveryType])

  // Group approvals by supplier only
  const groupedApprovals = useMemo(() => {
    const groups = new Map<string, ApprovalGroup>()

    filteredApprovals.forEach((approval) => {
      const key = approval.supplier

      if (groups.has(key)) {
        const group = groups.get(key)!
        group.approvals.push(approval)
        group.totalAmount += approval.totalAmount
      } else {
        groups.set(key, {
          id: key,
          supplier: approval.supplier,
          totalAmount: approval.totalAmount,
          approvals: [approval],
        })
      }
    })

    return Array.from(groups.values())
  }, [filteredApprovals])

  // Convert approvals to PO format for analysis
  const approvalsAsPOs = useMemo(() => {
    return filteredApprovals.map((approval) => ({
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
      status: "pending" as const,
      deliveryType: approval.deliveryType,
      openPO: approval.openPO,
      openPONo: approval.openPONo,
      uploadedAt: new Date().toISOString(),
      isApproved: false,
    }))
  }, [filteredApprovals])

  // Analyze approvals for issues
  const allIssues = useMemo(() => {
    if (!Array.isArray(approvalsAsPOs) || !Array.isArray(approvedPOs)) return []
    return analyzeOrders(approvalsAsPOs, approvedPOs)
      .filter((issue) => !resolvedIssues.has(issue.poId))
      .sort((a, b) => {
        const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
        return severityOrder[a.severity] - severityOrder[b.severity]
      })
  }, [approvalsAsPOs, approvedPOs, resolvedIssues])

  const issuesMap = useMemo(() => {
    const map = new Map<string, AnalysisResult[]>()
    allIssues.forEach((issue) => {
      const existing = map.get(issue.poId) || []
      map.set(issue.poId, [...existing, issue])
    })
    return map
  }, [allIssues])

  const handleClearFilters = () => {
    setSearchTerm("")
    setFilterDatabase("all")
    setFilterBranch("all")
    setFilterRequisitionType("all")
    setFilterDeliveryType("all")
  }

  const hasActiveFilters =
    searchTerm !== "" ||
    filterDatabase !== "all" ||
    filterBranch !== "all" ||
    filterRequisitionType !== "all" ||
    filterDeliveryType !== "all"

  const handleSelectGroup = (group: ApprovalGroup, checked: boolean) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev)
      group.approvals.forEach((approval) => {
        if (checked) {
          newSet.add(approval.id)
        } else {
          newSet.delete(approval.id)
        }
      })
      return newSet
    })
  }

  const isGroupSelected = (group: ApprovalGroup) => {
    return group.approvals.every((a) => selectedIds.has(a.id))
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredApprovals.map((a) => a.id)))
    } else {
      setSelectedIds(new Set())
    }
  }

  const handleApproveSelected = () => {
    if (onApprove && selectedIds.size > 0) {
      onApprove(Array.from(selectedIds))
      setSelectedIds(new Set())
    }
  }

  const handleRejectSelected = () => {
    if (onReject && selectedIds.size > 0) {
      onReject(Array.from(selectedIds))
      setSelectedIds(new Set())
    }
  }

  const handleDeleteSelected = () => {
    if (onDelete && selectedIds.size > 0) {
      onDelete(Array.from(selectedIds))
      setSelectedIds(new Set())
    }
  }

  const handleResolve = (issueId: string) => {
    setResolvedIssues((prev) => new Set([...prev, issueId]))
    setSelectedApproval(null)
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-500/20 text-red-500 border-red-500/30"
      case "high":
        return "bg-orange-500/20 text-orange-500 border-orange-500/30"
      case "medium":
        return "bg-yellow-500/20 text-yellow-500 border-yellow-500/30"
      default:
        return "bg-blue-500/20 text-blue-500 border-blue-500/30"
    }
  }

  const getHighestSeverity = (issues: AnalysisResult[]) => {
    if (issues.length === 0) return null
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
    return issues.reduce((highest, issue) =>
      severityOrder[issue.severity] < severityOrder[highest.severity] ? issue : highest,
    )
  }

  const getGroupIssues = (group: ApprovalGroup) => {
    const issues: AnalysisResult[] = []
    group.approvals.forEach((approval) => {
      const approvalIssues = issuesMap.get(approval.id) || []
      issues.push(...approvalIssues)
    })
    return issues
  }

  const getRateComparison = (current: number, last: number) => {
    if (!last || current === last) return null
    const diff = ((current - last) / last) * 100
    return {
      percentage: Math.abs(diff).toFixed(1),
      isIncrease: diff > 0,
    }
  }

  const selectedApprovalIssues = selectedApproval ? issuesMap.get(selectedApproval.id) || [] : []
  const selectedApprovalAsPO = selectedApproval
    ? approvalsAsPOs.find((po) => po.id === selectedApproval.id)
    : null

  const allSelected =
    Array.isArray(filteredApprovals) && filteredApprovals.length > 0 && selectedIds.size === filteredApprovals.length

  if (!Array.isArray(approvals) || approvals.length === 0) {
    return (
      <Card className="bg-neutral-900 border-neutral-700">
        <CardContent className="p-8 text-center">
          <p className="text-neutral-400 text-sm">No pending approvals. Sync databases to fetch requests.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="bg-neutral-900 border-neutral-700">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <Checkbox checked={allSelected} onCheckedChange={handleSelectAll} className="border-neutral-600" />
              <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">
                PENDING APPROVALS ({filteredApprovals.length} of {approvals.length})
                {selectedIds.size > 0 && <span className="ml-2 text-orange-500">{selectedIds.size} selected</span>}
              </CardTitle>
            </div>
          </div>

          {selectedIds.size > 0 && (
            <div className="mt-4 flex gap-2">
              <Button
                onClick={handleApproveSelected}
                className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Approve Selected ({selectedIds.size})
              </Button>
              <Button
                onClick={handleRejectSelected}
                variant="outline"
                className="border-orange-700 text-orange-500 hover:bg-orange-900/20 bg-transparent flex items-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                Reject Selected ({selectedIds.size})
              </Button>
              <Button
                onClick={handleDeleteSelected}
                variant="outline"
                className="border-red-700 text-red-500 hover:bg-red-900/20 bg-transparent flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete Selected ({selectedIds.size})
              </Button>
            </div>
          )}

          {allIssues.length > 0 && (
            <div className="mt-4 p-3 bg-orange-500/10 border border-orange-500/20 rounded">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                <p className="text-sm text-orange-300">
                  {allIssues.length} issue{allIssues.length !== 1 ? "s" : ""} found requiring attention
                </p>
              </div>
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Minimal Filter Bar */}
          <div className="flex items-center gap-2 px-3 py-2 bg-neutral-800/50 rounded-lg border border-neutral-700/50">
            <Filter className="w-3.5 h-3.5 text-neutral-500" />

            {/* Search */}
            <Input
              placeholder="Search orders, suppliers, items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-7 text-xs flex-1 max-w-xs bg-neutral-900 border-neutral-700 text-white placeholder:text-neutral-500"
            />

            {/* Database Filter */}
            <Select value={filterDatabase} onValueChange={setFilterDatabase}>
              <SelectTrigger className="h-7 text-xs w-36 bg-neutral-900 border-neutral-700 text-white">
                <SelectValue placeholder="All Databases" />
              </SelectTrigger>
              <SelectContent className="bg-neutral-800 border-neutral-700">
                <SelectItem value="all" className="text-xs text-white hover:bg-neutral-700">
                  All Databases
                </SelectItem>
                {databases.map((db) => (
                  <SelectItem key={db.id} value={db.id} className="text-xs text-white hover:bg-neutral-700">
                    {db.code} - {db.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Branch Filter */}
            {branches.length > 0 && (
              <Select value={filterBranch} onValueChange={setFilterBranch}>
                <SelectTrigger className="h-7 text-xs w-32 bg-neutral-900 border-neutral-700 text-white">
                  <SelectValue placeholder="All Branches" />
                </SelectTrigger>
                <SelectContent className="bg-neutral-800 border-neutral-700">
                  <SelectItem value="all" className="text-xs text-white hover:bg-neutral-700">
                    All Branches
                  </SelectItem>
                  {branches.map((branch) => (
                    <SelectItem key={branch} value={branch} className="text-xs text-white hover:bg-neutral-700">
                      {branch}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Requisition Type Filter */}
            <Select value={filterRequisitionType} onValueChange={setFilterRequisitionType}>
              <SelectTrigger className="h-7 text-xs w-28 bg-neutral-900 border-neutral-700 text-white">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent className="bg-neutral-800 border-neutral-700">
                <SelectItem value="all" className="text-xs text-white hover:bg-neutral-700">
                  All Types
                </SelectItem>
                <SelectItem value="Standard" className="text-xs text-white hover:bg-neutral-700">
                  Standard
                </SelectItem>
                <SelectItem value="Urgent" className="text-xs text-white hover:bg-neutral-700">
                  Urgent
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Delivery Type Filter */}
            <Select value={filterDeliveryType} onValueChange={setFilterDeliveryType}>
              <SelectTrigger className="h-7 text-xs w-28 bg-neutral-900 border-neutral-700 text-white">
                <SelectValue placeholder="Delivery" />
              </SelectTrigger>
              <SelectContent className="bg-neutral-800 border-neutral-700">
                <SelectItem value="all" className="text-xs text-white hover:bg-neutral-700">
                  All Delivery
                </SelectItem>
                <SelectItem value="Standard" className="text-xs text-white hover:bg-neutral-700">
                  Standard
                </SelectItem>
                <SelectItem value="Express" className="text-xs text-white hover:bg-neutral-700">
                  Express
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="h-7 text-xs px-2 text-neutral-400 hover:text-white"
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                Clear
              </Button>
            )}
          </div>

          {/* Grouped Approvals */}
          {filteredApprovals.length === 0 ? (
            <div className="p-12 text-center">
              <Filter className="w-10 h-10 text-neutral-500 mx-auto mb-3 opacity-50" />
              <p className="text-sm text-neutral-400">No approvals match the current filters</p>
              <Button variant="link" size="sm" onClick={handleClearFilters} className="text-xs mt-2">
                Clear all filters
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {groupedApprovals.map((group) => {
                const groupIssues = getGroupIssues(group)
                const highestSeverity = getHighestSeverity(groupIssues)
                const isSelected = isGroupSelected(group)

                return (
                  <div
                    key={group.id}
                    className={`border rounded p-4 transition-all ${
                      highestSeverity
                        ? `${getSeverityColor(highestSeverity.severity)} border-l-4 hover:bg-opacity-30`
                        : "border-neutral-700 hover:border-neutral-600 hover:bg-neutral-800/50"
                    } ${isSelected ? "ring-2 ring-orange-500/50" : ""}`}
                  >
                    <div className="flex items-start gap-4">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => handleSelectGroup(group, checked as boolean)}
                        className="mt-1 border-neutral-600"
                        onClick={(e) => e.stopPropagation()}
                      />

                      <div className="flex-1 min-w-0">
                        {/* Group Header */}
                        <div className="flex items-center gap-2 flex-wrap mb-3">
                          <span className="text-sm font-semibold text-white">{group.supplier}</span>
                          <Badge variant="outline" className="text-xs border-orange-500/30 text-orange-400">
                            ৳{group.totalAmount.toLocaleString()}
                          </Badge>
                          {group.approvals.length > 1 && (
                            <Badge
                              variant="outline"
                              className="text-xs border-blue-500/30 text-blue-400 flex items-center gap-1"
                            >
                              <PackageOpen className="w-3 h-3" />
                              {group.approvals.length} Items Grouped
                            </Badge>
                          )}
                          {groupIssues.length > 0 && (
                            <Badge className={getSeverityColor(highestSeverity!.severity)}>
                              {groupIssues.length} ISSUE{groupIssues.length !== 1 ? "S" : ""}
                            </Badge>
                          )}
                        </div>

                        {/* Individual Approvals */}
                        <div className="space-y-3">
                          {group.approvals.map((approval, idx) => {
                            const approvalIssues = issuesMap.get(approval.id) || []
                            const rateComp = getRateComparison(approval.rate, approval.lastApprovedRate)

                            return (
                              <div
                                key={approval.id}
                                className={`${idx > 0 ? "pt-3 border-t border-neutral-700/50" : ""} cursor-pointer hover:bg-neutral-800/30 p-2 rounded transition-colors`}
                                onClick={() => setSelectedApproval(approval)}
                              >
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-xs font-mono text-neutral-400">{approval.orderNo}</span>
                                  {approval.branch && (
                                    <Badge variant="outline" className="text-xs border-neutral-600 text-neutral-400">
                                      {approval.branch}
                                    </Badge>
                                  )}
                                  <Badge variant="outline" className="text-xs border-cyan-500/30 text-cyan-400">
                                    {approval.databaseCode}
                                  </Badge>
                                  {approval.requisitionType === "Urgent" && (
                                    <Badge variant="outline" className="text-xs bg-red-500/10 text-red-500 border-red-500/20">
                                      Urgent
                                    </Badge>
                                  )}
                                  {approval.deliveryType === "Express" && (
                                    <Badge variant="outline" className="text-xs bg-orange-500/10 text-orange-500 border-orange-500/20">
                                      Express
                                    </Badge>
                                  )}
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                                  <div>
                                    <p className="text-neutral-500">Item</p>
                                    <p className="text-white truncate">{approval.item}</p>
                                  </div>
                                  <div>
                                    <p className="text-neutral-500">Date</p>
                                    <p className="text-white">{approval.dueDate}</p>
                                  </div>
                                  <div>
                                    <p className="text-neutral-500">Quantity</p>
                                    <p className="text-white">
                                      {approval.maxQty} {approval.unit}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-neutral-500">Rate</p>
                                    <div className="flex items-center gap-1">
                                      <p className="text-white font-mono">৳{approval.rate.toLocaleString()}</p>
                                      {rateComp && (
                                        <Badge
                                          variant="outline"
                                          className={`text-[10px] px-1 ${
                                            rateComp.isIncrease
                                              ? "bg-red-500/10 text-red-500 border-red-500/20"
                                              : "bg-green-500/10 text-green-500 border-green-500/20"
                                          }`}
                                        >
                                          {rateComp.isIncrease ? (
                                            <TrendingUp className="w-2.5 h-2.5 mr-0.5" />
                                          ) : (
                                            <TrendingDown className="w-2.5 h-2.5 mr-0.5" />
                                          )}
                                          {rateComp.percentage}%
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {approvalIssues.length > 0 && (
                                  <div className="mt-2 pt-2 border-t border-neutral-700/30">
                                    <div className="flex items-start gap-2">
                                      <AlertTriangle className="w-3 h-3 text-orange-500 mt-0.5 flex-shrink-0" />
                                      <div className="flex-1">
                                        <ul className="space-y-1">
                                          {approvalIssues.map((issue, issueIdx) => (
                                            <li key={issueIdx} className="text-xs text-orange-300">
                                              • {issue.message}
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
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
          )}
        </CardContent>
      </Card>

      {/* Analysis Detail Panel */}
      {selectedApproval && selectedApprovalAsPO && (
        <AnalysisDetailPanel
          po={selectedApprovalAsPO}
          issues={selectedApprovalIssues}
          onClose={() => setSelectedApproval(null)}
          onResolve={handleResolve}
        />
      )}
    </>
  )
}
