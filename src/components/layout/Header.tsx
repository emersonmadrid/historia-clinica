'use client'

import { Bell, Menu, ChevronRight, Search, Clock3 } from 'lucide-react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { getInitials } from '@/lib/utils'

interface HeaderProps {
  user: { name: string; email: string; role: string }
  onMenuToggle?: () => void
}

interface Crumb { label: string; href?: string }

function getBreadcrumbs(pathname: string): Crumb[] {
  if (pathname === '/') return [{ label: 'Dashboard' }]
  if (pathname === '/pacientes') return [{ label: 'Pacientes' }]
  if (pathname === '/pacientes/nuevo') return [{ label: 'Pacientes', href: '/pacientes' }, { label: 'Nuevo Paciente' }]
  if (pathname.includes('/historia/nueva-consulta')) return [{ label: 'Pacientes', href: '/pacientes' }, { label: 'Perfil', href: pathname.split('/historia')[0] }, { label: 'Nueva Consulta' }]
  if (pathname.includes('/historia') && pathname.includes('/editar')) return [{ label: 'Pacientes', href: '/pacientes' }, { label: 'Perfil', href: pathname.split('/historia')[0] }, { label: 'Editar Consulta' }]
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
  const now = new Date()
  const hour = now.getHours()
  const modeLabel = hour < 12 ? 'Turno de mañana' : hour < 18 ? 'Turno de tarde' : 'Turno de noche'

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-[rgba(255,255,255,0.94)] backdrop-blur">
      <div className="mx-auto flex h-15 w-full max-w-[1480px] items-center gap-3 px-4 sm:px-5 lg:px-6">
      <button
        className="flex h-9 w-9 items-center justify-center rounded-sm lg:hidden text-foreground-muted hover:bg-border-subtle transition-colors"
        onClick={onMenuToggle}
      >
        <Menu className="h-4 w-4" />
      </button>

      <div className="min-w-0 flex-1">
        <div className="mb-1 flex min-w-0 items-center gap-1 text-[12px]">
          {crumbs.map((crumb, i) => (
            <span key={i} className="flex min-w-0 items-center gap-1">
              {i > 0 && <ChevronRight className="h-3 w-3 shrink-0 text-foreground-subtle" />}
              {crumb.href ? (
                <Link href={crumb.href} className="truncate text-foreground-muted hover:text-foreground transition-colors">
                  {crumb.label}
                </Link>
              ) : (
                <span className="truncate font-medium text-foreground">{crumb.label}</span>
              )}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-2 text-[11px] text-foreground-muted">
          <span className="hidden items-center gap-1 sm:inline-flex">
            <Clock3 className="h-3 w-3" />
            {modeLabel}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          className="hidden sm:flex items-center gap-2 rounded-sm border border-border bg-surface px-3 py-2 text-[12px] text-foreground-muted hover:text-foreground hover:bg-border-subtle transition-colors"
          onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }))}
        >
          <Search className="h-3 w-3" />
          <span>Buscar paciente, cita o acción</span>
          <span className="hidden lg:inline rounded-sm border border-border bg-background px-1.5 py-0.5 font-mono text-[10px]">⌘K</span>
        </button>
        <button className="flex h-9 w-9 items-center justify-center rounded-sm border border-border bg-surface text-foreground-muted hover:bg-border-subtle transition-colors">
          <Bell className="h-4 w-4" />
        </button>
        <div className="ml-1 flex items-center gap-2 border-l border-border pl-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-slate-700 text-[11px] font-semibold text-white">
            {getInitials(user.name)}
          </div>
          <div className="hidden md:block">
            <p className="text-[13px] font-semibold text-foreground">{user.name}</p>
            <p className="text-[11px] text-foreground-subtle">{user.role}</p>
          </div>
        </div>
      </div>
      </div>
    </header>
  )
}
