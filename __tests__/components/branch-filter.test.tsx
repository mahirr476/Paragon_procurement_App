/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom'
import { render, screen, fireEvent } from '@testing-library/react'
import { BranchFilter } from '@/components/branch-filter'
import type { PurchaseOrder } from '@/lib/types'

function createTestPO(overrides?: Partial<PurchaseOrder>): PurchaseOrder {
  return {
    id: 'PO-1',
    supplier: 'Supplier A',
    branch: 'Branch A',
    totalAmount: 2000,
    ...overrides,
  } as PurchaseOrder
}

describe('BranchFilter Component', () => {
  const mockOnBranchSelect = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders branch filter', () => {
    const pos = [createTestPO({ branch: 'Branch A' })]
    render(<BranchFilter pos={pos} selectedBranch={null} onBranchSelect={mockOnBranchSelect} />)

    expect(screen.getByText(/FILTER BY BRANCH/i)).toBeInTheDocument()
  })

  test('displays branches', () => {
    const pos = [
      createTestPO({ id: 'PO-1', branch: 'Branch A' }),
      createTestPO({ id: 'PO-2', branch: 'Branch B' }),
    ]
    render(<BranchFilter pos={pos} selectedBranch={null} onBranchSelect={mockOnBranchSelect} />)

    expect(screen.getByText('Branch A')).toBeInTheDocument()
    expect(screen.getByText('Branch B')).toBeInTheDocument()
  })

  test('calls onBranchSelect when branch is clicked', () => {
    const pos = [createTestPO({ branch: 'Branch A' })]
    render(<BranchFilter pos={pos} selectedBranch={null} onBranchSelect={mockOnBranchSelect} />)

    const branchButton = screen.getByText('Branch A')
    fireEvent.click(branchButton)

    expect(mockOnBranchSelect).toHaveBeenCalledWith('Branch A')
  })

  test('shows clear filter when branch is selected', () => {
    const pos = [createTestPO({ branch: 'Branch A' })]
    render(<BranchFilter pos={pos} selectedBranch="Branch A" onBranchSelect={mockOnBranchSelect} />)

    expect(screen.getByText(/Clear Filter/i)).toBeInTheDocument()
  })
})

