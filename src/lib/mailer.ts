import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: 'smtp.zoho.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
})

export interface AppointmentEmailData {
  appointmentId: string
  patientName: string
  patientEmail?: string | null
  doctorName: string
  doctorEmail?: string | null
  dateTime: Date
  duration: number
  reason: string
  notes?: string | null
  rsvpToken?: string | null
}

function formatDateTime(date: Date) {
  return date.toLocaleString('es-PE', {
    timeZone: 'America/Lima',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function toICSDate(date: Date) {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
}

// Google Calendar link — build manually to avoid encoding the "/" in dates
function googleCalendarUrl(data: AppointmentEmailData): string {
  const end = new Date(data.dateTime.getTime() + data.duration * 60 * 1000)
  const dates = `${toICSDate(data.dateTime)}/${toICSDate(end)}`
  const text = encodeURIComponent(`Cita médica — ${data.doctorName}`)
  const details = encodeURIComponent(
    `Motivo: ${data.reason}\nDuración: ${data.duration} minutos\nDoctor: ${data.doctorName}${data.notes ? '\nNotas: ' + data.notes : ''}`
  )
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${dates}&details=${details}`
}

// .ics content for Apple Calendar / Outlook (downloaded via link)
function generateICS(data: AppointmentEmailData): string {
  const end = new Date(data.dateTime.getTime() + data.duration * 60 * 1000)
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Feliz Horizonte//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${data.appointmentId}@felizhorizonte.pe`,
    `DTSTAMP:${toICSDate(new Date())}`,
    `DTSTART:${toICSDate(data.dateTime)}`,
    `DTEND:${toICSDate(end)}`,
    `SUMMARY:Cita médica — ${data.doctorName}`,
    `DESCRIPTION:Motivo: ${data.reason}\\nDuración: ${data.duration} minutos\\nDoctor: ${data.doctorName}${data.notes ? '\\nNotas: ' + data.notes : ''}`,
    `ORGANIZER;CN=Feliz Horizonte:MAILTO:${process.env.MAIL_USER}`,
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
}

function calendarButtons(data: AppointmentEmailData): string {
  const googleUrl = googleCalendarUrl(data)
  const icsUrl = `${process.env.NEXTAUTH_URL}/api/citas/${data.appointmentId}/ics`
  const base = `${process.env.NEXTAUTH_URL}/api/citas/rsvp?token=${data.rsvpToken}`
  const confirmUrl = `${base}&action=confirm`
  const cancelUrl  = `${base}&action=cancel`

  const rsvpButtons = data.rsvpToken ? `
    <table cellpadding="0" cellspacing="0" style="margin:20px 0 0;">
      <tr>
        <td style="padding-right:8px;">
          <a href="${confirmUrl}"
            style="display:inline-block;padding:12px 24px;background:#16a34a;color:#fff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:700;">
            ✅ Confirmar asistencia
          </a>
        </td>
        <td>
          <a href="${cancelUrl}"
            style="display:inline-block;padding:12px 24px;background:#fff;color:#dc2626;text-decoration:none;border-radius:8px;font-size:14px;font-weight:700;border:2px solid #dc2626;">
            ❌ Cancelar cita
          </a>
        </td>
      </tr>
    </table>` : ''

  return `
    <table cellpadding="0" cellspacing="0" style="margin:24px 0 0;">
      <tr>
        <td style="padding-right:8px;">
          <a href="${googleUrl}" target="_blank"
            style="display:inline-block;padding:10px 16px;background:#2563eb;color:#fff;text-decoration:none;border-radius:8px;font-size:13px;font-weight:600;">
            📅 Google Calendar
          </a>
        </td>
        <td style="padding-right:8px;">
          <a href="${icsUrl}"
            style="display:inline-block;padding:10px 16px;background:#fff;color:#374151;text-decoration:none;border-radius:8px;font-size:13px;font-weight:600;border:1px solid #d1d5db;">
            🍎 Apple Calendar
          </a>
        </td>
        <td>
          <a href="${icsUrl}"
            style="display:inline-block;padding:10px 16px;background:#fff;color:#374151;text-decoration:none;border-radius:8px;font-size:13px;font-weight:600;border:1px solid #d1d5db;">
            📧 Outlook
          </a>
        </td>
      </tr>
    </table>
    ${rsvpButtons}`
}

function emailHtml({
  title,
  greeting,
  body,
  details,
  footer,
  calendarData,
}: {
  title: string
  greeting: string
  body: string
  details: { label: string; value: string }[]
  footer: string
  calendarData?: AppointmentEmailData
}) {
  const rows = details
    .map(
      (d) => `
      <tr>
        <td style="padding:8px 0;color:#64748b;font-size:14px;width:140px;vertical-align:top;">${d.label}</td>
        <td style="padding:8px 0;color:#1e293b;font-size:14px;font-weight:600;">${d.value}</td>
      </tr>`
    )
    .join('')

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.08);">
        <tr><td style="background:#2563eb;padding:28px 32px;">
          <p style="margin:0;color:#fff;font-size:20px;font-weight:700;">${title}</p>
          <p style="margin:4px 0 0;color:#bfdbfe;font-size:13px;">Feliz Horizonte</p>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="margin:0 0 8px;font-size:16px;color:#1e293b;">${greeting}</p>
          <p style="margin:0 0 24px;font-size:14px;color:#64748b;">${body}</p>
          <table width="100%" style="background:#f8fafc;border-radius:8px;padding:16px 20px;" cellpadding="0" cellspacing="0">
            ${rows}
          </table>
          ${calendarData ? calendarButtons(calendarData) : ''}
          <p style="margin:24px 0 0;font-size:13px;color:#94a3b8;">${footer}</p>
        </td></tr>
        <tr><td style="background:#f8fafc;padding:16px 32px;border-top:1px solid #e2e8f0;">
          <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;">Feliz Horizonte &bull; felizhorizonte.pe</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export async function sendAppointmentConfirmation(data: AppointmentEmailData) {
  const dateStr = formatDateTime(data.dateTime)
  const details = [
    { label: '📅 Fecha y hora', value: dateStr },
    { label: '⏱ Duración', value: `${data.duration} minutos` },
    { label: '🩺 Doctor', value: data.doctorName },
    { label: '👤 Paciente', value: data.patientName },
    { label: '📋 Motivo', value: data.reason },
    ...(data.notes ? [{ label: '📝 Notas', value: data.notes }] : []),
  ]

  const promises = []

  if (data.doctorEmail) {
    promises.push(
      transporter.sendMail({
        from: `"Feliz Horizonte" <${process.env.MAIL_USER}>`,
        to: data.doctorEmail,
        subject: `Nueva cita agendada — ${data.patientName}`,
        html: emailHtml({
          title: 'Nueva cita agendada',
          greeting: `Hola, ${data.doctorName}.`,
          body: 'Se ha registrado una nueva cita en tu agenda.',
          details,
          footer: 'El evento también aparece en tu Google Calendar.',
        }),
      })
    )
  }

  if (data.patientEmail) {
    promises.push(
      transporter.sendMail({
        from: `"Feliz Horizonte" <${process.env.MAIL_USER}>`,
        to: data.patientEmail,
        subject: `Confirmación de cita médica — ${dateStr}`,
        html: emailHtml({
          title: 'Cita médica confirmada ✓',
          greeting: `Hola, ${data.patientName}.`,
          body: 'Tu cita médica ha sido agendada correctamente. Agrega el evento a tu calendario:',
          details,
          footer: 'Si necesitas cancelar o reprogramar, comunícate con el consultorio.',
          calendarData: data,
        }),
      })
    )
  }

  await Promise.allSettled(promises)
}

export async function sendAppointmentCancellation(data: AppointmentEmailData) {
  const dateStr = formatDateTime(data.dateTime)
  const details = [
    { label: '📅 Fecha y hora', value: dateStr },
    { label: '🩺 Doctor', value: data.doctorName },
    { label: '👤 Paciente', value: data.patientName },
    { label: '📋 Motivo', value: data.reason },
  ]

  const promises = []

  if (data.doctorEmail) {
    promises.push(
      transporter.sendMail({
        from: `"Feliz Horizonte" <${process.env.MAIL_USER}>`,
        to: data.doctorEmail,
        subject: `Cita cancelada — ${data.patientName}`,
        html: emailHtml({
          title: 'Cita cancelada',
          greeting: `Hola, ${data.doctorName}.`,
          body: 'La siguiente cita ha sido cancelada.',
          details,
          footer: 'Este correo fue enviado automáticamente.',
        }),
      })
    )
  }

  if (data.patientEmail) {
    promises.push(
      transporter.sendMail({
        from: `"Feliz Horizonte" <${process.env.MAIL_USER}>`,
        to: data.patientEmail,
        subject: `Tu cita médica fue cancelada`,
        html: emailHtml({
          title: 'Cita cancelada',
          greeting: `Hola, ${data.patientName}.`,
          body: 'Tu cita médica ha sido cancelada. Comunícate con el consultorio para reprogramar.',
          details,
          footer: 'Si crees que esto es un error, contáctanos a info@felizhorizonte.pe',
        }),
      })
    )
  }

  await Promise.allSettled(promises)
}

export async function sendAppointmentReminder(data: AppointmentEmailData) {
  if (!data.patientEmail) return

  const dateStr = formatDateTime(data.dateTime)
  const details = [
    { label: '📅 Fecha y hora', value: dateStr },
    { label: '⏱ Duración', value: `${data.duration} minutos` },
    { label: '🩺 Doctor', value: data.doctorName },
    { label: '📋 Motivo', value: data.reason },
    ...(data.notes ? [{ label: '📝 Notas', value: data.notes }] : []),
  ]

  await transporter.sendMail({
    from: `"Feliz Horizonte" <${process.env.MAIL_USER}>`,
    to: data.patientEmail,
    subject: `Recordatorio: tu cita médica es mañana`,
    html: emailHtml({
      title: 'Recordatorio de cita médica 🔔',
      greeting: `Hola, ${data.patientName}.`,
      body: 'Te recordamos que tienes una cita médica mañana. ¿Aún puedes asistir?',
      details,
      footer: 'Si necesitas cancelar, hazlo con anticipación para que otro paciente pueda tomar tu lugar.',
      calendarData: data,
    }),
  })
}

export async function sendAppointmentRsvp(data: AppointmentEmailData & { action: 'confirm' | 'cancel' }) {
  const dateStr = formatDateTime(data.dateTime)
  const details = [
    { label: '📅 Fecha y hora', value: dateStr },
    { label: '⏱ Duración', value: `${data.duration} minutos` },
    { label: '👤 Paciente', value: data.patientName },
    { label: '📋 Motivo', value: data.reason },
  ]

  const isConfirm = data.action === 'confirm'

  if (data.doctorEmail) {
    await transporter.sendMail({
      from: `"Feliz Horizonte" <${process.env.MAIL_USER}>`,
      to: data.doctorEmail,
      subject: isConfirm
        ? `✅ ${data.patientName} confirmó su asistencia`
        : `❌ ${data.patientName} canceló su cita`,
      html: emailHtml({
        title: isConfirm ? 'Asistencia confirmada ✅' : 'Cita cancelada por el paciente ❌',
        greeting: `Hola, ${data.doctorName}.`,
        body: isConfirm
          ? `${data.patientName} ha confirmado su asistencia a la cita.`
          : `${data.patientName} ha cancelado su cita. El evento fue eliminado de tu Google Calendar.`,
        details,
        footer: 'Este correo fue enviado automáticamente.',
      }),
    }).catch(() => {})
  }
}
