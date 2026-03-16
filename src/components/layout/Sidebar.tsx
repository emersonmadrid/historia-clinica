'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { useState } from 'react'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import {
  LayoutDashboard, Users, Calendar,
  LogOut, Stethoscope, Settings, BarChart2,
  ChevronsLeft, ChevronsRight,
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
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/pacientes', label: 'Pacientes', icon: Users },
  { href: '/citas', label: 'Citas', icon: Calendar },
  { href: '/reportes', label: 'Reportes', icon: BarChart2 },
  { href: '/configuracion', label: 'Configuración', icon: Settings },
]

function Tip({ label, children, disabled }: { label: string; children: React.ReactNode; disabled?: boolean }) {
  if (disabled) return <>{children}</>
  return (
    <TooltipPrimitive.Provider delayDuration={250}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side="right"
            sideOffset={10}
            className="z-[100] rounded-lg px-3 py-1.5 text-xs font-medium text-white shadow-lg"
            style={{ backgroundColor: '#111827' }}
          >
            {label}
            <TooltipPrimitive.Arrow style={{ fill: '#111827' }} />
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

      {/* Logo */}
      <div className={cn('flex h-14 shrink-0 items-center', collapsed ? 'justify-center px-0' : 'gap-2.5 px-4')}>
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: 'var(--primary)' }}
        >
          <Stethoscope className="h-[18px] w-[18px] text-white" />
        </div>
        {!collapsed && (
          <span className="text-[15px] font-bold tracking-tight truncate" style={{ color: 'var(--foreground)' }}>
            HistoriaClínica
          </span>
        )}
      </div>

      {/* Nav items */}
      <nav className={cn('flex flex-1 flex-col gap-1 pt-4 pb-2 overflow-y-auto overflow-x-hidden', collapsed ? 'px-2' : 'px-3')}>
        {navItems.map((item) => {
          const active = isActive(item.href)
          const Icon = item.icon
          return (
            <Tip key={item.href} label={item.label} disabled={!collapsed}>
              <Link
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 rounded-xl text-[13.5px] font-medium transition-all duration-100',
                  collapsed ? 'h-10 w-10 justify-center' : 'px-3 py-2.5',
                  active
                    ? 'bg-sky-50 text-sky-600'
                    : 'text-gray-400 hover:bg-gray-50 hover:text-gray-700'
                )}
              >
                <Icon
                  className={cn('shrink-0', collapsed ? 'h-5 w-5' : 'h-[18px] w-[18px]')}
                  style={{ color: active ? 'var(--primary)' : undefined }}
                />
                {!collapsed && item.label}
              </Link>
            </Tip>
          )
        })}
      </nav>

      {/* Bottom: collapse + user */}
      <div className={cn('flex flex-col gap-2 pt-2 pb-3', collapsed ? 'px-2 items-center' : 'px-3')}>

        {/* Collapse toggle — solo desktop */}
        {onToggle && (
          <Tip label={collapsed ? 'Expandir' : ''} disabled={!collapsed}>
            <button
              onClick={onToggle}
              className={cn(
                'flex items-center gap-2 rounded-xl text-[12px] font-medium text-gray-300 hover:text-gray-500 hover:bg-gray-50 transition-colors',
                collapsed ? 'h-10 w-10 justify-center' : 'w-full px-3 py-2'
              )}
            >
              {collapsed
                ? <ChevronsRight className="h-4 w-4 shrink-0" />
                : <><ChevronsLeft className="h-4 w-4 shrink-0" /><span>Colapsar</span></>
              }
            </button>
          </Tip>
        )}

        {/* Divider */}
        <div className="h-px w-full" style={{ backgroundColor: 'var(--border)' }} />

        {/* User row */}
        {collapsed ? (
          <Tip label={`${user.name} · ${roleLabel(user.role)}`}>
            <div
              className="flex h-9 w-9 cursor-default items-center justify-center rounded-full text-[11px] font-bold text-white"
              style={{ backgroundColor: 'var(--primary)' }}
            >
              {getInitials(user.name)}
            </div>
          </Tip>
        ) : (
          <div className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 bg-gray-50">
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
              style={{ backgroundColor: 'var(--primary)' }}
            >
              {getInitials(user.name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold leading-tight truncate" style={{ color: 'var(--foreground)' }}>
                {user.name}
              </p>
              <p className="text-[11px] truncate mt-0.5" style={{ color: 'var(--foreground-subtle)' }}>
                {roleLabel(user.role)}
              </p>
            </div>
            <Tip label="Cerrar sesión">
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg hover:bg-red-50 transition-colors"
              >
                <LogOut className="h-3.5 w-3.5 text-gray-300 hover:text-red-400 transition-colors" />
              </button>
            </Tip>
          </div>
        )}
      </div>
    </div>
  )
}

export function Sidebar({ user, open = false, onClose, collapsed = false, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const [hovered, setHovered] = useState(false)

  // Hover-expand overlay cuando está colapsado
  const isExpanded = !collapsed || hovered

  return (
    <>
      {/* Desktop */}
      <aside
        className={cn(
          'hidden lg:flex fixed inset-y-0 left-0 z-50 bg-white transition-[width,box-shadow] duration-200 ease-in-out',
          isExpanded ? 'w-[220px]' : 'w-[64px]',
          collapsed && hovered ? 'shadow-xl' : ''
        )}
        style={{ borderRight: '1px solid var(--border)' }}
        onMouseEnter={() => collapsed && setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <NavContent
          collapsed={!isExpanded}
          pathname={pathname}
          onToggle={onToggle}
          user={user}
        />
      </aside>

      {/* Mobile drawer */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-[220px] bg-white transition-transform duration-200 lg:hidden',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
        style={{ borderRight: '1px solid var(--border)' }}
      >
        <NavContent collapsed={false} pathname={pathname} user={user} onClose={onClose} />
      </aside>
    </>
  )
}
