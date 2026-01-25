/**
 * @jest-environment node
 */
import { GET } from '../../../app/api/health/route'
import { prisma } from '@/lib/prisma'

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    $queryRaw: jest.fn(),
  },
}))

const mockedPrisma = prisma as jest.Mocked<typeof prisma>

describe('API /api/health', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('GET /api/health returns healthy status', async () => {
    mockedPrisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }] as any)

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.status).toBe('healthy')
    expect(data.database).toBe('connected')
  })
})

