import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const doctors = await prisma.user.findMany({
      select: { id: true, name: true, speciality: true },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(doctors)
  } catch (error) {
    console.error('GET /api/users error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
