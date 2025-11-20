'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { X, AlertTriangle, CheckCircle, Info, TrendingUp, Users, Package, Building2, FileText } from 'lucide-react'
import { AnalysisResult, PurchaseOrder } from '@/lib/types'

interface AnalysisDetailPanelProps {
  po: PurchaseOrder
  issues: AnalysisResult[]
  onClose: () => void
  onResolve: (issueId: string) => void
}

export function AnalysisDetailPanel({ po, issues, onClose, onResolve }: AnalysisDetailPanelProps) {
  if (!po) return null

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/20 text-red-500 border-red-500/20'
      case 'high': return 'bg-orange-500/20 text-orange-500 border-orange-500/20'
      case 'medium': return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/20'
      default: return 'bg-blue-500/20 text-blue-500 border-blue-500/20'
    }
  }

  const getIssueIcon = (type: string) => {
    switch (type) {
      case 'risk_flag': return <AlertTriangle className="w-6 h-6" />
      case 'price_anomaly': return <TrendingUp className="w-6 h-6" />
      case 'duplicate': return <Package className="w-6 h-6" />
      case 'pattern': return <Users className="w-6 h-6" />
      default: return <Info className="w-6 h-6" />
    }
  }

  const renderDetailedExplanation = (issue: AnalysisResult) => {
    switch (issue.type) {
      case 'price_anomaly':
        return (
          <div className="space-y-4">
            <div className="bg-neutral-800 rounded p-4 space-y-2">
              <h4 className="text-sm font-medium text-neutral-300">Price Comparison</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-neutral-500">Historical Average</p>
                  <p className="text-lg font-mono text-white">৳{(issue.details.avgRate as number)?.toFixed(2)}</p>
                  <p className="text-xs text-neutral-500">Based on {issue.details.historicalCount as number} orders</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500">Current Rate</p>
                  <p className="text-lg font-mono text-white">৳{(issue.details.currentRate as number)?.toFixed(2)}</p>
                  <p className="text-xs text-orange-400">+{(issue.details.percentDiff as number)?.toFixed(1)}% difference</p>
                </div>
              </div>
            </div>
            <div className="bg-orange-500/10 border border-orange-500/20 rounded p-4">
              <p className="text-sm text-orange-300">
                <strong>Cause:</strong> The current rate significantly deviates from the historical average for similar items. 
                This could indicate market price changes, supplier issues, or data entry errors.
              </p>
            </div>
          </div>
        )

      case 'duplicate':
        return (
          <div className="space-y-4">
            <div className="bg-neutral-800 rounded p-4">
              <h4 className="text-sm font-medium text-neutral-300 mb-2">Duplicate Information</h4>
              <p className="text-sm text-white">Order No: <span className="font-mono text-orange-400">{issue.details.orderNo as string}</span></p>
              <p className="text-xs text-neutral-500 mt-2">Found {(issue.details.duplicateIds as string[])?.length} matching order(s) in current batch</p>
            </div>
            <div className="bg-orange-500/10 border border-orange-500/20 rounded p-4">
              <p className="text-sm text-orange-300">
                <strong>Cause:</strong> Multiple POs with the same order number, supplier, and item were detected. 
                This could be an accidental duplicate upload or a legitimate split order that needs verification.
              </p>
            </div>
          </div>
        )

      case 'pattern':
        return (
          <div className="space-y-4">
            <div className="bg-neutral-800 rounded p-4 space-y-2">
              <h4 className="text-sm font-medium text-neutral-300">Order Size Analysis</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-neutral-500">Supplier Average</p>
                  <p className="text-lg font-mono text-white">৳{(issue.details.supplierAvg as number)?.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500">Current Order</p>
                  <p className="text-lg font-mono text-white">৳{(issue.details.currentAmount as number)?.toLocaleString()}</p>
                </div>
              </div>
            </div>
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded p-4">
              <p className="text-sm text-yellow-300">
                <strong>Cause:</strong> This order size is significantly larger than typical orders from this supplier. 
                While it may be legitimate, it's worth verifying the quantities and pricing.
              </p>
            </div>
          </div>
        )

      case 'risk_flag':
        if (issue.details.newSupplier) {
          return (
            <div className="space-y-4">
              <div className="bg-neutral-800 rounded p-4">
                <h4 className="text-sm font-medium text-neutral-300 mb-2">New Supplier Detection</h4>
                <p className="text-sm text-white">Supplier: <span className="font-mono text-orange-400">{issue.details.newSupplier as string}</span></p>
              </div>
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded p-4">
                <p className="text-sm text-yellow-300">
                  <strong>Cause:</strong> This supplier has no history in your approved PO database. 
                  Ensure proper vendor verification and approval processes are followed before proceeding.
                </p>
              </div>
            </div>
          )
        } else if (issue.details.amount) {
          return (
            <div className="space-y-4">
              <div className="bg-neutral-800 rounded p-4">
                <h4 className="text-sm font-medium text-neutral-300 mb-2">High-Value Order</h4>
                <p className="text-2xl font-mono text-white">৳{(issue.details.amount as number)?.toLocaleString()}</p>
              </div>
              <div className="bg-orange-500/10 border border-orange-500/20 rounded p-4">
                <p className="text-sm text-orange-300">
                  <strong>Cause:</strong> This order exceeds ৳5,00,000 threshold. 
                  High-value orders require additional scrutiny and may need higher-level approval authorization.
                </p>
              </div>
            </div>
          )
        } else if (issue.details.lastRate) {
          return (
            <div className="space-y-4">
              <div className="bg-neutral-800 rounded p-4 space-y-2">
                <h4 className="text-sm font-medium text-neutral-300">Rate Comparison</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-neutral-500">Last Approved Rate</p>
                    <p className="text-lg font-mono text-white">৳{(issue.details.lastRate as number)?.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500">Current Rate</p>
                    <p className="text-lg font-mono text-white">৳{(issue.details.currentRate as number)?.toFixed(2)}</p>
                  </div>
                </div>
              </div>
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded p-4">
                <p className="text-sm text-yellow-300">
                  <strong>Cause:</strong> The current rate is significantly higher than the last approved rate. 
                  Verify with the supplier if this increase is justified and matches market conditions.
                </p>
              </div>
            </div>
          )
        }
        return null

      default:
        return null
    }
  }

  const highestIssue = issues.length > 0 
    ? issues.reduce((highest, issue) => {
        const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
        return severityOrder[issue.severity] < severityOrder[highest.severity] ? issue : highest
      })
    : null

  return (
    <div className="fixed inset-y-0 right-0 w-full md:w-[500px] bg-neutral-950 border-l border-neutral-700 shadow-2xl z-50 overflow-y-auto animate-in slide-in-from-right duration-300">
      <div className="p-6 space-y-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {highestIssue ? (
              <>
                <div className={`p-2 rounded ${getSeverityColor(highestIssue.severity)}`}>
                  {getIssueIcon(highestIssue.type)}
                </div>
                <div>
                  <Badge className={getSeverityColor(highestIssue.severity)}>
                    {issues.length} ISSUE{issues.length !== 1 ? 'S' : ''}
                  </Badge>
                  <p className="text-xs text-neutral-500 mt-1">Requires attention</p>
                </div>
              </>
            ) : (
              <>
                <div className="p-2 rounded bg-green-500/20 text-green-500">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <Badge className="bg-green-500/20 text-green-500 border-green-500/20">
                    NO ISSUES
                  </Badge>
                  <p className="text-xs text-neutral-500 mt-1">Purchase order details</p>
                </div>
              </>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-neutral-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {po.branch && (
          <div className="flex items-center gap-2 p-3 bg-neutral-900 border border-neutral-700 rounded">
            <Building2 className="w-4 h-4 text-orange-500" />
            <div className="flex-1">
              <p className="text-xs text-neutral-500">Branch</p>
              <p className="text-sm text-white font-medium">{po.branch}</p>
            </div>
          </div>
        )}

        {issues.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-neutral-300 tracking-wider">DETECTED ISSUES</h3>
            {issues.map((issue, idx) => (
              <div key={idx} className="space-y-3">
                <div className="flex items-start gap-2">
                  <Badge className={getSeverityColor(issue.severity)}>
                    {issue.severity.toUpperCase()}
                  </Badge>
                  <p className="text-sm text-white flex-1">{issue.message}</p>
                </div>
                {renderDetailedExplanation(issue)}
                {idx < issues.length - 1 && <div className="border-t border-neutral-700" />}
              </div>
            ))}
          </div>
        )}

        {/* Purchase Order Details */}
        <Card className="bg-neutral-900 border-neutral-700">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-neutral-300">PURCHASE ORDER DETAILS</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-neutral-500 text-xs">PO Number</p>
                <p className="text-white font-mono">{po.orderNo}</p>
              </div>
              <div>
                <p className="text-neutral-500 text-xs">Order No</p>
                <p className="text-white font-mono">{po.orderNo}</p>
              </div>
              <div>
                <p className="text-neutral-500 text-xs">Date</p>
                <p className="text-white font-mono">{po.date}</p>
              </div>
              <div>
                <p className="text-neutral-500 text-xs">Supplier</p>
                <p className="text-white">{po.supplier}</p>
              </div>
              <div className="col-span-2">
                <p className="text-neutral-500 text-xs">Item</p>
                <p className="text-white">{po.item}</p>
              </div>
              <div>
                <p className="text-neutral-500 text-xs">Quantity</p>
                <p className="text-white font-mono">{po.maxQty} {po.unit}</p>
              </div>
              <div>
                <p className="text-neutral-500 text-xs">Rate</p>
                <p className="text-white font-mono">৳{po.rate.toFixed(2)}</p>
              </div>
              <div className="col-span-2">
                <p className="text-neutral-500 text-xs">Total Amount</p>
                <p className="text-white font-mono text-lg">৳{po.totalAmount.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {issues.length > 0 && (
          <div className="space-y-3 pt-4 border-t border-neutral-700">
            <p className="text-xs text-neutral-400">
              Mark issues as resolved if you've verified this purchase order is correct.
            </p>
            {issues.map((issue) => (
              <Button
                key={issue.poId}
                onClick={() => onResolve(issue.poId)}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Resolve: {issue.type.replace(/_/g, ' ')}
              </Button>
            ))}
          </div>
        )}
        
        <Button
          onClick={onClose}
          variant="outline"
          className="w-full border-neutral-700 text-neutral-400 hover:bg-neutral-800"
        >
          Close
        </Button>
      </div>
    </div>
  )
}
