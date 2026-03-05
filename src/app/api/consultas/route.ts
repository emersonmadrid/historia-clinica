import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const vitalSignsSchema = z.object({
  height: z.number().optional().nullable(),
  weight: z.number().optional().nullable(),
  bmi: z.number().optional().nullable(),
  temperature: z.number().optional().nullable(),
  bloodPressureSys: z.number().int().optional().nullable(),
  bloodPressureDia: z.number().int().optional().nullable(),
  heartRate: z.number().int().optional().nullable(),
  oxygenSat: z.number().optional().nullable(),
  respiratoryRate: z.number().int().optional().nullable(),
  glucoseLevel: z.number().optional().nullable(),
})

const diagnosisSchema = z.object({
  code: z.string().min(1, 'Código requerido'),
  description: z.string().min(1, 'Descripción requerida'),
  type: z.enum(['PRIMARY', 'SECONDARY', 'COMPLICATION']).default('PRIMARY'),
  status: z.enum(['ACTIVE', 'RESOLVED', 'CHRONIC']).default('ACTIVE'),
  notes: z.string().optional().nullable(),
})

const createConsultationSchema = z.object({
  patientId: z.string().min(1, 'Paciente requerido'),
  reason: z.string().min(1, 'Motivo de consulta requerido'),
  subjective: z.string().optional().nullable(),
  objective: z.string().optional().nullable(),
  assessment: z.string().optional().nullable(),
  plan: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  vitalSigns: vitalSignsSchema.optional(),
  diagnoses: z.array(diagnosisSchema).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patientId')

    if (!patientId) {
      return NextResponse.json({ error: 'patientId requerido' }, { status: 400 })
    }

    const records = await prisma.clinicalRecord.findMany({
      where: { patientId },
      orderBy: { date: 'desc' },
      include: {
        doctor: { select: { id: true, name: true, speciality: true } },
        vitalSigns: true,
        diagnoses: true,
      },
    })

    return NextResponse.json(records)
  } catch (error) {
    console.error('GET /api/consultas error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = createConsultationSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.flatten() }, { status: 400 })
    }

    const { vitalSigns, diagnoses, ...consultationData } = parsed.data
    const doctorId = (session.user as any).id

    const record = await prisma.clinicalRecord.create({
      data: {
        ...consultationData,
        doctorId,
        date: new Date(),
        ...(vitalSigns && {
          vitalSigns: {
            create: {
              height: vitalSigns.height ?? null,
              weight: vitalSigns.weight ?? null,
              bmi: vitalSigns.bmi ?? null,
              temperature: vitalSigns.temperature ?? null,
              bloodPressureSys: vitalSigns.bloodPressureSys ?? null,
              bloodPressureDia: vitalSigns.bloodPressureDia ?? null,
              heartRate: vitalSigns.heartRate ?? null,
              oxygenSat: vitalSigns.oxygenSat ?? null,
              respiratoryRate: vitalSigns.respiratoryRate ?? null,
              glucoseLevel: vitalSigns.glucoseLevel ?? null,
            },
          },
        }),
        ...(diagnoses && diagnoses.length > 0 && {
          diagnoses: {
            create: diagnoses.map((d) => ({
              code: d.code,
              description: d.description,
              type: d.type,
              status: d.status,
              notes: d.notes ?? null,
            })),
          },
        }),
      },
      include: {
        doctor: { select: { id: true, name: true, speciality: true } },
        vitalSigns: true,
        diagnoses: true,
      },
    })

    return NextResponse.json(record, { status: 201 })
  } catch (error) {
    console.error('POST /api/consultas error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
