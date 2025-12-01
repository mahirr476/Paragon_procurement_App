import type { PoloxyDatabase, PoloxyApprovalRequest } from "./poloxy-types"

export const mockDatabases: PoloxyDatabase[] = [
  {
    id: "db-1",
    code: "a200",
    name: "Head Office",
    apiEndpoint: "https://poloxy.api/a200",
    isConnected: true,
    lastSynced: new Date("2025-01-15T10:30:00"),
  },
  {
    id: "db-2",
    code: "a266",
    name: "Plastics Division",
    apiEndpoint: "https://poloxy.api/a266",
    isConnected: true,
    lastSynced: new Date("2025-01-15T09:45:00"),
  },
  {
    id: "db-3",
    code: "a301",
    name: "Textiles Unit",
    apiEndpoint: "https://poloxy.api/a301",
    isConnected: true,
    lastSynced: new Date("2025-01-15T08:20:00"),
  },
  {
    id: "db-4",
    code: "a415",
    name: "Electronics Hub",
    apiEndpoint: "https://poloxy.api/a415",
    isConnected: true,
    lastSynced: new Date("2025-01-14T16:00:00"),
  },
  {
    id: "db-5",
    code: "a522",
    name: "Logistics Center",
    apiEndpoint: "https://poloxy.api/a522",
    isConnected: true,
    lastSynced: new Date("2025-01-14T14:30:00"),
  },
]

const suppliers = [
  "Fujian Uptop Trading Co. Ltd",
  "ZIPPY & WHIZ",
  "Sanwang Colour Company Limited",
  "Yiwu Gazirobut Garment Co. Ltd",
  "MUSA-ALI SEWING CENTER",
  "Foshan Quanyi Mechanical Co.",
  "Yantai WBE Mold. Co.",
]

const items = [
  "Cotton Fabric Rolls - White",
  "Polyester Thread - Black",
  "Metal Zippers - 12 inch",
  "Plastic Buttons - 15mm",
  "Industrial Sewing Machine",
  "Reactive Dye - Blue",
  "Elastic Bands - 25mm",
  "Cardboard Boxes - Large",
  "Silk Fabric - Premium",
  "Wool Blend Fabric",
]

const units = ["Meters", "Pieces", "Kg", "Liters", "Units", "Spools"]

function generateMockApprovals(db: PoloxyDatabase, count: number): PoloxyApprovalRequest[] {
  const approvals: PoloxyApprovalRequest[] = []

  for (let i = 0; i < count; i++) {
    const rate = Math.floor(Math.random() * 5000) + 100
    const qty = Math.floor(Math.random() * 500) + 10
    const totalAmount = rate * qty

    approvals.push({
      id: `${db.code}-po-${Date.now()}-${i}`,
      databaseId: db.id,
      databaseCode: db.code,
      databaseName: db.name,
      date: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toLocaleDateString("en-GB"),
      supplier: suppliers[Math.floor(Math.random() * suppliers.length)],
      orderNo: `PO-${db.code.toUpperCase()}-${Math.floor(Math.random() * 10000)}`,
      refNo: `REF-${Math.floor(Math.random() * 1000)}`,
      dueDate: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toLocaleDateString("en-GB"),
      branch: db.name,
      requisitionType: Math.random() > 0.5 ? "Standard" : "Urgent",
      itemLedgerGroup: ["Raw Materials", "Accessories", "Machinery", "Chemicals"][Math.floor(Math.random() * 4)],
      item: items[Math.floor(Math.random() * items.length)],
      minQty: Math.floor(qty * 0.8),
      maxQty: qty,
      unit: units[Math.floor(Math.random() * units.length)],
      rate,
      deliveryDate: new Date(Date.now() + Math.random() * 14 * 24 * 60 * 60 * 1000).toLocaleDateString("en-GB"),
      cgst: 9,
      sgst: 9,
      igst: 0,
      vat: 0,
      lastApprovedRate: Math.floor(rate * (0.9 + Math.random() * 0.2)),
      lastSupplier: suppliers[Math.floor(Math.random() * suppliers.length)],
      broker: `Broker ${String.fromCharCode(65 + Math.floor(Math.random() * 5))}`,
      totalAmount,
      status: "pending",
      deliveryType: Math.random() > 0.7 ? "Express" : "Standard",
      openPO: "",
      openPONo: "",
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  }

  return approvals
}

export function fetchMockApprovals(databases: PoloxyDatabase[]): PoloxyApprovalRequest[] {
  const allApprovals: PoloxyApprovalRequest[] = []

  databases.forEach((db) => {
    if (db.isConnected) {
      const count = Math.floor(Math.random() * 8) + 3 // 3-10 approvals per DB
      allApprovals.push(...generateMockApprovals(db, count))
    }
  })

  return allApprovals.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export const availableDatabases: PoloxyDatabase[] = [
  {
    id: "db-available-1",
    code: "a600",
    name: "Warehouse North",
    apiEndpoint: "https://poloxy.api/a600",
    isConnected: false,
    lastSynced: null,
  },
  {
    id: "db-available-2",
    code: "a701",
    name: "Manufacturing Plant",
    apiEndpoint: "https://poloxy.api/a701",
    isConnected: false,
    lastSynced: null,
  },
  {
    id: "db-available-3",
    code: "a825",
    name: "Distribution Center",
    apiEndpoint: "https://poloxy.api/a825",
    isConnected: false,
    lastSynced: null,
  },
]
