'use client'

import { useEffect, useState } from 'react'

export function ReferralBadge() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function fetchCount() {
      try {
        const res = await fetch('/api/referrals/pending-count')
        if (!res.ok || cancelled) return
        const data = await res.json()
        setCount(data.count ?? 0)
      } catch {
        // silently ignore
      }
    }

    fetchCount()
    const interval = setInterval(fetchCount, 30_000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  if (count === 0) return null

  return (
    <span className="ml-auto flex h-4 min-w-[16px] items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold leading-none text-white">
      {count > 9 ? '9+' : count}
    </span>
  )
}
