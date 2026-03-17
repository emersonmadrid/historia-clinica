'use client'

import Link from 'next/link'
import {
  Plus, Calendar, Pencil, Download, MoreHorizontal,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { DeletePatientButton } from './DeletePatientButton'

interface Props {
  patientId: string
  patientName: string
  consultaHref: string
  doctorId: string
}

export function PatientHeaderActions({ patientId, patientName, consultaHref, doctorId }: Props) {
  const newCitaHref = `/citas/nueva?patientId=${patientId}${doctorId ? `&doctorId=${doctorId}` : ''}`
  const editarHref = `/pacientes/${patientId}/editar`
  const pdfHref = `/api/pacientes/${patientId}/pdf`
  const menuTriggerId = `patient-actions-trigger-${patientId}`

  return (
    <div className="flex flex-wrap items-center justify-start gap-2 sm:justify-end">
      <Button size="sm" asChild className="rounded-sm px-3 font-medium">
        <Link href={consultaHref}>
          <Plus className="mr-1.5 h-4 w-4" />
          Atender
        </Link>
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            id={menuTriggerId}
            variant="outline"
            size="sm"
            className="rounded-sm px-3 font-medium"
          >
            <MoreHorizontal className="mr-1.5 h-4 w-4" />
            Acciones
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem asChild>
            <Link href={newCitaHref} className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Agendar cita
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href={editarHref} className="flex items-center gap-2">
              <Pencil className="h-4 w-4" />
              Editar datos
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a href={pdfHref} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Exportar PDF
            </a>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <DeletePatientButton patientId={patientId} patientName={patientName} menuItem />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
