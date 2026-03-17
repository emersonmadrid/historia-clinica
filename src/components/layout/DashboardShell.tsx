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
    setCollapsed(c => {
      const next = !c
      return next
    })
  }

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />
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
      <div className={`flex min-w-0 flex-1 flex-col transition-[padding-left] duration-200 ease-in-out ${collapsed ? 'lg:pl-[60px]' : 'lg:pl-[244px]'}`}>
        <Header user={user} onMenuToggle={() => setSidebarOpen(o => !o)} />
        <main className="flex-1 px-4 pb-8 pt-4 sm:px-5 sm:pb-10 sm:pt-5 lg:px-6">
          <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-5">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
