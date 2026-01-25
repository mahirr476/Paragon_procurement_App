/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { POST } from '@/app/api/pos/route'

describe('API Invalid Input Edge Cases', () => {
  test('rejects requests with invalid JSON body', async () => {
    const request = new NextRequest('http://localhost/api/pos', {
      method: 'POST',
      body: '{invalid}',
      headers: {
        'Content-Type': 'application/json',
      },
    } as any)

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toContain('Invalid JSON')
  })
})


