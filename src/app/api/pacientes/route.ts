import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { assertAuth } from '@/lib/permissions'
import { getActorContext } from '@/lib/authz'
import { getRequestAuditContext, writeAuditLog } from '@/lib/audit'
import { handleApiError } from '@/lib/errors'
import { createPatientSchema } from '@/features/patients/schemas'
import { listPatients } from '@/features/patients/queries'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    assertAuth(session)
    const actor = await getActorContext(session)

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')?.slice(0, 200) || ''
    const page = Math.max(1, parseInt(searchParams.get('page') || '1') || 1)
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20') || 20))
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc'

    const result = await listPatients({ organizationId: actor.organizationId, search, page, limit, sortBy, sortOrder })

    return NextResponse.json(result)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    assertAuth(session)
    const actor = await getActorContext(session)

    const body = await request.json()
    const parsed = createPatientSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.flatten() }, { status: 400 })
    }

    const data = parsed.data

    const existing = await prisma.patient.findUnique({
      where: { documentNumber: data.documentNumber },
    })

    if (existing) {
      return NextResponse.json({ error: 'Ya existe un paciente con ese número de documento' }, { status: 409 })
    }

    const patient = await prisma.patient.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        documentType: data.documentType,
        documentNumber: data.documentNumber,
        birthDate: new Date(data.birthDate),
        gender: data.gender,
        phone: data.phone || null,
        email: data.email || null,
        address: data.address || null,
        city: data.city || null,
        bloodType: data.bloodType || null,
        maritalStatus: data.maritalStatus || null,
        occupation: data.occupation || null,
        insuranceNumber: data.insuranceNumber || null,
        emergencyContactName: data.emergencyContactName || null,
        emergencyContactPhone: data.emergencyContactPhone || null,
        emergencyContactRel: data.emergencyContactRel || null,
        notes: data.notes || null,
        organizationId: actor.organizationId,
      },
    })

    const audit = getRequestAuditContext(request)
    // Fire-and-forget: audit failure should not reject a valid patient creation
    writeAuditLog({
      organizationId: actor.organizationId,
      actorUserId: actor.userId,
      action: 'PATIENT_CREATED',
      entityType: 'patient',
      entityId: patient.id,
      ...audit,
      metadata: {
        documentNumber: patient.documentNumber,
        documentType: patient.documentType,
      },
    }).catch((err: unknown) => console.error('[audit] PATIENT_CREATED failed:', err))

    return NextResponse.json(patient, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
