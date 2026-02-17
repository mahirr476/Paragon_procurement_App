

import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import * as http from "http"

export async function POST(request: NextRequest) {
  try {
    console.log("[Push PO Approvals API] ========== NEW REQUEST ==========")
    
    const body = await request.json()
    const { orderNoList } = body

    if (!orderNoList || !Array.isArray(orderNoList) || orderNoList.length === 0) {
      return NextResponse.json(
        { success: false, error: "OrderNoList is required and must be a non-empty array" },
        { status: 400 }
      )
    }

    // Validate that each item has required fields
    for (const order of orderNoList) {
      if (!order.OrderNumber || !order.ApprovalLevel || !order.EmpId || !order.Status) {
        return NextResponse.json(
          { 
            success: false, 
            error: "Each order must have OrderNumber, ApprovalLevel, EmpId, and Status",
            invalidOrder: order
          },
          { status: 400 }
        )
      }
    }

    const requestBody = JSON.stringify({
      RequestObject: {
        OrderNoList: orderNoList
      }
    })

    console.log("[Push PO Approvals API] Request body:", requestBody)

    const responseData = await new Promise<{ status: number; data: string }>((resolve, reject) => {
      const options: http.RequestOptions = {
        hostname: "164.52.205.7",
        port: 80,
        path: "/PAPI/pushPOApprovals",
        method: "POST",
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

      console.log("[Push PO Approvals API] Sending POST request to:", options.hostname + options.path)
      console.log("[Push PO Approvals API] Headers:", options.headers)

      const req = http.request(options, (res) => {
        console.log("[Push PO Approvals API] ===== RESPONSE RECEIVED =====")
        console.log("[Push PO Approvals API] Status:", res.statusCode)
        console.log("[Push PO Approvals API] Headers:", res.headers)

        let data = ""

        res.on("data", (chunk) => {
          data += chunk
        })

        res.on("end", () => {
          console.log("[Push PO Approvals API] Response complete. Length:", data.length)
          console.log("[Push PO Approvals API] Response text:", data)
          resolve({ status: res.statusCode || 200, data })
        })
      })

      req.on("error", (error) => {
        console.error("[Push PO Approvals API] ❌ Request error:", error)
        reject(error)
      })

      req.on("timeout", () => {
        console.error("[Push PO Approvals API] ❌ Timeout")
        req.destroy()
        reject(new Error("Request timeout"))
      })

      console.log("[Push PO Approvals API] Writing body to request...")
      req.write(requestBody)
      req.end()
      console.log("[Push PO Approvals API] Request sent, waiting for response...")
    })

    const { status, data: responseText } = responseData
    const cleanedText = responseText.trim()

    console.log("[Push PO Approvals API] ===== PROCESSING RESPONSE =====")

    // Check for plain errors
    if (cleanedText === "Served at: /PAPI" || cleanedText.startsWith("Served at:")) {
      console.error("[Push PO Approvals API] ❌ Got 'Served at:' error")
      return NextResponse.json(
        { success: false, error: "Endpoint not found", rawResponse: cleanedText },
        { status: 404 }
      )
    }

    // Parse JSON
    let responseData_parsed
    try {
      const jsonObjects = cleanedText.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g)
      if (jsonObjects && jsonObjects.length > 0) {
        responseData_parsed = JSON.parse(jsonObjects[jsonObjects.length - 1])
      } else {
        responseData_parsed = JSON.parse(cleanedText)
      }

      console.log("[Push PO Approvals API] Parsed JSON. Keys:", Object.keys(responseData_parsed))
      console.log("[Push PO Approvals API] Parsed data:", responseData_parsed)
    } catch (parseError) {
      console.error("[Push PO Approvals API] ❌ JSON parse failed:", parseError)
      return NextResponse.json(
        {
          success: false,
          error: "Invalid JSON response",
          rawResponse: cleanedText.substring(0, 500),
        },
        { status: 500 }
      )
    }

    // Check for success (the external API uses Error: "Success" and ErrorCode: "0" to indicate success)
    if (responseData_parsed.Error === "Success" && responseData_parsed.ErrorCode === "0") {
      console.log("[Push PO Approvals API] ✅ SUCCESS!")
      console.log("[Push PO Approvals API] ========================================")

      return NextResponse.json({
        success: true,
        data: responseData_parsed,
        rawResponse: cleanedText,
        statusCode: status,
      })
    }

    // If not success, treat as error
    console.error("[Push PO Approvals API] ❌ API returned error:", responseData_parsed)
    return NextResponse.json(
      {
        success: false,
        error: responseData_parsed.Reason || responseData_parsed.Error || "API Error",
        apiError: responseData_parsed,
      },
      { status: 400 }
    )

  } catch (error: any) {
    console.error("[Push PO Approvals API] ❌ Fatal error:", error.message)
    return NextResponse.json(
      { success: false, error: error.message, details: error.toString() },
      { status: 500 }
    )
  }
}