'use client'

import { useEffect, useState } from 'react'
import { Sparkles, Loader2, RefreshCw, AlertTriangle, Clock, ClipboardList, CheckCircle2 } from 'lucide-react'

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

  const load = async () => {
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
  }

  useEffect(() => {
    if (hasConsultations) load()
  }, [patientId])

  if (!hasConsultations) return null

  return (
    <div className="rounded-xl border border-violet-200 bg-gradient-to-r from-violet-50 to-white overflow-hidden shadow-sm">
      <div className="flex items-center justify-between border-b border-violet-100 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-violet-500" />
          <span className="text-xs font-semibold text-violet-700 uppercase tracking-wide">Briefing IA</span>
          <span className="text-xs text-violet-400">— Solo de apoyo, no reemplaza el criterio clínico</span>
        </div>
        {loaded && (
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-1 text-xs text-violet-500 hover:text-violet-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        )}
      </div>

      {loading && !briefing && (
        <div className="flex items-center gap-2 px-4 py-4 text-sm text-violet-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Analizando historial del paciente...
        </div>
      )}

      {error && !loading && (
        <div className="flex items-center justify-between px-4 py-3">
          <p className="text-sm text-slate-500">No se pudo generar el briefing.</p>
          <button
            onClick={load}
            className="text-xs text-violet-600 hover:text-violet-800 font-medium transition-colors"
          >
            Reintentar
          </button>
        </div>
      )}

      {briefing && (
        <div className="grid grid-cols-1 divide-y divide-violet-100 sm:grid-cols-2 sm:divide-y-0 sm:divide-x">
          {/* Situación actual */}
          <div className="px-4 py-3 sm:col-span-2 border-b border-violet-100">
            <div className="flex items-start gap-2">
              <ClipboardList className="h-4 w-4 text-violet-500 shrink-0 mt-0.5" />
              <p className="text-sm text-slate-700">{briefing.situation}</p>
            </div>
          </div>

          {/* Última visita */}
          <div className="px-4 py-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5 flex items-center gap-1">
              <Clock className="h-3 w-3" /> Última visita
            </p>
            <p className="text-xs text-slate-600">{briefing.lastVisit}</p>
          </div>

          {/* Pendientes */}
          <div className="px-4 py-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> Pendientes
            </p>
            <p className="text-xs text-slate-600">{briefing.pending || 'Sin pendientes identificados'}</p>
          </div>

          {/* Alertas */}
          {briefing.alerts && (
            <div className="px-4 py-3 sm:col-span-2 border-t border-violet-100 bg-amber-50">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">{briefing.alerts}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
