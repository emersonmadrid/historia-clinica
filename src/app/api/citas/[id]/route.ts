import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { updateCalendarEvent, deleteCalendarEvent } from '@/lib/google-calendar'
import { sendAppointmentCancellation } from '@/lib/mailer'
import { getActorContext, requireSameOrganization } from '@/lib/authz'
import { getRequestAuditContext, writeAuditLog } from '@/lib/audit'
import { handleApiError, ForbiddenError } from '@/lib/errors'
import { z } from 'zod'

const updateAppointmentSchema = z.object({
  status: z.enum(['SCHEDULED', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW']).optional(),
  dateTime: z.string().optional(),
  duration: z.number().int().optional(),
  reason: z.string().optional(),
  notes: z.string().optional().nullable(),
})

async function getScopedAppointment(id: string, organizationId: string) {
  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: {
      patient: { select: { id: true, firstName: true, lastName: true, email: true, organizationId: true } },
      doctor: { select: { id: true, name: true, email: true } },
    },
  })

  return requireSameOrganization(
    appointment,
    organizationId,
    (item) => item.patient.organizationId,
    'Cita no encontrada'
  )
}

function assertCanManageAppointment(
  actor: Awaited<ReturnType<typeof getActorContext>>,
  doctorId: string
) {
  if (actor.role === 'DOCTOR' && actor.userId !== doctorId) {
    throw new ForbiddenError('Solo el doctor asignado puede modificar esta cita')
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const actor = await getActorContext(session)
    const { id } = await params
    const appointment = await getScopedAppointment(id, actor.organizationId)

    return NextResponse.json(appointment)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const actor = await getActorContext(session)
    const { id } = await params
    const { action } = await request.json()
    const existing = await getScopedAppointment(id, actor.organizationId)
    assertCanManageAppointment(actor, existing.doctor.id)

    if (action === 'arrive') {
      const appointment = await prisma.appointment.update({
        where: { id },
        data: { arrivedAt: new Date() },
      })
      await writeAuditLog({
        organizationId: actor.organizationId,
        actorUserId: actor.userId,
        action: 'APPOINTMENT_STATUS_CHANGED',
        entityType: 'appointment',
        entityId: id,
        ...getRequestAuditContext(request),
        metadata: { action: 'arrive' },
      })
      return NextResponse.json(appointment)
    }

    if (action === 'complete') {
      const appointment = await prisma.appointment.update({
        where: { id },
        data: { status: 'COMPLETED' },
      })
      await writeAuditLog({
        organizationId: actor.organizationId,
        actorUserId: actor.userId,
        action: 'APPOINTMENT_STATUS_CHANGED',
        entityType: 'appointment',
        entityId: id,
        ...getRequestAuditContext(request),
        metadata: { action: 'complete', status: 'COMPLETED' },
      })
      return NextResponse.json(appointment)
    }

    return NextResponse.json({ error: 'Acción inválida' }, { status: 400 })
  } catch (error) {
    return handleApiError(error)
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

    const actor = await getActorContext(session)
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

    const existing = await getScopedAppointment(id, actor.organizationId)
    assertCanManageAppointment(actor, existing.doctor.id)

    const appointment = await prisma.appointment.update({
      where: { id },
      data: updateData,
      include: {
        patient: { select: { id: true, firstName: true, lastName: true, email: true } },
        doctor: { select: { id: true, name: true, email: true } },
      },
    })

    await writeAuditLog({
      organizationId: actor.organizationId,
      actorUserId: actor.userId,
      action: data.status ? 'APPOINTMENT_STATUS_CHANGED' : 'APPOINTMENT_UPDATED',
      entityType: 'appointment',
      entityId: id,
      ...getRequestAuditContext(request),
      metadata: {
        status: appointment.status,
        dateTime: appointment.dateTime.toISOString(),
        duration: appointment.duration,
      },
    })

    if (data.status === 'CANCELLED') {
      const emailData = {
        appointmentId: id,
        patientName: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
        patientEmail: appointment.patient.email,
        doctorName: appointment.doctor.name,
        doctorEmail: process.env.MAIL_USER,
        dateTime: existing.dateTime,
        duration: existing.duration,
        reason: existing.reason,
      }

      Promise.all([
        existing.googleEventId
          ? deleteCalendarEvent(existing.doctor.id, existing.googleEventId)
          : Promise.resolve(),
        sendAppointmentCancellation(emailData),
      ]).catch(() => {})
    } else if (existing.googleEventId) {
      updateCalendarEvent(existing.doctor.id, existing.googleEventId, {
        summary: data.reason ? `Cita: ${appointment.patient.firstName} ${appointment.patient.lastName}` : undefined,
        start: data.dateTime ? new Date(data.dateTime) : undefined,
        end: data.dateTime
          ? new Date(new Date(data.dateTime).getTime() + appointment.duration * 60 * 1000)
          : undefined,
      }).catch(() => {})
    }

    return NextResponse.json(appointment)
  } catch (error) {
    return handleApiError(error)
  }
}
