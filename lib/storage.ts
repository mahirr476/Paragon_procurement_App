import { PurchaseOrder, ChatSession, Notification } from './types'

const APPROVED_POS_KEY = 'approved_pos'
const CURRENT_POS_KEY = 'current_pos'
const CHAT_SESSIONS_KEY = 'chat_sessions'
const NOTIFICATIONS_KEY = 'notifications'
const TUTORIALS_KEY = 'tutorials_completed'
const THEME_KEY = 'app_theme'

export function saveApprovedPOs(pos: PurchaseOrder[]) {
  localStorage.setItem(APPROVED_POS_KEY, JSON.stringify(pos))
}

export function getApprovedPOs(): PurchaseOrder[] {
  const data = localStorage.getItem(APPROVED_POS_KEY)
  return data ? JSON.parse(data) : []
}

export function saveCurrentPOs(pos: PurchaseOrder[]) {
  localStorage.setItem(CURRENT_POS_KEY, JSON.stringify(pos))
}

export function getCurrentPOs(): PurchaseOrder[] {
  const data = localStorage.getItem(CURRENT_POS_KEY)
  return data ? JSON.parse(data) : []
}

export function addToApprovedPOs(pos: PurchaseOrder[]) {
  const existing = getApprovedPOs()
  const updated = [...existing, ...pos]
  saveApprovedPOs(updated)
}

export function clearCurrentPOs() {
  localStorage.removeItem(CURRENT_POS_KEY)
}

export function removeCurrentPOs(poIds: string[]) {
  const current = getCurrentPOs()
  const filtered = current.filter(po => !poIds.includes(po.id))
  saveCurrentPOs(filtered)
}

export function getChatSessions(): ChatSession[] {
  const data = localStorage.getItem(CHAT_SESSIONS_KEY)
  if (!data) return []
  const sessions = JSON.parse(data)
  return sessions.map((s: any) => ({
    ...s,
    createdAt: new Date(s.createdAt),
    updatedAt: new Date(s.updatedAt),
    messages: s.messages.map((m: any) => ({
      ...m,
      timestamp: new Date(m.timestamp)
    }))
  }))
}

export function saveChatSession(session: ChatSession) {
  const sessions = getChatSessions()
  const index = sessions.findIndex(s => s.id === session.id)
  if (index >= 0) {
    sessions[index] = session
  } else {
    sessions.push(session)
  }
  localStorage.setItem(CHAT_SESSIONS_KEY, JSON.stringify(sessions))
}

export function deleteChatSession(sessionId: string) {
  const sessions = getChatSessions()
  const filtered = sessions.filter(s => s.id !== sessionId)
  localStorage.setItem(CHAT_SESSIONS_KEY, JSON.stringify(filtered))
}

export function generateChatTitle(firstMessage: string): string {
  // Generate title from first user message (max 50 chars)
  return firstMessage.length > 50 
    ? firstMessage.substring(0, 47) + '...' 
    : firstMessage
}

export function getNotifications(): Notification[] {
  const data = localStorage.getItem(NOTIFICATIONS_KEY)
  if (!data) return []
  const notifications = JSON.parse(data)
  return notifications.map((n: any) => ({
    ...n,
    createdAt: new Date(n.createdAt)
  }))
}

export function saveNotifications(notifications: Notification[]) {
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications))
}

export function addNotification(notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) {
  const notifications = getNotifications()
  const newNotification: Notification = {
    ...notification,
    id: Date.now().toString(),
    createdAt: new Date(),
    read: false
  }
  notifications.unshift(newNotification)
  saveNotifications(notifications)
  return newNotification
}

export function markNotificationAsRead(notificationId: string) {
  const notifications = getNotifications()
  const updated = notifications.map(n => 
    n.id === notificationId ? { ...n, read: true } : n
  )
  saveNotifications(updated)
}

export function markAllNotificationsAsRead() {
  const notifications = getNotifications()
  const updated = notifications.map(n => ({ ...n, read: true }))
  saveNotifications(updated)
}

export function deleteNotification(notificationId: string) {
  const notifications = getNotifications()
  const filtered = notifications.filter(n => n.id !== notificationId)
  saveNotifications(filtered)
}

export function clearAllNotifications() {
  localStorage.removeItem(NOTIFICATIONS_KEY)
}

export function getTutorialsCompleted(): Record<string, boolean> {
  const data = localStorage.getItem(TUTORIALS_KEY)
  return data ? JSON.parse(data) : {}
}

export function markTutorialComplete(tutorialId: string) {
  const tutorials = getTutorialsCompleted()
  tutorials[tutorialId] = true
  localStorage.setItem(TUTORIALS_KEY, JSON.stringify(tutorials))
}

export function skipAllTutorials() {
  const tutorials = {
    overview: true,
    upload: true,
    reports: true,
    agents: true,
    intelligence: true,
    systems: true
  }
  localStorage.setItem(TUTORIALS_KEY, JSON.stringify(tutorials))
}

export function resetTutorials() {
  localStorage.removeItem(TUTORIALS_KEY)
}

export function getTheme(): string {
  return localStorage.getItem(THEME_KEY) || 'cyberpunk'
}

export function saveTheme(theme: string) {
  localStorage.setItem(THEME_KEY, theme)
}
