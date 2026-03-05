import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { Toaster } from '@/components/ui/toaster'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const user = {
    name: session.user.name ?? 'Usuario',
    email: session.user.email ?? '',
    role: (session.user as any).role ?? 'DOCTOR',
  }

  return (
    <>
      <DashboardShell user={user}>{children}</DashboardShell>
      <Toaster />
    </>
  )
}
