import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { deleteCalendarEvent } from '@/lib/google-calendar'
import { sendAppointmentCancellation, sendAppointmentRsvp } from '@/lib/mailer'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')
  const action = searchParams.get('action') as 'confirm' | 'cancel' | null

  const baseUrl = process.env.NEXTAUTH_URL ?? request.url

  if (!token || !['confirm', 'cancel'].includes(action ?? '')) {
    return NextResponse.redirect(new URL('/citas/respuesta?error=invalid', baseUrl))
  }

  const appointment = await prisma.appointment.findUnique({
    where: { rsvpToken: token },
    include: {
      patient: { select: { firstName: true, lastName: true, email: true } },
      doctor: { select: { id: true, name: true, email: true } },
    },
  })

  if (!appointment) {
    return NextResponse.redirect(new URL('/citas/respuesta?error=notfound', baseUrl))
  }

  // Already resolved
  if (appointment.status === 'CANCELLED' || appointment.status === 'COMPLETED') {
    return NextResponse.redirect(new URL(`/citas/respuesta?status=${appointment.status.toLowerCase()}`, baseUrl))
  }

  const patientName = `${appointment.patient.firstName} ${appointment.patient.lastName}`

  if (action === 'confirm') {
    await prisma.appointment.update({
      where: { id: appointment.id },
      data: { status: 'CONFIRMED' },
    })

    // Notify doctor
    await sendAppointmentRsvp({
      appointmentId: appointment.id,
      patientName,
      patientEmail: appointment.patient.email,
      doctorName: appointment.doctor.name,
      doctorEmail: process.env.MAIL_USER,
      dateTime: appointment.dateTime,
      duration: appointment.duration,
      reason: appointment.reason,
      action: 'confirm',
    })

    return NextResponse.redirect(new URL(`/citas/respuesta?action=confirm&name=${encodeURIComponent(patientName)}`, baseUrl))
  }

  if (action === 'cancel') {
    await prisma.appointment.update({
      where: { id: appointment.id },
      data: { status: 'CANCELLED' },
    })

    // Delete from Google Calendar + notify doctor
    const emailData = {
      appointmentId: appointment.id,
      patientName,
      patientEmail: appointment.patient.email,
      doctorName: appointment.doctor.name,
      doctorEmail: process.env.MAIL_USER,
      dateTime: appointment.dateTime,
      duration: appointment.duration,
      reason: appointment.reason,
    }

    await Promise.allSettled([
      appointment.googleEventId
        ? deleteCalendarEvent(appointment.doctor.id, appointment.googleEventId)
        : Promise.resolve(),
      sendAppointmentCancellation(emailData),
    ])

    return NextResponse.redirect(new URL(`/citas/respuesta?action=cancel&name=${encodeURIComponent(patientName)}`, baseUrl))
  }
}
