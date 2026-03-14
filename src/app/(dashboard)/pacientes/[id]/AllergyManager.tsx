'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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

interface Allergy {
  id: string
  allergen: string
  reaction: string | null
  severity: string
  notes: string | null
}

interface AllergyManagerProps {
  patientId: string
  allergies: Allergy[]
}

function severityVariant(severity: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (severity === 'SEVERE') return 'destructive'
  if (severity === 'MODERATE') return 'secondary'
  return 'outline'
}

function severityLabel(severity: string) {
  const map: Record<string, string> = { MILD: 'Leve', MODERATE: 'Moderado', SEVERE: 'Grave' }
  return map[severity] || severity
}

export function AllergyManager({ patientId, allergies }: AllergyManagerProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [form, setForm] = useState({
    allergen: '',
    reaction: '',
    severity: 'MILD',
    notes: '',
  })

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch(`/api/pacientes/${patientId}/alergias`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        toast({ title: 'Alergia agregada' })
        setOpen(false)
        setForm({ allergen: '', reaction: '', severity: 'MILD', notes: '' })
        router.refresh()
      } else {
        const data = await res.json()
        toast({ title: data.error || 'Error al agregar alergia', variant: 'error' })
      }
    } catch {
      toast({ title: 'Error al agregar alergia', variant: 'error' })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(allergyId: string) {
    if (!confirm('¿Eliminar esta alergia?')) return
    setDeleting(allergyId)
    try {
      const res = await fetch(`/api/pacientes/${patientId}/alergias/${allergyId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        toast({ title: 'Alergia eliminada' })
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
    <>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-slate-900">Alergias Registradas</h3>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          Agregar Alergia
        </Button>
      </div>

      {allergies.length === 0 ? (
        <p className="text-sm text-slate-400 py-4 text-center">No hay alergias registradas</p>
      ) : (
        <div className="space-y-3">
          {allergies.map((allergy) => (
            <div key={allergy.id} className="flex items-start gap-3 rounded-lg border border-slate-100 p-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-slate-900 text-sm">{allergy.allergen}</span>
                  <Badge variant={severityVariant(allergy.severity)}>
                    {severityLabel(allergy.severity)}
                  </Badge>
                </div>
                {allergy.reaction && (
                  <p className="text-sm text-slate-600">Reacción: {allergy.reaction}</p>
                )}
                {allergy.notes && (
                  <p className="text-xs text-slate-500 mt-1">{allergy.notes}</p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(allergy.id)}
                disabled={deleting === allergy.id}
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar Alergia</DialogTitle>
            <DialogDescription>Registra una nueva alergia del paciente</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="allergen">Alérgeno</Label>
              <Input
                id="allergen"
                value={form.allergen}
                onChange={(e) => setForm({ ...form, allergen: e.target.value })}
                placeholder="Ej: Penicilina"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reaction">Reacción</Label>
              <Input
                id="reaction"
                value={form.reaction}
                onChange={(e) => setForm({ ...form, reaction: e.target.value })}
                placeholder="Ej: Urticaria, dificultad respiratoria"
              />
            </div>
            <div className="space-y-2">
              <Label>Severidad</Label>
              <Select value={form.severity} onValueChange={(v) => setForm({ ...form, severity: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MILD">Leve</SelectItem>
                  <SelectItem value="MODERATE">Moderado</SelectItem>
                  <SelectItem value="SEVERE">Grave</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="allergy-notes">Notas</Label>
              <Textarea
                id="allergy-notes"
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
