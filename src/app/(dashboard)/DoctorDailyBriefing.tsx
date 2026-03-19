'use client'

import { useEffect, useState } from 'react'
import { Sparkles, Loader2, RefreshCw, AlertCircle } from 'lucide-react'

interface BriefingPatient {
  name: string
  reason: string
  note: string
  priority: 'high' | 'normal'
}

interface Briefing {
  summary: string
  patients: BriefingPatient[]
}

export function DoctorDailyBriefing() {
  const [briefing, setBriefing] = useState<Briefing | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const load = async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await fetch('/api/ai/daily-briefing')
      if (!res.ok) throw new Error()
      setBriefing(await res.json())
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  if (loading) {
    return (
      <div className="panel">
        <div className="flex items-center gap-2 border-b border-border bg-surface-alt px-3 py-2.5">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span className="section-kicker">Briefing IA</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-4 text-xs text-foreground-muted">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-primary shrink-0" />
          Analizando tu jornada...
        </div>
      </div>
    )
  }

  if (error || !briefing) return null

  const highPriority = briefing.patients.filter(p => p.priority === 'high')

  return (
    <div className="panel overflow-hidden">
      <div className="flex items-center justify-between border-b border-border bg-surface-alt px-3 py-2.5">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span className="section-kicker">Briefing IA</span>
        </div>
        <button onClick={load} className="text-foreground-subtle transition-colors hover:text-foreground">
          <RefreshCw className="h-3 w-3" />
        </button>
      </div>

      <div className="space-y-3 px-3 py-3">
        <p className="text-xs leading-relaxed text-foreground-muted">{briefing.summary}</p>

        {highPriority.length > 0 && (
          <div className="space-y-1.5">
            {highPriority.map((p, i) => (
              <div key={i} className="flex items-start gap-2 border border-warning/20 bg-warning/5 px-2.5 py-2 text-xs">
                <AlertCircle className="mt-0.5 h-3 w-3 shrink-0 text-warning" />
                <div className="min-w-0">
                  <span className="font-semibold text-foreground">{p.name}</span>
                  {p.note && <span className="ml-1 text-foreground-muted">— {p.note}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
