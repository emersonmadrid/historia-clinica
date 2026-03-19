import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { assertAuth } from '@/lib/permissions'
import { handleApiError } from '@/lib/errors'

export async function GET() {
  try {
    const session = await auth()
    assertAuth(session)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const referralModel = (prisma as any).referral
    if (!referralModel) return NextResponse.json({ count: 0 })

    const count = await referralModel.count({
      where: {
        toDoctorId: session.user.id,
        status: 'PENDING',
      },
    })

    return NextResponse.json({ count })
  } catch (error) {
    return handleApiError(error)
  }
}
