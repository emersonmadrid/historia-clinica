import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { assertAuth } from '@/lib/permissions'
import { handleApiError } from '@/lib/errors'
import { generateAssessmentPlan } from '@/lib/ai'
import { applyAiRateLimit } from '@/lib/aiRateLimit'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    assertAuth(session)
    const limited = applyAiRateLimit(session!.user.id)
    if (limited) return limited

    const { reason, diagnoses, vitalSigns, allergies, activeConditions, currentMedications } = await request.json()

    // Debe haber al menos diagnósticos o signos vitales para generar A+P
    const hasDiagnoses = Array.isArray(diagnoses) && diagnoses.length > 0
    const hasVitals = vitalSigns && Object.values(vitalSigns).some(v => v !== null && v !== undefined && v !== '')

    if (!hasDiagnoses && !hasVitals) {
      return NextResponse.json(
        { assessment: '', plan: '', error: 'Registra al menos un diagnóstico o signos vitales para sugerir evaluación y plan.' },
        { status: 400 }
      )
    }

    const result = await generateAssessmentPlan({
      reason: reason ?? '',
      diagnoses: diagnoses ?? [],
      vitalSigns: vitalSigns ?? {},
      allergies: allergies ?? [],
      activeConditions: activeConditions ?? [],
      currentMedications: currentMedications ?? [],
    })

    return NextResponse.json(result)
  } catch (error) {
    return handleApiError(error)
  }
}
