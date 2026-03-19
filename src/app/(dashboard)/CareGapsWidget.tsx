'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { AlertTriangle, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CareGapPatient {
  id: string
  firstName: string
  lastName: string
  phone: string | null
  lastVisit: string | null
  daysSince: number | null
  chronicConditions: string[]
}

function urgencyClass(days: number | null) {
  if (days === null || days >= 365) return 'text-danger'
  if (days >= 180) return 'text-warning'
  return 'text-foreground-muted'
}

export function CareGapsWidget() {
  const { data: gaps, isLoading } = useQuery<CareGapPatient[]>({
    queryKey: ['care-gaps'],
    queryFn: async () => {
      const res = await fetch('/api/care-gaps')
      if (!res.ok) throw new Error()
      return res.json()
    },
    staleTime: 5 * 60 * 1000,
  })

  if (isLoading) {
    return (
      <div className="panel">
        <div className="flex items-center gap-2 border-b border-border bg-surface-alt px-3 py-2.5">
          <AlertTriangle className="h-3.5 w-3.5 text-warning" />
          <span className="section-kicker">Gaps de cuidado</span>
        </div>
        <div className="space-y-2 p-3">
          {[1, 2, 3].map(i => <div key={i} className="h-8 animate-pulse bg-border-subtle" />)}
        </div>
      </div>
    )
  }

  if (!gaps || gaps.length === 0) return null

  return (
    <div className="panel overflow-hidden">
      <div className="flex items-center justify-between border-b border-border bg-surface-alt px-3 py-2.5">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-3.5 w-3.5 text-warning" />
          <span className="section-kicker">Gaps de cuidado</span>
          <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-warning px-1 text-xs font-bold text-white">
            {gaps.length}
          </span>
        </div>
        <Link href="/pacientes" className="text-xs font-medium text-primary hover:underline">
          Ver todos
        </Link>
      </div>

      <div className="divide-y divide-border-subtle">
        {gaps.slice(0, 5).map(p => (
          <div key={p.id} className="flex items-center gap-2 px-3 py-2.5">
            <div className="min-w-0 flex-1">
              <Link
                href={`/pacientes/${p.id}`}
                className="block truncate text-xs font-medium text-foreground hover:text-primary transition-colors"
              >
                {p.firstName} {p.lastName}
              </Link>
              {p.chronicConditions.length > 0 && (
                <p className="truncate text-xs text-foreground-subtle">
                  {p.chronicConditions.slice(0, 2).join(' · ')}
                </p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className={`text-xs font-semibold tabular-nums ${urgencyClass(p.daysSince)}`}>
                {p.daysSince !== null ? `${p.daysSince}d` : '—'}
              </span>
              <Button variant="outline" size="sm" asChild className="h-6 px-2 text-xs">
                <Link href={`/citas/nueva?patientId=${p.id}`}>
                  <Calendar className="h-2.5 w-2.5" />
                  Citar
                </Link>
              </Button>
            </div>
          </div>
        ))}
      </div>

      {gaps.length > 5 && (
        <div className="border-t border-border px-3 py-2">
          <Link href="/pacientes" className="text-xs font-medium text-foreground-muted hover:text-primary transition-colors">
            +{gaps.length - 5} pacientes más sin control
          </Link>
        </div>
      )}
    </div>
  )
}
