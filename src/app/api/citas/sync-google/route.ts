import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createCalendarEvent } from '@/lib/google-calendar'

export async function POST() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  // Get all unsynced appointments for doctors that have Google tokens
  const appointments = await prisma.appointment.findMany({
    where: {
      googleEventId: null,
      status: { notIn: ['CANCELLED'] },
      doctor: {
        googleAccessToken: { not: null },
        googleRefreshToken: { not: null },
      },
    },
    include: {
      patient: { select: { firstName: true, lastName: true, email: true } },
      doctor: { select: { name: true, email: true } },
    },
  })

  let synced = 0
  for (const apt of appointments) {
    const googleEventId = await createCalendarEvent(apt.doctorId, {
      id: apt.id,
      dateTime: apt.dateTime,
      duration: apt.duration,
      reason: apt.reason,
      notes: apt.notes,
      patient: apt.patient,
      doctorName: apt.doctor.name,
      doctorEmail: apt.doctor.email,
    })
    if (googleEventId) {
      await prisma.appointment.update({
        where: { id: apt.id },
        data: { googleEventId },
      })
      synced++
    }
  }

  return NextResponse.json({ total: appointments.length, synced })
}
