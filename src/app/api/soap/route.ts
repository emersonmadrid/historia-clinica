import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { assertAuth } from '@/lib/permissions'
import { handleApiError } from '@/lib/errors'
import { generateSOAP } from '@/lib/ai'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    assertAuth(session)

    const body = await request.json()
    const { reason, allergies, activeConditions, currentMedications, vitalSigns } = body

    if (!reason || reason.trim().length < 3) {
      return NextResponse.json({ error: 'Motivo requerido' }, { status: 400 })
    }

    const soap = await generateSOAP({
      reason,
      allergies: allergies ?? [],
      activeConditions: activeConditions ?? [],
      currentMedications: currentMedications ?? [],
      vitalSigns,
    })

    return NextResponse.json(soap)
  } catch (error) {
    return handleApiError(error)
  }
}
