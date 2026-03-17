'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { useState } from 'react'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import {
  LayoutDashboard, Users, Calendar,
  LogOut, Stethoscope, Settings, BarChart2,
  PanelLeftClose, PanelLeftOpen,
} from 'lucide-react'
import { cn, getInitials, roleLabel } from '@/lib/utils'

interface SidebarProps {
  user: { name: string; email: string; role: string }
  open?: boolean
  onClose?: () => void
  collapsed?: boolean
  onToggle?: () => void
}

const navItems = [
  { href: '/',              label: 'Centro Clínico', icon: LayoutDashboard },
  { href: '/citas',         label: 'Agenda',         icon: Calendar },
  { href: '/pacientes',     label: 'Pacientes',      icon: Users },
  { href: '/reportes',      label: 'Reportes',       icon: BarChart2 },
  { href: '/configuracion', label: 'Configuración',  icon: Settings },
]

function Tip({ label, children, disabled }: { label: string; children: React.ReactNode; disabled?: boolean }) {
  if (disabled) return <>{children}</>
  return (
    <TooltipPrimitive.Provider delayDuration={300}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side="right"
            sideOffset={8}
            className="z-[100] rounded-md px-2.5 py-1 text-xs font-medium text-white bg-slate-900 shadow-lg"
          >
            {label}
            <TooltipPrimitive.Arrow className="fill-slate-900" />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  )
}

function NavContent({
  collapsed,
  pathname,
  onToggle,
  user,
  onClose,
}: {
  collapsed: boolean
  pathname: string
  onToggle?: () => void
  user: SidebarProps['user']
  onClose?: () => void
}) {
  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  return (
    <div className="flex h-full flex-col">
      <div className={cn(
        'flex h-16 shrink-0 items-center border-b border-border px-3',
        collapsed ? 'justify-center px-0' : 'gap-2.5 px-4'
      )}>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-primary">
          <Stethoscope className="h-5 w-5 text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-semibold leading-none text-foreground">Historia Clínica</p>
            <p className="mt-1 text-[11px] text-foreground-subtle">Registro clínico</p>
          </div>
        )}
      </div>

      <nav className={cn(
        'flex flex-1 flex-col gap-1 overflow-y-auto overflow-x-hidden py-4',
        collapsed ? 'px-2' : 'px-2'
      )}>
        {!collapsed && (
          <div className="mb-2 px-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground-subtle">
              Operación diaria
            </p>
          </div>
        )}
        {navItems.map((item) => {
          const active = isActive(item.href)
          const Icon = item.icon
          return (
            <Tip key={item.href} label={item.label} disabled={!collapsed}>
              <Link
                href={item.href}
                onClick={onClose}
                className={cn(
                  'group relative flex items-center gap-3 rounded-sm text-[13px] font-medium transition-all duration-100',
                  collapsed ? 'h-10 w-10 justify-center' : 'min-h-11 px-3.5',
                  active
                    ? 'bg-slate-800 text-white'
                    : 'text-foreground-muted hover:bg-border-subtle hover:text-foreground'
                )}
              >
                {active && !collapsed && (
                  <span className="absolute left-0 top-0 h-full w-[2px] bg-primary" />
                )}
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && item.label}
              </Link>
            </Tip>
          )
        })}
      </nav>

      <div className={cn(
        'shrink-0 border-t border-border py-4',
        collapsed ? 'px-2 flex flex-col items-center gap-2' : 'px-2 space-y-1'
      )}>
        {onToggle && (
          <Tip label={collapsed ? 'Expandir' : 'Colapsar'} disabled={false}>
            <button
              onClick={onToggle}
              className={cn(
                'flex items-center gap-2 rounded-md text-[12px] text-foreground-subtle hover:text-foreground hover:bg-border-subtle transition-colors',
                collapsed ? 'h-10 w-10 justify-center rounded-sm' : 'h-10 w-full rounded-sm px-3'
              )}
            >
              {collapsed
                ? <PanelLeftOpen className="h-4 w-4 shrink-0" />
                : <><PanelLeftClose className="h-4 w-4 shrink-0" /><span>Contraer</span></>
              }
            </button>
          </Tip>
        )}

        {/* User */}
        {collapsed ? (
          <Tip label={`${user.name} · ${roleLabel(user.role)}`}>
            <div className="flex h-10 w-10 cursor-default items-center justify-center rounded-sm bg-slate-700 text-[11px] font-semibold text-white">
              {getInitials(user.name)}
            </div>
          </Tip>
        ) : (
          <div className="flex items-center gap-3 rounded-sm border border-border bg-surface-alt px-3 py-3 transition-colors">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-slate-700 text-[11px] font-semibold text-white">
              {getInitials(user.name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-[12px] font-semibold leading-tight text-foreground">{user.name}</p>
              <p className="truncate text-[10px] uppercase tracking-wide text-foreground-subtle">{roleLabel(user.role)}</p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm hover:bg-red-100 transition-colors"
              title="Cerrar sesión"
            >
              <LogOut className="h-3 w-3 text-foreground-subtle hover:text-red-600" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export function Sidebar({ user, open = false, onClose, collapsed = false, onToggle }: SidebarProps) {
  const [hovered, setHovered] = useState(false)
  const pathname = usePathname()
  const isExpanded = !collapsed || hovered

  return (
    <>
      {/* Desktop */}
      <aside
        className={cn(
          'hidden lg:flex fixed inset-y-0 left-0 z-50 bg-surface border-r border-border flex-col transition-[width] duration-200 ease-in-out',
          isExpanded ? 'w-[244px]' : 'w-[60px]',
          collapsed && hovered && 'shadow-md'
        )}
        onMouseEnter={() => collapsed && setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <NavContent collapsed={!isExpanded} pathname={pathname} onToggle={onToggle} user={user} />
      </aside>

      {/* Mobile */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-[244px] bg-surface border-r border-border flex flex-col transition-transform duration-200 lg:hidden',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <NavContent collapsed={false} pathname={pathname} user={user} onClose={onClose} />
      </aside>
    </>
  )
}
