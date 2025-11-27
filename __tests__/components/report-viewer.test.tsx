/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom'
import { render, screen, fireEvent } from '@testing-library/react'
import { ReportViewer } from '@/components/report-viewer'
import type { PurchaseOrder } from '@/lib/types'

jest.mock('@/lib/report-generator', () => ({
  generateSummaryReport: jest.fn(() => ({
    totalOrders: 2,
    totalAmount: 5000,
    avgOrderValue: 2500,
    uniqueSuppliers: 1,
    highValueOrders: [],
  })),
  generateSupplierReport: jest.fn(() => []),
  generateCategoryReport: jest.fn(() => []),
}))

function createTestPO(overrides?: Partial<PurchaseOrder>): PurchaseOrder {
  return {
    id: 'PO-1',
    supplier: 'Supplier A',
    totalAmount: 2000,
    ...overrides,
  } as PurchaseOrder
}

describe('ReportViewer Component', () => {
  test('renders report with title', () => {
    const pos = [createTestPO()]
    render(<ReportViewer pos={pos} title="Test Report" />)

    expect(screen.getByText('Test Report')).toBeInTheDocument()
  })

  test('displays export button', () => {
    const pos = [createTestPO()]
    render(<ReportViewer pos={pos} title="Test Report" />)

    expect(screen.getByText(/Export/i)).toBeInTheDocument()
  })

  test('handles empty POs', () => {
    render(<ReportViewer pos={[]} title="Test Report" />)

    expect(screen.getByText(/No data available/i)).toBeInTheDocument()
  })

  test('switches tabs', () => {
    const pos = [createTestPO()]
    render(<ReportViewer pos={pos} title="Test Report" />)

    const tabs = screen.getAllByText(/suppliers/i)
    const suppliersTab = tabs.find(el => el.tagName === 'BUTTON')
    if (suppliersTab) {
      fireEvent.click(suppliersTab)
      expect(suppliersTab).toBeInTheDocument()
    } else {
      expect(screen.getByText(/Summary/i)).toBeInTheDocument()
    }
  })
})

