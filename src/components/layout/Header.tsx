'use client'

import { Bell, Menu, ChevronRight } from 'lucide-react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { getInitials } from '@/lib/utils'

interface HeaderProps {
  user: {
    name: string
    email: string
    role: string
  }
  onMenuToggle?: () => void
}

interface Crumb {
  label: string
  href?: string
}

function getBreadcrumbs(pathname: string): Crumb[] {
  if (pathname === '/') return [{ label: 'Dashboard' }]
  if (pathname === '/pacientes') return [{ label: 'Pacientes' }]
  if (pathname === '/pacientes/nuevo') return [{ label: 'Pacientes', href: '/pacientes' }, { label: 'Nuevo Paciente' }]
  if (pathname.includes('/historia/nueva-consulta')) return [{ label: 'Pacientes', href: '/pacientes' }, { label: 'Perfil', href: pathname.split('/historia')[0] }, { label: 'Nueva Consulta' }]
  if (pathname.includes('/historia')) return [{ label: 'Pacientes', href: '/pacientes' }, { label: 'Perfil', href: pathname.split('/historia')[0] }, { label: 'Historia Clínica' }]
  if (pathname.match(/^\/pacientes\/[^/]+\/editar$/)) return [{ label: 'Pacientes', href: '/pacientes' }, { label: 'Perfil', href: pathname.replace('/editar', '') }, { label: 'Editar' }]
  if (pathname.match(/^\/pacientes\/[^/]+$/)) return [{ label: 'Pacientes', href: '/pacientes' }, { label: 'Perfil del Paciente' }]
  if (pathname === '/citas') return [{ label: 'Citas' }]
  if (pathname === '/citas/nueva') return [{ label: 'Citas', href: '/citas' }, { label: 'Nueva Cita' }]
  if (pathname === '/reportes') return [{ label: 'Reportes' }]
  if (pathname === '/configuracion') return [{ label: 'Configuración' }]
  if (pathname === '/configuracion/usuarios') return [{ label: 'Configuración', href: '/configuracion' }, { label: 'Usuarios' }]
  return [{ label: 'Historia Clínica' }]
}

export function Header({ user, onMenuToggle }: HeaderProps) {
  const pathname = usePathname()
  const crumbs = getBreadcrumbs(pathname)

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-slate-200 bg-white px-6">
      <button
        className="flex h-9 w-9 items-center justify-center rounded-md hover:bg-slate-100 lg:hidden"
        onClick={onMenuToggle}
      >
        <Menu className="h-5 w-5 text-slate-600" />
        <span className="sr-only">Abrir menú</span>
      </button>

      <div className="flex-1 flex items-center gap-1.5 min-w-0">
        {crumbs.map((crumb, i) => (
          <span key={i} className="flex items-center gap-1.5 min-w-0">
            {i > 0 && <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />}
            {crumb.href ? (
              <Link href={crumb.href} className="text-sm text-slate-500 hover:text-slate-700 truncate">
                {crumb.label}
              </Link>
            ) : (
              <span className="text-sm font-semibold text-slate-900 truncate">{crumb.label}</span>
            )}
          </span>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <button className="flex h-9 w-9 items-center justify-center rounded-md hover:bg-slate-100 relative" title="Notificaciones">
          <Bell className="h-5 w-5 text-slate-400" />
          <span className="sr-only">Notificaciones</span>
        </button>

        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-blue-600 text-white text-xs">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <span className="hidden text-sm font-medium text-slate-700 md:block">{user.name}</span>
        </div>
      </div>
    </header>
  )
}
