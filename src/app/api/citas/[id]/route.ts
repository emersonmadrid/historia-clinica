import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { updateCalendarEvent, deleteCalendarEvent } from '@/lib/google-calendar'
import { sendAppointmentCancellation } from '@/lib/mailer'
import { z } from 'zod'

const updateAppointmentSchema = z.object({
  status: z.enum(['SCHEDULED', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW']).optional(),
  dateTime: z.string().optional(),
  duration: z.number().int().optional(),
  reason: z.string().optional(),
  notes: z.string().optional().nullable(),
})

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { id } = await params
  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: {
      patient: { select: { id: true, firstName: true, lastName: true } },
      doctor: { select: { id: true, name: true } },
    },
  })
  if (!appointment) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
  return NextResponse.json(appointment)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const { id } = await params
    const { action } = await request.json()

    if (action === 'arrive') {
      const appointment = await prisma.appointment.update({
        where: { id },
        data: { arrivedAt: new Date() },
      })
      return NextResponse.json(appointment)
    }

    if (action === 'complete') {
      const appointment = await prisma.appointment.update({
        where: { id },
        data: { status: 'COMPLETED' },
      })
      return NextResponse.json(appointment)
    }

    return NextResponse.json({ error: 'Acción inválida' }, { status: 400 })
  } catch (error) {
    console.error('PATCH /api/citas/[id] error:', error)
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
    const parsed = updateAppointmentSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.flatten() }, { status: 400 })
    }

    const data = parsed.data
    const updateData: Record<string, unknown> = { ...data }

    if (data.dateTime) {
      updateData.dateTime = new Date(data.dateTime)
    }

    // Fetch current appointment to get googleEventId and doctorId
    const existing = await prisma.appointment.findUnique({
      where: { id },
      select: { googleEventId: true, doctorId: true, reason: true, dateTime: true, duration: true },
    })

    const appointment = await prisma.appointment.update({
      where: { id },
      data: updateData,
      include: {
        patient: { select: { id: true, firstName: true, lastName: true, email: true } },
        doctor: { select: { id: true, name: true, email: true } },
      },
    })

    // Sync to Google Calendar + send cancellation email (fire-and-forget)
    if (data.status === 'CANCELLED') {
      const emailData = {
        appointmentId: id,
        patientName: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
        patientEmail: appointment.patient.email,
        doctorName: appointment.doctor.name,
        doctorEmail: process.env.MAIL_USER,
        dateTime: existing?.dateTime ?? appointment.dateTime,
        duration: existing?.duration ?? appointment.duration,
        reason: existing?.reason ?? appointment.reason,
      }
      Promise.all([
        existing?.googleEventId
          ? deleteCalendarEvent(existing.doctorId, existing.googleEventId)
          : Promise.resolve(),
        sendAppointmentCancellation(emailData),
      ]).catch(() => {})
    } else if (existing?.googleEventId) {
      updateCalendarEvent(existing.doctorId, existing.googleEventId, {
        summary: data.reason ? `Cita: ${appointment.patient.firstName} ${appointment.patient.lastName}` : undefined,
        start: data.dateTime ? new Date(data.dateTime) : undefined,
        end: data.dateTime
          ? new Date(new Date(data.dateTime).getTime() + appointment.duration * 60 * 1000)
          : undefined,
      }).catch(() => {})
    }

    return NextResponse.json(appointment)
  } catch (error) {
    console.error('PUT /api/citas/[id] error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
