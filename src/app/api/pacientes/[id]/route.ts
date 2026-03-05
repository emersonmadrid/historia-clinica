import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updatePatientSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  documentType: z.enum(['DNI', 'CE', 'PASSPORT', 'RUC']).optional(),
  documentNumber: z.string().min(1).optional(),
  birthDate: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal('')),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  bloodType: z.enum(['A_POS', 'A_NEG', 'B_POS', 'B_NEG', 'AB_POS', 'AB_NEG', 'O_POS', 'O_NEG']).optional().nullable(),
  maritalStatus: z.enum(['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED', 'COHABITANT']).optional().nullable(),
  occupation: z.string().optional().nullable(),
  insuranceNumber: z.string().optional().nullable(),
  emergencyContactName: z.string().optional().nullable(),
  emergencyContactPhone: z.string().optional().nullable(),
  emergencyContactRel: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params

    const patient = await prisma.patient.findUnique({
      where: { id },
      include: {
        allergies: { orderBy: { createdAt: 'desc' } },
        medicalBackgrounds: { orderBy: { createdAt: 'desc' } },
        clinicalRecords: {
          orderBy: { date: 'desc' },
          include: {
            doctor: { select: { id: true, name: true, speciality: true } },
            vitalSigns: true,
            diagnoses: true,
          },
        },
        appointments: {
          orderBy: { dateTime: 'desc' },
          take: 5,
          include: {
            doctor: { select: { id: true, name: true } },
          },
        },
      },
    })

    if (!patient) {
      return NextResponse.json({ error: 'Paciente no encontrado' }, { status: 404 })
    }

    return NextResponse.json(patient)
  } catch (error) {
    console.error('GET /api/pacientes/[id] error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const parsed = updatePatientSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.flatten() }, { status: 400 })
    }

    const data = parsed.data
    const updateData: Record<string, unknown> = { ...data }

    if (data.birthDate) {
      updateData.birthDate = new Date(data.birthDate)
    }
    if (data.email === '') {
      updateData.email = null
    }

    const patient = await prisma.patient.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(patient)
  } catch (error) {
    console.error('PUT /api/pacientes/[id] error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params

    await prisma.patient.update({
      where: { id },
      data: { active: false },
    })

    return NextResponse.json({ message: 'Paciente eliminado correctamente' })
  } catch (error) {
    console.error('DELETE /api/pacientes/[id] error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
