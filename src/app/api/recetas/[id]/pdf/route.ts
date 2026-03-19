import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { assertAuth } from '@/lib/permissions'
import { getActorContext, requireSameOrganization } from '@/lib/authz'
import { getRequestAuditContext, writeAuditLog } from '@/lib/audit'
import { handleApiError } from '@/lib/errors'
import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer'
import { RecetaPDF } from '@/features/prescriptions/pdf/RecetaPDF'
import React, { type ReactElement } from 'react'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    assertAuth(session)
    const actor = await getActorContext(session)

    const { id } = await params

    const prescription = await prisma.prescription.findUnique({
      where: { id },
      include: {
        items: { orderBy: { createdAt: 'asc' } },
        doctor: { select: { id: true, name: true, speciality: true, licenseNumber: true } },
        patient: {
          select: {
            firstName: true,
            lastName: true,
            documentType: true,
            documentNumber: true,
            organizationId: true,
          },
        },
        consultation: { select: { id: true } },
      },
    })

    const scopedPrescription = requireSameOrganization(
      prescription,
      actor.organizationId,
      (item) => item.patient.organizationId,
      'Receta no encontrada'
    )

    const org = await prisma.organization.findUnique({
      where: { id: actor.organizationId },
      select: { name: true },
    })

    const element = React.createElement(RecetaPDF, {
      prescription: {
        id: scopedPrescription.id,
        createdAt: scopedPrescription.createdAt,
        notes: scopedPrescription.notes,
        items: scopedPrescription.items,
        doctor: scopedPrescription.doctor,
        patient: scopedPrescription.patient,
      },
      orgName: org?.name,
    })

    const buffer = await renderToBuffer(element as ReactElement<DocumentProps>)

    await writeAuditLog({
      organizationId: actor.organizationId,
      actorUserId: actor.userId,
      action: 'PRESCRIPTION_EXPORTED',
      entityType: 'prescription',
      entityId: scopedPrescription.id,
      ...getRequestAuditContext(_request),
      metadata: { format: 'pdf' },
    })

    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="receta-${scopedPrescription.id.slice(-8)}.pdf"`,
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
