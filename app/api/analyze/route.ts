// import Anthropic from '@anthropic-ai/sdk';

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

//     // Calculate summary
//     const summary = {
//       totalCurrentPOs: currentPOs.length,
//       totalApprovedPOs: approvedPOs.length,
//       totalCurrentAmount: currentPOs.reduce((s, p) => s + (p.totalAmount ?? 0), 0),
//       totalApprovedAmount: approvedPOs.reduce((s, p) => s + (p.totalAmount ?? 0), 0),
//       uniqueSuppliers: new Set([...currentPOs, ...approvedPOs].map(p => p.supplier)).size,
//     };

//     // Reduce data size: only send essential fields and limit count
//     const getEssentialFields = (po: any) => ({
//       supplier: po.supplier,
//       item: po.item,
//       qty: po.maxQty || po.qty,
//       rate: po.rate,
//       totalAmount: po.totalAmount,
//       ...(po.lastApprovedRate && { lastApprovedRate: po.lastApprovedRate }),
//       ...(po.status && { status: po.status }),
//     });

//     // Limit to 10 POs each to reduce token usage
//     const currentPOsSample = currentPOs.slice(0, 10).map(getEssentialFields);
//     const approvedPOsSample = approvedPOs.slice(0, 10).map(getEssentialFields);

//     // Create a more compact prompt
//     const prompt = `You are a procurement analyst. Answer: "${query}"

// Summary: ${summary.totalCurrentPOs} current POs (৳${summary.totalCurrentAmount.toLocaleString()}), ${summary.totalApprovedPOs} approved (৳${summary.totalApprovedAmount.toLocaleString()}), ${summary.uniqueSuppliers} suppliers.

// Current POs (sample): ${JSON.stringify(currentPOsSample)}
// Approved POs (sample): ${JSON.stringify(approvedPOsSample)}`;

//     // Try Claude first (PRIMARY - Best Quality)
//     let analysis = await tryClaude(prompt);
    
//     // If Claude fails, fallback to Gemini
//     if (!analysis) {
//       console.log("⚠️ Claude failed, trying Gemini fallback...");
//       analysis = await tryGemini(prompt);
//     }
    
//     // If Gemini fails, fallback to Groq
//     if (!analysis) {
//       console.log("⚠️ Gemini failed, trying Groq fallback...");
//       analysis = await tryGroq(prompt);
//     }
    
//     if (!analysis) {
//       return Response.json({ 
//         error: "All AI providers are currently unavailable. Please try again later." 
//       }, { status: 503 });
//     }
    
//     return Response.json({ analysis });
    
//   } catch (err) {
//     console.error("AI Analysis Error:", err);
//     return Response.json({ 
//       error: "Failed to analyze data" 
//     }, { status: 500 });
//   }
// }

// // Try Claude API (Primary - Best Quality)
// async function tryClaude(prompt: string): Promise<string | null> {
//   try {
//     if (!process.env.ANTHROPIC_API_KEY) {
//       console.log("⚠️ ANTHROPIC_API_KEY not configured");
//       return null;
//     }

//     console.log("🟣 Trying CLAUDE...");
    
//     const anthropic = new Anthropic({
//       apiKey: process.env.ANTHROPIC_API_KEY,
//     });

//     // Try multiple Claude models in order of preference
//     // Haiku first since it's confirmed working and fastest
//     const models = [
//       "claude-3-haiku-20240307",     // Haiku model (fastest, most available - confirmed working)
//       "claude-3-5-sonnet-20240620",  // Latest stable 3.5 Sonnet
//       "claude-3-sonnet-20240229",    // Stable 3.0 Sonnet (more widely available)
//       "claude-3-opus-20240229",      // Opus model (if available)
//     ];

//     for (const model of models) {
//       try {
//         console.log(`  → Trying model: ${model}`);
        
//         const message = await anthropic.messages.create({
//           model: model,
//           max_tokens: 1000,
//           temperature: 0.7,
//           messages: [
//             {
//               role: "user",
//               content: `You are a procurement analytics expert. Provide concise, actionable insights.\n\n${prompt}`,
//             },
//           ],
//         });

//         const analysis = message.content[0].type === 'text' ? message.content[0].text : null;
        
//         if (analysis) {
//           console.log(`✅ Claude succeeded with ${model}`);
//           return analysis;
//         }
//       } catch (modelErr: any) {
//         // If model not found, try next one
//         if (modelErr?.error?.type === 'not_found_error') {
//           console.log(`  ⚠️ Model ${model} not available, trying next...`);
//           continue;
//         }
//         // For other errors, log and try next model
//         console.log(`  ⚠️ Model ${model} failed: ${modelErr?.error?.message || modelErr?.message || 'Unknown error'}, trying next...`);
//         continue;
//       }
//     }
    
//     console.log("❌ All Claude models failed");
//     return null;
//   } catch (err: any) {
//     console.error("❌ Claude exception:", err.message || err);
//     return null;
//   }
// }

// // Try Gemini API (Primary - Free & Fast)
// async function tryGemini(prompt: string): Promise<string | null> {
//   try {
//     if (!process.env.GEMINI_API_KEY) {
//       console.log("⚠️ GEMINI_API_KEY not configured");
//       return null;
//     }

//     console.log("🔵 Trying GEMINI...");
    
//     const aiRes = await fetch(
//       `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
//       {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           contents: [{ parts: [{ text: prompt }] }],
//           generationConfig: {
//             maxOutputTokens: 800,
//             temperature: 0.7
//           }
//         }),
//       }
//     );
    
//     if (!aiRes.ok) {
//       const errorData = await aiRes.json().catch(() => ({}));
//       console.error("❌ Gemini error:", aiRes.status, errorData);
//       return null;
//     }
    
//     const aiData = await aiRes.json();
//     const analysis = aiData?.candidates?.[0]?.content?.parts?.[0]?.text;
    
//     if (analysis) {
//       console.log("✅ Gemini succeeded");
//       return analysis;
//     }
    
//     return null;
//   } catch (err) {
//     console.error("❌ Gemini exception:", err);
//     return null;
//   }
// }

// // Try Groq API (Fallback - Fast)
// async function tryGroq(prompt: string): Promise<string | null> {
//   try {
//     if (!process.env.GROQ_API_KEY) {
//       console.log("⚠️ GROQ_API_KEY not configured");
//       return null;
//     }

//     console.log("🟢 Trying GROQ...");
    
//     // Try models in order of preference (higher token limits first)
//     // llama-3.3-70b-versatile has higher TPM limits than llama-3.1-8b-instant
//     const models = [
//       "llama-3.3-70b-versatile", // Higher token limit
//       "mixtral-8x7b-32768", // Also has good token limits
//       "llama-3.1-8b-instant" // Lower token limit, use as last resort
//     ];

//     for (const model of models) {
//       try {
//         console.log(`  → Trying model: ${model}`);
        
//         const aiRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
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
//             max_tokens: 500,
//             temperature: 0.7
//           }),
//         });

//         if (aiRes.ok) {
//           const aiData = await aiRes.json();
//           const analysis = aiData?.choices?.[0]?.message?.content;
          
//           if (analysis) {
//             console.log(`✅ Groq succeeded with ${model}`);
//             return analysis;
//           }
//         }

//         // If rate limited or request too large, try next model
//         if (aiRes.status === 429) {
//           console.log(`  ⚠️ Rate limited, trying next model...`);
//           continue;
//         }

//         // If request too large, try next model with higher limits
//         if (aiRes.status === 400 || aiRes.status === 413) {
//           const errorText = await aiRes.text().catch(() => "");
//           if (errorText.includes("too large") || errorText.includes("TPM") || errorText.includes("tokens per minute")) {
//             console.log(`  ⚠️ Request too large, trying next model with higher limits...`);
//             continue;
//           }
//         }

//         // For other errors, continue to next model
//         console.log(`  ⚠️ Model ${model} failed with status ${aiRes.status}, trying next model...`);
//         continue;
//       } catch (err) {
//         console.error(`  ❌ Error with ${model}:`, err);
//         continue;
//       }
//     }
    
//     console.log("❌ All Groq models failed");
//     return null;
//   } catch (err) {
//     console.error("❌ Groq exception:", err);
//     return null;
//   }
// }




import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const { query } = await request.json();
    
    if (!query || typeof query !== "string") {
      return Response.json({ error: "Invalid query" }, { status: 400 });
    }

    console.log("📥 Received query:", query);

    try {
      // Query database directly with correct filters
      const [approvedPOs, pendingPOs, rejectedPOs] = await Promise.all([
        prisma.approvalPO.findMany({
          orderBy: { approvedAt: "desc" },
          take: 100,
        }),
        prisma.pendingPO.findMany({
          where: { isProcessed: false },  // Only truly pending POs
          orderBy: { fetchedAt: "desc" },
          take: 100,
        }),
        prisma.rejectPO.findMany({
          orderBy: { rejectedAt: "desc" },
          take: 100,
        })
      ]);

      console.log("📊 PO counts:", { 
        pending: pendingPOs.length, 
        approved: approvedPOs.length,
        rejected: rejectedPOs.length
      });

      // Calculate summary
      const summary = {
        totalPendingPOs: pendingPOs.length,
        totalApprovedPOs: approvedPOs.length,
        totalRejectedPOs: rejectedPOs.length,
        totalPendingAmount: pendingPOs.reduce((s, p) => s + (Number(p.totalAmount) ?? 0), 0),
        totalApprovedAmount: approvedPOs.reduce((s, p) => s + (Number(p.totalAmount) ?? 0), 0),
        totalRejectedAmount: rejectedPOs.reduce((s, p) => s + (Number(p.totalAmount) ?? 0), 0),
        uniqueSuppliers: new Set([
          ...pendingPOs.map(p => p.supplier),
          ...approvedPOs.map(p => p.supplier),
          ...rejectedPOs.map(p => p.supplier)
        ]).size,
      };

      console.log("📈 Summary:", summary);

      // Extract essential fields for AI
      const getPendingFields = (po: any) => ({
        supplier: po.supplier,
        item: po.item,
        qty: po.maxQty || po.minQty,
        rate: po.rate,
        totalAmount: po.totalAmount,
        lastApprovedRate: po.lastApprovedRate,
        status: "pending",
        branch: po.branch,
        orderNo: po.orderNo,
      });

      const getApprovedFields = (po: any) => ({
        supplier: po.supplier,
        item: po.item,
        qty: po.maxQty || po.minQty,
        rate: po.rate,
        totalAmount: po.totalAmount,
        lastApprovedRate: po.lastApprovedRate,
        status: "approved",
        branch: po.branch,
        orderNo: po.orderNo,
        approvalNotes: po.approvalNotes,
      });

      const getRejectedFields = (po: any) => ({
        supplier: po.supplier,
        item: po.item,
        qty: po.maxQty || po.minQty,
        rate: po.rate,
        totalAmount: po.totalAmount,
        lastApprovedRate: po.lastApprovedRate,
        status: "rejected",
        branch: po.branch,
        orderNo: po.orderNo,
        rejectReason: po.rejectReason,
      });

      // Limit samples to reduce token usage
      const pendingPOsSample = pendingPOs.slice(0, 10).map(getPendingFields);
      const approvedPOsSample = approvedPOs.slice(0, 10).map(getApprovedFields);
      const rejectedPOsSample = rejectedPOs.slice(0, 10).map(getRejectedFields);

      const prompt = `You are a procurement analyst for a company. Answer the user's question: "${query}"

Summary:
- Pending POs: ${summary.totalPendingPOs} (Total: ৳${summary.totalPendingAmount.toLocaleString()})
- Approved POs: ${summary.totalApprovedPOs} (Total: ৳${summary.totalApprovedAmount.toLocaleString()})
- Rejected POs: ${summary.totalRejectedPOs} (Total: ৳${summary.totalRejectedAmount.toLocaleString()})
- Unique Suppliers: ${summary.uniqueSuppliers}

Pending POs (${pendingPOs.length} total):
${JSON.stringify(pendingPOsSample, null, 2)}

Approved POs (${approvedPOs.length} total):
${JSON.stringify(approvedPOsSample, null, 2)}

Rejected POs (${rejectedPOs.length} total):
${JSON.stringify(rejectedPOsSample, null, 2)}

Please provide a helpful, concise answer based on this data. Use Bengali Taka (৳) for currency.`;

      console.log("🤖 Sending to AI...");

      // Try Groq first (Fast & Reliable)
      let analysis = await tryGroq(prompt);
      
      // If Groq fails, fallback to Gemini
      if (!analysis) {
        console.log("⚠️ Groq failed, trying Gemini fallback...");
        analysis = await tryGemini(prompt);
      }
      
      if (!analysis) {
        return Response.json({ 
          error: "All AI providers are currently unavailable. Please try again later." 
        }, { status: 503 });
      }
      
      return Response.json({ analysis });

    } catch (dbError) {
      console.error("❌ Database error:", dbError);
      return Response.json({ 
        error: "Failed to fetch PO data from database. Please try again." 
      }, { status: 500 });
    }
    
  } catch (err) {
    console.error("❌ AI Analysis Error:", err);
    return Response.json({ 
      error: "Failed to analyze data" 
    }, { status: 500 });
  }
}

// Try Groq API (Primary - Fast)
async function tryGroq(prompt: string): Promise<string | null> {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    
    if (!apiKey) {
      console.log("⚠️ GROQ_API_KEY not configured");
      return null;
    }

    console.log("🟢 Trying GROQ...");
    
    const models = [
      "llama-3.3-70b-versatile",
      "mixtral-8x7b-32768",
      "llama-3.1-8b-instant"
    ];

    for (const model of models) {
      try {
        console.log(`  → Trying model: ${model}`);
        
        const aiRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: model,
            messages: [
              { 
                role: "system", 
                content: "You are a procurement analytics expert. Provide concise, actionable insights. Use Bengali Taka (৳) for currency. Answer in a friendly, professional tone." 
              },
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

        if (aiRes.status === 429) {
          console.log(`  ⚠️ Rate limited, trying next model...`);
          continue;
        }

        if (aiRes.status === 400 || aiRes.status === 413) {
          const errorText = await aiRes.text().catch(() => "");
          if (errorText.includes("too large") || errorText.includes("TPM") || errorText.includes("tokens per minute")) {
            console.log(`  ⚠️ Request too large, trying next model...`);
            continue;
          }
        }

        console.log(`  ⚠️ Model ${model} failed with status ${aiRes.status}`);
        continue;
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

// Try Gemini API (Fallback)
async function tryGemini(prompt: string): Promise<string | null> {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      console.log("⚠️ GEMINI_API_KEY not configured");
      return null;
    }

    console.log("🔵 Trying GEMINI...");
    
    const models = [
      { name: "gemini-2.0-flash", version: "v1beta" },
      { name: "gemini-1.5-flash", version: "v1beta" },
      { name: "gemini-1.5-pro", version: "v1beta" },
    ];

    for (const model of models) {
      try {
        console.log(`  → Trying model: ${model.name} (${model.version})`);
        
        const aiRes = await fetch(
          `https://generativelanguage.googleapis.com/${model.version}/models/${model.name}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ 
                parts: [{ 
                  text: `You are a procurement analytics expert. Provide concise, actionable insights. Use Bengali Taka (৳) for currency.\n\n${prompt}` 
                }] 
              }],
              generationConfig: {
                maxOutputTokens: 800,
                temperature: 0.7
              }
            }),
          }
        );
        
        if (aiRes.ok) {
          const aiData = await aiRes.json();
          const analysis = aiData?.candidates?.[0]?.content?.parts?.[0]?.text;
          
          if (analysis) {
            console.log(`✅ Gemini succeeded with ${model.name}`);
            return analysis;
          }
        } else {
          const errorData = await aiRes.json().catch(() => ({}));
          console.log(`  ⚠️ Model ${model.name} failed:`, aiRes.status, errorData?.error?.message);
          continue;
        }
      } catch (modelErr) {
        console.log(`  ⚠️ Model ${model.name} error:`, modelErr);
        continue;
      }
    }
    
    console.log("❌ All Gemini models failed");
    return null;
  } catch (err) {
    console.error("❌ Gemini exception:", err);
    return null;
  }
}