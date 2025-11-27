/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom'
import { render, screen, fireEvent } from '@testing-library/react'
import { DashboardOverview } from '@/components/dashboard-overview'
import type { PurchaseOrder } from '@/lib/types'

jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="chart">{children}</div>,
  BarChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PieChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  Bar: () => <div data-testid="bar" />,
  Pie: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Cell: () => <div data-testid="cell" />,
}))

const createPO = (overrides: Partial<PurchaseOrder> = {}): PurchaseOrder => ({
  id: overrides.id || 'PO-1',
  date: overrides.date || '15/03/24',
  supplier: overrides.supplier || 'Supplier A',
  orderNo: overrides.orderNo || 'PO-001',
  refNo: overrides.refNo || 'REF-001',
  dueDate: overrides.dueDate || '20/03/24',
  branch: overrides.branch || 'Branch A',
  requisitionType: overrides.requisitionType || 'Type A',
  itemLedgerGroup: overrides.itemLedgerGroup || 'Category A',
  item: overrides.item || 'Item A',
  minQty: overrides.minQty ?? 10,
  maxQty: overrides.maxQty ?? 20,
  unit: overrides.unit || 'KG',
  rate: overrides.rate ?? 100,
  deliveryDate: overrides.deliveryDate || '25/03/24',
  cgst: overrides.cgst ?? 9,
  sgst: overrides.sgst ?? 9,
  igst: overrides.igst ?? 0,
  vat: overrides.vat ?? 0,
  lastApprovedRate: overrides.lastApprovedRate ?? 95,
  lastSupplier: overrides.lastSupplier || 'Supplier X',
  broker: overrides.broker || 'Broker A',
  totalAmount: overrides.totalAmount ?? 2000,
  status: overrides.status || 'Approved',
  deliveryType: overrides.deliveryType || 'Type A',
  openPO: overrides.openPO || 'Yes',
  openPONo: overrides.openPONo || 'PO-001',
  uploadedAt: overrides.uploadedAt || new Date().toISOString(),
  isApproved: overrides.isApproved ?? true,
  ...overrides,
})

const mockPOs = [
  createPO({ id: 'PO-1', supplier: 'Supplier A', branch: 'Branch A', totalAmount: 5000, itemLedgerGroup: 'Category A' }),
  createPO({ id: 'PO-2', supplier: 'Supplier B', branch: 'Branch B', totalAmount: 3000, itemLedgerGroup: 'Category B' }),
  createPO({ id: 'PO-3', supplier: 'Supplier A', branch: 'Branch A', totalAmount: 2000, itemLedgerGroup: 'Category A' }),
]

describe('DashboardOverview component', () => {
  test('renders header and metrics', () => {
    render(<DashboardOverview approvedPOs={mockPOs} />)

    expect(screen.getByText(/DASHBOARD OVERVIEW/i)).toBeInTheDocument()
    expect(screen.getByText(/TOTAL AMOUNT/i)).toBeInTheDocument()
    expect(screen.getByText(/TOTAL ORDERS/i)).toBeInTheDocument()
    expect(screen.getByText(/AVG ORDER VALUE/i)).toBeInTheDocument()
    const metricLabels = screen.getAllByText(/SUPPLIERS/i, { selector: 'p' })
    expect(metricLabels.length).toBeGreaterThan(0)
    expect(screen.getAllByText(/BRANCHES/i, { selector: 'p' }).length).toBeGreaterThan(0)
    expect(screen.getByText(/৳10,000/i)).toBeInTheDocument()
  })

  test('filters by branch, supplier, and category', () => {
    render(<DashboardOverview approvedPOs={mockPOs} />)

    const branchSelect = screen.getAllByRole('combobox')[0]
    fireEvent.click(branchSelect)
    fireEvent.click(screen.getByText('Branch A'))

    const supplierSelect = screen.getAllByRole('combobox')[1]
    fireEvent.click(supplierSelect)
    fireEvent.click(screen.getByText('Supplier A'))

    const categorySelect = screen.getAllByRole('combobox')[2]
    fireEvent.click(categorySelect)
    fireEvent.click(screen.getByText('Category A'))

    expect(screen.getByText(/2 \/ 3/i)).toBeInTheDocument()
  })

  test('search filters recent orders list', () => {
    render(<DashboardOverview approvedPOs={mockPOs} />)

    const searchInput = screen.getByPlaceholderText(/Search items, suppliers, PO#/i)
    fireEvent.change(searchInput, { target: { value: 'Supplier B' } })

    expect(screen.getByText(/Supplier B/i)).toBeInTheDocument()
    expect(screen.queryByText(/Supplier A/i)).not.toBeInTheDocument()
  })

  test('renders chart placeholders', () => {
    render(<DashboardOverview approvedPOs={mockPOs} />)

    expect(screen.getAllByTestId('chart').length).toBeGreaterThan(0)
  })
})

