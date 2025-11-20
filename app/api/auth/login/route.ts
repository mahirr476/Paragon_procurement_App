import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    console.log("[v0] Login API called with:", { email })

    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return NextResponse.json({ success: false, error: "Invalid email or password" }, { status: 401 })
    }

    const isValidPassword = await bcrypt.compare(password, user.password)

    if (!isValidPassword) {
      return NextResponse.json({ success: false, error: "Invalid email or password" }, { status: 401 })
    }

    const { password: _, ...userWithoutPassword } = user
    console.log("[v0] User logged in from database:", email)

    return NextResponse.json({ success: true, user: userWithoutPassword })
  } catch (error) {
    console.error("[v0] Login error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
