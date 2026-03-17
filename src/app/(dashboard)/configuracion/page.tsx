import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { GoogleCalendarButton } from './GoogleCalendarButton'
import { OrganizacionForm } from './OrganizacionForm'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Settings, Users, Building2 } from 'lucide-react'
import Link from 'next/link'

export default async function ConfiguracionPage({
  searchParams,
}: {
  searchParams: Promise<{ google?: string }>
}) {
  const session = await auth()
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
    organization = await prisma.organization.findFirst()
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-foreground">Configuración</h2>
      </div>

      <Card className="rounded-none">
        <CardHeader className="border-b border-border bg-surface-alt pb-4">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-foreground-muted" />
            <CardTitle className="text-base">Google Calendar</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <GoogleCalendarButton
            isConnected={isConnected}
            status={params.google}
          />
        </CardContent>
      </Card>

      {isAdmin && (
        <Card className="rounded-none">
          <CardHeader className="border-b border-border bg-surface-alt pb-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-foreground-muted" />
              <CardTitle className="text-base">Gestión de Usuarios</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/configuracion/usuarios">
                <Users className="mr-1.5 h-4 w-4" />
                Administrar Usuarios
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {isAdmin && (
        <Card className="rounded-none">
          <CardHeader className="border-b border-border bg-surface-alt pb-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-foreground-muted" />
              <CardTitle className="text-base">Datos de la Clínica</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <OrganizacionForm
              initialData={organization ? {
                id: organization.id,
                name: organization.name,
                ruc: organization.ruc || '',
                address: organization.address || '',
                phone: organization.phone || '',
              } : null}
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
