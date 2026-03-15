'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { toast } from '@/hooks/useToast'

export function DeletePatientButton({
  patientId,
  patientName,
  menuItem = false,
}: {
  patientId: string
  patientName: string
  menuItem?: boolean
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    setLoading(true)
    try {
      const res = await fetch(`/api/pacientes/${patientId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast({ variant: 'success', title: 'Paciente eliminado correctamente' })
      router.push('/pacientes')
      router.refresh()
    } catch {
      toast({ variant: 'error', title: 'Error al eliminar el paciente' })
      setLoading(false)
    }
  }

  return (
    <>
      {menuItem ? (
        <button
          onClick={() => setOpen(true)}
          className="flex w-full items-center gap-2 px-2 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-sm"
        >
          <Trash2 className="h-4 w-4" />
          Eliminar paciente
        </button>
      ) : (
        <Button variant="outline" size="sm" className="border-red-200 text-red-600 hover:bg-red-50" onClick={() => setOpen(true)}>
          <Trash2 className="mr-1.5 h-4 w-4" />
          Eliminar
        </Button>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar paciente?</DialogTitle>
            <DialogDescription>
              Se desactivará el registro de <strong>{patientName}</strong>. Esta acción se puede revertir si es necesario.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button variant="destructive" disabled={loading} onClick={handleDelete}>
              {loading ? 'Eliminando...' : 'Sí, eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
