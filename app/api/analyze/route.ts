export async function POST(request: Request) {
  try {
    const { query } = await request.json();
    if (!query || typeof query !== "string") {
      return Response.json({ error: "Invalid query" }, { status: 400 });
    }

    // Fetch PO data
    const approvedRes = await fetch("http://localhost:3000/api/pos?approved=true");
    const approvedJson = await approvedRes.json();

    const currentRes = await fetch("http://localhost:3000/api/pos?approved=false");
    const currentJson = await currentRes.json();

    const approvedPOs = approvedJson.pos ?? [];
    const currentPOs = currentJson.pos ?? [];

    // Calculate summary
    const summary = {
      totalCurrentPOs: currentPOs.length,
      totalApprovedPOs: approvedPOs.length,
      totalCurrentAmount: currentPOs.reduce((s, p) => s + (p.totalAmount ?? 0), 0),
      totalApprovedAmount: approvedPOs.reduce((s, p) => s + (p.totalAmount ?? 0), 0),
      uniqueSuppliers: new Set([...currentPOs, ...approvedPOs].map(p => p.supplier)).size,
    };

    // Reduce data size: only send essential fields and limit count
    const getEssentialFields = (po: any) => ({
      supplier: po.supplier,
      item: po.item,
      qty: po.maxQty || po.qty,
      rate: po.rate,
      totalAmount: po.totalAmount,
      ...(po.lastApprovedRate && { lastApprovedRate: po.lastApprovedRate }),
      ...(po.status && { status: po.status }),
    });

    // Limit to 10 POs each to reduce token usage
    const currentPOsSample = currentPOs.slice(0, 10).map(getEssentialFields);
    const approvedPOsSample = approvedPOs.slice(0, 10).map(getEssentialFields);

    // Create a more compact prompt
    const prompt = `You are a procurement analyst. Answer: "${query}"

Summary: ${summary.totalCurrentPOs} current POs (₹${summary.totalCurrentAmount.toLocaleString()}), ${summary.totalApprovedPOs} approved (₹${summary.totalApprovedAmount.toLocaleString()}), ${summary.uniqueSuppliers} suppliers.

Current POs (sample): ${JSON.stringify(currentPOsSample)}
Approved POs (sample): ${JSON.stringify(approvedPOsSample)}`;

    // Check if API key is set
    if (!process.env.GROQ_API_KEY) {
      console.error("GROQ_API_KEY is not set in environment variables");
      console.error("Available env vars:", Object.keys(process.env).filter(k => k.includes("GROQ") || k.includes("API")));
      return Response.json({ 
        error: "API key not configured. Please set GROQ_API_KEY in your environment variables or .env.local file." 
      }, { status: 500 });
    }

    console.log("GROQ_API_KEY is configured");

    // Try models in order of preference (higher token limits first)
    // llama-3.3-70b-versatile has higher TPM limits than llama-3.1-8b-instant
    const models = [
      "llama-3.3-70b-versatile", // Higher token limit
      "mixtral-8x7b-32768", // Also has good token limits
      "llama-3.1-8b-instant" // Lower token limit, use as last resort
    ];

    let aiRes;
    let lastError;
    
    // Try each model until one works
    for (const model of models) {
      try {
        console.log(`Trying model: ${model}`);
        aiRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: model,
            messages: [
              { role: "system", content: "You are a procurement analytics expert. Provide concise, actionable insights." },
              { role: "user", content: prompt }
            ],
            max_tokens: 500, // Reduced from 800 to save tokens
            temperature: 0.7
          }),
        });

        // If successful, break out of loop
        if (aiRes.ok) {
          break;
        }

        // If rate limited or request too large, try next model
        if (aiRes.status === 429) {
          let errorData: any = {};
          try {
            errorData = await aiRes.json();
          } catch (e) {
            const text = await aiRes.text().catch(() => "");
            errorData = { error: text || "Rate limit reached" };
          }
          const errorMsg = errorData.error?.message || errorData.error || errorData.message || "Rate limit reached";
          lastError = {
            error: errorMsg,
            status: 429
          };
          console.log(`Model ${model} rate limited, trying next model...`);
          continue;
        }

        // If request too large, try next model with higher limits
        if (aiRes.status === 400 || aiRes.status === 413) {
          let errorData: any = {};
          try {
            errorData = await aiRes.json();
          } catch (e) {
            const text = await aiRes.text().catch(() => "");
            errorData = { error: text || "Request too large" };
          }
          const errorMsg = errorData.error?.message || errorData.error || errorData.message || "Request too large";
          if (errorMsg.includes("too large") || errorMsg.includes("Request too large") || errorMsg.includes("TPM") || errorMsg.includes("tokens per minute")) {
            lastError = {
              error: errorMsg,
              status: aiRes.status
            };
            console.log(`Model ${model} request too large, trying next model with higher limits...`);
            continue;
          }
        }

        // For other errors, break and handle
        console.log(`Model ${model} failed with status ${aiRes.status}, stopping model iteration`);
        break;
      } catch (err) {
        console.error(`Error with model ${model}:`, err);
        lastError = err;
        continue;
      }
    }

    if (!aiRes || !aiRes.ok) {
      let errorData: any = {};
      let errorText = "";
      
      if (aiRes) {
        try {
          // Try to parse as JSON first
          errorData = await aiRes.json();
        } catch (jsonError) {
          // If JSON parsing fails, try to get text response
          try {
            errorText = await aiRes.text();
            console.error("Groq API returned non-JSON error:", errorText);
            // Try to extract error from text
            errorData = { error: errorText || "Unknown error" };
          } catch (textError) {
            console.error("Failed to read error response:", textError);
            errorData = { error: `HTTP ${aiRes.status}: ${aiRes.statusText || "Unknown error"}` };
          }
        }
      } else {
        errorData = lastError || { error: "All models failed" };
      }
      
      console.error("Groq API error:", {
        status: aiRes?.status,
        statusText: aiRes?.statusText,
        error: errorData,
        errorText: errorText
      });
      
      // Extract error message from various possible structures
      let errorMessage = "";
      if (errorData?.error) {
        if (typeof errorData.error === 'string') {
          errorMessage = errorData.error;
        } else if (errorData.error?.message) {
          errorMessage = errorData.error.message;
        } else if (errorData.error?.error?.message) {
          errorMessage = errorData.error.error.message;
        } else {
          errorMessage = JSON.stringify(errorData.error);
        }
      } else if (errorData?.message) {
        errorMessage = errorData.message;
      } else if (errorText) {
        errorMessage = errorText;
      } else {
        errorMessage = errorData?.error || `HTTP ${aiRes?.status || 500}: ${aiRes?.statusText || "Unknown error"}`;
      }
      
      const fullErrorMessage = typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage);
      
      // Handle invalid API key errors specifically
      if (aiRes?.status === 401 || 
          fullErrorMessage.includes("Invalid API Key") || 
          fullErrorMessage.includes("invalid api key") ||
          fullErrorMessage.includes("authentication") ||
          fullErrorMessage.includes("Unauthorized")) {
        return Response.json({ 
          error: "Invalid API Key. Please check your GROQ_API_KEY in your .env.local file. Get your API key at https://console.groq.com/keys" 
        }, { status: 401 });
      }
      
      // Handle "Request too large" / TPM limit errors
      if (fullErrorMessage.includes("too large") || 
          fullErrorMessage.includes("Request too large") || 
          fullErrorMessage.includes("TPM") ||
          fullErrorMessage.includes("tokens per minute") ||
          aiRes?.status === 413) {
        return Response.json({ 
          error: `Request too large for available models. The data is too extensive. Please try a more specific question or upgrade your Groq account at https://console.groq.com/settings/billing` 
        }, { status: 413 });
      }
      
      if (fullErrorMessage.includes("Rate limit") || fullErrorMessage.includes("rate limit") || aiRes?.status === 429 || !aiRes) {
        // Extract the time remaining if available
        const timeMatch = fullErrorMessage.match(/Please try again in ([^.]+)/);
        const timeInfo = timeMatch ? ` Please try again in ${timeMatch[1]}.` : "";
        return Response.json({ 
          error: `Rate limit reached for all available models.${timeInfo} Need more tokens? Upgrade at https://console.groq.com/settings/billing` 
        }, { status: 429 });
      }
      
      // For unknown errors, provide more context
      const statusCode = aiRes?.status || 500;
      const statusMessage = aiRes?.statusText || "Internal Server Error";
      
      return Response.json({ 
        error: fullErrorMessage || `Groq API error (${statusCode}): ${statusMessage}. Please check the console for more details.` 
      }, { status: statusCode });
    }

    const aiData = await aiRes.json();
    
    // Check if response has the expected structure
    if (!aiData?.choices || !Array.isArray(aiData.choices) || aiData.choices.length === 0) {
      console.error("Unexpected Groq API response structure:", JSON.stringify(aiData, null, 2));
      return Response.json({ 
        error: "Unexpected response format from AI service" 
      }, { status: 500 });
    }

    const analysis = aiData.choices[0]?.message?.content;
    
    if (!analysis) {
      console.error("No content in Groq API response:", JSON.stringify(aiData, null, 2));
      return Response.json({ 
        error: "AI service returned empty response" 
      }, { status: 500 });
    }

    return Response.json({ analysis });

  } catch (err) {
    console.error("Groq Analysis Error:", err);
    
    // Extract meaningful error message
    let errorMessage = "Failed to analyze data";
    if (err instanceof Error) {
      errorMessage = err.message;
    } else if (typeof err === 'string') {
      errorMessage = err;
    } else if (err && typeof err === 'object' && 'message' in err) {
      errorMessage = String((err as any).message);
    }
    
    return Response.json({ 
      error: errorMessage || "An unexpected error occurred while analyzing your request. Please try again." 
    }, { status: 500 });
  }
}


// import { generateText } from 'ai'
// import { getCurrentPOs, getApprovedPOs } from '@/lib/storage'

// export async function POST(request: Request) {
//   try {
//     const { query } = await request.json()

//     if (!query || typeof query !== 'string') {
//       return Response.json({ error: 'Invalid query' }, { status: 400 })
//     }

//     const currentPOs = getCurrentPOs()
//     const approvedPOs = getApprovedPOs()

//     // Prepare context for AI
//     const poContext = {
//       currentPOs: currentPOs.map(po => ({
//         supplier: po.supplier,
//         item: po.item,
//         qty: po.maxQty,
//         rate: po.rate,
//         totalAmount: po.totalAmount,
//         lastApprovedRate: po.lastApprovedRate,
//         status: po.status,
//       })),
//       approvedPOs: approvedPOs.map(po => ({
//         supplier: po.supplier,
//         item: po.item,
//         rate: po.rate,
//         totalAmount: po.totalAmount,
//       })),
//       summary: {
//         totalCurrentPOs: currentPOs.length,
//         totalCurrentAmount: currentPOs.reduce((sum, po) => sum + po.totalAmount, 0),
//         totalApprovedAmount: approvedPOs.reduce((sum, po) => sum + po.totalAmount, 0),
//         uniqueSuppliers: new Set([...currentPOs, ...approvedPOs].map(po => po.supplier)).size,
//       }
//     }

//     const prompt = `You are an expert procurement analyst. Analyze the following purchase order data and answer this question: "${query}"

// PO Data Summary:
// - Current POs to Approve: ${poContext.summary.totalCurrentPOs}
// - Current Total Amount: ₹${poContext.summary.totalCurrentAmount.toLocaleString()}
// - Total Approved Amount: ₹${poContext.summary.totalApprovedAmount.toLocaleString()}
// - Unique Suppliers: ${poContext.summary.uniqueSuppliers}

// Current POs Details:
// ${JSON.stringify(poContext.currentPOs.slice(0, 20), null, 2)}

// Approved POs Historical Data (Sample):
// ${JSON.stringify(poContext.approvedPOs.slice(0, 10), null, 2)}

// Provide a concise, actionable analysis with specific insights and recommendations related to the procurement data.`

//     const { text } = await generateText({
//       model: 'anthropic/claude-3-5-sonnet-20241022',
//       prompt: prompt,
//       temperature: 0.7,
//       maxTokens: 1000,
//     })

//     return Response.json({ analysis: text })
//   } catch (error) {
//     console.error('[v0] AI analysis error:', error)
//     return Response.json(
//       { error: 'Failed to analyze data' },
//       { status: 500 }
//     )
//   }
// }
