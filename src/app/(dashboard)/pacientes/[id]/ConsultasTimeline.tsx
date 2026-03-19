'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, ClipboardList, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConsultaCard } from './ConsultaCard'
import type { ConsultaRecord } from './ConsultaCard'

const PAGE_SIZE = 5

interface Props {
  records: ConsultaRecord[]
  patientId: string
}

export function ConsultasTimeline({ records, patientId }: Props) {
  const [visible, setVisible] = useState(PAGE_SIZE)

  if (records.length === 0) {
    return (
      <div className="panel py-14 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center border border-border bg-background">
            <ClipboardList className="h-7 w-7 text-foreground-subtle" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">Sin consultas registradas</h3>
          <p className="mt-1 text-sm text-foreground-muted">Registre la primera consulta.</p>
          <Button asChild className="mt-4">
            <Link href={`/pacientes/${patientId}/historia/nueva-consulta`}>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Consulta
            </Link>
          </Button>
      </div>
    )
  }

  const shown = records.slice(0, visible)
  const remaining = records.length - visible

  return (
    <div className="space-y-3">
      <div className="relative space-y-3">
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />
        {shown.map((record, index) => (
          <div key={record.id} className="relative pl-14">
            <div className="absolute left-4 flex h-5 w-5 items-center justify-center rounded-full border-2 border-primary bg-surface">
              <div className="h-2 w-2 rounded-full bg-primary" />
            </div>
            <ConsultaCard record={record} patientId={patientId} defaultOpen={index === 0} />
          </div>
        ))}
      </div>

      {remaining > 0 && (
        <button
          onClick={() => setVisible(v => v + PAGE_SIZE)}
          className="flex w-full items-center justify-center gap-2 border border-dashed border-border py-3 text-sm font-medium text-foreground-muted transition-all hover:border-primary hover:bg-primary-subtle hover:text-primary"
        >
          <ChevronDown className="h-4 w-4" />
          Ver {Math.min(remaining, PAGE_SIZE)} consultas anteriores
          {remaining > PAGE_SIZE && (
            <span className="text-xs opacity-60">({remaining} en total)</span>
          )}
        </button>
      )}
    </div>
  )
}
