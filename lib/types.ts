export interface PurchaseOrder {
  id: string
  date: string
  supplier: string
  orderNo: string
  refNo: string
  dueDate: string
  branch: string
  requisitionType: string
  itemLedgerGroup: string
  item: string
  minQty: number
  maxQty: number
  unit: string
  rate: number
  deliveryDate: string
  cgst: number
  sgst: number
  igst: number
  vat: number
  lastApprovedRate: number
  lastSupplier: string
  broker: string
  totalAmount: number
  status: string
  deliveryType: string
  openPO: string
  openPONo: string
  uploadedAt: string
  isApproved: boolean
  approvalNotes?: string
}

export interface AnalysisResult {
  type: 'price_anomaly' | 'duplicate' | 'pattern' | 'risk_flag'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  poId: string
  details: Record<string, unknown>
}

export interface DashboardStats {
  totalPOs: number
  totalAmount: number
  averageOrderValue: number
  uniqueSuppliers: number
  pendingApproval: number
  percentageChange: number
}

export interface TrendData {
  date: string
  count: number
  amount: number
  supplier?: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export interface ChatSession {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: Date
  updatedAt: Date
}

export interface User {
  id: string
  email: string
  name: string
  company: string
  role: string
  createdAt: Date
}

export interface Notification {
  id: string
  type: 'po_upload' | 'approval_needed' | 'anomaly_detected' | 'system'
  title: string
  message: string
  count?: number
  severity: 'info' | 'warning' | 'error'
  createdAt: Date
  read: boolean
  link?: string
}
