import { prisma } from '@/lib/prisma'

export async function listAppointments(filters: { organizationId: string; date?: string; month?: string; doctorId?: string }) {
  const { organizationId, date, month, doctorId } = filters
  const where: Record<string, unknown> = {}
  where.patient = { organizationId }

  if (date) {
    const [y, m, d] = date.split('-').map(Number)
    const startOfDay = new Date(y, m - 1, d)
    const endOfDay = new Date(y, m - 1, d + 1)
    where.dateTime = { gte: startOfDay, lt: endOfDay }
  } else if (month) {
    const [y, m] = month.split('-').map(Number)
    where.dateTime = { gte: new Date(y, m - 1, 1), lt: new Date(y, m, 1) }
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
