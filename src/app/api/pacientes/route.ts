import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createPatientSchema = z.object({
  firstName: z.string().min(1, 'Nombre requerido'),
  lastName: z.string().min(1, 'Apellido requerido'),
  documentType: z.enum(['DNI', 'CE', 'PASSPORT', 'RUC']),
  documentNumber: z.string().min(1, 'Número de documento requerido'),
  birthDate: z.string().min(1, 'Fecha de nacimiento requerida'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  city: z.string().optional(),
  bloodType: z.enum(['A_POS', 'A_NEG', 'B_POS', 'B_NEG', 'AB_POS', 'AB_NEG', 'O_POS', 'O_NEG']).optional(),
  maritalStatus: z.enum(['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED', 'COHABITANT']).optional(),
  occupation: z.string().optional(),
  insuranceNumber: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  emergencyContactRel: z.string().optional(),
  notes: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc'
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
        ? { birthDate: sortOrder === 'asc' ? 'desc' as const : 'asc' as const }
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

    return NextResponse.json({ patients, total, page, limit })
  } catch (error) {
    console.error('GET /api/pacientes error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = createPatientSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.flatten() }, { status: 400 })
    }

    const data = parsed.data

    const existing = await prisma.patient.findUnique({
      where: { documentNumber: data.documentNumber },
    })

    if (existing) {
      return NextResponse.json({ error: 'Ya existe un paciente con ese número de documento' }, { status: 409 })
    }

    const patient = await prisma.patient.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        documentType: data.documentType,
        documentNumber: data.documentNumber,
        birthDate: new Date(data.birthDate),
        gender: data.gender,
        phone: data.phone || null,
        email: data.email || null,
        address: data.address || null,
        city: data.city || null,
        bloodType: data.bloodType || null,
        maritalStatus: data.maritalStatus || null,
        occupation: data.occupation || null,
        insuranceNumber: data.insuranceNumber || null,
        emergencyContactName: data.emergencyContactName || null,
        emergencyContactPhone: data.emergencyContactPhone || null,
        emergencyContactRel: data.emergencyContactRel || null,
        notes: data.notes || null,
      },
    })

    return NextResponse.json(patient, { status: 201 })
  } catch (error) {
    console.error('POST /api/pacientes error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
