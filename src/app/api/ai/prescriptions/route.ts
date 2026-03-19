import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { assertAuth } from '@/lib/permissions'
import { handleApiError } from '@/lib/errors'
import { suggestPrescriptions } from '@/lib/ai'
import { applyAiRateLimit } from '@/lib/aiRateLimit'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    assertAuth(session)
    const limited = applyAiRateLimit(session!.user.id)
    if (limited) return limited
    const body = await request.json()
    const { diagnoses, allergies, currentMedications, age } = body
    if (!diagnoses || diagnoses.length === 0) {
      return NextResponse.json([])
    }
    const suggestions = await suggestPrescriptions({ diagnoses, allergies: allergies ?? [], currentMedications: currentMedications ?? [], age })
    return NextResponse.json(suggestions)
  } catch (error) {
    return handleApiError(error)
  }
}
