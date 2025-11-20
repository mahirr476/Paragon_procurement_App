import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ success: false, error: "User ID required" }, { status: 400 })
    }

    const theme = await prisma.theme.findUnique({
      where: { userId },
    })

    return NextResponse.json({
      success: true,
      theme: theme?.themeName || "cyberpunk",
    })
  } catch (error) {
    console.error("[v0] Get theme error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, themeName } = await req.json()

    const theme = await prisma.theme.upsert({
      where: { userId },
      update: { themeName },
      create: { userId, themeName },
    })

    return NextResponse.json({ success: true, theme })
  } catch (error) {
    console.error("[v0] Save theme error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
