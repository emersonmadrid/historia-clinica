import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { assertAuth } from '@/lib/permissions'
import { handleApiError } from '@/lib/errors'
import { suggestCIE10 } from '@/lib/ai'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    assertAuth(session)

    const { text } = await request.json()
    if (!text || text.trim().length < 3) return NextResponse.json([])

    const suggestions = await suggestCIE10(text)
    return NextResponse.json(suggestions)
  } catch (error) {
    return handleApiError(error)
  }
}
