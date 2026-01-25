/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom'
import { render } from '@testing-library/react'
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

describe('Frontend Performance', () => {
  jest.setTimeout(10000)

  test('renders 100 POs quickly', () => {
    const pos = Array.from({ length: 100 }, (_, i) =>
      createTestPO({ id: `PO-${i}`, supplier: `Supplier ${i}` })
    )

    const start = Date.now()
    render(<DashboardStats currentPOs={pos} approvedPOs={[]} />)
    const duration = Date.now() - start

    expect(duration).toBeLessThan(1000) // Should render in under 1 second
  })

  test('renders 1000 POs within reasonable time', () => {
    const pos = Array.from({ length: 1000 }, (_, i) =>
      createTestPO({ id: `PO-${i}`, supplier: `Supplier ${i}` })
    )

    const start = Date.now()
    render(<DashboardStats currentPOs={pos} approvedPOs={[]} />)
    const duration = Date.now() - start

    expect(duration).toBeLessThan(3000) // Should render in under 3 seconds
  })

  test('handles component re-renders efficiently', () => {
    const pos = Array.from({ length: 100 }, (_, i) =>
      createTestPO({ id: `PO-${i}` })
    )

    const { rerender } = render(<DashboardStats currentPOs={pos} approvedPOs={[]} />)

    const start = Date.now()
    rerender(<DashboardStats currentPOs={[...pos, createTestPO({ id: 'PO-101' })]} approvedPOs={[]} />)
    const duration = Date.now() - start

    expect(duration).toBeLessThan(500) // Should re-render quickly
  })
})

