import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createCalendarEvent } from '@/lib/google-calendar'
import { sendAppointmentConfirmation } from '@/lib/mailer'
import { z } from 'zod'
import { randomBytes } from 'crypto'

const createAppointmentSchema = z.object({
  patientId: z.string().min(1, 'Paciente requerido'),
  doctorId: z.string().min(1, 'Doctor requerido'),
  dateTime: z.string().min(1, 'Fecha y hora requerida'),
  duration: z.number().int().min(15).max(120).default(30),
  reason: z.string().min(1, 'Motivo requerido'),
  notes: z.string().optional().nullable(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const dateStr = searchParams.get('date')
    const doctorId = searchParams.get('doctorId')

    const where: Record<string, unknown> = {}

    if (dateStr) {
      // Parse as local date to avoid UTC offset shifting (e.g. "2026-03-04" → local midnight)
      const [y, m, d] = dateStr.split('-').map(Number)
      const startOfDay = new Date(y, m - 1, d)
      const endOfDay = new Date(y, m - 1, d + 1)
      where.dateTime = { gte: startOfDay, lt: endOfDay }
    }

    if (doctorId) {
      where.doctorId = doctorId
    }

    const appointments = await prisma.appointment.findMany({
      where,
      orderBy: { dateTime: 'asc' },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true, phone: true } },
        doctor: { select: { id: true, name: true, speciality: true } },
      },
    })

    return NextResponse.json(appointments)
  } catch (error) {
    console.error('GET /api/citas error:', error)
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
    const parsed = createAppointmentSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.flatten() }, { status: 400 })
    }

    const data = parsed.data

    // Check for scheduling conflicts
    const newStart = new Date(data.dateTime)
    const newEnd = new Date(newStart.getTime() + data.duration * 60 * 1000)

    const candidates = await prisma.appointment.findMany({
      where: {
        doctorId: data.doctorId,
        status: { notIn: ['CANCELLED'] },
        dateTime: { lt: newEnd },
      },
      select: { dateTime: true, duration: true },
    })

    const hasConflict = candidates.some(apt => {
      const existingEnd = new Date(apt.dateTime.getTime() + apt.duration * 60 * 1000)
      return existingEnd > newStart
    })

    if (hasConflict) {
      return NextResponse.json(
        { error: 'El doctor ya tiene una cita en ese horario' },
        { status: 409 }
      )
    }

    const rsvpToken = randomBytes(32).toString('hex')

    const appointment = await prisma.appointment.create({
      data: {
        patientId: data.patientId,
        doctorId: data.doctorId,
        dateTime: new Date(data.dateTime),
        duration: data.duration,
        reason: data.reason,
        notes: data.notes ?? null,
        status: 'SCHEDULED',
        rsvpToken,
      },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true, email: true } },
        doctor: { select: { id: true, name: true, email: true } },
      },
    })

    const emailData = {
      appointmentId: appointment.id,
      patientName: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
      patientEmail: appointment.patient.email,
      doctorName: appointment.doctor.name,
      doctorEmail: process.env.MAIL_USER,
      dateTime: appointment.dateTime,
      duration: appointment.duration,
      reason: appointment.reason,
      notes: appointment.notes,
      rsvpToken,
    }

    // Fire-and-forget: Google Calendar sync + confirmation emails
    Promise.all([
      createCalendarEvent(data.doctorId, {
        id: appointment.id,
        dateTime: appointment.dateTime,
        duration: appointment.duration,
        reason: appointment.reason,
        notes: appointment.notes,
        patient: appointment.patient,
        doctorName: appointment.doctor.name,
        doctorEmail: appointment.doctor.email,
      }).then(async (googleEventId) => {
        if (googleEventId) {
          await prisma.appointment.update({
            where: { id: appointment.id },
            data: { googleEventId },
          })
        }
      }),
      sendAppointmentConfirmation(emailData),
    ]).catch(() => {})

    return NextResponse.json(appointment, { status: 201 })
  } catch (error) {
    console.error('POST /api/citas error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
