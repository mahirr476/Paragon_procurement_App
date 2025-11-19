import { NextResponse } from 'next/server'
import { getCurrentPOs, saveCurrentPOs, addToApprovedPOs, clearCurrentPOs, removeCurrentPOs, getApprovedPOs } from '@/lib/storage-server'
import { PurchaseOrder } from '@/lib/types'

// GET - Get current or approved POs
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'current' or 'approved'

    if (type === 'current') {
      const pos = await getCurrentPOs()
      return NextResponse.json({ pos })
    } else if (type === 'approved') {
      const pos = await getApprovedPOs()
      return NextResponse.json({ pos })
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch (error) {
    console.error('[v0] GET PO error:', error)
    return NextResponse.json({ error: 'Failed to fetch POs' }, { status: 500 })
  }
}

// POST - Save current POs
export async function POST(request: Request) {
  try {
    const { pos }: { pos: PurchaseOrder[] } = await request.json()
    await saveCurrentPOs(pos)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] POST PO error:', error)
    return NextResponse.json({ error: 'Failed to save POs' }, { status: 500 })
  }
}

// PUT - Approve POs
export async function PUT(request: Request) {
  try {
    const { pos }: { pos: PurchaseOrder[] } = await request.json()
    await addToApprovedPOs(pos)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] PUT PO error:', error)
    return NextResponse.json({ error: 'Failed to approve POs' }, { status: 500 })
  }
}

// DELETE - Remove POs
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const ids = searchParams.get('ids')

    if (action === 'clear') {
      await clearCurrentPOs()
    } else if (action === 'remove' && ids) {
      await removeCurrentPOs(ids.split(','))
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] DELETE PO error:', error)
    return NextResponse.json({ error: 'Failed to delete POs' }, { status: 500 })
  }
}