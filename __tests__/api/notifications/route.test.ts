/**
 * @jest-environment node
 */
import { GET, POST, PUT, DELETE } from '../../../app/api/notifications/route'
import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    notification: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}))

const mockedPrisma = prisma as jest.Mocked<typeof prisma>

describe('API /api/notifications', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('GET /api/notifications fetches notifications', async () => {
    mockedPrisma.notification.findMany.mockResolvedValue([{ id: 'notif-1', userId: 'user-1' }] as any)

    const url = new URL('http://localhost/api/notifications?userId=user-1')
    const request = new NextRequest(url)

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })

  test('POST /api/notifications creates notification', async () => {
    mockedPrisma.notification.create.mockResolvedValue({ id: 'notif-1', userId: 'user-1' } as any)

    const request = new NextRequest('http://localhost/api/notifications', {
      method: 'POST',
      body: JSON.stringify({ userId: 'user-1', type: 'info', title: 'Test', message: 'Test' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })

  test('PUT /api/notifications updates notification', async () => {
    mockedPrisma.notification.update.mockResolvedValue({ id: 'notif-1', read: true } as any)

    const request = new NextRequest('http://localhost/api/notifications', {
      method: 'PUT',
      body: JSON.stringify({ notificationId: 'notif-1', read: true }),
    })

    const response = await PUT(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })

  test('DELETE /api/notifications deletes notification', async () => {
    mockedPrisma.notification.delete.mockResolvedValue({} as any)

    const url = new URL('http://localhost/api/notifications?id=notif-1')
    const request = new NextRequest(url, { method: 'DELETE' })

    const response = await DELETE(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })
})

