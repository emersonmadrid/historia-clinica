import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function toICSDate(date: Date) {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: {
      doctor: { select: { name: true } },
      patient: { select: { firstName: true, lastName: true } },
    },
  })

  if (!appointment) {
    return new NextResponse('Not found', { status: 404 })
  }

  const end = new Date(appointment.dateTime.getTime() + appointment.duration * 60 * 1000)

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Feliz Horizonte//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${appointment.id}@felizhorizonte.pe`,
    `DTSTAMP:${toICSDate(new Date())}`,
    `DTSTART:${toICSDate(appointment.dateTime)}`,
    `DTEND:${toICSDate(end)}`,
    `SUMMARY:Cita médica — ${appointment.doctor.name}`,
    `DESCRIPTION:Motivo: ${appointment.reason}\\nDuración: ${appointment.duration} minutos\\nDoctor: ${appointment.doctor.name}`,
    `ORGANIZER;CN=Feliz Horizonte:MAILTO:info@felizhorizonte.pe`,
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'BEGIN:VALARM',
    'TRIGGER:-PT24H',
    'ACTION:DISPLAY',
    'DESCRIPTION:Recordatorio: Cita médica mañana',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')

  return new NextResponse(ics, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="cita-medica.ics"`,
    },
  })
}
