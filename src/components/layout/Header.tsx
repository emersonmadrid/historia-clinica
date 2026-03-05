'use client'

import { Bell, Menu } from 'lucide-react'
import { usePathname } from 'next/navigation'
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

function getPageTitle(pathname: string): string {
  if (pathname === '/') return 'Dashboard'
  if (pathname.startsWith('/pacientes/') && pathname.includes('/historia/nueva-consulta'))
    return 'Nueva Consulta'
  if (pathname.startsWith('/pacientes/') && pathname.includes('/historia'))
    return 'Historia Clínica'
  if (pathname === '/pacientes/nuevo') return 'Nuevo Paciente'
  if (pathname.startsWith('/pacientes/')) return 'Perfil del Paciente'
  if (pathname === '/pacientes') return 'Pacientes'
  if (pathname === '/citas/nueva') return 'Nueva Cita'
  if (pathname === '/citas') return 'Citas'
  return 'Historia Clínica'
}

export function Header({ user, onMenuToggle }: HeaderProps) {
  const pathname = usePathname()
  const title = getPageTitle(pathname)

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-slate-200 bg-white px-6">
      <button
        className="flex h-9 w-9 items-center justify-center rounded-md hover:bg-slate-100 lg:hidden"
        onClick={onMenuToggle}
      >
        <Menu className="h-5 w-5 text-slate-600" />
        <span className="sr-only">Abrir menú</span>
      </button>

      <div className="flex-1">
        <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        <button className="flex h-9 w-9 items-center justify-center rounded-md hover:bg-slate-100 relative">
          <Bell className="h-5 w-5 text-slate-600" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-blue-600" />
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
