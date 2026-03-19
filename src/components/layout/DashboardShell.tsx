'use client'

import { useState } from 'react'
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

  const handleToggle = () => {
    setCollapsed(c => !c)
  }

  return (
    <div className="flex min-h-screen w-full bg-[var(--background)] text-[var(--foreground)]">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      <CommandPalette />
      <Sidebar
        key={pathname}
        user={user}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={collapsed}
        onToggle={handleToggle}
      />
      <div className={`flex min-w-0 flex-1 flex-col transition-[padding-left] duration-400 cubic-bezier(0.16, 1, 0.3, 1) ${collapsed ? 'lg:pl-[56px]' : 'lg:pl-[220px]'}`}>
        <Header user={user} onMenuToggle={() => setSidebarOpen(o => !o)} />
        <main className="flex-1 px-6 pb-20 pt-10 sm:px-10 sm:pb-24 sm:pt-12 lg:px-14">
          <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
