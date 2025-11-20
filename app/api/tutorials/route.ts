import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ success: false, error: "User ID required" }, { status: 400 })
    }

    const tutorials = await prisma.tutorial.findMany({
      where: { userId },
    })

    const tutorialsMap = tutorials.reduce(
      (acc, t) => {
        acc[t.tutorialId] = t.completed
        return acc
      },
      {} as Record<string, boolean>,
    )

    return NextResponse.json({ success: true, tutorials: tutorialsMap })
  } catch (error) {
    console.error("[v0] Get tutorials error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, tutorialId } = await req.json()

    const tutorial = await prisma.tutorial.upsert({
      where: {
        userId_tutorialId: { userId, tutorialId },
      },
      update: {
        completed: true,
        completedAt: new Date(),
      },
      create: {
        userId,
        tutorialId,
        completed: true,
      },
    })

    return NextResponse.json({ success: true, tutorial })
  } catch (error) {
    console.error("[v0] Mark tutorial complete error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ success: false, error: "User ID required" }, { status: 400 })
    }

    await prisma.tutorial.deleteMany({
      where: { userId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Reset tutorials error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
