import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { assertAuth } from '@/lib/permissions'
import { handleApiError } from '@/lib/errors'
import { createCalendarEvent } from '@/lib/google-calendar'
import { sendAppointmentConfirmation } from '@/lib/mailer'
import { createAppointmentSchema } from '@/features/appointments/schemas'
import { listAppointments } from '@/features/appointments/queries'
import { randomBytes } from 'crypto'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    assertAuth(session)

    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date') ?? undefined
    const doctorId = searchParams.get('doctorId') ?? undefined

    const appointments = await listAppointments({ date, doctorId })

    return NextResponse.json(appointments)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    assertAuth(session)

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

    const hasConflict = candidates.some((apt) => {
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
    ]).catch((e) => console.error('[post-appointment-side-effects]', e))

    return NextResponse.json(appointment, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
