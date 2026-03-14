import { prisma } from '@/lib/prisma'

export async function listConsultations(patientId: string) {
  return prisma.clinicalRecord.findMany({
    where: { patientId },
    orderBy: { date: 'desc' },
    include: {
      doctor: { select: { id: true, name: true, speciality: true } },
      vitalSigns: true,
      diagnoses: true,
    },
  })
}
