/**
 * @jest-environment node
 */
import { POST } from '../../../../app/api/chat/messages/route'
import prisma from '@/lib/prisma'
import { NextRequest } from 'next/server'

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    chatMessage: {
      create: jest.fn(),
    },
    chatSession: {
      update: jest.fn(),
    },
  },
}))

const mockedPrisma = prisma as any

describe('API /api/chat/messages', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('POST /api/chat/messages creates message', async () => {
    const mockMessage = {
      id: 'msg-1',
      sessionId: 'session-1',
      role: 'user',
      content: 'Hello',
      timestamp: new Date(),
    }

    mockedPrisma.chatMessage.create.mockResolvedValue(mockMessage)
    mockedPrisma.chatSession.update.mockResolvedValue({})

    const request = new NextRequest('http://localhost/api/chat/messages', {
      method: 'POST',
      body: JSON.stringify({
        sessionId: 'session-1',
        role: 'user',
        content: 'Hello',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.message).toBeDefined()
  })
})

