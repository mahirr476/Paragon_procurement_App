import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import * as http from "http"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    console.log("[Pending PO API] ========== NEW REQUEST ==========")
    
    const searchParams = request.nextUrl.searchParams
    const approvalLevel = searchParams.get("approvalLevel") || "2"
    const empId = searchParams.get("empId") || "e0440"
    
    const requestBody = JSON.stringify({
      RequestObject: {
        ApprovalLevel: approvalLevel,
        EmpId: empId
      }
    })
    
    console.log("[Pending PO API] Request body:", requestBody)
    
    const responseData = await new Promise<{ status: number; data: string }>((resolve, reject) => {
      const options: http.RequestOptions = {
        hostname: "164.52.205.7",
        port: 80,
        path: "/PAPI/pullPendingPOApprovals",
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Accept": "*/*",
          "Accept-Encoding": "gzip, deflate",
          "Connection": "keep-alive",
          "Content-Length": Buffer.byteLength(requestBody),
          "User-Agent": "PostmanRuntime/7.32.0",
        },
        timeout: 30000,
      }
      
      console.log("[Pending PO API] Sending GET request with body to:", options.hostname + options.path)
      console.log("[Pending PO API] Headers:", options.headers)
      
      const req = http.request(options, (res) => {
        console.log("[Pending PO API] ===== RESPONSE RECEIVED =====")
        console.log("[Pending PO API] Status:", res.statusCode)
        console.log("[Pending PO API] Headers:", res.headers)
        
        let data = ""
        
        res.on("data", (chunk) => {
          data += chunk
        })
        
        res.on("end", () => {
          console.log("[Pending PO API] Response complete. Length:", data.length)
          console.log("[Pending PO API] Response text:", data)
          resolve({ status: res.statusCode || 200, data })
        })
      })
      
      req.on("error", (error) => {
        console.error("[Pending PO API] ❌ Request error:", error)
        reject(error)
      })
      
      req.on("timeout", () => {
        console.error("[Pending PO API] ❌ Timeout")
        req.destroy()
        reject(new Error("Request timeout"))
      })
      
      console.log("[Pending PO API] Writing body to request...")
      req.write(requestBody)
      req.end()
      console.log("[Pending PO API] Request sent, waiting for response...")
    })
    
    const { status, data: responseText } = responseData
    const cleanedText = responseText.trim()
    
    console.log("[Pending PO API] ===== PROCESSING RESPONSE =====")
    
    // Check for plain errors
    if (cleanedText === "Served at: /PAPI" || cleanedText.startsWith("Served at:")) {
      console.error("[Pending PO API] ❌ Got 'Served at:' error")
      return NextResponse.json({ error: "Endpoint not found", success: false }, { status: 404 })
    }
    
    // Parse JSON
    let data
    try {
      const jsonObjects = cleanedText.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g)
      if (jsonObjects && jsonObjects.length > 0) {
        data = JSON.parse(jsonObjects[jsonObjects.length - 1])
      } else {
        data = JSON.parse(cleanedText)
      }
      
      console.log("[Pending PO API] Parsed JSON. Keys:", Object.keys(data))
    } catch (parseError) {
      console.error("[Pending PO API] ❌ JSON parse failed:", parseError)
      return NextResponse.json({ error: "Invalid JSON", success: false, rawText: cleanedText.substring(0, 500) }, { status: 500 })
    }
    
    // Check for API errors
    if (data.Message === "Error" || data.ErrorCode) {
      console.error("[Pending PO API] ❌ API returned error:", data)
      return NextResponse.json({ error: data.Reason || "API Error", success: false, apiError: data }, { status: 400 })
    }
    
    // Extract data
    let poData = []
    if (data.PoPendingData?.Data && Array.isArray(data.PoPendingData.Data)) {
      poData = data.PoPendingData.Data
    } else if (data.Data && Array.isArray(data.Data)) {
      poData = data.Data
    } else if (Array.isArray(data)) {
      poData = data
    }
    
    console.log("[Pending PO API] ✅ SUCCESS! Found", poData.length, "POs")
    
    // Save to database
    try {
      console.log("[Pending PO API] Saving to database...")
      
      for (const po of poData) {
        await prisma.pendingPO.upsert({
          where: { 
            orderNo_item: {  // Use the combined unique constraint
              orderNo: po.OrderNo,
              item: po.Item
            }
          },
          update: {
            date: po.Date,
            supplier: po.Supplier,
            refNo: po.RefNo || "",
            dueDate: po.DueDate,
            branch: po.Branch,
            requisitionType: po.RequisitionType,
            itemLedgerGroup: po.ItemOrLedgerGroup,
            item: po.Item,
            minQty: parseFloat(po.MinQty) || 0,
            maxQty: parseFloat(po.MaxQty) || 0,
            unit: po.Unit,
            rate: parseFloat(po.Rate) || 0,
            lastApprovedRate: parseFloat(po.LastApprovedRate) || 0,
            lastSupplier: po.LastSupplier || "",
            totalAmount: parseFloat(po.TotalAmount) || 0,
            status: po.Status || "pending",
            deliveryType: po.DeliveryType,
            approvalLevel: approvalLevel,
            empId: empId,
            isProcessed: false,
          },
          create: {
            orderNo: po.OrderNo,
            date: po.Date,
            supplier: po.Supplier,
            refNo: po.RefNo || "",
            dueDate: po.DueDate,
            branch: po.Branch,
            requisitionType: po.RequisitionType,
            itemLedgerGroup: po.ItemOrLedgerGroup,
            item: po.Item,
            minQty: parseFloat(po.MinQty) || 0,
            maxQty: parseFloat(po.MaxQty) || 0,
            unit: po.Unit,
            rate: parseFloat(po.Rate) || 0,
            lastApprovedRate: parseFloat(po.LastApprovedRate) || 0,
            lastSupplier: po.LastSupplier || "",
            totalAmount: parseFloat(po.TotalAmount) || 0,
            status: po.Status || "pending",
            deliveryType: po.DeliveryType,
            approvalLevel: approvalLevel,
            empId: empId,
          },
        })
      }
      
      console.log("[Pending PO API] ✅ Saved", poData.length, "POs to database")
    } catch (dbError) {
      console.error("[Pending PO API] ❌ Database save error:", dbError)
      // Continue anyway - return API data even if DB save fails
    }
    
    console.log("[Pending PO API] ========================================")
    
    return NextResponse.json({ success: true, data: poData, count: poData.length })
    
  } catch (error: any) {
    console.error("[Pending PO API] ❌ Fatal error:", error.message)
    return NextResponse.json({ error: error.message, success: false }, { status: 500 })
  }
}