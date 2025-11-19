import { NextResponse } from 'next/server'
import { registerUser, loginUser } from '@/lib/auth-server'
import { cookies } from 'next/headers'
import { SignJWT } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-this-in-production'
)

async function createToken(userId: string) {
  return await new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(JWT_SECRET)
}

// Register
export async function POST(request: Request) {
  try {
    const { action, email, password, name, company } = await request.json()

    if (action === 'register') {
      const result = await registerUser(email, password, name, company)
      
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 })
      }

      return NextResponse.json({ user: result.user })
    }

    if (action === 'login') {
      const result = await loginUser(email, password)
      
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 401 })
      }

      // Create JWT token
      const token = await createToken(result.user!.id)
      
      // Set HTTP-only cookie
      const cookieStore = await cookies()
      cookieStore.set('auth-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7 // 7 days
      })

      return NextResponse.json({ user: result.user })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('[v0] Auth error:', error)
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 })
  }
}

// Logout
export async function DELETE() {
  try {
    const cookieStore = await cookies()
    cookieStore.delete('auth-token')
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] Logout error:', error)
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 })
  }
}