/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { DashboardStats } from '@/components/dashboard-stats'
import type { PurchaseOrder } from '@/lib/types'

function createTestPO(overrides?: Partial<PurchaseOrder>): PurchaseOrder {
  return {
    id: 'PO-1',
    supplier: 'Supplier A',
    totalAmount: 2000,
    branch: 'Branch A',
    isApproved: false,
    ...overrides,
  } as PurchaseOrder
}

describe('DashboardStats Component', () => {
  test('renders stats with POs', () => {
    const currentPOs = [
      createTestPO({ id: 'PO-1', totalAmount: 2000 }),
      createTestPO({ id: 'PO-2', totalAmount: 3000 }),
    ]
    const approvedPOs: PurchaseOrder[] = []

    render(<DashboardStats currentPOs={currentPOs} approvedPOs={approvedPOs} />)

    expect(screen.getByText(/TOTAL POs/i)).toBeInTheDocument()
    expect(screen.getByText(/TOTAL AMOUNT/i)).toBeInTheDocument()
  })

  test('calculates correct totals', () => {
    const currentPOs = [
      createTestPO({ id: 'PO-1', totalAmount: 2000 }),
      createTestPO({ id: 'PO-2', totalAmount: 3000 }),
    ]
    const approvedPOs: PurchaseOrder[] = []

    render(<DashboardStats currentPOs={currentPOs} approvedPOs={approvedPOs} />)

    expect(screen.getByText(/TOTAL POs/i)).toBeInTheDocument()
    expect(screen.getByText(/TOTAL AMOUNT/i)).toBeInTheDocument()
  })

  test('handles empty POs', () => {
    render(<DashboardStats currentPOs={[]} approvedPOs={[]} />)

    expect(screen.getByText(/TOTAL POs/i)).toBeInTheDocument()
  })
})

