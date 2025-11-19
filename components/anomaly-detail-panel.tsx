'use client'

import { X, AlertTriangle, TrendingUp, Package, Building2, Calendar, DollarSign } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TrendAnomaly } from '@/lib/trend-analyzer'

interface AnomalyDetailPanelProps {
  anomaly: TrendAnomaly | null
  onClose: () => void
  onResolve?: (anomaly: TrendAnomaly) => void
}

export function AnomalyDetailPanel({ anomaly, onClose, onResolve }: AnomalyDetailPanelProps) {
  if (!anomaly) return null

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-500'
      case 'medium': return 'bg-orange-500'
      case 'low': return 'bg-yellow-500'
      default: return 'bg-neutral-500'
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 z-40"
        onClick={onClose}
      />

      {/* Slide-out Panel */}
      <div className="fixed inset-y-0 right-0 w-full md:w-[600px] bg-neutral-950 border-l border-neutral-700 shadow-2xl z-50 overflow-y-auto animate-in slide-in-from-right duration-300">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className={`w-2 h-16 ${getSeverityColor(anomaly.severity)} rounded-full`} />
              <div>
                <h2 className="text-xl font-semibold text-white">{anomaly.type}</h2>
                <p className="text-sm text-neutral-400 mt-1">{anomaly.description}</p>
              </div>
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

          {/* Severity Badge */}
          <Badge className={`${getSeverityColor(anomaly.severity)} text-white uppercase text-xs`}>
            {anomaly.severity} SEVERITY
          </Badge>

          {/* Item Details */}
          <Card className="bg-neutral-800 border-neutral-700">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-orange-500" />
                <span className="text-xs text-neutral-400">ITEM DETAILS</span>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-neutral-500">Item Name</p>
                  <p className="text-sm font-medium text-white">{anomaly.itemName}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500">Category</p>
                  <p className="text-sm font-medium text-white">{anomaly.category}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500">Supplier</p>
                  <p className="text-sm font-medium text-white">{anomaly.supplier}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500">Branch</p>
                  <p className="text-sm font-medium text-white">{anomaly.branch}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500">Date</p>
                  <p className="text-sm font-medium text-white">{anomaly.date}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500">Related Orders</p>
                  <p className="text-sm font-medium text-white">{anomaly.relatedPOs.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Metrics Comparison */}
          <Card className="bg-neutral-800 border-neutral-700">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-orange-500" />
                <span className="text-xs text-neutral-400">METRICS ANALYSIS</span>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-neutral-400">Current Value</span>
                  <span className="text-sm font-mono font-bold text-white">
                    {anomaly.metrics.currentValue.toLocaleString()} {anomaly.metrics.unit}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-neutral-400">Expected Value</span>
                  <span className="text-sm font-mono text-neutral-300">
                    {anomaly.metrics.expectedValue.toLocaleString()} {anomaly.metrics.unit}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-neutral-400">Deviation</span>
                  <span className={`text-sm font-mono font-bold ${
                    Math.abs(anomaly.metrics.deviation) > 50 ? 'text-red-500' : 
                    Math.abs(anomaly.metrics.deviation) > 30 ? 'text-orange-500' : 'text-yellow-500'
                  }`}>
                    {anomaly.metrics.deviation > 0 ? '+' : ''}{anomaly.metrics.deviation.toFixed(1)}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Related Purchase Orders */}
          {anomaly.relatedPOs.length > 0 && (
            <Card className="bg-neutral-800 border-neutral-700">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-orange-500" />
                  <span className="text-xs text-neutral-400">RELATED PURCHASE ORDERS</span>
                </div>
                
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {anomaly.relatedPOs.map((po, idx) => (
                    <div key={idx} className="p-3 bg-neutral-900 rounded border border-neutral-700">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-sm font-medium text-white">{po.item}</p>
                          <p className="text-xs text-neutral-500">Order #{po.orderNo}</p>
                        </div>
                        <p className="text-sm font-mono text-orange-500">
                          ₹{(po.totalAmount / 100000).toFixed(2)}L
                        </p>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <span className="text-neutral-500">Qty:</span>
                          <span className="text-white ml-1">{po.minQty}-{po.maxQty}</span>
                        </div>
                        <div>
                          <span className="text-neutral-500">Rate:</span>
                          <span className="text-white ml-1">₹{po.rate.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-neutral-500">Date:</span>
                          <span className="text-white ml-1">{po.date.split('T')[0]}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Suggested Actions */}
          <Card className="bg-neutral-800 border-neutral-700">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                <span className="text-xs text-neutral-400">SUGGESTED ACTIONS</span>
              </div>
              
              <ul className="space-y-2">
                {anomaly.suggestedActions.map((action, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-neutral-300">
                    <span className="text-orange-500 mt-0.5">•</span>
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3">
            {onResolve && (
              <Button
                onClick={() => onResolve(anomaly)}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                Mark as Resolved
              </Button>
            )}
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 border-neutral-700 text-neutral-300 hover:bg-neutral-800"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
