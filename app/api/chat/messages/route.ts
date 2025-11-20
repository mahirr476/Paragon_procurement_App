import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const { sessionId, role, content } = await req.json()

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
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
