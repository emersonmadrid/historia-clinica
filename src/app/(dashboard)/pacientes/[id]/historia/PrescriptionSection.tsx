'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { toast } from '@/hooks/useToast'
import { Plus, Trash2, Pill, Download } from 'lucide-react'

interface PrescriptionItem {
  id: string
  medication: string
  dosage: string
  frequency: string
  duration: string
  quantity: string | null
  instructions: string | null
}

interface Prescription {
  id: string
  notes: string | null
  createdAt: string
  doctor: { name: string; speciality: string | null }
  items: PrescriptionItem[]
}

interface PrescriptionSectionProps {
  consultationId: string
  prescriptions: Prescription[]
}

const emptyItem = { medication: '', dosage: '', frequency: '', duration: '', quantity: '', instructions: '' }

export function PrescriptionSection({ consultationId, prescriptions: initial }: PrescriptionSectionProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [items, setItems] = useState([{ ...emptyItem }])
  const [notes, setNotes] = useState('')

  function addItem() {
    setItems([...items, { ...emptyItem }])
  }

  function removeItem(i: number) {
    setItems(items.filter((_, idx) => idx !== i))
  }

  function updateItem(i: number, field: string, value: string) {
    setItems(items.map((item, idx) => idx === i ? { ...item, [field]: value } : item))
  }

  function resetForm() {
    setItems([{ ...emptyItem }])
    setNotes('')
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    const validItems = items.filter(it => it.medication && it.dosage && it.frequency && it.duration)
    if (validItems.length === 0) {
      toast({ title: 'Agrega al menos un medicamento completo', variant: 'error' })
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/consultas/${consultationId}/recetas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: notes || undefined, items: validItems }),
      })
      if (res.ok) {
        toast({ title: 'Receta creada' })
        setOpen(false)
        resetForm()
        router.refresh()
      } else {
        const data = await res.json()
        toast({ title: data.error || 'Error al crear receta', variant: 'error' })
      }
    } catch {
      toast({ title: 'Error al crear receta', variant: 'error' })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(prescriptionId: string) {
    if (!confirm('¿Eliminar esta receta?')) return
    setDeleting(prescriptionId)
    try {
      const res = await fetch(`/api/recetas/${prescriptionId}`, { method: 'DELETE' })
      if (res.ok) {
        toast({ title: 'Receta eliminada' })
        router.refresh()
      } else {
        toast({ title: 'Error al eliminar', variant: 'error' })
      }
    } catch {
      toast({ title: 'Error al eliminar', variant: 'error' })
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
          <Pill className="h-3.5 w-3.5" />
          Recetas
        </h4>
        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setOpen(true)}>
          <Plus className="mr-1 h-3.5 w-3.5" />
          Nueva Receta
        </Button>
      </div>

      {initial.length === 0 ? (
        <p className="text-xs text-slate-400 py-2">No hay recetas en esta consulta</p>
      ) : (
        <div className="space-y-3">
          {initial.map((rx) => (
            <div key={rx.id} className="rounded-lg border border-[#A5F3FC] bg-[#F0F9FF]/50 p-3">
              <div className="flex items-start justify-between mb-2">
                <span className="text-xs text-slate-500">Dr. {rx.doctor.name}</span>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-6 w-6" asChild title="Imprimir receta">
                    <a href={`/api/recetas/${rx.id}/pdf`} target="_blank" rel="noopener noreferrer">
                      <Download className="h-3.5 w-3.5 text-[#0EA5E9]" />
                    </a>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleDelete(rx.id)}
                    disabled={deleting === rx.id}
                    title="Eliminar receta"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <div className="space-y-1.5">
                {rx.items.map((item, i) => (
                  <div key={item.id} className="text-sm">
                    <span className="font-medium text-slate-800">{i + 1}. {item.medication} {item.dosage}</span>
                    <span className="text-slate-500"> — {item.frequency}, {item.duration}</span>
                    {item.quantity && <span className="text-slate-500"> ({item.quantity})</span>}
                    {item.instructions && (
                      <p className="text-xs text-slate-400 italic ml-4">{item.instructions}</p>
                    )}
                  </div>
                ))}
              </div>
              {rx.notes && (
                <p className="mt-2 text-xs text-slate-500 border-t border-[#A5F3FC] pt-2">{rx.notes}</p>
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm() }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nueva Receta</DialogTitle>
            <DialogDescription>Agrega los medicamentos para esta consulta</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            {items.map((item, i) => (
              <div key={i} className="rounded-lg border border-slate-200 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Medicamento {i + 1}</span>
                  {items.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-700" onClick={() => removeItem(i)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Medicamento *</Label>
                    <Input
                      placeholder="Ej: Amoxicilina"
                      value={item.medication}
                      onChange={e => updateItem(i, 'medication', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Dosis *</Label>
                    <Input
                      placeholder="Ej: 500mg"
                      value={item.dosage}
                      onChange={e => updateItem(i, 'dosage', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Frecuencia *</Label>
                    <Input
                      placeholder="Ej: Cada 8 horas"
                      value={item.frequency}
                      onChange={e => updateItem(i, 'frequency', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Duración *</Label>
                    <Input
                      placeholder="Ej: 7 días"
                      value={item.duration}
                      onChange={e => updateItem(i, 'duration', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Cantidad <span className="text-slate-400">(opcional)</span></Label>
                    <Input
                      placeholder="Ej: 21 tabletas"
                      value={item.quantity}
                      onChange={e => updateItem(i, 'quantity', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Instrucciones <span className="text-slate-400">(opcional)</span></Label>
                    <Input
                      placeholder="Ej: Tomar con alimentos"
                      value={item.instructions}
                      onChange={e => updateItem(i, 'instructions', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}

            <Button type="button" variant="outline" size="sm" onClick={addItem} className="w-full border-dashed">
              <Plus className="mr-1.5 h-4 w-4" />
              Agregar otro medicamento
            </Button>

            <div className="space-y-1.5">
              <Label>Indicaciones generales <span className="text-slate-400">(opcional)</span></Label>
              <Textarea
                placeholder="Ej: Reposo relativo, abundantes líquidos..."
                rows={2}
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Guardando...' : 'Crear Receta'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
