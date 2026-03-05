import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { GoogleCalendarButton } from './GoogleCalendarButton'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Settings } from 'lucide-react'

export default async function ConfiguracionPage({
  searchParams,
}: {
  searchParams: Promise<{ google?: string }>
}) {
  const session = await auth()
  const params = await searchParams

  const user = await prisma.user.findUnique({
    where: { id: session!.user.id },
    select: { googleAccessToken: true, googleRefreshToken: true },
  })

  const isConnected = !!(user?.googleAccessToken && user?.googleRefreshToken)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Configuración</h2>
        <p className="text-sm text-slate-500">Ajustes de tu cuenta</p>
      </div>

      <Card className="max-w-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-slate-500" />
            <CardTitle className="text-base">Google Calendar</CardTitle>
          </div>
          <CardDescription>
            Sincroniza tus citas automáticamente con Google Calendar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GoogleCalendarButton
            isConnected={isConnected}
            status={params.google}
          />
        </CardContent>
      </Card>
    </div>
  )
}
