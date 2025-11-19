// Backward Compatibility Layer for storage.ts
// This file maintains the existing API while using the new data service underneath
// This allows existing code to work without changes

'use client'

import { PurchaseOrder, ChatSession, Notification } from './types'

// Since we're on the client side, we need to use the API routes
// These functions now make fetch calls to the API endpoints

// Purchase Order Functions
export function getCurrentPOs(): PurchaseOrder[] {
  // For synchronous compatibility, we return from localStorage temporarily
  if (typeof window === 'undefined') return []
  const stored = localStorage.getItem('current_pos')
  return stored ? JSON.parse(stored) : []
}

export function saveCurrentPOs(pos: PurchaseOrder[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem('current_pos', JSON.stringify(pos))
  
  // Async sync to backend
  fetch('/api/pos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'saveCurrent', data: pos }),
  }).catch(console.error)
}

export function addToCurrentPOs(pos: PurchaseOrder[]): void {
  const current = getCurrentPOs()
  const updated = [...current, ...pos]
  saveCurrentPOs(updated)
}

export function clearCurrentPOs(): void {
  saveCurrentPOs([])
}

export function getApprovedPOs(): PurchaseOrder[] {
  if (typeof window === 'undefined') return []
  const stored = localStorage.getItem('approved_pos')
  return stored ? JSON.parse(stored) : []
}

export function addToApprovedPOs(pos: PurchaseOrder[]): void {
  const approved = getApprovedPOs()
  const updated = [...approved, ...pos]
  if (typeof window === 'undefined') return
  localStorage.setItem('approved_pos', JSON.stringify(updated))
  
  fetch('/api/pos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'addToApproved', data: pos }),
  }).catch(console.error)
}

export function deleteApprovedPO(id: string): void {
  const approved = getApprovedPOs()
  const filtered = approved.filter(po => po.id !== id)
  if (typeof window === 'undefined') return
  localStorage.setItem('approved_pos', JSON.stringify(filtered))
  
  fetch('/api/pos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'deleteApproved', data: { id } }),
  }).catch(console.error)
}

export function clearApprovedPOs(): void {
  if (typeof window === 'undefined') return
  localStorage.setItem('approved_pos', JSON.stringify([]))
  
  fetch('/api/pos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'clearApproved' }),
  }).catch(console.error)
}

// Chat Functions
export function getChatSessions(): ChatSession[] {
  if (typeof window === 'undefined') return []
  const stored = localStorage.getItem('chat_sessions')
  return stored ? JSON.parse(stored) : []
}

export function saveChatSession(session: ChatSession): void {
  const sessions = getChatSessions()
  const index = sessions.findIndex(s => s.id === session.id)
  
  if (index !== -1) {
    sessions[index] = session
  } else {
    sessions.push(session)
  }
  
  if (typeof window === 'undefined') return
  localStorage.setItem('chat_sessions', JSON.stringify(sessions))
  
  fetch('/api/chats', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'save', data: session }),
  }).catch(console.error)
}

export function deleteChatSession(id: string): void {
  const sessions = getChatSessions()
  const filtered = sessions.filter(s => s.id !== id)
  if (typeof window === 'undefined') return
  localStorage.setItem('chat_sessions', JSON.stringify(filtered))
  
  fetch('/api/chats', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'delete', data: { id } }),
  }).catch(console.error)
}

export function generateChatTitle(firstMessage: string): string {
  const maxLength = 50
  const title = firstMessage.trim().slice(0, maxLength)
  return title.length < firstMessage.length ? `${title}...` : title
}

// Notification Functions
export function getNotifications(): Notification[] {
  if (typeof window === 'undefined') return []
  const stored = localStorage.getItem('notifications')
  return stored ? JSON.parse(stored) : []
}

export function addNotification(notification: Omit<Notification, 'id' | 'timestamp' | 'read'>): void {
  const notifications = getNotifications()
  const newNotification: Notification = {
    ...notification,
    id: Date.now().toString(),
    timestamp: new Date(),
    read: false,
  }
  
  notifications.unshift(newNotification)
  if (typeof window === 'undefined') return
  localStorage.setItem('notifications', JSON.stringify(notifications))
  
  fetch('/api/notifications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'add', data: notification }),
  }).catch(console.error)
}

export function markNotificationAsRead(id: string): void {
  const notifications = getNotifications()
  const notification = notifications.find(n => n.id === id)
  
  if (notification) {
    notification.read = true
    if (typeof window === 'undefined') return
    localStorage.setItem('notifications', JSON.stringify(notifications))
    
    fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'markRead', data: { id } }),
    }).catch(console.error)
  }
}

export function clearNotifications(): void {
  if (typeof window === 'undefined') return
  localStorage.setItem('notifications', JSON.stringify([]))
  
  fetch('/api/notifications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'clear' }),
  }).catch(console.error)
}

// Settings Functions
export function getTutorialsCompleted(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  const stored = localStorage.getItem('settings')
  const settings = stored ? JSON.parse(stored) : { tutorialsCompleted: [] }
  return new Set(settings.tutorialsCompleted)
}

export function markTutorialComplete(tutorialId: string): void {
  const completed = getTutorialsCompleted()
  completed.add(tutorialId)
  if (typeof window === 'undefined') return
  localStorage.setItem('settings', JSON.stringify({
    tutorialsCompleted: Array.from(completed)
  }))
  
  fetch('/api/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'markTutorialComplete', data: { tutorialId } }),
  }).catch(console.error)
}

export function skipAllTutorials(): void {
  if (typeof window === 'undefined') return
  localStorage.setItem('settings', JSON.stringify({
    tutorialsCompleted: ['all']
  }))
  
  fetch('/api/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'skipAllTutorials' }),
  }).catch(console.error)
}

export function resetTutorials(): void {
  if (typeof window === 'undefined') return
  localStorage.setItem('settings', JSON.stringify({
    tutorialsCompleted: []
  }))
  
  fetch('/api/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'resetTutorials' }),
  }).catch(console.error)
}