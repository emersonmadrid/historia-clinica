'use client'

import { useState } from 'react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from '@/hooks/useToast'
import { Plus, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface MedicalBackground {
  id: string
  type: string
  description: string
  date: string | null
  notes: string | null
}

interface BackgroundManagerProps {
  patientId: string
  backgrounds: MedicalBackground[]
}

const bgTypeOptions = [
  { value: 'PERSONAL', label: 'Personal' },
  { value: 'FAMILY', label: 'Familiar' },
  { value: 'SURGICAL', label: 'Quirúrgico' },
  { value: 'PHARMACOLOGICAL', label: 'Farmacológico' },
  { value: 'OBSTETRIC', label: 'Obstétrico' },
]

function bgTypeLabel(type: string) {
  return bgTypeOptions.find((t) => t.value === type)?.label || type
}

function formatDate(date: string | null) {
  if (!date) return null
  return new Date(date).toLocaleDateString('es', { year: 'numeric', month: 'short', day: 'numeric' })
}

export function BackgroundManager({ patientId, backgrounds }: BackgroundManagerProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [form, setForm] = useState({
    type: 'PERSONAL',
    description: '',
    date: '',
    notes: '',
  })

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch(`/api/pacientes/${patientId}/antecedentes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        toast({ title: 'Antecedente agregado' })
        setOpen(false)
        setForm({ type: 'PERSONAL', description: '', date: '', notes: '' })
        router.refresh()
      } else {
        const data = await res.json()
        toast({ title: data.error || 'Error al agregar', variant: 'error' })
      }
    } catch {
      toast({ title: 'Error al agregar antecedente', variant: 'error' })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(bgId: string) {
    if (!confirm('¿Eliminar este antecedente?')) return
    setDeleting(bgId)
    try {
      const res = await fetch(`/api/pacientes/${patientId}/antecedentes/${bgId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        toast({ title: 'Antecedente eliminado' })
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

  // Group by type
  const grouped = bgTypeOptions
    .map((opt) => ({
      type: opt.value,
      label: opt.label,
      items: backgrounds.filter((bg) => bg.type === opt.value),
    }))
    .filter((group) => group.items.length > 0)

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-slate-900">Antecedentes Médicos</h3>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          Agregar Antecedente
        </Button>
      </div>

      {backgrounds.length === 0 ? (
        <p className="text-sm text-slate-400 py-4 text-center">No hay antecedentes registrados</p>
      ) : (
        <div className="space-y-6">
          {grouped.map((group) => (
            <div key={group.type}>
              <h4 className="text-sm font-semibold text-slate-700 mb-2">{group.label}</h4>
              <div className="space-y-2">
                {group.items.map((bg) => (
                  <div key={bg.id} className="flex items-start gap-3 rounded-lg border border-slate-100 p-3 bg-slate-50">
                    <div className="flex-1">
                      <p className="text-sm text-slate-900">{bg.description}</p>
                      {bg.date && (
                        <p className="text-xs text-slate-500 mt-1">{formatDate(bg.date)}</p>
                      )}
                      {bg.notes && (
                        <p className="text-xs text-slate-500 mt-1 italic">{bg.notes}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(bg.id)}
                      disabled={deleting === bg.id}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar Antecedente</DialogTitle>
            <DialogDescription>Registra un nuevo antecedente médico</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {bgTypeOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bg-description">Descripción</Label>
              <Textarea
                id="bg-description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Descripción del antecedente..."
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bg-date">Fecha (opcional)</Label>
              <Input
                id="bg-date"
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bg-notes">Notas</Label>
              <Textarea
                id="bg-notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Notas adicionales..."
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Agregar'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
