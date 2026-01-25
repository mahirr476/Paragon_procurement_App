/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { POComparison } from '@/components/po-comparison'
import type { PurchaseOrder, AnalysisResult } from '@/lib/types'
import { analyzeOrders } from '@/lib/analysis'

jest.mock('@/lib/analysis', () => ({
  analyzeOrders: jest.fn(),
}))

jest.mock('@/components/analysis-detail-panel', () => ({
  AnalysisDetailPanel: () => <div data-testid="analysis-panel" />,
}))

const mockedAnalyzeOrders = analyzeOrders as jest.MockedFunction<typeof analyzeOrders>

const createPO = (overrides: Partial<PurchaseOrder> = {}): PurchaseOrder => ({
  id: overrides.id || 'PO-1',
  date: overrides.date || '15/03/24',
  supplier: overrides.supplier || 'ABC Corp',
  orderNo: overrides.orderNo || 'PO-001',
  refNo: overrides.refNo || 'REF-001',
  dueDate: overrides.dueDate || '20/03/24',
  branch: overrides.branch || 'Branch A',
  requisitionType: overrides.requisitionType || 'Type A',
  itemLedgerGroup: overrides.itemLedgerGroup || 'Group A',
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
  status: overrides.status || 'Pending',
  deliveryType: overrides.deliveryType || 'Type A',
  openPO: overrides.openPO || 'Yes',
  openPONo: overrides.openPONo || 'PO-001',
  uploadedAt: overrides.uploadedAt || new Date().toISOString(),
  isApproved: overrides.isApproved ?? false,
  ...overrides,
})

describe('POComparison component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders empty state when there are no current POs', () => {
    mockedAnalyzeOrders.mockReturnValue([])
    render(<POComparison currentPOs={[]} approvedPOs={[]} />)
    expect(screen.getByText(/Upload a CSV to begin analysis/i)).toBeInTheDocument()
  })

  test('renders PO groups with issue badges from analysis', () => {
    const currentPOs = [
      createPO({ id: 'PO-1', supplier: 'Supplier A', totalAmount: 5000 }),
      createPO({ id: 'PO-2', supplier: 'Supplier B', totalAmount: 3000 }),
    ]
    const analysisResults: AnalysisResult[] = [
      {
        id: 'issue-1',
        type: 'price_anomaly',
        severity: 'high',
        message: 'High price detected',
        poId: 'PO-1',
        details: {},
        resolved: false,
      },
    ]

    mockedAnalyzeOrders.mockReturnValue(analysisResults)

    render(<POComparison currentPOs={currentPOs} approvedPOs={[]} />)

    expect(screen.getByText(/UPLOADED PURCHASE ORDERS \(2\)/i)).toBeInTheDocument()
    expect(screen.getByText(/Supplier A/i)).toBeInTheDocument()
    expect(screen.getByText(/Supplier B/i)).toBeInTheDocument()
    expect(screen.getByText(/৳5,000/i)).toBeInTheDocument()
    expect(screen.getByText(/issue found requiring attention/i)).toBeInTheDocument()
    expect(screen.getAllByText(/ISSUE/i).length).toBeGreaterThan(0)
  })

  test('selects all POs and triggers approve callback', () => {
    const currentPOs = [
      createPO({ id: 'PO-1', supplier: 'Supplier A' }),
      createPO({ id: 'PO-2', supplier: 'Supplier B' }),
    ]
    mockedAnalyzeOrders.mockReturnValue([])

    const onApprove = jest.fn()

    render(<POComparison currentPOs={currentPOs} approvedPOs={[]} onApprove={onApprove} />)

    const checkboxes = screen.getAllByRole('checkbox')
    fireEvent.click(checkboxes[0])

    const approveButton = screen.getByRole('button', { name: /Approve Selected/i })
    fireEvent.click(approveButton)

    expect(onApprove).toHaveBeenCalledWith(['PO-1', 'PO-2'])
  })

  test('selects individual group and triggers delete callback', () => {
    const currentPOs = [
      createPO({ id: 'PO-1', supplier: 'Supplier A' }),
      createPO({ id: 'PO-2', supplier: 'Supplier A', orderNo: 'PO-002' }),
    ]
    mockedAnalyzeOrders.mockReturnValue([])
    const onDelete = jest.fn()

    render(<POComparison currentPOs={currentPOs} approvedPOs={[]} onDelete={onDelete} />)

    const groupCheckboxes = screen.getAllByRole('checkbox')
    fireEvent.click(groupCheckboxes[1])

    const deleteButton = screen.getByRole('button', { name: /Delete Selected/i })
    fireEvent.click(deleteButton)

    expect(onDelete).toHaveBeenCalledWith(['PO-1', 'PO-2'])
  })
})

