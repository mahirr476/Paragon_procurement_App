/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import UploadPage from '@/app/upload/page'
import { getApprovedPOs, getCurrentPOs, addToApprovedPOs, clearCurrentPOs, addNotification, removeCurrentPOs } from '@/lib/storage'
import { getCurrentUser } from '@/lib/auth'
import type { PurchaseOrder } from '@/lib/types'

jest.mock('@/components/csv-uploader', () => ({
  CSVUploader: ({ onUploadSuccess }: { onUploadSuccess: (count: number) => void }) => (
    <button onClick={() => onUploadSuccess(2)} data-testid="mock-uploader">
      Mock Upload
    </button>
  ),
}))

jest.mock('@/components/po-comparison', () => ({
  POComparison: ({ onApprove, onDelete }: { onApprove: (ids: string[]) => void; onDelete: (ids: string[]) => void }) => (
    <div>
      <button onClick={() => onApprove(['PO-1'])} data-testid="approve-selected">
        Approve Selected
      </button>
      <button onClick={() => onDelete(['PO-1'])} data-testid="delete-selected">
        Delete Selected
      </button>
    </div>
  ),
}))

jest.mock('@/components/dashboard-stats', () => ({
  DashboardStats: () => <div data-testid="dashboard-stats" />,
}))

jest.mock('@/lib/storage')
jest.mock('@/lib/auth')

const mockedGetCurrentPOs = getCurrentPOs as jest.MockedFunction<typeof getCurrentPOs>
const mockedGetApprovedPOs = getApprovedPOs as jest.MockedFunction<typeof getApprovedPOs>
const mockedAddToApprovedPOs = addToApprovedPOs as jest.MockedFunction<typeof addToApprovedPOs>
const mockedClearCurrentPOs = clearCurrentPOs as jest.MockedFunction<typeof clearCurrentPOs>
const mockedAddNotification = addNotification as jest.MockedFunction<typeof addNotification>
const mockedRemoveCurrentPOs = removeCurrentPOs as jest.MockedFunction<typeof removeCurrentPOs>
const mockedGetCurrentUser = getCurrentUser as jest.MockedFunction<typeof getCurrentUser>

const createPO = (overrides: Partial<PurchaseOrder> = {}): PurchaseOrder => ({
  id: overrides.id || 'PO-1',
  date: '15/03/24',
  supplier: 'Supplier A',
  orderNo: overrides.orderNo || 'PO-001',
  refNo: 'REF-001',
  dueDate: '20/03/24',
  branch: 'Branch A',
  requisitionType: 'Type A',
  itemLedgerGroup: 'Group A',
  item: 'Item A',
  minQty: 10,
  maxQty: 20,
  unit: 'KG',
  rate: 100,
  deliveryDate: '25/03/24',
  cgst: 9,
  sgst: 9,
  igst: 0,
  vat: 0,
  lastApprovedRate: 95,
  lastSupplier: 'Supplier B',
  broker: 'Broker',
  totalAmount: 2000,
  status: 'Pending',
  deliveryType: 'Type A',
  openPO: 'Yes',
  openPONo: 'PO-001',
  uploadedAt: new Date().toISOString(),
  isApproved: overrides.isApproved ?? false,
  ...overrides,
})

describe('UploadPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedGetCurrentPOs.mockResolvedValue([createPO()])
    mockedGetApprovedPOs.mockResolvedValue([createPO({ id: 'PO-APP', isApproved: true })])
    mockedAddToApprovedPOs.mockResolvedValue({ success: true, count: 1 })
    mockedAddNotification.mockResolvedValue({ success: true } as any)
    mockedRemoveCurrentPOs.mockResolvedValue({ success: true } as any)
    mockedClearCurrentPOs.mockResolvedValue({ success: true } as any)
    mockedGetCurrentUser.mockReturnValue({ id: 'user-1' } as any)
  })

  test('loads current and approved POs on mount', async () => {
    render(<UploadPage />)

    await waitFor(() => {
      expect(mockedGetCurrentPOs).toHaveBeenCalled()
      expect(mockedGetApprovedPOs).toHaveBeenCalled()
      expect(screen.getByText(/approved orders/i)).toBeInTheDocument()
    })
    expect(screen.getByText(/UPLOAD & REVIEW/i)).toBeInTheDocument()
    expect(screen.getByTestId('dashboard-stats')).toBeInTheDocument()
  })

  test('handles upload success and creates notification', async () => {
    render(<UploadPage />)
    await waitFor(() => expect(mockedGetCurrentPOs).toHaveBeenCalledTimes(1))

    fireEvent.click(screen.getByTestId('mock-uploader'))

    await waitFor(() => {
      expect(mockedGetCurrentPOs).toHaveBeenCalledTimes(2)
      expect(mockedAddNotification).toHaveBeenCalledWith('user-1', expect.objectContaining({
        type: 'approval_needed',
        count: 2,
      }))
    })
  })

  test('approves selected POs via POComparison callbacks', async () => {
    const dispatchSpy = jest.spyOn(window, 'dispatchEvent')
    render(<UploadPage />)
    await waitFor(() => expect(screen.getByText(/approved orders/i)).toBeInTheDocument())

    fireEvent.click(screen.getByTestId('approve-selected'))

    await waitFor(() => {
      expect(mockedAddToApprovedPOs).toHaveBeenCalledWith(expect.arrayContaining([
        expect.objectContaining({ id: 'PO-1', isApproved: true }),
      ]))
      expect(mockedGetApprovedPOs).toHaveBeenCalledTimes(2)
      expect(dispatchSpy).toHaveBeenCalledWith(expect.any(CustomEvent))
    })
  })

  test('deletes selected POs via POComparison callbacks', async () => {
    render(<UploadPage />)
    await waitFor(() => expect(mockedGetCurrentPOs).toHaveBeenCalled())

    fireEvent.click(screen.getByTestId('delete-selected'))

    await waitFor(() => {
      expect(mockedRemoveCurrentPOs).toHaveBeenCalledWith(['PO-1'])
      expect(mockedGetCurrentPOs).toHaveBeenCalledTimes(2)
    })
  })
})

