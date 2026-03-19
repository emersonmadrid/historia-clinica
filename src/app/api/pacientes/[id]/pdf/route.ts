import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { assertAuth } from '@/lib/permissions'
import { getActorContext } from '@/lib/authz'
import { getRequestAuditContext, writeAuditLog } from '@/lib/audit'
import { handleApiError, NotFoundError } from '@/lib/errors'
import { getPatientById } from '@/features/patients/queries'
import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer'
import { HistoriaPDF } from '@/features/consultations/pdf/HistoriaPDF'
import { prisma } from '@/lib/prisma'
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

    const patient = await getPatientById(id, actor.organizationId)
    if (!patient) {
      throw new NotFoundError('Paciente no encontrado')
    }

    // Get organization name
    const org = await prisma.organization.findUnique({
      where: { id: actor.organizationId },
      select: { name: true },
    })
    const orgName = org?.name || 'Feliz Horizonte'

    const printDate = new Date().toLocaleDateString('es', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })

    const element = React.createElement(HistoriaPDF, {
      patient: {
        id: patient.id,
        firstName: patient.firstName,
        lastName: patient.lastName,
        documentType: patient.documentType,
        documentNumber: patient.documentNumber,
        birthDate: patient.birthDate,
        gender: patient.gender,
        phone: patient.phone,
        email: patient.email,
        clinicalRecords: patient.clinicalRecords.map((r) => ({
          id: r.id,
          date: r.date,
          reason: r.reason,
          subjective: r.subjective,
          objective: r.objective,
          assessment: r.assessment,
          plan: r.plan,
          notes: r.notes,
          doctor: r.doctor,
          vitalSigns: r.vitalSigns ? {
            height: r.vitalSigns.height,
            weight: r.vitalSigns.weight,
            bmi: r.vitalSigns.bmi,
            temperature: r.vitalSigns.temperature,
            bloodPressureSys: r.vitalSigns.bloodPressureSys,
            bloodPressureDia: r.vitalSigns.bloodPressureDia,
            heartRate: r.vitalSigns.heartRate,
            oxygenSat: r.vitalSigns.oxygenSat,
            respiratoryRate: r.vitalSigns.respiratoryRate,
            glucoseLevel: r.vitalSigns.glucoseLevel,
          } : null,
          diagnoses: r.diagnoses.map((d) => ({
            id: d.id,
            code: d.code,
            description: d.description,
            type: d.type,
            status: d.status,
          })),
        })),
      },
      printDate,
      orgName,
    })

    const buffer = await renderToBuffer(element as ReactElement<DocumentProps>)

    const audit = getRequestAuditContext(_request)
    await writeAuditLog({
      organizationId: actor.organizationId,
      actorUserId: actor.userId,
      action: 'PATIENT_EXPORTED',
      entityType: 'patient',
      entityId: patient.id,
      ...audit,
      metadata: { format: 'pdf' },
    })

    const lastName = patient.lastName.toLowerCase().replace(/\s+/g, '-')

    return new NextResponse(buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="historia-${lastName}.pdf"`,
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
