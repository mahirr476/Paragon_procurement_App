/**
 * @jest-environment node
 */
import { GET, POST } from '../../../app/api/theme/route'
import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    theme: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
  },
}))

const mockedPrisma = prisma as jest.Mocked<typeof prisma>

describe('API /api/theme', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('GET /api/theme fetches theme', async () => {
    mockedPrisma.theme.findUnique.mockResolvedValue({ id: 'theme-1', userId: 'user-1', themeName: 'dark' } as any)

    const url = new URL('http://localhost/api/theme?userId=user-1')
    const request = new NextRequest(url)

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })

  test('POST /api/theme saves theme', async () => {
    mockedPrisma.theme.upsert.mockResolvedValue({ id: 'theme-1', userId: 'user-1', themeName: 'light' } as any)

    const request = new NextRequest('http://localhost/api/theme', {
      method: 'POST',
      body: JSON.stringify({ userId: 'user-1', themeName: 'light' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })
})

