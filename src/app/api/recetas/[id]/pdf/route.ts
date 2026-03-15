import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { assertAuth } from '@/lib/permissions'
import { handleApiError, NotFoundError } from '@/lib/errors'
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

    const { id } = await params

    const prescription = await prisma.prescription.findUnique({
      where: { id },
      include: {
        items: { orderBy: { createdAt: 'asc' } },
        doctor: { select: { id: true, name: true, speciality: true, licenseNumber: true } },
        patient: { select: { firstName: true, lastName: true, documentType: true, documentNumber: true } },
        consultation: { select: { id: true } },
      },
    })

    if (!prescription) throw new NotFoundError('Receta no encontrada')

    const org = await prisma.organization.findFirst({ select: { name: true } })

    const element = React.createElement(RecetaPDF, {
      prescription: {
        id: prescription.id,
        createdAt: prescription.createdAt,
        notes: prescription.notes,
        items: prescription.items,
        doctor: prescription.doctor,
        patient: prescription.patient,
      },
      orgName: org?.name,
    })

    const buffer = await renderToBuffer(element as ReactElement<DocumentProps>)

    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="receta-${prescription.id.slice(-8)}.pdf"`,
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
