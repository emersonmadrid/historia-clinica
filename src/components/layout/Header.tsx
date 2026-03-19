'use client'

import { Bell, Menu, ChevronRight, Search } from 'lucide-react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { getInitials } from '@/lib/utils'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface HeaderProps {
  user: { name: string; email: string; role: string }
  onMenuToggle?: () => void
}

interface Crumb { label: string; href?: string }

function getBreadcrumbs(pathname: string): Crumb[] {
  if (pathname === '/') return [{ label: 'Inicio' }]
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
  if (pathname === '/derivaciones') return [{ label: 'Derivaciones' }]
  return [{ label: 'Historia Clínica' }]
}

export function Header({ user, onMenuToggle }: HeaderProps) {
  const pathname = usePathname()
  const crumbs = getBreadcrumbs(pathname)
  const today = format(new Date(), "EEEE d 'de' MMMM", { locale: es })
  const todayCapitalized = today.charAt(0).toUpperCase() + today.slice(1)

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--surface)]">
      <div className="mx-auto flex min-h-[60px] w-full items-center gap-4 px-4 sm:px-6">

        {/* Mobile hamburger */}
        <button
          className="flex h-9 w-9 items-center justify-center rounded-md text-[var(--foreground-subtle)] hover:bg-[var(--surface-alt)] transition-colors lg:hidden"
          onClick={onMenuToggle}
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Breadcrumb */}
        <div className="min-w-0 flex-1 flex items-center gap-1.5 text-sm">
          {crumbs.map((crumb, i) => (
            <span key={i} className="flex min-w-0 items-center gap-1.5">
              {i > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[var(--border-interactive)]" />}
              {crumb.href ? (
                <Link href={crumb.href} className="truncate text-[var(--foreground-muted)] hover:text-[var(--primary)] transition-colors font-medium">
                  {crumb.label}
                </Link>
              ) : (
                <span className="truncate font-semibold text-[var(--foreground)]">{crumb.label}</span>
              )}
            </span>
          ))}
          <span className="hidden text-xs text-[var(--foreground-subtle)] sm:inline ml-3">{todayCapitalized}</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            className="hidden sm:flex items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-1.5 text-sm text-[var(--foreground-subtle)] hover:border-[var(--primary)] hover:bg-[var(--primary-subtle)] hover:text-[var(--primary)] transition-all"
            onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }))}
          >
            <Search className="h-4 w-4" />
            <span className="hidden md:inline text-xs">Buscar...</span>
            <kbd className="hidden lg:inline ml-1 rounded border border-[var(--border)] bg-[var(--surface)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--foreground-subtle)]">⌘K</kbd>
          </button>

          <button className="flex h-9 w-9 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground-subtle)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-all">
            <Bell className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-2.5 border-l border-[var(--border)] pl-3 ml-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[var(--avatar-bg)] text-xs font-bold text-white">
              {getInitials(user.name)}
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-semibold leading-tight text-[var(--foreground)]">{user.name}</p>
            </div>
          </div>
        </div>

      </div>
    </header>
  )
}
