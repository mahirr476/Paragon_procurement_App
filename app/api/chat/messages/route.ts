import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const { sessionId, role, content } = await req.json()

    if (!sessionId || !role || !content) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: sessionId, role, content" },
        { status: 400 },
      )
    }

    const message = await prisma.chatMessage.create({
      data: {
        sessionId,
        role,
        content,
      },
    })

    // Update session timestamp
    await prisma.chatSession.update({
      where: { id: sessionId },
      data: { updatedAt: new Date() },
    })

    return NextResponse.json({ success: true, message })
  } catch (error) {
    console.error("[v0] Create message error:", error)
    const errorMessage = error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 })
  }
}
