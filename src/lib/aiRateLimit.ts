import { NextResponse } from 'next/server'
import { checkRateLimit } from './rateLimit'

// 20 requests per user per minute across all AI endpoints
const AI_RATE_LIMIT = { windowMs: 60_000, max: 20 }

export function applyAiRateLimit(userId: string): NextResponse | null {
  const { allowed, retryAfterMs } = checkRateLimit(`ai:${userId}`, AI_RATE_LIMIT)
  if (!allowed) {
    return NextResponse.json(
      { error: 'Demasiadas solicitudes. Espera un momento antes de volver a usar el asistente IA.' },
      {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil(retryAfterMs / 1000)) },
      }
    )
  }
  return null
}
