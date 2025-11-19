'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { AlertTriangle, CheckCircle, Trash2, Building2, PackageOpen } from 'lucide-react'
import { PurchaseOrder, AnalysisResult } from '@/lib/types'
import { analyzeOrders } from '@/lib/analysis'
import { AnalysisDetailPanel } from './analysis-detail-panel'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface POComparisonProps {
  currentPOs: PurchaseOrder[]
  approvedPOs: PurchaseOrder[]
  onApprove?: (poIds: string[]) => void
  onDelete?: (poIds: string[]) => void
}

interface POGroup {
  id: string
  supplier: string
  totalAmount: number
  pos: PurchaseOrder[]
}

export function POComparison({ currentPOs, approvedPOs, onApprove, onDelete }: POComparisonProps) {
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null)
  const [resolvedIssues, setResolvedIssues] = useState<Set<string>>(new Set())
  const [selectedBranch, setSelectedBranch] = useState<string>('all')
  const [selectedPOIds, setSelectedPOIds] = useState<Set<string>>(new Set())

  const branches = useMemo(() => {
    const branchSet = new Set(currentPOs.map(po => po.branch).filter(Boolean))
    return Array.from(branchSet).sort()
  }, [currentPOs])

  const filteredPOs = useMemo(() => {
    if (selectedBranch === 'all') return currentPOs
    return currentPOs.filter(po => po.branch === selectedBranch)
  }, [currentPOs, selectedBranch])

  const groupedPOs = useMemo(() => {
    const groups = new Map<string, POGroup>()
    
    filteredPOs.forEach(po => {
      const key = `${po.supplier}-${po.totalAmount}`
      
      if (groups.has(key)) {
        const group = groups.get(key)!
        group.pos.push(po)
      } else {
        groups.set(key, {
          id: key,
          supplier: po.supplier,
          totalAmount: po.totalAmount,
          pos: [po]
        })
      }
    })
    
    return Array.from(groups.values())
  }, [filteredPOs])

  const allIssues = useMemo(() => {
    return analyzeOrders(filteredPOs, approvedPOs)
      .filter(issue => !resolvedIssues.has(issue.poId))
      .sort((a, b) => {
        const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
        return severityOrder[a.severity] - severityOrder[b.severity]
      })
  }, [filteredPOs, approvedPOs, resolvedIssues])

  const poIssuesMap = useMemo(() => {
    const map = new Map<string, AnalysisResult[]>()
    allIssues.forEach(issue => {
      const existing = map.get(issue.poId) || []
      map.set(issue.poId, [...existing, issue])
    })
    return map
  }, [allIssues])

  const handleResolve = (issueId: string) => {
    setResolvedIssues(prev => new Set([...prev, issueId]))
    setSelectedPO(null)
  }

  const handleSelectGroup = (group: POGroup, checked: boolean) => {
    setSelectedPOIds(prev => {
      const newSet = new Set(prev)
      group.pos.forEach(po => {
        if (checked) {
          newSet.add(po.id)
        } else {
          newSet.delete(po.id)
        }
      })
      return newSet
    })
  }

  const isGroupSelected = (group: POGroup) => {
    return group.pos.every(po => selectedPOIds.has(po.id))
  }

  const isGroupPartiallySelected = (group: POGroup) => {
    const selected = group.pos.filter(po => selectedPOIds.has(po.id))
    return selected.length > 0 && selected.length < group.pos.length
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedPOIds(new Set(filteredPOs.map(po => po.id)))
    } else {
      setSelectedPOIds(new Set())
    }
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

  const selectedPOIssues = selectedPO 
    ? (poIssuesMap.get(selectedPO.id) || [])
    : []

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/20 text-red-500 border-red-500/30'
      case 'high': return 'bg-orange-500/20 text-orange-500 border-orange-500/30'
      case 'medium': return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30'
      default: return 'bg-blue-500/20 text-blue-500 border-blue-500/30'
    }
  }

  const getHighestSeverity = (issues: AnalysisResult[]) => {
    if (issues.length === 0) return null
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
    return issues.reduce((highest, issue) => 
      severityOrder[issue.severity] < severityOrder[highest.severity] ? issue : highest
    )
  }

  const getGroupIssues = (group: POGroup) => {
    const issues: AnalysisResult[] = []
    group.pos.forEach(po => {
      const poIssues = poIssuesMap.get(po.id) || []
      issues.push(...poIssues)
    })
    return issues
  }

  const allSelected = filteredPOs.length > 0 && selectedPOIds.size === filteredPOs.length

  if (currentPOs.length === 0) {
    return (
      <Card className="bg-neutral-900 border-neutral-700">
        <CardContent className="p-8 text-center">
          <p className="text-neutral-400 text-sm">Upload a CSV to begin analysis</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="bg-neutral-900 border-neutral-700">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4" data-tour="upload-actions">
              <Checkbox
                checked={allSelected}
                onCheckedChange={handleSelectAll}
                className="border-neutral-600"
              />
              <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">
                UPLOADED PURCHASE ORDERS ({filteredPOs.length})
                {selectedPOIds.size > 0 && (
                  <span className="ml-2 text-orange-500">
                    {selectedPOIds.size} selected
                  </span>
                )}
              </CardTitle>
            </div>
            
            {branches.length > 0 && (
              <div className="flex items-center gap-2" data-tour="upload-branch-filter">
                <Building2 className="w-4 h-4 text-neutral-500" />
                <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                  <SelectTrigger className="w-[200px] bg-neutral-800 border-neutral-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-800 border-neutral-700">
                    <SelectItem value="all" className="text-white hover:bg-neutral-700">
                      All Branches ({currentPOs.length})
                    </SelectItem>
                    {branches.map(branch => {
                      const branchCount = currentPOs.filter(po => po.branch === branch).length
                      return (
                        <SelectItem key={branch} value={branch} className="text-white hover:bg-neutral-700">
                          {branch} ({branchCount})
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          
          {selectedPOIds.size > 0 && (
            <div className="mt-4 flex gap-2">
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
                Delete Selected ({selectedPOIds.size})
              </Button>
            </div>
          )}

          {allIssues.length > 0 && (
            <div className="mt-4 p-3 bg-orange-500/10 border border-orange-500/20 rounded">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                <p className="text-sm text-orange-300">
                  {allIssues.length} issue{allIssues.length !== 1 ? 's' : ''} found requiring attention
                </p>
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-[600px] overflow-y-auto" data-tour="upload-po-list">
            {groupedPOs.map((group) => {
              const groupIssues = getGroupIssues(group)
              const highestIssue = getHighestSeverity(groupIssues)
              const isSelected = isGroupSelected(group)
              const isPartiallySelected = isGroupPartiallySelected(group)
              const isMultiItem = group.pos.length > 1
              
              return (
                <div
                  key={group.id}
                  className={`border rounded p-4 transition-all ${
                    highestIssue 
                      ? `${getSeverityColor(highestIssue.severity)} border-l-4 hover:bg-opacity-30` 
                      : 'border-neutral-700 hover:border-neutral-600 hover:bg-neutral-800/50'
                  } ${isSelected ? 'ring-2 ring-orange-500/50' : ''}`}
                >
                  <div className="flex items-start gap-4">
                    <Checkbox
                      checked={isSelected}
                      ref={(el) => {
                        if (el && isPartiallySelected) {
                          el.indeterminate = true
                        }
                      }}
                      onCheckedChange={(checked) => handleSelectGroup(group, checked as boolean)}
                      className="mt-1 border-neutral-600"
                      onClick={(e) => e.stopPropagation()}
                    />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-3">
                        <span className="text-sm font-semibold text-white">{group.supplier}</span>
                        <Badge variant="outline" className="text-xs border-orange-500/30 text-orange-400">
                          ৳{group.totalAmount.toLocaleString()}
                        </Badge>
                        {isMultiItem && (
                          <Badge variant="outline" className="text-xs border-blue-500/30 text-blue-400 flex items-center gap-1">
                            <PackageOpen className="w-3 h-3" />
                            {group.pos.length} Items Grouped
                          </Badge>
                        )}
                        {groupIssues.length > 0 && (
                          <Badge className={getSeverityColor(highestIssue!.severity)}>
                            {groupIssues.length} ISSUE{groupIssues.length !== 1 ? 'S' : ''}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="space-y-3">
                        {group.pos.map((po, idx) => {
                          const poIssues = poIssuesMap.get(po.id) || []
                          
                          return (
                            <div 
                              key={po.id}
                              className={`${idx > 0 ? 'pt-3 border-t border-neutral-700/50' : ''} cursor-pointer hover:bg-neutral-800/30 p-2 rounded transition-colors`}
                              onClick={() => setSelectedPO(po)}
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs font-mono text-neutral-400">{po.orderNo}</span>
                                {po.branch && (
                                  <Badge variant="outline" className="text-xs border-neutral-600 text-neutral-400">
                                    {po.branch}
                                  </Badge>
                                )}
                              </div>
                              
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                                <div>
                                  <p className="text-neutral-500">Item</p>
                                  <p className="text-white truncate">{po.item}</p>
                                </div>
                                <div>
                                  <p className="text-neutral-500">Date</p>
                                  <p className="text-white">{po.date}</p>
                                </div>
                                <div>
                                  <p className="text-neutral-500">Quantity</p>
                                  <p className="text-white">{po.maxQty} {po.unit}</p>
                                </div>
                                <div>
                                  <p className="text-neutral-500">Rate</p>
                                  <p className="text-white font-mono">৳{po.rate.toLocaleString()}</p>
                                </div>
                              </div>

                              {poIssues.length > 0 && (
                                <div className="mt-2 pt-2 border-t border-neutral-700/30">
                                  <div className="flex items-start gap-2">
                                    <AlertTriangle className="w-3 h-3 text-orange-500 mt-0.5 flex-shrink-0" />
                                    <div className="flex-1">
                                      <ul className="space-y-1">
                                        {poIssues.map((issue, issueIdx) => (
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
        </CardContent>
      </Card>

      {selectedPO && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-40 animate-in fade-in duration-300"
            onClick={() => setSelectedPO(null)}
          />
          <AnalysisDetailPanel
            po={selectedPO}
            issues={selectedPOIssues}
            approvedOrders={approvedPOs}
            onClose={() => setSelectedPO(null)}
            onResolve={handleResolve}
          />
        </>
      )}
    </>
  )
}
