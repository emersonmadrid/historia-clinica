'use client'

import { Bell, Menu, ChevronRight, Search } from 'lucide-react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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
    <header
      className="sticky top-0 z-40 flex h-14 items-center gap-4 px-4 sm:px-6"
      style={{
        backgroundColor: 'var(--background)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      {/* Mobile menu */}
      <button
        className="flex h-8 w-8 items-center justify-center rounded-md lg:hidden transition-colors hover:bg-black/5"
        style={{ color: 'var(--foreground-muted)' }}
        onClick={onMenuToggle}
      >
        <Menu className="h-4 w-4" />
      </button>

      {/* Breadcrumbs */}
      <div className="flex flex-1 items-center gap-1.5 min-w-0">
        {crumbs.map((crumb, i) => (
          <span key={i} className="flex items-center gap-1.5 min-w-0">
            {i > 0 && <ChevronRight className="h-3 w-3 shrink-0" style={{ color: 'var(--border)' }} />}
            {crumb.href ? (
              <Link
                href={crumb.href}
                className="text-sm truncate transition-colors"
                style={{ color: 'var(--foreground-muted)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--foreground)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--foreground-muted)')}
              >
                {crumb.label}
              </Link>
            ) : (
              <span className="text-sm font-semibold truncate" style={{ color: 'var(--foreground)' }}>
                {crumb.label}
              </span>
            )}
          </span>
        ))}
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-1.5">
        {/* Search trigger */}
        <button
          className="hidden sm:flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs transition-colors"
          style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            color: 'var(--foreground-muted)',
          }}
          onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }))}
        >
          <Search className="h-3.5 w-3.5" />
          <span>Buscar...</span>
          <span
            className="ml-2 hidden lg:inline font-mono text-[10px] px-1 py-0.5 rounded"
            style={{ backgroundColor: 'var(--border-subtle)', border: '1px solid var(--border)', color: 'var(--foreground-subtle)' }}
          >
            ⌘K
          </span>
        </button>

        {/* Bell */}
        <button
          className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
          style={{ color: 'var(--foreground-muted)' }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--surface)')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = '')}
        >
          <Bell className="h-4 w-4" />
        </button>

        {/* User */}
        <div
          className="flex items-center gap-2 pl-2"
          style={{ borderLeft: '1px solid var(--border)' }}
        >
          <Avatar className="h-7 w-7">
            <AvatarFallback
              className="text-[10px] font-bold text-white"
              style={{ backgroundColor: 'var(--primary)' }}
            >
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <span className="hidden text-sm font-medium md:block" style={{ color: 'var(--foreground)' }}>
            {user.name}
          </span>
        </div>
      </div>
    </header>
  )
}
