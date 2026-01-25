import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { validatePassword } from "@/lib/utils"

export async function POST(req: NextRequest) {
  try {
    const { email, password, name, company } = await req.json()

    console.log("[v0] Register API called with:", { email, name, company })

    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json({ success: false, error: "Email already registered" }, { status: 400 })
    }

    const passwordValidationResult = validatePassword(password)
    if (!passwordValidationResult.isValid) {
      return NextResponse.json(
        { success: false, error: passwordValidationResult.errors.join(". ") },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        company,
        role: "user",
      },
      select: {
        id: true,
        email: true,
        name: true,
        company: true,
        role: true,
        createdAt: true,
      },
    })

    console.log("[v0] User created in database:", user.email)
    return NextResponse.json({ success: true, user })
  } catch (error) {
    console.error("[v0] Register error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
