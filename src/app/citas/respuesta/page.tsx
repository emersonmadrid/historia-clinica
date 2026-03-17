import { CheckCircle, XCircle, AlertCircle } from 'lucide-react'

export default async function RsvpResponsePage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; name?: string; error?: string; status?: string }>
}) {
  const { action, name, error, status } = await searchParams

  if (error === 'invalid' || error === 'notfound') {
    return (
      <Page>
        <AlertCircle className="mx-auto h-16 w-16 text-yellow-500" />
        <h1 className="mt-4 text-2xl font-bold text-foreground">Enlace inválido</h1>
        <p className="mt-2 text-foreground-muted">Este enlace no es válido o ya expiró.</p>
        <p className="mt-1 text-sm text-foreground-subtle">Comunícate con el consultorio si necesitas ayuda.</p>
      </Page>
    )
  }

  if (status === 'cancelled') {
    return (
      <Page>
        <XCircle className="mx-auto h-16 w-16 text-red-400" />
        <h1 className="mt-4 text-2xl font-bold text-foreground">Cita ya cancelada</h1>
        <p className="mt-2 text-foreground-muted">Esta cita ya fue cancelada anteriormente.</p>
      </Page>
    )
  }

  if (action === 'confirm') {
    return (
      <Page>
        <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
        <h1 className="mt-4 text-2xl font-bold text-foreground">¡Asistencia confirmada!</h1>
        <p className="mt-2 text-foreground-muted">
          {name ? `Gracias, ${name}.` : 'Gracias.'} Tu asistencia ha sido registrada.
        </p>
        <p className="mt-1 text-sm text-foreground-subtle">
          El consultorio ha sido notificado. Te esperamos el día de tu cita.
        </p>
      </Page>
    )
  }

  if (action === 'cancel') {
    return (
      <Page>
        <XCircle className="mx-auto h-16 w-16 text-red-500" />
        <h1 className="mt-4 text-2xl font-bold text-foreground">Cita cancelada</h1>
        <p className="mt-2 text-foreground-muted">
          {name ? `${name}, tu` : 'Tu'} cita ha sido cancelada correctamente.
        </p>
        <p className="mt-1 text-sm text-foreground-subtle">
          El consultorio ha sido notificado. Puedes comunicarte con nosotros para reprogramar.
        </p>
      </Page>
    )
  }

  return null
}

function Page({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="bg-surface rounded-2xl shadow-sm border border-border p-10 max-w-md w-full text-center">
        {children}
        <div className="mt-8 pt-6 border-t border-border-subtle">
          <p className="text-xs text-foreground-subtle">Feliz Horizonte &bull; felizhorizonte.pe</p>
        </div>
      </div>
    </div>
  )
}
