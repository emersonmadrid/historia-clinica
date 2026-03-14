import { prisma } from '@/lib/prisma'

export async function listAppointments(filters: { date?: string; doctorId?: string }) {
  const { date, doctorId } = filters
  const where: Record<string, unknown> = {}

  if (date) {
    const [y, m, d] = date.split('-').map(Number)
    const startOfDay = new Date(y, m - 1, d)
    const endOfDay = new Date(y, m - 1, d + 1)
    where.dateTime = { gte: startOfDay, lt: endOfDay }
  }

  if (doctorId) {
    where.doctorId = doctorId
  }

  return prisma.appointment.findMany({
    where,
    orderBy: { dateTime: 'asc' },
    include: {
      patient: { select: { id: true, firstName: true, lastName: true, phone: true } },
      doctor: { select: { id: true, name: true, speciality: true } },
    },
  })
}
