/**
 * @jest-environment node
 */
import { GET, POST, DELETE } from '../../../app/api/tutorials/route'
import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    tutorial: {
      findMany: jest.fn(),
      upsert: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
}))

const mockedPrisma = prisma as jest.Mocked<typeof prisma>

describe('API /api/tutorials', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('GET /api/tutorials fetches tutorials', async () => {
    mockedPrisma.tutorial.findMany.mockResolvedValue([{ id: 'tut-1', userId: 'user-1', tutorialId: 'tutorial-1', completed: true }] as any)

    const url = new URL('http://localhost/api/tutorials?userId=user-1')
    const request = new NextRequest(url)

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })

  test('POST /api/tutorials marks tutorial complete', async () => {
    mockedPrisma.tutorial.upsert.mockResolvedValue({ id: 'tut-1', userId: 'user-1', tutorialId: 'tutorial-1', completed: true } as any)

    const request = new NextRequest('http://localhost/api/tutorials', {
      method: 'POST',
      body: JSON.stringify({ userId: 'user-1', tutorialId: 'tutorial-1' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })

  test('DELETE /api/tutorials deletes tutorials', async () => {
    mockedPrisma.tutorial.deleteMany.mockResolvedValue({ count: 2 } as any)

    const url = new URL('http://localhost/api/tutorials?userId=user-1')
    const request = new NextRequest(url, { method: 'DELETE' })

    const response = await DELETE(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })
})

