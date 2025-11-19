import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
})

export async function POST(request: Request) {
  try {
    const { query, stream = false, currentPOs = [], approvedPOs = [] } = await request.json()

    if (!query || typeof query !== 'string') {
      return Response.json({ error: 'Invalid query' }, { status: 400 })
    }

    // Prepare context for AI
    const poContext = {
      currentPOs: currentPOs.map((po: { supplier: any; item: any; maxQty: any; rate: any; totalAmount: any; lastApprovedRate: any; status: any; branch: any; itemLedgerGroup: any }) => ({
        supplier: po.supplier,
        item: po.item,
        qty: po.maxQty,
        rate: po.rate,
        totalAmount: po.totalAmount,
        lastApprovedRate: po.lastApprovedRate,
        status: po.status,
        branch: po.branch,
        category: po.itemLedgerGroup,
      })),
      approvedPOs: approvedPOs.map((po: { supplier: any; item: any; rate: any; totalAmount: any; branch: any; itemLedgerGroup: any }) => ({
        supplier: po.supplier,
        item: po.item,
        rate: po.rate,
        totalAmount: po.totalAmount,
        branch: po.branch,
        category: po.itemLedgerGroup,
      })),
      summary: {
        totalCurrentPOs: currentPOs.length,
        totalCurrentAmount: currentPOs.reduce((sum: any, po: { totalAmount: any }) => sum + po.totalAmount, 0),
        totalApprovedAmount: approvedPOs.reduce((sum: any, po: { totalAmount: any }) => sum + po.totalAmount, 0),
        uniqueSuppliers: new Set([...currentPOs, ...approvedPOs].map(po => po.supplier)).size,
      }
    }

    const prompt = `You are an expert procurement analyst for a footwear manufacturing company in Bangladesh. Analyze the following purchase order data and answer this question: "${query}"

PO Data Summary:
- Current POs to Approve: ${poContext.summary.totalCurrentPOs}
- Current Total Amount: ৳${poContext.summary.totalCurrentAmount.toLocaleString()}
- Total Approved Amount: ৳${poContext.summary.totalApprovedAmount.toLocaleString()}
- Unique Suppliers: ${poContext.summary.uniqueSuppliers}

Current POs Details (Sample):
${JSON.stringify(poContext.currentPOs.slice(0, 20), null, 2)}

Approved POs Historical Data (Sample):
${JSON.stringify(poContext.approvedPOs.slice(0, 10), null, 2)}

Provide a concise, actionable analysis with specific insights and recommendations related to the procurement data. Focus on:
1. Direct answers to the user's question
2. Relevant patterns or anomalies in the data
3. Cost-saving opportunities
4. Supplier performance insights
5. Actionable recommendations

Keep your response clear, structured, and under 500 words.`

    // Streaming response
    if (stream) {
      const encoder = new TextEncoder()
      const readable = new ReadableStream({
        async start(controller) {
          try {
            const stream = await anthropic.messages.stream({
              model: 'claude-sonnet-4-20250514',
              max_tokens: 1500,
              temperature: 0.7,
              messages: [
                {
                  role: 'user',
                  content: prompt
                }
              ]
            })

            for await (const chunk of stream) {
              if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
                const data = encoder.encode(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`)
                controller.enqueue(data)
              }
            }

            controller.close()
          } catch (error) {
            console.error('[v0] Streaming error:', error)
            controller.error(error)
          }
        }
      })

      return new Response(readable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      })
    }

    // Non-streaming response
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''

    return Response.json({ analysis: text })
  } catch (error) {
    console.error('[v0] AI analysis error:', error)
    return Response.json(
      { error: 'Failed to analyze data. Please check your API key configuration.' },
      { status: 500 }
    )
  }
}