'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const appointmentSchema = z.object({
  patientId: z.string().min(1, 'Paciente requerido'),
  doctorId: z.string().min(1, 'Doctor requerido'),
  dateTime: z.string().min(1, 'Fecha y hora requerida'),
  duration: z.number().int().min(15).max(120).default(30),
  reason: z.string().min(1, 'Motivo requerido'),
  notes: z.string().optional().nullable(),
})

export type AppointmentFormData = z.infer<typeof appointmentSchema>

export async function createAppointment(data: AppointmentFormData) {
  const session = await auth()
  if (!session?.user) {
    return { error: 'No autorizado' }
  }

  const parsed = appointmentSchema.safeParse(data)
  if (!parsed.success) {
    return { error: 'Datos inválidos', details: parsed.error.flatten() }
  }

  try {
    const appointment = await prisma.appointment.create({
      data: {
        patientId: parsed.data.patientId,
        doctorId: parsed.data.doctorId,
        dateTime: new Date(parsed.data.dateTime),
        duration: parsed.data.duration,
        reason: parsed.data.reason,
        notes: parsed.data.notes ?? null,
        status: 'SCHEDULED',
      },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
        doctor: { select: { id: true, name: true } },
      },
    })

    revalidatePath('/citas')
    return { success: true, appointment }
  } catch (error) {
    console.error('createAppointment error:', error)
    return { error: 'Error al crear la cita' }
  }
}

export async function updateAppointmentStatus(
  id: string,
  status: 'SCHEDULED' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW'
) {
  const session = await auth()
  if (!session?.user) {
    return { error: 'No autorizado' }
  }

  try {
    const appointment = await prisma.appointment.update({
      where: { id },
      data: { status },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
        doctor: { select: { id: true, name: true } },
      },
    })

    revalidatePath('/citas')
    return { success: true, appointment }
  } catch (error) {
    console.error('updateAppointmentStatus error:', error)
    return { error: 'Error al actualizar la cita' }
  }
}

export async function getAppointments(filters?: {
  date?: string
  doctorId?: string
}) {
  const session = await auth()
  if (!session?.user) {
    return { error: 'No autorizado' }
  }

  try {
    const where: Record<string, unknown> = {}

    if (filters?.date) {
      const date = new Date(filters.date)
      const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate())
      const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
      where.dateTime = { gte: startOfDay, lt: endOfDay }
    }

    if (filters?.doctorId) {
      where.doctorId = filters.doctorId
    }

    const appointments = await prisma.appointment.findMany({
      where,
      orderBy: { dateTime: 'asc' },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true, phone: true } },
        doctor: { select: { id: true, name: true, speciality: true } },
      },
    })

    return { appointments }
  } catch (error) {
    console.error('getAppointments error:', error)
    return { error: 'Error al obtener las citas' }
  }
}
