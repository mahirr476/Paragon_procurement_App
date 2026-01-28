import type { PurchaseOrder, ChatSession, Notification } from "./types"

// Helper to get base URL for API calls
function getApiUrl(path: string): string {
  if (typeof window !== "undefined") {
    // Client-side: use relative URL
    return path
  }
  // Server-side: use absolute URL if available, otherwise return empty to prevent calls
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL || ""
  return baseUrl ? `${baseUrl}${path}` : path
}

// Purchase Orders API
export async function saveApprovedPOs(pos: PurchaseOrder[]) {
  if (typeof window === "undefined") return { success: false }
  const response = await fetch(getApiUrl("/api/pos"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pos: pos.map((po) => ({ ...po, isApproved: true })) }),
  })
  return response.json()
}

export async function getApprovedPOs(empId?: string): Promise<PurchaseOrder[]> {
  if (typeof window === "undefined") return []
  
  // Always get empId from current user if not provided
  if (!empId) {
    const { getCurrentUser } = await import("./auth")
    const user = getCurrentUser()
    empId = user?.empId
  }
  
  // If still no empId, return empty array (don't fetch all records)
  if (!empId) {
    console.warn("[getApprovedPOs] No empId available, returning empty array")
    return []
  }
  
  // Fetch from ApprovalPO database with empId filter
  const url = `/api/approval-pos?empId=${encodeURIComponent(empId)}`
  const response = await fetch(getApiUrl(url))
  const data = await response.json()
  if (data.success && Array.isArray(data.pos)) {
    // Convert ApprovalPO format to PurchaseOrder format for compatibility
    return data.pos.map((po: any) => ({
      id: po.id,
      date: po.date,
      supplier: po.supplier,
      orderNo: po.orderNo,
      refNo: po.refNo,
      dueDate: po.dueDate,
      branch: po.branch,
      requisitionType: po.requisitionType,
      itemLedgerGroup: po.itemLedgerGroup,
      item: po.item,
      minQty: po.minQty,
      maxQty: po.maxQty,
      unit: po.unit,
      rate: po.rate,
      deliveryDate: po.deliveryDate,
      cgst: po.cgst,
      sgst: po.sgst,
      igst: po.igst,
      vat: po.vat,
      lastApprovedRate: po.lastApprovedRate,
      lastSupplier: po.lastSupplier,
      broker: po.broker,
      totalAmount: po.totalAmount,
      status: po.status || "approved",
      deliveryType: po.deliveryType,
      openPO: po.openPO,
      openPONo: po.openPONo,
      uploadedAt: po.approvedAt ? new Date(po.approvedAt).toISOString() : new Date().toISOString(),
      isApproved: true,
      approvalNotes: po.approvalNotes,
    }))
  }
  return []
}

export async function saveCurrentPOs(pos: PurchaseOrder[]) {
  if (typeof window === "undefined") return { success: false }
  const response = await fetch(getApiUrl("/api/pos"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pos: pos.map((po) => ({ ...po, isApproved: false })) }),
  })
  return response.json()
}

export async function getCurrentPOs(): Promise<PurchaseOrder[]> {
  if (typeof window === "undefined") return []
  const response = await fetch(getApiUrl("/api/pos?approved=false"))
  const data = await response.json()
  return data.success ? data.pos : []
}

export async function addToApprovedPOs(pos: PurchaseOrder[], empId?: string, approvalLevel: string = "2") {
  if (typeof window === "undefined") return { success: false }
  
  if (!empId) {
    // Try to get from current user
    const { getCurrentUser } = await import("./auth")
    const user = getCurrentUser()
    if (user?.empId) {
      empId = user.empId
    } else {
      return { success: false, error: "Employee ID (empId) is required" }
    }
  }
  
  // Prepare order list for external API
  const orderNoList = pos.map((po) => ({
    OrderNumber: po.orderNo,
    ApprovalLevel: approvalLevel,
    EmpId: empId,
    Status: "Approved",
    Remark: po.approvalNotes || "",
  }))

  // Call external push API first
  let pushApiResponse = null
  try {
    console.log("[addToApprovedPOs] Calling external push API with", orderNoList.length, "orders")
    const pushResponse = await fetch(getApiUrl("/api/push-po-approvals"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderNoList }),
    })
    pushApiResponse = await pushResponse.json()
    console.log("[addToApprovedPOs] External API response:", pushApiResponse)
  } catch (error) {
    console.error("[addToApprovedPOs] Error calling external API:", error)
    // Continue with local save even if external API fails
  }
  
  // Save to ApprovalPO database
  const response = await fetch(getApiUrl("/api/approval-pos"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pos, empId }),
  })
  const localResult = await response.json()
  
  // Include external API response in the result
  return {
    ...localResult,
    externalApiResponse: pushApiResponse,
  }
}

export async function getApprovalPOs(): Promise<PurchaseOrder[]> {
  if (typeof window === "undefined") return []
  const response = await fetch(getApiUrl("/api/approval-pos"))
  const data = await response.json()
  return data.success ? data.pos : []
}

export async function addToRejectedPOs(pos: PurchaseOrder[], rejectReason?: string, empId?: string, approvalLevel: string = "2") {
  if (typeof window === "undefined") return { success: false }
  
  if (!empId) {
    // Try to get from current user
    const { getCurrentUser } = await import("./auth")
    const user = getCurrentUser()
    if (user?.empId) {
      empId = user.empId
    } else {
      return { success: false, error: "Employee ID (empId) is required" }
    }
  }
  
  // Prepare order list for external API
  const orderNoList = pos.map((po) => ({
    OrderNumber: po.orderNo,
    ApprovalLevel: approvalLevel,
    EmpId: empId,
    Status: "Reject",
    Remark: rejectReason || "",
  }))

  // Call external push API first
  let pushApiResponse = null
  try {
    console.log("[addToRejectedPOs] Calling external push API with", orderNoList.length, "orders")
    const pushResponse = await fetch(getApiUrl("/api/push-po-approvals"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderNoList }),
    })
    pushApiResponse = await pushResponse.json()
    console.log("[addToRejectedPOs] External API response:", pushApiResponse)
  } catch (error) {
    console.error("[addToRejectedPOs] Error calling external API:", error)
    // Continue with local save even if external API fails
  }
  
  const response = await fetch(getApiUrl("/api/reject-pos"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pos, rejectReason, empId }),
  })
  const localResult = await response.json()
  
  // Include external API response in the result
  return {
    ...localResult,
    externalApiResponse: pushApiResponse,
  }
}

export async function getRejectedPOs(empId?: string): Promise<PurchaseOrder[]> {
  if (typeof window === "undefined") return []
  
  // Always get empId from current user if not provided
  if (!empId) {
    const { getCurrentUser } = await import("./auth")
    const user = getCurrentUser()
    empId = user?.empId
  }
  
  // If still no empId, return empty array (don't fetch all records)
  if (!empId) {
    console.warn("[getRejectedPOs] No empId available, returning empty array")
    return []
  }
  
  // Fetch from RejectPO database with empId filter
  const url = `/api/reject-pos?empId=${encodeURIComponent(empId)}`
  const response = await fetch(getApiUrl(url))
  const data = await response.json()
  if (data.success && Array.isArray(data.pos)) {
    return data.pos.map((po: any) => ({
      id: po.id,
      date: po.date,
      supplier: po.supplier,
      orderNo: po.orderNo,
      refNo: po.refNo,
      dueDate: po.dueDate,
      branch: po.branch,
      requisitionType: po.requisitionType,
      itemLedgerGroup: po.itemLedgerGroup,
      item: po.item,
      minQty: po.minQty,
      maxQty: po.maxQty,
      unit: po.unit,
      rate: po.rate,
      deliveryDate: po.deliveryDate,
      cgst: po.cgst,
      sgst: po.sgst,
      igst: po.igst,
      vat: po.vat,
      lastApprovedRate: po.lastApprovedRate,
      lastSupplier: po.lastSupplier,
      broker: po.broker,
      totalAmount: po.totalAmount,
      status: po.status || "rejected",
      deliveryType: po.deliveryType,
      openPO: po.openPO,
      openPONo: po.openPONo,
      uploadedAt: po.rejectedAt ? new Date(po.rejectedAt).toISOString() : new Date().toISOString(),
      isApproved: false,
      approvalNotes: po.rejectReason,
    }))
  }
  return []
}

export async function clearCurrentPOs() {
  const currentPOs = await getCurrentPOs()
  const ids = currentPOs.map((po) => po.id)
  const response = await fetch(`/api/pos?ids=${ids.join(",")}`, {
    method: "DELETE",
  })
  return response.json()
}

export async function removeCurrentPOs(poIds: string[]) {
  const response = await fetch(`/api/pos?ids=${poIds.join(",")}`, {
    method: "DELETE",
  })
  return response.json()
}

// Chat Sessions API
export async function getChatSessions(userId: string): Promise<ChatSession[]> {
  const response = await fetch(`/api/chat/sessions?userId=${userId}`)
  const data = await response.json()

  if (!data.success) return []

  return data.sessions.map((s: any) => ({
    ...s,
    createdAt: new Date(s.createdAt),
    updatedAt: new Date(s.updatedAt),
    messages: s.messages.map((m: any) => ({
      ...m,
      timestamp: new Date(m.timestamp),
    })),
  }))
}

export async function saveChatSession(userId: string, session: ChatSession) {
  if (!session.id) {
    console.error("Cannot save chat session: session.id is missing")
    return { success: false, error: "Session ID is required" }
  }

  const response = await fetch("/api/chat/sessions", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId: session.id,
      updates: { title: session.title },
    }),
  })

  if (!response.ok) {
    const errorData = await response.json()
    console.error("Failed to save chat session:", errorData)
    return { success: false, error: errorData.error || "Failed to save session" }
  }

  return response.json()
}

export async function deleteChatSession(sessionId: string) {
  const response = await fetch(`/api/chat/sessions?sessionId=${sessionId}`, {
    method: "DELETE",
  })
  return response.json()
}

export function generateChatTitle(firstMessage: string): string {
  return firstMessage.length > 50 ? firstMessage.substring(0, 47) + "..." : firstMessage
}

// Notifications API
export async function getNotifications(userId: string): Promise<Notification[]> {
  const response = await fetch(`/api/notifications?userId=${userId}`)
  const data = await response.json()

  if (!data.success) return []

  return data.notifications.map((n: any) => ({
    ...n,
    createdAt: new Date(n.createdAt),
  }))
}

export async function addNotification(userId: string, notification: Omit<Notification, "id" | "createdAt" | "read">) {
  const response = await fetch("/api/notifications", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, ...notification }),
  })
  const data = await response.json()
  return data.success ? data.notification : null
}

export async function markNotificationAsRead(notificationId: string) {
  const response = await fetch("/api/notifications", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ notificationId, read: true }),
  })
  return response.json()
}

export async function markAllNotificationsAsRead(userId: string) {
  const notifications = await getNotifications(userId)
  await Promise.all(notifications.map((n) => markNotificationAsRead(n.id)))
}

export async function deleteNotification(notificationId: string) {
  const response = await fetch(`/api/notifications?id=${notificationId}`, {
    method: "DELETE",
  })
  return response.json()
}

export async function clearAllNotifications(userId: string) {
  const notifications = await getNotifications(userId)
  await Promise.all(notifications.map((n) => deleteNotification(n.id)))
}

// Tutorials API
export async function getTutorialsCompleted(userId: string): Promise<Record<string, boolean>> {
  const response = await fetch(`/api/tutorials?userId=${userId}`)
  const data = await response.json()
  return data.success ? data.tutorials : {}
}

export async function markTutorialComplete(userId: string, tutorialId: string) {
  const response = await fetch("/api/tutorials", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, tutorialId }),
  })
  return response.json()
}

export async function skipAllTutorials(userId: string) {
  const tutorialIds = ["overview", "upload", "reports", "agents", "intelligence", "systems"]
  await Promise.all(tutorialIds.map((id) => markTutorialComplete(userId, id)))
}

export async function resetTutorials(userId: string) {
  const response = await fetch(`/api/tutorials?userId=${userId}`, {
    method: "DELETE",
  })
  return response.json()
}

// Theme API
export async function getTheme(userId: string): Promise<string> {
  const response = await fetch(`/api/theme?userId=${userId}`)
  const data = await response.json()
  return data.success && data.theme ? data.theme : "cyberpunk"
}

export async function saveTheme(userId: string, themeName: string) {
  const response = await fetch("/api/theme", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, themeName }),
  })
  return response.json()
}
