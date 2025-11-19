import { User } from './types'

const CURRENT_USER_KEY = 'current_user'
const USERS_KEY = 'users'

export function registerUser(email: string, password: string, name: string, company: string): { success: boolean; error?: string; user?: User } {
  const users = getUsers()
  
  // Check if user already exists
  if (users.find(u => u.email === email)) {
    return { success: false, error: 'Email already registered' }
  }

  // Create new user
  const user: User = {
    id: Math.random().toString(36).substring(7),
    email,
    name,
    company,
    role: 'user',
    createdAt: new Date()
  }

  // Store password separately (in production, use proper hashing)
  const userAuth = { email, password }
  const authData = getUsersAuth()
  authData.push(userAuth)
  localStorage.setItem('users_auth', JSON.stringify(authData))

  // Store user data
  users.push(user)
  localStorage.setItem(USERS_KEY, JSON.stringify(users))

  return { success: true, user }
}

export function loginUser(email: string, password: string): { success: boolean; error?: string; user?: User } {
  const authData = getUsersAuth()
  const userAuth = authData.find(u => u.email === email && u.password === password)

  if (!userAuth) {
    return { success: false, error: 'Invalid email or password' }
  }

  const users = getUsers()
  const user = users.find(u => u.email === email)

  if (!user) {
    return { success: false, error: 'User not found' }
  }

  // Store current user
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user))
  
  return { success: true, user }
}

export function logoutUser() {
  localStorage.removeItem(CURRENT_USER_KEY)
}

export function getCurrentUser(): User | null {
  const data = localStorage.getItem(CURRENT_USER_KEY)
  if (!data) return null
  const user = JSON.parse(data)
  return { ...user, createdAt: new Date(user.createdAt) }
}

export function updateUser(userId: string, updates: Partial<User>): { success: boolean; error?: string; user?: User } {
  const users = getUsers()
  const index = users.findIndex(u => u.id === userId)

  if (index === -1) {
    return { success: false, error: 'User not found' }
  }

  users[index] = { ...users[index], ...updates }
  localStorage.setItem(USERS_KEY, JSON.stringify(users))

  // Update current user if it's the same
  const currentUser = getCurrentUser()
  if (currentUser?.id === userId) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(users[index]))
  }

  return { success: true, user: users[index] }
}

export function deleteUser(userId: string): { success: boolean; error?: string } {
  const users = getUsers()
  const filtered = users.filter(u => u.id !== userId)
  
  if (users.length === filtered.length) {
    return { success: false, error: 'User not found' }
  }

  localStorage.setItem(USERS_KEY, JSON.stringify(filtered))

  // If deleting current user, log out
  const currentUser = getCurrentUser()
  if (currentUser?.id === userId) {
    logoutUser()
  }

  return { success: true }
}

function getUsers(): User[] {
  const data = localStorage.getItem(USERS_KEY)
  if (!data) return []
  const users = JSON.parse(data)
  return users.map((u: any) => ({
    ...u,
    createdAt: new Date(u.createdAt)
  }))
}

function getUsersAuth(): Array<{ email: string; password: string }> {
  const data = localStorage.getItem('users_auth')
  return data ? JSON.parse(data) : []
}
