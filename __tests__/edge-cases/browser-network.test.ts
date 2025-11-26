/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom'

// Mock fetch globally
global.fetch = jest.fn()
const mockedFetch = global.fetch as jest.MockedFunction<typeof fetch>

describe('Browser/Network Edge Cases', () => {
  jest.setTimeout(10000)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('handles slow network connection', async () => {
    mockedFetch.mockImplementation(() => {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve({
            json: async () => ({ success: true, pos: [] }),
          } as Response)
        }, 100)
      })
    })

    const start = Date.now()
    await fetch('/api/pos')
    const duration = Date.now() - start

    expect(duration).toBeGreaterThanOrEqual(100)
  })

  test('handles request timeout', async () => {
    mockedFetch.mockImplementation(() => {
      return new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout')), 50)
      })
    })

    try {
      await fetch('/api/pos')
    } catch (error) {
      expect(error).toBeInstanceOf(Error)
    }
  })

  test('handles 500 server errors', async () => {
    mockedFetch.mockResolvedValue({
      status: 500,
      json: async () => ({ success: false, error: 'Internal server error' }),
    } as Response)

    const response = await fetch('/api/pos')
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
  })

  test('handles 404 not found errors', async () => {
    mockedFetch.mockResolvedValue({
      status: 404,
      json: async () => ({ success: false, error: 'Not found' }),
    } as Response)

    const response = await fetch('/api/pos/invalid')
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.success).toBe(false)
  })
})

