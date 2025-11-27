/**
 * @jest-environment jsdom
 */
import {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  updateUser,
} from '@/lib/auth'
import type { User } from '@/lib/types'

// Mock fetch globally
global.fetch = jest.fn()
const mockedFetch = global.fetch as jest.MockedFunction<typeof fetch>

describe('Auth Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    sessionStorage.clear()
  })

  test('registerUser registers new user', async () => {
    const mockUser: User = {
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
    } as User

    mockedFetch.mockResolvedValue({
      json: async () => ({ success: true, user: mockUser }),
    } as Response)

    const result = await registerUser('test@example.com', 'password', 'Test User', 'Test Co')

    expect(result.success).toBe(true)
    expect(result.user).toBeDefined()
  })

  test('loginUser logs in user', async () => {
    const mockUser: User = {
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
    } as User

    mockedFetch.mockResolvedValue({
      json: async () => ({ success: true, user: mockUser }),
    } as Response)

    const result = await loginUser('test@example.com', 'password')

    expect(result.success).toBe(true)
    expect(result.user).toBeDefined()
  })

  test('getCurrentUser retrieves user from sessionStorage', () => {
    const mockUser: User = {
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
      createdAt: new Date(),
    } as User

    sessionStorage.setItem('current_user', JSON.stringify(mockUser))

    const result = getCurrentUser()

    expect(result).toBeDefined()
    expect(result?.email).toBe('test@example.com')
  })

  test('logoutUser clears sessionStorage', () => {
    sessionStorage.setItem('current_user', JSON.stringify({ id: 'user-1' }))
    logoutUser()

    expect(sessionStorage.getItem('current_user')).toBeNull()
  })

  test('updateUser updates user', async () => {
    const mockUser: User = {
      id: 'user-1',
      email: 'test@example.com',
      name: 'Updated Name',
    } as User

    mockedFetch.mockResolvedValue({
      json: async () => ({ success: true, user: mockUser }),
    } as Response)

    const result = await updateUser('user-1', { name: 'Updated Name' })

    expect(result.success).toBe(true)
    expect(result.user).toBeDefined()
  })
})

