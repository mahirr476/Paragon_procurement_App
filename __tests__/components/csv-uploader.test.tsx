/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CSVUploader } from '@/components/csv-uploader'
import { parseCSV } from '@/lib/csv-parser'
import { saveCurrentPOs } from '@/lib/storage'
import type { PurchaseOrder } from '@/lib/types'

jest.mock('@/lib/csv-parser', () => ({
  parseCSV: jest.fn(),
}))

jest.mock('@/lib/storage', () => ({
  saveCurrentPOs: jest.fn(),
}))

const mockedParseCSV = parseCSV as jest.MockedFunction<typeof parseCSV>
const mockedSaveCurrentPOs = saveCurrentPOs as jest.MockedFunction<typeof saveCurrentPOs>

function createTestPO(overrides?: Partial<PurchaseOrder>): PurchaseOrder {
  return {
    id: 'PO-test',
    date: '15/03/24',
    supplier: 'Test Supplier',
    orderNo: 'PO-001',
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
    lastSupplier: 'Supplier X',
    broker: 'Broker A',
    totalAmount: 2000,
    status: 'Pending',
    deliveryType: 'Type A',
    openPO: 'Yes',
    openPONo: 'PO-001',
    uploadedAt: new Date().toISOString(),
    isApproved: false,
    ...overrides,
  }
}

describe('CSVUploader component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const renderUploader = (props = {}) =>
    render(<CSVUploader onUploadSuccess={jest.fn()} {...props} />)

  const mockFileUpload = (fileContent = 'csv content') => {
    const file = new File([fileContent], 'test.csv', { type: 'text/csv' })
    Object.defineProperty(file, 'text', {
      value: jest.fn().mockResolvedValue(fileContent),
    })
    return file
  }

  test('renders upload UI elements', () => {
    renderUploader()

    expect(
      screen.getByText(/UPLOAD NEW PO CSV/i)
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Click to upload CSV/i)
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Select CSV File/i })
    ).toBeInTheDocument()
  })

  test('uploads CSV successfully and shows success message', async () => {
    const onUploadSuccess = jest.fn()
    renderUploader({ onUploadSuccess })

    const mockPOs = [createTestPO(), createTestPO({ id: 'PO-002', supplier: 'XYZ Ltd' })]
    mockedParseCSV.mockReturnValue(mockPOs)
    mockedSaveCurrentPOs.mockResolvedValue({ success: true, count: 2 })

    const file = mockFileUpload('Date,Supplier,Order No.\n...')
    const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement

    fireEvent.change(hiddenInput, { target: { files: [file] } })

    await waitFor(() => {
      expect(mockedParseCSV).toHaveBeenCalledWith('Date,Supplier,Order No.\n...')
      expect(mockedSaveCurrentPOs).toHaveBeenCalledWith(mockPOs)
      expect(onUploadSuccess).toHaveBeenCalledWith(2)
    })

    expect(
      screen.getByText(/Successfully uploaded 2 purchase orders/i)
    ).toBeInTheDocument()
  })

  test('shows error when CSV has no valid POs', async () => {
    renderUploader()

    mockedParseCSV.mockReturnValue([])

    const file = mockFileUpload('invalid csv')
    const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(hiddenInput, { target: { files: [file] } })

    await waitFor(() => {
      expect(screen.getByText(/No valid purchase orders found/i)).toBeInTheDocument()
    })

    expect(mockedSaveCurrentPOs).not.toHaveBeenCalled()
  })

  test('shows error when API save fails', async () => {
    renderUploader()

    mockedParseCSV.mockReturnValue([createTestPO()])
    mockedSaveCurrentPOs.mockResolvedValue({
      success: false,
      count: 0,
      error: 'Failed to save purchase orders to database',
    })

    const file = mockFileUpload('valid csv')
    const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(hiddenInput, { target: { files: [file] } })

    await waitFor(() => {
      expect(screen.getByText(/Failed to save purchase orders to database/i)).toBeInTheDocument()
    })
  })
})

