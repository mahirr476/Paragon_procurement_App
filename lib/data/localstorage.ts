// LocalStorage Implementation (Client-side only)
// This is used as a fallback for client-side operations or development

import {
  IUserRepository,
  IPurchaseOrderRepository,
  IChatRepository,
  INotificationRepository,
  ISettingsRepository,
  IAuthRepository,
  User,
  IDataService
} from './interfaces'
import { PurchaseOrder, ChatSession, Notification } from '../types'

// Helper to safely access localStorage
function safeLocalStorage() {
  if (typeof window === 'undefined') {
    throw new Error('LocalStorage is not available on server side')
  }
  return window.localStorage
}

// Generic localStorage operations
function getFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = safeLocalStorage().getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch {
    return defaultValue
  }
}

function saveToStorage<T>(key: string, data: T): void {
  safeLocalStorage().setItem(key, JSON.stringify(data))
}

// User Repository Implementation
class LocalStorageUserRepository implements IUserRepository {
  private key = 'users'

  async findByEmail(email: string): Promise<User | null> {
    const users = getFromStorage<User[]>(this.key, [])
    return users.find(u => u.email === email) || null
  }

  async create(userData: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    const users = getFromStorage<User[]>(this.key, [])
    
    const newUser: User = {
      ...userData,
      id: Date.now().toString(),
      createdAt: new Date()
    }
    
    users.push(newUser)
    saveToStorage(this.key, users)
    
    return newUser
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    const users = getFromStorage<User[]>(this.key, [])
    const index = users.findIndex(u => u.id === id)
    
    if (index === -1) {
      throw new Error('User not found')
    }
    
    users[index] = { ...users[index], ...data }
    saveToStorage(this.key, users)
    
    return users[index]
  }

  async delete(id: string): Promise<void> {
    const users = getFromStorage<User[]>(this.key, [])
    const filtered = users.filter(u => u.id !== id)
    saveToStorage(this.key, filtered)
  }
}

// Purchase Order Repository Implementation
class LocalStoragePurchaseOrderRepository implements IPurchaseOrderRepository {
  private currentKey = 'current_pos'
  private approvedKey = 'approved_pos'

  async getCurrentPOs(): Promise<PurchaseOrder[]> {
    return getFromStorage<PurchaseOrder[]>(this.currentKey, [])
  }

  async saveCurrentPOs(pos: PurchaseOrder[]): Promise<void> {
    saveToStorage(this.currentKey, pos)
  }

  async addToCurrentPOs(pos: PurchaseOrder[]): Promise<void> {
    const current = await this.getCurrentPOs()
    saveToStorage(this.currentKey, [...current, ...pos])
  }

  async clearCurrentPOs(): Promise<void> {
    saveToStorage(this.currentKey, [])
  }

  async getApprovedPOs(): Promise<PurchaseOrder[]> {
    return getFromStorage<PurchaseOrder[]>(this.approvedKey, [])
  }

  async addToApprovedPOs(pos: PurchaseOrder[]): Promise<void> {
    const approved = await this.getApprovedPOs()
    saveToStorage(this.approvedKey, [...approved, ...pos])
  }

  async deleteApprovedPO(id: string): Promise<void> {
    const approved = await this.getApprovedPOs()
    const filtered = approved.filter(po => po.id !== id)
    saveToStorage(this.approvedKey, filtered)
  }

  async clearApprovedPOs(): Promise<void> {
    saveToStorage(this.approvedKey, [])
  }
}

// Chat Repository Implementation
class LocalStorageChatRepository implements IChatRepository {
  private key = 'chat_sessions'

  async getChatSessions(): Promise<ChatSession[]> {
    return getFromStorage<ChatSession[]>(this.key, [])
  }

  async getChatSession(id: string): Promise<ChatSession | null> {
    const sessions = await this.getChatSessions()
    return sessions.find(s => s.id === id) || null
  }

  async saveChatSession(session: ChatSession): Promise<void> {
    const sessions = await this.getChatSessions()
    const index = sessions.findIndex(s => s.id === session.id)
    
    if (index !== -1) {
      sessions[index] = session
    } else {
      sessions.push(session)
    }
    
    saveToStorage(this.key, sessions)
  }

  async deleteChatSession(id: string): Promise<void> {
    const sessions = await this.getChatSessions()
    const filtered = sessions.filter(s => s.id !== id)
    saveToStorage(this.key, filtered)
  }
}

// Notification Repository Implementation
class LocalStorageNotificationRepository implements INotificationRepository {
  private key = 'notifications'

  async getNotifications(): Promise<Notification[]> {
    return getFromStorage<Notification[]>(this.key, [])
  }

  async addNotification(notificationData: Omit<Notification, 'id' | 'timestamp' | 'read'>): Promise<void> {
    const notifications = await this.getNotifications()
    
    const newNotification: Notification = {
      ...notificationData,
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false
    }
    
    notifications.unshift(newNotification)
    saveToStorage(this.key, notifications)
  }

  async markAsRead(id: string): Promise<void> {
    const notifications = await this.getNotifications()
    const notification = notifications.find(n => n.id === id)
    
    if (notification) {
      notification.read = true
      saveToStorage(this.key, notifications)
    }
  }

  async clearNotifications(): Promise<void> {
    saveToStorage(this.key, [])
  }
}

// Settings Repository Implementation
class LocalStorageSettingsRepository implements ISettingsRepository {
  private key = 'settings'

  async getTutorialsCompleted(): Promise<Set<string>> {
    const settings = getFromStorage<{ tutorialsCompleted: string[] }>(
      this.key,
      { tutorialsCompleted: [] }
    )
    return new Set(settings.tutorialsCompleted)
  }

  async markTutorialComplete(tutorialId: string): Promise<void> {
    const completed = await this.getTutorialsCompleted()
    completed.add(tutorialId)
    saveToStorage(this.key, {
      tutorialsCompleted: Array.from(completed)
    })
  }

  async skipAllTutorials(): Promise<void> {
    saveToStorage(this.key, {
      tutorialsCompleted: ['all']
    })
  }

  async resetTutorials(): Promise<void> {
    saveToStorage(this.key, {
      tutorialsCompleted: []
    })
  }
}

// Auth Repository Implementation
class LocalStorageAuthRepository implements IAuthRepository {
  private userRepo: IUserRepository
  private sessionKey = 'current_user'
  private usersKey = 'users'

  constructor(userRepo: IUserRepository) {
    this.userRepo = userRepo
  }

  async getCurrentUser(): Promise<User | null> {
    const user = getFromStorage<User | null>(this.sessionKey, null)
    return user
  }

  async login(email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
    const users = getFromStorage<Array<User & { password: string }>>(this.usersKey, [])
    const user = users.find(u => u.email === email)
    
    if (!user || user.password !== password) {
      return { success: false, error: 'Invalid credentials' }
    }
    
    const { password: _, ...userWithoutPassword } = user
    saveToStorage(this.sessionKey, userWithoutPassword)
    
    return { success: true, user: userWithoutPassword }
  }

  async logout(): Promise<void> {
    safeLocalStorage().removeItem(this.sessionKey)
  }

  async register(
    email: string,
    password: string,
    name: string,
    company: string
  ): Promise<{ success: boolean; error?: string }> {
    const existingUser = await this.userRepo.findByEmail(email)
    
    if (existingUser) {
      return { success: false, error: 'Email already registered' }
    }
    
    const users = getFromStorage<Array<User & { password: string }>>(this.usersKey, [])
    
    const newUser = {
      id: Date.now().toString(),
      email,
      password, // In production, this should be hashed
      name,
      company,
      createdAt: new Date()
    }
    
    users.push(newUser)
    saveToStorage(this.usersKey, users)
    
    return { success: true }
  }
}

// Main Data Service Implementation
class LocalStorageDataService implements IDataService {
  users: IUserRepository
  purchaseOrders: IPurchaseOrderRepository
  chats: IChatRepository
  notifications: INotificationRepository
  settings: ISettingsRepository
  auth: IAuthRepository

  constructor() {
    this.users = new LocalStorageUserRepository()
    this.purchaseOrders = new LocalStoragePurchaseOrderRepository()
    this.chats = new LocalStorageChatRepository()
    this.notifications = new LocalStorageNotificationRepository()
    this.settings = new LocalStorageSettingsRepository()
    this.auth = new LocalStorageAuthRepository(this.users)
  }
}

// Export singleton instance
export const localStorageService = new LocalStorageDataService()