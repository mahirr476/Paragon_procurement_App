'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Building2, X } from 'lucide-react'
import { PurchaseOrder } from '@/lib/types'

interface BranchFilterProps {
  pos: PurchaseOrder[]
  selectedBranch: string | null
  onBranchSelect: (branch: string | null) => void
}

export function BranchFilter({ pos, selectedBranch, onBranchSelect }: BranchFilterProps) {
  const branchStats = pos.reduce((acc, po) => {
    const branch = po.branch || 'Unknown'
    if (!acc[branch]) {
      acc[branch] = { count: 0, amount: 0 }
    }
    acc[branch].count++
    acc[branch].amount += po.totalAmount
    return acc
  }, {} as Record<string, { count: number; amount: number }>)

  const sortedBranches = Object.entries(branchStats).sort((a, b) => b[1].amount - a[1].amount)

  return (
    <Card className="bg-neutral-900 border-neutral-700">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider flex items-center gap-2">
          <Building2 className="w-4 h-4" />
          FILTER BY BRANCH
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {selectedBranch && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onBranchSelect(null)}
              className="w-full border-neutral-700 text-neutral-400 hover:bg-neutral-800 bg-transparent justify-start"
            >
              <X className="w-3 h-3 mr-2" />
              Clear Filter
            </Button>
          )}
          {sortedBranches.map(([branch, stats]) => (
            <button
              key={branch}
              onClick={() => onBranchSelect(branch === selectedBranch ? null : branch)}
              className={`w-full text-left p-3 rounded border transition-colors ${
                selectedBranch === branch
                  ? 'bg-orange-500/20 border-orange-500/50'
                  : 'border-neutral-700 hover:border-neutral-600'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{branch}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-neutral-400">{stats.count} POs</span>
                    <span className="text-xs text-neutral-400">
                      ৳{stats.amount.toLocaleString()}
                    </span>
                  </div>
                </div>
                {selectedBranch === branch && (
                  <Badge className="bg-orange-500/20 text-orange-500">ACTIVE</Badge>
                )}
              </div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
