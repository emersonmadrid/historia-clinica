'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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

export function QuickAddAllergyButton({ patientId }: { patientId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ allergen: '', reaction: '', severity: 'MILD', notes: '' })

  async function handleSubmit(e: React.FormEvent) {
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

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 hover:bg-slate-300 transition-colors"
        title="Agregar alergia"
      >
        <Plus className="h-3 w-3 text-slate-600" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar Alergia</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="qa-allergen">Alérgeno</Label>
              <Input
                id="qa-allergen"
                value={form.allergen}
                onChange={(e) => setForm({ ...form, allergen: e.target.value })}
                placeholder="Ej: Penicilina"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="qa-reaction">Reacción</Label>
              <Input
                id="qa-reaction"
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
              <Label htmlFor="qa-notes">Notas</Label>
              <Textarea
                id="qa-notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Observaciones adicionales..."
                rows={2}
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
