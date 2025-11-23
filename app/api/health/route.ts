import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    // Try to connect to database
    if (prisma) {
      await prisma.$queryRaw`SELECT 1`
      return NextResponse.json({ 
        status: "healthy", 
        database: "connected",
        timestamp: new Date().toISOString()
      })
    }
    
    return NextResponse.json({ 
      status: "degraded", 
      database: "not initialized",
      timestamp: new Date().toISOString()
    }, { status: 503 })
  } catch (error) {
    return NextResponse.json({ 
      status: "unhealthy", 
      database: "connection failed",
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    }, { status: 503 })
  }
}

