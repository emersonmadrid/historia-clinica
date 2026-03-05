'use client'

import { useState } from 'react'
import { CheckCircle, XCircle, Calendar, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  isConnected: boolean
  status?: string
}

export function GoogleCalendarButton({ isConnected, status }: Props) {
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<string | null>(null)

  async function handleSync() {
    setSyncing(true)
    setSyncResult(null)
    try {
      const res = await fetch('/api/citas/sync-google', { method: 'POST' })
      const data = await res.json()
      setSyncResult(`${data.synced} cita(s) sincronizadas de ${data.total} pendientes`)
    } catch {
      setSyncResult('Error al sincronizar')
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="space-y-3">
      {status === 'success' && (
        <div className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
          <CheckCircle className="h-4 w-4 shrink-0" />
          Google Calendar conectado correctamente
        </div>
      )}
      {status === 'error' && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          <XCircle className="h-4 w-4 shrink-0" />
          Error al conectar Google Calendar. Intenta de nuevo.
        </div>
      )}
      {syncResult && (
        <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-700">
          <CheckCircle className="h-4 w-4 shrink-0" />
          {syncResult}
        </div>
      )}

      <div className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100">
            <Calendar className="h-5 w-5 text-slate-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-900">
              {isConnected ? 'Cuenta conectada' : 'Sin conectar'}
            </p>
            <p className="text-xs text-slate-500">
              {isConnected
                ? 'Las citas se sincronizan automáticamente'
                : 'Conecta para sincronizar tus citas'}
            </p>
          </div>
        </div>
        {isConnected ? (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
              <CheckCircle className="h-3.5 w-3.5" />
              Activo
            </span>
            <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing}>
              <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Sincronizando...' : 'Sincronizar'}
            </Button>
          </div>
        ) : (
          <Button asChild size="sm">
            <a href="/api/auth/google/connect">Conectar</a>
          </Button>
        )}
      </div>
    </div>
  )
}
