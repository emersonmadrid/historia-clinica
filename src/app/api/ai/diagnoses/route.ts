import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { assertAuth } from '@/lib/permissions'
import { handleApiError } from '@/lib/errors'
import { suggestCIE10 } from '@/lib/ai'
import { applyAiRateLimit } from '@/lib/aiRateLimit'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    assertAuth(session)
    const limited = applyAiRateLimit(session!.user.id)
    if (limited) return limited
    const { assessment } = await request.json()
    if (!assessment || assessment.trim().length < 5) {
      return NextResponse.json([])
    }
    const suggestions = await suggestCIE10(assessment)

    // Filtrar códigos Z85.x (antecedentes personales) a menos que el assessment
    // mencione explícitamente un antecedente — el modelo los sugiere por defecto
    const hasExplicitHistory = /antecedente|historia (de|previa)|previo/i.test(assessment)
    const filtered = hasExplicitHistory
      ? suggestions
      : suggestions.filter(s => !s.code.startsWith('Z85'))

    return NextResponse.json(filtered)
  } catch (error) {
    return handleApiError(error)
  }
}
