/**
 * @jest-environment node
 */
import { GET, POST, PUT, DELETE } from '../../../../app/api/chat/sessions/route'
import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    chatSession: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}))

const mockedPrisma = prisma as jest.Mocked<typeof prisma>

describe('API /api/chat/sessions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('GET /api/chat/sessions fetches sessions', async () => {
    mockedPrisma.chatSession.findMany.mockResolvedValue([{ id: 'session-1', userId: 'user-1' }] as any)

    const url = new URL('http://localhost/api/chat/sessions?userId=user-1')
    const request = new NextRequest(url)

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })

  test('POST /api/chat/sessions creates session', async () => {
    mockedPrisma.chatSession.create.mockResolvedValue({ id: 'session-1', userId: 'user-1' } as any)

    const request = new NextRequest('http://localhost/api/chat/sessions', {
      method: 'POST',
      body: JSON.stringify({ userId: 'user-1', title: 'New Chat' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })

  test('PUT /api/chat/sessions updates session', async () => {
    mockedPrisma.chatSession.update.mockResolvedValue({ id: 'session-1' } as any)

    const request = new NextRequest('http://localhost/api/chat/sessions', {
      method: 'PUT',
      body: JSON.stringify({ sessionId: 'session-1', updates: { title: 'Updated' } }),
    })

    const response = await PUT(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })

  test('DELETE /api/chat/sessions deletes session', async () => {
    mockedPrisma.chatSession.delete.mockResolvedValue({} as any)

    const url = new URL('http://localhost/api/chat/sessions?sessionId=session-1')
    const request = new NextRequest(url, { method: 'DELETE' })

    const response = await DELETE(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })
})

