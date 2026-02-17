"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { PoloxyApprovalRequest, PoloxyDatabase } from "@/lib/poloxy-types"
import { Check, X, Trash2, AlertCircle, TrendingUp, TrendingDown, Filter, RotateCcw } from "lucide-react"

interface ApprovalListProps {
  approvals: PoloxyApprovalRequest[]
  databases: PoloxyDatabase[]
  onApprove: (ids: string[]) => void
  onReject: (ids: string[]) => void
  onDelete: (ids: string[]) => void
}

export function ApprovalList({
  approvals,
  databases,
  onApprove,
  onReject,
  onDelete,
}: ApprovalListProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // Filter states
  const [searchTerm, setSearchTerm] = useState("")
  const [filterDatabase, setFilterDatabase] = useState<string>("all")
  const [filterRequisitionType, setFilterRequisitionType] = useState<string>("all")
  const [filterDeliveryType, setFilterDeliveryType] = useState<string>("all")

  // Apply filters
  const filteredApprovals = useMemo(() => {
    return approvals.filter((approval) => {
      // Search filter (searches across multiple fields)
      const searchLower = searchTerm.toLowerCase()
      const matchesSearch =
        searchTerm === "" ||
        approval.orderNo.toLowerCase().includes(searchLower) ||
        approval.supplier.toLowerCase().includes(searchLower) ||
        approval.item.toLowerCase().includes(searchLower) ||
        approval.databaseName.toLowerCase().includes(searchLower) ||
        approval.refNo.toLowerCase().includes(searchLower)

      // Database filter
      const matchesDatabase =
        filterDatabase === "all" || approval.databaseId === filterDatabase

      // Requisition type filter
      const matchesRequisitionType =
        filterRequisitionType === "all" || approval.requisitionType === filterRequisitionType

      // Delivery type filter
      const matchesDeliveryType =
        filterDeliveryType === "all" || approval.deliveryType === filterDeliveryType

      return matchesSearch && matchesDatabase && matchesRequisitionType && matchesDeliveryType
    })
  }, [approvals, searchTerm, filterDatabase, filterRequisitionType, filterDeliveryType])

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredApprovals.map((a) => a.id))
    } else {
      setSelectedIds([])
    }
  }

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id])
    } else {
      setSelectedIds(selectedIds.filter((sid) => sid !== id))
    }
  }

  const handleClearFilters = () => {
    setSearchTerm("")
    setFilterDatabase("all")
    setFilterRequisitionType("all")
    setFilterDeliveryType("all")
  }

  const hasActiveFilters =
    searchTerm !== "" ||
    filterDatabase !== "all" ||
    filterRequisitionType !== "all" ||
    filterDeliveryType !== "all"

  const handleApprove = () => {
    if (selectedIds.length > 0) {
      onApprove(selectedIds)
      setSelectedIds([])
    }
  }

  const handleReject = () => {
    if (selectedIds.length > 0) {
      onReject(selectedIds)
      setSelectedIds([])
    }
  }

  const handleDelete = () => {
    if (selectedIds.length > 0) {
      onDelete(selectedIds)
      setSelectedIds([])
    }
  }

  const getDatabaseName = (dbId: string) => {
    const db = databases.find((d) => d.id === dbId)
    return db ? db.name : "Unknown"
  }

  const getRateComparison = (current: number, last: number) => {
    if (!last || current === last) return null
    const diff = ((current - last) / last) * 100
    return {
      percentage: Math.abs(diff).toFixed(1),
      isIncrease: diff > 0,
    }
  }

  if (approvals.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-12 text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No Pending Approvals</h3>
          <p className="text-sm text-muted-foreground">
            All approval requests have been processed. Sync databases to fetch new requests.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground tracking-wider">
            PENDING APPROVALS ({filteredApprovals.length} of {approvals.length})
          </CardTitle>
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{selectedIds.length} selected</span>
              <Button
                size="sm"
                variant="outline"
                onClick={handleApprove}
                className="h-8 text-xs bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20"
              >
                <Check className="w-3 h-3 mr-1" />
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleReject}
                className="h-8 text-xs bg-orange-500/10 text-orange-500 border-orange-500/20 hover:bg-orange-500/20"
              >
                <X className="w-3 h-3 mr-1" />
                Reject
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleDelete}
                className="h-8 text-xs bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20"
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Delete
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Minimal Filter Bar */}
        <div className="flex items-center gap-2 px-3 py-2 bg-muted/30 rounded-lg border border-border/50">
          <Filter className="w-3.5 h-3.5 text-muted-foreground" />

          {/* Search */}
          <Input
            placeholder="Search orders, suppliers, items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-7 text-xs flex-1 max-w-xs bg-background"
          />

          {/* Database Filter */}
          <Select value={filterDatabase} onValueChange={setFilterDatabase}>
            <SelectTrigger className="h-7 text-xs w-36 bg-background">
              <SelectValue placeholder="All Databases" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All Databases</SelectItem>
              {databases.map((db) => (
                <SelectItem key={db.id} value={db.id} className="text-xs">
                  {db.code} - {db.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Requisition Type Filter */}
          <Select value={filterRequisitionType} onValueChange={setFilterRequisitionType}>
            <SelectTrigger className="h-7 text-xs w-32 bg-background">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All Types</SelectItem>
              <SelectItem value="Standard" className="text-xs">Standard</SelectItem>
              <SelectItem value="Urgent" className="text-xs">Urgent</SelectItem>
            </SelectContent>
          </Select>

          {/* Delivery Type Filter */}
          <Select value={filterDeliveryType} onValueChange={setFilterDeliveryType}>
            <SelectTrigger className="h-7 text-xs w-28 bg-background">
              <SelectValue placeholder="Delivery" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All Delivery</SelectItem>
              <SelectItem value="Standard" className="text-xs">Standard</SelectItem>
              <SelectItem value="Express" className="text-xs">Express</SelectItem>
            </SelectContent>
          </Select>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="h-7 text-xs px-2 text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Clear
            </Button>
          )}
        </div>

        {/* Table */}
        {filteredApprovals.length === 0 ? (
          <div className="rounded-lg border border-border p-12 text-center">
            <Filter className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-sm text-muted-foreground">No approvals match the current filters</p>
            <Button
              variant="link"
              size="sm"
              onClick={handleClearFilters}
              className="text-xs mt-2"
            >
              Clear all filters
            </Button>
          </div>
        ) : (
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedIds.length === filteredApprovals.length && filteredApprovals.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="font-medium text-xs">DATABASE</TableHead>
                  <TableHead className="font-medium text-xs">ORDER NO</TableHead>
                  <TableHead className="font-medium text-xs">SUPPLIER</TableHead>
                  <TableHead className="font-medium text-xs">ITEM</TableHead>
                  <TableHead className="font-medium text-xs text-right">QTY</TableHead>
                  <TableHead className="font-medium text-xs text-right">RATE</TableHead>
                  <TableHead className="font-medium text-xs text-right">AMOUNT</TableHead>
                  <TableHead className="font-medium text-xs">TYPE</TableHead>
                  <TableHead className="font-medium text-xs">DUE DATE</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredApprovals.map((approval) => {
                const rateComp = getRateComparison(approval.rate, approval.lastApprovedRate)
                return (
                  <TableRow
                    key={approval.id}
                    className={`${
                      selectedIds.includes(approval.id) ? "bg-accent/5" : ""
                    } hover:bg-muted/50`}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.includes(approval.id)}
                        onCheckedChange={(checked) =>
                          handleSelectOne(approval.id, checked as boolean)
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-xs font-medium text-foreground">{approval.databaseName}</p>
                        <p className="text-xs text-muted-foreground font-mono">{approval.databaseCode}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-xs font-mono text-foreground">{approval.orderNo}</p>
                      <p className="text-xs text-muted-foreground">Ref: {approval.refNo}</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-xs text-foreground max-w-[150px] truncate">
                        {approval.supplier}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p className="text-xs text-foreground max-w-[180px] truncate">
                        {approval.item}
                      </p>
                      <p className="text-xs text-muted-foreground">{approval.itemLedgerGroup}</p>
                    </TableCell>
                    <TableCell className="text-right">
                      <p className="text-xs font-medium text-foreground">
                        {approval.maxQty} {approval.unit}
                      </p>
                      <p className="text-xs text-muted-foreground">Min: {approval.minQty}</p>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <p className="text-xs font-medium text-foreground">
                          ৳{approval.rate.toLocaleString()}
                        </p>
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
                      {approval.lastApprovedRate && (
                        <p className="text-xs text-muted-foreground">
                          Last: ৳{approval.lastApprovedRate.toLocaleString()}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <p className="text-xs font-bold text-foreground">
                        ৳{approval.totalAmount.toLocaleString()}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          approval.requisitionType === "Urgent"
                            ? "bg-red-500/10 text-red-500 border-red-500/20"
                            : "bg-blue-500/10 text-blue-500 border-blue-500/20"
                        }`}
                      >
                        {approval.requisitionType}
                      </Badge>
                      {approval.deliveryType === "Express" && (
                        <Badge
                          variant="outline"
                          className="text-xs bg-orange-500/10 text-orange-500 border-orange-500/20 mt-1"
                        >
                          Express
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <p className="text-xs text-foreground">{approval.dueDate}</p>
                      <p className="text-xs text-muted-foreground">Del: {approval.deliveryDate}</p>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
        )}
      </CardContent>
    </Card>
  )
}
