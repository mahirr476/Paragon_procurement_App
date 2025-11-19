"use client"

import { useState, useEffect } from "react"
import { Bell, CheckCheck, Trash2, X } from 'lucide-react'
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification, clearAllNotifications } from "@/lib/storage"
import { Notification } from "@/lib/types"
import { useRouter } from 'next/navigation'

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

  const loadNotifications = () => {
    setNotifications(getNotifications())
  }

  const unreadCount = notifications.filter(n => !n.read).length

  const handleNotificationClick = (notification: Notification) => {
    markNotificationAsRead(notification.id)
    loadNotifications()
    if (notification.link) {
      setIsOpen(false)
      // This would navigate if there's a link, but we're in single page
      // Just mark as read for now
    }
  }

  const handleMarkAllRead = () => {
    markAllNotificationsAsRead()
    loadNotifications()
  }

  const handleDelete = (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    deleteNotification(notificationId)
    loadNotifications()
  }

  const handleClearAll = () => {
    clearAllNotifications()
    loadNotifications()
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'border-l-red-500 bg-red-950/20'
      case 'warning':
        return 'border-l-orange-500 bg-orange-950/20'
      default:
        return 'border-l-blue-500 bg-blue-950/20'
    }
  }

  const getSeverityIcon = (type: string) => {
    switch (type) {
      case 'po_upload':
      case 'approval_needed':
        return '📋'
      case 'anomaly_detected':
        return '⚠️'
      default:
        return '🔔'
    }
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative text-neutral-400 hover:text-orange-500"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 bg-neutral-900 border-neutral-800 p-0">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-800">
          <h3 className="text-sm font-semibold text-white">Notifications</h3>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllRead}
                className="text-xs text-neutral-400 hover:text-white h-7"
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
                className="text-xs text-neutral-400 hover:text-red-400 h-7"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Notification List */}
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-neutral-500">
              <Bell className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No notifications</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`p-4 border-l-4 border-b border-neutral-800 cursor-pointer transition-colors hover:bg-neutral-800/50 ${getSeverityColor(notification.severity)} ${!notification.read ? '' : 'opacity-60'}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{getSeverityIcon(notification.type)}</span>
                      <h4 className="text-sm font-semibold text-white">{notification.title}</h4>
                      {!notification.read && (
                        <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-300 mb-1">{notification.message}</p>
                    {notification.count !== undefined && (
                      <p className="text-xs text-orange-400 font-semibold">
                        {notification.count} items need review
                      </p>
                    )}
                    <p className="text-xs text-neutral-500 mt-2">
                      {new Date(notification.createdAt).toLocaleString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => handleDelete(notification.id, e)}
                    className="h-6 w-6 text-neutral-500 hover:text-red-400"
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
