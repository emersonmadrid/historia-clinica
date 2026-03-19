import { prisma } from '@/lib/prisma'

export async function listConsultations(patientId: string, organizationId: string) {
  return prisma.clinicalRecord.findMany({
    where: { patientId, patient: { organizationId } },
    orderBy: { date: 'desc' },
    include: {
      doctor: { select: { id: true, name: true, speciality: true, specialty: true } },
      vitalSigns: true,
      diagnoses: true,
      referrals: {
        select: {
          id: true, toSpecialty: true, urgency: true, status: true, reason: true, createdAt: true,
          toDoctor: { select: { id: true, name: true } },
        },
      },
      prescriptions: {
        include: {
          doctor: { select: { id: true, name: true, speciality: true } },
          items: true,
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  })
}

export async function listDoctorsInOrg(organizationId: string) {
  return prisma.user.findMany({
    where: { organizationId, active: true, role: 'DOCTOR' },
    select: { id: true, name: true, specialty: true, speciality: true },
    orderBy: { name: 'asc' },
  })
}
