import { google } from 'googleapis'
import { prisma } from '@/lib/prisma'

export function getOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXTAUTH_URL}/api/auth/google/callback`
  )
}

export function getAuthUrl() {
  const oauth2Client = getOAuthClient()
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/calendar.events'],
    prompt: 'consent',
  })
}

export async function exchangeCode(code: string) {
  const oauth2Client = getOAuthClient()
  const { tokens } = await oauth2Client.getToken(code)
  return tokens
}

async function getAuthenticatedClient(doctorId: string) {
  const user = await prisma.user.findUnique({
    where: { id: doctorId },
    select: { googleAccessToken: true, googleRefreshToken: true, googleTokenExpiry: true },
  })

  if (!user?.googleAccessToken || !user?.googleRefreshToken) return null

  const oauth2Client = getOAuthClient()
  oauth2Client.setCredentials({
    access_token: user.googleAccessToken,
    refresh_token: user.googleRefreshToken,
    expiry_date: user.googleTokenExpiry?.getTime(),
  })

  // Auto-refresh if expired
  oauth2Client.on('tokens', async (tokens) => {
    await prisma.user.update({
      where: { id: doctorId },
      data: {
        googleAccessToken: tokens.access_token ?? undefined,
        googleTokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
      },
    })
  })

  return oauth2Client
}

export interface AppointmentData {
  id: string
  dateTime: Date
  duration: number
  reason: string
  notes?: string | null
  patient: { firstName: string; lastName: string; email?: string | null }
  doctorName?: string
  doctorEmail?: string | null
}

export async function createCalendarEvent(
  doctorId: string,
  appointment: AppointmentData
): Promise<string | null> {
  const auth = await getAuthenticatedClient(doctorId)
  if (!auth) return null

  const calendar = google.calendar({ version: 'v3', auth })
  const endTime = new Date(appointment.dateTime.getTime() + appointment.duration * 60 * 1000)

  // No attendees — patient is NOT added to the GCal event.
  // Calendly's approach: doctor's calendar is for the doctor only.
  // Patient gets our Zoho email with Add-to-Calendar links and RSVP buttons.
  const event = await calendar.events.insert({
    calendarId: 'primary',
    sendUpdates: 'none',
    requestBody: {
      summary: `Cita médica: ${appointment.patient.firstName} ${appointment.patient.lastName}`,
      description: [
        `Paciente: ${appointment.patient.firstName} ${appointment.patient.lastName}`,
        `Motivo: ${appointment.reason}`,
        appointment.notes ? `Notas: ${appointment.notes}` : '',
        `Duración: ${appointment.duration} minutos`,
        ``,
        `🔗 Gestionar cita: ${process.env.NEXTAUTH_URL}/citas`,
      ].filter(s => s !== undefined).join('\n'),
      start: { dateTime: appointment.dateTime.toISOString(), timeZone: 'America/Lima' },
      end: { dateTime: endTime.toISOString(), timeZone: 'America/Lima' },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 },
          { method: 'popup', minutes: 30 },
        ],
      },
    },
  })

  return event.data.id ?? null
}

export async function updateCalendarEvent(
  doctorId: string,
  googleEventId: string,
  data: { summary?: string; description?: string; start?: Date; end?: Date }
): Promise<void> {
  const auth = await getAuthenticatedClient(doctorId)
  if (!auth) return

  const calendar = google.calendar({ version: 'v3', auth })
  await calendar.events.patch({
    calendarId: 'primary',
    eventId: googleEventId,
    sendUpdates: 'none',
    requestBody: {
      summary: data.summary,
      description: data.description,
      start: data.start ? { dateTime: data.start.toISOString(), timeZone: 'America/Lima' } : undefined,
      end: data.end ? { dateTime: data.end.toISOString(), timeZone: 'America/Lima' } : undefined,
    },
  })
}

export async function deleteCalendarEvent(
  doctorId: string,
  googleEventId: string
): Promise<void> {
  const auth = await getAuthenticatedClient(doctorId)
  if (!auth) return

  const calendar = google.calendar({ version: 'v3', auth })
  await calendar.events.delete({
    calendarId: 'primary',
    eventId: googleEventId,
    sendUpdates: 'none',
  })
}
