import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getActorContext } from '@/lib/authz'
import { GoogleCalendarButton } from './GoogleCalendarButton'
import { OrganizacionForm } from './OrganizacionForm'
import { Button } from '@/components/ui/button'
import { Settings, Users, Building2, ShieldCheck } from 'lucide-react'
import Link from 'next/link'

export default async function ConfiguracionPage({
  searchParams,
}: {
  searchParams: Promise<{ google?: string }>
}) {
  const session = await auth()
  const actor = await getActorContext(session)
  const params = await searchParams

  const user = await prisma.user.findUnique({
    where: { id: session!.user.id },
    select: { googleAccessToken: true, googleRefreshToken: true, role: true },
  })

  const isConnected = !!(user?.googleAccessToken && user?.googleRefreshToken)
  const isAdmin = user?.role === 'ADMIN'

  // Get organization data for admin
  let organization = null
  if (isAdmin) {
    organization = await prisma.organization.findUnique({
      where: { id: actor.organizationId },
    })
  }

  return (
    <div className="space-y-5">
      <section className="panel overflow-hidden px-5 py-6 sm:px-7">
        <p className="section-kicker">Ajustes institucionales</p>
        <h2 className="font-heading mt-1 text-3xl font-semibold text-foreground">Configuración</h2>
        <p className="mt-2 text-sm text-foreground-muted">Parámetros de integración, seguridad y administración operativa.</p>
      </section>

      <div className="panel overflow-hidden">
        <div className="flex items-center gap-2 border-b border-border bg-surface-alt/80 px-5 py-3.5">
          <Settings className="h-4 w-4 text-foreground-muted" />
          <p className="text-sm font-semibold text-foreground">Google Calendar</p>
        </div>
        <div className="p-5">
          <GoogleCalendarButton
            isConnected={isConnected}
            status={params.google}
          />
        </div>
      </div>

      {isAdmin && (
        <div className="panel overflow-hidden">
          <div className="flex items-center gap-2 border-b border-border bg-surface-alt/80 px-5 py-3.5">
            <Users className="h-4 w-4 text-foreground-muted" />
            <p className="text-sm font-semibold text-foreground">Gestión de Usuarios</p>
          </div>
          <div className="p-5">
            <Button asChild>
              <Link href="/configuracion/usuarios">
                <Users className="mr-1.5 h-4 w-4" />
                Administrar Usuarios
              </Link>
            </Button>
          </div>
        </div>
      )}

      {isAdmin && (
        <div className="panel overflow-hidden">
          <div className="flex items-center gap-2 border-b border-border bg-surface-alt/80 px-5 py-3.5">
            <ShieldCheck className="h-4 w-4 text-foreground-muted" />
            <p className="text-sm font-semibold text-foreground">Auditoría</p>
          </div>
          <div className="p-5">
            <Button asChild variant="outline">
              <Link href="/configuracion/auditoria">
                <ShieldCheck className="mr-1.5 h-4 w-4" />
                Ver bitácora
              </Link>
            </Button>
          </div>
        </div>
      )}

      {isAdmin && (
        <div className="panel overflow-hidden">
          <div className="flex items-center gap-2 border-b border-border bg-surface-alt/80 px-5 py-3.5">
            <Building2 className="h-4 w-4 text-foreground-muted" />
            <p className="text-sm font-semibold text-foreground">Datos de la Clínica</p>
          </div>
          <div className="p-5">
            <OrganizacionForm
              initialData={organization ? {
                id: organization.id,
                name: organization.name,
                ruc: organization.ruc || '',
                address: organization.address || '',
                phone: organization.phone || '',
              } : null}
            />
          </div>
        </div>
      )}
    </div>
  )
}
