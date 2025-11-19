// Data Service Factory
// This file provides a unified interface and switches between storage implementations

import { IDataService } from './interfaces'

// Configuration
const USE_FILE_STORAGE = process.env.NEXT_PUBLIC_USE_FILE_STORAGE === 'true'

let dataServiceInstance: IDataService | null = null

/**
 * Get the active data service based on environment configuration
 * By default, uses localStorage on client and file storage on server
 */
export async function getDataService(): Promise<IDataService> {
  if (dataServiceInstance) {
    return dataServiceInstance
  }

  // Determine which storage to use
  const isServer = typeof window === 'undefined'
  
  if (isServer || USE_FILE_STORAGE) {
    // Use file-based storage (server-side or when explicitly enabled)
    const { dataService } = await import('./file-storage')
    dataServiceInstance = dataService
  } else {
    // Use localStorage (client-side default)
    const { localStorageService } = await import('./localstorage')
    dataServiceInstance = localStorageService
  }

  return dataServiceInstance
}

/**
 * Client-side wrapper functions that maintain backward compatibility
 * These functions use the data service and can be called from components
 */

// Purchase Order Functions
export async function getCurrentPOs() {
  const service = await getDataService()
  return service.purchaseOrders.getCurrentPOs()
}

export async function saveCurrentPOs(pos: any[]) {
  const service = await getDataService()
  return service.purchaseOrders.saveCurrentPOs(pos)
}

export async function addToCurrentPOs(pos: any[]) {
  const service = await getDataService()
  return service.purchaseOrders.addToCurrentPOs(pos)
}

export async function clearCurrentPOs() {
  const service = await getDataService()
  return service.purchaseOrders.clearCurrentPOs()
}

export async function getApprovedPOs() {
  const service = await getDataService()
  return service.purchaseOrders.getApprovedPOs()
}

export async function addToApprovedPOs(pos: any[]) {
  const service = await getDataService()
  return service.purchaseOrders.addToApprovedPOs(pos)
}

export async function deleteApprovedPO(id: string) {
  const service = await getDataService()
  return service.purchaseOrders.deleteApprovedPO(id)
}

export async function clearApprovedPOs() {
  const service = await getDataService()
  return service.purchaseOrders.clearApprovedPOs()
}

// Chat Functions
export async function getChatSessions() {
  const service = await getDataService()
  return service.chats.getChatSessions()
}

export async function saveChatSession(session: any) {
  const service = await getDataService()
  return service.chats.saveChatSession(session)
}

export async function deleteChatSession(id: string) {
  const service = await getDataService()
  return service.chats.deleteChatSession(id)
}

// Notification Functions
export async function getNotifications() {
  const service = await getDataService()
  return service.notifications.getNotifications()
}

export async function addNotification(notification: any) {
  const service = await getDataService()
  return service.notifications.addNotification(notification)
}

export async function markNotificationAsRead(id: string) {
  const service = await getDataService()
  return service.notifications.markAsRead(id)
}

export async function clearNotifications() {
  const service = await getDataService()
  return service.notifications.clearNotifications()
}

// Settings Functions
export async function getTutorialsCompleted() {
  const service = await getDataService()
  return service.settings.getTutorialsCompleted()
}

export async function markTutorialComplete(tutorialId: string) {
  const service = await getDataService()
  return service.settings.markTutorialComplete(tutorialId)
}

export async function skipAllTutorials() {
  const service = await getDataService()
  return service.settings.skipAllTutorials()
}

export async function resetTutorials() {
  const service = await getDataService()
  return service.settings.resetTutorials()
}

// Auth Functions
export async function getCurrentUser() {
  const service = await getDataService()
  return service.auth.getCurrentUser()
}

export async function loginUser(email: string, password: string) {
  const service = await getDataService()
  return service.auth.login(email, password)
}

export async function logoutUser() {
  const service = await getDataService()
  return service.auth.logout()
}

export async function registerUser(email: string, password: string, name: string, company: string) {
  const service = await getDataService()
  return service.auth.register(email, password, name, company)
}

// Utility function to generate chat titles
export function generateChatTitle(firstMessage: string): string {
  const maxLength = 50
  const title = firstMessage.trim().slice(0, maxLength)
  return title.length < firstMessage.length ? `${title}...` : title
}