/**
 * Simple in-memory rate limiter for AI endpoints.
 * Resets per window. Not clustered — use Redis for multi-instance.
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

interface RateLimitOptions {
  windowMs: number  // window duration in ms
  max: number       // max requests per window per key
}

export function checkRateLimit(key: string, opts: RateLimitOptions): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now >= entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + opts.windowMs })
    return { allowed: true, retryAfterMs: 0 }
  }

  if (entry.count >= opts.max) {
    return { allowed: false, retryAfterMs: entry.resetAt - now }
  }

  entry.count++
  return { allowed: true, retryAfterMs: 0 }
}

// Cleanup stale entries every 5 minutes to prevent memory leak
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store.entries()) {
    if (now >= entry.resetAt) store.delete(key)
  }
}, 5 * 60 * 1000)
