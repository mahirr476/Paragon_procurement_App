'use client'

import { useMemo, useRef, useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { PurchaseOrder } from '@/lib/types'
import { TrendingUp, Package, DollarSign, Users, Building2 } from 'lucide-react'
import { Tooltip } from '@/components/ui/tooltip'

interface DashboardStatsProps {
  currentPOs: PurchaseOrder[]
  approvedPOs: PurchaseOrder[]
}

interface StatCardProps {
  label: string
  value: number | string
  icon: React.ComponentType<{ className?: string }>
  unit?: string
}

export function DashboardStats({ currentPOs, approvedPOs }: DashboardStatsProps) {
  const stats = useMemo(() => {
    const total = currentPOs.length
    const amount = currentPOs.reduce((sum, po) => sum + po.totalAmount, 0)
    const avgValue = total > 0 ? amount / total : 0
    const suppliers = new Set(currentPOs.map(po => po.supplier)).size
    const branches = new Set(currentPOs.map(po => po.branch)).size

    return {
      totalPOs: total,
      totalAmount: amount,
      averageOrderValue: avgValue,
      uniqueSuppliers: suppliers,
      pendingApproval: currentPOs.filter(po => !po.isApproved).length,
      uniqueBranches: branches,
    }
  }, [currentPOs])

  const StatCard = ({ label, value, icon: Icon, unit = '' }: StatCardProps) => {
    const [isTruncated, setIsTruncated] = useState(false)
    const textRef = useRef<HTMLParagraphElement>(null)

    useEffect(() => {
      const checkTruncation = () => {
        if (textRef.current) {
          setIsTruncated(textRef.current.scrollWidth > textRef.current.clientWidth)
        }
      }
      checkTruncation()
      window.addEventListener('resize', checkTruncation)
      return () => window.removeEventListener('resize', checkTruncation)
    }, [value])

    return (
      <Tooltip content="Value is truncated" show={isTruncated}>
        <Card 
          className={`bg-card border-border flex-grow ${
            isTruncated ? 'shadow-[0_0_20px_rgba(249,115,22,0.5)] border-accent' : ''
          }`}
        >
          <CardContent className="p-4 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground tracking-wider mb-1">{label}</p>
                <p 
                  ref={textRef}
                  className="text-xl md:text-2xl font-bold text-foreground font-mono truncate"
                >
                  {unit === '৳' ? `৳${typeof value === 'number' ? value.toLocaleString() : value}` : value}
                </p>
              </div>
              <Icon className={`w-7 h-7 md:w-8 md:h-8 flex-shrink-0 ${
                label === 'TOTAL POs' ? 'text-icon-orange' :
                label === 'TOTAL AMOUNT' ? 'text-icon-green' :
                label === 'AVG VALUE' ? 'text-icon-blue' :
                label === 'SUPPLIERS' ? 'text-icon-purple' :
                label === 'BRANCHES' ? 'text-icon-cyan' :
                'text-icon-yellow'
              }`} />
            </div>
          </CardContent>
        </Card>
      </Tooltip>
    )
  }

  return (
    <div className="flex flex-wrap gap-4" data-tour="upload-stats">
      <StatCard label="TOTAL POs" value={stats.totalPOs} icon={Package} />
      <StatCard label="TOTAL AMOUNT" value={stats.totalAmount} icon={DollarSign} unit="৳" />
      <StatCard label="AVG VALUE" value={Math.round(stats.averageOrderValue).toLocaleString()} icon={TrendingUp} unit="৳" />
      <StatCard label="SUPPLIERS" value={stats.uniqueSuppliers} icon={Users} />
      <StatCard label="BRANCHES" value={stats.uniqueBranches} icon={Building2} />
      <StatCard label="PENDING" value={stats.pendingApproval} icon={Package} />
    </div>
  )
}
