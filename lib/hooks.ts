// React Hooks for Data Operations
// These hooks provide a clean interface for components to interact with the data layer

'use client'

import { useState, useEffect, useCallback } from 'react'
import { PurchaseOrder, ChatSession, Notification } from './types'

// API Helper function
async function apiCall(endpoint: string, options?: RequestInit) {
  const response = await fetch(endpoint, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'API request failed')
  }

  return response.json()
}

// Purchase Order Hooks
export function useCurrentPOs() {
  const [pos, setPOs] = useState<PurchaseOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      setLoading(true)
      const result = await apiCall('/api/pos?type=current')
      setPOs(result.data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch POs')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const savePOs = useCallback(async (newPOs: PurchaseOrder[]) => {
    try {
      await apiCall('/api/pos', {
        method: 'POST',
        body: JSON.stringify({ action: 'saveCurrent', data: newPOs }),
      })
      setPOs(newPOs)
    } catch (err) {
      throw err
    }
  }, [])

  const addPOs = useCallback(async (newPOs: PurchaseOrder[]) => {
    try {
      await apiCall('/api/pos', {
        method: 'POST',
        body: JSON.stringify({ action: 'addToCurrent', data: newPOs }),
      })
      await refresh()
    } catch (err) {
      throw err
    }
  }, [refresh])

  const clear = useCallback(async () => {
    try {
      await apiCall('/api/pos', {
        method: 'POST',
        body: JSON.stringify({ action: 'clearCurrent' }),
      })
      setPOs([])
    } catch (err) {
      throw err
    }
  }, [])

  return { pos, loading, error, refresh, savePOs, addPOs, clear }
}

export function useApprovedPOs() {
  const [pos, setPOs] = useState<PurchaseOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      setLoading(true)
      const result = await apiCall('/api/pos?type=approved')
      setPOs(result.data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch POs')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const addPOs = useCallback(async (newPOs: PurchaseOrder[]) => {
    try {
      await apiCall('/api/pos', {
        method: 'POST',
        body: JSON.stringify({ action: 'addToApproved', data: newPOs }),
      })
      await refresh()
    } catch (err) {
      throw err
    }
  }, [refresh])

  const deletePO = useCallback(async (id: string) => {
    try {
      await apiCall('/api/pos', {
        method: 'POST',
        body: JSON.stringify({ action: 'deleteApproved', data: { id } }),
      })
      await refresh()
    } catch (err) {
      throw err
    }
  }, [refresh])

  const clear = useCallback(async () => {
    try {
      await apiCall('/api/pos', {
        method: 'POST',
        body: JSON.stringify({ action: 'clearApproved' }),
      })
      setPOs([])
    } catch (err) {
      throw err
    }
  }, [])

  return { pos, loading, error, refresh, addPOs, deletePO, clear }
}

// Chat Hooks
export function useChatSessions() {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      setLoading(true)
      const result = await apiCall('/api/chats')
      setSessions(result.data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch chat sessions')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const saveSession = useCallback(async (session: ChatSession) => {
    try {
      await apiCall('/api/chats', {
        method: 'POST',
        body: JSON.stringify({ action: 'save', data: session }),
      })
      await refresh()
    } catch (err) {
      throw err
    }
  }, [refresh])

  const deleteSession = useCallback(async (id: string) => {
    try {
      await apiCall('/api/chats', {
        method: 'POST',
        body: JSON.stringify({ action: 'delete', data: { id } }),
      })
      await refresh()
    } catch (err) {
      throw err
    }
  }, [refresh])

  return { sessions, loading, error, refresh, saveSession, deleteSession }
}

// Notification Hooks
export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      setLoading(true)
      const result = await apiCall('/api/notifications')
      setNotifications(result.data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const addNotification = useCallback(async (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    try {
      await apiCall('/api/notifications', {
        method: 'POST',
        body: JSON.stringify({ action: 'add', data: notification }),
      })
      await refresh()
    } catch (err) {
      throw err
    }
  }, [refresh])

  const markAsRead = useCallback(async (id: string) => {
    try {
      await apiCall('/api/notifications', {
        method: 'POST',
        body: JSON.stringify({ action: 'markRead', data: { id } }),
      })
      await refresh()
    } catch (err) {
      throw err
    }
  }, [refresh])

  const clear = useCallback(async () => {
    try {
      await apiCall('/api/notifications', {
        method: 'POST',
        body: JSON.stringify({ action: 'clear' }),
      })
      setNotifications([])
    } catch (err) {
      throw err
    }
  }, [])

  return { notifications, loading, error, refresh, addNotification, markAsRead, clear }
}

// Auth Hook
export function useAuth() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      setLoading(true)
      const result = await apiCall('/api/auth')
      setUser(result.user)
    } catch (err) {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const login = useCallback(async (email: string, password: string) => {
    const result = await apiCall('/api/auth', {
      method: 'POST',
      body: JSON.stringify({ action: 'login', email, password }),
    })
    if (result.success) {
      setUser(result.user)
    }
    return result
  }, [])

  const register = useCallback(async (email: string, password: string, name: string, company: string) => {
    const result = await apiCall('/api/auth', {
      method: 'POST',
      body: JSON.stringify({ action: 'register', email, password, name, company }),
    })
    return result
  }, [])

  const logout = useCallback(async () => {
    await apiCall('/api/auth', {
      method: 'POST',
      body: JSON.stringify({ action: 'logout' }),
    })
    setUser(null)
  }, [])

  return { user, loading, login, register, logout, refresh }
}

// Settings Hook
export function useSettings() {
  const [tutorialsCompleted, setTutorialsCompleted] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      setLoading(true)
      const result = await apiCall('/api/settings')
      setTutorialsCompleted(new Set(result.data.tutorialsCompleted))
    } catch (err) {
      console.error('Failed to fetch settings:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const markTutorialComplete = useCallback(async (tutorialId: string) => {
    try {
      await apiCall('/api/settings', {
        method: 'POST',
        body: JSON.stringify({ action: 'markTutorialComplete', data: { tutorialId } }),
      })
      await refresh()
    } catch (err) {
      throw err
    }
  }, [refresh])

  const skipAllTutorials = useCallback(async () => {
    try {
      await apiCall('/api/settings', {
        method: 'POST',
        body: JSON.stringify({ action: 'skipAllTutorials' }),
      })
      await refresh()
    } catch (err) {
      throw err
    }
  }, [refresh])

  const resetTutorials = useCallback(async () => {
    try {
      await apiCall('/api/settings', {
        method: 'POST',
        body: JSON.stringify({ action: 'resetTutorials' }),
      })
      await refresh()
    } catch (err) {
      throw err
    }
  }, [refresh])

  return { tutorialsCompleted, loading, markTutorialComplete, skipAllTutorials, resetTutorials, refresh }
}