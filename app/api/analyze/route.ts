import { generateText } from 'ai'
import { getCurrentPOs, getApprovedPOs } from '@/lib/storage'

export async function POST(request: Request) {
  try {
    const { query } = await request.json()

    if (!query || typeof query !== 'string') {
      return Response.json({ error: 'Invalid query' }, { status: 400 })
    }

    const currentPOs = getCurrentPOs()
    const approvedPOs = getApprovedPOs()

    // Prepare context for AI
    const poContext = {
      currentPOs: currentPOs.map(po => ({
        supplier: po.supplier,
        item: po.item,
        qty: po.maxQty,
        rate: po.rate,
        totalAmount: po.totalAmount,
        lastApprovedRate: po.lastApprovedRate,
        status: po.status,
      })),
      approvedPOs: approvedPOs.map(po => ({
        supplier: po.supplier,
        item: po.item,
        rate: po.rate,
        totalAmount: po.totalAmount,
      })),
      summary: {
        totalCurrentPOs: currentPOs.length,
        totalCurrentAmount: currentPOs.reduce((sum, po) => sum + po.totalAmount, 0),
        totalApprovedAmount: approvedPOs.reduce((sum, po) => sum + po.totalAmount, 0),
        uniqueSuppliers: new Set([...currentPOs, ...approvedPOs].map(po => po.supplier)).size,
      }
    }

    const prompt = `You are an expert procurement analyst. Analyze the following purchase order data and answer this question: "${query}"

PO Data Summary:
- Current POs to Approve: ${poContext.summary.totalCurrentPOs}
- Current Total Amount: ₹${poContext.summary.totalCurrentAmount.toLocaleString()}
- Total Approved Amount: ₹${poContext.summary.totalApprovedAmount.toLocaleString()}
- Unique Suppliers: ${poContext.summary.uniqueSuppliers}

Current POs Details:
${JSON.stringify(poContext.currentPOs.slice(0, 20), null, 2)}

Approved POs Historical Data (Sample):
${JSON.stringify(poContext.approvedPOs.slice(0, 10), null, 2)}

Provide a concise, actionable analysis with specific insights and recommendations related to the procurement data.`

    const { text } = await generateText({
      model: 'anthropic/claude-3-5-sonnet-20241022',
      prompt: prompt,
      temperature: 0.7,
      maxTokens: 1000,
    })

    return Response.json({ analysis: text })
  } catch (error) {
    console.error('[v0] AI analysis error:', error)
    return Response.json(
      { error: 'Failed to analyze data' },
      { status: 500 }
    )
  }
}
