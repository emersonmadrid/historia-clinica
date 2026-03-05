import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const count = await prisma.user.count()
    return NextResponse.json({ status: 'ok', users: count })
  } catch (e: any) {
    return NextResponse.json({ status: 'error', message: e.message }, { status: 500 })
  }
}
