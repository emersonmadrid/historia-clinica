import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendAppointmentReminder } from '@/lib/mailer'

export async function GET(request: NextRequest) {
  // Vercel cron sends Authorization header, local cron sends x-cron-secret
  const authHeader = request.headers.get('authorization')
  const cronHeader = request.headers.get('x-cron-secret')
  const vercelValid = authHeader === `Bearer ${process.env.CRON_SECRET}`
  const localValid = cronHeader === process.env.CRON_SECRET

  if (!vercelValid && !localValid) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const now = new Date()
  const in23h = new Date(now.getTime() + 23 * 60 * 60 * 1000)
  const in25h = new Date(now.getTime() + 25 * 60 * 60 * 1000)

  // Find appointments in the 24h window that haven't received a reminder yet
  const appointments = await prisma.appointment.findMany({
    where: {
      dateTime: { gte: in23h, lte: in25h },
      status: { in: ['SCHEDULED', 'CONFIRMED'] },
      reminderSentAt: null,
      patient: { email: { not: null } },
    },
    include: {
      patient: { select: { firstName: true, lastName: true, email: true } },
      doctor: { select: { name: true, email: true } },
    },
  })

  const results = await Promise.allSettled(
    appointments.map(async (apt) => {
      await sendAppointmentReminder({
        appointmentId: apt.id,
        patientName: `${apt.patient.firstName} ${apt.patient.lastName}`,
        patientEmail: apt.patient.email,
        doctorName: apt.doctor.name,
        doctorEmail: apt.doctor.email,
        dateTime: apt.dateTime,
        duration: apt.duration,
        reason: apt.reason,
        notes: apt.notes,
        rsvpToken: apt.rsvpToken,
      })

      await prisma.appointment.update({
        where: { id: apt.id },
        data: { reminderSentAt: new Date() },
      })
    })
  )

  const sent = results.filter(r => r.status === 'fulfilled').length
  const failed = results.filter(r => r.status === 'rejected').length

  return NextResponse.json({ sent, failed, total: appointments.length })
}
