'use client'

import { useCallback, useEffect, useState } from 'react'
import { Loader2, RefreshCw, AlertTriangle, Clock, ClipboardList, CheckCircle2 } from 'lucide-react'

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
      const data = await res.json()
      setBriefing(data)
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
    <section className="bg-surface">
      <div className="flex items-start justify-between gap-3 border-b border-border px-3 py-2.5">
        <p className="text-[11px] text-foreground-muted">
          Apoyo de lectura. No reemplaza el criterio clínico.
        </p>
        {loaded && (
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-1 text-[11px] text-foreground-muted transition-colors hover:text-foreground disabled:opacity-50"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        )}
      </div>

      {loading && !briefing && (
        <div className="flex items-center gap-2 px-3 py-3 text-sm text-foreground-muted">
          <Loader2 className="h-4 w-4 animate-spin" />
          Analizando historial del paciente...
        </div>
      )}

      {error && !loading && (
        <div className="flex items-center justify-between px-3 py-3">
          <p className="text-sm text-foreground-muted">No se pudo generar el briefing.</p>
          <button
            onClick={load}
            className="text-xs font-medium text-foreground hover:text-foreground-muted transition-colors"
          >
            Reintentar
          </button>
        </div>
      )}

      {briefing && (
        <div className="grid grid-cols-1 divide-y divide-border sm:grid-cols-2 sm:divide-x sm:divide-y-0">
          <div className="border-b border-border px-3 py-3 sm:col-span-2">
            <div className="flex items-start gap-2">
              <ClipboardList className="mt-0.5 h-4 w-4 shrink-0 text-foreground-subtle" />
              <p className="text-sm text-foreground">{briefing.situation}</p>
            </div>
          </div>

          <div className="px-3 py-3">
            <p className="mb-1.5 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-foreground-subtle">
              <Clock className="h-3 w-3" /> Última visita
            </p>
            <p className="text-xs text-foreground-muted">{briefing.lastVisit}</p>
          </div>

          <div className="px-3 py-3">
            <p className="mb-1.5 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-foreground-subtle">
              <CheckCircle2 className="h-3 w-3" /> Pendientes
            </p>
            <p className="text-xs text-foreground-muted">{briefing.pending || 'Sin pendientes identificados'}</p>
          </div>

          {briefing.alerts && (
            <div className="border-t border-amber-200 bg-amber-50 px-3 py-3 sm:col-span-2">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <p className="text-xs text-amber-800">{briefing.alerts}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
