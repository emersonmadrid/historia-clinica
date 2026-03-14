'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { Plus, Pencil, Users, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Breadcrumb } from '@/components/ui/breadcrumb'

interface User {
  id: string
  name: string
  email: string
  role: string
  speciality: string | null
  active: boolean
  createdAt: string
}

const roleOptions = [
  { value: 'ADMIN', label: 'Administrador' },
  { value: 'DOCTOR', label: 'Doctor/a' },
  { value: 'NURSE', label: 'Enfermero/a' },
  { value: 'RECEPTIONIST', label: 'Recepcionista' },
]

function roleBadgeVariant(role: string): 'default' | 'secondary' | 'outline' | 'success' | 'warning' {
  if (role === 'ADMIN') return 'default'
  if (role === 'DOCTOR') return 'success'
  if (role === 'NURSE') return 'warning'
  return 'secondary'
}

function roleLabel(role: string) {
  return roleOptions.find((r) => r.value === role)?.label || role
}

export default function UsuariosPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [saving, setSaving] = useState(false)

  // Create form state
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'DOCTOR',
    speciality: '',
  })

  // Edit form state
  const [editForm, setEditForm] = useState({
    name: '',
    role: 'DOCTOR',
    speciality: '',
    active: true,
  })

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/users?all=true')
      if (res.ok) {
        const data = await res.json()
        setUsers(data)
      }
    } catch {
      toast({ title: 'Error al cargar usuarios', variant: 'error' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      })
      if (res.ok) {
        toast({ title: 'Usuario creado correctamente' })
        setCreateOpen(false)
        setCreateForm({ name: '', email: '', password: '', role: 'DOCTOR', speciality: '' })
        fetchUsers()
      } else {
        const data = await res.json()
        toast({ title: data.error || 'Error al crear usuario', variant: 'error' })
      }
    } catch {
      toast({ title: 'Error al crear usuario', variant: 'error' })
    } finally {
      setSaving(false)
    }
  }

  function openEdit(user: User) {
    setEditingUser(user)
    setEditForm({
      name: user.name,
      role: user.role,
      speciality: user.speciality || '',
      active: user.active,
    })
    setEditOpen(true)
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editingUser) return
    setSaving(true)
    try {
      const res = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      })
      if (res.ok) {
        toast({ title: 'Usuario actualizado correctamente' })
        setEditOpen(false)
        setEditingUser(null)
        fetchUsers()
      } else {
        const data = await res.json()
        toast({ title: data.error || 'Error al actualizar usuario', variant: 'error' })
      }
    } catch {
      toast({ title: 'Error al actualizar usuario', variant: 'error' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <Breadcrumb items={[
        { label: 'Configuración', href: '/configuracion' },
        { label: 'Usuarios' },
      ]} />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/configuracion">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Gestión de Usuarios</h2>
            <p className="text-sm text-slate-500">Administra los usuarios del sistema</p>
          </div>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          Nuevo Usuario
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            Usuarios ({users.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <p className="text-sm text-slate-400 py-8 text-center">Cargando...</p>
          ) : users.length === 0 ? (
            <p className="text-sm text-slate-400 py-8 text-center">No hay usuarios registrados</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {users.map((user) => (
                <div key={user.id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-sm font-bold">
                    {user.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900">{user.name}</p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                  </div>
                  <Badge variant={roleBadgeVariant(user.role)}>
                    {roleLabel(user.role)}
                  </Badge>
                  {user.speciality && (
                    <span className="text-xs text-slate-500 hidden sm:inline">{user.speciality}</span>
                  )}
                  <Badge variant={user.active ? 'success' : 'outline'}>
                    {user.active ? 'Activo' : 'Inactivo'}
                  </Badge>
                  <Button variant="ghost" size="icon" onClick={() => openEdit(user)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo Usuario</DialogTitle>
            <DialogDescription>Completa los datos para crear un nuevo usuario</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="create-name">Nombre completo</Label>
              <Input
                id="create-name"
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-email">Email</Label>
              <Input
                id="create-email"
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-password">Contraseña</Label>
              <Input
                id="create-password"
                type="password"
                value={createForm.password}
                onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                required
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label>Rol</Label>
              <Select value={createForm.role} onValueChange={(v) => setCreateForm({ ...createForm, role: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-speciality">Especialidad (opcional)</Label>
              <Input
                id="create-speciality"
                value={createForm.speciality}
                onChange={(e) => setCreateForm({ ...createForm, speciality: e.target.value })}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={saving}>{saving ? 'Creando...' : 'Crear Usuario'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
            <DialogDescription>Modifica los datos del usuario</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nombre completo</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Rol</Label>
              <Select value={editForm.role} onValueChange={(v) => setEditForm({ ...editForm, role: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-speciality">Especialidad</Label>
              <Input
                id="edit-speciality"
                value={editForm.speciality}
                onChange={(e) => setEditForm({ ...editForm, speciality: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-3">
              <Label htmlFor="edit-active">Estado</Label>
              <button
                type="button"
                id="edit-active"
                role="switch"
                aria-checked={editForm.active}
                onClick={() => setEditForm({ ...editForm, active: !editForm.active })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${editForm.active ? 'bg-blue-600' : 'bg-slate-200'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${editForm.active ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
              <span className="text-sm text-slate-600">{editForm.active ? 'Activo' : 'Inactivo'}</span>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Guardar Cambios'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
