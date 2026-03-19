'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Search, ChevronDown } from 'lucide-react'
import { toast } from '@/hooks/useToast'
import { useDebounce } from '@/hooks/useDebounce'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FormField } from '@/components/shared/FormField'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import type { Prisma } from '@prisma/client'

const schema = z.object({
  patientId: z.string().min(1, 'Paciente requerido'),
  doctorId: z.string().min(1, 'Doctor requerido'),
  dateTime: z.string().min(1, 'Fecha y hora requerida'),
  duration: z.number().int().min(15).max(120),
  reason: z.string().min(1, 'Motivo requerido'),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

type Patient = Prisma.PatientGetPayload<{
  select: { id: true; firstName: true; lastName: true; documentNumber: true }
}>

type Doctor = Prisma.UserGetPayload<{
  select: { id: true; name: true; speciality: true }
}>

export default function NuevaCitaPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedPatientId = searchParams.get('patientId')
  const preselectedDoctorId = searchParams.get('doctorId')

  const [isLoading, setIsLoading] = useState(false)
  const [patientSearch, setPatientSearch] = useState('')
  const [patients, setPatients] = useState<Patient[]>([])
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loadingDoctors, setLoadingDoctors] = useState(true)
  const [selectedDoctorId, setSelectedDoctorId] = useState('')
  const [doctorSearch, setDoctorSearch] = useState('')
  const [showPatientDropdown, setShowPatientDropdown] = useState(false)
  const [showDoctorDropdown, setShowDoctorDropdown] = useState(false)

  const debouncedSearch = useDebounce(patientSearch, 300)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      duration: 30,
    },
  })

  const selectedDoctor = doctors.find((doctor) => doctor.id === selectedDoctorId) ?? null
  const filteredDoctors = doctors.filter((doctor) => {
    const q = doctorSearch.trim().toLowerCase()
    if (!q) return true
    return (
      doctor.name.toLowerCase().includes(q) ||
      (doctor.speciality ?? '').toLowerCase().includes(q)
    )
  })

  // Load doctors — auto-selects if doctorId is in URL
  useEffect(() => {
    fetch('/api/users')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setDoctors(data)
          if (preselectedDoctorId && data.find((d: Doctor) => d.id === preselectedDoctorId)) {
            setSelectedDoctorId(preselectedDoctorId)
            setValue('doctorId', preselectedDoctorId)
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoadingDoctors(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Search patients
  useEffect(() => {
    if (debouncedSearch.length < 2) {
      setPatients([])
      return
    }
    fetch(`/api/pacientes?search=${encodeURIComponent(debouncedSearch)}&limit=10`)
      .then(r => r.json())
      .then(d => setPatients(d.patients || []))
      .catch(() => {})
  }, [debouncedSearch])

  // Preselect patient
  useEffect(() => {
    if (preselectedPatientId) {
      fetch(`/api/pacientes/${preselectedPatientId}`)
        .then(r => r.json())
        .then(p => {
          if (p.id) {
            setSelectedPatient(p)
            setValue('patientId', p.id)
          }
        })
        .catch(() => {})
    }
  }, [preselectedPatientId, setValue])

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/citas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const err = await res.json()
        toast({ variant: 'error', title: 'Error al crear la cita', description: err.error })
        return
      }

      toast({ variant: 'success', title: 'Cita agendada correctamente' })
      router.push('/citas')
      router.refresh()
    } catch {
      toast({ variant: 'error', title: 'Error inesperado', description: 'Por favor, intente nuevamente.' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild className="h-8 w-8 rounded-sm">
          <Link href="/citas" aria-label="Volver a citas">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h2 className="text-xl font-bold text-foreground">Nueva cita</h2>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="panel">
          <div className="space-y-4 px-5 py-5">
              <FormField label="Paciente" required error={errors.patientId?.message}>
                {selectedPatient ? (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 border border-border bg-background px-3 py-2.5 text-sm">
                      <span className="font-medium">{selectedPatient.firstName} {selectedPatient.lastName}</span>
                      <span className="ml-2 text-foreground-muted">{selectedPatient.documentNumber}</span>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedPatient(null)
                        setValue('patientId', '')
                        setPatientSearch('')
                      }}
                    >
                      Cambiar
                    </Button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-subtle" />
                    <Input
                      placeholder="Buscar paciente por nombre o documento..."
                      value={patientSearch}
                      onChange={e => {
                        setPatientSearch(e.target.value)
                        setShowPatientDropdown(true)
                      }}
                      onFocus={() => setShowPatientDropdown(true)}
                      className="pl-10"
                    />
                    {showPatientDropdown && patients.length > 0 && (
                      <div className="absolute top-full left-0 right-0 z-50 mt-1 border border-border bg-surface shadow-md">
                        {patients.map(p => (
                          <button
                            key={p.id}
                            type="button"
                            className="w-full px-4 py-2.5 text-left text-sm hover:bg-background"
                            onClick={() => {
                              setSelectedPatient(p)
                              setValue('patientId', p.id)
                              setPatientSearch('')
                              setShowPatientDropdown(false)
                            }}
                          >
                            <span className="font-medium">{p.firstName} {p.lastName}</span>
                            <span className="ml-2 text-foreground-subtle text-xs">{p.documentNumber}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </FormField>

              <FormField label="Doctor" required error={errors.doctorId?.message}>
                {loadingDoctors ? (
                  <div className="flex h-10 w-full animate-pulse items-center border border-border bg-surface px-3">
                    <div className="h-3 w-40 rounded bg-border" />
                  </div>
                ) : doctors.length > 0 ? (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowDoctorDropdown((open) => !open)}
                      className="flex h-10 w-full items-center justify-between border border-border bg-surface px-3 py-2 text-left text-sm text-foreground hover:bg-background"
                    >
                      <span className={cn('truncate', !selectedDoctor && 'text-foreground-subtle')}>
                        {selectedDoctor ? `${selectedDoctor.name}${selectedDoctor.speciality ? ` — ${selectedDoctor.speciality}` : ''}` : 'Seleccionar doctor...'}
                      </span>
                      <ChevronDown className="h-4 w-4 text-foreground-subtle" />
                    </button>

                    {showDoctorDropdown && (
                      <div className="absolute left-0 right-0 top-full z-50 mt-1 border border-border bg-surface shadow-md">
                        <div className="border-b border-border px-3 py-2">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-subtle" />
                          <Input
                            placeholder="Buscar doctor o especialidad..."
                            value={doctorSearch}
                            onChange={(e) => setDoctorSearch(e.target.value)}
                            className="h-9 pl-10"
                            autoFocus
                          />
                        </div>
                        </div>
                        <div className="max-h-64 overflow-y-auto py-1">
                          {filteredDoctors.length === 0 ? (
                            <p className="px-3 py-2 text-sm text-foreground-muted">Sin resultados</p>
                          ) : (
                            filteredDoctors.map((doctor) => {
                              const selected = selectedDoctorId === doctor.id
                              return (
                                <button
                                  key={doctor.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedDoctorId(doctor.id)
                                    setValue('doctorId', doctor.id, { shouldValidate: true })
                                    setDoctorSearch('')
                                    setShowDoctorDropdown(false)
                                  }}
                                  className={cn(
                                    'flex w-full items-start justify-between px-3 py-2.5 text-left text-sm hover:bg-background',
                                    selected && 'bg-primary-subtle'
                                  )}
                                >
                                  <div className="min-w-0">
                                    <p className="font-medium text-foreground">{doctor.name}</p>
                                    <p className="text-xs text-foreground-muted">{doctor.speciality || 'Sin especialidad'}</p>
                                  </div>
                                  <span
                                    className={cn(
                                      'mt-1 h-2.5 w-2.5 shrink-0 rounded-full border',
                                      selected ? 'border-primary bg-primary' : 'border-border-interactive bg-surface'
                                    )}
                                    aria-hidden
                                  />
                                </button>
                              )
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="flex h-10 items-center border border-border bg-surface-alt px-3 text-sm text-foreground-muted">
                    No se encontraron doctores disponibles
                  </p>
                )}
              </FormField>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Fecha y hora" required error={errors.dateTime?.message}>
                  <Input type="datetime-local" {...register('dateTime')} />
                </FormField>

                <FormField label="Duración" error={errors.duration?.message}>
                  <Select defaultValue="30" onValueChange={v => setValue('duration', parseInt(v), { shouldValidate: true })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutos</SelectItem>
                      <SelectItem value="30">30 minutos</SelectItem>
                      <SelectItem value="45">45 minutos</SelectItem>
                      <SelectItem value="60">1 hora</SelectItem>
                      <SelectItem value="90">1 hora 30 min</SelectItem>
                      <SelectItem value="120">2 horas</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>
              </div>

              <FormField label="Motivo de consulta" required error={errors.reason?.message}>
                <Input
                  placeholder="Ej: control, reevaluación, dolor abdominal..."
                  {...register('reason')}
                />
              </FormField>

              <details className="border border-border bg-surface-alt">
                <summary className="cursor-pointer px-3 py-2 text-sm font-medium text-foreground marker:hidden">
                  Notas opcionales
                </summary>
                <div className="border-t border-border px-3 py-3">
                  <Textarea
                    placeholder="Observaciones o preparación para la cita..."
                    rows={3}
                    {...register('notes')}
                  />
                </div>
              </details>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-border pt-2">
          <Button variant="outline" type="button" asChild>
            <Link href="/citas">Cancelar</Link>
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <LoadingSpinner label="Guardando Cita..." />
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Guardar Cita
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
