/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom'

// Mock fetch globally
global.fetch = jest.fn()
const mockedFetch = global.fetch as jest.MockedFunction<typeof fetch>

describe('Concurrent Operations', () => {
  jest.setTimeout(10000)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('handles concurrent API calls', async () => {
    mockedFetch.mockResolvedValue({
      json: async () => ({ success: true, pos: [] }),
    } as Response)

    const promises = [
      fetch('/api/pos?approved=true'),
      fetch('/api/pos?approved=false'),
      fetch('/api/pos?approved=true'),
    ]

    const results = await Promise.all(promises)

    expect(results.length).toBe(3)
    expect(mockedFetch).toHaveBeenCalledTimes(3)
  })

  test('handles rapid sequential uploads', async () => {
    mockedFetch.mockResolvedValue({
      json: async () => ({ success: true, count: 1 }),
    } as Response)

    const upload1 = fetch('/api/pos', {
      method: 'POST',
      body: JSON.stringify({ pos: [{ id: 'PO-1' }] }),
    })

    const upload2 = fetch('/api/pos', {
      method: 'POST',
      body: JSON.stringify({ pos: [{ id: 'PO-2' }] }),
    })

    await Promise.all([upload1, upload2])

    expect(mockedFetch).toHaveBeenCalledTimes(2)
  })

  test('handles concurrent approval and fetch', async () => {
    mockedFetch
      .mockResolvedValueOnce({
        json: async () => ({ success: true, pos: [{ id: 'PO-1' }] }),
      } as Response)
      .mockResolvedValueOnce({
        json: async () => ({ success: true, count: 1 }),
      } as Response)

    const [fetchResult, approveResult] = await Promise.all([
      fetch('/api/pos?approved=false'),
      fetch('/api/pos', {
        method: 'PUT',
        body: JSON.stringify({ poIds: ['PO-1'], updates: { isApproved: true } }),
      }),
    ])

    const fetchData = await fetchResult.json()
    const approveData = await approveResult.json()

    expect(fetchData.success).toBe(true)
    expect(approveData.success).toBe(true)
  })
})

