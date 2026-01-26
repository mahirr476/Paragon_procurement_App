import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("[Test API] Testing external API connection...")
    
    const testUrl = "http://164.52.205.7/PAPI/pullPendingPOApprovals"
    
    try {
      const response = await fetch(testUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        cache: "no-store",
      })
      
      console.log("[Test API] Response status:", response.status)
      
      if (response.ok) {
        const text = await response.text()
        return NextResponse.json({
          success: true,
          status: response.status,
          message: "Connection successful",
          responseLength: text.length,
          preview: text.substring(0, 200)
        })
      } else {
        return NextResponse.json({
          success: false,
          status: response.status,
          message: `API returned error: ${response.statusText}`
        }, { status: response.status })
      }
    } catch (error: any) {
      console.error("[Test API] Error details:", {
        name: error?.name,
        message: error?.message,
        code: error?.code,
        errno: error?.errno,
        cause: error?.cause,
        stack: error?.stack
      })
      
      return NextResponse.json({
        success: false,
        error: error.message || "Unknown error",
        code: error.code,
        errno: error.errno,
        details: error.toString()
      }, { status: 500 })
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

