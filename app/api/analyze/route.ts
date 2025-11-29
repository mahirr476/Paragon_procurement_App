export async function POST(request: Request) {
  try {
    const { query } = await request.json();
    
    if (!query || typeof query !== "string") {
      return Response.json({ error: "Invalid query" }, { status: 400 });
    }

    // Use environment variable for base URL (better for Docker)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    
    // Fetch PO data
    const approvedRes = await fetch(`${baseUrl}/api/pos?approved=true`);
    const approvedJson = await approvedRes.json();
    
    const currentRes = await fetch(`${baseUrl}/api/pos?approved=false`);
    const currentJson = await currentRes.json();
    
    const approvedPOs = approvedJson.pos ?? [];
    const currentPOs = currentJson.pos ?? [];
    
    const poContext = {
      summary: {
        totalCurrentPOs: currentPOs.length,
        totalApprovedPOs: approvedPOs.length,
        totalCurrentAmount: currentPOs.reduce((s, p) => s + (p.totalAmount ?? 0), 0),
        totalApprovedAmount: approvedPOs.reduce((s, p) => s + (p.totalAmount ?? 0), 0),
        uniqueSuppliers: new Set([...currentPOs, ...approvedPOs].map(p => p.supplier)).size,
      },
      currentPOs: currentPOs.slice(0, 20),
      approvedPOs: approvedPOs.slice(0, 20)
    };
    
    const prompt = `
You are a procurement analyst. Answer this question: "${query}"

SUMMARY:
${JSON.stringify(poContext.summary, null, 2)}

CURRENT POs:
${JSON.stringify(poContext.currentPOs, null, 2)}

APPROVED POs:
${JSON.stringify(poContext.approvedPOs, null, 2)}
`;

    // Try Gemini first (FREE & FAST)
    let analysis = await tryGemini(prompt);
    
    // If Gemini fails, fallback to Groq
    if (!analysis) {
      console.log("⚠️ Gemini failed, trying Groq fallback...");
      analysis = await tryGroq(prompt);
    }
    
    if (!analysis) {
      return Response.json({ 
        error: "All AI providers are currently unavailable. Please try again later." 
      }, { status: 503 });
    }
    
    return Response.json({ analysis });
    
  } catch (err) {
    console.error("AI Analysis Error:", err);
    return Response.json({ 
      error: "Failed to analyze data" 
    }, { status: 500 });
  }
}

// Try Gemini API (Primary - Free & Fast)
async function tryGemini(prompt: string): Promise<string | null> {
  try {
    if (!process.env.GEMINI_API_KEY) {
      console.log("⚠️ GEMINI_API_KEY not configured");
      return null;
    }

    console.log("🔵 Trying GEMINI...");
    
    const aiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            maxOutputTokens: 800,
            temperature: 0.7
          }
        }),
      }
    );
    
    if (!aiRes.ok) {
      const errorData = await aiRes.json().catch(() => ({}));
      console.error("❌ Gemini error:", aiRes.status, errorData);
      return null;
    }
    
    const aiData = await aiRes.json();
    const analysis = aiData?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (analysis) {
      console.log("✅ Gemini succeeded");
      return analysis;
    }
    
    return null;
  } catch (err) {
    console.error("❌ Gemini exception:", err);
    return null;
  }
}

// Try Groq API (Fallback - Fast)
async function tryGroq(prompt: string): Promise<string | null> {
  try {
    if (!process.env.GROQ_API_KEY) {
      console.log("⚠️ GROQ_API_KEY not configured");
      return null;
    }

    console.log("🟢 Trying GROQ...");
    
    const models = [
      "llama-3.3-70b-versatile",
      "llama-3.1-8b-instant",
      "mixtral-8x7b-32768"
    ];

    for (const model of models) {
      try {
        console.log(`  → Trying model: ${model}`);
        
        const aiRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
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
            max_tokens: 500,
            temperature: 0.7
          }),
        });

        if (aiRes.ok) {
          const aiData = await aiRes.json();
          const analysis = aiData?.choices?.[0]?.message?.content;
          
          if (analysis) {
            console.log(`✅ Groq succeeded with ${model}`);
            return analysis;
          }
        }

        // If rate limited, try next model
        if (aiRes.status === 429) {
          console.log(`  ⚠️ Rate limited, trying next model...`);
          continue;
        }
        
      } catch (err) {
        console.error(`  ❌ Error with ${model}:`, err);
        continue;
      }
    }
    
    console.log("❌ All Groq models failed");
    return null;
  } catch (err) {
    console.error("❌ Groq exception:", err);
    return null;
  }
}






// export async function POST(request: Request) {
//   try {
//     const { query } = await request.json();
    
//     if (!query || typeof query !== "string") {
//       return Response.json({ error: "Invalid query" }, { status: 400 });
//     }

//     // Use environment variable for base URL (better for Docker)
//     const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    
//     // Fetch PO data
//     const approvedRes = await fetch(`${baseUrl}/api/pos?approved=true`);
//     const approvedJson = await approvedRes.json();
    
//     const currentRes = await fetch(`${baseUrl}/api/pos?approved=false`);
//     const currentJson = await currentRes.json();
    
//     const approvedPOs = approvedJson.pos ?? [];
//     const currentPOs = currentJson.pos ?? [];
    
//     const poContext = {
//       summary: {
//         totalCurrentPOs: currentPOs.length,
//         totalApprovedPOs: approvedPOs.length,
//         totalCurrentAmount: currentPOs.reduce((s, p) => s + (p.totalAmount ?? 0), 0),
//         totalApprovedAmount: approvedPOs.reduce((s, p) => s + (p.totalAmount ?? 0), 0),
//         uniqueSuppliers: new Set([...currentPOs, ...approvedPOs].map(p => p.supplier)).size,
//       },
//       currentPOs: currentPOs.slice(0, 20),
//       approvedPOs: approvedPOs.slice(0, 20)
//     };
    
//     const prompt = `
// You are a procurement analyst. Answer this question: "${query}"

// SUMMARY:
// ${JSON.stringify(poContext.summary, null, 2)}

// CURRENT POs:
// ${JSON.stringify(poContext.currentPOs, null, 2)}

// APPROVED POs:
// ${JSON.stringify(poContext.approvedPOs, null, 2)}
// `;

//     if (!process.env.GEMINI_API_KEY) {
//       console.error("GEMINI_API_KEY is not set");
//       return Response.json({ 
//         error: "API key not configured" 
//       }, { status: 500 });
//     }

//     console.log("=== GEMINI REQUEST ===");
//     console.log("Query:", query);
    
//     // Using gemini-2.5-flash (LATEST, FASTEST, FREE!)
//     const aiRes = await fetch(
//       `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
//       {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           contents: [{
//             parts: [{ text: prompt }]
//           }],
//           generationConfig: {
//             maxOutputTokens: 800,
//             temperature: 0.7
//           }
//         }),
//       }
//     );
    
//     if (!aiRes.ok) {
//       const errorData = await aiRes.json().catch(() => ({ error: "Unknown error" }));
//       console.error("Gemini API error:", {
//         status: aiRes.status,
//         statusText: aiRes.statusText,
//         error: errorData
//       });
      
//       return Response.json({ 
//         error: `Gemini API error: ${JSON.stringify(errorData)}` 
//       }, { status: aiRes.status || 500 });
//     }
    
//     const aiData = await aiRes.json();
    
//     console.log("=== GEMINI FULL RESPONSE ===");
//     console.log(JSON.stringify(aiData, null, 2));
    
//     const analysis = aiData?.candidates?.[0]?.content?.parts?.[0]?.text || "No response";
    
//     console.log("=== GEMINI ANALYSIS ===");
//     console.log(analysis);
//     console.log("======================");
    
//     return Response.json({ analysis });
    
//   } catch (err) {
//     console.error("Gemini Analysis Error:", err);
//     return Response.json({ 
//       error: "Failed to analyze data" 
//     }, { status: 500 });
//   }
// }

// export async function POST(request: Request) {
//   try {
//     const { query } = await request.json();
//     if (!query || typeof query !== "string") {
//       return Response.json({ error: "Invalid query" }, { status: 400 });
//     }

//     // Fetch PO data
//     const approvedRes = await fetch("http://localhost:3000/api/pos?approved=true");
//     const approvedJson = await approvedRes.json();

//     const currentRes = await fetch("http://localhost:3000/api/pos?approved=false");
//     const currentJson = await currentRes.json();

//     const approvedPOs = approvedJson.pos ?? [];
//     const currentPOs = currentJson.pos ?? [];

//     const poContext = {
//       summary: {
//         totalCurrentPOs: currentPOs.length,
//         totalApprovedPOs: approvedPOs.length,
//         totalCurrentAmount: currentPOs.reduce((s, p) => s + (p.totalAmount ?? 0), 0),
//         totalApprovedAmount: approvedPOs.reduce((s, p) => s + (p.totalAmount ?? 0), 0),
//         uniqueSuppliers: new Set([...currentPOs, ...approvedPOs].map(p => p.supplier)).size,
//       },
//       currentPOs: currentPOs.slice(0, 20),
//       approvedPOs: approvedPOs.slice(0, 20)
//     };

//     const prompt = `
// You are a procurement analyst. Answer this question: "${query}"

// SUMMARY:
// ${JSON.stringify(poContext.summary, null, 2)}

// CURRENT POs:
// ${JSON.stringify(poContext.currentPOs, null, 2)}

// APPROVED POs:
// ${JSON.stringify(poContext.approvedPOs, null, 2)}
// `;

//     // Check if API key is set
//     if (!process.env.GROQ_API_KEY) {
//       console.error("GROQ_API_KEY is not set in environment variables");
//       console.error("Available env vars:", Object.keys(process.env).filter(k => k.includes("GROQ") || k.includes("API")));
//       return Response.json({ 
//         error: "API key not configured. Please set GROQ_API_KEY in your environment variables or .env.local file." 
//       }, { status: 500 });
//     }

//     console.log("GROQ_API_KEY is configured");

//     // Try models in order of preference (fallback if rate limited)
//     const models = [
//       "llama-3.3-70b-versatile",
//       "llama-3.1-8b-instant", // Smaller, faster model as fallback
//       "mixtral-8x7b-32768"
//     ];

//     let aiRes;
//     let lastError;
    
//     // Try each model until one works
//     for (const model of models) {
//       try {
//         console.log(`Trying model: ${model}`);
//         aiRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
//           method: "POST",
//           headers: {
//             "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify({
//             model: model,
//             messages: [
//               { role: "system", content: "You are a procurement analytics expert. Provide concise, actionable insights." },
//               { role: "user", content: prompt }
//             ],
//             max_tokens: 500, // Reduced from 800 to save tokens
//             temperature: 0.7
//           }),
//         });

//         // If successful, break out of loop
//         if (aiRes.ok) {
//           break;
//         }

//         // If rate limited, try next model
//         if (aiRes.status === 429) {
//           const errorData = await aiRes.json().catch(() => ({}));
//           lastError = {
//             error: errorData.error?.message || errorData.error || "Rate limit reached",
//             status: 429
//           };
//           console.log(`Model ${model} rate limited, trying next model...`);
//           continue;
//         }

//         // For other errors, break and handle
//         break;
//       } catch (err) {
//         console.error(`Error with model ${model}:`, err);
//         lastError = err;
//         continue;
//       }
//     }

//     if (!aiRes || !aiRes.ok) {
//       let errorData;
//       if (aiRes) {
//         errorData = await aiRes.json().catch(() => ({ error: "Unknown error" }));
//       } else {
//         errorData = lastError || { error: "All models rate limited" };
//       }
      
//       console.error("Groq API error:", {
//         status: aiRes?.status,
//         statusText: aiRes?.statusText,
//         error: errorData
//       });
      
//       // Handle rate limit errors specifically
//       const errorMessage = errorData.error?.message || errorData.error || "Failed to get response";
//       const fullErrorMessage = typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage);
      
//       if (fullErrorMessage.includes("Rate limit") || fullErrorMessage.includes("rate limit") || aiRes?.status === 429 || !aiRes) {
//         // Extract the time remaining if available
//         const timeMatch = fullErrorMessage.match(/Please try again in ([^.]+)/);
//         const timeInfo = timeMatch ? ` Please try again in ${timeMatch[1]}.` : "";
//         return Response.json({ 
//           error: `Rate limit reached for all available models.${timeInfo} Need more tokens? Upgrade at https://console.groq.com/settings/billing` 
//         }, { status: 429 });
//       }
      
//       return Response.json({ 
//         error: `Groq API error: ${fullErrorMessage}` 
//       }, { status: aiRes?.status || 500 });
//     }

//     const aiData = await aiRes.json();
    
//     // Check if response has the expected structure
//     if (!aiData?.choices || !Array.isArray(aiData.choices) || aiData.choices.length === 0) {
//       console.error("Unexpected Groq API response structure:", JSON.stringify(aiData, null, 2));
//       return Response.json({ 
//         error: "Unexpected response format from AI service" 
//       }, { status: 500 });
//     }

//     const analysis = aiData.choices[0]?.message?.content;
    
//     if (!analysis) {
//       console.error("No content in Groq API response:", JSON.stringify(aiData, null, 2));
//       return Response.json({ 
//         error: "AI service returned empty response" 
//       }, { status: 500 });
//     }

//     return Response.json({ analysis });

//   } catch (err) {
//     console.error("Groq Analysis Error:", err);
//     return Response.json({ error: "Failed to analyze data" }, { status: 500 });
//   }
// }


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
