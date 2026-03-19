'use client'

import { useState, useEffect } from 'react'

export function LiveClock() {
  const [time, setTime] = useState('')

  useEffect(() => {
    const tick = () =>
      setTime(
        new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
      )
    tick()
    const id = setInterval(tick, 15000)
    return () => clearInterval(id)
  }, [])

  if (!time) return null

  return (
    <span className="font-mono text-sm font-bold tabular-nums text-foreground">
      {time}
    </span>
  )
}
