"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Bell, CheckCheck, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  clearAllNotifications,
} from "@/lib/storage"
import type { Notification } from "@/lib/types"
import { useRouter } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"

export function NotificationBell() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    loadNotifications()
    // Poll for new notifications every 5 seconds
    const interval = setInterval(loadNotifications, 5000)
    return () => clearInterval(interval)
  }, [])

  const loadNotifications = async () => {
    const user = await getCurrentUser()
    if (user) {
      const userNotifications = await getNotifications(user.email)
      setNotifications(userNotifications)
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  const handleNotificationClick = async (notification: Notification) => {
    await markNotificationAsRead(notification.id)
    await loadNotifications()
    if (notification.link) {
      setIsOpen(false)
      // This would navigate if there's a link, but we're in single page
      // Just mark as read for now
    }
  }

  const handleMarkAllRead = async () => {
    const user = await getCurrentUser()
    if (user) {
      await markAllNotificationsAsRead(user.email)
      await loadNotifications()
    }
  }

  const handleDelete = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    await deleteNotification(notificationId)
    await loadNotifications()
  }

  const handleClearAll = async () => {
    const user = await getCurrentUser()
    if (user) {
      await clearAllNotifications(user.email)
      await loadNotifications()
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "error":
        return "border-l-red-500 bg-red-950/20"
      case "warning":
        return "border-l-orange-500 bg-orange-950/20"
      default:
        return "border-l-blue-500 bg-blue-950/20"
    }
  }

  const getSeverityIcon = (type: string) => {
    switch (type) {
      case "po_upload":
      case "approval_needed":
        return "📋"
      case "anomaly_detected":
        return "⚠️"
      default:
        return "🔔"
    }
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:!bg-transparent hover:!text-accent">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 bg-card border-border p-0">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllRead}
                className="text-xs text-muted-foreground hover:text-foreground h-7"
              >
                <CheckCheck className="w-3 h-3 mr-1" />
                Mark all read
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="text-xs text-muted-foreground hover:text-destructive h-7"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Notification List */}
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No notifications</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`p-4 border-l-4 border-b border-border cursor-pointer transition-colors hover:bg-accent/10 ${getSeverityColor(notification.severity)} ${!notification.read ? "" : "opacity-60"}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{getSeverityIcon(notification.type)}</span>
                      <h4 className="text-sm font-semibold text-foreground">{notification.title}</h4>
                      {!notification.read && <span className="w-2 h-2 bg-accent rounded-full"></span>}
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">{notification.message}</p>
                    {notification.count !== undefined && (
                      <p className="text-xs text-accent font-semibold">{notification.count} items need review</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(notification.createdAt).toLocaleString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => handleDelete(notification.id, e)}
                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
