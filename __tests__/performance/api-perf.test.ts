/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom'

// Mock fetch globally
global.fetch = jest.fn()
const mockedFetch = global.fetch as jest.MockedFunction<typeof fetch>

describe('API Performance', () => {
  jest.setTimeout(10000)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('saves 100 POs quickly', async () => {
    const mockPOs = Array.from({ length: 100 }, (_, i) => ({ id: `PO-${i}`, supplier: `Supplier ${i}` }))

    mockedFetch.mockResolvedValue({
      json: async () => ({ success: true, count: 100 }),
    } as Response)

    const start = Date.now()
    const response = await fetch('/api/pos', {
      method: 'POST',
      body: JSON.stringify({ pos: mockPOs }),
    })
    const data = await response.json()
    const duration = Date.now() - start

    expect(data.success).toBe(true)
    expect(data.count).toBe(100)
    expect(duration).toBeLessThan(1000) // Should complete in under 1 second
  })

  test('fetches 1000 POs within reasonable time', async () => {
    const mockPOs = Array.from({ length: 1000 }, (_, i) => ({ id: `PO-${i}`, supplier: `Supplier ${i}` }))

    mockedFetch.mockResolvedValue({
      json: async () => ({ success: true, pos: mockPOs }),
    } as Response)

    const start = Date.now()
    const response = await fetch('/api/pos?approved=true')
    const data = await response.json()
    const duration = Date.now() - start

    expect(data.success).toBe(true)
    expect(data.pos.length).toBe(1000)
    expect(duration).toBeLessThan(2000) // Should complete in under 2 seconds
  })

  test('updates 100 POs quickly', async () => {
    const poIds = Array.from({ length: 100 }, (_, i) => `PO-${i}`)

    mockedFetch.mockResolvedValue({
      json: async () => ({ success: true, count: 100 }),
    } as Response)

    const start = Date.now()
    const response = await fetch('/api/pos', {
      method: 'PUT',
      body: JSON.stringify({ poIds, updates: { isApproved: true } }),
    })
    const data = await response.json()
    const duration = Date.now() - start

    expect(data.success).toBe(true)
    expect(data.count).toBe(100)
    expect(duration).toBeLessThan(1000) // Should complete in under 1 second
  })
})

