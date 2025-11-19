import { prisma } from './prisma'
import { User } from './types'
import bcrypt from 'bcryptjs'

export async function registerUser(
  email: string,
  password: string,
  name: string,
  company: string
): Promise<{ success: boolean; error?: string; user?: User }> {
  try {
    // Check if user exists
    const existing = await prisma.user.findUnique({
      where: { email }
    })

    if (existing) {
      return { success: false, error: 'Email already registered' }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        company,
        role: 'user'
      }
    })

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        company: user.company,
        role: user.role,
        createdAt: user.createdAt
      }
    }
  } catch (error) {
    console.error('[v0] Registration error:', error)
    return { success: false, error: 'Registration failed' }
  }
}

export async function loginUser(
  email: string,
  password: string
): Promise<{ success: boolean; error?: string; user?: User }> {
  try {
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return { success: false, error: 'Invalid email or password' }
    }

    // Verify password
    const valid = await bcrypt.compare(password, user.password)

    if (!valid) {
      return { success: false, error: 'Invalid email or password' }
    }

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        company: user.company,
        role: user.role,
        createdAt: user.createdAt
      }
    }
  } catch (error) {
    console.error('[v0] Login error:', error)
    return { success: false, error: 'Login failed' }
  }
}

export async function logoutUser() {
  // Invalidate token or session if applicable
  return
} 


export async function getCurrentUser(userId: string): Promise<User | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    return user
  } catch (error) {
    console.error('[v0] Get current user error:', error)
    return null
  }
}


export async function updateUser(
  userId: string,
  updates: Partial<Omit<User, 'id' | 'createdAt'>>
): Promise<{ success: boolean; error?: string; user?: User }> {
  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: updates
    })

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        company: user.company,
        role: user.role,
        createdAt: user.createdAt
      }
    }
  } catch (error) {
    console.error('[v0] Update user error:', error)
    return { success: false, error: 'User not found' }
  }
}

export async function deleteUser(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.user.delete({
      where: { id: userId }
    })
    return { success: true }
  } catch (error) {
    console.error('[v0] Delete user error:', error)
    return { success: false, error: 'User not found' }
  }
}

export async function getUserById(userId: string): Promise<User | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) return null

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      company: user.company,
      role: user.role,
      createdAt: user.createdAt
    }
  } catch (error) {
    console.error('[v0] Get user error:', error)
    return null
  }
}