/**
 * @jest-environment node
 */
import { GET } from '../../../../app/api/auth/user/route'
import prisma from '@/lib/prisma'
import { NextRequest } from 'next/server'

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
    },
  },
}))

const mockedPrisma = prisma as any

describe('GET /api/auth/user', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('returns current user info', async () => {
    mockedPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
      company: 'Test Co',
      role: 'user',
      createdAt: new Date(),
    } as any)

    const url = new URL('http://localhost/api/auth/user?userId=user-1')
    const request = new NextRequest(url)

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.user.email).toBe('test@example.com')
  })

  test('returns error when user not found', async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(null)

    const url = new URL('http://localhost/api/auth/user?userId=non-existent')
    const request = new NextRequest(url)

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.success).toBe(false)
  })
})

