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
    const { sessionId, updates } = await req.json()

    const session = await prisma.chatSession.update({
      where: { id: sessionId },
      data: updates,
      include: {
        messages: {
          orderBy: { timestamp: "asc" },
        },
      },
    })

    return NextResponse.json({ success: true, session })
  } catch (error) {
    console.error("[v0] Update chat session error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
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
