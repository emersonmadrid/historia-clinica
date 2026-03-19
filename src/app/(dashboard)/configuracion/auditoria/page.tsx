'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ShieldCheck, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AuditLogItem {
  id: string
  action: string
  entityType: string
  entityId: string | null
  ipAddress: string | null
  userAgent: string | null
  metadata: Record<string, unknown> | null
  createdAt: string
  actorUser: {
    id: string
    name: string
    email: string
    role: string
  } | null
}

function formatAuditAction(action: string) {
  return action
    .split('_')
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(' ')
}

export default function AuditoriaPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function fetchLogs() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/auditoria?limit=100')
      if (!res.ok) throw new Error('No se pudo cargar la auditoría')
      const data = await res.json()
      setLogs(data.logs ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar auditoría')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [])

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="panel flex items-center justify-between gap-3 px-5 py-5">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild className="h-8 w-8">
            <Link href="/configuracion" aria-label="Volver a configuración">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <p className="section-kicker">Seguridad operativa</p>
            <h2 className="font-heading text-3xl font-semibold text-foreground">Auditoría</h2>
            <p className="text-sm text-foreground-muted">Trazabilidad de accesos y acciones sensibles</p>
          </div>
        </div>
        <Button variant="outline" onClick={fetchLogs} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      <div className="panel overflow-hidden">
        <div className="flex items-center gap-2 border-b border-border bg-surface-alt/80 px-5 py-3.5">
          <ShieldCheck className="h-4 w-4 text-foreground-muted" />
          <p className="text-sm font-semibold text-foreground">Eventos recientes</p>
        </div>
        <div className="p-0">
          {loading ? (
            <p className="py-8 text-center text-sm text-foreground-subtle">Cargando auditoría...</p>
          ) : error ? (
            <p className="py-8 text-center text-sm text-danger">{error}</p>
          ) : logs.length === 0 ? (
            <p className="py-8 text-center text-sm text-foreground-subtle">No hay eventos registrados</p>
          ) : (
            <div className="divide-y divide-border-subtle">
              {logs.map((log) => (
                <div key={log.id} className="grid gap-3 px-5 py-4 hover:bg-surface-alt/60 md:grid-cols-[170px_140px_minmax(0,1fr)_180px]">
                  <div className="text-xs text-foreground-muted">
                    {new Date(log.createdAt).toLocaleString('es-PE')}
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-foreground">
                      {formatAuditAction(log.action)}
                    </p>
                    <p className="text-xs text-foreground-muted">{log.entityType}</p>
                  </div>
                  <div className="min-w-0 text-xs text-foreground-muted">
                    <p className="truncate">
                      {log.actorUser ? `${log.actorUser.name} · ${log.actorUser.email}` : 'Sistema / paciente'}
                    </p>
                    <p className="truncate">Entidad: {log.entityId ?? 'sin referencia'}</p>
                    {log.metadata && (
                      <pre className="mt-2 overflow-x-auto rounded-[var(--radius)] bg-background p-2 text-xs text-foreground-subtle">
                        {JSON.stringify(log.metadata, null, 2)}
                      </pre>
                    )}
                  </div>
                  <div className="text-xs text-foreground-muted">
                    <p>{log.ipAddress || 'IP no disponible'}</p>
                    <p className="mt-1 line-clamp-2">{log.userAgent || 'Sin user-agent'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
