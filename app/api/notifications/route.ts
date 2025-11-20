import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ success: false, error: "User ID required" }, { status: 400 })
    }

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ success: true, notifications })
  } catch (error) {
    console.error("[v0] Get notifications error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, type, title, message, count, severity, link } = await req.json()

    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        count,
        severity,
        link,
      },
    })

    return NextResponse.json({ success: true, notification })
  } catch (error) {
    console.error("[v0] Create notification error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { notificationId, read } = await req.json()

    const notification = await prisma.notification.update({
      where: { id: notificationId },
      data: { read },
    })

    return NextResponse.json({ success: true, notification })
  } catch (error) {
    console.error("[v0] Update notification error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const notificationId = req.nextUrl.searchParams.get("id")

    if (!notificationId) {
      return NextResponse.json({ success: false, error: "Notification ID required" }, { status: 400 })
    }

    await prisma.notification.delete({
      where: { id: notificationId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Delete notification error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
