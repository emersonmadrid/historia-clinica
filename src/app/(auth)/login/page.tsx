'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Stethoscope, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const loginSchema = z.object({
  email: z.string().min(1, 'El email es requerido').email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showForgot, setShowForgot] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      })
      if (result?.error) {
        setError('Credenciales inválidas. Por favor, intente nuevamente.')
      } else {
        router.push('/')
        router.refresh()
      }
    } catch {
      setError('Ocurrió un error inesperado. Por favor, intente nuevamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-teal-900">

      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-5/12 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 to-transparent pointer-events-none" />
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-400/15">
            <Stethoscope className="h-5 w-5 text-teal-300" />
          </div>
          <span className="text-lg font-bold text-white tracking-tight">Historia Clínica</span>
        </div>
        <div>
          <p className="text-3xl font-bold text-white leading-snug">
            Sistema de gestión<br />clínica integral
          </p>
          <p className="mt-4 text-sm text-teal-200/60 leading-relaxed">
            Registro de pacientes, consultas, derivaciones<br />
            y seguimiento de tratamientos en un solo lugar.
          </p>
        </div>
        <p className="text-xs text-white/20">© {new Date().getFullYear()} Historia Clínica</p>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 items-center justify-center px-4 py-12 bg-[var(--background)]">
        <div className="w-full max-w-sm">

          {/* Logo (mobile only) */}
          <div className="mb-8 flex flex-col items-center text-center lg:hidden">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-800">
              <Stethoscope className="h-7 w-7 text-teal-300" />
            </div>
            <h1 className="text-2xl font-bold text-[var(--foreground)]">Historia Clínica</h1>
            <p className="mt-1 text-sm text-[var(--foreground-muted)]">Sistema de Gestión de Salud</p>
          </div>

          {/* Card */}
          <div className="rounded-[var(--radius)] border border-[var(--border)] bg-white p-8 shadow-[var(--shadow-elevated)]">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-[var(--foreground)]">Iniciar sesión</h2>
              <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                Ingresa tus credenciales de acceso
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--danger)]/20 bg-[var(--danger)]/5 px-4 py-3 text-sm text-[var(--danger)]">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="doctor@clinica.com"
                  autoComplete="email"
                  {...register('email')}
                  className={errors.email ? 'border-[var(--danger)] focus-visible:ring-[var(--danger)]/20' : ''}
                />
                {errors.email && (
                  <p className="text-xs text-[var(--danger)]">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Contraseña</Label>
                  <button
                    type="button"
                    onClick={() => setShowForgot(true)}
                    className="text-xs text-[var(--primary)] hover:text-[var(--primary-hover)] hover:underline"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    {...register('password')}
                    className={`pr-10 ${errors.password ? 'border-[var(--danger)] focus-visible:ring-[var(--danger)]/20' : ''}`}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--foreground-subtle)] hover:text-[var(--foreground-muted)]"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-[var(--danger)]">{errors.password.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full mt-2" disabled={isLoading}>
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Ingresando...
                  </span>
                ) : (
                  'Ingresar al Sistema'
                )}
              </Button>
            </form>
          </div>

          <p className="mt-5 text-center text-xs text-[var(--foreground-subtle)]">
            Acceso exclusivo para profesionales de la salud
          </p>
        </div>
      </div>

      {/* Modal olvidé contraseña */}
      {showForgot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-sm rounded-[var(--radius)] border border-[var(--border)] bg-white p-6 shadow-[var(--shadow-elevated)]">
            <h3 className="text-base font-semibold text-[var(--foreground)] mb-2">Recuperar contraseña</h3>
            <p className="text-sm text-[var(--foreground-muted)] mb-4">
              Contacta al administrador del sistema para restablecer tu contraseña.
            </p>
            <Button className="w-full" onClick={() => setShowForgot(false)}>
              Entendido
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
