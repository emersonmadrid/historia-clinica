'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { useState } from 'react'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import {
  LayoutDashboard, Users, Calendar,
  LogOut, Stethoscope, Settings, BarChart2,
  PanelLeftClose, PanelLeftOpen, Share2,
} from 'lucide-react'
import { cn, getInitials, roleLabel } from '@/lib/utils'
import { ReferralBadge } from '@/components/shared/ReferralBadge'

interface SidebarProps {
  user: { name: string; email: string; role: string }
  open?: boolean
  onClose?: () => void
  collapsed?: boolean
  onToggle?: () => void
}

const navItems = [
  { href: '/',               label: 'Inicio',         icon: LayoutDashboard },
  { href: '/citas',          label: 'Citas',          icon: Calendar },
  { href: '/pacientes',      label: 'Pacientes',      icon: Users },
  { href: '/derivaciones',   label: 'Derivaciones',   icon: Share2, badge: true },
  { href: '/reportes',       label: 'Reportes',       icon: BarChart2 },
  { href: '/configuracion',  label: 'Configuración',  icon: Settings },
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
            className="z-[100] rounded-md px-2.5 py-1.5 text-xs font-semibold text-white bg-[var(--foreground)] shadow-lg"
          >
            {label}
            <TooltipPrimitive.Arrow className="fill-[var(--foreground)]" />
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
    <div className="flex h-full flex-col bg-[var(--sidebar-bg)] border-r border-[var(--sidebar-border)]">

      {/* Logo */}
      <div className={cn(
        'flex h-16 shrink-0 items-center border-b border-[var(--sidebar-border)]',
        collapsed ? 'justify-center px-3' : 'gap-3 px-5'
      )}>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--sidebar-accent)]">
          <Stethoscope className="h-4 w-4 text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="font-heading text-[15px] font-bold text-[var(--sidebar-fg)]">Historia Clínica</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className={cn(
        'flex flex-1 flex-col gap-0.5 overflow-y-auto overflow-x-hidden py-4',
        collapsed ? 'px-2' : 'px-3'
      )}>
        {navItems.map((item) => {
          const active = isActive(item.href)
          const Icon = item.icon
          return (
            <Tip key={item.href} label={item.label} disabled={!collapsed}>
              <Link
                href={item.href}
                onClick={onClose}
                className={cn(
                  'group relative flex items-center gap-3 rounded-md text-sm font-medium transition-all',
                  collapsed ? 'h-10 w-10 justify-center' : 'h-9 px-3',
                  active
                    ? 'bg-[var(--sidebar-active-bg)] text-[var(--sidebar-accent)]'
                    : 'text-[var(--sidebar-fg-muted)] hover:bg-[var(--sidebar-hover-bg)] hover:text-[var(--sidebar-fg)]'
                )}
              >
                {active && !collapsed && (
                  <div className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r bg-[var(--sidebar-accent)]" />
                )}
                <Icon className={cn('h-4 w-4 shrink-0', active ? 'text-[var(--sidebar-accent)]' : 'text-[var(--foreground-subtle)] group-hover:text-[var(--sidebar-fg-muted)]')} />
                {!collapsed && <span className="flex-1">{item.label}</span>}
                {!collapsed && item.badge && <ReferralBadge />}
              </Link>
            </Tip>
          )
        })}
      </nav>

      {/* Footer */}
      <div className={cn(
        'shrink-0 border-t border-[var(--sidebar-border)]',
        collapsed ? 'px-2 py-3 flex flex-col items-center gap-2' : 'px-3 py-3 space-y-1'
      )}>
        {onToggle && (
          <Tip label={collapsed ? 'Expandir' : 'Colapsar'} disabled={false}>
            <button
              onClick={onToggle}
              className={cn(
                'flex items-center gap-2 text-xs font-medium text-[var(--sidebar-fg-muted)] hover:bg-[var(--sidebar-hover-bg)] hover:text-[var(--sidebar-fg)] transition-colors rounded-md',
                collapsed ? 'h-9 w-9 justify-center' : 'h-9 w-full px-3'
              )}
            >
              {collapsed
                ? <PanelLeftOpen className="h-4 w-4 shrink-0" />
                : <><PanelLeftClose className="h-4 w-4 shrink-0" /><span>Colapsar</span></>
              }
            </button>
          </Tip>
        )}

        {collapsed ? (
          <Tip label={`${user.name} · ${roleLabel(user.role)}`}>
            <div className="flex h-9 w-9 cursor-default items-center justify-center rounded-md bg-[var(--avatar-bg)] text-xs font-bold text-white">
              {getInitials(user.name)}
            </div>
          </Tip>
        ) : (
          <div className="flex items-center gap-2.5 rounded-md px-2 py-2 hover:bg-[var(--sidebar-hover-bg)] transition-colors">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[var(--avatar-bg)] text-xs font-bold text-white">
              {getInitials(user.name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-[13px] font-semibold text-[var(--sidebar-fg)]">{user.name}</p>
              <p className="truncate text-[11px] text-[var(--sidebar-fg-muted)]">{roleLabel(user.role)}</p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md hover:bg-red-50 group transition-all"
              title="Cerrar sesión"
            >
              <LogOut className="h-3.5 w-3.5 text-[var(--sidebar-fg-muted)] group-hover:text-[var(--danger)] transition-colors" />
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
          'hidden lg:flex fixed inset-y-0 left-0 z-50 flex-col transition-[width] duration-300 ease-in-out',
          isExpanded ? 'w-[220px]' : 'w-[56px]',
        )}
        onMouseEnter={() => collapsed && setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <NavContent collapsed={!isExpanded} pathname={pathname} onToggle={onToggle} user={user} />
      </aside>

      {/* Mobile */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-[220px] flex flex-col transition-transform duration-300 ease-in-out lg:hidden',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <NavContent collapsed={false} pathname={pathname} user={user} onClose={onClose} />
      </aside>
    </>
  )
}
