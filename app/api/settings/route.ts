// API Route for Settings Operations
import { NextRequest, NextResponse } from 'next/server'
import { dataService } from '@/lib/data/file-storage'

export async function GET() {
  try {
    const tutorialsCompleted = await dataService.settings.getTutorialsCompleted()
    return NextResponse.json({ 
      success: true, 
      data: { tutorialsCompleted: Array.from(tutorialsCompleted) }
    })
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, data } = body

    switch (action) {
      case 'markTutorialComplete':
        await dataService.settings.markTutorialComplete(data.tutorialId)
        return NextResponse.json({ success: true })

      case 'skipAllTutorials':
        await dataService.settings.skipAllTutorials()
        return NextResponse.json({ success: true })

      case 'resetTutorials':
        await dataService.settings.resetTutorials()
        return NextResponse.json({ success: true })

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error processing settings operation:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process operation' },
      { status: 500 }
    )
  }
}