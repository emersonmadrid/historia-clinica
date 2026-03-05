'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
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

const consultationSchema = z.object({
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

export type ConsultationFormData = z.infer<typeof consultationSchema>

export async function createConsultation(data: ConsultationFormData) {
  const session = await auth()
  if (!session?.user) {
    return { error: 'No autorizado' }
  }

  const parsed = consultationSchema.safeParse(data)
  if (!parsed.success) {
    return { error: 'Datos inválidos', details: parsed.error.flatten() }
  }

  const { vitalSigns, diagnoses, ...consultationData } = parsed.data
  const doctorId = (session.user as any).id

  try {
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

    revalidatePath(`/pacientes/${consultationData.patientId}/historia`)
    revalidatePath(`/pacientes/${consultationData.patientId}`)
    return { success: true, record }
  } catch (error) {
    console.error('createConsultation error:', error)
    return { error: 'Error al crear la consulta' }
  }
}

export async function getConsultations(patientId: string) {
  const session = await auth()
  if (!session?.user) {
    return { error: 'No autorizado' }
  }

  try {
    const records = await prisma.clinicalRecord.findMany({
      where: { patientId },
      orderBy: { date: 'desc' },
      include: {
        doctor: { select: { id: true, name: true, speciality: true } },
        vitalSigns: true,
        diagnoses: true,
      },
    })

    return { records }
  } catch (error) {
    console.error('getConsultations error:', error)
    return { error: 'Error al obtener las consultas' }
  }
}
