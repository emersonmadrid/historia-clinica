'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const patientSchema = z.object({
  firstName: z.string().min(1, 'Nombre requerido'),
  lastName: z.string().min(1, 'Apellido requerido'),
  documentType: z.enum(['DNI', 'CE', 'PASSPORT', 'RUC']),
  documentNumber: z.string().min(1, 'Número de documento requerido'),
  birthDate: z.string().min(1, 'Fecha de nacimiento requerida'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  city: z.string().optional(),
  bloodType: z.enum(['A_POS', 'A_NEG', 'B_POS', 'B_NEG', 'AB_POS', 'AB_NEG', 'O_POS', 'O_NEG']).optional(),
  maritalStatus: z.enum(['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED', 'COHABITANT']).optional(),
  occupation: z.string().optional(),
  insuranceNumber: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  emergencyContactRel: z.string().optional(),
  notes: z.string().optional(),
})

export type PatientFormData = z.infer<typeof patientSchema>

export async function createPatient(data: PatientFormData) {
  const session = await auth()
  if (!session?.user) {
    return { error: 'No autorizado' }
  }

  const parsed = patientSchema.safeParse(data)
  if (!parsed.success) {
    return { error: 'Datos inválidos', details: parsed.error.flatten() }
  }

  const existing = await prisma.patient.findUnique({
    where: { documentNumber: parsed.data.documentNumber },
  })

  if (existing) {
    return { error: 'Ya existe un paciente con ese número de documento' }
  }

  try {
    const patient = await prisma.patient.create({
      data: {
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
        documentType: parsed.data.documentType,
        documentNumber: parsed.data.documentNumber,
        birthDate: new Date(parsed.data.birthDate),
        gender: parsed.data.gender,
        phone: parsed.data.phone || null,
        email: parsed.data.email || null,
        address: parsed.data.address || null,
        city: parsed.data.city || null,
        bloodType: parsed.data.bloodType || null,
        maritalStatus: parsed.data.maritalStatus || null,
        occupation: parsed.data.occupation || null,
        insuranceNumber: parsed.data.insuranceNumber || null,
        emergencyContactName: parsed.data.emergencyContactName || null,
        emergencyContactPhone: parsed.data.emergencyContactPhone || null,
        emergencyContactRel: parsed.data.emergencyContactRel || null,
        notes: parsed.data.notes || null,
      },
    })

    revalidatePath('/pacientes')
    return { success: true, patient }
  } catch (error) {
    console.error('createPatient error:', error)
    return { error: 'Error al crear el paciente' }
  }
}

export async function updatePatient(id: string, data: Partial<PatientFormData>) {
  const session = await auth()
  if (!session?.user) {
    return { error: 'No autorizado' }
  }

  try {
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

    revalidatePath(`/pacientes/${id}`)
    revalidatePath('/pacientes')
    return { success: true, patient }
  } catch (error) {
    console.error('updatePatient error:', error)
    return { error: 'Error al actualizar el paciente' }
  }
}

export async function deletePatient(id: string) {
  const session = await auth()
  if (!session?.user) {
    return { error: 'No autorizado' }
  }

  try {
    await prisma.patient.update({
      where: { id },
      data: { active: false },
    })

    revalidatePath('/pacientes')
    return { success: true }
  } catch (error) {
    console.error('deletePatient error:', error)
    return { error: 'Error al eliminar el paciente' }
  }
}

export async function getPatient(id: string) {
  const session = await auth()
  if (!session?.user) {
    return { error: 'No autorizado' }
  }

  try {
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
          include: { doctor: { select: { id: true, name: true } } },
        },
      },
    })

    if (!patient) {
      return { error: 'Paciente no encontrado' }
    }

    return { patient }
  } catch (error) {
    console.error('getPatient error:', error)
    return { error: 'Error al obtener el paciente' }
  }
}
