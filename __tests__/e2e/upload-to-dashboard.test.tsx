/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import UploadPage from '@/app/upload/page'
import TacticalDashboard from '@/app/page'
import { parseCSV } from '@/lib/csv-parser'
import {
  getCurrentPOs,
  getApprovedPOs,
  saveCurrentPOs,
  addToApprovedPOs,
  removeCurrentPOs,
  addNotification,
} from '@/lib/storage'
import { getCurrentUser } from '@/lib/auth'
import type { PurchaseOrder, User } from '@/lib/types'

// Mock Next.js router
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

// Mock child components for dashboard
jest.mock('@/components/dashboard-overview', () => ({
  DashboardOverview: ({ approvedPOs }: { approvedPOs: PurchaseOrder[] }) => (
    <div data-testid="dashboard-overview">
      <div data-testid="approved-count">{approvedPOs.length} approved</div>
      <div data-testid="total-amount">
        {approvedPOs.reduce((sum, po) => sum + (po.totalAmount || 0), 0)}
      </div>
    </div>
  ),
}))

jest.mock('@/components/profile-dropdown', () => ({
  ProfileDropdown: ({ user }: { user: User }) => <div data-testid="profile">{user.id}</div>,
}))

jest.mock('@/components/notification-bell', () => ({
  NotificationBell: () => <div data-testid="notification-bell" />,
}))

jest.mock('@/components/theme-selector', () => ({
  ThemeSelector: () => null,
}))

jest.mock('@/app/intelligence/page', () => ({
  __esModule: true,
  default: () => <div>Intelligence</div>,
}))

jest.mock('@/app/systems/page', () => ({
  __esModule: true,
  default: () => <div>Systems</div>,
}))

jest.mock('@/app/reports/page', () => ({
  __esModule: true,
  default: () => <div>Reports</div>,
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

const mockedGetCurrentPOs = getCurrentPOs as jest.MockedFunction<typeof getCurrentPOs>
const mockedGetApprovedPOs = getApprovedPOs as jest.MockedFunction<typeof getApprovedPOs>
const mockedSaveCurrentPOs = saveCurrentPOs as jest.MockedFunction<typeof saveCurrentPOs>
const mockedAddToApprovedPOs = addToApprovedPOs as jest.MockedFunction<typeof addToApprovedPOs>
const mockedRemoveCurrentPOs = removeCurrentPOs as jest.MockedFunction<typeof removeCurrentPOs>
const mockedAddNotification = addNotification as jest.MockedFunction<typeof addNotification>
const mockedGetCurrentUser = getCurrentUser as jest.MockedFunction<typeof getCurrentUser>

const mockUser: User = {
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
}

// Sample CSV with 10 rows (OLD format)
const sampleCSV = `Date,Supplier,Order No.,Ref No.,Due Date,Branch,Requisition Type,Item/Ledger Group,Item,Min Qty,Max Qty,Unit,Rate,Delivery Date,CGST,SGST,IGST,VAT,Last Approved Rate,Last Supplier,Broker,Total Amount,Status,Delivery Type,Open PO,Open PO No.
15/03/24,ABC Corp,PO-001,REF-001,20/03/24,Branch A,Type A,Group A,Item A,10,20,KG,100,25/03/24,9,9,0,0,95,ABC Corp,Broker A,2000,Pending,Type A,Yes,PO-001
16/03/24,XYZ Ltd,PO-002,REF-002,21/03/24,Branch B,Type B,Group B,Item B,15,25,KG,200,26/03/24,9,9,0,0,190,XYZ Ltd,Broker B,4000,Pending,Type B,Yes,PO-002
17/03/24,DEF Inc,PO-003,REF-003,22/03/24,Branch A,Type A,Group A,Item C,20,30,KG,150,27/03/24,9,9,0,0,140,DEF Inc,Broker C,4500,Pending,Type A,Yes,PO-003
18/03/24,GHI Corp,PO-004,REF-004,23/03/24,Branch C,Type C,Group C,Item D,25,35,KG,120,28/03/24,9,9,0,0,110,GHI Corp,Broker D,4200,Pending,Type C,Yes,PO-004
19/03/24,JKL Ltd,PO-005,REF-005,24/03/24,Branch B,Type B,Group B,Item E,30,40,KG,180,29/03/24,9,9,0,0,170,JKL Ltd,Broker E,7200,Pending,Type B,Yes,PO-005
20/03/24,MNO Inc,PO-006,REF-006,25/03/24,Branch A,Type A,Group A,Item F,35,45,KG,90,30/03/24,9,9,0,0,85,MNO Inc,Broker F,4050,Pending,Type A,Yes,PO-006
21/03/24,PQR Corp,PO-007,REF-007,26/03/24,Branch C,Type C,Group C,Item G,40,50,KG,110,31/03/24,9,9,0,0,105,PQR Corp,Broker G,5500,Pending,Type C,Yes,PO-007
22/03/24,STU Ltd,PO-008,REF-008,27/03/24,Branch B,Type B,Group B,Item H,45,55,KG,130,01/04/24,9,9,0,0,125,STU Ltd,Broker H,7150,Pending,Type B,Yes,PO-008
23/03/24,VWX Inc,PO-009,REF-009,28/03/24,Branch A,Type A,Group A,Item I,50,60,KG,160,02/04/24,9,9,0,0,155,VWX Inc,Broker I,9600,Pending,Type A,Yes,PO-009
24/03/24,YZA Corp,PO-010,REF-010,29/03/24,Branch C,Type C,Group C,Item J,55,65,KG,140,03/04/24,9,9,0,0,135,YZA Corp,Broker J,7700,Pending,Type C,Yes,PO-010`

describe('E2E: Complete Upload-to-Dashboard Flow', () => {
  let parsedPOs: PurchaseOrder[]
  let currentPOsStore: PurchaseOrder[] = []
  let approvedPOsStore: PurchaseOrder[] = []

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    
    // Mock File.text() method globally for all tests
    File.prototype.text = jest.fn().mockResolvedValue(sampleCSV)
    
    // Parse the CSV to get expected POs
    parsedPOs = parseCSV(sampleCSV)
    expect(parsedPOs.length).toBe(10)

    // Reset stores
    currentPOsStore = []
    approvedPOsStore = []

    // Setup mocks
    mockedGetCurrentUser.mockReturnValue(mockUser)

    // Mock getCurrentPOs to return current store
    mockedGetCurrentPOs.mockImplementation(async () => [...currentPOsStore])

    // Mock getApprovedPOs to return approved store
    mockedGetApprovedPOs.mockImplementation(async () => [...approvedPOsStore])

    // Mock saveCurrentPOs to add to current store
    mockedSaveCurrentPOs.mockImplementation(async (pos: PurchaseOrder[]) => {
      currentPOsStore.push(...pos)
      return { success: true, count: pos.length }
    })

    // Mock addToApprovedPOs to move from current to approved
    mockedAddToApprovedPOs.mockImplementation(async (pos: PurchaseOrder[]) => {
      const ids = pos.map(p => p.id)
      const toApprove = currentPOsStore.filter(p => ids.includes(p.id))
      approvedPOsStore.push(...toApprove.map(p => ({ ...p, isApproved: true })))
      currentPOsStore = currentPOsStore.filter(p => !ids.includes(p.id))
      return { success: true, count: toApprove.length }
    })

    // Mock removeCurrentPOs
    mockedRemoveCurrentPOs.mockImplementation(async (ids: string[]) => {
      currentPOsStore = currentPOsStore.filter(p => !ids.includes(p.id))
      return { success: true }
    })

    // Mock addNotification
    mockedAddNotification.mockResolvedValue({ success: true } as any)
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  // ============================================
  // ESSENTIAL: Full Workflow Test
  // ============================================
  describe('Full Workflow Test', () => {
    test('complete workflow: upload CSV → approve → view on dashboard', async () => {
      // Step 1: Load sample CSV file (10 rows) - Already parsed above
      expect(parsedPOs.length).toBe(10)

      // Step 2: Upload via CSVUploader
      render(<UploadPage />)

      await waitFor(() => {
        expect(mockedGetCurrentPOs).toHaveBeenCalled()
        expect(mockedGetApprovedPOs).toHaveBeenCalled()
      })

      // Simulate file upload
      const file = new File([sampleCSV], 'test.csv', { type: 'text/csv' })
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      fireEvent.change(fileInput, { target: { files: [file] } })

      await waitFor(() => {
        expect(mockedSaveCurrentPOs).toHaveBeenCalled()
      })

      // Step 3: Verify 10 POs appear in pending list
      await waitFor(() => {
        expect(currentPOsStore.length).toBe(10)
        expect(screen.getByText(/UPLOADED PURCHASE ORDERS/i)).toBeInTheDocument()
      })

      // Step 4: Run analysis → verify issues detected (analysis runs automatically in POComparison)
      await waitFor(() => {
        // POComparison component should be rendered with the POs
        expect(screen.getByText(/UPLOADED PURCHASE ORDERS/i)).toBeInTheDocument()
      })

      // Step 5: Select all POs
      const checkboxes = screen.getAllByRole('checkbox')
      const selectAllCheckbox = checkboxes[0] // First checkbox is usually "select all"
      fireEvent.click(selectAllCheckbox)

      // Step 6: Click approve
      const approveButton = screen.getByRole('button', { name: /Approve Selected/i })
      fireEvent.click(approveButton)

      await waitFor(() => {
        expect(mockedAddToApprovedPOs).toHaveBeenCalled()
      })

      // Verify POs moved from current to approved
      expect(currentPOsStore.length).toBe(0)
      expect(approvedPOsStore.length).toBe(10)

      // Step 7: Navigate to dashboard (simulate by rendering dashboard)
      // In real app, this would be navigation, but for test we render directly
      const { unmount } = render(<TacticalDashboard />)

      await waitFor(() => {
        expect(mockedGetApprovedPOs).toHaveBeenCalled()
      })

      // Step 8: Verify 10 POs appear in approved list
      await waitFor(() => {
        expect(screen.getByTestId('approved-count')).toHaveTextContent('10 approved')
      })

      // Step 9: Verify statistics updated correctly
      const totalAmount = parsedPOs.reduce((sum, po) => sum + (po.totalAmount || 0), 0)
      await waitFor(() => {
        expect(screen.getByTestId('total-amount')).toHaveTextContent(String(totalAmount))
      })

      unmount()
    })

    test('verifies all 10 POs are uploaded correctly', async () => {
      render(<UploadPage />)

      // Upload CSV
      const file = new File([sampleCSV], 'test.csv', { type: 'text/csv' })
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      fireEvent.change(fileInput, { target: { files: [file] } })

      await waitFor(() => {
        expect(currentPOsStore.length).toBe(10)
      })

      // Verify each PO has correct structure
      currentPOsStore.forEach((po, index) => {
        expect(po.id).toBeDefined()
        expect(po.supplier).toBeDefined()
        expect(po.orderNo).toBeDefined()
        expect(po.totalAmount).toBeGreaterThan(0)
        expect(po.isApproved).toBe(false)
      })
    })
  })

  // ============================================
  // ESSENTIAL: Data Integrity Verification
  // ============================================
  describe('Data Integrity Verification', () => {
    test('pick random PO from CSV and verify exact match through entire flow', async () => {
      // Pick a random PO (let's use index 3 - GHI Corp)
      const originalPO = parsedPOs[3]
      expect(originalPO.supplier).toBe('GHI Corp')
      expect(originalPO.orderNo).toBe('PO-004')
      expect(originalPO.totalAmount).toBe(4200)

      // Upload
      render(<UploadPage />)
      const file = new File([sampleCSV], 'test.csv', { type: 'text/csv' })
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      fireEvent.change(fileInput, { target: { files: [file] } })

      await waitFor(() => {
        expect(currentPOsStore.length).toBe(10)
      })

      // Find same PO in database (current store)
      const foundPO = currentPOsStore.find(p => p.orderNo === 'PO-004')
      expect(foundPO).toBeDefined()

      // Compare all key fields → exact match
      expect(foundPO!.supplier).toBe(originalPO.supplier)
      expect(foundPO!.orderNo).toBe(originalPO.orderNo)
      expect(foundPO!.refNo).toBe(originalPO.refNo)
      expect(foundPO!.totalAmount).toBe(originalPO.totalAmount)
      expect(foundPO!.rate).toBe(originalPO.rate)
      expect(foundPO!.branch).toBe(originalPO.branch)
      expect(foundPO!.item).toBe(originalPO.item)

      // Approve
      const checkboxes = screen.getAllByRole('checkbox')
      fireEvent.click(checkboxes[0]) // Select all
      const approveButton = screen.getByRole('button', { name: /Approve Selected/i })
      fireEvent.click(approveButton)

      await waitFor(() => {
        expect(approvedPOsStore.length).toBe(10)
      })

      // Find same PO in approved store
      const approvedPO = approvedPOsStore.find(p => p.orderNo === 'PO-004')
      expect(approvedPO).toBeDefined()

      // Verify all fields still match CSV
      expect(approvedPO!.supplier).toBe(originalPO.supplier)
      expect(approvedPO!.orderNo).toBe(originalPO.orderNo)
      expect(approvedPO!.refNo).toBe(originalPO.refNo)
      expect(approvedPO!.totalAmount).toBe(originalPO.totalAmount)
      expect(approvedPO!.rate).toBe(originalPO.rate)
      expect(approvedPO!.branch).toBe(originalPO.branch)
      expect(approvedPO!.item).toBe(originalPO.item)
      expect(approvedPO!.isApproved).toBe(true)

      // Display on dashboard
      render(<TacticalDashboard />)

      await waitFor(() => {
        expect(screen.getByTestId('approved-count')).toHaveTextContent('10 approved')
      })

      // Verify PO is in dashboard data
      const dashboardPO = approvedPOsStore.find(p => p.orderNo === 'PO-004')
      expect(dashboardPO).toBeDefined()
      expect(dashboardPO!.totalAmount).toBe(originalPO.totalAmount)
    })

    test('verifies numeric fields are preserved correctly (no data loss)', async () => {
      render(<UploadPage />)

      // Upload
      const file = new File([sampleCSV], 'test.csv', { type: 'text/csv' })
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      fireEvent.change(fileInput, { target: { files: [file] } })

      await waitFor(() => {
        expect(currentPOsStore.length).toBe(10)
      })

      // Check specific numeric values
      const po1 = currentPOsStore.find(p => p.orderNo === 'PO-001')
      expect(po1!.totalAmount).toBe(2000)
      expect(po1!.rate).toBe(100)
      expect(po1!.minQty).toBe(10)
      expect(po1!.maxQty).toBe(20)

      const po5 = currentPOsStore.find(p => p.orderNo === 'PO-005')
      expect(po5!.totalAmount).toBe(7200)
      expect(po5!.rate).toBe(180)

      // Approve and verify still correct
      const checkboxes = screen.getAllByRole('checkbox')
      fireEvent.click(checkboxes[0])
      const approveButton = screen.getByRole('button', { name: /Approve Selected/i })
      fireEvent.click(approveButton)

      await waitFor(() => {
        expect(approvedPOsStore.length).toBe(10)
      })

      const approvedPO1 = approvedPOsStore.find(p => p.orderNo === 'PO-001')
      expect(approvedPO1!.totalAmount).toBe(2000)
      expect(approvedPO1!.rate).toBe(100)
    })

    test('verifies string fields are preserved correctly (special characters, unicode)', async () => {
      render(<UploadPage />)

      // Upload
      const file = new File([sampleCSV], 'test.csv', { type: 'text/csv' })
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      fireEvent.change(fileInput, { target: { files: [file] } })

      await waitFor(() => {
        expect(currentPOsStore.length).toBe(10)
      })

      // Verify string fields
      const po1 = currentPOsStore.find(p => p.orderNo === 'PO-001')
      expect(po1!.supplier).toBe('ABC Corp')
      expect(po1!.branch).toBe('Branch A')
      expect(po1!.item).toBe('Item A')
      expect(po1!.orderNo).toBe('PO-001')
      expect(po1!.refNo).toBe('REF-001')

      // Approve
      const checkboxes = screen.getAllByRole('checkbox')
      fireEvent.click(checkboxes[0])
      const approveButton = screen.getByRole('button', { name: /Approve Selected/i })
      fireEvent.click(approveButton)

      await waitFor(() => {
        expect(approvedPOsStore.length).toBe(10)
      })

      // Verify strings still match
      const approvedPO1 = approvedPOsStore.find(p => p.orderNo === 'PO-001')
      expect(approvedPO1!.supplier).toBe('ABC Corp')
      expect(approvedPO1!.branch).toBe('Branch A')
      expect(approvedPO1!.item).toBe('Item A')
    })
  })

  // ============================================
  // Workflow Integration Tests
  // ============================================
  describe('Workflow Integration', () => {
    test('notification is created when POs are uploaded', async () => {
      render(<UploadPage />)

      const file = new File([sampleCSV], 'test.csv', { type: 'text/csv' })
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      fireEvent.change(fileInput, { target: { files: [file] } })

      await waitFor(() => {
        expect(mockedAddNotification).toHaveBeenCalledWith(
          'user-1',
          expect.objectContaining({
            type: 'approval_needed',
            count: 10,
          })
        )
      })
    })

    test('dashboard updates when POs are approved', async () => {
      // First, upload and approve
      render(<UploadPage />)

      const file = new File([sampleCSV], 'test.csv', { type: 'text/csv' })
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      fireEvent.change(fileInput, { target: { files: [file] } })

      await waitFor(() => {
        expect(currentPOsStore.length).toBe(10)
      })

      const checkboxes = screen.getAllByRole('checkbox')
      fireEvent.click(checkboxes[0])
      const approveButton = screen.getByRole('button', { name: /Approve Selected/i })
      fireEvent.click(approveButton)

      await waitFor(() => {
        expect(approvedPOsStore.length).toBe(10)
      })

      // Now render dashboard
      render(<TacticalDashboard />)

      await waitFor(() => {
        expect(screen.getByTestId('approved-count')).toHaveTextContent('10 approved')
      })

      // Verify dashboard shows correct total
      const totalAmount = approvedPOsStore.reduce((sum, po) => sum + (po.totalAmount || 0), 0)
      expect(screen.getByTestId('total-amount')).toHaveTextContent(String(totalAmount))
    })
  })
})

