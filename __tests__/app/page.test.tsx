/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import TacticalDashboard from '@/app/page'
import { getApprovedPOs } from '@/lib/storage'
import { getCurrentUser } from '@/lib/auth'
import type { PurchaseOrder, User } from '@/lib/types'

// Mock Next.js router
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

// Mock child components
jest.mock('@/components/dashboard-overview', () => ({
  DashboardOverview: ({ approvedPOs }: { approvedPOs: PurchaseOrder[] }) => (
    <div data-testid="dashboard-overview">
      <div data-testid="po-count">{approvedPOs.length} POs</div>
    </div>
  ),
}))

jest.mock('@/components/profile-dropdown', () => ({
  ProfileDropdown: ({ user }: { user: User }) => (
    <div data-testid="profile-dropdown">{user.id}</div>
  ),
}))

jest.mock('@/components/notification-bell', () => ({
  NotificationBell: () => <div data-testid="notification-bell" />,
}))

jest.mock('@/components/theme-selector', () => ({
  ThemeSelector: () => <div data-testid="theme-selector" />,
}))

jest.mock('@/app/upload/page', () => ({
  __esModule: true,
  default: () => <div data-testid="upload-page">Upload Page</div>,
}))

jest.mock('@/app/intelligence/page', () => ({
  __esModule: true,
  default: () => <div data-testid="intelligence-page">Intelligence Page</div>,
}))

jest.mock('@/app/systems/page', () => ({
  __esModule: true,
  default: () => <div data-testid="systems-page">Systems Page</div>,
}))

jest.mock('@/app/reports/page', () => ({
  __esModule: true,
  default: () => <div data-testid="reports-page">Reports Page</div>,
}))

jest.mock('@/components/interactive-tour', () => ({
  InteractiveTour: () => null,
}))

jest.mock('@/components/skip-tutorials-dialog', () => ({
  SkipTutorialsDialog: () => null,
}))

// Mock storage and auth
jest.mock('@/lib/storage')
jest.mock('@/lib/auth')

const mockedGetApprovedPOs = getApprovedPOs as jest.MockedFunction<typeof getApprovedPOs>
const mockedGetCurrentUser = getCurrentUser as jest.MockedFunction<typeof getCurrentUser>

const createPO = (overrides: Partial<PurchaseOrder> = {}): PurchaseOrder => ({
  id: overrides.id || 'PO-1',
  date: '15/03/24',
  supplier: overrides.supplier || 'Supplier A',
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
  lastSupplier: 'Supplier X',
  broker: 'Broker A',
  totalAmount: overrides.totalAmount ?? 2000,
  status: 'Approved',
  deliveryType: 'Type A',
  openPO: 'Yes',
  openPONo: 'PO-001',
  uploadedAt: new Date().toISOString(),
  isApproved: true,
  ...overrides,
})

const mockUser: User = {
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
}

describe('Dashboard Page (app/page.tsx)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    mockedGetCurrentUser.mockReturnValue(mockUser)
    mockedGetApprovedPOs.mockResolvedValue([
      createPO({ id: 'PO-1', supplier: 'Supplier A', totalAmount: 5000 }),
      createPO({ id: 'PO-2', supplier: 'Supplier B', totalAmount: 3000 }),
    ])
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  // ============================================
  // ESSENTIAL: Initial Load Tests
  // ============================================
  describe('Initial Load Tests', () => {
    test('fetches approved POs on mount', async () => {
      render(<TacticalDashboard />)

      await waitFor(() => {
        expect(mockedGetApprovedPOs).toHaveBeenCalled()
      })

      expect(screen.getByTestId('dashboard-overview')).toBeInTheDocument()
    })

    test('displays PO statistics via DashboardOverview', async () => {
      render(<TacticalDashboard />)

      await waitFor(() => {
        expect(screen.getByTestId('po-count')).toHaveTextContent('2 POs')
      })
    })

    test('shows chart visualizations in DashboardOverview', async () => {
      render(<TacticalDashboard />)

      await waitFor(() => {
        expect(screen.getByTestId('dashboard-overview')).toBeInTheDocument()
      })
    })

    test('redirects to login when user is not authenticated', async () => {
      mockedGetCurrentUser.mockReturnValue(null)

      render(<TacticalDashboard />)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login')
      })
    })

    test('renders sidebar navigation', async () => {
      render(<TacticalDashboard />)

      await waitFor(() => {
        expect(screen.getByText(/DASHBOARD/i)).toBeInTheDocument()
        expect(screen.getByText(/UPLOAD/i)).toBeInTheDocument()
        expect(screen.getByText(/REPORTS/i)).toBeInTheDocument()
      })
    })

    test('renders top toolbar with user info', async () => {
      render(<TacticalDashboard />)

      await waitFor(() => {
        expect(screen.getByTestId('profile-dropdown')).toBeInTheDocument()
        expect(screen.getByTestId('notification-bell')).toBeInTheDocument()
      })
    })
  })

  // ============================================
  // ESSENTIAL: Auto-Refresh Tests
  // ============================================
  describe('Auto-Refresh Tests', () => {
    test('refreshes every 3 seconds when on overview section', async () => {
      render(<TacticalDashboard />)

      await waitFor(() => {
        // Component calls getApprovedPOs multiple times on mount (from different useEffects)
        expect(mockedGetApprovedPOs).toHaveBeenCalled()
      })

      const initialCallCount = mockedGetApprovedPOs.mock.calls.length

      // Fast-forward 3 seconds
      jest.advanceTimersByTime(3000)

      await waitFor(() => {
        // Should be called more times after 3 seconds
        expect(mockedGetApprovedPOs.mock.calls.length).toBeGreaterThan(initialCallCount)
      })
    })

    test('refreshes on window focus when on overview section', async () => {
      render(<TacticalDashboard />)

      await waitFor(() => {
        expect(mockedGetApprovedPOs).toHaveBeenCalled()
      })

      const initialCallCount = mockedGetApprovedPOs.mock.calls.length

      // Simulate window focus event
      fireEvent(window, new Event('focus'))

      await waitFor(() => {
        // Should be called more times after focus event
        expect(mockedGetApprovedPOs.mock.calls.length).toBeGreaterThan(initialCallCount)
      })
    })

    test('listens to pos-approved event and refreshes data', async () => {
      render(<TacticalDashboard />)

      await waitFor(() => {
        expect(mockedGetApprovedPOs).toHaveBeenCalled()
      })

      const initialCallCount = mockedGetApprovedPOs.mock.calls.length

      // Simulate pos-approved event
      const event = new CustomEvent('pos-approved')
      window.dispatchEvent(event)

      await waitFor(() => {
        // Should be called more times after pos-approved event
        expect(mockedGetApprovedPOs.mock.calls.length).toBeGreaterThan(initialCallCount)
      })
    })

    test('updates data when new POs are approved', async () => {
      render(<TacticalDashboard />)

      await waitFor(() => {
        expect(screen.getByTestId('po-count')).toHaveTextContent('2 POs')
      })

      // Update mock to return more POs
      mockedGetApprovedPOs.mockResolvedValue([
        createPO({ id: 'PO-1' }),
        createPO({ id: 'PO-2' }),
        createPO({ id: 'PO-3' }),
      ])

      // Trigger refresh via event
      window.dispatchEvent(new CustomEvent('pos-approved'))

      await waitFor(() => {
        expect(screen.getByTestId('po-count')).toHaveTextContent('3 POs')
      })
    })

    test('does not refresh when not on overview section', async () => {
      render(<TacticalDashboard />)

      // Switch to upload section
      const uploadButton = screen.getByText(/UPLOAD/i)
      fireEvent.click(uploadButton)

      await waitFor(() => {
        expect(screen.getByTestId('upload-page')).toBeInTheDocument()
      })

      const initialCallCount = mockedGetApprovedPOs.mock.calls.length

      // Fast-forward 3 seconds
      jest.advanceTimersByTime(3000)

      // Should not have refreshed
      expect(mockedGetApprovedPOs).toHaveBeenCalledTimes(initialCallCount)
    })
  })

  // ============================================
  // ESSENTIAL: Data Display Tests
  // ============================================
  describe('Data Display Tests', () => {
    test('stats reflect actual PO data', async () => {
      const mockPOs = [
        createPO({ id: 'PO-1', totalAmount: 5000 }),
        createPO({ id: 'PO-2', totalAmount: 3000 }),
      ]

      mockedGetApprovedPOs.mockResolvedValue(mockPOs)

      render(<TacticalDashboard />)

      await waitFor(() => {
        expect(screen.getByTestId('po-count')).toHaveTextContent('2 POs')
      })
    })

    test('charts update when data changes', async () => {
      render(<TacticalDashboard />)

      await waitFor(() => {
        expect(screen.getByTestId('po-count')).toHaveTextContent('2 POs')
      })

      // Update with new data
      mockedGetApprovedPOs.mockResolvedValue([
        createPO({ id: 'PO-1' }),
        createPO({ id: 'PO-2' }),
        createPO({ id: 'PO-3' }),
      ])

      window.dispatchEvent(new CustomEvent('pos-approved'))

      await waitFor(() => {
        expect(screen.getByTestId('po-count')).toHaveTextContent('3 POs')
      })
    })

    test('empty state when no approved POs', async () => {
      mockedGetApprovedPOs.mockResolvedValue([])

      render(<TacticalDashboard />)

      await waitFor(() => {
        expect(screen.getByTestId('po-count')).toHaveTextContent('0 POs')
      })
    })

    test('handles errors gracefully when fetching POs fails', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
      mockedGetApprovedPOs.mockRejectedValue(new Error('Failed to fetch'))

      render(<TacticalDashboard />)

      await waitFor(() => {
        expect(mockedGetApprovedPOs).toHaveBeenCalled()
      })

      // Should still render the page
      expect(screen.getByTestId('dashboard-overview')).toBeInTheDocument()

      consoleErrorSpy.mockRestore()
    })
  })

  // ============================================
  // Section Navigation Tests
  // ============================================
  describe('Section Navigation', () => {
    test('switches between sections when clicking navigation items', async () => {
      render(<TacticalDashboard />)

      await waitFor(() => {
        expect(screen.getByTestId('dashboard-overview')).toBeInTheDocument()
      })

      // Click Upload
      fireEvent.click(screen.getByText(/UPLOAD/i))
      expect(screen.getByTestId('upload-page')).toBeInTheDocument()

      // Click Reports
      fireEvent.click(screen.getByText(/REPORTS/i))
      expect(screen.getByTestId('reports-page')).toBeInTheDocument()

      // Click Dashboard
      fireEvent.click(screen.getByText(/DASHBOARD/i))
      expect(screen.getByTestId('dashboard-overview')).toBeInTheDocument()
    })

    test('highlights active section in sidebar', async () => {
      render(<TacticalDashboard />)

      const dashboardButton = screen.getByText(/DASHBOARD/i).closest('button')
      expect(dashboardButton).toHaveClass('bg-accent')
    })
  })
})

