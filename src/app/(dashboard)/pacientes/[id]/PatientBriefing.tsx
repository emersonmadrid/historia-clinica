'use client'

import { useCallback, useEffect, useState } from 'react'
import { Loader2, RefreshCw, AlertTriangle, Sparkles } from 'lucide-react'

interface Briefing {
  situation: string
  lastVisit: string
  pending: string
  alerts: string
}

export function PatientBriefing({ patientId, hasConsultations }: { patientId: string; hasConsultations: boolean }) {
  const [briefing, setBriefing] = useState<Briefing | null>(null)
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await fetch(`/api/pacientes/${patientId}/briefing`)
      if (!res.ok) throw new Error()
      setBriefing(await res.json())
      setLoaded(true)
    } catch {
      setError(true)
      setBriefing(null)
    } finally {
      setLoading(false)
    }
  }, [patientId])

  useEffect(() => {
    if (hasConsultations) load()
  }, [hasConsultations, load])

  if (!hasConsultations) return null

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--surface-alt)] px-4 py-2.5">
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-[var(--primary)]" />
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--foreground-muted)]">Resumen IA</p>
        </div>
        {loaded && (
          <button
            onClick={load}
            disabled={loading}
            className="text-[var(--foreground-subtle)] hover:text-[var(--foreground)] transition-colors disabled:opacity-40"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>

      <div className="p-4">
        {loading && !briefing && (
          <div className="flex items-center gap-2 text-sm text-[var(--foreground-muted)]">
            <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-[var(--primary)]" />
            Analizando historial...
          </div>
        )}

        {error && !loading && (
          <button onClick={load} className="text-sm text-[var(--primary)] hover:underline">
            Error al cargar — Reintentar
          </button>
        )}

        {briefing && (
          <div className="space-y-3">
            <p className="text-sm leading-relaxed text-[var(--foreground-muted)]">{briefing.situation}</p>
            {briefing.pending && briefing.pending !== 'N/A' && (
              <p className="text-sm text-[var(--foreground-subtle)]">
                <span className="font-medium text-[var(--foreground-muted)]">Pendiente: </span>
                {briefing.pending}
              </p>
            )}
            {briefing.alerts && (
              <div className="flex items-start gap-2 rounded-md border border-[var(--warning)]/20 bg-[var(--warning)]/5 px-3 py-2">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--warning)]" />
                <p className="text-sm text-[var(--warning)]">{briefing.alerts}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
