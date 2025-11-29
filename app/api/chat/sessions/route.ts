import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ success: false, error: "User ID required" }, { status: 400 })
    }

    const sessions = await prisma.chatSession.findMany({
      where: { userId },
      include: {
        messages: {
          orderBy: { timestamp: "asc" },
        },
      },
      orderBy: { updatedAt: "desc" },
    })

    return NextResponse.json({ success: true, sessions })
  } catch (error) {
    console.error("[v0] Get chat sessions error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, title } = await req.json()

    if (!userId || !title) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: userId, title" },
        { status: 400 },
      )
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: `User with id "${userId}" not found. Please log in first.` },
        { status: 404 },
      )
    }

    const session = await prisma.chatSession.create({
      data: {
        userId,
        title,
      },
      include: {
        messages: true,
      },
    })

    return NextResponse.json({ success: true, session })
  } catch (error) {
    console.error("[v0] Create chat session error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { sessionId, updates, title, userId } = body

    // Support both formats: { sessionId, updates } and { sessionId, title, userId }
    const sessionIdToUse = sessionId
    const updatesToUse = updates || (title ? { title } : {})

    if (!sessionIdToUse) {
      return NextResponse.json(
        { success: false, error: "Missing required field: sessionId" },
        { status: 400 },
      )
    }

    if (Object.keys(updatesToUse).length === 0) {
      return NextResponse.json(
        { success: false, error: "No updates provided" },
        { status: 400 },
      )
    }

    // Check if session exists first
    const existingSession = await prisma.chatSession.findUnique({
      where: { id: sessionIdToUse },
    })

    if (!existingSession) {
      return NextResponse.json(
        { success: false, error: `Chat session with id "${sessionIdToUse}" not found` },
        { status: 404 },
      )
    }

    const session = await prisma.chatSession.update({
      where: { id: sessionIdToUse },
      data: updatesToUse,
      include: {
        messages: {
          orderBy: { timestamp: "asc" },
        },
      },
    })

    return NextResponse.json({ success: true, session })
  } catch (error) {
    console.error("[v0] Update chat session error:", error)
    const errorMessage = error instanceof Error ? error.message : "Internal server error"
    console.error("[v0] Update chat session error details:", {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const sessionId = req.nextUrl.searchParams.get("sessionId")

    if (!sessionId) {
      return NextResponse.json({ success: false, error: "Session ID required" }, { status: 400 })
    }

    await prisma.chatSession.delete({
      where: { id: sessionId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Delete chat session error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
