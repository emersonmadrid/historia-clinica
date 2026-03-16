'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { CommandPalette } from '@/components/layout/CommandPalette'

interface Props {
  user: { name: string; email: string; role: string }
  children: React.ReactNode
}

export function DashboardShell({ user, children }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()

  useEffect(() => { setSidebarOpen(false) }, [pathname])

  useEffect(() => {
    if (localStorage.getItem('sidebar-collapsed') === 'true') setCollapsed(true)
  }, [])

  const handleToggle = () => {
    setCollapsed(c => {
      const next = !c
      localStorage.setItem('sidebar-collapsed', String(next))
      return next
    })
  }

  return (
    <div className="flex min-h-screen w-full" style={{ backgroundColor: 'var(--background)' }}>
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      <CommandPalette />
      <Sidebar
        user={user}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={collapsed}
        onToggle={handleToggle}
      />
      <div
        className={`flex min-w-0 flex-1 flex-col transition-[padding-left] duration-200 ease-in-out ${collapsed ? 'lg:pl-16' : 'lg:pl-[220px]'}`}
      >
        <Header user={user} onMenuToggle={() => setSidebarOpen(o => !o)} />
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  )
}
