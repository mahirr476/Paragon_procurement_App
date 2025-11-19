import { prisma } from './prisma'
import { PurchaseOrder, ChatSession, Notification } from './types'

// Purchase Orders
export async function saveApprovedPOs(pos: PurchaseOrder[]) {
  return await prisma.purchaseOrder.createMany({
    data: pos.map(po => ({
      ...po,
      uploadedAt: new Date(po.uploadedAt)
    })),
    skipDuplicates: true
  })
}

export async function getApprovedPOs(): Promise<PurchaseOrder[]> {
  const pos = await prisma.purchaseOrder.findMany({
    where: { isApproved: true },
    orderBy: { uploadedAt: 'desc' }
  })
  return pos.map(po => ({
    ...po,
    uploadedAt: po.uploadedAt.toISOString()
  }))
}

export async function getCurrentPOs(): Promise<PurchaseOrder[]> {
  const pos = await prisma.purchaseOrder.findMany({
    where: { isApproved: false },
    orderBy: { uploadedAt: 'desc' }
  })
  return pos.map(po => ({
    ...po,
    uploadedAt: po.uploadedAt.toISOString()
  }))
}

export async function saveCurrentPOs(pos: PurchaseOrder[]) {
  // Delete existing unapproved POs
  await prisma.purchaseOrder.deleteMany({
    where: { isApproved: false }
  })
  
  // Create new ones
  if (pos.length > 0) {
    return await prisma.purchaseOrder.createMany({
      data: pos.map(po => ({
        ...po,
        uploadedAt: new Date(po.uploadedAt)
      }))
    })
  }
}

export async function addToApprovedPOs(pos: PurchaseOrder[]) {
  // Update existing POs to approved
  const updatePromises = pos.map(po =>
    prisma.purchaseOrder.upsert({
      where: { id: po.id },
      update: { 
        isApproved: true,
        updatedAt: new Date()
      },
      create: {
        ...po,
        isApproved: true,
        uploadedAt: new Date(po.uploadedAt)
      }
    })
  )
  
  return await Promise.all(updatePromises)
}

export async function clearCurrentPOs() {
  return await prisma.purchaseOrder.deleteMany({
    where: { isApproved: false }
  })
}

export async function removeCurrentPOs(poIds: string[]) {
  return await prisma.purchaseOrder.deleteMany({
    where: {
      id: { in: poIds },
      isApproved: false
    }
  })
}

// Chat Sessions
export async function getChatSessions(userId: string): Promise<ChatSession[]> {
  const sessions = await prisma.chatSession.findMany({
    where: { userId },
    include: {
      messages: {
        orderBy: { timestamp: 'asc' }
      }
    },
    orderBy: { updatedAt: 'desc' }
  })

  return sessions.map(session => ({
    id: session.id,
    title: session.title,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    messages: session.messages.map(msg => ({
      id: msg.id,
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
      timestamp: msg.timestamp
    }))
  }))
}

export async function saveChatSession(session: ChatSession, userId: string) {
  // Upsert the session
  const savedSession = await prisma.chatSession.upsert({
    where: { id: session.id },
    update: {
      title: session.title,
      updatedAt: new Date()
    },
    create: {
      id: session.id,
      userId,
      title: session.title,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt
    }
  })

  // Delete existing messages and create new ones
  await prisma.chatMessage.deleteMany({
    where: { sessionId: session.id }
  })

  if (session.messages.length > 0) {
    await prisma.chatMessage.createMany({
      data: session.messages.map(msg => ({
        sessionId: session.id,
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp
      }))
    })
  }

  return savedSession
}

export async function deleteChatSession(sessionId: string) {
  return await prisma.chatSession.delete({
    where: { id: sessionId }
  })
}

export function generateChatTitle(firstMessage: string): string {
  return firstMessage.length > 50 
    ? firstMessage.substring(0, 47) + '...' 
    : firstMessage
}

// Notifications
export async function getNotifications(userId: string): Promise<Notification[]> {
  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' }
  })

  return notifications.map(n => ({
    id: n.id,
    type: n.type as any,
    title: n.title,
    message: n.message,
    count: n.count || undefined,
    severity: n.severity as any,
    link: n.link || undefined,
    read: n.read,
    createdAt: n.createdAt
  }))
}

export async function saveNotifications(notifications: Notification[], userId: string) {
  // This is a bulk operation - delete all and recreate
  await prisma.notification.deleteMany({ where: { userId } })
  
  if (notifications.length > 0) {
    await prisma.notification.createMany({
      data: notifications.map(n => ({
        userId,
        type: n.type,
        title: n.title,
        message: n.message,
        count: n.count,
        severity: n.severity,
        link: n.link,
        read: n.read,
        createdAt: n.createdAt
      }))
    })
  }
}

export async function addNotification(
  notification: Omit<Notification, 'id' | 'createdAt' | 'read'>,
  userId: string
) {
  return await prisma.notification.create({
    data: {
      userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      count: notification.count,
      severity: notification.severity,
      link: notification.link,
      read: false
    }
  })
}

export async function markNotificationAsRead(notificationId: string) {
  return await prisma.notification.update({
    where: { id: notificationId },
    data: { read: true }
  })
}

export async function markAllNotificationsAsRead(userId: string) {
  return await prisma.notification.updateMany({
    where: { userId },
    data: { read: true }
  })
}

export async function deleteNotification(notificationId: string) {
  return await prisma.notification.delete({
    where: { id: notificationId }
  })
}

export async function clearAllNotifications(userId: string) {
  return await prisma.notification.deleteMany({
    where: { userId }
  })
}

// Settings
export async function getTutorialsCompleted(userId: string): Promise<Record<string, boolean>> {
  const settings = await prisma.settings.findUnique({
    where: { userId }
  })
  return (settings?.tutorials as Record<string, boolean>) || {}
}

export async function markTutorialComplete(tutorialId: string, userId: string) {
  const current = await getTutorialsCompleted(userId)
  current[tutorialId] = true
  
  await prisma.settings.upsert({
    where: { userId },
    update: { tutorials: current },
    create: { userId, tutorials: current }
  })
}

export async function skipAllTutorials(userId: string) {
  const tutorials = {
    overview: true,
    upload: true,
    reports: true,
    agents: true,
    intelligence: true,
    systems: true
  }
  
  await prisma.settings.upsert({
    where: { userId },
    update: { tutorials },
    create: { userId, tutorials }
  })
}

export async function resetTutorials(userId: string) {
  await prisma.settings.upsert({
    where: { userId },
    update: { tutorials: {} },
    create: { userId, tutorials: {} }
  })
}

export async function getTheme(userId: string): Promise<string> {
  const settings = await prisma.settings.findUnique({
    where: { userId }
  })
  return settings?.theme || 'cyberpunk'
}

export async function saveTheme(theme: string, userId: string) {
  await prisma.settings.upsert({
    where: { userId },
    update: { theme },
    create: { userId, theme }
  })
}