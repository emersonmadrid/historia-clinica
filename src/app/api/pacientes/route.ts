import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { assertAuth } from '@/lib/permissions'
import { handleApiError } from '@/lib/errors'
import { createPatientSchema } from '@/features/patients/schemas'
import { listPatients } from '@/features/patients/queries'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    assertAuth(session)

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc'

    const result = await listPatients({ search, page, limit, sortBy, sortOrder })

    return NextResponse.json(result)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    assertAuth(session)

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
      },
    })

    return NextResponse.json(patient, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
