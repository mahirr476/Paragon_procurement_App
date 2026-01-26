import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  // Define baseUrl at function scope so it's available in error handling
  const baseUrl = "http://164.52.205.7/PAPI/pullPendingPOApprovals"
  
  try {
    console.log("[Pending PO API] Starting fetch to external API...")
    
    // Add timeout and better error handling
    // Increased timeout for Docker network issues
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 60000) // 60 second timeout (Docker may need more time)
    
    let response
    try {
      // Get query parameters from request (if any)
      const searchParams = request.nextUrl.searchParams
      const queryString = searchParams.toString()
      // Get request parameters (can be overridden via query params)
      const approvalLevel = searchParams.get("approvalLevel") || "2"
      const empId = searchParams.get("empId") || "e0440"
      
      // Note: Postman allows GET with body, but fetch API doesn't support body with GET
      // We'll use POST method (standard for sending body data)
      // The server should accept POST with the same body structure
      const requestBody = {
        RequestObject: {
          ApprovalLevel: approvalLevel,
          EmpId: empId
        }
      }
      
      console.log("[Pending PO API] ===== REQUEST DETAILS =====")
      console.log("[Pending PO API] URL:", baseUrl)
      console.log("[Pending PO API] Method: POST (fetch API doesn't support GET with body)")
      console.log("[Pending PO API] Body:", JSON.stringify(requestBody, null, 2))
      console.log("[Pending PO API] Note: Postman uses GET+body, but we use POST+body (same data)")
      
      // Match Postman request headers
      const requestHeaders = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept-Encoding": "gzip, deflate",
        "Connection": "keep-alive",
      }
      
      console.log("[Pending PO API] Headers:", requestHeaders)
      
      // Use POST method (standard way to send body data)
      // The server should accept POST with RequestObject body
      response = await fetch(baseUrl, {
        method: "POST",
        headers: requestHeaders,
        body: JSON.stringify(requestBody),
        cache: "no-store",
        signal: controller.signal,
        redirect: "follow",
      })
      
      console.log("[Pending PO API] ===== RESPONSE DETAILS =====")
      console.log("[Pending PO API] Status:", response.status, response.statusText)
      console.log("[Pending PO API] URL (after redirects):", response.url)
      console.log("[Pending PO API] Final URL vs Original:", {
        original: baseUrl,
        final: response.url,
        redirected: response.url !== baseUrl
      })
      console.log("[Pending PO API] Response Headers:", Object.fromEntries(response.headers.entries()))
      
      // Check if we got redirected
      if (response.url !== baseUrl) {
        console.warn("[Pending PO API] ⚠️ URL was redirected from", baseUrl, "to", response.url)
        console.warn("[Pending PO API] This might indicate the endpoint path is incorrect")
      }
      
      clearTimeout(timeoutId)
      console.log("[Pending PO API] Fetch successful, status:", response.status)
      
      // If POST returns "Served at:" error, try GET with query parameters as fallback
      // (Some servers might only accept GET, but we can't send body with GET in fetch API)
      // So we'll try query parameters instead
      const responseTextPreview = await response.clone().text()
      if (responseTextPreview.includes("Served at:") && response.status === 200) {
        console.warn("[Pending PO API] POST returned 'Served at:' error. Trying GET with query parameters as fallback...")
        
        const getUrlWithParams = `${baseUrl}?ApprovalLevel=${approvalLevel}&EmpId=${empId}`
        console.log("[Pending PO API] Trying GET with query params:", getUrlWithParams)
        
        try {
          const getResponse = await fetch(getUrlWithParams, {
            method: "GET",
            headers: {
              "Accept": "application/json",
            },
            cache: "no-store",
            signal: controller.signal,
          })
          
          const getResponseText = await getResponse.text()
          if (!getResponseText.includes("Served at:")) {
            console.log("[Pending PO API] GET with query params succeeded!")
            response = getResponse
          } else {
            console.warn("[Pending PO API] GET with query params also failed")
            // Use original POST response
          }
        } catch (getError) {
          console.warn("[Pending PO API] GET fallback failed:", getError)
          // Use original POST response
        }
      }
    } catch (fetchError: any) {
      clearTimeout(timeoutId)
      
      // Log detailed error information
      console.error("[Pending PO API] Fetch error details:", {
        name: fetchError?.name,
        message: fetchError?.message,
        cause: fetchError?.cause,
        code: fetchError?.code,
        errno: fetchError?.errno,
        syscall: fetchError?.syscall,
        hostname: fetchError?.hostname,
        stack: fetchError?.stack,
        toString: fetchError?.toString(),
        fullError: JSON.stringify(fetchError, Object.getOwnPropertyNames(fetchError))
      })
      
      if (fetchError.name === 'AbortError') {
        return NextResponse.json(
          { 
            error: "Request timeout - API took too long to respond",
            success: false 
          },
          { status: 504 }
        )
      }
      
      // Check for specific error types
      let errorMessage = "Failed to connect to API"
      let errorDetails = fetchError.message || "Unknown network error"
      
      // Check for timeout errors (common in Docker)
      if (fetchError.cause?.message?.includes('Connect Timeout') || fetchError.message?.includes('timeout')) {
        errorMessage = "Connection timeout - Docker container cannot reach external API"
        errorDetails = "The Docker container cannot connect to the external API server. This is a network connectivity issue from Docker to the external API."
      } else if (fetchError.code === 'ENOTFOUND' || fetchError.code === 'EAI_AGAIN') {
        errorMessage = "DNS resolution failed - Cannot resolve API hostname"
        errorDetails = `Hostname: ${fetchError.hostname || '164.52.205.7'}`
      } else if (fetchError.code === 'ECONNREFUSED') {
        errorMessage = "Connection refused - API server is not accepting connections"
      } else if (fetchError.code === 'ETIMEDOUT') {
        errorMessage = "Connection timeout - API server did not respond in time"
      } else if (fetchError.code === 'ECONNRESET') {
        errorMessage = "Connection reset - API server closed the connection"
      }
      
      return NextResponse.json(
        { 
          error: errorMessage,
          success: false,
          details: errorDetails,
          code: fetchError.code,
          errno: fetchError.errno,
          troubleshooting: fetchError.cause?.message?.includes('Connect Timeout') ? [
            "1. Docker container cannot reach external API - this is a network issue",
            "2. Try running the dev server outside Docker: npm run dev (instead of docker-compose)",
            "3. Or configure Docker network to allow external access",
            "4. Check if the API server (164.52.205.7) is accessible from your network",
            "5. Verify firewall/VPN settings allow Docker to access external IPs"
          ] : undefined
        },
        { status: 500 }
      )
    }

    console.log("[Pending PO API] Response status:", response.status, response.statusText)
    console.log("[Pending PO API] Response Content-Type:", response.headers.get("content-type"))
    console.log("[Pending PO API] Response URL:", response.url)
    console.log("[Pending PO API] Response type:", response.type) // basic, cors, error, opaque, opaqueredirect
    console.log("[Pending PO API] Response redirected:", response.redirected)

    // Get response text first to check what we're dealing with (can only read once)
    const text = await response.text()
    console.log("[Pending PO API] ===== RESPONSE TEXT ANALYSIS =====")
    console.log("[Pending PO API] Response text length:", text.length)
    console.log("[Pending PO API] Response text (first 1000 chars):", text.substring(0, 1000))
    console.log("[Pending PO API] Response contains 'Served at:':", text.includes("Served at:"))
    console.log("[Pending PO API] Response contains 'PoPendingData':", text.includes("PoPendingData"))
    console.log("[Pending PO API] Response contains JSON braces:", text.includes("{") && text.includes("}"))
    console.log("[Pending PO API] Full response text:", text)
    
    // Check Content-Type header first
    const contentType = response.headers.get("content-type") || ""
    const isJsonContentType = contentType.includes("application/json") || contentType.includes("text/json")
    const isHtmlContentType = contentType.includes("text/html")
    
    // Check if response actually contains HTML tags (not just plain text)
    const hasHtmlTags = text.includes("<html") || text.includes("<!DOCTYPE") || (text.trim().startsWith("<") && text.includes(">"))
    
    // Only treat as HTML if Content-Type says HTML AND it has HTML tags
    // Plain text responses like "Served at: /PAPI" should not be treated as HTML
    if (isHtmlContentType && hasHtmlTags) {
      console.error("[Pending PO API] API returned HTML/error page. Full response:", text)
      
      const isRedirect = response.url !== baseUrl
      const responseInfo = {
        requestedUrl: baseUrl,
        actualUrl: response.url,
        status: response.status,
        contentType: response.headers.get("content-type"),
        responsePreview: text.substring(0, 200)
      }
      
      console.error("[Pending PO API] Response details:", responseInfo)
      
      return NextResponse.json(
        { 
          error: "API returned HTML error page.",
          success: false,
          details: text.substring(0, 500),
          status: response.status,
          responseInfo: responseInfo,
          troubleshooting: [
            "1. Verify the API endpoint URL is correct",
            "2. Check if the API requires authentication headers",
            "3. Verify the request method (GET vs POST)",
            "4. Check if the API server is accessible from your network"
          ]
        },
        { status: response.status || 500 }
      )
    }

    if (!response.ok) {
      console.error("[Pending PO API] Response not OK:", response.status, text.substring(0, 200))
      return NextResponse.json(
        { 
          error: `API request failed: ${response.status} ${response.statusText}`,
          success: false,
          details: text.substring(0, 500)
        },
        { status: response.status }
      )
    }
    
    // Check for plain text errors BEFORE trying to parse JSON
    const cleanedText = text.trim()
    
    // Check if it's a simple plain text error like "Served at: /PAPI"
    // If it's just plain text without JSON structure, it's likely an error
    if (cleanedText === "Served at: /PAPI" || (cleanedText.startsWith("Served at:") && !cleanedText.includes("{"))) {
      console.error("[Pending PO API] API returned plain text error:", cleanedText)
      console.error("[Pending PO API] This usually means:")
      console.error("  - The endpoint path might be incorrect")
      console.error("  - The server might expect a different request format")
      console.error("  - The API might require authentication or different headers")
      
      return NextResponse.json(
        { 
          error: `API Error: ${cleanedText}`,
          success: false,
          details: "The API endpoint may be incorrect or the server is not responding correctly. The server returned a plain text message instead of JSON. 'Served at: /PAPI' typically indicates the endpoint path was not found on the server.",
          troubleshooting: [
            "1. Verify the API endpoint URL is correct: http://164.52.205.7/PAPI/pullPendingPOApprovals",
            "2. Check if the endpoint path should be different (e.g., /PAPI/pullPendingPOApprovals vs /pullPendingPOApprovals)",
            "3. Verify the request parameters: ApprovalLevel='2', EmpId='e0440'",
            "4. Check if the API requires authentication headers or API keys",
            "5. Try testing the endpoint directly in Postman or curl to verify it works",
            "6. Contact the API administrator - 'Served at: /PAPI' suggests a server routing/configuration issue",
            "7. Check if the API server documentation specifies a different endpoint format"
          ],
          requestDetails: {
            url: baseUrl,
            method: "POST",
            body: {
              RequestObject: {
                ApprovalLevel: "2",
                EmpId: "e0440"
              }
            },
            note: "Using POST method (fetch API doesn't support GET with body, but body structure matches Postman)"
          }
        },
        { status: 400 }
      )
    }
    
    // Try to parse JSON, handle multiple JSON objects or malformed JSON
    let data
    try {
      // cleanedText is already defined above, continue with JSON parsing
      
      // Check if response contains error message in JSON format
      if (cleanedText.includes('"Message":"Error"') || cleanedText.includes('"ErrorCode"')) {
        console.warn("[Pending PO API] API returned error response")
        // Try to parse the error JSON - handle multiple JSON objects
        try {
          // Split by }{ to get individual JSON objects
          const jsonParts = cleanedText.split('}{')
          for (const part of jsonParts) {
            try {
              const jsonStr = part.startsWith('{') ? part : '{' + part
              const jsonStr2 = jsonStr.endsWith('}') ? jsonStr : jsonStr + '}'
              const errorJson = JSON.parse(jsonStr2)
              if (errorJson.Message === "Error") {
                console.error("[Pending PO API] API Error:", errorJson)
                return NextResponse.json(
                  { 
                    error: `API Error: ${errorJson.Reason || errorJson.Message}`,
                    success: false,
                    errorCode: errorJson.ErrorCode,
                    apiResponse: errorJson,
                    note: "The API requires specific request parameters. Please check the API documentation."
                  },
                  { status: 400 }
                )
              }
            } catch (e) {
              // Try next part
            }
          }
        } catch (e) {
          console.error("[Pending PO API] Error parsing error response:", e)
        }
      }
      
      // Find the last valid JSON object (in case of multiple JSON objects)
      let lastValidJson = cleanedText
      let braceCount = 0
      let lastBraceIndex = -1
      
      // If there are multiple JSON objects, find the last complete one
      const jsonObjects = cleanedText.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g)
      if (jsonObjects && jsonObjects.length > 0) {
        // Use the last JSON object (which should be the actual data)
        lastValidJson = jsonObjects[jsonObjects.length - 1]
      } else {
        // Fallback to original method
        for (let i = cleanedText.length - 1; i >= 0; i--) {
          if (cleanedText[i] === '}') {
            if (braceCount === 0) {
              lastBraceIndex = i
            }
            braceCount++
          } else if (cleanedText[i] === '{') {
            braceCount--
            if (braceCount === 0 && lastBraceIndex !== -1) {
              lastValidJson = cleanedText.substring(i, lastBraceIndex + 1)
              break
            }
          }
        }
      }
      
      data = JSON.parse(lastValidJson)
      console.log("[Pending PO API] Parsed JSON keys:", Object.keys(data))
    } catch (parseError) {
      console.error("[Pending PO API] JSON parse error:", parseError, "Response text:", text.substring(0, 200))
      return NextResponse.json(
        { 
          error: "Invalid JSON response from API",
          success: false,
          rawText: text.substring(0, 500)
        },
        { status: 500 }
      )
    }
    
    // Log the response structure for debugging
    console.log("[Pending PO API] Response structure:", {
      hasPoPendingData: !!data.PoPendingData,
      hasData: !!data.PoPendingData?.Data,
      dataLength: data.PoPendingData?.Data?.length || 0,
      keys: Object.keys(data || {}),
      firstLevelKeys: data ? Object.keys(data) : []
    })
    
    // Try different possible response structures
    let poData = []
    
    if (data.PoPendingData?.Data && Array.isArray(data.PoPendingData.Data)) {
      poData = data.PoPendingData.Data
    } else if (data.Data && Array.isArray(data.Data)) {
      poData = data.Data
    } else if (Array.isArray(data)) {
      poData = data
    } else if (data.poPendingData?.data && Array.isArray(data.poPendingData.data)) {
      poData = data.poPendingData.data
    }
    
    console.log("[Pending PO API] Extracted data length:", poData.length)
    
    if (poData.length === 0) {
      console.warn("[Pending PO API] No data found. Full response:", JSON.stringify(data).substring(0, 500))
    }
    
    return NextResponse.json({ 
      success: true, 
      data: poData,
      raw: data 
    })
  } catch (error) {
    console.error("[Pending PO API] Unexpected error:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch data"
    const errorStack = error instanceof Error ? error.stack : undefined
    
    return NextResponse.json(
      { 
        error: errorMessage,
        success: false,
        stack: process.env.NODE_ENV === 'development' ? errorStack : undefined
      },
      { status: 500 }
    )
  }
}

