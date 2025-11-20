import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const isApproved = req.nextUrl.searchParams.get("approved") === "true"
    console.log("[v0] GET POs - isApproved:", isApproved)

    const pos = await prisma.purchaseOrder.findMany({
      where: { isApproved },
      orderBy: { uploadedAt: "desc" },
    })

    return NextResponse.json({ success: true, pos })
  } catch (error) {
    console.error("[v0] Get POs error:", error)
    return NextResponse.json(
      { success: false, pos: [], error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const { pos } = await req.json()
    console.log("[v0] POST POs - count:", pos?.length)

    const createdPOs = await prisma.purchaseOrder.createMany({
      data: pos,
    })

    return NextResponse.json({ success: true, count: createdPOs.count })
  } catch (error) {
    console.error("[v0] Create POs error:", error)
    return NextResponse.json(
      { success: false, count: 0, error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { poIds, updates } = await req.json()

    await prisma.purchaseOrder.updateMany({
      where: { id: { in: poIds } },
      data: updates,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Update POs error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const poIds = req.nextUrl.searchParams.get("ids")?.split(",") || []

    await prisma.purchaseOrder.deleteMany({
      where: { id: { in: poIds } },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Delete POs error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
