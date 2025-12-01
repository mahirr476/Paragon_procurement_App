export interface PoloxyDatabase {
  id: string
  code: string // e.g., "a200", "a266"
  name: string // e.g., "Head Office", "Plastics"
  apiEndpoint: string
  isConnected: boolean
  lastSynced: Date | null
}

export interface PoloxyApprovalRequest {
  id: string
  databaseId: string
  databaseCode: string
  databaseName: string
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
  status: "pending" | "approved" | "rejected"
  deliveryType: string
  openPO: string
  openPONo: string
  createdAt: Date
  updatedAt: Date
}

export interface PoloxyApiResponse {
  success: boolean
  data?: PoloxyApprovalRequest[]
  error?: string
}
