import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    console.log("[RejectPO API] GET - Fetching rejected POs")

    const rejectPOs = await prisma.rejectPO.findMany({
      orderBy: { rejectedAt: "desc" },
    })

    console.log("[RejectPO API] GET - found:", rejectPOs.length, "rejected POs")
    return NextResponse.json({ success: true, pos: rejectPOs })
  } catch (error) {
    console.error("[RejectPO API] Get error:", error)
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
    } catch {
      return NextResponse.json({ success: false, count: 0, error: "Invalid JSON in request body" }, { status: 400 })
    }

    const { pos, rejectReason } = body || {}
    console.log("[RejectPO API] POST - count:", pos?.length)

    if (!pos || !Array.isArray(pos) || pos.length === 0) {
      return NextResponse.json({ success: false, count: 0, error: "No purchase orders provided" }, { status: 400 })
    }

    const rejectPOsData = pos.map((po: any) => ({
      date: po.date || "",
      supplier: po.supplier || "",
      orderNo: po.orderNo || "",
      refNo: po.refNo || "",
      dueDate: po.dueDate || "",
      branch: po.branch || "",
      requisitionType: po.requisitionType || "",
      itemLedgerGroup: po.itemLedgerGroup || "",
      item: po.item || "",
      minQty: po.minQty || 0,
      maxQty: po.maxQty || 0,
      unit: po.unit || "",
      rate: po.rate || 0,
      deliveryDate: po.deliveryDate || po.dueDate || "",
      cgst: po.cgst || 0,
      sgst: po.sgst || 0,
      igst: po.igst || 0,
      vat: po.vat || 0,
      lastApprovedRate: po.lastApprovedRate || 0,
      lastSupplier: po.lastSupplier || "",
      broker: po.broker || "",
      totalAmount: po.totalAmount || 0,
      status: "rejected",
      deliveryType: po.deliveryType || "",
      openPO: po.openPO || "",
      openPONo: po.openPONo || "",
      rejectReason: rejectReason || null,
    }))

    const created = await prisma.rejectPO.createMany({
      data: rejectPOsData,
    })

    return NextResponse.json({ success: true, count: created.count })
  } catch (error) {
    console.error("[RejectPO API] Create error:", error)
    return NextResponse.json(
      { success: false, count: 0, error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const poIds = req.nextUrl.searchParams.get("ids")?.split(",") || []

    await prisma.rejectPO.deleteMany({
      where: { id: { in: poIds } },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[RejectPO API] Delete error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}



