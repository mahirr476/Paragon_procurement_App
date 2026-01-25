/**
 * @jest-environment jsdom
 */
import {
  getApprovedPOs,
  saveCurrentPOs,
  getCurrentPOs,
  addToApprovedPOs,
  addNotification,
} from '@/lib/storage'
import type { PurchaseOrder } from '@/lib/types'

// Mock fetch globally
global.fetch = jest.fn()

const mockedFetch = global.fetch as jest.MockedFunction<typeof fetch>

describe('Storage Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('getApprovedPOs fetches approved POs', async () => {
    const mockPOs: PurchaseOrder[] = [
      { id: 'PO-1', supplier: 'ABC Corp', isApproved: true } as PurchaseOrder,
    ]

    mockedFetch.mockResolvedValue({
      json: async () => ({ success: true, pos: mockPOs }),
    } as Response)

    const result = await getApprovedPOs()

    expect(result).toEqual(mockPOs)
    expect(mockedFetch).toHaveBeenCalledWith('/api/pos?approved=true')
  })

  test('saveCurrentPOs saves POs', async () => {
    const mockPOs: PurchaseOrder[] = [
      { id: 'PO-1', supplier: 'ABC Corp' } as PurchaseOrder,
    ]

    mockedFetch.mockResolvedValue({
      json: async () => ({ success: true, count: 1 }),
    } as Response)

    const result = await saveCurrentPOs(mockPOs)

    expect(result.success).toBe(true)
    expect(mockedFetch).toHaveBeenCalled()
  })

  test('getCurrentPOs fetches pending POs', async () => {
    const mockPOs: PurchaseOrder[] = [
      { id: 'PO-1', supplier: 'ABC Corp', isApproved: false } as PurchaseOrder,
    ]

    mockedFetch.mockResolvedValue({
      json: async () => ({ success: true, pos: mockPOs }),
    } as Response)

    const result = await getCurrentPOs()

    expect(result).toEqual(mockPOs)
    expect(mockedFetch).toHaveBeenCalledWith('/api/pos?approved=false')
  })

  test('addToApprovedPOs updates POs to approved', async () => {
    const mockPOs: PurchaseOrder[] = [
      { id: 'PO-1', supplier: 'ABC Corp' } as PurchaseOrder,
    ]

    mockedFetch.mockResolvedValue({
      json: async () => ({ success: true, count: 1 }),
    } as Response)

    const result = await addToApprovedPOs(mockPOs)

    expect(result.success).toBe(true)
    expect(mockedFetch).toHaveBeenCalled()
  })

  test('addNotification creates notification', async () => {
    mockedFetch.mockResolvedValue({
      json: async () => ({ success: true, notification: { id: 'notif-1' } }),
    } as Response)

    const result = await addNotification('user-1', {
      type: 'info',
      title: 'Test',
      message: 'Test message',
    })

    expect(result).toBeDefined()
    expect(mockedFetch).toHaveBeenCalled()
  })
})

