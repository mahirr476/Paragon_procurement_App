/**
 * @jest-environment node
 */
import { GET, PUT, DELETE } from '../../../../app/api/auth/user/route'
import prisma from '@/lib/prisma'
import { NextRequest } from 'next/server'

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
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

  test('PUT /api/auth/user updates user', async () => {
    mockedPrisma.user.update.mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
      name: 'Updated Name',
    } as any)

    const request = new NextRequest('http://localhost/api/auth/user', {
      method: 'PUT',
      body: JSON.stringify({ userId: 'user-1', updates: { name: 'Updated Name' } }),
    })

    const response = await PUT(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })

  test('DELETE /api/auth/user deletes user', async () => {
    mockedPrisma.user.delete.mockResolvedValue({} as any)

    const url = new URL('http://localhost/api/auth/user?userId=user-1')
    const request = new NextRequest(url, { method: 'DELETE' })

    const response = await DELETE(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })
})

