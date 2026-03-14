import { prisma } from '@/lib/prisma'

export async function getPatientById(id: string) {
  return prisma.patient.findUnique({
    where: { id },
    include: {
      allergies: { orderBy: { createdAt: 'desc' } },
      medicalBackgrounds: { orderBy: { createdAt: 'desc' } },
      clinicalRecords: {
        orderBy: { date: 'desc' },
        include: {
          doctor: { select: { id: true, name: true, speciality: true } },
          vitalSigns: true,
          diagnoses: true,
        },
      },
      appointments: {
        orderBy: { dateTime: 'desc' },
        take: 5,
        include: {
          doctor: { select: { id: true, name: true } },
        },
      },
    },
  })
}

export async function listPatients(filters: {
  search?: string
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}) {
  const { search = '', page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = filters
  const skip = (page - 1) * limit

  const where = {
    active: true,
    ...(search && {
      OR: [
        { firstName: { contains: search, mode: 'insensitive' as const } },
        { lastName: { contains: search, mode: 'insensitive' as const } },
        { documentNumber: { contains: search, mode: 'insensitive' as const } },
        { phone: { contains: search, mode: 'insensitive' as const } },
      ],
    }),
  }

  const orderBy =
    sortBy === 'name'
      ? [{ lastName: sortOrder }, { firstName: sortOrder }]
      : sortBy === 'age'
      ? { birthDate: sortOrder === 'asc' ? ('desc' as const) : ('asc' as const) }
      : { createdAt: sortOrder }

  const [patients, total] = await Promise.all([
    prisma.patient.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        clinicalRecords: {
          orderBy: { date: 'desc' },
          take: 1,
          select: { date: true },
        },
        appointments: {
          where: {
            dateTime: { gte: new Date() },
            status: { notIn: ['CANCELLED'] },
          },
          orderBy: { dateTime: 'asc' },
          take: 1,
          select: { dateTime: true, status: true },
        },
        _count: { select: { clinicalRecords: true } },
      },
    }),
    prisma.patient.count({ where }),
  ])

  return { patients, total, page, limit }
}
