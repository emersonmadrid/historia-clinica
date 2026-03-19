import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { assertAuth } from '@/lib/permissions'
import { getActorContext } from '@/lib/authz'
import { handleApiError, NotFoundError } from '@/lib/errors'
import { generateBriefing } from '@/lib/ai'
import { getPatientForBriefing, extractAllMedications } from '@/lib/data/patients'
import { calculateAge, genderLabel } from '@/lib/utils'
import type { PatientBriefing } from '@/types/ai'

// Simple in-memory cache — avoids redundant AI calls within a 5-minute window
const cache = new Map<string, { data: PatientBriefing; expiresAt: number }>()
const CACHE_TTL_MS = 5 * 60 * 1000

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    assertAuth(session)
    const actor = await getActorContext(session)

    const { id } = await params

    const hit = cache.get(id)
    if (hit && hit.expiresAt > Date.now()) {
      return NextResponse.json(hit.data)
    }

    const patient = await getPatientForBriefing(id, actor.organizationId)
    if (!patient) throw new NotFoundError('Paciente no encontrado')

    const activeConditions = patient.clinicalRecords
      .flatMap(r => r.diagnoses)
      .filter(d => d.status === 'ACTIVE' || d.status === 'CHRONIC')
      .reduce<string[]>((acc, d) => {
        if (!acc.includes(d.description)) acc.push(d.description)
        return acc
      }, [])

    const currentMedications = extractAllMedications(patient.clinicalRecords)

    const briefing = await generateBriefing({
      patientName: `${patient.firstName} ${patient.lastName}`,
      age: calculateAge(patient.birthDate),
      gender: genderLabel(patient.gender),
      allergies: patient.allergies.map(a => a.allergen),
      activeConditions,
      currentMedications,
      consultations: patient.clinicalRecords.map(r => ({
        date: r.date.toLocaleDateString('es-PE'),
        reason: r.reason,
        assessment: r.assessment,
        plan: r.plan,
        diagnoses: r.diagnoses.map(d => d.description),
      })),
    })

    cache.set(id, { data: briefing, expiresAt: Date.now() + CACHE_TTL_MS })

    return NextResponse.json(briefing)
  } catch (error) {
    console.error('[briefing]', error)
    return handleApiError(error)
  }
}
