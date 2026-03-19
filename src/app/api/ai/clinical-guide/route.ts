import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { assertAuth } from '@/lib/permissions'
import { handleApiError } from '@/lib/errors'
import { generateClinicalGuide } from '@/lib/ai'
import { applyAiRateLimit } from '@/lib/aiRateLimit'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    assertAuth(session)
    const limited = applyAiRateLimit(session!.user.id)
    if (limited) return limited

    const body = await request.json().catch(() => ({}))
    const { reason, allergies, activeConditions, currentMedications, specialty } = body
    if (!reason || reason.trim().length < 3) {
      return NextResponse.json({ error: 'Motivo requerido' }, { status: 400 })
    }

    const guide = await generateClinicalGuide({
      reason,
      allergies: allergies ?? [],
      activeConditions: activeConditions ?? [],
      currentMedications: currentMedications ?? [],
      specialty: specialty ?? session!.user.specialty ?? 'GENERAL_MEDICINE',
    })

    return NextResponse.json(guide)
  } catch (error) {
    return handleApiError(error)
  }
}
