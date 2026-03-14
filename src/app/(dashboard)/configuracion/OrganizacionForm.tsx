'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/hooks/useToast'
import { Save } from 'lucide-react'

interface OrganizacionFormProps {
  initialData: {
    id: string
    name: string
    ruc: string
    address: string
    phone: string
  } | null
}

export function OrganizacionForm({ initialData }: OrganizacionFormProps) {
  const [form, setForm] = useState({
    name: initialData?.name || '',
    ruc: initialData?.ruc || '',
    address: initialData?.address || '',
    phone: initialData?.phone || '',
  })
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/organizacion', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        toast({ title: 'Datos de la clínica actualizados' })
      } else {
        const data = await res.json()
        toast({ title: data.error || 'Error al guardar', variant: 'error' })
      }
    } catch {
      toast({ title: 'Error al guardar', variant: 'error' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="org-name">Nombre de la clínica</Label>
        <Input
          id="org-name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Ej: Clínica Feliz Horizonte"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="org-ruc">RUC</Label>
        <Input
          id="org-ruc"
          value={form.ruc}
          onChange={(e) => setForm({ ...form, ruc: e.target.value })}
          placeholder="Ej: 20123456789"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="org-address">Dirección</Label>
        <Input
          id="org-address"
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
          placeholder="Ej: Av. Principal 123, Lima"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="org-phone">Teléfono</Label>
        <Input
          id="org-phone"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          placeholder="Ej: 01-234-5678"
        />
      </div>
      <Button type="submit" disabled={saving}>
        <Save className="mr-1.5 h-4 w-4" />
        {saving ? 'Guardando...' : 'Guardar Cambios'}
      </Button>
    </form>
  )
}
