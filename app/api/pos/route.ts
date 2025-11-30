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

    console.log("[v0] GET POs - found:", pos.length, "records with isApproved:", isApproved)
    
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
    let body: any
    try {
      body = await req.json()
    } catch (error) {
      return NextResponse.json(
        { success: false, count: 0, error: "Invalid JSON in request body" },
        { status: 400 },
      )
    }

    const { pos } = body || {}
    console.log("[v0] POST POs - count:", pos?.length)

    if (!pos || !Array.isArray(pos) || pos.length === 0) {
      return NextResponse.json(
        { success: false, count: 0, error: "No purchase orders provided" },
        { status: 400 },
      )
    }

    // Use createMany with skipDuplicates to handle duplicate IDs gracefully
    const createdPOs = await prisma.purchaseOrder.createMany({
      data: pos,
      skipDuplicates: true,
    })

    console.log("[v0] Created POs - count:", createdPOs.count, "total provided:", pos.length)

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
    let body: any
    try {
      body = await req.json()
    } catch (error) {
      return NextResponse.json(
        { success: false, error: "Invalid JSON in request body" },
        { status: 400 },
      )
    }

    const { poIds, updates } = body || {}
    console.log("[v0] PUT POs - count:", poIds?.length, "updates:", updates)

    if (!poIds || !Array.isArray(poIds) || poIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "No purchase order IDs provided" },
        { status: 400 },
      )
    }

    const result = await prisma.purchaseOrder.updateMany({
      where: { id: { in: poIds } },
      data: updates,
    })

    console.log("[v0] Updated POs - count:", result.count)

    return NextResponse.json({ success: true, count: result.count })
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
