'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, ClipboardList, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
      <Card>
        <CardContent className="py-12 text-center">
          <ClipboardList className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="mt-4 text-sm font-medium text-slate-900">Sin consultas registradas</h3>
          <p className="mt-1 text-sm text-slate-500">Registre la primera consulta de este paciente.</p>
          <Button asChild className="mt-4">
            <Link href={`/pacientes/${patientId}/historia/nueva-consulta`}>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Consulta
            </Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  const shown = records.slice(0, visible)
  const remaining = records.length - visible

  return (
    <div className="space-y-3">
      <div className="relative space-y-3">
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-200" />
        {shown.map((record, index) => (
          <div key={record.id} className="relative pl-14">
            <div className="absolute left-4 flex h-5 w-5 items-center justify-center rounded-full border-2 border-blue-600 bg-white">
              <div className="h-2 w-2 rounded-full bg-blue-600" />
            </div>
            <ConsultaCard record={record} defaultOpen={index === 0} />
          </div>
        ))}
      </div>

      {remaining > 0 && (
        <button
          onClick={() => setVisible(v => v + PAGE_SIZE)}
          className="w-full flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white py-2.5 text-sm text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
        >
          <ChevronDown className="h-4 w-4" />
          Cargar {Math.min(remaining, PAGE_SIZE)} consultas más
          <span className="text-xs text-slate-400">({remaining} restantes)</span>
        </button>
      )}
    </div>
  )
}
