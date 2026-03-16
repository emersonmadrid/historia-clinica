import { prisma } from '@/lib/prisma'

export async function getPatientWithFullHistory(id: string) {
  return prisma.patient.findUnique({
    where: { id, active: true },
    include: {
      allergies: { orderBy: { createdAt: 'desc' } },
      medicalBackgrounds: { orderBy: { createdAt: 'desc' } },
      clinicalRecords: {
        orderBy: { date: 'desc' },
        include: {
          doctor: { select: { id: true, name: true, speciality: true } },
          diagnoses: true,
          vitalSigns: true,
          prescriptions: {
            include: {
              items: { orderBy: { createdAt: 'asc' } },
              doctor: { select: { id: true, name: true, speciality: true } },
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      },
      appointments: {
        where: {
          dateTime: { gte: new Date() },
          status: { notIn: ['CANCELLED'] },
        },
        orderBy: { dateTime: 'asc' },
        take: 3,
        include: { doctor: { select: { id: true, name: true } } },
      },
      documents: {
        orderBy: { createdAt: 'desc' },
        include: { uploadedBy: { select: { id: true, name: true } } },
      },
    },
  })
}

export async function getPatientForBriefing(id: string) {
  return prisma.patient.findUnique({
    where: { id, active: true },
    include: {
      allergies: true,
      clinicalRecords: {
        orderBy: { date: 'desc' },
        take: 5,
        include: {
          diagnoses: true,
          prescriptions: {
            include: { items: true },
            orderBy: { createdAt: 'desc' },
          },
        },
      },
    },
  })
}

type FullPatient = NonNullable<Awaited<ReturnType<typeof getPatientWithFullHistory>>>
type BriefingPatient = NonNullable<Awaited<ReturnType<typeof getPatientForBriefing>>>

export function extractActiveDiagnoses(records: FullPatient['clinicalRecords']) {
  type Diagnosis = FullPatient['clinicalRecords'][0]['diagnoses'][0]
  return records
    .flatMap((r) => r.diagnoses)
    .filter((d: Diagnosis) => d.status === 'ACTIVE' || d.status === 'CHRONIC')
    .reduce<Diagnosis[]>((acc, d: Diagnosis) => {
      if (!acc.find((x) => x.code === d.code)) acc.push(d)
      return acc
    }, [])
}

export function extractRecentMedications(records: FullPatient['clinicalRecords']) {
  type Prescription = FullPatient['clinicalRecords'][0]['prescriptions'][0]
  const lastPrescription = records
    .flatMap((r) => r.prescriptions)
    .sort((a: Prescription, b: Prescription) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
  return lastPrescription?.items ?? []
}

export function extractAllMedications(records: BriefingPatient['clinicalRecords']) {
  return records
    .flatMap((r) => r.prescriptions)
    .flatMap((rx) => rx.items)
    .map((it) => `${it.medication} ${it.dosage}`)
    .filter((v, i, arr) => arr.indexOf(v) === i)
}
