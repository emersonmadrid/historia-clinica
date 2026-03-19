'use client'

import Link from 'next/link'
import { Pencil, Download, MoreHorizontal } from 'lucide-react'
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
}

/**
 * Secondary actions menu "⋯" — only low-frequency or destructive actions.
 * Primary actions (Atender, Agendar) live directly in the page header.
 */
export function PatientHeaderActions({ patientId, patientName }: Props) {
  const editarHref = `/pacientes/${patientId}/editar`
  const pdfHref = `/api/pacientes/${patientId}/pdf`

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0"
          aria-label="Más acciones"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem asChild>
          <Link href={editarHref} className="flex items-center gap-2">
            <Pencil className="h-3.5 w-3.5" />
            Editar datos
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href={pdfHref} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
            <Download className="h-3.5 w-3.5" />
            Exportar PDF
          </a>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <DeletePatientButton patientId={patientId} patientName={patientName} menuItem />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
