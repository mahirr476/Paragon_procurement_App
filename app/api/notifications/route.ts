// API Route for Notifications Operations
import { NextRequest, NextResponse } from 'next/server'
import { dataService } from '@/lib/data/file-storage'

export async function GET() {
  try {
    const notifications = await dataService.notifications.getNotifications()
    return NextResponse.json({ success: true, data: notifications })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, data } = body

    switch (action) {
      case 'add':
        await dataService.notifications.addNotification(data)
        return NextResponse.json({ success: true })

      case 'markRead':
        await dataService.notifications.markAsRead(data.id)
        return NextResponse.json({ success: true })

      case 'delete':
        // Delete a single notification
        const notifications = await dataService.notifications.getNotifications()
        const filtered = notifications.filter(n => n.id !== data.id)
        // We need to implement a setNotifications method or use a workaround
        await dataService.notifications.clearNotifications()
        for (const notif of filtered) {
          await dataService.notifications.addNotification(notif)
        }
        return NextResponse.json({ success: true })

      case 'clear':
        await dataService.notifications.clearNotifications()
        return NextResponse.json({ success: true })

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error processing notification operation:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process operation' },
      { status: 500 }
    )
  }
}